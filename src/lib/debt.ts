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

export type DebtBreakdownEntry = {
  expenseId: string;
  title: string;
  createdAt: string;
  // Positive means this expense pushes the balance toward `from` owing `to`;
  // negative means it pulls the other way. They sum to the net balance shown.
  amount: number;
};

// What a single pairwise balance is actually made of. A net debt can hide
// expenses running in both directions, so entries keep their sign instead of
// only listing what one side owes.
export function computeDebtBreakdown(
  expenses: ExpenseWithSplits[],
  fromMemberId: string,
  toMemberId: string,
): DebtBreakdownEntry[] {
  const entries: DebtBreakdownEntry[] = [];

  for (const expense of expenses) {
    let cents = 0;
    for (const debt of expense.expense_debts) {
      if (debt.is_settled) continue;
      if (debt.from_member_id === fromMemberId && debt.to_member_id === toMemberId) {
        cents += Math.round(debt.amount * 100);
      } else if (debt.from_member_id === toMemberId && debt.to_member_id === fromMemberId) {
        cents -= Math.round(debt.amount * 100);
      }
    }
    if (cents !== 0) {
      entries.push({
        expenseId: expense.id,
        title: expense.title,
        createdAt: expense.created_at,
        amount: cents / 100,
      });
    }
  }

  return entries;
}

// An expense with no one still owing anyone else for it reads as "settled" in
// the list — every debt it generated has been marked paid (or it never
// generated any, e.g. a single person paying only for themselves).
export function isExpenseFullySettled(expense: ExpenseWithSplits) {
  return expense.expense_debts.every((debt) => debt.is_settled);
}
