import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryRow } from '@/lib/api/categories';

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  noneLabel,
}: {
  categories: CategoryRow[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  noneLabel: string;
}) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
      <Chip label={noneLabel} selected={selectedId === null} onPress={() => onSelect(null)} />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          selected={selectedId === category.id}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );

  function Chip({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? theme.accent : theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemedText type="small" themeColor={selected ? 'onAccent' : undefined}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginRight: Spacing.two,
  },
});
