import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type HouseholdRow = Tables<'households'>;
export type MemberRow = Tables<'household_members'>;

export async function fetchHousehold(): Promise<HouseholdRow | null> {
  const { data, error } = await supabase.from('households').select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchHouseholdMembers(): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createHouseholdRemote(householdName: string, myName: string) {
  const { data, error } = await supabase.rpc('create_household', {
    household_name: householdName,
    my_name: myName,
  });
  if (error) throw error;
  return data;
}

export async function joinHouseholdRemote(code: string, myName: string) {
  const { data, error } = await supabase.rpc('join_household', { code, my_name: myName });
  if (error) throw error;
  return data;
}

export async function updateMemberRemote(
  memberId: string,
  updates: Partial<Pick<MemberRow, 'name' | 'iban'>>,
) {
  const { error } = await supabase.from('household_members').update(updates).eq('id', memberId);
  if (error) throw error;
}

export async function leaveHouseholdRemote() {
  const { error } = await supabase.rpc('leave_household');
  if (error) throw error;
}
