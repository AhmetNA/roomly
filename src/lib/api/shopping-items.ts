import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type ShoppingItemRow = Tables<'shopping_items'>;

export async function fetchShoppingItems(): Promise<ShoppingItemRow[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addShoppingItemRemote(
  householdId: string,
  name: string,
  categoryId: string | null,
  addedBy: string,
) {
  const { error } = await supabase
    .from('shopping_items')
    .insert({ household_id: householdId, name, category_id: categoryId, added_by: addedBy });
  if (error) throw error;
}

export async function toggleShoppingItemPurchasedRemote(id: string, isPurchased: boolean) {
  const { error } = await supabase
    .from('shopping_items')
    .update({ is_purchased: isPurchased })
    .eq('id', id);
  if (error) throw error;
}

export async function removeShoppingItemRemote(id: string) {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}
