import type { ExpenseWithSplits } from '@/lib/api/expenses';
import { normalizeCurrencyCode, type CurrencyCode } from '@/lib/currency';

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
  const groups = new Map<
    CurrencyCode,
    {
      currencyCode: CurrencyCode;
      totalAmount: number;
      byMember: Map<string, number>;
      byCategory: Map<string | null, number>;
    }
  >();

  for (const expense of inPeriod) {
    const currencyCode = normalizeCurrencyCode(expense.currency_code);
    const group = groups.get(currencyCode) ?? {
      currencyCode,
      totalAmount: 0,
      byMember: new Map<string, number>(),
      byCategory: new Map<string | null, number>(),
    };
    group.totalAmount += expense.total_amount;
    // "Paid" is per-payment now that an expense can have multiple payers —
    // each payer's own contribution counts toward their total, not the
    // expense's full amount.
    for (const payment of expense.expense_payments) {
      group.byMember.set(
        payment.member_id,
        (group.byMember.get(payment.member_id) ?? 0) + payment.amount_paid,
      );
    }
    group.byCategory.set(
      expense.category_id,
      (group.byCategory.get(expense.category_id) ?? 0) + expense.total_amount,
    );
    groups.set(currencyCode, group);
  }

  return [...groups.values()];
}
