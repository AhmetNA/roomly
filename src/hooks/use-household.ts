import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId } from 'react';

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
  // supabase.channel() returns an existing channel for a reused topic, and adding
  // listeners to an already-subscribed channel throws. Several mounted tabs use
  // this hook, so each instance needs its own topic.
  const instanceId = useId();

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`household-members-${householdId}-${instanceId}`)
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
  }, [householdId, instanceId, queryClient]);
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
    mutationFn: ({
      code,
      myName,
      memberId,
    }: {
      code: string;
      myName: string;
      memberId?: string | null;
    }) => householdApi.joinHouseholdRemote(code, myName, memberId),
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

// Leaving detaches the account while preserving the member and financial history.
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

export function useAddUnclaimedMemberMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: householdApi.addUnclaimedMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(householdId) }),
  });
}

export function useUpdateRentDayMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rentDay: number | null) => householdApi.updateRentDay(householdId!, rentDay),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.household }),
  });
}
