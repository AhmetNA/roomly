import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import * as expensesApi from '@/lib/api/expenses';
import { notifyHousehold } from '@/lib/api/notifications';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useExpensesQuery(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses(householdId),
    queryFn: expensesApi.fetchExpenses,
    enabled: !!householdId,
  });
}

export function useExpensesRealtime(householdId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!householdId) return;

    // expense_splits changes (created with the expense, settled later) aren't
    // filterable by household_id directly, so also listen on that table
    // unfiltered and let the invalidation re-fetch settle which rows matter.
    const channel = supabase
      .channel(`expenses-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `household_id=eq.${householdId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.expenses(householdId) }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_splits' }, () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses(householdId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, queryClient]);
}

export function useCreateExpenseMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.createExpenseRemote,
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(householdId) });
      if (expense) notifyHousehold({ kind: 'expense_added', entityId: expense.id });
    },
  });
}

export function useUpdateExpenseMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.updateExpenseRemote,
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(householdId) });
      if (expense) notifyHousehold({ kind: 'expense_edited', entityId: expense.id });
    },
  });
}

export function useRemoveExpenseMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.removeExpenseRemote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.expenses(householdId) }),
  });
}

export function useSettleDebtMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromMemberId, toMemberId }: { fromMemberId: string; toMemberId: string }) =>
      expensesApi.settleDebtRemote(fromMemberId, toMemberId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(householdId) });
      notifyHousehold({ kind: 'debt_settled', memberId: variables.toMemberId });
    },
  });
}
