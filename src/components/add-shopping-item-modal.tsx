import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet } from 'react-native';
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
import { showAlert } from '@/lib/alert';

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
  onClose,
  onSubmit,
}: {
  visible: boolean;
  householdId: string | undefined;
  onClose: () => void;
  onSubmit: (names: string[], categoryId: string | null) => void;
}) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategoriesQuery(householdId);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const names = parseItemNames(name);

  function handleClose() {
    setName('');
    setCategoryId(null);
    onClose();
  }

  function handleSubmit() {
    if (names.length === 0) return;
    if (names.length > MAX_ITEMS || names.some((item) => item.length > MAX_NAME_LENGTH)) {
      showAlert(t('list.itemsInvalid'));
      return;
    }
    onSubmit(names, categoryId);
    handleClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <SheetHeader title={t('list.addItemTitle')} onClose={handleClose} />
          <ThemedView style={styles.form}>
            <TextField
              label={t('list.itemNameLabel')}
              placeholder={t('list.itemNamePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
              autoFocus
              multiline
              textAlignVertical="top"
              style={styles.input}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {t('list.multiHint')}
            </ThemedText>

            <ThemedText type="small" themeColor="textSecondary">
              {t('list.categoryLabel')}
            </ThemedText>
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
              noneLabel={t('list.noCategory')}
            />

            <Pressable onPress={() => setManagingCategories(true)} hitSlop={8}>
              <ThemedText type="link" themeColor="accent">
                {t('list.manageCategories')}
              </ThemedText>
            </Pressable>

            <PrimaryButton
              label={
                names.length > 1 ? t('list.addCount', { count: names.length }) : t('common.add')
              }
              icon={{ ios: 'plus', android: 'add' }}
              disabled={names.length === 0}
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
});
