import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CategoryRow } from '@/lib/api/categories';
import type { ExpenseWithSplits } from '@/lib/api/expenses';
import type { MemberRow } from '@/lib/api/household';

export function ExpenseDetailModal({
  expense,
  members,
  categories,
  onClose,
  onDelete,
}: {
  expense: ExpenseWithSplits | null;
  members: MemberRow[];
  categories: CategoryRow[];
  onClose: () => void;
  onDelete: (expense: ExpenseWithSplits) => void;
}) {
  const { t } = useTranslation();

  const nameById = new Map(members.map((m) => [m.id, m.name]));
  const categoryById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <Modal
      visible={expense !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {expense && (
        <ThemedView style={styles.container}>
          <SafeAreaView style={styles.container}>
            <ScreenHeader title={t('expenses.detailTitle')} />
            <ScrollView contentContainerStyle={styles.content}>
              <ThemedText type="title" style={styles.amount}>
                {expense.total_amount.toFixed(2)}
              </ThemedText>
              <ThemedText type="subtitle">{expense.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {new Date(expense.created_at).toLocaleDateString()}
                {expense.category_id && categoryById.has(expense.category_id)
                  ? ` · ${categoryById.get(expense.category_id)}`
                  : ''}
              </ThemedText>

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                {t('expenses.paidBySection').toUpperCase()}
              </ThemedText>
              <ThemedText type="default">
                {expense.paid_by ? (nameById.get(expense.paid_by) ?? '—') : '—'}
              </ThemedText>

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                {t('expenses.splitDetailTitle').toUpperCase()}
              </ThemedText>
              {expense.expense_splits.map((split) => (
                <ThemedView key={split.id} type="backgroundElement" style={styles.splitRow}>
                  <ThemedText type="default">{nameById.get(split.member_id) ?? '—'}</ThemedText>
                  <ThemedText type="smallBold" themeColor={split.is_settled ? 'success' : 'danger'}>
                    {split.amount_owed.toFixed(2)}
                  </ThemedText>
                </ThemedView>
              ))}

              <PrimaryButton
                label={t('common.delete')}
                variant="secondary"
                onPress={() => onDelete(expense)}
              />
              <PrimaryButton label={t('common.close')} variant="secondary" onPress={onClose} />
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  amount: {
    fontSize: 36,
    lineHeight: 42,
  },
  sectionTitle: {
    marginTop: Spacing.three,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
