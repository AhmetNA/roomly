import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import * as settlementsApi from '@/lib/api/settlements';
import { notifyHousehold } from '@/lib/api/notifications';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useSettlementsQuery(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.settlements(householdId),
    queryFn: settlementsApi.fetchSettlements,
    enabled: !!householdId,
  });
}

export function useSettlementsRealtime(householdId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`settlements-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlements',
          filter: `household_id=eq.${householdId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, queryClient]);
}

export function useRecordSettlementMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fromMemberId,
      toMemberId,
      amount,
    }: {
      fromMemberId: string;
      toMemberId: string;
      amount: number;
    }) => settlementsApi.recordSettlementRemote(fromMemberId, toMemberId, amount),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) });
      notifyHousehold({ kind: 'debt_settled', memberId: variables.toMemberId });
    },
  });
}
