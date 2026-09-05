import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type CategoryRow = Tables<'categories'>;

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from('categories').select('*').order('created_at');
  if (error) throw error;
  return data;
}

export async function addCategoryRemote(householdId: string, name: string) {
  const { error } = await supabase.from('categories').insert({ household_id: householdId, name });
  if (error) throw error;
}

export async function renameCategoryRemote(id: string, name: string) {
  const { error } = await supabase.from('categories').update({ name }).eq('id', id);
  if (error) throw error;
}

// Deleting a category leaves its shopping items uncategorized (category_id -> null
// via the FK's `on delete set null`) rather than reassigning them — there's no
// single "right" fallback category to pick on their behalf.
export async function removeCategoryRemote(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
