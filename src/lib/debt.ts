import type { SettlementRow } from '@/lib/api/settlements';
import type { ExpenseWithSplits } from '@/lib/api/expenses';

export type DebtBalance = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
};

// Every member's net position in cents: negative means they owe the household
// that much, positive means the household owes them. Built from the materialized
// expense_debts ledger (already proportional across multiple payers — see
// create_expense) minus everything that's since been paid back through the
// settlements ledger. Settled legacy rows are skipped: they were zeroed out
// before settlements existed and have no settlement row, so counting them would
// double up.
function computeNetCents(
  expenses: ExpenseWithSplits[],
  settlements: SettlementRow[],
): Map<string, number> {
  const net = new Map<string, number>();
  const add = (memberId: string, cents: number) =>
    net.set(memberId, (net.get(memberId) ?? 0) + cents);

  for (const expense of expenses) {
    for (const debt of expense.expense_debts) {
      if (debt.is_settled) continue;
      const cents = Math.round(debt.amount * 100);
      add(debt.from_member_id, -cents);
      add(debt.to_member_id, cents);
    }
  }

  for (const settlement of settlements) {
    const cents = Math.round(settlement.amount * 100);
    // Paying money out settles what you owed: your net moves up.
    add(settlement.from_member_id, cents);
    add(settlement.to_member_id, -cents);
  }

  return net;
}

// Reduce every net position to the fewest transfers that clear them: repeatedly
// send from the biggest debtor to the biggest creditor. Produces at most n-1
// transfers for n members, which is what "settle everything in one payment each"
// asks for — at the cost of losing which original expense a transfer traces to.
export function computeSimplifiedTransfers(
  expenses: ExpenseWithSplits[],
  settlements: SettlementRow[],
): DebtBalance[] {
  const net = computeNetCents(expenses, settlements);

  const debtors: { memberId: string; cents: number }[] = [];
  const creditors: { memberId: string; cents: number }[] = [];
  for (const [memberId, cents] of net) {
    if (cents < 0) debtors.push({ memberId, cents: -cents });
    else if (cents > 0) creditors.push({ memberId, cents });
  }

  // Deterministic order so the same balances always yield the same transfers.
  debtors.sort((a, b) => b.cents - a.cents || a.memberId.localeCompare(b.memberId));
  creditors.sort((a, b) => b.cents - a.cents || a.memberId.localeCompare(b.memberId));

  const transfers: DebtBalance[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].cents, creditors[j].cents);
    // Rounding in the ledger can leave a stray kuruş with no real counterpart;
    // a sub-kuruş transfer is noise, not a debt.
    if (pay > 0) {
      transfers.push({
        fromMemberId: debtors[i].memberId,
        toMemberId: creditors[j].memberId,
        amount: pay / 100,
      });
    }
    debtors[i].cents -= pay;
    creditors[j].cents -= pay;
    if (debtors[i].cents === 0) i += 1;
    if (creditors[j].cents === 0) j += 1;
  }

  return transfers;
}

// An expense with no one still owing anyone else for it reads as "settled" in
// the list. With household-wide simplification a single payment can no longer be
// traced back to one expense, so this only ever reflects legacy per-expense
// settlement (or an expense that never created a debt, e.g. one person paying
// only for themselves). New settlements live in the settlements ledger and show
// up in the debt summary instead.
export function isExpenseFullySettled(expense: ExpenseWithSplits) {
  return expense.expense_debts.every((debt) => debt.is_settled);
}
