import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddExpenseModal } from '@/components/add-expense-modal';
import { DebtSummaryModal } from '@/components/debt-summary-modal';
import { EmptyState } from '@/components/empty-state';
import { ExpenseDetailModal } from '@/components/expense-detail-modal';
import { FloatingActionButton } from '@/components/floating-action-button';
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
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import type { ExpenseWithSplits } from '@/lib/api/expenses';
import { isExpenseFullySettled } from '@/lib/debt';

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const session = useSession();

  const { data: household } = useHouseholdQuery();
  const householdId = household?.id;
  const { data: members = [] } = useMembersQuery(householdId);
  const { data: categories = [] } = useCategoriesQuery(householdId);
  const { data: expenses = [], isLoading } = useExpensesQuery(householdId);
  useExpensesRealtime(householdId);
  const removeExpense = useRemoveExpenseMutation(householdId);

  const currentMemberId = members.find((m) => m.user_id === session?.user.id)?.id;
  const nameById = new Map(members.map((m) => [m.id, m.name]));

  const [addVisible, setAddVisible] = useState(false);
  const [debtVisible, setDebtVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithSplits | null>(null);

  function handleDelete(expense: ExpenseWithSplits) {
    Alert.alert(t('expenses.deleteConfirm'), undefined, [
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
            <Pressable onPress={() => setDebtVisible(true)} hitSlop={8} style={styles.headerButton}>
              <SymbolView
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
              <SymbolView
                name={{ ios: 'chart.bar', android: 'bar_chart' }}
                size={22}
                tintColor={theme.accent}
              />
            </Pressable>
          </View>
        </ThemedView>

        {expenses.length === 0 ? (
          <EmptyState
            icon={{ ios: 'creditcard', android: 'credit_card' }}
            title={t('expenses.empty')}
            hint={t('expenses.emptyHint')}
          />
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(expense) => expense.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSettled = isExpenseFullySettled(item);
              return (
                <Pressable onPress={() => setSelectedExpense(item)}>
                  <ThemedView type="backgroundElement" style={styles.row}>
                    <View style={styles.rowInfo}>
                      <ThemedText
                        type="default"
                        themeColor={isSettled ? 'textSecondary' : 'text'}
                        style={[styles.rowTitle, isSettled && styles.rowTitleSettled]}
                      >
                        {item.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.paid_by ? nameById.get(item.paid_by) : '—'} ·{' '}
                        {new Date(item.created_at).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <ThemedText
                      type="smallBold"
                      themeColor={isSettled ? 'textSecondary' : undefined}
                    >
                      {item.total_amount.toFixed(2)}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            }}
          />
        )}
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
        onClose={() => setAddVisible(false)}
      />
      <DebtSummaryModal
        visible={debtVisible}
        householdId={householdId}
        members={members}
        onClose={() => setDebtVisible(false)}
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
        onClose={() => setSelectedExpense(null)}
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
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowInfo: {
    gap: Spacing.half,
  },
  rowTitle: {
    fontWeight: '600',
  },
  rowTitleSettled: {
    textDecorationLine: 'line-through',
  },
});
