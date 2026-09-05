import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useHouseholdStore } from '@/lib/store';

type Mode = 'create' | 'join';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const createHousehold = useHouseholdStore((state) => state.createHousehold);

  const [mode, setMode] = useState<Mode>('create');
  const [yourName, setYourName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const canSubmitCreate = yourName.trim().length > 0 && householdName.trim().length > 0;
  const canSubmitJoin = yourName.trim().length > 0 && joinCode.trim().length > 0;

  function handleSubmit() {
    if (mode === 'create') {
      createHousehold(householdName.trim(), yourName.trim());
      return;
    }
    Alert.alert(t('onboarding.joinComingSoon'));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {t('onboarding.title')}
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              {t('onboarding.subtitle')}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedView type="backgroundElement" style={styles.modeSwitch}>
              <View style={styles.modeSwitchItem}>
                <PrimaryButton
                  label={t('onboarding.createHousehold')}
                  variant={mode === 'create' ? 'primary' : 'secondary'}
                  onPress={() => setMode('create')}
                />
              </View>
              <View style={styles.modeSwitchItem}>
                <PrimaryButton
                  label={t('onboarding.joinHousehold')}
                  variant={mode === 'join' ? 'primary' : 'secondary'}
                  onPress={() => setMode('join')}
                />
              </View>
            </ThemedView>

            <TextField
              label={t('onboarding.yourNameLabel')}
              placeholder={t('onboarding.yourNamePlaceholder')}
              value={yourName}
              onChangeText={setYourName}
              autoCapitalize="words"
            />

            {mode === 'create' ? (
              <TextField
                label={t('onboarding.householdNameLabel')}
                placeholder={t('onboarding.householdNamePlaceholder')}
                value={householdName}
                onChangeText={setHouseholdName}
                autoCapitalize="words"
              />
            ) : (
              <TextField
                label={t('onboarding.joinCodeLabel')}
                placeholder={t('onboarding.joinCodePlaceholder')}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
              />
            )}

            <PrimaryButton
              label={mode === 'create' ? t('onboarding.createButton') : t('onboarding.joinButton')}
              disabled={mode === 'create' ? !canSubmitCreate : !canSubmitJoin}
              onPress={handleSubmit}
            />
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  keyboardAvoiding: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    lineHeight: 22,
  },
  form: {
    gap: Spacing.three,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.one,
    borderRadius: Spacing.three,
  },
  modeSwitchItem: {
    flex: 1,
  },
});
