alter table public.settlements
  add column currency_code text not null default 'TRY'
  constraint settlements_currency_code_check check (currency_code in ('TRY', 'USD', 'EUR'));

create function public.record_settlement(
  p_from_member_id uuid,
  p_to_member_id uuid,
  p_amount numeric,
  p_currency_code text
) returns public.settlements language plpgsql security definer set search_path = public as $$
declare result public.settlements;
begin
  if p_currency_code not in ('TRY', 'USD', 'EUR') then raise exception 'unsupported_currency'; end if;
  result := public.record_settlement(p_from_member_id, p_to_member_id, p_amount);
  update public.settlements set currency_code = p_currency_code where id = result.id returning * into result;
  return result;
end;
$$;

revoke all on function public.record_settlement(uuid, uuid, numeric, text) from public, anon;
grant execute on function public.record_settlement(uuid, uuid, numeric, text) to authenticated;
