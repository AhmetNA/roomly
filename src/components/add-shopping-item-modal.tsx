import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryManagerModal } from '@/components/category-manager-modal';
import { CategoryPicker } from '@/components/category-picker';
import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategoriesQuery } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { ShoppingItemRow } from '@/lib/api/shopping-items';

const MAX_ITEMS = 50;
const MAX_NAME_LENGTH = 200;

// A shopping list is usually written in one go, so newlines and commas both
// separate entries. Duplicates within a single add are a typo, not an intent.
function parseItemNames(input: string) {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of input.split(/[\n,]+/)) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

export function AddShoppingItemModal({
  visible,
  householdId,
  editingItem,
  currentUserId,
  currentUserName,
  editingOwnerName,
  onClose,
  onSubmit,
  onUpdate,
}: {
  visible: boolean;
  householdId: string | undefined;
  editingItem: ShoppingItemRow | null;
  onClose: () => void;
  currentUserId: string | undefined;
  currentUserName: string | undefined;
  editingOwnerName: string | undefined;
  onSubmit: (names: string[], categoryId: string | null, listOwnerUserId: string | null) => void;
  onUpdate: (id: string, name: string, categoryId: string | null) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: categories = [] } = useCategoriesQuery(householdId);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [personal, setPersonal] = useState(false);

  const defaultCategoryId =
    categories.find((category) => category.name.trim().toLocaleLowerCase('tr-TR') === 'market')
      ?.id ??
    categories[0]?.id ??
    null;

  const effectiveCategoryId = categoryId ?? defaultCategoryId;

  const editing = editingItem !== null;
  // Editing touches one row, so the multi-entry parsing is off here: a comma in
  // a corrected name is part of the name, not a second item.
  const names = editing ? [name.trim()].filter(Boolean) : parseItemNames(name);

  function handleClose() {
    setName('');
    setCategoryId(null);
    setPersonal(false);
    onClose();
  }

  function handleSubmit() {
    if (names.length === 0 || effectiveCategoryId === null) return;
    if (names.length > MAX_ITEMS || names.some((item) => item.length > MAX_NAME_LENGTH)) {
      showAlert(t('list.itemsInvalid'));
      return;
    }
    if (editingItem) onUpdate(editingItem.id, names[0], effectiveCategoryId);
    else onSubmit(names, effectiveCategoryId, personal ? (currentUserId ?? null) : null);
    handleClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      onShow={() => {
        setName(editingItem?.name ?? '');
        setCategoryId(editingItem?.category_id ?? null);
        setPersonal(editingItem?.list_owner_user_id != null);
      }}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <SheetHeader
            title={editing ? t('list.editItemTitle') : t('list.addItemTitle')}
            onClose={handleClose}
          />
          <ThemedView style={styles.form}>
            <TextField
              label={t('list.itemNameLabel')}
              placeholder={t('list.itemNamePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
              autoFocus
              multiline={!editing}
              textAlignVertical="top"
              style={editing ? undefined : styles.input}
            />
            {!editing && (
              <ThemedText type="small" themeColor="textSecondary">
                {t('list.multiHint')}
              </ThemedText>
            )}

            <ThemedText type="small" themeColor="textSecondary">
              {t('list.forWhom')}
            </ThemedText>
            {editing ? (
              <ThemedView type="backgroundElement" style={styles.scopeSummary}>
                <ThemedText type="default">
                  {personal
                    ? t('list.personalListName', { name: editingOwnerName ?? '—' })
                    : t('list.shared')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('list.scopeLockedHint')}
                </ThemedText>
              </ThemedView>
            ) : (
              <View style={styles.scopeRow} accessibilityRole="tablist">
                {([false, true] as const).map((isPersonal) => {
                  const selected = personal === isPersonal;
                  return (
                    <Pressable
                      key={String(isPersonal)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      disabled={isPersonal && !currentUserId}
                      onPress={() => setPersonal(isPersonal)}
                      style={[
                        styles.scopeOption,
                        {
                          backgroundColor: selected ? theme.accent : theme.backgroundElement,
                          opacity: isPersonal && !currentUserId ? 0.5 : 1,
                        },
                      ]}
                    >
                      <ThemedText type="smallBold" themeColor={selected ? 'onAccent' : undefined}>
                        {isPersonal
                          ? t('list.myList', { name: currentUserName ?? t('people.you') })
                          : t('list.shared')}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <ThemedText type="small" themeColor="textSecondary">
              {t('list.categoryLabel')}
            </ThemedText>
            <CategoryPicker
              categories={categories}
              selectedId={effectiveCategoryId}
              onSelect={setCategoryId}
              noneLabel={t('list.noCategory')}
              allowNone={false}
            />

            <Pressable onPress={() => setManagingCategories(true)} hitSlop={8}>
              <ThemedText type="link" themeColor="accent">
                {t('list.manageCategories')}
              </ThemedText>
            </Pressable>

            <PrimaryButton
              label={
                editing
                  ? t('common.save')
                  : names.length > 1
                    ? t('list.addCount', { count: names.length })
                    : t('common.add')
              }
              icon={
                editing ? { ios: 'checkmark', android: 'check' } : { ios: 'plus', android: 'add' }
              }
              disabled={names.length === 0 || effectiveCategoryId === null}
              onPress={handleSubmit}
            />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>

      <CategoryManagerModal
        visible={managingCategories}
        householdId={householdId}
        onClose={() => setManagingCategories(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  input: {
    minHeight: 96,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  scopeOption: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  scopeSummary: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
});
