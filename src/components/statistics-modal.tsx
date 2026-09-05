import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useExpensesQuery } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryRow } from '@/lib/api/categories';
import type { MemberRow } from '@/lib/api/household';
import { computeStatistics, type StatisticsPeriod } from '@/lib/statistics';

export function StatisticsModal({
  visible,
  householdId,
  members,
  categories,
  onClose,
}: {
  visible: boolean;
  householdId: string | undefined;
  members: MemberRow[];
  categories: CategoryRow[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: expenses = [] } = useExpensesQuery(householdId);
  const [period, setPeriod] = useState<StatisticsPeriod>('month');

  const stats = useMemo(() => computeStatistics(expenses, period), [expenses, period]);
  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);
  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <ScreenHeader title={t('statistics.title')} />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.segmentRow}>
              {(['month', 'year', 'all'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[
                    styles.segment,
                    { backgroundColor: period === p ? theme.accent : theme.backgroundElement },
                  ]}
                >
                  <ThemedText type="small" themeColor={period === p ? 'onAccent' : undefined}>
                    {t(
                      `statistics.period${p === 'month' ? 'Month' : p === 'year' ? 'Year' : 'All'}`,
                    )}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedView type="backgroundElement" style={styles.totalCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('statistics.totalLabel')}
              </ThemedText>
              <ThemedText type="title" style={styles.totalAmount}>
                {stats.totalAmount.toFixed(2)}
              </ThemedText>
            </ThemedView>

            {stats.totalAmount === 0 ? (
              <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
                {t('statistics.empty')}
              </ThemedText>
            ) : (
              <>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                  {t('statistics.byMemberTitle').toUpperCase()}
                </ThemedText>
                {[...stats.byMember.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([memberId, amount]) => (
                    <StatRow key={memberId} label={nameById.get(memberId) ?? '—'} amount={amount} />
                  ))}

                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                  {t('statistics.byCategoryTitle').toUpperCase()}
                </ThemedText>
                {[...stats.byCategory.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([categoryId, amount]) => (
                    <StatRow
                      key={categoryId ?? 'none'}
                      label={
                        categoryId
                          ? (categoryNameById.get(categoryId) ?? '—')
                          : t('statistics.uncategorized')
                      }
                      amount={amount}
                    />
                  ))}
              </>
            )}

            <PrimaryButton
              label={t('common.close')}
              variant="secondary"
              icon={{ ios: 'xmark', android: 'close' }}
              onPress={onClose}
            />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function StatRow({ label, amount }: { label: string; amount: number }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <ThemedText type="default">{label}</ThemedText>
      <ThemedText type="smallBold">{amount.toFixed(2)}</ThemedText>
    </ThemedView>
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
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  totalCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  totalAmount: {
    fontSize: 36,
    lineHeight: 42,
  },
  sectionTitle: {
    marginTop: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
