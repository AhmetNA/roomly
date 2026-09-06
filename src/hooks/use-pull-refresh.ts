import { useState } from 'react';

// Wraps a set of React Query `refetch` functions into the
// {refreshing, onRefresh} shape RefreshControl expects. Realtime keeps things
// in sync while a screen is open, but a pull-to-refresh gives people an
// explicit, visible way to force a re-fetch from Supabase right now.
export function usePullRefresh(refetchers: (() => Promise<unknown>)[]) {
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all(refetchers.map((refetch) => refetch()));
    } finally {
      setRefreshing(false);
    }
  }

  return { refreshing, onRefresh };
}
