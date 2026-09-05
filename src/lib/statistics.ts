import type { ExpenseWithSplits } from '@/lib/api/expenses';

export type StatisticsPeriod = 'month' | 'year' | 'all';

function isInPeriod(createdAt: string, period: StatisticsPeriod) {
  if (period === 'all') return true;
  const date = new Date(createdAt);
  const now = new Date();
  if (period === 'year') return date.getFullYear() === now.getFullYear();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function computeStatistics(expenses: ExpenseWithSplits[], period: StatisticsPeriod) {
  const inPeriod = expenses.filter((expense) => isInPeriod(expense.created_at, period));

  let totalAmount = 0;
  const byMember = new Map<string, number>();
  const byCategory = new Map<string | null, number>();

  for (const expense of inPeriod) {
    totalAmount += expense.total_amount;
    // "Paid" is per-payment now that an expense can have multiple payers —
    // each payer's own contribution counts toward their total, not the
    // expense's full amount.
    for (const payment of expense.expense_payments) {
      byMember.set(payment.member_id, (byMember.get(payment.member_id) ?? 0) + payment.amount_paid);
    }
    byCategory.set(
      expense.category_id,
      (byCategory.get(expense.category_id) ?? 0) + expense.total_amount,
    );
  }

  return { totalAmount, byMember, byCategory };
}
