import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { showAlert } from '@/lib/alert';
import {
  getAuthErrorMessageKey,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/api/auth';

// Google Cloud OAuth client + Supabase provider + redirect URL allowlist are
// all configured now (see README's "Google ile giriş" section for the setup
// steps, kept for reference/re-setup).
const GOOGLE_AUTH_ENABLED = true;

type Mode = 'signIn' | 'signUp';

export function AuthScreen() {
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
        showAlert(t('auth.checkEmailTitle'), t('auth.checkEmailBody'));
      }
    } catch (error) {
      showAlert(t(getAuthErrorMessageKey(error)));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      showAlert(t(getAuthErrorMessageKey(error)));
    } finally {
      setSubmitting(false);
    }
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
              {t('auth.title')}
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              {t('auth.subtitle')}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedView type="backgroundElement" style={styles.modeSwitch}>
              <View style={styles.modeSwitchItem}>
                <PrimaryButton
                  label={t('auth.signIn')}
                  variant={mode === 'signIn' ? 'primary' : 'secondary'}
                  onPress={() => setMode('signIn')}
                />
              </View>
              <View style={styles.modeSwitchItem}>
                <PrimaryButton
                  label={t('auth.signUp')}
                  variant={mode === 'signUp' ? 'primary' : 'secondary'}
                  onPress={() => setMode('signUp')}
                />
              </View>
            </ThemedView>

            <TextField
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label={t('auth.passwordLabel')}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry
              autoComplete="password"
            />

            <PrimaryButton
              label={mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
              disabled={!canSubmit}
              onPress={handleSubmit}
            />

            {GOOGLE_AUTH_ENABLED && (
              <>
                <View style={styles.dividerRow}>
                  <ThemedView type="border" style={styles.dividerLine} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('auth.orDivider')}
                  </ThemedText>
                  <ThemedView type="border" style={styles.dividerLine} />
                </View>

                <PrimaryButton
                  label={t('auth.continueWithGoogle')}
                  variant="secondary"
                  disabled={submitting}
                  onPress={handleGoogle}
                />
              </>
            )}
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
