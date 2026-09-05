import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useExpensesQuery, useSettleDebtMutation } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import type { MemberRow } from '@/lib/api/household';
import { computeDebtBalances, type DebtBalance } from '@/lib/debt';

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

  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);
  const balances = useMemo(() => computeDebtBalances(expenses), [expenses]);

  const [settling, setSettling] = useState<DebtBalance | null>(null);

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
                  <Pressable onPress={() => setSettling(item)} hitSlop={8}>
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

      <SettleConfirmModal
        balance={settling}
        toMember={settling ? (members.find((m) => m.id === settling.toMemberId) ?? null) : null}
        fromName={settling ? (nameById.get(settling.fromMemberId) ?? '—') : ''}
        toName={settling ? (nameById.get(settling.toMemberId) ?? '—') : ''}
        householdId={householdId}
        onClose={() => setSettling(null)}
      />
    </Modal>
  );
}

// Settling a debt is usually the moment someone's about to actually transfer
// the money — showing the recipient's IBAN right here (copyable) means they
// don't have to leave this screen and go find it on the People tab first.
function SettleConfirmModal({
  balance,
  toMember,
  fromName,
  toName,
  householdId,
  onClose,
}: {
  balance: DebtBalance | null;
  toMember: MemberRow | null;
  fromName: string;
  toName: string;
  householdId: string | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const settleDebt = useSettleDebtMutation(householdId);

  async function copyIban() {
    if (!toMember?.iban) return;
    await Clipboard.setStringAsync(toMember.iban);
    Alert.alert(t('people.ibanCopied'));
  }

  function handleConfirm() {
    if (!balance) return;
    settleDebt.mutate({ fromMemberId: balance.fromMemberId, toMemberId: balance.toMemberId });
    onClose();
  }

  return (
    <Modal visible={balance !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        {balance && (
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              {fromName} {t('expenses.owesArrow')} {toName}
            </ThemedText>
            <ThemedText type="title" style={styles.cardAmount}>
              {balance.amount.toFixed(2)}
            </ThemedText>

            {toMember?.iban ? (
              <Pressable onPress={copyIban} style={styles.ibanRow}>
                <ThemedView type="backgroundElement" style={styles.ibanBox}>
                  <ThemedText type="default">{toMember.iban}</ThemedText>
                  <SymbolView
                    name={{ ios: 'doc.on.doc', android: 'content_copy' }}
                    size={16}
                    tintColor={theme.textSecondary}
                  />
                </ThemedView>
              </Pressable>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.ibanMissing}>
                {t('people.ibanMissing')}
              </ThemedText>
            )}

            <PrimaryButton label={t('expenses.settleButton')} onPress={handleConfirm} />
            <PrimaryButton label={t('common.cancel')} variant="secondary" onPress={onClose} />
          </ThemedView>
        )}
      </View>
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
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  card: {
    width: '100%',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  cardAmount: {
    fontSize: 36,
    lineHeight: 42,
    marginBottom: Spacing.two,
  },
  ibanRow: {
    marginBottom: Spacing.two,
  },
  ibanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  ibanMissing: {
    marginBottom: Spacing.two,
  },
});
