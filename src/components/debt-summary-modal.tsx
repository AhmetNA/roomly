import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useExpensesQuery, useSettleDebtMutation } from '@/hooks/use-expenses';
import type { MemberRow } from '@/lib/api/household';
import { computeDebtBalances } from '@/lib/debt';

export function DebtSummaryModal({
  visible,
  householdId,
  members,
  onClose,
}: {
  visible: boolean;
  householdId: string | undefined;
  members: MemberRow[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: expenses = [] } = useExpensesQuery(householdId);
  const settleDebt = useSettleDebtMutation(householdId);

  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);
  const balances = useMemo(() => computeDebtBalances(expenses), [expenses]);

  function handleSettle(fromMemberId: string, toMemberId: string) {
    Alert.alert(t('expenses.settleConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('expenses.settleButton'),
        onPress: () => settleDebt.mutate({ fromMemberId, toMemberId }),
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
          <ScreenHeader title={t('expenses.debtSummaryTitle')} />
          {balances.length === 0 ? (
            <ThemedView style={styles.empty}>
              <ThemedText type="default" themeColor="textSecondary">
                {t('expenses.noDebts')}
              </ThemedText>
            </ThemedView>
          ) : (
            <FlatList
              data={balances}
              keyExtractor={(item) => `${item.fromMemberId}-${item.toMemberId}`}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <ThemedView type="backgroundElement" style={styles.row}>
                  <ThemedText type="default">
                    {nameById.get(item.fromMemberId)} {t('expenses.owesArrow')}{' '}
                    {nameById.get(item.toMemberId)}
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor="danger">
                    {item.amount.toFixed(2)}
                  </ThemedText>
                  <Pressable
                    onPress={() => handleSettle(item.fromMemberId, item.toMemberId)}
                    hitSlop={8}
                  >
                    <ThemedText type="link" themeColor="accent">
                      {t('expenses.settleButton')}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              )}
            />
          )}
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  closeRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
});
