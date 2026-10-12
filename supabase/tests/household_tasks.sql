begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000801'),('00000000-0000-4000-8000-000000000802'),('00000000-0000-4000-8000-000000000803');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000801',true);
create temporary table task_test_home as select id, invite_code from public.create_household('Task test home','Owner');
grant select on task_test_home to authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000803',true);
create temporary table task_test_outside as select id from public.create_household('Other test home','Outsider');
grant select on task_test_outside to authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000802',true);
select public.join_household((select invite_code from task_test_home),'Roommate');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000801',true);
set local role authenticated;
do $test$
declare tid uuid; cid uuid; owner_id uuid := (select id from public.household_members where user_id=auth.uid()); mate_id uuid := (select id from public.household_members where user_id='00000000-0000-4000-8000-000000000802'); hid uuid := (select id from task_test_home); outsider_id uuid;
begin
 tid := public.save_task('  Kitchen  ','Details','todo','high',current_date,array[owner_id,mate_id,owner_id]);
 assert (select title='Kitchen' from public.tasks where id=tid), 'title trim';
 assert (select count(*)=2 from public.task_assignees where task_id=tid), 'multiple unique assignees';
 insert into public.task_comments(task_id,household_id,author_id,body) values(tid,hid,owner_id,'  First note  ') returning id into cid;
 assert (select body='First note' from public.task_comments where id=cid),'comment trim';
 update public.task_comments set body='Edited' where id=cid;
 begin
   update public.task_comments set task_id=gen_random_uuid() where id=cid;
   raise exception 'comment move allowed';
 exception when raise_exception then assert sqlerrm='task_comment_attribution_immutable','comment immutable'; end;
 begin
   update public.tasks set created_by=mate_id where id=tid;
   raise exception 'creator change allowed';
 exception when raise_exception then assert sqlerrm='task_attribution_immutable','creator immutable'; end;
 begin
   insert into public.tasks(household_id,title,created_by) values(hid,'Spoof',mate_id);
   raise exception 'spoof insert allowed';
 exception when insufficient_privilege then null; end;
 begin
   perform public.save_task('Broken','x','todo','normal',null,array[gen_random_uuid()],tid);
   raise exception 'invalid assignment allowed';
 exception when foreign_key_violation then null; end;
 assert (select title='Kitchen' from public.tasks where id=tid),'failed save rolls back edits';
 assert (select count(*)=2 from public.task_assignees where task_id=tid),'failed save rolls back assignees';
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000802',true);
 update public.tasks set status='done' where id=tid;
 assert (select completed_by=mate_id and completed_at is not null from public.tasks where id=tid),'server completion attribution';
 update public.tasks set completed_by=owner_id,completed_at='2000-01-01' where id=tid;
 assert (select completed_by=mate_id and completed_at > '2026-01-01' from public.tasks where id=tid),'completion cannot be forged';
 update public.task_comments set body='Tampered' where id=cid;
 assert (select body='Edited' from public.task_comments where id=cid),'others cannot edit comment';
 delete from public.task_comments where id=cid;
 assert (select count(*)=1 from public.task_comments where id=cid),'others cannot delete comment';
 update public.tasks set status='todo' where id=tid;
 assert (select completed_by is null and completed_at is null from public.tasks where id=tid),'reopen clears completion';
 insert into public.task_comments(task_id,household_id,author_id,body) values(tid,hid,mate_id,'Roommate note');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000803',true);
 assert (select count(*)=0 from public.tasks),'other house cannot read tasks';
 assert (select count(*)=0 from public.task_comments),'other house cannot read comments';
 assert (select count(*)=0 from public.task_assignees),'other house cannot read assignments';
 begin
   insert into public.task_comments(task_id,household_id,author_id,body) values(tid,(select id from task_test_outside),(select id from public.household_members where user_id=auth.uid()),'Cross house');
   raise exception 'cross house comment allowed';
 exception when foreign_key_violation then null; end;
 begin
   perform public.save_task('Hack','x','todo','normal',null,'{}',tid);
   raise exception 'cross house edit allowed';
 exception when raise_exception then assert sqlerrm='task_not_found','cross house save rejected'; end;
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000802',true);
 delete from public.tasks where id=tid;
 assert (select count(*)=0 from public.task_comments where task_id=tid),'delete cascades comments';
 assert (select count(*)=0 from public.task_assignees where task_id=tid),'delete cascades assignments';
end;
$test$;
reset role;
select 'PASS: tasks, assignments, atomic save, completion, comment ownership, household isolation, cascade deletion' as result;
rollback;
