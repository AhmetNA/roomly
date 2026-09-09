import { uploadReceipt, type ReceiptPhoto } from '@/lib/api/receipts';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type ExpenseRow = Tables<'expenses'>;
export type ExpenseSplitRow = Tables<'expense_splits'>;
export type ExpensePaymentRow = Tables<'expense_payments'>;
export type ExpenseDebtRow = Tables<'expense_debts'>;

export type ExpenseWithSplits = ExpenseRow & {
  expense_line_items: Tables<'expense_line_items'>[];
  expense_splits: ExpenseSplitRow[];
  expense_payments: ExpensePaymentRow[];
  expense_debts: ExpenseDebtRow[];
};

export type SplitInput = {
  memberId: string;
  amountOwed: number;
  shares: number | null;
};

export type PaymentInput = {
  memberId: string;
  amountPaid: number;
};

export async function fetchExpenses(): Promise<ExpenseWithSplits[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*), expense_payments(*), expense_debts(*), expense_line_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExpenseRemote(input: {
  householdId: string;
  categoryId: string | null;
  title: string;
  totalAmount: number;
  splitType: 'equal' | 'shares' | 'fixed';
  splits: SplitInput[];
  payments: PaymentInput[];
  items?: string[];
  receipt?: ReceiptPhoto | null;
}) {
  const receiptPath = input.receipt
    ? await uploadReceipt(input.householdId, input.receipt)
    : undefined;
  const { data, error } = await supabase.rpc('create_expense_with_details', {
    p_items: input.items ?? [],
    p_receipt_path: receiptPath,
    p_household_id: input.householdId,
    p_category_id: input.categoryId,
    p_title: input.title,
    p_total_amount: input.totalAmount,
    p_split_type: input.splitType,
    p_splits: input.splits.map((split) => ({
      member_id: split.memberId,
      amount_owed: split.amountOwed,
      shares: split.shares,
    })),
    p_payments: input.payments.map((payment) => ({
      member_id: payment.memberId,
      amount_paid: payment.amountPaid,
    })),
  });
  if (error) {
    // The storage policy refuses deletion if an uncertain response actually committed.
    if (receiptPath) await supabase.storage.from('receipts').remove([receiptPath]);
    throw error;
  }
  return data;
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
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : String(error);
  if (message.includes('photo_too_large')) return 'expenses.photoSize';
  if (message.includes('invalid_items')) return 'expenses.itemsInvalid';
  if (message.includes('splits_do_not_match_total')) return 'expenses.splitMismatch';
  if (message.includes('payments_do_not_match_total')) return 'expenses.paymentMismatch';
  return 'auth.errors.generic';
}
