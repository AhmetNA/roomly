import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

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

export function useAddShoppingItemMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      categoryId,
      addedBy,
    }: {
      name: string;
      categoryId: string | null;
      addedBy: string;
    }) => shoppingApi.addShoppingItemRemote(householdId ?? '', name, categoryId, addedBy),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) }),
  });
}

export function useToggleShoppingItemMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPurchased }: { id: string; isPurchased: boolean }) =>
      shoppingApi.toggleShoppingItemPurchasedRemote(id, isPurchased),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) }),
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
