-- Monthly rent reminder day, shared by the whole household. Devices schedule
-- local notifications from it, clamping to the last day of shorter months.
alter table public.households
  add column rent_day smallint check (rent_day between 1 and 31);

-- Changing the rent day on one phone must reschedule reminders on the others.
alter publication supabase_realtime add table public.households;

-- Nudge cooldown bookkeeping. Only the notify Edge Function (service role)
-- touches it, so members cannot reset the cooldown and spam each other.
create table public.task_nudges (
  task_id uuid primary key references public.tasks(id) on delete cascade,
  nudged_at timestamptz not null default now()
);
alter table public.task_nudges enable row level security;
revoke all on public.task_nudges from anon, authenticated;
