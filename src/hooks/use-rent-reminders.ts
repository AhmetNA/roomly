import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId } from 'react';

import { queryKeys } from '@/lib/query-keys';
import { cancelLocalRentReminders } from '@/lib/rent-reminder';
import { supabase } from '@/lib/supabase';

// Mounted at the root so a rent day changed by any housemate shows up on every
// signed-in device, whichever tab it happens to be on.
export function useRentReminders(householdId: string | undefined) {
  const queryClient = useQueryClient();
  const instanceId = useId();

  useEffect(() => {
    cancelLocalRentReminders().catch(() => {});
  }, []);

  useEffect(() => {
    if (!householdId) return;
    const channel = supabase
      .channel(`household-${householdId}-${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${householdId}` },
        () => queryClient.invalidateQueries({ queryKey: queryKeys.household }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [householdId, instanceId, queryClient]);
}
