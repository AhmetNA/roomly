import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/app-symbol';
import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Spacing } from '@/constants/theme';
import { useExpensesQuery } from '@/hooks/use-expenses';
import { useSettlementsQuery } from '@/hooks/use-settlements';
import { useTheme } from '@/hooks/use-theme';
import type { ExpenseWithSplits } from '@/lib/api/expenses';
import { computePersonalSpending, type PersonalSpendingPeriod } from '@/lib/personal-spending';
import {
  CURRENCY_CODES,
  formatMoney,
  normalizeCurrencyCode,
  type CurrencyCode,
} from '@/lib/currency';
import { computeMemberCurrencyBalances, computeSimplifiedTransfers } from '@/lib/debt';

export function PersonalSpendingModal({
  visible,
  householdId,
  currentMemberId,
  onClose,
  onDismiss,
  onSelectExpense,
}: {
  visible: boolean;
  householdId: string | undefined;
  currentMemberId: string | undefined;
  onClose: () => void;
  onDismiss?: () => void;
  onSelectExpense: (expense: ExpenseWithSplits) => void;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const expensesQuery = useExpensesQuery(householdId);
  const settlementsQuery = useSettlementsQuery(householdId);
  const [period, setPeriod] = useState<PersonalSpendingPeriod>('thisMonth');
  const summary = useMemo(
    () => computePersonalSpending(expensesQuery.data ?? [], currentMemberId, period),
    [currentMemberId, expensesQuery.data, period],
  );
  const netByCurrency = useMemo(
    () =>
      new Map(
        computeMemberCurrencyBalances(
          computeSimplifiedTransfers(expensesQuery.data ?? [], settlementsQuery.data ?? []),
          currentMemberId,
        ).map((balance) => [balance.currencyCode, balance.amount]),
      ),
    [currentMemberId, expensesQuery.data, settlementsQuery.data],
  );
  const currencySummaries = useMemo(() => {
    const totals = new Map(summary.totals.map((total) => [total.currencyCode, total]));
    return CURRENCY_CODES.filter((code) => totals.has(code) || netByCurrency.has(code)).map(
      (currencyCode) => ({
        currencyCode,
        totalShareCents: totals.get(currencyCode)?.totalShareCents ?? 0,
        totalPaidCents: totals.get(currencyCode)?.totalPaidCents ?? 0,
        netAmount: netByCurrency.get(currencyCode) ?? 0,
      }),
    );
  }, [netByCurrency, summary.totals]);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language],
  );
  const formatCents = (cents: number, currency: CurrencyCode) =>
    formatMoney(cents / 100, currency, i18n.language);

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
          <SheetHeader title={t('personalSpending.title')} onClose={onClose} />

          <View style={styles.segmentRow} accessibilityRole="tablist">
            {(['thisMonth', 'lastMonth', 'all'] as const).map((item) => {
              const selected = period === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setPeriod(item)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  style={[
                    styles.segment,
                    { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                  ]}
                >
                  <ThemedText type="small" themeColor={selected ? 'onAccent' : undefined}>
                    {t(`personalSpending.period.${item}`)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {expensesQuery.isLoading || settlementsQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.accent} />
              <ThemedText type="small" themeColor="textSecondary">
                {t('personalSpending.loading')}
              </ThemedText>
            </View>
          ) : expensesQuery.isError || settlementsQuery.isError ? (
            <View style={styles.centered}>
              <AppSymbol
                name={{ ios: 'exclamationmark.triangle', android: 'error_outline' }}
                size={36}
                tintColor={theme.danger}
              />
              <ThemedText type="default" style={styles.centeredText}>
                {t('personalSpending.error')}
              </ThemedText>
              <PrimaryButton
                label={t('common.retry')}
                variant="secondary"
                icon={{ ios: 'arrow.clockwise', android: 'refresh' }}
                onPress={() => {
                  expensesQuery.refetch();
                  settlementsQuery.refetch();
                }}
              />
            </View>
          ) : (
            <SectionList
              sections={[{ title: t('personalSpending.expenses'), data: summary.items }]}
              keyExtractor={(item) => item.expense.id}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={[
                styles.listContent,
                summary.items.length === 0 && styles.emptyListContent,
              ]}
              ListHeaderComponent={
                <View style={styles.summaryList}>
                  {currencySummaries.map((total) => (
                    <View key={total.currencyCode} style={styles.summaryRow}>
                      <ThemedView
                        style={[styles.summaryBlock, { backgroundColor: `${theme.danger}12` }]}
                      >
                        <ThemedText type="small" themeColor="textSecondary">
                          {t('personalSpending.totalShare')}
                        </ThemedText>
                        <ThemedText
                          type="subtitle"
                          themeColor="danger"
                          style={styles.summaryAmount}
                        >
                          {formatCents(total.totalShareCents, total.currencyCode)}
                        </ThemedText>
                      </ThemedView>
                      <ThemedView
                        style={[styles.summaryBlock, { backgroundColor: `${theme.accent}12` }]}
                      >
                        <ThemedText type="small" themeColor="textSecondary">
                          {t('personalSpending.totalPaid')}
                        </ThemedText>
                        <ThemedText
                          type="subtitle"
                          themeColor="accent"
                          style={styles.summaryAmount}
                        >
                          {formatCents(total.totalPaidCents, total.currencyCode)}
                        </ThemedText>
                      </ThemedView>
                      <ThemedView
                        style={[
                          styles.summaryBlock,
                          {
                            backgroundColor:
                              total.netAmount >= 0 ? `${theme.success}12` : `${theme.danger}12`,
                          },
                        ]}
                      >
                        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                          {t('personalSpending.netBalance')}
                        </ThemedText>
                        <ThemedText
                          type="subtitle"
                          themeColor={total.netAmount >= 0 ? 'success' : 'danger'}
                          style={styles.summaryAmount}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {total.netAmount > 0 ? '+' : ''}
                          {formatMoney(total.netAmount, total.currencyCode, i18n.language)}
                        </ThemedText>
                      </ThemedView>
                    </View>
                  ))}
                </View>
              }
              ListEmptyComponent={
                <EmptyState
                  icon={{ ios: 'tray', android: 'inbox' }}
                  title={t('personalSpending.empty')}
                  hint={t('personalSpending.emptyHint')}
                />
              }
              renderSectionHeader={({ section }) =>
                section.data.length > 0 ? (
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={styles.sectionTitle}
                  >
                    {section.title.toUpperCase()}
                  </ThemedText>
                ) : null
              }
              renderItem={({ item }) =>
                (() => {
                  const currency = normalizeCurrencyCode(item.expense.currency_code);
                  return (
                    <Pressable
                      onPress={() => onSelectExpense(item.expense)}
                      accessibilityRole="button"
                      accessibilityLabel={t('personalSpending.expenseAccessibilityLabel', {
                        title: item.expense.title,
                        date: dateFormatter.format(new Date(item.expense.created_at)),
                        total: formatMoney(item.expense.total_amount, currency, i18n.language),
                        share: formatCents(item.shareCents, currency),
                        paid: formatCents(item.paidCents, currency),
                      })}
                      style={({ pressed }) => pressed && styles.expensePressed}
                    >
                      <ThemedView type="backgroundElement" style={styles.expenseRow}>
                        <View style={styles.expenseHeader}>
                          <View style={styles.expenseIdentity}>
                            <ThemedText
                              type="default"
                              numberOfLines={1}
                              style={styles.expenseTitle}
                            >
                              {item.expense.title}
                            </ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {dateFormatter.format(new Date(item.expense.created_at))}
                            </ThemedText>
                          </View>
                          <View
                            style={[
                              styles.totalGroup,
                              { backgroundColor: theme.backgroundSelected },
                            ]}
                          >
                            <ThemedText type="small" themeColor="textSecondary">
                              {t('personalSpending.expenseTotal')}
                            </ThemedText>
                            <ThemedText type="smallBold">
                              {formatMoney(item.expense.total_amount, currency, i18n.language)}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={[styles.amountRow, { borderTopColor: theme.border }]}>
                          <Amount
                            label={t('personalSpending.myShare')}
                            value={formatCents(item.shareCents, currency)}
                            tone="danger"
                            backgroundColor={`${theme.danger}10`}
                          />
                          <Amount
                            label={t('personalSpending.myPaid')}
                            value={formatCents(item.paidCents, currency)}
                            tone="accent"
                            backgroundColor={`${theme.accent}10`}
                          />
                          <AppSymbol
                            name={{ ios: 'chevron.right', android: 'chevron_right' }}
                            size={18}
                            tintColor={theme.textSecondary}
                          />
                        </View>
                      </ThemedView>
                    </Pressable>
                  );
                })()
              }
            />
          )}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function Amount({
  label,
  value,
  tone,
  backgroundColor,
}: {
  label: string;
  value: string;
  tone: 'danger' | 'accent';
  backgroundColor: string;
}) {
  return (
    <View style={[styles.amountGroup, { backgroundColor }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" themeColor={tone}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  summaryList: { gap: Spacing.two },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  centeredText: { textAlign: 'center' },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  emptyListContent: { flexGrow: 1 },
  summaryRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  summaryBlock: {
    flex: 1,
    minWidth: 0,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  summaryAmount: { fontSize: 20, lineHeight: 26 },
  sectionTitle: { marginTop: Spacing.two, marginBottom: Spacing.one },
  expenseRow: { borderRadius: Spacing.three, overflow: 'hidden', ...CardShadow },
  expensePressed: { opacity: 0.76 },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  expenseIdentity: { flex: 1, minWidth: 0, gap: Spacing.half },
  expenseTitle: { fontWeight: '600' },
  totalGroup: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  amountGroup: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
