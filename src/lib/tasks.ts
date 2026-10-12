export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';
export type TaskFilter = 'open' | 'mine' | 'overdue' | 'done' | 'all';

// Dates represent household calendar days, never UTC timestamps.
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}
export function relativeDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
export function isTaskOverdue(
  task: { status: string; due_date: string | null },
  today = dateKey(),
) {
  return task.status !== 'done' && task.due_date !== null && task.due_date < today;
}
type SortableTask = {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  task_assignees: { member_id: string }[];
};
function normalizeTaskSearch(value: string): string {
  return value.trim().replace(/[ıİ]/g, 'i').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function filterTasks<T extends SortableTask>(
  tasks: T[],
  filter: TaskFilter,
  memberId: string | undefined,
  search: string,
  today = dateKey(),
): T[] {
  const needle = normalizeTaskSearch(search);
  const rank: Record<string, number> = { high: 0, normal: 1, low: 2 };
  return tasks
    .filter((task) => {
      if (needle && !normalizeTaskSearch(`${task.title} ${task.description}`).includes(needle))
        return false;
      if (filter === 'mine')
        return task.status !== 'done' && task.task_assignees.some((a) => a.member_id === memberId);
      if (filter === 'overdue') return isTaskOverdue(task, today);
      if (filter === 'done') return task.status === 'done';
      if (filter === 'open') return task.status !== 'done';
      return true;
    })
    .sort(
      (a, b) =>
        Number(a.status === 'done') - Number(b.status === 'done') ||
        (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') ||
        rank[a.priority] - rank[b.priority] ||
        b.created_at.localeCompare(a.created_at),
    );
}
