alter table public.household_members alter column user_id drop not null;
alter table public.expense_line_items alter column amount drop not null;
alter table public.expense_line_items add column sort_order integer not null default 0;

create function public.add_unclaimed_member(member_name text) returns public.household_members
language plpgsql security definer set search_path = public as $$
declare result household_members; hid uuid := get_my_household_id();
begin
  if auth.uid() is null or hid is null then raise exception 'not_in_household'; end if;
  if nullif(trim(member_name), '') is null or length(trim(member_name)) > 100 then raise exception 'invalid_name'; end if;
  insert into household_members(household_id, name) values (hid, trim(member_name)) returning * into result;
  return result;
end $$;

create function public.preview_household_members(code text) returns table(id uuid, name text)
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists(select 1 from household_members where user_id = auth.uid()) then raise exception 'already_in_household'; end if;
  select h.id into hid from households h where h.invite_code = upper(trim(code));
  if hid is null then raise exception 'invite_code_not_found'; end if;
  return query select m.id, m.name from household_members m where m.household_id = hid and m.user_id is null order by m.created_at;
end $$;

create function public.join_household_with_member(code text, my_name text, member_id uuid default null) returns public.households
language plpgsql security definer set search_path = public as $$
declare target households;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  if exists(select 1 from household_members where user_id = auth.uid()) then raise exception 'already_in_household'; end if;
  select * into target from households where invite_code = upper(trim(code)) for update;
  if not found then raise exception 'invite_code_not_found'; end if;
  if member_id is not null then
    update household_members set user_id = auth.uid() where id = member_id and household_id = target.id and user_id is null;
    if not found then raise exception 'member_already_claimed'; end if;
  else
    if nullif(trim(my_name), '') is null or length(trim(my_name)) > 100 then raise exception 'invalid_name'; end if;
    insert into household_members(household_id, user_id, name) values (target.id, auth.uid(), trim(my_name));
  end if;
  return target;
end $$;

-- Preserve financial history when a person leaves and allow them to reclaim it.
create or replace function public.leave_household() returns void
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select household_id into hid from household_members where user_id = auth.uid();
  if hid is null then raise exception 'not_in_household'; end if;
  perform 1 from households where id = hid for update;
  update household_members set user_id = null, iban = null where user_id = auth.uid();
  -- Keep the household and its financial history, including when everybody leaves.
  -- A returning member can reclaim their identity using the existing invite code.
end $$;

-- Clients may edit profile fields only; claiming membership is an atomic RPC.
revoke update on public.household_members from authenticated;
grant update(name, iban) on public.household_members to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy "read household receipts" on storage.objects for select to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select public.get_my_household_id())::text);
create policy "upload household receipts" on storage.objects for insert to authenticated
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select public.get_my_household_id())::text and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy "remove own unattached receipts" on storage.objects for delete to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select public.get_my_household_id())::text and (storage.foldername(name))[2] = (select auth.uid())::text and not exists(select 1 from public.expenses e where e.receipt_photo_url = name));

create function public.create_expense_with_details(p_household_id uuid, p_category_id uuid, p_title text, p_total_amount numeric, p_split_type text, p_splits jsonb, p_payments jsonb, p_items jsonb default '[]', p_receipt_path text default null)
returns public.expenses language plpgsql security definer set search_path = public as $$
declare result expenses;
begin
  if auth.uid() is null or p_household_id is distinct from get_my_household_id() then raise exception 'not_your_household'; end if;
  if p_total_amount is null or p_total_amount <= 0 then raise exception 'invalid_amount'; end if;
  if p_category_id is not null and not exists(select 1 from categories where id=p_category_id and household_id=p_household_id) then raise exception 'invalid_category'; end if;
  if exists(select 1 from jsonb_array_elements(p_splits || p_payments) s where not exists(select 1 from household_members where id=(s->>'member_id')::uuid and household_id=p_household_id)) then raise exception 'invalid_member'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 50 then raise exception 'invalid_items'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) i where jsonb_typeof(i) <> 'string' or nullif(trim(i #>> '{}'), '') is null or length(i #>> '{}') > 200) then raise exception 'invalid_items'; end if;
  if p_receipt_path is not null and (split_part(p_receipt_path,'/',1) <> p_household_id::text or split_part(p_receipt_path,'/',2) <> auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='receipts' and name=p_receipt_path)) then raise exception 'invalid_receipt'; end if;
  result := public.create_expense(p_household_id,p_category_id,p_title,p_total_amount,p_split_type,p_splits,p_payments);
  update expenses set receipt_photo_url=p_receipt_path where id=result.id returning * into result;
  insert into expense_line_items(expense_id,name,sort_order) select result.id,trim(value),ordinality::integer from jsonb_array_elements_text(p_items) with ordinality;
  return result;
end $$;

revoke all on function public.add_unclaimed_member(text), public.preview_household_members(text), public.join_household_with_member(text,text,uuid), public.create_expense_with_details(uuid,uuid,text,numeric,text,jsonb,jsonb,jsonb,text) from public, anon;
grant execute on function public.add_unclaimed_member(text), public.preview_household_members(text), public.join_household_with_member(text,text,uuid), public.create_expense_with_details(uuid,uuid,text,numeric,text,jsonb,jsonb,jsonb,text) to authenticated;
