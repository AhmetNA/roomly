import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON_KEY,
  getCategoryIconSymbol,
} from '@/constants/category-icons';
import { CardShadow, Spacing } from '@/constants/theme';
import {
  useAddCategoryMutation,
  useCategoriesQuery,
  useRemoveCategoryMutation,
  useUpdateCategoryMutation,
} from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryRow } from '@/lib/api/categories';

const ICON_KEYS = Object.keys(CATEGORY_ICONS);

export function CategoryManagerModal({
  visible,
  householdId,
  onClose,
}: {
  visible: boolean;
  householdId: string | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: categories = [] } = useCategoriesQuery(householdId);
  const addCategory = useAddCategoryMutation(householdId);
  const updateCategory = useUpdateCategoryMutation(householdId);
  const removeCategory = useRemoveCategoryMutation(householdId);

  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(DEFAULT_CATEGORY_ICON_KEY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pickingIconFor, setPickingIconFor] = useState<string | null>(null);

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    const sortOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1) + 1;
    addCategory.mutate({ name, icon: newIcon, sortOrder });
    setNewName('');
    setNewIcon(DEFAULT_CATEGORY_ICON_KEY);
  }

  function handleDelete(category: CategoryRow) {
    Alert.alert(t('categories.deleteConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => removeCategory.mutate(category.id),
      },
    ]);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <SheetHeader title={t('categories.title')} onClose={onClose} />
          <FlatList
            data={categories}
            keyExtractor={(category) => category.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('categories.empty')}
              </ThemedText>
            }
            renderItem={({ item }) => (
              <View>
                <ThemedView type="backgroundElement" style={styles.row}>
                  <Pressable
                    onPress={() => setPickingIconFor(pickingIconFor === item.id ? null : item.id)}
                    hitSlop={8}
                  >
                    <CategoryIcon iconKey={item.icon} size={20} color={theme.accent} />
                  </Pressable>
                  {editingId === item.id ? (
                    <TextInput
                      value={editingName}
                      onChangeText={setEditingName}
                      autoCapitalize="words"
                      autoFocus
                      style={[styles.inlineInput, { color: theme.text, borderColor: theme.border }]}
                      onSubmitEditing={() => {
                        const name = editingName.trim();
                        if (name) updateCategory.mutate({ id: item.id, updates: { name } });
                        setEditingId(null);
                      }}
                      onBlur={() => setEditingId(null)}
                    />
                  ) : (
                    <Pressable
                      style={styles.rowLabel}
                      onPress={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                      }}
                    >
                      <ThemedText type="default">{item.name}</ThemedText>
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleDelete(item)} hitSlop={12}>
                    <SymbolView
                      name={{ ios: 'trash', android: 'delete' }}
                      size={18}
                      tintColor={theme.danger}
                    />
                  </Pressable>
                </ThemedView>
                {pickingIconFor === item.id && (
                  <IconGrid
                    selected={item.icon}
                    onSelect={(icon) => {
                      updateCategory.mutate({ id: item.id, updates: { icon } });
                      setPickingIconFor(null);
                    }}
                  />
                )}
              </View>
            )}
          />
          <ThemedView style={styles.addSection}>
            <IconGrid selected={newIcon} onSelect={setNewIcon} />
            <ThemedView style={styles.addRow}>
              <View style={styles.addField}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={t('categories.namePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  onSubmitEditing={handleAdd}
                  style={[styles.inlineInput, { color: theme.text, borderColor: theme.border }]}
                />
              </View>
              <PrimaryButton
                label={t('common.add')}
                icon={{ ios: 'plus', android: 'add' }}
                disabled={!newName.trim()}
                onPress={handleAdd}
              />
            </ThemedView>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function CategoryIcon({
  iconKey,
  size,
  color,
}: {
  iconKey: string | null;
  size: number;
  color: string;
}) {
  const symbol = getCategoryIconSymbol(iconKey);
  return (
    <SymbolView name={{ ios: symbol.ios, android: symbol.android }} size={size} tintColor={color} />
  );
}

function IconGrid({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (icon: string) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconGrid}>
      {ICON_KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => onSelect(key)}
          style={[
            styles.iconChip,
            { backgroundColor: selected === key ? theme.accent : theme.backgroundElement },
          ]}
        >
          <CategoryIcon
            iconKey={key}
            size={18}
            color={selected === key ? theme.onAccent : theme.text}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    ...CardShadow,
  },
  rowLabel: {
    flex: 1,
  },
  addSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  addField: {
    flex: 1,
  },
  inlineInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
});
