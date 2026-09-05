import type { ExpenseWithSplits } from '@/lib/api/expenses';

export type DebtBalance = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
};

// Net, pairwise balances only (no multi-hop simplification — that's explicitly
// post-MVP per CLAUDE.md). expense_debts is already a materialized ledger
// (computed at expense-creation time, proportional across multiple payers —
// see create_expense), so this just nets it out per pair and drops settled
// debts, which shouldn't count anymore.
export function computeDebtBalances(expenses: ExpenseWithSplits[]): DebtBalance[] {
  const owed = new Map<string, number>(); // key: `${fromMemberId}>${toMemberId}` -> cents

  for (const expense of expenses) {
    for (const debt of expense.expense_debts) {
      if (debt.is_settled) continue;
      const key = `${debt.from_member_id}>${debt.to_member_id}`;
      const cents = Math.round(debt.amount * 100);
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
// the list — every debt it generated has been marked paid (or it never
// generated any, e.g. a single person paying only for themselves).
export function isExpenseFullySettled(expense: ExpenseWithSplits) {
  return expense.expense_debts.every((debt) => debt.is_settled);
}
