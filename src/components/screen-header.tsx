import { StyleSheet } from 'react-native';

import { RefreshAction } from '@/components/refresh-action';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function ScreenHeader({
  title,
  refreshing,
  onRefresh,
}: {
  title: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <RefreshAction refreshing={refreshing} onPress={onRefresh} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
});
