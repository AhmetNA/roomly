-- Rent-day reminders now come from the scheduled task-reminders function so they
-- can include each member's current debts. One row per household per rent date
-- keeps the hourly job from sending twice. Service role only.
create table public.rent_reminders (
  household_id uuid not null references public.households(id) on delete cascade,
  rent_date date not null,
  sent_at timestamptz not null default now(),
  primary key (household_id, rent_date)
);
alter table public.rent_reminders enable row level security;
revoke all on public.rent_reminders from anon, authenticated;
