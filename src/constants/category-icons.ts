import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

// Categories store a small `icon` key (see the `categories.icon` column)
// instead of a platform icon name directly, so the available icon set is
// curated in one place and can grow without touching the database.
export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export const CATEGORY_ICONS: Record<string, { ios: SFSymbol; android: AndroidSymbol }> = {
  food: { ios: 'fork.knife', android: 'restaurant' },
  cleaning: { ios: 'sparkles', android: 'cleaning_services' },
  water: { ios: 'drop.fill', android: 'water_drop' },
  electricity: { ios: 'bolt.fill', android: 'bolt' },
  gas: { ios: 'flame.fill', android: 'local_fire_department' },
  internet: { ios: 'wifi', android: 'wifi' },
  shopping: { ios: 'bag.fill', android: 'shopping_bag' },
  entertainment: { ios: 'gamecontroller.fill', android: 'sports_esports' },
  transport: { ios: 'car.fill', android: 'directions_car' },
  health: { ios: 'cross.case.fill', android: 'medical_services' },
  other: { ios: 'tag.fill', android: 'sell' },
};

export const DEFAULT_CATEGORY_ICON_KEY: CategoryIconKey = 'other';

export function getCategoryIconSymbol(iconKey: string | null) {
  return CATEGORY_ICONS[iconKey ?? ''] ?? CATEGORY_ICONS[DEFAULT_CATEGORY_ICON_KEY];
}
