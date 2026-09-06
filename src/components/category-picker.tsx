import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppSymbol } from '@/components/app-symbol';
import { ThemedText } from '@/components/themed-text';
import { getCategoryIconSymbol } from '@/constants/category-icons';
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
      <Chip
        label={noneLabel}
        icon={null}
        selected={selectedId === null}
        onPress={() => onSelect(null)}
      />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          icon={category.icon}
          selected={selectedId === category.id}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );

  function Chip({
    label,
    icon,
    selected,
    onPress,
  }: {
    label: string;
    icon: string | null;
    selected: boolean;
    onPress: () => void;
  }) {
    const symbol = getCategoryIconSymbol(icon);
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
        {icon && (
          <AppSymbol
            name={{ ios: symbol.ios, android: symbol.android }}
            size={14}
            tintColor={selected ? theme.onAccent : theme.textSecondary}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginRight: Spacing.two,
  },
});
