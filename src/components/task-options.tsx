import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function TaskOptions({
  options,
  selected,
  onSelect,
  multiple = false,
  disabled = false,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onSelect: (value: string) => void;
  multiple?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: active, disabled }}
            disabled={disabled}
            hitSlop={4}
            onPress={() => onSelect(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.accent : theme.backgroundElement,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <ThemedText type="smallBold" themeColor={active ? 'onAccent' : 'text'}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
});
