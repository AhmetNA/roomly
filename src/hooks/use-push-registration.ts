import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { registerPushToken } from '@/lib/api/notifications';

// Wait for household membership before asking for permission. Returning from
// Settings or recovering connectivity should retry a previously failed registration.
export function usePushRegistration(enabled: boolean) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!enabled) return;
    let registering = false;
    let active = true;
    const register = async () => {
      if (!active || registering) return;
      registering = true;
      try {
        await registerPushToken(i18n.language);
      } catch {
        console.warn('Push registration failed; it will retry when the app becomes active.');
      } finally {
        registering = false;
      }
    };
    void register();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void register();
    });
    return () => {
      active = false;
      listener.remove();
    };
  }, [enabled, i18n.language]);
}
