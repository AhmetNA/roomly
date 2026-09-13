import type { ExpenseWithSplits } from '@/lib/api/expenses';
import { normalizeCurrencyCode, type CurrencyCode } from '@/lib/currency';

export type PersonalSpendingPeriod = 'thisMonth' | 'lastMonth' | 'all';

export type PersonalSpendingItem = {
  expense: ExpenseWithSplits;
  shareCents: number;
  paidCents: number;
};

export type PersonalSpendingSummary = {
  items: PersonalSpendingItem[];
  totals: { currencyCode: CurrencyCode; totalShareCents: number; totalPaidCents: number }[];
};

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function isInPeriod(createdAt: string, period: PersonalSpendingPeriod, now: Date) {
  if (period === 'all') return true;

  const date = new Date(createdAt);
  const monthOffset = period === 'thisMonth' ? 0 : -1;
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
}

export function computePersonalSpending(
  expenses: ExpenseWithSplits[],
  currentMemberId: string | undefined,
  period: PersonalSpendingPeriod,
  now = new Date(),
): PersonalSpendingSummary {
  if (!currentMemberId) {
    return { items: [], totals: [] };
  }

  const items = expenses
    .filter((expense) => isInPeriod(expense.created_at, period, now))
    .map((expense) => {
      const shareCents = expense.expense_splits
        .filter((split) => split.member_id === currentMemberId)
        .reduce((sum, split) => sum + toCents(split.amount_owed), 0);
      const paidCents = expense.expense_payments
        .filter((payment) => payment.member_id === currentMemberId)
        .reduce((sum, payment) => sum + toCents(payment.amount_paid), 0);

      return { expense, shareCents, paidCents };
    })
    .filter((item) => item.shareCents !== 0 || item.paidCents !== 0);

  const totalsByCurrency = new Map<
    CurrencyCode,
    { totalShareCents: number; totalPaidCents: number }
  >();
  for (const item of items) {
    const currencyCode = normalizeCurrencyCode(item.expense.currency_code);
    const total = totalsByCurrency.get(currencyCode) ?? { totalShareCents: 0, totalPaidCents: 0 };
    total.totalShareCents += item.shareCents;
    total.totalPaidCents += item.paidCents;
    totalsByCurrency.set(currencyCode, total);
  }
  return {
    items,
    totals: [...totalsByCurrency].map(([currencyCode, total]) => ({ currencyCode, ...total })),
  };
}
