import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type NotifyEvent =
  | { kind: 'expense_added'; entityId: string }
  | { kind: 'item_added'; entityId: string }
  | { kind: 'item_purchased'; entityId: string }
  | { kind: 'debt_settled'; memberId: string };

// expo-notifications is a native module and Expo's push service has no web
// support, so the web build skips all of this and keeps relying on realtime
// updates while the tab is open.
const PUSH_SUPPORTED = Platform.OS !== 'web';

// Without a handler, a notification that arrives while the app is open is
// swallowed — housemates act on these while using the app, so show it anyway.
if (PUSH_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerPushToken(language: string) {
  // Push tokens are only issued to real hardware; simulators would fail here.
  if (!PUSH_SUPPORTED || !Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  // Refresh the signed-in user's device registration on subsequent launches.
  const { error } = await supabase.from('push_tokens').upsert(
    {
      token,
      user_id: data.user.id,
      locale: language.startsWith('en') ? 'en' : 'tr',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  if (error) throw error;
}

// Fire-and-forget: the action the user took has already succeeded, so a failed
// notification must never surface as a failure or hold up the UI.
export function notifyHousehold(event: NotifyEvent) {
  supabase.functions.invoke('notify', { body: event }).catch(() => {});
}
