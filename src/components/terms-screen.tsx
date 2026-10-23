import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet } from 'react-native';

import { DeleteAccountPanel } from '@/components/delete-account-panel';
import { PolicyLinks } from '@/components/policy-links';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { showAlert } from '@/lib/alert';
import { acceptTerms, termsKey } from '@/lib/api/safety';

export function TermsScreen({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function accept() {
    setBusy(true);
    try {
      await acceptTerms();
      await client.invalidateQueries({ queryKey: termsKey(userId) });
    } catch {
      showAlert(t('safety.error'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">{t('safety.termsTitle')}</ThemedText>
          <ThemedText>{t('safety.termsBody')}</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            {t('safety.privacyNotice')}
          </ThemedText>
          <PolicyLinks />
          <PrimaryButton label={t('safety.accept')} disabled={busy} onPress={() => void accept()} />
          <DeleteAccountPanel />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
});
