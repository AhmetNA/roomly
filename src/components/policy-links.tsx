import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { showAlert } from '@/lib/alert';

export function PolicyLinks() {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {(['privacy', 'terms', 'support'] as const).map((key) => (
        <Pressable
          key={key}
          accessibilityRole="link"
          style={styles.link}
          onPress={() =>
            void Linking.openURL(`https://ahmetna.github.io/roomly/${key}/`).catch(() =>
              showAlert(t('safety.error')),
            )
          }
        >
          <ThemedText type="small" themeColor="accent">
            {t(`safety.${key}`)}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  link: { paddingVertical: Spacing.two },
});
