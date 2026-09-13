import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';
import type { CurrencyCode } from '@/lib/currency';

export type SettlementRow = Tables<'settlements'>;

export async function fetchSettlements(): Promise<SettlementRow[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function recordSettlementRemote(
  fromMemberId: string,
  toMemberId: string,
  amount: number,
  currencyCode: CurrencyCode,
) {
  const { error } = await supabase.rpc('record_settlement', {
    p_from_member_id: fromMemberId,
    p_to_member_id: toMemberId,
    p_amount: amount,
    p_currency_code: currencyCode,
  });
  if (error) throw error;
}
