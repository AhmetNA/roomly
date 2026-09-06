import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Spacing } from '@/constants/theme';
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
            <SheetHeader title={t('expenses.detailTitle')} onClose={onClose} />
            <ScrollView contentContainerStyle={styles.content}>
              <ThemedView style={styles.hero}>
                <ThemedText type="title" style={styles.amount}>
                  {expense.total_amount.toFixed(2)}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.heroTitle}>
                  {expense.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(expense.created_at).toLocaleDateString()}
                  {expense.category_id && categoryById.has(expense.category_id)
                    ? ` · ${categoryById.get(expense.category_id)}`
                    : ''}
                </ThemedText>
              </ThemedView>

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                {t('expenses.paidBySection').toUpperCase()}
              </ThemedText>
              {expense.expense_payments.map((payment) => (
                <ThemedView key={payment.id} type="backgroundElement" style={styles.splitRow}>
                  <ThemedText type="default">{nameById.get(payment.member_id) ?? '—'}</ThemedText>
                  <ThemedText type="smallBold">{payment.amount_paid.toFixed(2)}</ThemedText>
                </ThemedView>
              ))}

              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                {t('expenses.splitDetailTitle').toUpperCase()}
              </ThemedText>
              {expense.expense_splits.map((split) => (
                <ThemedView key={split.id} type="backgroundElement" style={styles.splitRow}>
                  <ThemedText type="default">{nameById.get(split.member_id) ?? '—'}</ThemedText>
                  <ThemedText type="smallBold">{split.amount_owed.toFixed(2)}</ThemedText>
                </ThemedView>
              ))}

              {expense.expense_debts.length > 0 && (
                <>
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={styles.sectionTitle}
                  >
                    {t('expenses.debtsSection').toUpperCase()}
                  </ThemedText>
                  {expense.expense_debts.map((debt) => (
                    <ThemedView key={debt.id} type="backgroundElement" style={styles.splitRow}>
                      <ThemedText type="default">
                        {nameById.get(debt.from_member_id) ?? '—'} {t('expenses.owesArrow')}{' '}
                        {nameById.get(debt.to_member_id) ?? '—'}
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        themeColor={debt.is_settled ? 'success' : 'danger'}
                      >
                        {debt.amount.toFixed(2)}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </>
              )}

              <ThemedView style={styles.deleteRow}>
                <PrimaryButton
                  label={t('common.delete')}
                  variant="danger"
                  icon={{ ios: 'trash', android: 'delete' }}
                  onPress={() => onDelete(expense)}
                />
              </ThemedView>
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
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  amount: {
    fontSize: 40,
    lineHeight: 46,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  sectionTitle: {
    marginTop: Spacing.three,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    ...CardShadow,
  },
  deleteRow: {
    marginTop: Spacing.four,
  },
});
