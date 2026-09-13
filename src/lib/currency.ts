export const CURRENCY_CODES = ['TRY', 'USD', 'EUR'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

export function normalizeCurrencyCode(value: string | null | undefined): CurrencyCode {
  return CURRENCY_CODES.includes(value as CurrencyCode) ? (value as CurrencyCode) : 'TRY';
}

export function formatMoney(amount: number, currency: CurrencyCode, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
