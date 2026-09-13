-- Transactional integration check: no users or shopping items survive this test.
begin;

insert into auth.users (id)
values ('00000000-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000000000102');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
create temporary table visible_list_test_state as
select id as household_id, invite_code
from public.create_household('Visible list test', 'Owner');
grant select on visible_list_test_state to authenticated;

set local role authenticated;
insert into public.shopping_items (household_id, name, added_by, list_owner_user_id)
select household_id,
       'Shared item',
       (select id from public.household_members where user_id = auth.uid()),
       null
from visible_list_test_state;
insert into public.shopping_items (household_id, name, added_by, list_owner_user_id)
select household_id,
       'Owner item',
       (select id from public.household_members where user_id = auth.uid()),
       auth.uid()
from visible_list_test_state;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
set local role authenticated;
select public.join_household(
  (select invite_code from visible_list_test_state),
  'Housemate'
);

do $$
declare
  owner_id uuid := '00000000-0000-4000-8000-000000000101';
  housemate_id uuid := '00000000-0000-4000-8000-000000000102';
  home_id uuid := (select household_id from visible_list_test_state);
  personal_item uuid := (
    select id from public.shopping_items where list_owner_user_id = owner_id
  );
begin
  assert (select count(*) = 2 from public.shopping_items),
    'housemate can see shared and visible personal items';
  update public.shopping_items set is_purchased = true where id = personal_item;
  assert (select is_purchased from public.shopping_items where id = personal_item),
    'housemate can manage a visible personal item';

  begin
    insert into public.shopping_items (household_id, name, list_owner_user_id)
    values (home_id, 'Spoofed owner', owner_id);
    raise exception 'another user personal-list insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.shopping_items (household_id, name, added_by, list_owner_user_id)
    values (
      home_id,
      'Spoofed actor',
      (select id from public.household_members where user_id = owner_id),
      housemate_id
    );
    raise exception 'another member as added_by unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.shopping_items
    set added_by = (select id from public.household_members where user_id = housemate_id)
    where id = personal_item;
    raise exception 'added_by change unexpectedly succeeded';
  exception when raise_exception then
    assert sqlerrm = 'shopping_item_actor_immutable', 'unexpected actor-change error';
  end;

  begin
    update public.shopping_items set list_owner_user_id = housemate_id where id = personal_item;
    raise exception 'personal-list owner change unexpectedly succeeded';
  exception when raise_exception then
    assert sqlerrm = 'shopping_item_owner_immutable', 'unexpected owner-change error';
  end;
end $$;

reset role;
select 'PASS: visibility, household management, owner and actor spoofing, immutable attribution' as result;
rollback;
