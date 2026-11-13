-- Payments (settlements) become editable and deletable, so a partial payment
-- recorded by mistake can be corrected. Balances are derived from the ledger,
-- so changing or removing a row moves the debt back automatically; nothing in
-- expense_debts needs touching. Writes still only go through RPCs, and any
-- household member may correct a payment (same rule as expenses).

create function public.update_settlement(
  p_settlement_id uuid,
  p_amount numeric
) returns public.settlements language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid := (select get_my_household_id());
  result settlements;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if v_household_id is null then raise exception 'not_in_household'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;

  update settlements
     set amount = round(p_amount, 2)
   where id = p_settlement_id and household_id = v_household_id
  returning * into result;

  if result.id is null then raise exception 'settlement_not_found'; end if;
  return result;
end $$;

revoke all on function public.update_settlement(uuid, numeric) from public, anon;
grant execute on function public.update_settlement(uuid, numeric) to authenticated;

create function public.delete_settlement(p_settlement_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_household_id uuid := (select get_my_household_id());
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if v_household_id is null then raise exception 'not_in_household'; end if;

  delete from settlements where id = p_settlement_id and household_id = v_household_id;
  if not found then raise exception 'settlement_not_found'; end if;
end $$;

revoke all on function public.delete_settlement(uuid) from public, anon;
grant execute on function public.delete_settlement(uuid) to authenticated;
