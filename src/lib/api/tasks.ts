import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { TaskPriority, TaskStatus } from '@/lib/tasks';
import type { Tables } from '@/types/database';

export type TaskRow = Tables<'tasks'> & { task_assignees: { member_id: string }[] };
export type TaskCommentRow = Tables<'task_comments'>;
export type TaskInput = {
  id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeIds: string[];
};

export async function fetchTasks(householdId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, task_assignees(member_id)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function saveTask(input: TaskInput) {
  const { data, error } = await supabase.rpc('save_task', {
    p_task_id: input.id,
    p_title: input.title.trim(),
    p_description: input.description.trim(),
    p_status: input.status,
    p_priority: input.priority,
    p_due_date: input.dueDate ?? undefined,
    p_assignee_ids: input.assigneeIds,
  });
  if (error) throw error;
  return data;
}
export async function setTaskStatus(id: string, status: TaskStatus) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
export async function fetchTaskComments(
  householdId: string,
  taskId: string,
): Promise<TaskCommentRow[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('household_id', householdId)
    .eq('task_id', taskId)
    .order('created_at')
    .order('id');
  if (error) throw error;
  return data;
}
export async function saveTaskComment(input: {
  id?: string;
  taskId: string;
  householdId: string;
  authorId: string;
  body: string;
}) {
  const request = input.id
    ? supabase.from('task_comments').update({ body: input.body.trim() }).eq('id', input.id)
    : supabase.from('task_comments').insert({
        task_id: input.taskId,
        household_id: input.householdId,
        author_id: input.authorId,
        body: input.body.trim(),
      });
  const { data, error } = await request.select('id').single();
  if (error) throw error;
  return data;
}
export async function deleteTaskComment(id: string) {
  const { error } = await supabase.from('task_comments').delete().eq('id', id);
  if (error) throw error;
}

export type NudgeResult =
  { status: 'sent'; sent: number; emailed: number } | { status: 'cooldown' };

// Unlike other notifications this is awaited: the person tapping "nudge" needs
// to know whether anyone was reached or the server's cooldown refused it.
export async function nudgeTask(taskId: string): Promise<NudgeResult> {
  const { data, error } = await supabase.functions.invoke<{ sent: number; emailed?: number }>(
    'notify',
    { body: { kind: 'task_nudge', entityId: taskId } },
  );
  if (error instanceof FunctionsHttpError && error.context.status === 429) {
    return { status: 'cooldown' };
  }
  if (error) throw error;
  return { status: 'sent', sent: data?.sent ?? 0, emailed: data?.emailed ?? 0 };
}
