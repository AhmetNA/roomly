import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Shared chrome for every pageSheet modal: a drag-handle bar (Android's plain
// Modal has no native grabber the way iOS sheets do, so this gives both
// platforms the same "this is a sheet" affordance) plus a title and a
// dedicated close button — freeing the bottom of the form for just the
// primary action instead of pairing it with a redundant Cancel/Close.
export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.handle, { backgroundColor: theme.border }]} />
      <View style={styles.titleRow}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          <SymbolView
            name={{ ios: 'xmark', android: 'close' }}
            size={14}
            tintColor={theme.textSecondary}
            weight="bold"
          />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
