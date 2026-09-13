alter table public.shopping_items
  drop constraint shopping_items_list_owner_user_id_fkey,
  add constraint shopping_items_list_owner_user_id_fkey
    foreign key (list_owner_user_id) references auth.users(id) on delete restrict;

create or replace function public.prevent_shopping_item_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.list_owner_user_id is distinct from old.list_owner_user_id then
    raise exception 'shopping_item_owner_immutable';
  end if;
  if new.added_by is distinct from old.added_by then
    raise exception 'shopping_item_actor_immutable';
  end if;
  return new;
end;
$$;

drop trigger prevent_shopping_item_owner_change on public.shopping_items;
create trigger prevent_shopping_item_owner_change
before update of list_owner_user_id, added_by on public.shopping_items
for each row execute function public.prevent_shopping_item_owner_change();

drop policy "household members can add shared or own shopping items"
  on public.shopping_items;

create policy "household members can add shared or own shopping items"
on public.shopping_items for insert
to authenticated
with check (
  household_id = (select public.get_my_household_id())
  and (list_owner_user_id is null or list_owner_user_id = (select auth.uid()))
  and exists (
    select 1
    from public.household_members as member
    where member.id = added_by
      and member.household_id = shopping_items.household_id
      and member.user_id = (select auth.uid())
  )
);
