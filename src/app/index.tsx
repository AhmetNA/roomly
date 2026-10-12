import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddExpenseModal } from '@/components/add-expense-modal';
import { AppSymbol } from '@/components/app-symbol';
import { DebtSummaryModal } from '@/components/debt-summary-modal';
import { EmptyState } from '@/components/empty-state';
import { ExpenseDetailModal } from '@/components/expense-detail-modal';
import { FloatingActionButton } from '@/components/floating-action-button';
import { CollapseAllButton, SearchBar, SearchButton } from '@/components/header-search';
import { PersonalSpendingModal } from '@/components/personal-spending-modal';
import { RefreshAction } from '@/components/refresh-action';
import { StatisticsModal } from '@/components/statistics-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategoriesQuery } from '@/hooks/use-categories';
import { useHouseholdQuery, useMembersQuery } from '@/hooks/use-household';
import {
  useExpensesQuery,
  useExpensesRealtime,
  useRemoveExpenseMutation,
} from '@/hooks/use-expenses';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import { useSettlementsRealtime } from '@/hooks/use-settlements';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { ExpenseWithSplits } from '@/lib/api/expenses';
import { buildExpenseSearchIndex, searchExpenses } from '@/lib/expense-search';
import { groupByDateSection, type DateSectionKind } from '@/lib/date-sections';
import { isExpenseFullySettled } from '@/lib/debt';
import { formatMoney, normalizeCurrencyCode } from '@/lib/currency';

// Only explicit toggles are stored; past months start collapsed, days start open.
function isCollapsed(
  overrides: Record<string, boolean>,
  section: { key: string; kind: DateSectionKind },
): boolean {
  return overrides[section.key] ?? section.kind === 'month';
}

export default function ExpensesScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width / fontScale < 380;
  const session = useSession();

  const householdQuery = useHouseholdQuery();
  const household = householdQuery.data;
  const householdId = household?.id;
  const membersQuery = useMembersQuery(householdId);
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const categoriesQuery = useCategoriesQuery(householdId);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const expensesQuery = useExpensesQuery(householdId);
  const { data: expenses = [], isLoading } = expensesQuery;
  useExpensesRealtime(householdId);
  useSettlementsRealtime(householdId);
  const removeExpense = useRemoveExpenseMutation(householdId);

  const { refreshing, onRefresh } = usePullRefresh([
    householdQuery.refetch,
    membersQuery.refetch,
    categoriesQuery.refetch,
    expensesQuery.refetch,
  ]);

  const currentMemberId = members.find((m) => m.user_id === session?.user.id)?.id;
  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
  }
  const searching = searchQuery.trim().length > 0;
  const searchIndex = useMemo(
    () => buildExpenseSearchIndex(expenses, nameById, categoryNameById),
    [expenses, nameById, categoryNameById],
  );
  const searchResults = useMemo(
    () => searchExpenses(searchIndex, searchQuery),
    [searchIndex, searchQuery],
  );

  const sections = useMemo(
    () =>
      groupByDateSection(expenses, (expense) => expense.created_at, i18n.language, {
        today: t('common.today'),
        yesterday: t('common.yesterday'),
      }),
    [expenses, i18n.language, t],
  );
  const [collapseOverrides, setCollapseOverrides] = useState<Record<string, boolean>>({});
  const allDaysCollapsed =
    sections.length > 0 && sections.every((section) => isCollapsed(collapseOverrides, section));
  const visibleSections = useMemo(
    () =>
      searching
        ? searchResults.length === 0
          ? []
          : [
              {
                key: 'search',
                kind: 'day' as DateSectionKind,
                title: t('expenses.searchResults', { count: searchResults.length }),
                itemCount: searchResults.length,
                data: searchResults,
                collapsed: false,
              },
            ]
        : sections.map((section) => ({
            ...section,
            itemCount: section.data.length,
            data: isCollapsed(collapseOverrides, section) ? [] : section.data,
            collapsed: isCollapsed(collapseOverrides, section),
          })),
    [collapseOverrides, sections, searching, searchResults, t],
  );

  const [addVisible, setAddVisible] = useState(false);
  const [debtVisible, setDebtVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [personalSpendingVisible, setPersonalSpendingVisible] = useState(false);
  const [openPersonalAfterDismiss, setOpenPersonalAfterDismiss] = useState(false);
  const [expenseAfterDismiss, setExpenseAfterDismiss] = useState<ExpenseWithSplits | null>(null);
  const [detailOpenedFromPersonal, setDetailOpenedFromPersonal] = useState(false);
  const [reopenPersonalAfterDetailDismiss, setReopenPersonalAfterDetailDismiss] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithSplits | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithSplits | null>(null);

  function handleDelete(expense: ExpenseWithSplits) {
    showAlert(t('expenses.deleteConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeExpense.mutate(expense.id);
          setSelectedExpense(null);
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.centered]} edges={['top']}>
          <ActivityIndicator color={theme.accent} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">{t('expenses.title')}</ThemedText>
          <View style={styles.headerActions}>
            <RefreshAction refreshing={refreshing} onPress={onRefresh} />
            {!searching && sections.length > 1 && (
              <CollapseAllButton
                collapsed={allDaysCollapsed}
                onPress={() =>
                  setCollapseOverrides(
                    Object.fromEntries(sections.map((section) => [section.key, !allDaysCollapsed])),
                  )
                }
              />
            )}
            <SearchButton
              active={searchOpen}
              onPress={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            />
            <Pressable onPress={() => setDebtVisible(true)} hitSlop={8} style={styles.headerButton}>
              <AppSymbol
                name={{ ios: 'arrow.left.arrow.right.circle', android: 'swap_horizontal_circle' }}
                size={22}
                tintColor={theme.accent}
              />
            </Pressable>
            <Pressable
              onPress={() => setStatsVisible(true)}
              hitSlop={8}
              style={styles.headerButton}
            >
              <AppSymbol
                name={{ ios: 'chart.bar', android: 'bar_chart' }}
                size={22}
                tintColor={theme.accent}
              />
            </Pressable>
          </View>
        </ThemedView>

        {searchOpen ? (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('expenses.searchPlaceholder')}
            onClose={closeSearch}
          />
        ) : null}

        <SectionList
          sections={visibleSections}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          keyExtractor={(expense) => expense.id}
          contentContainerStyle={[
            styles.listContent,
            (searching ? searchResults.length === 0 : expenses.length === 0) &&
              styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={{ ios: 'creditcard', android: 'credit_card' }}
              title={t(searching ? 'expenses.searchEmpty' : 'expenses.empty')}
            />
          }
          renderSectionHeader={({ section }) =>
            searching ? (
              searchResults.length > 0 ? (
                <View style={styles.sectionHeader}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {section.title}
                  </ThemedText>
                </View>
              ) : null
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: !section.collapsed }}
                accessibilityLabel={t('expenses.daySectionAccessibility', {
                  date: section.title,
                  count: section.itemCount,
                })}
                onPress={() =>
                  setCollapseOverrides((current) => ({
                    ...current,
                    [section.key]: !section.collapsed,
                  }))
                }
                style={({ pressed }) => [
                  styles.sectionHeader,
                  pressed && styles.sectionHeaderPressed,
                ]}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {section.title.toUpperCase()}
                </ThemedText>
                <View style={styles.sectionHeaderMeta}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {section.itemCount}
                  </ThemedText>
                  <AppSymbol
                    name={{
                      ios: section.collapsed ? 'chevron.down' : 'chevron.up',
                      android: section.collapsed ? 'expand_more' : 'expand_less',
                    }}
                    size={17}
                    tintColor={theme.textSecondary}
                  />
                </View>
              </Pressable>
            )
          }
          renderItem={({ item, section }) => {
            const isSettled = isExpenseFullySettled(item);
            const money = formatMoney(
              item.total_amount,
              normalizeCurrencyCode(item.currency_code),
              i18n.language,
            );
            const stacked = compact || money.length > 14;
            const time = new Intl.DateTimeFormat(
              i18n.language,
              searching
                ? { dateStyle: 'medium', timeStyle: 'short' }
                : section.kind === 'month'
                  ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
                  : { timeStyle: 'short' },
            ).format(new Date(item.created_at));
            return (
              <Pressable
                onPress={() => {
                  setDetailOpenedFromPersonal(false);
                  setSelectedExpense(item);
                }}
              >
                <ThemedView
                  type="backgroundElement"
                  style={[styles.row, stacked && styles.rowCompact]}
                >
                  <AppSymbol
                    name={
                      isSettled
                        ? { ios: 'checkmark.seal.fill', android: 'verified' }
                        : { ios: 'circle', android: 'circle' }
                    }
                    size={20}
                    tintColor={isSettled ? theme.success : theme.textSecondary}
                  />
                  <View style={styles.rowInfo}>
                    <ThemedText
                      type="default"
                      themeColor={isSettled ? 'textSecondary' : 'text'}
                      style={[styles.rowTitle, isSettled && styles.rowTitleSettled]}
                    >
                      {item.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.expense_payments.length > 0
                        ? item.expense_payments
                            .map((payment) => nameById.get(payment.member_id) ?? '—')
                            .join(', ')
                        : '—'}{' '}
                      · {time}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="smallBold"
                    themeColor={isSettled ? 'textSecondary' : undefined}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    style={[styles.rowAmount, stacked && styles.rowAmountCompact]}
                  >
                    {money}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>

      <FloatingActionButton
        accessibilityLabel={t('expenses.addButton')}
        onPress={() => setAddVisible(true)}
      />

      <AddExpenseModal
        visible={addVisible}
        householdId={householdId}
        members={members}
        currentMemberId={currentMemberId}
        editingExpense={editingExpense}
        onClose={() => {
          setAddVisible(false);
          setEditingExpense(null);
        }}
      />
      <DebtSummaryModal
        visible={debtVisible}
        householdId={householdId}
        members={members}
        currentMemberId={currentMemberId}
        onClose={() => setDebtVisible(false)}
        onDismiss={() => {
          if (!openPersonalAfterDismiss) return;
          setOpenPersonalAfterDismiss(false);
          setPersonalSpendingVisible(true);
        }}
        onOpenPersonalSpending={() => {
          setDebtVisible(false);
          if (Platform.OS === 'ios') setOpenPersonalAfterDismiss(true);
          else setPersonalSpendingVisible(true);
        }}
      />
      <PersonalSpendingModal
        visible={personalSpendingVisible}
        householdId={householdId}
        currentMemberId={currentMemberId}
        onClose={() => setPersonalSpendingVisible(false)}
        onDismiss={() => {
          if (!expenseAfterDismiss) return;
          setSelectedExpense(expenseAfterDismiss);
          setExpenseAfterDismiss(null);
        }}
        onSelectExpense={(expense) => {
          setDetailOpenedFromPersonal(true);
          setPersonalSpendingVisible(false);
          if (Platform.OS === 'ios') setExpenseAfterDismiss(expense);
          else setSelectedExpense(expense);
        }}
      />
      <StatisticsModal
        visible={statsVisible}
        householdId={householdId}
        members={members}
        categories={categories}
        onClose={() => setStatsVisible(false)}
      />
      <ExpenseDetailModal
        expense={selectedExpense}
        members={members}
        categories={categories}
        onClose={() => {
          setSelectedExpense(null);
          if (!detailOpenedFromPersonal) return;
          setDetailOpenedFromPersonal(false);
          if (Platform.OS === 'ios') setReopenPersonalAfterDetailDismiss(true);
          else setPersonalSpendingVisible(true);
        }}
        onDismiss={() => {
          if (!reopenPersonalAfterDetailDismiss) return;
          setReopenPersonalAfterDetailDismiss(false);
          setPersonalSpendingVisible(true);
        }}
        onEdit={(expense) => {
          // Close the detail sheet first: two page sheets stacked on top of each
          // other leaves the form behind an overlay on iOS.
          setSelectedExpense(null);
          setDetailOpenedFromPersonal(false);
          setEditingExpense(expense);
          setAddVisible(true);
        }}
        onDelete={handleDelete}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  headerButton: {
    padding: Spacing.one,
  },
  rowAmount: { maxWidth: '45%', flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    minHeight: 44,
    paddingVertical: Spacing.one,
  },
  sectionHeaderMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sectionHeaderPressed: { opacity: 0.65 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowCompact: { flexWrap: 'wrap', columnGap: Spacing.two, rowGap: Spacing.two },
  rowAmountCompact: { width: '100%', maxWidth: '100%', flexBasis: '100%' },
  rowInfo: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  rowTitle: {
    fontWeight: '600',
  },
  rowTitleSettled: {
    textDecorationLine: 'line-through',
  },
});
