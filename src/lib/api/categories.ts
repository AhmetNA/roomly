import { DEFAULT_CATEGORY_ICON_KEY } from '@/constants/category-icons';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type CategoryRow = Tables<'categories'>;

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return data;
}

// New categories sort after every existing one — `sort_order` is a manual
// display order (see the "Market"/utility split migration), not a timestamp,
// so there's no ambiguity-free default beyond "append to the end".
export async function addCategoryRemote(
  householdId: string,
  name: string,
  icon: string,
  sortOrder: number,
) {
  const { error } = await supabase.from('categories').insert({
    household_id: householdId,
    name,
    icon: icon || DEFAULT_CATEGORY_ICON_KEY,
    sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function updateCategoryRemote(
  id: string,
  updates: Partial<Pick<CategoryRow, 'name' | 'icon'>>,
) {
  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  if (error) throw error;
}

// Deleting a category leaves its shopping items uncategorized (category_id -> null
// via the FK's `on delete set null`) rather than reassigning them — there's no
// single "right" fallback category to pick on their behalf.
export async function removeCategoryRemote(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
