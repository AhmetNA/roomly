import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type ShoppingItemRow = Tables<'shopping_items'>;

export async function fetchShoppingItems(): Promise<ShoppingItemRow[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: false })
    // A batch insert stamps every row with the same now(), so created_at alone
    // leaves their order up to the planner and it can change between refetches.
    .order('id', { ascending: false });
  if (error) throw error;
  return data;
}

// One entry per name: typing a few things at once is the common case, so they
// go in as a single insert rather than a request per item.
export async function addShoppingItemsRemote(
  householdId: string,
  names: string[],
  categoryId: string | null,
  addedBy: string,
) {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert(
      names.map((name) => ({
        household_id: householdId,
        name,
        category_id: categoryId,
        added_by: addedBy,
      })),
    )
    .select('id');
  if (error) throw error;
  return data;
}

// Marking purchased records who did it and when; un-marking clears both —
// re-checking the item should start a fresh record, not keep a stale one.
export async function toggleShoppingItemPurchasedRemote(
  id: string,
  isPurchased: boolean,
  purchasedBy: string | null,
) {
  const { error } = await supabase
    .from('shopping_items')
    .update({
      is_purchased: isPurchased,
      purchased_by: isPurchased ? purchasedBy : null,
      purchased_at: isPurchased ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function removeShoppingItemRemote(id: string) {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}
