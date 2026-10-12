export type DateSectionKind = 'day' | 'month';

// Groups already-date-sorted items for display, à la a bank statement: the
// current month day by day ("Bugün" / "Dün" / formatted date), earlier months one
// section each ("Eylül", or "Eylül 2025" for another year). Assumes items arrive
// sorted (newest first is fine) — this only groups, it doesn't sort.
export function groupByDateSection<T>(
  items: T[],
  getDateString: (item: T) => string,
  locale: string,
  labels: { today: string; yesterday: string },
): { key: string; title: string; kind: DateSectionKind; data: T[] }[] {
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const dayFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  const monthYearFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });

  const sections: { key: string; title: string; kind: DateSectionKind; data: T[] }[] = [];

  for (const item of items) {
    const day = startOfDay(new Date(getDateString(item)));
    const kind: DateSectionKind = day < monthStart ? 'month' : 'day';
    const key =
      kind === 'month' ? `month-${day.getFullYear()}-${day.getMonth()}` : String(day.getTime());

    let section = sections.find((s) => s.key === key);
    if (!section) {
      const title =
        kind === 'month'
          ? (day.getFullYear() === today.getFullYear()
              ? monthFormatter
              : monthYearFormatter
            ).format(day)
          : day.getTime() === today.getTime()
            ? labels.today
            : day.getTime() === yesterday.getTime()
              ? labels.yesterday
              : dayFormatter.format(day);
      section = { key, title, kind, data: [] };
      sections.push(section);
    }
    section.data.push(item);
  }

  return sections;
}
