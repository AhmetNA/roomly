import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const RENT_REMINDER_KIND = 'rent-reminder';

// Rent reminders are now pushed by the server with each member's debts. Earlier
// test builds scheduled local ones on the device; drop those so nobody gets both.
export async function cancelLocalRentReminders() {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.kind === RENT_REMINDER_KIND)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}
