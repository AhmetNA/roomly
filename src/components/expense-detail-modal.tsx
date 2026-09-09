import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Spacing } from '@/constants/theme';
import { getReceiptUrl } from '@/lib/api/receipts';
import type { CategoryRow } from '@/lib/api/categories';
import type { ExpenseWithSplits } from '@/lib/api/expenses';
import type { MemberRow } from '@/lib/api/household';

export function ExpenseDetailModal({
  expense,
  members,
  categories,
  onClose,
  onEdit,
  onDelete,
}: {
  expense: ExpenseWithSplits | null;
  members: MemberRow[];
  categories: CategoryRow[];
  onClose: () => void;
  onEdit: (expense: ExpenseWithSplits) => void;
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

              {expense.expense_line_items.length > 0 && (
                <>
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={styles.sectionTitle}
                  >
                    {t('expenses.itemsLabel')}
                  </ThemedText>
                  {[...expense.expense_line_items]
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => (
                      <ThemedText key={item.id}>• {item.name}</ThemedText>
                    ))}
                </>
              )}
              {expense.receipt_photo_url && (
                <ReceiptImage key={expense.receipt_photo_url} path={expense.receipt_photo_url} />
              )}
              <ThemedView style={styles.deleteRow}>
                <PrimaryButton
                  label={t('expenses.editButton')}
                  icon={{ ios: 'pencil', android: 'edit' }}
                  onPress={() => onEdit(expense)}
                />
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
    gap: Spacing.two,
  },
});

function ReceiptImage({ path }: { path: string }) {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);
  const receipt = useQuery({
    queryKey: ['receipt', path],
    queryFn: () => getReceiptUrl(path),
    staleTime: 5 * 60 * 1000,
    gcTime: 0,
  });
  return (
    <ThemedView>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {t('expenses.receipt')}
      </ThemedText>
      {receipt.isPending ? (
        <ThemedText type="small">{t('expenses.loadingReceipt')}</ThemedText>
      ) : receipt.isError || imageFailed ? (
        <PrimaryButton
          label={t('expenses.retryReceipt')}
          variant="secondary"
          onPress={async () => {
            setImageFailed(false);
            await receipt.refetch();
          }}
        />
      ) : (
        <Image
          source={{ uri: receipt.data }}
          onError={() => setImageFailed(true)}
          accessibilityLabel={t('expenses.receipt')}
          resizeMode="contain"
          style={{ width: '100%', height: 420 }}
        />
      )}
    </ThemedView>
  );
}
