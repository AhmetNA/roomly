import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { showAlert } from '@/lib/alert';
import { deleteMyAccount } from '@/lib/api/account-deletion';

export function DeleteAccountPanel({ pending = false }: { pending?: boolean }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  async function removeAccount() {
    setSubmitting(true);
    try {
      const deleted = await deleteMyAccount();
      if (!deleted) showAlert(t('accountDeletion.pendingTitle'), t('accountDeletion.retryBody'));
    } catch {
      showAlert(t('accountDeletion.errorTitle'), t('accountDeletion.retryBody'));
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDeletion() {
    showAlert(t('accountDeletion.confirmTitle'), t('accountDeletion.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('accountDeletion.delete'),
        style: 'destructive',
        onPress: () => void removeAccount(),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {pending && (
        <>
          <ThemedText type="subtitle">{t('accountDeletion.pendingTitle')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('accountDeletion.retryBody')}
          </ThemedText>
        </>
      )}
      <PrimaryButton
        label={
          submitting
            ? t('accountDeletion.deleting')
            : pending
              ? t('accountDeletion.retry')
              : t('accountDeletion.delete')
        }
        variant="danger"
        disabled={submitting}
        onPress={pending ? () => void removeAccount() : confirmDeletion}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: Spacing.three },
});
