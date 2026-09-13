alter table public.expenses
  add column currency_code text not null default 'TRY'
  constraint expenses_currency_code_check check (currency_code in ('TRY', 'USD', 'EUR'));

comment on column public.expenses.currency_code is
  'ISO 4217 currency selected for this expense. Existing expenses default to TRY.';

create function public.create_expense_with_details(
  p_household_id uuid,
  p_category_id uuid,
  p_title text,
  p_total_amount numeric,
  p_split_type text,
  p_splits jsonb,
  p_payments jsonb,
  p_currency_code text,
  p_items jsonb default '[]',
  p_receipt_path text default null
)
returns public.expenses
language plpgsql
security definer
set search_path = public
as $$
declare result expenses;
begin
  if p_currency_code not in ('TRY', 'USD', 'EUR') then
    raise exception 'invalid_currency';
  end if;

  result := public.create_expense_with_details(
    p_household_id,
    p_category_id,
    p_title,
    p_total_amount,
    p_split_type,
    p_splits,
    p_payments,
    p_items,
    p_receipt_path
  );

  update expenses
  set currency_code = p_currency_code
  where id = result.id
  returning * into result;

  return result;
end $$;

create function public.update_expense_with_details(
  p_expense_id uuid,
  p_category_id uuid,
  p_title text,
  p_total_amount numeric,
  p_split_type text,
  p_splits jsonb,
  p_payments jsonb,
  p_currency_code text,
  p_items jsonb default '[]'
)
returns public.expenses
language plpgsql
security definer
set search_path = public
as $$
declare result expenses;
begin
  if p_currency_code not in ('TRY', 'USD', 'EUR') then
    raise exception 'invalid_currency';
  end if;

  result := public.update_expense_with_details(
    p_expense_id,
    p_category_id,
    p_title,
    p_total_amount,
    p_split_type,
    p_splits,
    p_payments,
    p_items
  );

  update expenses
  set currency_code = p_currency_code
  where id = result.id
  returning * into result;

  return result;
end $$;

revoke all on function public.create_expense_with_details(uuid, uuid, text, numeric, text, jsonb, jsonb, text, jsonb, text) from public, anon;
grant execute on function public.create_expense_with_details(uuid, uuid, text, numeric, text, jsonb, jsonb, text, jsonb, text) to authenticated;

revoke all on function public.update_expense_with_details(uuid, uuid, text, numeric, text, jsonb, jsonb, text, jsonb) from public, anon;
grant execute on function public.update_expense_with_details(uuid, uuid, text, numeric, text, jsonb, jsonb, text, jsonb) to authenticated;
