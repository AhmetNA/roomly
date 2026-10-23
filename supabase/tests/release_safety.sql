begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000951'),('00000000-0000-4000-8000-000000000952'),('00000000-0000-4000-8000-000000000953');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000951',true);
create temporary table safety_home as select id,invite_code from public.create_household('Safety fixture','Owner');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000952',true);
select public.join_household((select invite_code from safety_home),'Mate');
create temporary table safety_mate as select id from public.household_members where user_id=auth.uid();
create temporary table safety_task as select public.save_task('Safety task','','todo','normal',null,'{}') as id;
insert into public.task_comments(task_id,household_id,author_id,body)
values((select id from safety_task),(select id from safety_home),(select id from safety_mate),'Mate comment');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000953',true);
create temporary table safety_outside as select id from public.create_household('Other safety fixture','Other');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000951',true);
grant select on safety_home,safety_mate,safety_task,safety_outside to authenticated;
set local role authenticated;
do $$ begin
 begin
  perform public.report_content('task',(select id from safety_task),'Report reason');
  raise exception 'accepted report without terms';
 exception when raise_exception then assert sqlerrm='terms_required'; end;
 perform public.accept_current_terms();
 assert (select version='2026-10-23' from public.terms_acceptances where user_id=auth.uid()), 'terms recorded';
 assert public.report_content('task',(select id from safety_task),'Report reason') is not null, 'report queued';
 perform public.report_content('member',(select id from safety_mate),'Person report');
 assert (select count(*)=2 from public.content_reports), 'own reports visible';
 begin
  perform public.report_content('household',(select id from safety_outside),'Cross household report');
  raise exception 'cross household report accepted';
 exception when raise_exception then assert sqlerrm='target_not_found'; end;
 begin
  perform public.set_user_block('00000000-0000-4000-8000-000000000953',true);
  raise exception 'cross household block accepted';
 exception when raise_exception then assert sqlerrm='target_not_found'; end;
 assert (select count(*)=1 from public.task_comments where task_id=(select id from safety_task)), 'comment initially visible';
 perform public.set_user_block('00000000-0000-4000-8000-000000000952',true);
 assert (select count(*)=0 from public.task_comments where task_id=(select id from safety_task)), 'blocked comment hidden server side';
 begin
  perform public.allowed_notification_recipients('00000000-0000-4000-8000-000000000952',array[auth.uid()]);
  raise exception 'client queried other blocks';
 exception when insufficient_privilege then null; end;
 begin
  update public.content_reports set status='resolved';
  raise exception 'client moderated own report';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 assert public.allowed_notification_recipients('00000000-0000-4000-8000-000000000952',array['00000000-0000-4000-8000-000000000951'::uuid])='{}'::uuid[], 'blocked actor cannot send';
 assert public.allowed_notification_recipients('00000000-0000-4000-8000-000000000953',array['00000000-0000-4000-8000-000000000951'::uuid])=array['00000000-0000-4000-8000-000000000951'::uuid], 'other actor unaffected';
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000952',true);
do $$ begin
 assert (select count(*)=0 from public.user_blocks), 'other user cannot see blocks';
 assert (select count(*)=0 from public.content_reports), 'other user cannot see reports';
 assert (select count(*)=0 from public.terms_acceptances), 'other user cannot see terms';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000951',true);
select public.set_user_block('00000000-0000-4000-8000-000000000952',false);
do $$ begin
 assert (select count(*)=1 from public.task_comments where task_id=(select id from safety_task)), 'unblock restores comments';
end $$;
reset role;
select 'PASS: versioned terms, reports, household isolation, private queue, server-side comment hiding, notification block and unblock' as result;
rollback;
