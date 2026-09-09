-- Editing an expense has to re-derive everything that was computed when it was
-- created, so this deletes the children and rebuilds them. The debt
-- materialisation at the bottom is copied from create_expense rather than
-- shared with it: creation is the path every expense goes through, and
-- refactoring it to serve editing would put it at risk for no visible gain.
create function public.update_expense_with_details(
  p_expense_id uuid,
  p_category_id uuid,
  p_title text,
  p_total_amount numeric,
  p_split_type text,
  p_splits jsonb,
  p_payments jsonb,
  p_items jsonb default '[]'
) returns public.expenses language plpgsql security definer set search_path = public as $$
declare
  result expenses;
  v_household_id uuid;
  splits_total numeric;
  payments_total numeric;
  total_cents bigint := round(p_total_amount * 100);
  rec_split record;
  rec_payment record;
  share_cents bigint;
  assigned_cents bigint;
  last_payer_id uuid;
  last_payer_cents bigint;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  -- The household is read from the expense itself, never taken from the caller:
  -- otherwise naming another household's expense id would pass the check.
  select household_id into v_household_id from expenses where id = p_expense_id;
  if v_household_id is null or v_household_id is distinct from get_my_household_id() then
    raise exception 'not_your_household';
  end if;

  -- A settled debt records a transfer that actually happened. Rewriting the
  -- expense would either invent a settlement or erase one, and neither is a
  -- call this function can make for the user.
  if exists(select 1 from expense_debts where expense_id = p_expense_id and is_settled) then
    raise exception 'expense_already_settled';
  end if;

  if p_total_amount is null or p_total_amount <= 0 then raise exception 'invalid_amount'; end if;
  if p_category_id is not null and not exists(select 1 from categories where id = p_category_id and household_id = v_household_id) then raise exception 'invalid_category'; end if;
  if exists(select 1 from jsonb_array_elements(p_splits || p_payments) s where not exists(select 1 from household_members where id = (s->>'member_id')::uuid and household_id = v_household_id)) then raise exception 'invalid_member'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then raise exception 'invalid_items'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) i where jsonb_typeof(i) <> 'string' or nullif(trim(i #>> '{}'), '') is null or length(i #>> '{}') > 200) then raise exception 'invalid_items'; end if;

  select coalesce(sum((s->>'amount_owed')::numeric), 0) into splits_total from jsonb_array_elements(p_splits) as s;
  if abs(splits_total - p_total_amount) > 0.01 then raise exception 'splits_do_not_match_total'; end if;

  select coalesce(sum((p->>'amount_paid')::numeric), 0) into payments_total from jsonb_array_elements(p_payments) as p;
  if abs(payments_total - p_total_amount) > 0.01 then raise exception 'payments_do_not_match_total'; end if;

  -- receipt_photo_url is deliberately left alone: replacing the photo would
  -- orphan the old object, and the storage delete policy only covers files no
  -- expense references. Changing the photo is its own change.
  update expenses
  set category_id = p_category_id,
      title = p_title,
      total_amount = p_total_amount,
      split_type = p_split_type
  where id = p_expense_id
  returning * into result;

  delete from expense_debts where expense_id = p_expense_id;
  delete from expense_splits where expense_id = p_expense_id;
  delete from expense_payments where expense_id = p_expense_id;
  delete from expense_line_items where expense_id = p_expense_id;

  insert into expense_splits (expense_id, member_id, shares, amount_owed)
  select p_expense_id, (s->>'member_id')::uuid, nullif(s->>'shares', '')::numeric, (s->>'amount_owed')::numeric
  from jsonb_array_elements(p_splits) as s;

  insert into expense_payments (expense_id, member_id, amount_paid)
  select p_expense_id, (p->>'member_id')::uuid, (p->>'amount_paid')::numeric
  from jsonb_array_elements(p_payments) as p
  where (p->>'amount_paid')::numeric > 0;

  insert into expense_line_items (expense_id, name, sort_order)
  select p_expense_id, trim(value), ordinality::integer
  from jsonb_array_elements_text(p_items) with ordinality;

  for rec_split in
    select (s->>'member_id')::uuid as member_id,
           round(((s->>'amount_owed')::numeric) * 100)::bigint as owed_cents
    from jsonb_array_elements(p_splits) as s
  loop
    if rec_split.owed_cents <= 0 then
      continue;
    end if;

    assigned_cents := 0;
    last_payer_id := null;
    last_payer_cents := 0;

    for rec_payment in
      select (p->>'member_id')::uuid as member_id,
             round(((p->>'amount_paid')::numeric) * 100)::bigint as paid_cents
      from jsonb_array_elements(p_payments) as p
      where (p->>'member_id')::uuid <> rec_split.member_id
        and round(((p->>'amount_paid')::numeric) * 100)::bigint > 0
    loop
      share_cents := floor(rec_split.owed_cents * rec_payment.paid_cents::numeric / total_cents);
      if share_cents > 0 then
        insert into expense_debts (expense_id, from_member_id, to_member_id, amount)
        values (p_expense_id, rec_split.member_id, rec_payment.member_id, share_cents / 100.0);
        assigned_cents := assigned_cents + share_cents;
      end if;
      if rec_payment.paid_cents > last_payer_cents then
        last_payer_cents := rec_payment.paid_cents;
        last_payer_id := rec_payment.member_id;
      end if;
    end loop;

    if assigned_cents < rec_split.owed_cents and last_payer_id is not null then
      update expense_debts
      set amount = amount + (rec_split.owed_cents - assigned_cents) / 100.0
      where expense_id = p_expense_id
        and from_member_id = rec_split.member_id
        and to_member_id = last_payer_id;

      if not found then
        insert into expense_debts (expense_id, from_member_id, to_member_id, amount)
        values (p_expense_id, rec_split.member_id, last_payer_id, (rec_split.owed_cents - assigned_cents) / 100.0);
      end if;
    end if;
  end loop;

  return result;
end $$;

revoke all on function public.update_expense_with_details(uuid, uuid, text, numeric, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.update_expense_with_details(uuid, uuid, text, numeric, text, jsonb, jsonb, jsonb) to authenticated;
