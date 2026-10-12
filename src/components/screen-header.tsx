import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { RefreshAction } from '@/components/refresh-action';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function ScreenHeader({
  title,
  refreshing,
  onRefresh,
  actions,
}: {
  title: string;
  refreshing: boolean;
  onRefresh: () => void;
  actions?: ReactNode;
}) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <View style={styles.actions}>
        <RefreshAction refreshing={refreshing} onPress={onRefresh} />
        {actions}
      </View>
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
