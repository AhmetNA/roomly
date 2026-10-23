begin;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000901'),
 ('00000000-0000-4000-8000-000000000902'),
 ('00000000-0000-4000-8000-000000000903');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000901',true);
create temporary table deletion_home as select id,invite_code from public.create_household('Deletion fixture','Private owner');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000902',true);
select public.join_household((select invite_code from deletion_home),'Roommate');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000903',true);
create temporary table deletion_other_home as select id from public.create_household('Other fixture','Outsider');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000901',true);
create temporary table deletion_member as select id,household_id from public.household_members where user_id=auth.uid();
create temporary table deletion_mate as select id from public.household_members where user_id='00000000-0000-4000-8000-000000000902';
insert into public.expenses(id,household_id,title,total_amount,split_type)
values('00000000-0000-4000-8000-000000000911',(select id from deletion_home),'Shared expense',100,'equal');
insert into public.expense_splits(expense_id,member_id,amount_owed) values
 ('00000000-0000-4000-8000-000000000911',(select id from deletion_member),50),
 ('00000000-0000-4000-8000-000000000911',(select id from deletion_mate),50);
insert into public.expense_payments(expense_id,member_id,amount_paid)
values('00000000-0000-4000-8000-000000000911',(select id from deletion_mate),100);
insert into public.expense_debts(expense_id,from_member_id,to_member_id,amount)
values('00000000-0000-4000-8000-000000000911',(select id from deletion_member),(select id from deletion_mate),50);
insert into public.settlements(household_id,from_member_id,to_member_id,amount)
values((select id from deletion_home),(select id from deletion_member),(select id from deletion_mate),10);
insert into public.push_tokens(token,user_id) values('deletion-fixture-token',auth.uid());
create temporary table deletion_task as select public.save_task('Private task','Private description','todo','normal',null,array[(select id from deletion_member)]) as id;
insert into public.task_comments(task_id,household_id,author_id,body)
values((select id from deletion_task),(select id from deletion_home),(select id from deletion_member),'Private comment');
insert into public.shopping_items(household_id,name,added_by,list_owner_user_id)
values((select id from deletion_home),'Private list',(select id from deletion_member),auth.uid());

-- Leaving must preserve deletion attribution, unlike the historical schema.
select public.leave_household();
do $$ begin
 assert (select account_owner_id='00000000-0000-4000-8000-000000000901' from public.household_members where id=(select id from deletion_member));
end $$;
set local role authenticated;
do $$ begin
 begin
  perform public.prepare_account_deletion('00000000-0000-4000-8000-000000000902');
  raise exception 'client could delete another account';
 exception when insufficient_privilege then null; end;
 begin
  perform public.finish_account_deletion('00000000-0000-4000-8000-000000000902');
  raise exception 'client could finalize another account';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select public.prepare_account_deletion('00000000-0000-4000-8000-000000000901');
select public.prepare_account_deletion('00000000-0000-4000-8000-000000000901');
do $$ begin
 assert (select user_id is null and name='Silinen hesap' and iban is null and account_deleted_at is not null from public.household_members where id=(select id from deletion_member)), 'redacted';
 assert not exists(select 1 from public.task_comments where author_id=(select id from deletion_member)), 'comments';
 assert not exists(select 1 from public.task_assignees where member_id=(select id from deletion_member)), 'assignments';
 assert not exists(select 1 from public.shopping_items where list_owner_user_id='00000000-0000-4000-8000-000000000901'), 'personal list';
 assert not exists(select 1 from public.push_tokens where user_id='00000000-0000-4000-8000-000000000901'), 'tokens';
 assert (select description='' from public.tasks where id=(select id from deletion_task)), 'task text';
 assert public.get_my_household_id() is null, 'household access';
 begin
  perform public.create_household('Forbidden','Pending');
  raise exception 'pending account created household';
 exception when raise_exception then assert sqlerrm='account_unavailable'; end;
end $$;
-- Fixture metadata only: no real object is uploaded or removed by this rollback test.
do $$ begin
 begin
  insert into storage.objects(bucket_id,name,owner_id)
  values('receipts',(select id::text from deletion_home)||'/00000000-0000-4000-8000-000000000901/test.jpg','00000000-0000-4000-8000-000000000901');
  assert (select count(*)=1 from public.account_deletion_receipts('00000000-0000-4000-8000-000000000901'));
  begin
   perform public.finish_account_deletion('00000000-0000-4000-8000-000000000901');
   raise exception 'finished with file remaining';
  exception when raise_exception then assert sqlerrm='receipt_cleanup_pending'; end;
  -- A subtransaction rollback removes the fixture without deleting Storage metadata.
  raise exception 'rollback_storage_fixture';
 exception when raise_exception then assert sqlerrm='rollback_storage_fixture'; end;
end $$;
select public.finish_account_deletion('00000000-0000-4000-8000-000000000901');
select public.finish_account_deletion('00000000-0000-4000-8000-000000000901');
do $$ begin
 assert not exists(select 1 from auth.users where id='00000000-0000-4000-8000-000000000901'), 'auth deleted';
 assert not exists(select 1 from public.account_deletions where user_id='00000000-0000-4000-8000-000000000901'), 'queue removed';
 assert (select count(*)=2 from public.expense_splits where expense_id='00000000-0000-4000-8000-000000000911'), 'splits preserved';
 assert (select sum(amount_paid)=100 from public.expense_payments where expense_id='00000000-0000-4000-8000-000000000911'), 'payments preserved';
 assert (select sum(amount)=50 from public.expense_debts where expense_id='00000000-0000-4000-8000-000000000911'), 'debts preserved';
 assert (select sum(amount)=10 from public.settlements where household_id=(select id from deletion_home)), 'settlement preserved';
 assert exists(select 1 from public.households where id=(select id from deletion_other_home)), 'other household unchanged';
 assert exists(select 1 from auth.users where id='00000000-0000-4000-8000-000000000902'), 'other account unchanged';
 -- A token with the deleted subject cannot regain membership, even before JWT expiry.
 begin
  perform public.create_household('Forbidden','Deleted JWT');
  raise exception 'deleted JWT created household';
 exception when raise_exception then assert sqlerrm='account_unavailable'; end;
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000903',true);
 perform public.leave_household();
 assert not exists(select 1 from public.preview_household_members((select invite_code from deletion_home)) where id=(select id from deletion_member)), 'not previewed';
 begin
  perform public.join_household_with_member((select invite_code from deletion_home),'Intruder',(select id from deletion_member));
  raise exception 'deleted member reclaimed';
 exception when raise_exception then assert sqlerrm='member_account_deleted'; end;
end $$;
select 'PASS: balance preservation, personal data cleanup, retry, storage gate, authorization, deleted JWT, leave attribution and claim rejection' as result;
rollback;
