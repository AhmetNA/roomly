import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/app-symbol';
import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, PopupShadow, Spacing } from '@/constants/theme';
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
  const theme = useTheme();
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
          <SheetHeader title={t('expenses.debtSummaryTitle')} onClose={onClose} />
          {balances.length === 0 ? (
            <ThemedView style={styles.empty}>
              <AppSymbol
                name={{ ios: 'party.popper', android: 'celebration' }}
                size={40}
                tintColor={theme.textSecondary}
              />
              <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
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
                  <View style={styles.rowInfo}>
                    <ThemedText type="default">
                      {nameById.get(item.fromMemberId)} {t('expenses.owesArrow')}{' '}
                      {nameById.get(item.toMemberId)}
                    </ThemedText>
                    <ThemedText type="smallBold" themeColor="danger">
                      {item.amount.toFixed(2)}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setSettling(item)}
                    style={[styles.settleChip, { backgroundColor: theme.accent }]}
                  >
                    <AppSymbol
                      name={{ ios: 'checkmark', android: 'check' }}
                      size={13}
                      tintColor={theme.onAccent}
                      weight="bold"
                    />
                    <ThemedText type="small" themeColor="onAccent">
                      {t('expenses.settleButton')}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              )}
            />
          )}
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
          <ThemedView style={[styles.card, PopupShadow]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.cardCaption}>
              {fromName} {t('expenses.owesArrow')} {toName}
            </ThemedText>
            <ThemedText type="title" themeColor="danger" style={styles.cardAmount}>
              {balance.amount.toFixed(2)}
            </ThemedText>

            {toMember?.iban ? (
              <Pressable onPress={copyIban}>
                <ThemedView type="backgroundElement" style={styles.ibanBox}>
                  <View style={styles.ibanTextGroup}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {toName}
                    </ThemedText>
                    <ThemedText type="default">{toMember.iban}</ThemedText>
                  </View>
                  <AppSymbol
                    name={{ ios: 'doc.on.doc', android: 'content_copy' }}
                    size={16}
                    tintColor={theme.accent}
                  />
                </ThemedView>
              </Pressable>
            ) : (
              <ThemedView type="backgroundElement" style={styles.ibanBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('people.ibanMissing')}
                </ThemedText>
              </ThemedView>
            )}

            <View style={styles.actionRow}>
              <View style={styles.actionFlex}>
                <PrimaryButton
                  label={t('common.cancel')}
                  variant="secondary"
                  icon={{ ios: 'xmark', android: 'close' }}
                  onPress={onClose}
                />
              </View>
              <View style={styles.actionFlex}>
                <PrimaryButton
                  label={t('expenses.settleButton')}
                  icon={{ ios: 'checkmark', android: 'check' }}
                  onPress={handleConfirm}
                />
              </View>
            </View>
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionFlex: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
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
  rowInfo: {
    gap: Spacing.half,
  },
  settleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
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
    gap: Spacing.three,
  },
  cardCaption: {
    textAlign: 'center',
  },
  cardAmount: {
    fontSize: 44,
    lineHeight: 50,
    textAlign: 'center',
  },
  ibanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  ibanTextGroup: {
    gap: Spacing.half,
  },
});
