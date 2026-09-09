begin;
do $$
declare
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  device_token text := 'ExpoPushToken[' || gen_random_uuid()::text || ']';
begin
  insert into auth.users(id) values(owner_id),(other_id);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  execute 'set local role authenticated';
  insert into public.push_tokens(token,user_id,locale) values(device_token,owner_id,'tr')
    on conflict(token) do update set locale=excluded.locale;
  insert into public.push_tokens(token,user_id,locale) values(device_token,owner_id,'en')
    on conflict(token) do update set locale=excluded.locale;
  assert (select locale='en' from public.push_tokens where token=device_token), 'own refresh works';
  perform set_config('request.jwt.claim.sub',other_id::text,true);
  assert (select count(*)=0 from public.push_tokens where token=device_token), 'other user cannot read token';
  execute 'reset role';
end $$;
select 'PASS: own push token refresh and cross-account isolation' as result;
rollback;
