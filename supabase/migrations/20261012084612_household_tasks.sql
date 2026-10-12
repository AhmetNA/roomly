-- Shared household tasks. Composite foreign keys prevent cross-household assignments/comments.
create unique index household_members_id_household_key on public.household_members (id, household_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 4000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  created_by uuid not null,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id),
  foreign key (created_by, household_id) references public.household_members(id, household_id),
  foreign key (completed_by, household_id) references public.household_members(id, household_id),
  check ((status = 'done') = (completed_at is not null)),
  check ((status = 'done') = (completed_by is not null))
);
create index tasks_household_due_idx on public.tasks(household_id, due_date);
create index tasks_created_by_idx on public.tasks(created_by, household_id);
create index tasks_completed_by_idx on public.tasks(completed_by, household_id);

create table public.task_assignees (
  task_id uuid not null,
  household_id uuid not null,
  member_id uuid not null,
  primary key (task_id, member_id),
  foreign key (task_id, household_id) references public.tasks(id, household_id) on delete cascade,
  foreign key (member_id, household_id) references public.household_members(id, household_id) on delete cascade
);
create index task_assignees_household_idx on public.task_assignees(household_id);
create index task_assignees_member_idx on public.task_assignees(member_id, household_id);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  household_id uuid not null,
  author_id uuid not null,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (task_id, household_id) references public.tasks(id, household_id) on delete cascade,
  foreign key (author_id, household_id) references public.household_members(id, household_id)
);
create index task_comments_household_idx on public.task_comments(household_id);
create index task_comments_task_idx on public.task_comments(task_id, created_at);
create index task_comments_author_idx on public.task_comments(author_id, household_id);

alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_comments enable row level security;

grant select, insert, update, delete on public.tasks, public.task_assignees, public.task_comments to authenticated;
revoke all on public.tasks, public.task_assignees, public.task_comments from anon;

create policy tasks_read on public.tasks for select to authenticated
  using (household_id = (select public.get_my_household_id()));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (household_id = (select public.get_my_household_id()) and created_by =
    (select id from public.household_members where user_id = (select auth.uid())));
create policy tasks_update on public.tasks for update to authenticated
  using (household_id = (select public.get_my_household_id()))
  with check (household_id = (select public.get_my_household_id()));
create policy tasks_delete on public.tasks for delete to authenticated
  using (household_id = (select public.get_my_household_id()));
create policy task_assignees_household on public.task_assignees for all to authenticated
  using (household_id = (select public.get_my_household_id()))
  with check (household_id = (select public.get_my_household_id()));
create policy task_comments_read on public.task_comments for select to authenticated
  using (household_id = (select public.get_my_household_id()));
create policy task_comments_insert on public.task_comments for insert to authenticated
  with check (household_id = (select public.get_my_household_id()) and author_id =
    (select id from public.household_members where user_id = (select auth.uid())));
create policy task_comments_update on public.task_comments for update to authenticated
  using (household_id = (select public.get_my_household_id()) and author_id =
    (select id from public.household_members where user_id = (select auth.uid())))
  with check (household_id = (select public.get_my_household_id()) and author_id =
    (select id from public.household_members where user_id = (select auth.uid())));
create policy task_comments_delete on public.task_comments for delete to authenticated
  using (household_id = (select public.get_my_household_id()) and author_id =
    (select id from public.household_members where user_id = (select auth.uid())));

create function public.guard_task_write() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.id, new.household_id, new.created_by, new.created_at)
    is distinct from (old.id, old.household_id, old.created_by, old.created_at) then
    raise exception 'task_attribution_immutable';
  end if;
  new.title := btrim(new.title);
  new.updated_at := now();
  if new.status = 'done' then
    if tg_op = 'INSERT' then
      new.completed_at := now();
      new.completed_by := (select id from public.household_members where user_id = auth.uid());
    elsif old.status <> 'done' then
      new.completed_at := now();
      new.completed_by := (select id from public.household_members where user_id = auth.uid());
    else
      new.completed_at := old.completed_at;
      new.completed_by := old.completed_by;
    end if;
  else
    new.completed_at := null;
    new.completed_by := null;
  end if;
  return new;
end;
$$;
create trigger guard_task_write before insert or update on public.tasks
  for each row execute function public.guard_task_write();

create function public.guard_task_comment_write() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.id, new.task_id, new.household_id, new.author_id, new.created_at)
    is distinct from (old.id, old.task_id, old.household_id, old.author_id, old.created_at) then
    raise exception 'task_comment_attribution_immutable';
  end if;
  new.body := btrim(new.body);
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_task_comment_write before insert or update on public.task_comments
  for each row execute function public.guard_task_comment_write();
revoke all on function public.guard_task_write(), public.guard_task_comment_write() from public, anon, authenticated;

-- Invoker rights keep RLS active. Save the task and its assignees in one transaction.
create function public.save_task(
  p_title text,
  p_description text default '',
  p_status text default 'todo',
  p_priority text default 'normal',
  p_due_date date default null,
  p_assignee_ids uuid[] default '{}',
  p_task_id uuid default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  home_id uuid := public.get_my_household_id();
  actor_id uuid := (select id from public.household_members where user_id = auth.uid());
  saved_id uuid;
begin
  if home_id is null or actor_id is null then raise exception 'not_in_household'; end if;
  if p_task_id is null then
    insert into public.tasks (household_id, title, description, status, priority, due_date, created_by)
    values (home_id, p_title, p_description, p_status, p_priority, p_due_date, actor_id)
    returning id into saved_id;
  else
    update public.tasks set title = p_title, description = p_description, status = p_status,
      priority = p_priority, due_date = p_due_date where id = p_task_id and household_id = home_id
      returning id into saved_id;
    if saved_id is null then raise exception 'task_not_found'; end if;
  end if;
  delete from public.task_assignees where task_id = saved_id;
  insert into public.task_assignees (task_id, household_id, member_id)
    select saved_id, home_id, member_id from (select distinct unnest(p_assignee_ids) as member_id) as assigned;
  return saved_id;
end;
$$;
revoke all on function public.save_task(text, text, text, text, date, uuid[], uuid) from public, anon;
grant execute on function public.save_task(text, text, text, text, date, uuid[], uuid) to authenticated;

alter publication supabase_realtime add table public.tasks, public.task_assignees, public.task_comments;
