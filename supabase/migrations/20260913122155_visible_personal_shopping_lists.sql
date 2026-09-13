alter table public.shopping_items
  add column list_owner_user_id uuid null references auth.users(id) on delete set null;

comment on column public.shopping_items.list_owner_user_id is
  'Null means the shared household list; otherwise the visible personal list owned by this auth user.';

create index shopping_items_household_list_owner_idx
  on public.shopping_items (household_id, list_owner_user_id, is_purchased, created_at desc);

create or replace function public.prevent_shopping_item_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.list_owner_user_id is distinct from old.list_owner_user_id then
    raise exception 'shopping_item_owner_immutable';
  end if;
  return new;
end;
$$;

create trigger prevent_shopping_item_owner_change
before update of list_owner_user_id on public.shopping_items
for each row execute function public.prevent_shopping_item_owner_change();

drop policy if exists "manage own household shopping items" on public.shopping_items;

create policy "household members can read all household shopping lists"
on public.shopping_items for select
to authenticated
using (household_id = (select public.get_my_household_id()));

create policy "household members can add shared or own shopping items"
on public.shopping_items for insert
to authenticated
with check (
  household_id = (select public.get_my_household_id())
  and (list_owner_user_id is null or list_owner_user_id = (select auth.uid()))
);

create policy "household members can update all household shopping lists"
on public.shopping_items for update
to authenticated
using (household_id = (select public.get_my_household_id()))
with check (household_id = (select public.get_my_household_id()));

create policy "household members can delete all household shopping lists"
on public.shopping_items for delete
to authenticated
using (household_id = (select public.get_my_household_id()));
