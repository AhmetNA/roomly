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
      // DELETE payloads only carry the primary key (default replica identity), so
      // a household_id filter never matches them; listen unfiltered and refetch.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'settlements' }, () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) }),
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
      currencyCode,
    }: {
      fromMemberId: string;
      toMemberId: string;
      amount: number;
      currencyCode: import('@/lib/currency').CurrencyCode;
    }) => settlementsApi.recordSettlementRemote(fromMemberId, toMemberId, amount, currencyCode),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) });
      notifyHousehold({ kind: 'debt_settled', memberId: variables.toMemberId });
    },
  });
}

export function useUpdateSettlementMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ settlementId, amount }: { settlementId: string; amount: number }) =>
      settlementsApi.updateSettlementRemote(settlementId, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) }),
  });
}

export function useDeleteSettlementMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => settlementsApi.deleteSettlementRemote(settlementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) }),
  });
}
