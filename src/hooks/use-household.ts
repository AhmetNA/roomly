import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import * as householdApi from '@/lib/api/household';
import { supabase } from '@/lib/supabase';

const HOUSEHOLD_KEY = ['household'];
const MEMBERS_KEY = ['household_members'];

export function useHouseholdQuery(enabled = true) {
  return useQuery({ queryKey: HOUSEHOLD_KEY, queryFn: householdApi.fetchHousehold, enabled });
}

export function useMembersQuery() {
  return useQuery({ queryKey: MEMBERS_KEY, queryFn: householdApi.fetchHouseholdMembers });
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
        () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
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
      queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useJoinHouseholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, myName }: { code: string; myName: string }) =>
      householdApi.joinHouseholdRemote(code, myName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useUpdateMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      updates,
    }: {
      memberId: string;
      updates: Partial<Pick<householdApi.MemberRow, 'name' | 'iban'>>;
    }) => householdApi.updateMemberRemote(memberId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}

export function useLeaveHouseholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => householdApi.leaveHouseholdRemote(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}
