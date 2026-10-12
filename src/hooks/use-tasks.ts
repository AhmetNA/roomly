import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId } from 'react';

import * as api from '@/lib/api/tasks';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';
import type { TaskStatus } from '@/lib/tasks';

export function useTasksQuery(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks(householdId),
    queryFn: () => api.fetchTasks(householdId!),
    enabled: !!householdId,
  });
}
export function useTaskCommentsQuery(householdId: string | undefined, taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.taskComments(householdId, taskId),
    queryFn: () => api.fetchTaskComments(householdId!, taskId!),
    enabled: !!householdId && !!taskId,
  });
}
export function useTasksRealtime(householdId: string | undefined) {
  const client = useQueryClient();
  // Reused topics return an already-subscribed channel and .on() would throw.
  const instanceId = useId();
  useEffect(() => {
    if (!householdId) return;
    const channel = supabase.channel(`tasks-${householdId}-${instanceId}`);
    // DELETE events contain only primary keys and cannot match household filters.
    // RLS protects reads; all events simply invalidate this household's cache.
    for (const table of ['tasks', 'task_assignees', 'task_comments']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        client.invalidateQueries({ queryKey: queryKeys.tasks(householdId) });
        client.invalidateQueries({ queryKey: ['task_comments', householdId] });
      });
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [householdId, instanceId, client]);
}
export function useTaskMutations(householdId: string | undefined) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.tasks(householdId) });
  const refreshComments = () =>
    client.invalidateQueries({ queryKey: ['task_comments', householdId] });
  return {
    save: useMutation({ mutationFn: api.saveTask, onSuccess: refresh }),
    status: useMutation({
      mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
        api.setTaskStatus(id, status),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: api.deleteTask,
      onSuccess: async () => {
        await Promise.all([refresh(), refreshComments()]);
      },
    }),
    comment: useMutation({ mutationFn: api.saveTaskComment, onSuccess: refreshComments }),
    removeComment: useMutation({ mutationFn: api.deleteTaskComment, onSuccess: refreshComments }),
    nudge: useMutation({ mutationFn: api.nudgeTask }),
  };
}
