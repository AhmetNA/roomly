import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddShoppingItemModal } from '@/components/add-shopping-item-modal';
import { AppSymbol, type AppSymbolName } from '@/components/app-symbol';
import { EmptyState } from '@/components/empty-state';
import { FloatingActionButton } from '@/components/floating-action-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryIconSymbol } from '@/constants/category-icons';
import { Spacing } from '@/constants/theme';
import { useCategoriesQuery, useCategoriesRealtime } from '@/hooks/use-categories';
import { useHouseholdQuery, useMembersQuery } from '@/hooks/use-household';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import { useSession } from '@/hooks/use-session';
import {
  useAddShoppingItemsMutation,
  useUpdateShoppingItemMutation,
  useRemoveShoppingItemMutation,
  useShoppingItemsQuery,
  useShoppingItemsRealtime,
  useToggleShoppingItemMutation,
} from '@/hooks/use-shopping-items';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { ShoppingItemRow } from '@/lib/api/shopping-items';

const UNCATEGORIZED_KEY = 'uncategorized';
const PURCHASED_KEY = 'purchased';

type ListSection = {
  key: string;
  title: string;
  icon: AppSymbolName | null;
  sortOrder: number;
  count: number;
  data: ShoppingItemRow[];
};

export default function ShoppingListScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const session = useSession();

  const householdQuery = useHouseholdQuery();
  const household = householdQuery.data;
  const householdId = household?.id;
  const membersQuery = useMembersQuery(householdId);
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const categoriesQuery = useCategoriesQuery(householdId);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const itemsQuery = useShoppingItemsQuery(householdId);
  const { data: items = [], isLoading } = itemsQuery;
  useCategoriesRealtime(householdId);
  useShoppingItemsRealtime(householdId);

  const { refreshing, onRefresh } = usePullRefresh([
    householdQuery.refetch,
    membersQuery.refetch,
    categoriesQuery.refetch,
    itemsQuery.refetch,
  ]);

  const addItems = useAddShoppingItemsMutation(householdId);
  const updateItem = useUpdateShoppingItemMutation(householdId);
  const toggleItem = useToggleShoppingItemMutation(householdId);
  const removeItem = useRemoveShoppingItemMutation(householdId);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItemRow | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const currentMemberId = members.find((member) => member.user_id === session?.user.id)?.id;

  const categoryById = useMemo(() => {
    const map = new Map<string, (typeof categories)[number]>();
    for (const category of categories) map.set(category.id, category);
    return map;
  }, [categories]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members) map.set(member.id, member.name);
    return map;
  }, [members]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.language],
  );

  const sections = useMemo<ListSection[]>(() => {
    const toBuy = items.filter((item) => !item.is_purchased);
    const purchased = items.filter((item) => item.is_purchased);

    // Sections come from the items, not from the category list: otherwise every
    // unused category would render an empty dropdown.
    const keys = Array.from(
      new Set(toBuy.map((item) => item.category_id ?? UNCATEGORIZED_KEY)),
    );

    const categorySections = keys
      .map((key) => {
        const category = key === UNCATEGORIZED_KEY ? undefined : categoryById.get(key);
        const data = toBuy.filter((item) => (item.category_id ?? UNCATEGORIZED_KEY) === key);
        return {
          key,
          title: category?.name ?? t('list.noCategory'),
          icon: category ? getCategoryIconSymbol(category.icon) : null,
          sortOrder: category?.sort_order ?? Number.MAX_SAFE_INTEGER,
          count: data.length,
          data,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, i18n.language));

    if (purchased.length === 0) return categorySections;

    return [
      ...categorySections,
      {
        key: PURCHASED_KEY,
        title: t('list.purchasedSection'),
        icon: { ios: 'checkmark.circle.fill', android: 'check_circle' } as AppSymbolName,
        sortOrder: Number.MAX_SAFE_INTEGER,
        count: purchased.length,
        data: purchased,
      },
    ];
  }, [items, categoryById, t, i18n.language]);

  // Collapsing only empties a section's data so its header stays visible.
  const visibleSections = useMemo(
    () => sections.map((section) => (collapsed[section.key] ? { ...section, data: [] } : section)),
    [sections, collapsed],
  );

  function handleLongPress(item: ShoppingItemRow) {
    showAlert(item.name, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('list.editItemTitle'),
        onPress: () => {
          setEditingItem(item);
          setModalVisible(true);
        },
      },
      { text: t('common.delete'), style: 'destructive', onPress: () => handleDelete(item) },
    ]);
  }

  function handleDelete(item: ShoppingItemRow) {
    showAlert(t('list.deleteItemConfirm'), undefined, [
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
        <ScreenHeader title={t('list.title')} refreshing={refreshing} onRefresh={onRefresh} />
        <SectionList
          sections={visibleSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={{ ios: 'cart', android: 'shopping_cart' }}
              title={t('list.empty')}
              hint={t('list.emptyHint')}
            />
          }
          renderSectionHeader={({ section }) => {
            const isCollapsed = collapsed[section.key] === true;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: !isCollapsed }}
                onPress={() =>
                  setCollapsed((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
                }
                style={[styles.sectionHeader, { backgroundColor: theme.background }]}
              >
                {section.icon && (
                  <AppSymbol name={section.icon} size={16} tintColor={theme.textSecondary} />
                )}
                <ThemedText
                  type="smallBold"
                  themeColor="textSecondary"
                  style={styles.sectionTitle}
                >
                  {section.title.toUpperCase()}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {section.count}
                </ThemedText>
                <AppSymbol
                  name={
                    isCollapsed
                      ? { ios: 'chevron.down', android: 'expand_more' }
                      : { ios: 'chevron.up', android: 'expand_less' }
                  }
                  size={16}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            );
          }}
          renderItem={({ item }) => {
            const category = item.category_id ? categoryById.get(item.category_id) : undefined;
            const categoryIcon = category ? getCategoryIconSymbol(category.icon) : null;

            return (
              <Pressable
                onLongPress={() => handleLongPress(item)}
                onPress={() =>
                  toggleItem.mutate({
                    id: item.id,
                    isPurchased: !item.is_purchased,
                    purchasedBy: currentMemberId ?? null,
                  })
                }
              >
                <ThemedView type="backgroundElement" style={styles.itemRow}>
                  <AppSymbol
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
                    {item.is_purchased && category && categoryIcon && (
                      <View style={styles.categoryRow}>
                        <AppSymbol
                          name={{ ios: categoryIcon.ios, android: categoryIcon.android }}
                          size={12}
                          tintColor={theme.textSecondary}
                        />
                        <ThemedText type="small" themeColor="textSecondary">
                          {category.name}
                        </ThemedText>
                      </View>
                    )}
                    {item.is_purchased && item.purchased_at && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.purchased_by ? memberNameById.get(item.purchased_by) : '—'} ·{' '}
                        {dateFormatter.format(new Date(item.purchased_at))}
                      </ThemedText>
                    )}
                  </View>
                </ThemedView>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
      <FloatingActionButton
        accessibilityLabel={t('list.addButton')}
        onPress={() => setModalVisible(true)}
      />

      <AddShoppingItemModal
        visible={modalVisible}
        householdId={householdId}
        editingItem={editingItem}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        onUpdate={(id, name, categoryId) => updateItem.mutate({ id, name, categoryId })}
        onSubmit={(names, categoryId) => {
          const myMember = members.find((member) => member.user_id === session?.user.id);
          if (!householdId || !myMember) return;
          addItems.mutate({ names, categoryId, addedBy: myMember.id });
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
  listContentEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    flex: 1,
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
  },
});
