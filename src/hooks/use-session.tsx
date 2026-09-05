import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

// `undefined` = still checking AsyncStorage for a persisted session, `null` = checked, none found.
const SessionContext = createContext<Session | null | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      // Without this, a signed-out user's household/members data stays cached and
      // flashes briefly for the next person who signs in on the same device.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
