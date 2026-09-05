import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  icon: SymbolViewProps['name'];
  title: string;
  hint: string;
};

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <SymbolView name={icon} size={44} tintColor={theme.textSecondary} />
      <ThemedText type="default" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        {hint}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
  },
});
