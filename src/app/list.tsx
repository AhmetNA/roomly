import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddShoppingItemModal } from '@/components/add-shopping-item-modal';
import { EmptyState } from '@/components/empty-state';
import { FloatingActionButton } from '@/components/floating-action-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategoriesQuery, useCategoriesRealtime } from '@/hooks/use-categories';
import { useHouseholdQuery, useMembersQuery } from '@/hooks/use-household';
import { useSession } from '@/hooks/use-session';
import {
  useAddShoppingItemMutation,
  useRemoveShoppingItemMutation,
  useShoppingItemsQuery,
  useShoppingItemsRealtime,
  useToggleShoppingItemMutation,
} from '@/hooks/use-shopping-items';
import { useTheme } from '@/hooks/use-theme';
import type { ShoppingItemRow } from '@/lib/api/shopping-items';

export default function ShoppingListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const session = useSession();

  const { data: household } = useHouseholdQuery();
  const householdId = household?.id;
  const { data: members = [] } = useMembersQuery(householdId);
  const { data: categories = [] } = useCategoriesQuery(householdId);
  const { data: items = [], isLoading } = useShoppingItemsQuery(householdId);
  useCategoriesRealtime(householdId);
  useShoppingItemsRealtime(householdId);

  const addItem = useAddShoppingItemMutation(householdId);
  const toggleItem = useToggleShoppingItemMutation(householdId);
  const removeItem = useRemoveShoppingItemMutation(householdId);

  const [modalVisible, setModalVisible] = useState(false);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  const sections = useMemo(() => {
    const toBuy = items.filter((item) => !item.is_purchased);
    const purchased = items.filter((item) => item.is_purchased);
    return [
      { title: t('list.toBuySection'), data: toBuy },
      { title: t('list.purchasedSection'), data: purchased },
    ].filter((section) => section.data.length > 0);
  }, [items, t]);

  function handleDelete(item: ShoppingItemRow) {
    Alert.alert(t('list.deleteItemConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeItem.mutate(item.id) },
    ]);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]} edges={['top']}>
          <ActivityIndicator color={theme.accent} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScreenHeader title={t('list.title')} />
        {items.length === 0 ? (
          <EmptyState
            icon={{ ios: 'cart', android: 'shopping_cart' }}
            title={t('list.empty')}
            hint={t('list.emptyHint')}
          />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderSectionHeader={({ section }) => (
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
                {section.title.toUpperCase()}
              </ThemedText>
            )}
            renderItem={({ item }) => (
              <Pressable
                onLongPress={() => handleDelete(item)}
                onPress={() => toggleItem.mutate({ id: item.id, isPurchased: !item.is_purchased })}
              >
                <ThemedView type="backgroundElement" style={styles.itemRow}>
                  <SymbolView
                    name={
                      item.is_purchased
                        ? { ios: 'checkmark.circle.fill', android: 'check_circle' }
                        : { ios: 'circle', android: 'circle' }
                    }
                    size={22}
                    tintColor={item.is_purchased ? theme.success : theme.textSecondary}
                  />
                  <View style={styles.itemInfo}>
                    <ThemedText
                      type="default"
                      themeColor={item.is_purchased ? 'textSecondary' : 'text'}
                      style={item.is_purchased ? styles.itemNamePurchased : undefined}
                    >
                      {item.name}
                    </ThemedText>
                    {item.category_id && categoryNameById.has(item.category_id) && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {categoryNameById.get(item.category_id)}
                      </ThemedText>
                    )}
                  </View>
                </ThemedView>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
      <FloatingActionButton
        accessibilityLabel={t('list.addButton')}
        onPress={() => setModalVisible(true)}
      />

      <AddShoppingItemModal
        visible={modalVisible}
        householdId={householdId}
        onClose={() => setModalVisible(false)}
        onSubmit={(name, categoryId) => {
          const myMember = members.find((member) => member.user_id === session?.user.id);
          if (!householdId || !myMember) return;
          addItem.mutate({ name, categoryId, addedBy: myMember.id });
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  sectionHeader: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  itemInfo: {
    gap: Spacing.half,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
  },
});
