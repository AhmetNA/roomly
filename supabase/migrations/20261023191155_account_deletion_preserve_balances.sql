-- Keep financial member IDs while permanently removing the account binding.
alter table public.household_members
  add column account_deleted_at timestamptz,
  add column account_owner_id uuid references auth.users(id) on delete set null;
update public.household_members set account_owner_id = user_id where user_id is not null;
create index household_members_account_owner_idx on public.household_members(account_owner_id)
  where account_owner_id is not null;

create table public.account_deletions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);
alter table public.account_deletions enable row level security;
revoke all on public.account_deletions from anon, authenticated;
grant select on public.account_deletions to authenticated;
grant all on public.account_deletions to service_role;
create policy "read own deletion request" on public.account_deletions for select to authenticated
  using (user_id = (select auth.uid()));

create function public.guard_member_account_lifecycle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.account_deleted_at is not null and
     (new.user_id is not null or new.name is distinct from old.name or new.iban is not null
      or new.account_deleted_at is distinct from old.account_deleted_at) then
    raise exception 'member_account_deleted';
  end if;
  if new.user_id is not null then
    if not exists(select 1 from auth.users where id = new.user_id) or
       exists(select 1 from public.account_deletions where user_id = new.user_id) then
      raise exception 'account_unavailable';
    end if;
    new.account_owner_id := new.user_id;
  end if;
  return new;
end $$;
revoke all on function public.guard_member_account_lifecycle() from public, anon, authenticated;
create trigger guard_member_account_lifecycle before insert or update on public.household_members
  for each row execute function public.guard_member_account_lifecycle();

create or replace function public.get_my_household_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select m.household_id from public.household_members m
  where m.user_id = auth.uid() and m.account_deleted_at is null
    and exists(select 1 from auth.users u where u.id = auth.uid())
    and not exists(select 1 from public.account_deletions d where d.user_id = auth.uid())
$$;

create or replace function public.preview_household_members(code text)
returns table(id uuid, name text)
language plpgsql security definer set search_path = '' as $$
declare hid uuid;
begin
  if auth.uid() is null or not exists(select 1 from auth.users u where u.id=auth.uid()) then
    raise exception 'not_authenticated';
  end if;
  if exists(select 1 from public.account_deletions where user_id=auth.uid()) then
    raise exception 'account_unavailable';
  end if;
  if exists(select 1 from public.household_members where user_id=auth.uid()) then
    raise exception 'already_in_household';
  end if;
  select h.id into hid from public.households h where h.invite_code=upper(trim(code));
  if hid is null then raise exception 'invite_code_not_found'; end if;
  return query select m.id,m.name from public.household_members m
    where m.household_id=hid and m.user_id is null and m.account_deleted_at is null
    order by m.created_at;
end $$;

-- A service-only operation. The Edge Function derives this ID from getUser(token),
-- never from request JSON. No user data is deleted by applying this migration.
create function public.prepare_account_deletion(target_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare member_ids uuid[];
begin
  perform pg_advisory_xact_lock(hashtextextended(target_user_id::text,0));
  if not exists(select 1 from auth.users where id=target_user_id) then return; end if;
  insert into public.account_deletions(user_id) values(target_user_id) on conflict do nothing;
  -- Lock households first, matching membership RPC lock order.
  perform 1 from public.households where id in (
    select household_id from public.household_members where account_owner_id=target_user_id
      or user_id=target_user_id
  ) order by id for update;
  perform 1 from public.household_members where account_owner_id=target_user_id
    or user_id=target_user_id order by id for update;
  select coalesce(array_agg(id),'{}'::uuid[]) into member_ids
    from public.household_members where account_owner_id=target_user_id or user_id=target_user_id;

  delete from public.push_tokens where user_id=target_user_id;
  delete from public.task_comments where author_id=any(member_ids);
  delete from public.task_assignees where member_id=any(member_ids);
  -- Personal lists must not turn into shared lists through FK cleanup.
  delete from public.shopping_items where list_owner_user_id=target_user_id
    or added_by=any(member_ids);
  -- Authorship is known for tasks; remove their free text while preserving work status.
  update public.tasks set title='Silinen hesaba ait görev',description=''
    where created_by=any(member_ids);
  update public.expenses set receipt_photo_url=null where receipt_photo_url in (
    select name from storage.objects where bucket_id='receipts' and
      (owner_id=target_user_id::text or owner=target_user_id
       or split_part(name,'/',2)=target_user_id::text)
  ) or split_part(receipt_photo_url,'/',2)=target_user_id::text;
  update public.household_members set user_id=null,name='Silinen hesap',iban=null,
    account_deleted_at=coalesce(account_deleted_at,now())
    where id=any(member_ids) and account_deleted_at is null;
end $$;
revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

create function public.account_deletion_receipts(target_user_id uuid)
returns table(name text) language sql stable security definer set search_path = '' as $$
  select o.name from storage.objects o where o.bucket_id='receipts'
    and exists(select 1 from public.account_deletions where user_id=target_user_id)
    and (o.owner_id=target_user_id::text or o.owner=target_user_id
      or split_part(o.name,'/',2)=target_user_id::text)
  order by o.name limit 100
$$;
revoke all on function public.account_deletion_receipts(uuid) from public, anon, authenticated;
grant execute on function public.account_deletion_receipts(uuid) to service_role;

create function public.finish_account_deletion(target_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(target_user_id::text,0));
  if not exists(select 1 from auth.users where id=target_user_id) then return; end if;
  if not exists(select 1 from public.account_deletions where user_id=target_user_id) then
    raise exception 'deletion_not_requested';
  end if;
  if exists(select 1 from public.account_deletion_receipts(target_user_id)) then
    raise exception 'receipt_cleanup_pending';
  end if;
  if exists(select 1 from public.household_members where user_id=target_user_id) then
    raise exception 'member_cleanup_pending';
  end if;
  -- Revoke refresh sessions and identities through Auth's FK cascades. Existing
  -- access JWTs are denied household access by the live-user check above.
  delete from auth.users where id=target_user_id;
end $$;
revoke all on function public.finish_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.finish_account_deletion(uuid) to service_role;

-- A deletion in progress must not acquire a fresh notification registration.
drop policy "insert own push token" on public.push_tokens;
create policy "insert own push token" on public.push_tokens for insert to authenticated
with check (user_id=(select auth.uid())
  and exists(select 1 from auth.users where id=auth.uid())
  and not exists(select 1 from public.account_deletions where user_id=auth.uid()));
drop policy "update own push token" on public.push_tokens;
create policy "update own push token" on public.push_tokens for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid())
  and not exists(select 1 from public.account_deletions where user_id=auth.uid()));

-- Normal leave retains account_owner_id through the trigger, so later deletion
-- can also redact members from households the user has left after this migration.
-- Direct DELETE would cascade through financial rows; leave must use the RPC.
revoke delete on public.household_members from authenticated;
