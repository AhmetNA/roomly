import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/app-symbol';
import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, PopupShadow, Spacing } from '@/constants/theme';
import { useExpensesQuery, useSettleDebtMutation } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { MemberRow } from '@/lib/api/household';
import { computeDebtBalances, computeDebtBreakdown, type DebtBalance } from '@/lib/debt';

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
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { data: expenses = [] } = useExpensesQuery(householdId);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language],
  );

  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);
  const balances = useMemo(() => computeDebtBalances(expenses), [expenses]);

  const [settling, setSettling] = useState<DebtBalance | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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
              renderItem={({ item }) => {
                const key = `${item.fromMemberId}-${item.toMemberId}`;
                const expanded = expandedKey === key;
                // A net balance can be made of expenses running both ways, so
                // the breakdown is only worth computing for the open row.
                const breakdown = expanded
                  ? computeDebtBreakdown(expenses, item.fromMemberId, item.toMemberId)
                  : [];

                return (
                  <ThemedView type="backgroundElement" style={styles.debtCard}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      onPress={() => setExpandedKey(expanded ? null : key)}
                      style={styles.row}
                    >
                      <View style={styles.rowInfo}>
                        <ThemedText type="default">
                          {nameById.get(item.fromMemberId)} {t('expenses.owesArrow')}{' '}
                          {nameById.get(item.toMemberId)}
                        </ThemedText>
                        <ThemedText type="smallBold" themeColor="danger">
                          {item.amount.toFixed(2)}
                        </ThemedText>
                      </View>
                      <View style={styles.rowActions}>
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
                        <AppSymbol
                          name={
                            expanded
                              ? { ios: 'chevron.up', android: 'expand_less' }
                              : { ios: 'chevron.down', android: 'expand_more' }
                          }
                          size={16}
                          tintColor={theme.textSecondary}
                        />
                      </View>
                    </Pressable>

                    {expanded && (
                      <View style={[styles.breakdown, { borderTopColor: theme.border }]}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {t('expenses.debtBreakdownTitle')}
                        </ThemedText>
                        {breakdown.map((entry) => (
                          <View key={entry.expenseId} style={styles.breakdownRow}>
                            <View style={styles.breakdownInfo}>
                              <ThemedText type="default">{entry.title}</ThemedText>
                              <ThemedText type="small" themeColor="textSecondary">
                                {dateFormatter.format(new Date(entry.createdAt))}
                              </ThemedText>
                            </View>
                            <ThemedText
                              type="smallBold"
                              themeColor={entry.amount > 0 ? 'danger' : 'success'}
                            >
                              {entry.amount > 0 ? '' : '-'}
                              {Math.abs(entry.amount).toFixed(2)}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </ThemedView>
                );
              }}
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
    showAlert(t('people.ibanCopied'));
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
  debtCard: {
    borderRadius: Spacing.three,
    ...CardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  breakdown: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  breakdownInfo: {
    flex: 1,
    gap: Spacing.half,
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
