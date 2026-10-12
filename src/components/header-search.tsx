import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppSymbol } from '@/components/app-symbol';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SearchButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('common.search')}
      accessibilityState={{ expanded: active }}
      style={[styles.button, active && { backgroundColor: theme.backgroundElement }]}
    >
      <AppSymbol
        name={{ ios: 'magnifyingglass', android: 'search' }}
        size={22}
        tintColor={theme.accent}
      />
    </Pressable>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onClose,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const empty = value.trim().length === 0;

  // An empty search bar has no reason to stay once the keyboard goes away. Android's
  // back button hides the keyboard without blurring the input, hence the listener.
  useEffect(() => {
    if (!empty) return;
    const subscription = Keyboard.addListener('keyboardDidHide', onClose);
    return () => subscription.remove();
  }, [empty, onClose]);

  return (
    <View style={[styles.bar, { backgroundColor: theme.backgroundElement }]}>
      <AppSymbol
        name={{ ios: 'magnifyingglass', android: 'search' }}
        size={18}
        tintColor={theme.textSecondary}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.accent}
        style={[styles.input, { color: theme.text }]}
        autoFocus
        onBlur={() => {
          if (empty) onClose();
        }}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        maxLength={120}
      />
      <Pressable
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('common.closeSearch')}
        style={styles.close}
      >
        <AppSymbol
          name={{ ios: 'xmark.circle.fill', android: 'cancel' }}
          size={18}
          tintColor={theme.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: Spacing.one,
    borderRadius: Spacing.two,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    paddingLeft: Spacing.three,
    borderRadius: Spacing.three,
    height: 40,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    paddingVertical: 0,
  },
  close: {
    height: 40,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function CollapseAllButton({
  collapsed,
  onPress,
}: {
  collapsed: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t(collapsed ? 'common.expandAll' : 'common.collapseAll')}
      style={styles.button}
    >
      <AppSymbol
        name={
          collapsed
            ? { ios: 'rectangle.expand.vertical', android: 'unfold_more' }
            : { ios: 'rectangle.compress.vertical', android: 'unfold_less' }
        }
        size={22}
        tintColor={theme.accent}
      />
    </Pressable>
  );
}
