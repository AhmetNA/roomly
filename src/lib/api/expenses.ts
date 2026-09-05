import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type ExpenseRow = Tables<'expenses'>;
export type ExpenseSplitRow = Tables<'expense_splits'>;

export type ExpenseWithSplits = ExpenseRow & { expense_splits: ExpenseSplitRow[] };

export type SplitInput = {
  memberId: string;
  amountOwed: number;
  shares: number | null;
};

export async function fetchExpenses(): Promise<ExpenseWithSplits[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExpenseRemote(input: {
  householdId: string;
  categoryId: string | null;
  paidBy: string;
  title: string;
  totalAmount: number;
  splitType: 'equal' | 'shares' | 'fixed';
  splits: SplitInput[];
}) {
  const { error } = await supabase.rpc('create_expense', {
    p_household_id: input.householdId,
    p_category_id: input.categoryId,
    p_paid_by: input.paidBy,
    p_title: input.title,
    p_total_amount: input.totalAmount,
    p_split_type: input.splitType,
    p_splits: input.splits.map((split) => ({
      member_id: split.memberId,
      amount_owed: split.amountOwed,
      shares: split.shares,
    })),
  });
  if (error) throw error;
}

export async function removeExpenseRemote(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function settleDebtRemote(fromMemberId: string, toMemberId: string) {
  const { error } = await supabase.rpc('settle_debt', {
    p_from_member_id: fromMemberId,
    p_to_member_id: toMemberId,
  });
  if (error) throw error;
}

export function getExpenseErrorMessageKey(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('splits_do_not_match_total')) return 'expenses.splitMismatch';
  return 'auth.errors.generic';
}
