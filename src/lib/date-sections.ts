// Groups already-date-sorted items into "Bugün" / "Dün" / formatted-date
// sections for display, à la a bank statement or chat history. Assumes items
// arrive sorted (newest first is fine) — this only groups, it doesn't sort.
export function groupByDateSection<T>(
  items: T[],
  getDateString: (item: T) => string,
  locale: string,
  labels: { today: string; yesterday: string },
): { title: string; data: T[] }[] {
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sections: { key: number; title: string; data: T[] }[] = [];

  for (const item of items) {
    const day = startOfDay(new Date(getDateString(item)));
    const key = day.getTime();

    let section = sections.find((s) => s.key === key);
    if (!section) {
      const title =
        key === today.getTime()
          ? labels.today
          : key === yesterday.getTime()
            ? labels.yesterday
            : formatter.format(day);
      section = { key, title, data: [] };
      sections.push(section);
    }
    section.data.push(item);
  }

  return sections.map(({ title, data }) => ({ title, data }));
}
