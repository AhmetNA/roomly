import type { ExpenseWithSplits } from '@/lib/api/expenses';

export type DebtBalance = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
};

// Net, pairwise balances only (no multi-hop simplification — that's explicitly
// post-MVP per CLAUDE.md). Settled splits don't count: once a debt is marked
// paid it should disappear from the summary, not just change color.
export function computeDebtBalances(expenses: ExpenseWithSplits[]): DebtBalance[] {
  const owed = new Map<string, number>(); // key: `${fromMemberId}>${toMemberId}` -> cents

  for (const expense of expenses) {
    for (const split of expense.expense_splits) {
      if (split.is_settled) continue;
      if (!expense.paid_by) continue;
      if (split.member_id === expense.paid_by) continue;

      const key = `${split.member_id}>${expense.paid_by}`;
      const cents = Math.round(split.amount_owed * 100);
      owed.set(key, (owed.get(key) ?? 0) + cents);
    }
  }

  const seenPairs = new Set<string>();
  const balances: DebtBalance[] = [];

  for (const key of owed.keys()) {
    const [a, b] = key.split('>');
    const pairKey = [a, b].sort().join('|');
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    const aOwesB = owed.get(`${a}>${b}`) ?? 0;
    const bOwesA = owed.get(`${b}>${a}`) ?? 0;
    const netCents = aOwesB - bOwesA;

    if (netCents > 0) {
      balances.push({ fromMemberId: a, toMemberId: b, amount: netCents / 100 });
    } else if (netCents < 0) {
      balances.push({ fromMemberId: b, toMemberId: a, amount: -netCents / 100 });
    }
  }

  return balances;
}

// An expense with no one still owing anyone else for it reads as "settled" in
// the list — every split that isn't the payer's own has been marked paid.
export function isExpenseFullySettled(expense: ExpenseWithSplits) {
  return expense.expense_splits.every(
    (split) => split.member_id === expense.paid_by || split.is_settled,
  );
}
