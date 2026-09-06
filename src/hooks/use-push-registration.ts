import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { registerPushToken } from '@/lib/api/notifications';

// Registering asks for the notification permission, so it waits until someone
// is actually in a household — before that there is nothing to be notified
// about and the prompt would land on a cold start with no context.
export function usePushRegistration(enabled: boolean) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!enabled) return;
    registerPushToken(i18n.language);
  }, [enabled, i18n.language]);
}
