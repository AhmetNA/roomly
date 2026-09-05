import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Realtime subscriptions push fresh data; refetch-on-focus would just add
      // redundant network calls on top of that.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
