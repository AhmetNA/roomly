import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryManagerModal } from '@/components/category-manager-modal';
import { CategoryPicker } from '@/components/category-picker';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategoriesQuery } from '@/hooks/use-categories';

export function AddShoppingItemModal({
  visible,
  householdId,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  householdId: string | undefined;
  onClose: () => void;
  onSubmit: (name: string, categoryId: string | null) => void;
}) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategoriesQuery(householdId);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  function handleClose() {
    setName('');
    setCategoryId(null);
    onClose();
  }

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, categoryId);
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
          <ScreenHeader title={t('list.addItemTitle')} />
          <ThemedView style={styles.form}>
            <TextField
              label={t('list.itemNameLabel')}
              placeholder={t('list.itemNamePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
              autoFocus
            />

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

            <View style={styles.actionRow}>
              <View style={styles.actionFlex}>
                <PrimaryButton
                  label={t('common.add')}
                  icon={{ ios: 'plus', android: 'add' }}
                  disabled={!name.trim()}
                  onPress={handleSubmit}
                />
              </View>
              <View style={styles.actionFlex}>
                <PrimaryButton
                  label={t('common.cancel')}
                  variant="secondary"
                  icon={{ ios: 'xmark', android: 'close' }}
                  onPress={handleClose}
                />
              </View>
            </View>
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionFlex: {
    flex: 1,
  },
  form: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
});
