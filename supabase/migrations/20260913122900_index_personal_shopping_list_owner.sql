create index shopping_items_list_owner_user_id_idx
  on public.shopping_items (list_owner_user_id)
  where list_owner_user_id is not null;
