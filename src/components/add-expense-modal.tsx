import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryPicker } from '@/components/category-picker';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategoriesQuery } from '@/hooks/use-categories';
import { useCreateExpenseMutation } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import { getExpenseErrorMessageKey } from '@/lib/api/expenses';
import type { MemberRow } from '@/lib/api/household';
import { computeEqualSplit, computeSharesSplit, sumSplitAmounts } from '@/lib/expense-split';

type SplitType = 'equal' | 'shares' | 'fixed';

export function AddExpenseModal({
  visible,
  householdId,
  members,
  currentMemberId,
  onClose,
}: {
  visible: boolean;
  householdId: string | undefined;
  members: MemberRow[];
  currentMemberId: string | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: categories = [] } = useCategoriesQuery(householdId);
  const createExpense = useCreateExpenseMutation(householdId);

  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [payerIds, setPayerIds] = useState<string[]>(currentMemberId ? [currentMemberId] : []);
  const [paidText, setPaidText] = useState<Record<string, string>>({});
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [participantIds, setParticipantIds] = useState<string[]>(members.map((m) => m.id));
  const [sharesText, setSharesText] = useState<Record<string, string>>({});
  const [fixedText, setFixedText] = useState<Record<string, string>>({});

  const amount = Number(amountText.replace(',', '.'));
  const isAmountValid = Number.isFinite(amount) && amount > 0;

  const paidTotal = useMemo(
    () =>
      payerIds.reduce((sum, id) => sum + (Number((paidText[id] ?? '').replace(',', '.')) || 0), 0),
    [payerIds, paidText],
  );
  const paidMismatch = payerIds.length > 1 && isAmountValid && Math.abs(paidTotal - amount) > 0.01;

  const fixedTotal = useMemo(
    () =>
      Object.values(fixedText).reduce(
        (sum, value) => sum + (Number(value.replace(',', '.')) || 0),
        0,
      ),
    [fixedText],
  );
  const fixedMismatch =
    splitType === 'fixed' && isAmountValid && Math.abs(fixedTotal - amount) > 0.01;

  const canSubmit =
    title.trim().length > 0 &&
    isAmountValid &&
    payerIds.length > 0 &&
    !paidMismatch &&
    !fixedMismatch &&
    (splitType !== 'equal' || participantIds.length > 0) &&
    (splitType !== 'shares' || Object.values(sharesText).some((value) => Number(value) > 0));

  function resetAndClose() {
    setTitle('');
    setAmountText('');
    setCategoryId(null);
    setSplitType('equal');
    setSharesText({});
    setFixedText({});
    setPaidText({});
    onClose();
  }

  async function handleSubmit() {
    if (!householdId || payerIds.length === 0) return;

    // The remainder from an uneven split lands on the first selected payer —
    // arbitrary among multiple payers, but it has to land somewhere exact.
    const remainderMemberId = payerIds[0];

    const splits =
      splitType === 'equal'
        ? computeEqualSplit(amount, participantIds, remainderMemberId)
        : splitType === 'shares'
          ? computeSharesSplit(
              amount,
              new Map(
                members
                  .map((m): [string, number] => [m.id, Number(sharesText[m.id]) || 0])
                  .filter(([, shares]) => shares > 0),
              ),
              remainderMemberId,
            )
          : members.map((m) => ({
              memberId: m.id,
              amountOwed: Number((fixedText[m.id] ?? '0').replace(',', '.')) || 0,
              shares: null,
            }));

    if (splits.length === 0 || Math.abs(sumSplitAmounts(splits) - amount) > 0.01) {
      Alert.alert(t('expenses.splitMismatch'));
      return;
    }

    const payments =
      payerIds.length === 1
        ? [{ memberId: payerIds[0], amountPaid: amount }]
        : payerIds.map((id) => ({
            memberId: id,
            amountPaid: Number((paidText[id] ?? '0').replace(',', '.')) || 0,
          }));

    try {
      await createExpense.mutateAsync({
        householdId,
        categoryId,
        title: title.trim(),
        totalAmount: Math.round(amount * 100) / 100,
        splitType,
        splits,
        payments,
      });
      resetAndClose();
    } catch (error) {
      Alert.alert(t(getExpenseErrorMessageKey(error)));
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
      onShow={() => {
        // Re-sync defaults each time the modal opens (household membership can
        // change between opens) rather than only once on mount.
        setPayerIds(currentMemberId ? [currentMemberId] : []);
        setParticipantIds(members.map((m) => m.id));
      }}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <ScreenHeader title={t('expenses.addTitle')} />
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <TextField
              label={t('expenses.titleLabel')}
              placeholder={t('expenses.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
            />
            <TextField
              label={t('expenses.amountLabel')}
              placeholder={t('expenses.amountPlaceholder')}
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
            />

            <ThemedText type="small" themeColor="textSecondary">
              {t('expenses.paidByLabel')}
            </ThemedText>
            <MemberChipRow
              members={members}
              selectedIds={payerIds}
              onToggle={(id) =>
                setPayerIds((current) =>
                  current.includes(id) ? current.filter((m) => m !== id) : [...current, id],
                )
              }
              multiSelect
            />
            {payerIds.length > 1 && (
              <ThemedView style={styles.memberInputList}>
                {payerIds.map((id) => (
                  <ThemedView key={id} type="backgroundElement" style={styles.memberInputRow}>
                    <ThemedText type="default" style={styles.memberInputName}>
                      {members.find((m) => m.id === id)?.name}
                    </ThemedText>
                    <TextInput
                      value={paidText[id] ?? ''}
                      onChangeText={(value) =>
                        setPaidText((current) => ({ ...current, [id]: value }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.memberInputField,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                    />
                  </ThemedView>
                ))}
                {paidMismatch && (
                  <ThemedText type="small" themeColor="danger">
                    {t('expenses.paymentMismatch')}
                  </ThemedText>
                )}
              </ThemedView>
            )}

            <ThemedText type="small" themeColor="textSecondary">
              {t('expenses.categoryLabel')}
            </ThemedText>
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
              noneLabel={t('list.noCategory')}
            />

            <ThemedText type="small" themeColor="textSecondary">
              {t('expenses.splitTypeLabel')}
            </ThemedText>
            <View style={styles.segmentRow}>
              {(['equal', 'shares', 'fixed'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSplitType(type)}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: splitType === type ? theme.accent : theme.backgroundElement,
                    },
                  ]}
                >
                  <ThemedText type="small" themeColor={splitType === type ? 'onAccent' : undefined}>
                    {t(
                      `expenses.split${type === 'equal' ? 'Equal' : type === 'shares' ? 'Shares' : 'Fixed'}`,
                    )}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {splitType === 'equal' && (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('expenses.participantsLabel')}
                </ThemedText>
                <MemberChipRow
                  members={members}
                  selectedIds={participantIds}
                  onToggle={(id) =>
                    setParticipantIds((current) =>
                      current.includes(id) ? current.filter((m) => m !== id) : [...current, id],
                    )
                  }
                  multiSelect
                />
              </>
            )}

            {splitType === 'shares' && (
              <ThemedView style={styles.memberInputList}>
                {members.map((member) => (
                  <ThemedView
                    key={member.id}
                    type="backgroundElement"
                    style={styles.memberInputRow}
                  >
                    <ThemedText type="default" style={styles.memberInputName}>
                      {member.name}
                    </ThemedText>
                    <TextInput
                      value={sharesText[member.id] ?? ''}
                      onChangeText={(value) =>
                        setSharesText((current) => ({ ...current, [member.id]: value }))
                      }
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.memberInputField,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                    />
                  </ThemedView>
                ))}
              </ThemedView>
            )}

            {splitType === 'fixed' && (
              <ThemedView style={styles.memberInputList}>
                {members.map((member) => (
                  <ThemedView
                    key={member.id}
                    type="backgroundElement"
                    style={styles.memberInputRow}
                  >
                    <ThemedText type="default" style={styles.memberInputName}>
                      {member.name}
                    </ThemedText>
                    <TextInput
                      value={fixedText[member.id] ?? ''}
                      onChangeText={(value) =>
                        setFixedText((current) => ({ ...current, [member.id]: value }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.memberInputField,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                    />
                  </ThemedView>
                ))}
                {fixedMismatch && (
                  <ThemedText type="small" themeColor="danger">
                    {t('expenses.splitMismatch')}
                  </ThemedText>
                )}
              </ThemedView>
            )}

            <PrimaryButton
              label={t('common.add')}
              disabled={!canSubmit || createExpense.isPending}
              onPress={handleSubmit}
            />
            <PrimaryButton label={t('common.cancel')} variant="secondary" onPress={resetAndClose} />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function MemberChipRow({
  members,
  selectedIds,
  onToggle,
  multiSelect = false,
}: {
  members: MemberRow[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multiSelect?: boolean;
}) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
      {members.map((member) => {
        const selected = selectedIds.includes(member.id);
        return (
          <Pressable
            key={member.id}
            onPress={() => onToggle(member.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.accent : theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            {multiSelect && (
              <SymbolView
                name={
                  selected
                    ? { ios: 'checkmark.circle.fill', android: 'check_circle' }
                    : { ios: 'circle', android: 'circle' }
                }
                size={14}
                tintColor={selected ? theme.onAccent : theme.textSecondary}
              />
            )}
            <ThemedText type="small" themeColor={selected ? 'onAccent' : undefined}>
              {member.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginRight: Spacing.two,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  memberInputList: {
    gap: Spacing.two,
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  memberInputName: {
    flex: 1,
  },
  memberInputField: {
    width: 80,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    textAlign: 'right',
    fontSize: 16,
  },
});
