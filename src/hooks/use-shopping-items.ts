import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { notifyHousehold } from '@/lib/api/notifications';
import * as shoppingApi from '@/lib/api/shopping-items';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useShoppingItemsQuery(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.shoppingItems(householdId),
    queryFn: shoppingApi.fetchShoppingItems,
    enabled: !!householdId,
  });
}

export function useShoppingItemsRealtime(householdId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`shopping-items-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `household_id=eq.${householdId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, queryClient]);
}

export function useAddShoppingItemsMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      names,
      categoryId,
      addedBy,
    }: {
      names: string[];
      categoryId: string | null;
      addedBy: string;
    }) => shoppingApi.addShoppingItemsRemote(householdId ?? '', names, categoryId, addedBy),
    onSuccess: (items) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) });
      // One add can insert several rows, but the notify function composes its
      // text from a single item — pushing per row would fire N notifications
      // for one action. The last row is the one at the top of their list.
      const newest = items?.[items.length - 1];
      if (newest) notifyHousehold({ kind: 'item_added', entityId: newest.id });
    },
  });
}

export function useUpdateShoppingItemMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      categoryId,
    }: {
      id: string;
      name: string;
      categoryId: string | null;
    }) => shoppingApi.updateShoppingItemRemote(id, name, categoryId),
    // Renaming something already on the list is a correction, not news.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) }),
  });
}

export function useToggleShoppingItemMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      isPurchased,
      purchasedBy,
    }: {
      id: string;
      isPurchased: boolean;
      purchasedBy: string | null;
    }) => shoppingApi.toggleShoppingItemPurchasedRemote(id, isPurchased, purchasedBy),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) });
      // Only buying is worth a notification; un-ticking a mistake is not.
      if (variables.isPurchased) {
        notifyHousehold({ kind: 'item_purchased', entityId: variables.id });
      }
    },
  });
}

export function useRemoveShoppingItemMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shoppingApi.removeShoppingItemRemote(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) }),
  });
}
