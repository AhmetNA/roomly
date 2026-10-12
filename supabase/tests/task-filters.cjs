// Node 22.13+ supports running this with: node --experimental-strip-types supabase/tests/task-filters.cjs
const assert = require('node:assert/strict');
const { dateKey, parseDateKey, isTaskOverdue, filterTasks } = require('../../src/lib/tasks.ts');
const base = {
  title: 'Task',
  description: '',
  status: 'todo',
  priority: 'normal',
  due_date: null,
  created_at: '2026-10-01',
  task_assignees: [],
};
const tasks = [
  { ...base, title: 'Old', due_date: '2026-10-11', task_assignees: [{ member_id: 'me' }] },
  { ...base, title: 'Today', due_date: '2026-10-12' },
  { ...base, title: 'Done', status: 'done', due_date: '2026-10-01' },
  { ...base, title: 'High', priority: 'high' },
  { ...base, title: 'Normal' },
  { ...base, title: 'Later', description: 'Kitchen', due_date: '2026-10-15' },
];
assert.equal(dateKey(parseDateKey('2026-10-12')), '2026-10-12');
assert.equal(isTaskOverdue(tasks[1], '2026-10-12'), false, 'today is not overdue');
assert.equal(isTaskOverdue(tasks[2], '2026-10-12'), false, 'completed tasks are not overdue');
assert.deepEqual(
  filterTasks(tasks, 'mine', 'me', '', '2026-10-12').map((t) => t.title),
  ['Old'],
);
assert.deepEqual(filterTasks(tasks, 'mine', undefined, '', '2026-10-12'), []);
assert.deepEqual(
  filterTasks(tasks, 'overdue', undefined, '', '2026-10-12').map((t) => t.title),
  ['Old'],
);
assert.deepEqual(
  filterTasks(tasks, 'all', undefined, ' kitchen ', '2026-10-12').map((t) => t.title),
  ['Later'],
);
assert.deepEqual(
  filterTasks(tasks, 'open', undefined, '', '2026-10-12').map((t) => t.title),
  ['Old', 'Today', 'Later', 'High', 'Normal'],
);
assert.equal(filterTasks(tasks, 'all', undefined, '', '2026-10-12').at(-1).title, 'Done');
assert.equal(tasks[0].title, 'Old', 'sorting preserves the source array');
assert.equal(
  filterTasks([{ ...base, title: 'İnternet paketini kontrol et' }], 'all', undefined, 'internet')
    .length,
  1,
);
assert.equal(
  filterTasks([{ ...base, title: 'Çamaşırları yıka' }], 'all', undefined, 'camasirlari').length,
  1,
);
console.log(
  'PASS: local calendar date, overdue boundaries, assignee/search filters, due/priority ordering',
);
