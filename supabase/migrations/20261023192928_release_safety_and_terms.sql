create table public.terms_acceptances (
 user_id uuid primary key references auth.users(id) on delete cascade,
 version text not null check (version='2026-10-23'),
 accepted_at timestamptz not null default now()
);
alter table public.terms_acceptances enable row level security;
revoke all on public.terms_acceptances from anon,authenticated;
grant select on public.terms_acceptances to authenticated;
grant all on public.terms_acceptances to service_role;
create policy "read own terms acceptance" on public.terms_acceptances for select to authenticated
using (user_id=(select auth.uid()));
create function public.accept_current_terms() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users u where u.id=auth.uid()) then raise exception 'not_authenticated'; end if;
 insert into public.terms_acceptances(user_id,version) values(auth.uid(),'2026-10-23')
 on conflict(user_id) do update set version=excluded.version,accepted_at=now();
end $$;
revoke all on function public.accept_current_terms() from public,anon;
grant execute on function public.accept_current_terms() to authenticated;

create table public.content_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_user_id uuid not null references auth.users(id) on delete cascade,
 household_id uuid not null references public.households(id) on delete cascade,
 target_kind text not null check(target_kind in ('member','expense','shopping_item','task','comment','category','household')),
 target_id uuid not null,
 reason text not null check(length(btrim(reason)) between 3 and 2000),
 status text not null default 'open' check(status in ('open','reviewing','resolved')),
 created_at timestamptz not null default now(),
 unique(reporter_user_id,target_kind,target_id)
);
create index content_reports_open_idx on public.content_reports(created_at) where status='open';
alter table public.content_reports enable row level security;
revoke all on public.content_reports from anon,authenticated;
grant select on public.content_reports to authenticated;
grant all on public.content_reports to service_role;
create policy "read own reports" on public.content_reports for select to authenticated
using (reporter_user_id=(select auth.uid()));
create function public.report_content(p_kind text,p_target_id uuid,p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare hid uuid:=public.get_my_household_id(); target_home uuid; result uuid; target_table text;
begin
 if hid is null then raise exception 'not_in_household'; end if;
 if not exists(select 1 from public.terms_acceptances where user_id=auth.uid() and version='2026-10-23') then raise exception 'terms_required'; end if;
 if p_reason is null or length(btrim(p_reason)) not between 3 and 2000 then raise exception 'invalid_reason'; end if;
 target_table := case p_kind when 'member' then 'household_members' when 'expense' then 'expenses'
  when 'shopping_item' then 'shopping_items' when 'task' then 'tasks' when 'comment' then 'task_comments'
  when 'category' then 'categories' when 'household' then 'households' else null end;
 if target_table is null then raise exception 'invalid_target'; end if;
 if p_kind='household' then select h.id into target_home from public.households h where h.id=p_target_id;
 else execute format('select household_id from public.%I where id=$1',target_table) into target_home using p_target_id;
 end if;
 if target_home is distinct from hid then raise exception 'target_not_found'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
 if (select count(*) from public.content_reports where reporter_user_id=auth.uid() and created_at>now()-interval '1 hour')>=20 then raise exception 'report_rate_limit'; end if;
 insert into public.content_reports(reporter_user_id,household_id,target_kind,target_id,reason)
 values(auth.uid(),hid,p_kind,p_target_id,btrim(p_reason))
 on conflict(reporter_user_id,target_kind,target_id) do update set reason=excluded.reason,status='open'
 returning id into result;
 return result;
end $$;
revoke all on function public.report_content(text,uuid,text) from public,anon;
grant execute on function public.report_content(text,uuid,text) to authenticated;

create table public.user_blocks (
 blocker_user_id uuid not null references auth.users(id) on delete cascade,
 blocked_user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_user_id,blocked_user_id),
 check(blocker_user_id<>blocked_user_id)
);
create index user_blocks_blocked_idx on public.user_blocks(blocked_user_id);
alter table public.user_blocks enable row level security;
revoke all on public.user_blocks from anon,authenticated;
grant select on public.user_blocks to authenticated;
grant all on public.user_blocks to service_role;
create policy "read own blocks" on public.user_blocks for select to authenticated
using(blocker_user_id=(select auth.uid()));
create function public.set_user_block(p_user_id uuid,p_blocked boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users u where u.id=auth.uid()) then raise exception 'not_authenticated'; end if;
 if not p_blocked then delete from public.user_blocks where blocker_user_id=auth.uid() and blocked_user_id=p_user_id; return; end if;
 if p_user_id=auth.uid() or not exists(select 1 from public.household_members m
   where m.user_id=p_user_id and m.household_id=public.get_my_household_id() and m.account_deleted_at is null) then raise exception 'target_not_found'; end if;
 insert into public.user_blocks(blocker_user_id,blocked_user_id) values(auth.uid(),p_user_id) on conflict do nothing;
end $$;
revoke all on function public.set_user_block(uuid,boolean) from public,anon;
grant execute on function public.set_user_block(uuid,boolean) to authenticated;

create function public.allowed_notification_recipients(actor_user_id uuid,candidate_user_ids uuid[])
returns uuid[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(id),'{}'::uuid[]) from unnest(candidate_user_ids) id
 where not exists(select 1 from public.user_blocks b where b.blocker_user_id=id and b.blocked_user_id=actor_user_id)
$$;
revoke all on function public.allowed_notification_recipients(uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.allowed_notification_recipients(uuid,uuid[]) to service_role;

-- Blocking hides that account's comments at the server, not just in the UI.
drop policy if exists "read household comments" on public.task_comments;
drop policy task_comments_read on public.task_comments;
create policy task_comments_read on public.task_comments for select to authenticated
using(household_id=(select public.get_my_household_id()) and not exists (
 select 1 from public.household_members m join public.user_blocks b on b.blocked_user_id=m.user_id
 where m.id=author_id and b.blocker_user_id=(select auth.uid())
));
