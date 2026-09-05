import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import * as householdApi from '@/lib/api/household';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useHouseholdQuery(enabled = true) {
  return useQuery({ queryKey: queryKeys.household, queryFn: householdApi.fetchHousehold, enabled });
}

export function useMembersQuery(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members(householdId),
    queryFn: householdApi.fetchHouseholdMembers,
    enabled: !!householdId,
  });
}

// Any roommate adding/editing themselves should update everyone else's screen
// immediately (CLAUDE.md: realtime sync is a hard requirement).
export function useHouseholdRealtime(householdId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`household-members-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `household_id=eq.${householdId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.members(householdId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, queryClient]);
}

export function useCreateHouseholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdName, myName }: { householdName: string; myName: string }) =>
      householdApi.createHouseholdRemote(householdName, myName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.household });
      queryClient.invalidateQueries({ queryKey: ['household_members'] });
    },
  });
}

export function useJoinHouseholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, myName }: { code: string; myName: string }) =>
      householdApi.joinHouseholdRemote(code, myName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.household });
      queryClient.invalidateQueries({ queryKey: ['household_members'] });
    },
  });
}

export function useUpdateMemberMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      updates,
    }: {
      memberId: string;
      updates: Partial<Pick<householdApi.MemberRow, 'name' | 'iban'>>;
    }) => householdApi.updateMemberRemote(memberId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(householdId) }),
  });
}

// Leaving is a security-definer RPC (not a plain delete): if the caller is the
// last member, it also deletes the household itself, so an empty, invite-only,
// permanently-invisible-under-RLS household can never be left behind.
export function useLeaveHouseholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => householdApi.leaveHouseholdRemote(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.household });
      queryClient.invalidateQueries({ queryKey: ['household_members'] });
    },
  });
}
