import type { ExpenseWithSplits } from '@/lib/api/expenses';

function normalize(value: string): string {
  return value
    .replace(/[ıİ]/g, 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

type SearchField = { text: string; words: string[]; weight: number };
export type ExpenseSearchEntry = { expense: ExpenseWithSplits; fields: SearchField[] };

export function buildExpenseSearchIndex(
  expenses: ExpenseWithSplits[],
  memberNames: ReadonlyMap<string, string>,
  categoryNames: ReadonlyMap<string, string>,
): ExpenseSearchEntry[] {
  return expenses.map((expense) => {
    const values: [string, number][] = [
      [expense.title, 1],
      ...expense.expense_line_items.map((item): [string, number] => [item.name, 0.85]),
      [categoryNames.get(expense.category_id ?? '') ?? '', 0.75],
      ...expense.expense_payments.map((payment): [string, number] => [
        memberNames.get(payment.member_id) ?? '',
        0.65,
      ]),
      [String(expense.total_amount), 0.6],
      [expense.currency_code ?? '', 0.6],
    ];
    return {
      expense,
      fields: values.map(([value, weight]) => {
        const text = normalize(value);
        return { text, words: text.split(' '), weight };
      }),
    };
  });
}

// Adjacent transpositions count as one typo, so "makret" still finds "market".
function editDistance(left: string, right: string): number {
  const rows: number[][] = Array.from({ length: left.length + 1 }, (_, i) => [i]);
  rows[0] = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[left.length][right.length];
}

function tokenScore(token: string, field: SearchField): number {
  if (field.words.includes(token)) return 100 * field.weight;
  if (field.words.some((word) => word.startsWith(token))) return 90 * field.weight;
  if (field.text.includes(token)) return 80 * field.weight;
  // Short queries stay precise; longer words tolerate one or two mistakes.
  const allowedEdits = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0;
  if (allowedEdits === 0 || /^\d+$/.test(token)) return 0;
  let best = 0;
  for (const word of field.words) {
    if (Math.abs(word.length - token.length) > allowedEdits) continue;
    const distance = editDistance(token, word);
    if (distance <= allowedEdits) best = Math.max(best, (70 - distance * 10) * field.weight);
  }
  return best;
}

export function searchExpenses(index: ExpenseSearchEntry[], query: string): ExpenseWithSplits[] {
  const normalized = normalize(query);
  if (!normalized) return index.map((entry) => entry.expense);
  const tokens = [...new Set(normalized.split(' '))];
  return index
    .map((entry, order) => {
      let score = 0;
      for (const token of tokens) {
        const best = Math.max(...entry.fields.map((field) => tokenScore(token, field)));
        if (best === 0) return { expense: entry.expense, score: 0, order };
        score += best;
      }
      const title = entry.fields[0].text;
      score += title === normalized ? 100 : title.includes(normalized) ? 30 : 0;
      return { expense: entry.expense, score, order };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((result) => result.expense);
}
