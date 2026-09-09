import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCreateHouseholdMutation, useJoinHouseholdMutation } from '@/hooks/use-household';
import { showAlert } from '@/lib/alert';
import { getAuthErrorMessageKey } from '@/lib/api/auth';
import { previewHouseholdMembers } from '@/lib/api/household';

type Mode = 'create' | 'join';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const createHousehold = useCreateHouseholdMutation();
  const joinHousehold = useJoinHouseholdMutation();

  const [mode, setMode] = useState<Mode>('create');
  const [yourName, setYourName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [checkedCode, setCheckedCode] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const preview = useMutation({ mutationFn: previewHouseholdMembers });

  const submitting = createHousehold.isPending || joinHousehold.isPending || preview.isPending;
  const canSubmitCreate = yourName.trim().length > 0 && householdName.trim().length > 0;
  const canSubmitJoin =
    (selectedMemberId !== null || yourName.trim().length > 0) && checkedCode === joinCode.trim();

  async function handleSubmit() {
    try {
      if (mode === 'create') {
        await createHousehold.mutateAsync({
          householdName: householdName.trim(),
          myName: yourName.trim(),
        });
      } else {
        await joinHousehold.mutateAsync({
          code: joinCode.trim(),
          myName: yourName.trim(),
          memberId: selectedMemberId,
        });
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : '';
      if (message.includes('member_already_claimed')) {
        setCheckedCode(null);
        setSelectedMemberId(null);
        preview.reset();
        showAlert(t('onboarding.claimed'));
      } else showAlert(t(getAuthErrorMessageKey(error)));
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            contentContainerStyle={{ gap: Spacing.four, paddingVertical: Spacing.four }}
            keyboardShouldPersistTaps="handled"
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
                    disabled={submitting}
                    onPress={() => setMode('create')}
                  />
                </View>
                <View style={styles.modeSwitchItem}>
                  <PrimaryButton
                    label={t('onboarding.joinHousehold')}
                    variant={mode === 'join' ? 'primary' : 'secondary'}
                    disabled={submitting}
                    onPress={() => setMode('join')}
                  />
                </View>
              </ThemedView>

              {(mode === 'create' || selectedMemberId === null) && (
                <TextField
                  label={t('onboarding.yourNameLabel')}
                  placeholder={t('onboarding.yourNamePlaceholder')}
                  value={yourName}
                  onChangeText={setYourName}
                  autoCapitalize="words"
                  editable={!submitting}
                  maxLength={100}
                />
              )}

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
                  onChangeText={(value) => {
                    setJoinCode(value);
                    setCheckedCode(null);
                    setSelectedMemberId(null);
                    preview.reset();
                  }}
                  editable={!submitting}
                  autoCapitalize="characters"
                />
              )}

              {mode === 'join' && (
                <>
                  <PrimaryButton
                    label={t('onboarding.checkCode')}
                    variant="secondary"
                    disabled={!joinCode.trim() || submitting}
                    onPress={async () => {
                      try {
                        await preview.mutateAsync(joinCode.trim());
                        setCheckedCode(joinCode.trim());
                      } catch (error) {
                        showAlert(t(getAuthErrorMessageKey(error)));
                      }
                    }}
                  />
                  {checkedCode && (
                    <>
                      <ThemedText type="small" themeColor="textSecondary">
                        {t('onboarding.chooseMember')}
                      </ThemedText>
                      {preview.data?.map((member) => (
                        <PrimaryButton
                          key={member.id}
                          label={member.name}
                          disabled={submitting}
                          variant={selectedMemberId === member.id ? 'primary' : 'secondary'}
                          onPress={() => setSelectedMemberId(member.id)}
                        />
                      ))}
                      <PrimaryButton
                        label={t('onboarding.newMember')}
                        disabled={submitting}
                        variant={selectedMemberId === null ? 'primary' : 'secondary'}
                        onPress={() => setSelectedMemberId(null)}
                      />
                      {selectedMemberId && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {t('onboarding.claimHint')}
                        </ThemedText>
                      )}
                    </>
                  )}
                </>
              )}
              <PrimaryButton
                label={
                  mode === 'create' ? t('onboarding.createButton') : t('onboarding.joinButton')
                }
                disabled={submitting || (mode === 'create' ? !canSubmitCreate : !canSubmitJoin)}
                onPress={handleSubmit}
              />
            </ThemedView>
          </ScrollView>
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
