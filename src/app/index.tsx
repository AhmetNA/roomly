import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { FloatingActionButton } from '@/components/floating-action-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';

export default function ExpensesScreen() {
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScreenHeader title={t('expenses.title')} />
        <EmptyState icon="creditcard" title={t('expenses.empty')} hint={t('expenses.emptyHint')} />
      </SafeAreaView>
      <FloatingActionButton
        accessibilityLabel={t('expenses.addButton')}
        onPress={() => Alert.alert(t('common.comingSoon'))}
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
});
