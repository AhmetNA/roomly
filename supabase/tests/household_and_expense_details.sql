-- Transactional integration check: no users or financial records survive this test.
begin;
do $$
declare
  owner_id uuid := gen_random_uuid(); claimant_id uuid := gen_random_uuid(); other_id uuid := gen_random_uuid();
  home public.households; person public.household_members; owner_member uuid; expense public.expenses;
  splits jsonb; payments jsonb; before_count bigint;
begin
  insert into auth.users(id) values(owner_id),(claimant_id),(other_id);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  home := public.create_household('Roomly transaction test','Owner');
  select id into owner_member from public.household_members where user_id=owner_id;
  person := public.add_unclaimed_member('Future roommate');
  assert person.user_id is null, 'placeholder is unclaimed';
  splits := jsonb_build_array(jsonb_build_object('member_id',person.id,'amount_owed',50),jsonb_build_object('member_id',owner_member,'amount_owed',50));
  payments := jsonb_build_array(jsonb_build_object('member_id',owner_member,'amount_paid',100));
  expense := public.create_expense_with_details(home.id,null,'Groceries',100,'equal',splits,payments,'["Bread","Milk"]',null);
  assert (select count(*)=2 from public.expense_line_items where expense_id=expense.id), 'items stored';
  assert (select name='Milk' from public.expense_line_items where expense_id=expense.id and sort_order=2), 'item order';
  assert (select amount=50 from public.expense_debts where expense_id=expense.id and from_member_id=person.id), 'placeholder debt stored';
  select count(*) into before_count from public.expenses;
  begin
    perform public.create_expense_with_details(home.id,null,'Invalid',100,'equal',splits,payments,'[""]',null);
    raise exception 'accepted_invalid_items';
  exception when others then
    if sqlerrm <> 'invalid_items' then raise; end if;
  end;
  assert (select count(*)=before_count from public.expenses), 'failed details are atomic';
  perform set_config('request.jwt.claim.sub',claimant_id::text,true);
  assert (select count(*)=1 from public.preview_household_members(home.invite_code)), 'invite preview';
  begin
    perform public.join_household_with_member('INVALID','',person.id);
    raise exception 'accepted_invalid_invite';
  exception when others then
    if sqlerrm <> 'invite_code_not_found' then raise; end if;
  end;
  perform public.join_household_with_member(home.invite_code,'',person.id);
  assert (select id=person.id from public.household_members where user_id=claimant_id), 'identity preserved';
  assert (select amount=50 from public.expense_debts where expense_id=expense.id and from_member_id=person.id), 'debt preserved after claim';
  perform set_config('request.jwt.claim.sub',other_id::text,true);
  execute 'set local role authenticated';
  assert (select count(*)=0 from public.expenses where id=expense.id), 'RLS hides household from unjoined account';
  assert (select count(*)=0 from public.household_members where household_id=home.id), 'RLS hides members from unjoined account';
  execute 'reset role';
  begin
    perform public.join_household_with_member(home.invite_code,'',person.id);
    raise exception 'accepted_double_claim';
  exception when others then
    if sqlerrm <> 'member_already_claimed' then raise; end if;
  end;
  begin
    perform public.create_expense_with_details(home.id,null,'Foreign',100,'equal',splits,payments,'[]',null);
    raise exception 'accepted_foreign_household';
  exception when others then
    if sqlerrm <> 'not_your_household' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub',claimant_id::text,true);
  perform public.leave_household();
  assert (select user_id is null from public.household_members where id=person.id), 'leave preserves person';
  assert (select count(*)=1 from public.expenses where id=expense.id), 'leave preserves expense';
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform public.leave_household();
  assert (select count(*)=1 from public.households where id=home.id), 'last leave preserves household';
  assert (select count(*)=1 from public.expenses where id=expense.id), 'last leave preserves history';
  assert not has_function_privilege('anon','public.add_unclaimed_member(text)','execute'), 'anonymous add denied';
  assert not has_function_privilege('anon','public.create_household(text,text)','execute'), 'anonymous create denied';
  assert not has_column_privilege('authenticated','public.household_members','user_id','update'), 'direct claim denied';
  assert (select not public and file_size_limit=5242880 from storage.buckets where id='receipts'), 'private bounded receipts';
end $$;
select 'PASS: claim identity, preserved debt, invite validation, double claim, household isolation, atomic items, leave history, grants, receipt bucket' as result;
rollback;
