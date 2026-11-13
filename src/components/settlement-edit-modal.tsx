import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PopupShadow, Spacing } from '@/constants/theme';
import { useDeleteSettlementMutation, useUpdateSettlementMutation } from '@/hooks/use-settlements';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import type { SettlementRow } from '@/lib/api/settlements';
import { formatMoney, normalizeCurrencyCode } from '@/lib/currency';

export function SettlementEditModal({
  settlement,
  householdId,
  fromName,
  toName,
  onClose,
}: {
  settlement: SettlementRow | null;
  householdId: string | undefined;
  fromName: string;
  toName: string;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const updateSettlement = useUpdateSettlementMutation(householdId);
  const deleteSettlement = useDeleteSettlementMutation(householdId);
  const [amountText, setAmountText] = useState('');

  // Reset the field whenever a different row opens (render-time sync, not an effect).
  const [prefilledFor, setPrefilledFor] = useState(settlement);
  if (settlement !== prefilledFor) {
    setPrefilledFor(settlement);
    if (settlement) setAmountText(String(settlement.amount));
  }

  const amount = Math.round(Number(amountText.replace(',', '.')) * 100) / 100;
  const isAmountValid = Number.isFinite(amount) && amount > 0;
  const busy = updateSettlement.isPending || deleteSettlement.isPending;

  function handleSave() {
    if (!settlement || !isAmountValid) return;
    if (amount === settlement.amount) {
      onClose();
      return;
    }
    updateSettlement.mutate(
      { settlementId: settlement.id, amount },
      {
        onSuccess: onClose,
        onError: () => showAlert(t('auth.errors.generic')),
      },
    );
  }

  function handleDelete() {
    if (!settlement) return;
    showAlert(t('expenses.paymentDeleteConfirm'), t('expenses.paymentDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          deleteSettlement.mutate(settlement.id, {
            onSuccess: onClose,
            onError: () => showAlert(t('auth.errors.generic')),
          }),
      },
    ]);
  }

  return (
    <Modal visible={settlement !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        {settlement && (
          <ThemedView style={[styles.card, PopupShadow]}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.centered}>
              {t('expenses.paymentDetailTitle')}
            </ThemedText>
            <ThemedText type="default" style={styles.centered}>
              {t('expenses.paymentRowTitle', { from: fromName, to: toName })}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
              {new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(settlement.created_at))}
              {' · '}
              {formatMoney(
                settlement.amount,
                normalizeCurrencyCode(settlement.currency_code),
                i18n.language,
              )}
            </ThemedText>

            <TextField
              label={t('expenses.settleAmountLabel')}
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              placeholder={t('expenses.amountPlaceholder')}
              selectTextOnFocus
            />
            {!isAmountValid && amountText.trim().length > 0 ? (
              <ThemedText type="small" themeColor="danger">
                {t('expenses.paymentAmountInvalid')}
              </ThemedText>
            ) : null}

            <View style={styles.actionColumn}>
              <PrimaryButton
                label={t('common.save')}
                icon={{ ios: 'checkmark', android: 'check' }}
                onPress={handleSave}
                disabled={!isAmountValid || busy}
              />
              <PrimaryButton
                label={t('common.delete')}
                variant="danger"
                icon={{ ios: 'trash', android: 'delete' }}
                onPress={handleDelete}
                disabled={busy}
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
  centered: { textAlign: 'center' },
  actionColumn: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
