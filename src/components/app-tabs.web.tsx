import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View, StyleSheet } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="creditcard" materialIcon="credit_card">
              {t('tabs.expenses')}
            </TabButton>
          </TabTrigger>
          <TabTrigger name="list" href="/list" asChild>
            <TabButton icon="cart" materialIcon="shopping_cart">
              {t('tabs.list')}
            </TabButton>
          </TabTrigger>
          <TabTrigger name="people" href="/people" asChild>
            <TabButton icon="person.2" materialIcon="people">
              {t('tabs.people')}
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: SFSymbol; materialIcon: AndroidSymbol };

export function TabButton({ children, isFocused, icon, materialIcon, ...props }: TabButtonProps) {
  const theme = useTheme();

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}
      >
        <SymbolView
          name={{ ios: icon, android: materialIcon, web: materialIcon }}
          tintColor={isFocused ? theme.text : theme.textSecondary}
          size={16}
        />
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    // The container spans the full width so the pill can center, but only the
    // pill itself should catch taps — without box-none it sits on top of the
    // whole bottom strip and swallows presses meant for the button underneath.
    <View {...props} pointerEvents="box-none" style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
