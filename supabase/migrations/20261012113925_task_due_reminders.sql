-- Hourly job that asks the task-reminders Edge Function to notify assignees the
-- day before a task is due (push + email) and six hours before the deadline (push).
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- One row per reminder actually claimed, so each fires once. Including due_date
-- re-arms the reminders when a task is rescheduled. Service role only.
create table public.task_reminders (
  task_id uuid not null references public.tasks(id) on delete cascade,
  kind text not null check (kind in ('day_before', 'six_hours')),
  due_date date not null,
  sent_at timestamptz not null default now(),
  primary key (task_id, kind, due_date)
);
alter table public.task_reminders enable row level security;
revoke all on public.task_reminders from anon, authenticated;

-- Shared secret between the cron job and the function, generated here so it is
-- never copied by hand. The function checks it through this service-role-only RPC.
select vault.create_secret(gen_random_uuid()::text, 'task_reminders_cron');

create function public.verify_task_reminders_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'task_reminders_cron' and decrypted_secret = p_secret
  );
$$;
revoke all on function public.verify_task_reminders_secret(text) from public, anon, authenticated;
grant execute on function public.verify_task_reminders_secret(text) to service_role;

select cron.schedule(
  'task-due-reminders',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://vigmiiiwyliqslbwuzet.supabase.co/functions/v1/task-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'task_reminders_cron')
    ),
    body := '{}'::jsonb
  );
  $$
);
