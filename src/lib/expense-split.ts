// All split math happens in integer cents to avoid float rounding drift, and any
// leftover cent from an uneven division goes to the payer — the usual Splitwise
// convention, and the only choice that keeps `sum(amountOwed) === totalAmount`
// exactly (the debt summary sums these, so an off-by-a-cent split would visibly
// not add up).
import type { SplitInput } from '@/lib/api/expenses';

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function assignRemainderToPayer(
  cents: number[],
  memberIds: string[],
  payerId: string,
  remainder: number,
) {
  const payerIndex = memberIds.indexOf(payerId);
  cents[payerIndex >= 0 ? payerIndex : 0] += remainder;
}

export function computeEqualSplit(
  totalAmount: number,
  memberIds: string[],
  payerId: string,
): SplitInput[] {
  const totalCents = toCents(totalAmount);
  const baseCents = Math.floor(totalCents / memberIds.length);
  const cents = memberIds.map(() => baseCents);
  const remainder = totalCents - baseCents * memberIds.length;
  assignRemainderToPayer(cents, memberIds, payerId, remainder);

  return memberIds.map((memberId, index) => ({
    memberId,
    amountOwed: cents[index] / 100,
    shares: null,
  }));
}

export function computeSharesSplit(
  totalAmount: number,
  shareByMemberId: Map<string, number>,
  payerId: string,
): SplitInput[] {
  const memberIds = [...shareByMemberId.keys()];
  const totalShares = [...shareByMemberId.values()].reduce((sum, shares) => sum + shares, 0);
  const totalCents = toCents(totalAmount);

  const cents = memberIds.map((memberId) =>
    Math.floor((totalCents * (shareByMemberId.get(memberId) ?? 0)) / totalShares),
  );
  const remainder = totalCents - cents.reduce((sum, value) => sum + value, 0);
  assignRemainderToPayer(cents, memberIds, payerId, remainder);

  return memberIds.map((memberId, index) => ({
    memberId,
    amountOwed: cents[index] / 100,
    shares: shareByMemberId.get(memberId) ?? null,
  }));
}

export function sumSplitAmounts(splits: SplitInput[]) {
  return Math.round(splits.reduce((sum, split) => sum + split.amountOwed, 0) * 100) / 100;
}
