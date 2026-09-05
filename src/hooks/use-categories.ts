import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import * as categoriesApi from '@/lib/api/categories';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

export function useCategoriesQuery(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: categoriesApi.fetchCategories,
    enabled: !!householdId,
  });
}

export function useCategoriesRealtime(householdId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`categories-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `household_id=eq.${householdId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, queryClient]);
}

export function useAddCategoryMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoriesApi.addCategoryRemote(householdId ?? '', name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) }),
  });
}

export function useRenameCategoryMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      categoriesApi.renameCategoryRemote(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) }),
  });
}

export function useRemoveCategoryMutation(householdId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.removeCategoryRemote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
      // Deleting a category sets its items' category_id to null server-side.
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingItems(householdId) });
    },
  });
}
