import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/app-symbol';
import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, PopupShadow, Spacing, type ThemeColor } from '@/constants/theme';
import { useExpensesQuery } from '@/hooks/use-expenses';
import { useRecordSettlementMutation, useSettlementsQuery } from '@/hooks/use-settlements';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { MemberRow } from '@/lib/api/household';
import { computeSimplifiedTransfers, type DebtBalance } from '@/lib/debt';
import { formatMoney } from '@/lib/currency';

type DebtSection = {
  key: string;
  title: string;
  // Whether the reader is a party to these debts — decides both the colour and
  // whether the row needs to name both sides or just the other person.
  mine: boolean;
  tone: ThemeColor;
  data: DebtBalance[];
};

export function DebtSummaryModal({
  visible,
  householdId,
  members,
  currentMemberId,
  onClose,
  onDismiss,
  onOpenPersonalSpending,
}: {
  visible: boolean;
  householdId: string | undefined;
  members: MemberRow[];
  currentMemberId: string | undefined;
  onClose: () => void;
  onDismiss?: () => void;
  onOpenPersonalSpending: () => void;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { data: expenses = [] } = useExpensesQuery(householdId);
  const { data: settlements = [] } = useSettlementsQuery(householdId);

  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);
  const balances = useMemo(
    () => computeSimplifiedTransfers(expenses, settlements),
    [expenses, settlements],
  );

  // Money coming to you and money you owe read as opposites; one flat red list
  // made the reader work out which was which from the direction of an arrow.
  const sections = useMemo<DebtSection[]>(() => {
    const owedToYou = balances.filter((b) => b.toMemberId === currentMemberId);
    const youOwe = balances.filter((b) => b.fromMemberId === currentMemberId);
    const others = balances.filter(
      (b) => b.fromMemberId !== currentMemberId && b.toMemberId !== currentMemberId,
    );

    return [
      {
        key: 'owedToYou',
        title: t('expenses.debtsYouAreOwed'),
        mine: true,
        tone: 'success' as ThemeColor,
        data: owedToYou,
      },
      {
        key: 'youOwe',
        title: t('expenses.debtsYouOwe'),
        mine: true,
        tone: 'danger' as ThemeColor,
        data: youOwe,
      },
      {
        key: 'others',
        title: t('expenses.debtsOthers'),
        mine: false,
        tone: 'textSecondary' as ThemeColor,
        data: others,
      },
    ].filter((section) => section.data.length > 0);
  }, [balances, currentMemberId, t]);

  const [settling, setSettling] = useState<DebtBalance | null>(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={onDismiss}
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
              <PersonalSpendingEntry onPress={onOpenPersonalSpending} />
            </ThemedView>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) =>
                `${item.fromMemberId}-${item.toMemberId}-${item.currencyCode}`
              }
              contentContainerStyle={styles.listContent}
              ListFooterComponent={<PersonalSpendingEntry onPress={onOpenPersonalSpending} />}
              renderSectionHeader={({ section }) => (
                <ThemedText type="smallBold" themeColor={section.tone} style={styles.sectionHeader}>
                  {section.title.toUpperCase()}
                </ThemedText>
              )}
              renderItem={({ item, section }) => (
                <ThemedView type="backgroundElement" style={styles.debtCard}>
                  <View style={styles.row}>
                    <View style={styles.rowTop}>
                      <ThemedText type="default" numberOfLines={1} style={styles.rowNames}>
                        {section.mine
                          ? nameById.get(
                              item.fromMemberId === currentMemberId
                                ? item.toMemberId
                                : item.fromMemberId,
                            )
                          : `${nameById.get(item.fromMemberId)} ${t('expenses.owesArrow')} ${nameById.get(item.toMemberId)}`}
                      </ThemedText>
                    </View>
                    <View style={styles.rowBottom}>
                      <ThemedText
                        type="smallBold"
                        themeColor={section.tone}
                        numberOfLines={1}
                        style={styles.rowAmount}
                      >
                        {formatMoney(item.amount, item.currencyCode, i18n.language)}
                      </ThemedText>
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
                        <ThemedText type="small" themeColor="onAccent" numberOfLines={1}>
                          {t('expenses.settleButton')}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
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

function PersonalSpendingEntry({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('personalSpending.open')}
      style={styles.personalSpendingEntryPressable}
    >
      <ThemedView type="backgroundElement" style={styles.personalSpendingEntry}>
        <View style={[styles.personalSpendingIcon, { backgroundColor: `${theme.accent}17` }]}>
          <AppSymbol
            name={{ ios: 'wallet.bifold', android: 'account_balance_wallet' }}
            size={22}
            tintColor={theme.accent}
          />
        </View>
        <View style={styles.personalSpendingCopy}>
          <ThemedText type="default" style={styles.personalSpendingTitle}>
            {t('personalSpending.open')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('personalSpending.openHint')}
          </ThemedText>
        </View>
        <AppSymbol
          name={{ ios: 'chevron.right', android: 'chevron_right' }}
          size={18}
          tintColor={theme.textSecondary}
        />
      </ThemedView>
    </Pressable>
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
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const recordSettlement = useRecordSettlementMutation(householdId);

  async function copyIban() {
    if (!toMember?.iban) return;
    await Clipboard.setStringAsync(toMember.iban);
    showAlert(t('people.ibanCopied'));
  }

  function handleConfirm() {
    if (!balance) return;
    recordSettlement.mutate({
      fromMemberId: balance.fromMemberId,
      toMemberId: balance.toMemberId,
      amount: balance.amount,
      currencyCode: balance.currencyCode,
    });
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
              {formatMoney(balance.amount, balance.currencyCode, i18n.language)}
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

            <View style={styles.actionColumn}>
              <PrimaryButton
                label={t('expenses.settleButton')}
                icon={{ ios: 'checkmark', android: 'check' }}
                onPress={handleConfirm}
              />
              <PrimaryButton
                label={t('common.cancel')}
                variant="secondary"
                icon={{ ios: 'xmark', android: 'close' }}
                onPress={onClose}
              />
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
  actionColumn: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  personalSpendingEntryPressable: { width: '100%', marginTop: Spacing.three },
  personalSpendingEntry: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    ...CardShadow,
  },
  personalSpendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalSpendingCopy: { flex: 1, gap: Spacing.half },
  personalSpendingTitle: { fontWeight: '600' },
  emptyText: {
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  sectionHeader: {
    marginTop: Spacing.three,
  },
  debtCard: {
    borderRadius: Spacing.three,
    ...CardShadow,
  },
  row: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowNames: {
    flex: 1,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowAmount: {
    flexShrink: 1,
    fontSize: 22,
    lineHeight: 28,
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
