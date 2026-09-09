-- Debt settlement moves from a per-expense flag to a standalone ledger.
--
-- Until now "settling" flipped expense_debts.is_settled for every row between
-- two members. That only works when the debt you pay matches a debt the ledger
-- recorded. Once debts are simplified across the whole household (A owes B, B
-- owes C  =>  A pays C directly), the transfer you actually make has no matching
-- expense_debts row, so it can't be represented as a flag on one.
--
-- A settlements table records each payment as an independent fact. The net
-- position of every member is then derived: sum of what expenses made them owe
-- (unsettled expense_debts) minus what they've since paid or received
-- (settlements). Editing or deleting an old expense stays safe — it only
-- changes the obligation side; recorded payments remain true.
--
-- Legacy is_settled = true rows are left untouched: they're still excluded from
-- the net (as before), and no settlement row is created for them, so there's no
-- double counting. New settlements only ever go through record_settlement.

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  from_member_id uuid not null references public.household_members(id) on delete cascade,
  to_member_id uuid not null references public.household_members(id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  constraint settlements_distinct_parties check (from_member_id <> to_member_id)
);

create index settlements_household_idx on public.settlements (household_id);

alter table public.settlements enable row level security;

-- Read-only for household members; all writes go through the RPC below.
create policy settlements_select_own_household on public.settlements
  for select using (household_id = (select get_my_household_id()));

create function public.record_settlement(
  p_from_member_id uuid,
  p_to_member_id uuid,
  p_amount numeric
) returns public.settlements language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid := (select get_my_household_id());
  result settlements;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if v_household_id is null then raise exception 'not_in_household'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  if p_from_member_id is not distinct from p_to_member_id then raise exception 'invalid_member'; end if;
  if not exists(select 1 from household_members where id = p_from_member_id and household_id = v_household_id)
     or not exists(select 1 from household_members where id = p_to_member_id and household_id = v_household_id) then
    raise exception 'invalid_member';
  end if;

  insert into settlements (household_id, from_member_id, to_member_id, amount)
  values (v_household_id, p_from_member_id, p_to_member_id, p_amount)
  returning * into result;

  return result;
end $$;

revoke all on function public.record_settlement(uuid, uuid, numeric) from public, anon;
grant execute on function public.record_settlement(uuid, uuid, numeric) to authenticated;

-- settle_debt is superseded by record_settlement and the simplified graph.
drop function if exists public.settle_debt(uuid, uuid);
