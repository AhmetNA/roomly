-- Transactional integration check: no user, household, or expense survives.
begin;

insert into auth.users (id) values ('00000000-0000-4000-8000-000000000201');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);

create temporary table currency_test_state as
select id as household_id from public.create_household('Currency test', 'Owner');
alter table currency_test_state add column member_id uuid;
update currency_test_state
set member_id = (
  select id from public.household_members
  where user_id = '00000000-0000-4000-8000-000000000201'
);
grant select on currency_test_state to authenticated;

set local role authenticated;
select public.create_expense_with_details(
  household_id,
  null,
  'Dollar expense',
  25,
  'equal',
  jsonb_build_array(jsonb_build_object('member_id', member_id, 'amount_owed', 25, 'shares', 1)),
  jsonb_build_array(jsonb_build_object('member_id', member_id, 'amount_paid', 25)),
  'USD',
  '[]'::jsonb,
  null
) from currency_test_state;

do $$
begin
  assert (select currency_code = 'USD' from public.expenses where title = 'Dollar expense'),
    'currency was not stored';

  begin
    perform public.create_expense_with_details(
      household_id,
      null,
      'Invalid currency',
      1,
      'equal',
      jsonb_build_array(jsonb_build_object('member_id', member_id, 'amount_owed', 1, 'shares', 1)),
      jsonb_build_array(jsonb_build_object('member_id', member_id, 'amount_paid', 1)),
      'GBP',
      '[]'::jsonb,
      null
    ) from currency_test_state;
    raise exception 'invalid currency unexpectedly accepted';
  exception when raise_exception then
    assert sqlerrm = 'invalid_currency', 'unexpected invalid currency error';
  end;
end $$;

reset role;
select 'PASS: USD stored and unsupported currency rejected' as result;
rollback;
