import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  useAddCategoryMutation,
  useCategoriesQuery,
  useRemoveCategoryMutation,
  useRenameCategoryMutation,
} from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryRow } from '@/lib/api/categories';

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
  const renameCategory = useRenameCategoryMutation(householdId);
  const removeCategory = useRemoveCategoryMutation(householdId);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    addCategory.mutate(name);
    setNewName('');
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
          <ScreenHeader title={t('categories.title')} />
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
              <ThemedView type="backgroundElement" style={styles.row}>
                {editingId === item.id ? (
                  <TextInput
                    value={editingName}
                    onChangeText={setEditingName}
                    autoCapitalize="words"
                    autoFocus
                    style={[styles.inlineInput, { color: theme.text, borderColor: theme.border }]}
                    onSubmitEditing={() => {
                      const name = editingName.trim();
                      if (name) renameCategory.mutate({ id: item.id, name });
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
                  <SymbolView name="trash" size={18} tintColor={theme.danger} />
                </Pressable>
              </ThemedView>
            )}
          />
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
            <PrimaryButton label={t('common.add')} disabled={!newName.trim()} onPress={handleAdd} />
          </ThemedView>
          <ThemedView style={styles.closeRow}>
            <PrimaryButton label={t('common.close')} variant="secondary" onPress={onClose} />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
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
  },
  rowLabel: {
    flex: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
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
  closeRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
});
