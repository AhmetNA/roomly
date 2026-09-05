import { useEffect, useState } from 'react';

import { useHouseholdStore } from '@/lib/store';

export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(useHouseholdStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useHouseholdStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
