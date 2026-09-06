import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';

import { AppSymbol } from '@/components/app-symbol';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Pull-to-refresh does nothing on web: react-native-web's RefreshControl drops
// onRefresh and renders a plain View, so the gesture never fires. Web gets an
// explicit button instead, and native keeps the pull gesture on its own.
export function RefreshAction({
  refreshing,
  onPress,
}: {
  refreshing: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (Platform.OS !== 'web') return null;

  return (
    <Pressable
      onPress={onPress}
      disabled={refreshing}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('common.refresh')}
      style={styles.button}
    >
      {refreshing ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <AppSymbol
          name={{ ios: 'arrow.clockwise', android: 'refresh' }}
          size={22}
          tintColor={theme.accent}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: Spacing.one,
  },
});
