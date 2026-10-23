import '@/lib/i18n';

import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { DeleteAccountPanel } from '@/components/delete-account-panel';
import { AuthScreen } from '@/components/auth-screen';
import { TermsScreen } from '@/components/terms-screen';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHouseholdQuery } from '@/hooks/use-household';
import { usePushRegistration } from '@/hooks/use-push-registration';
import { useRentReminders } from '@/hooks/use-rent-reminders';
import { SessionProvider, useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { accountDeletionKey, isAccountDeletionPending } from '@/lib/api/account-deletion';
import { hasAcceptedTerms, termsKey } from '@/lib/api/safety';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const session = useSession();
  const deletionQuery = useQuery({
    queryKey: accountDeletionKey(session?.user.id),
    queryFn: () => isAccountDeletionPending(session!.user.id),
    enabled: !!session,
    staleTime: 0,
  });
  const termsQuery = useQuery({
    queryKey: termsKey(session?.user.id),
    queryFn: () => hasAcceptedTerms(session!.user.id),
    enabled: !!session,
  });
  // Only fetch once there's a session — otherwise this query runs unauthenticated
  // and RLS correctly (but confusingly) returns nothing.
  const householdQuery = useHouseholdQuery(!!session);
  const { data: household, isLoading: isHouseholdLoading } = householdQuery;
  usePushRegistration(!!session && !!household && termsQuery.data === true && !deletionQuery.data);
  useRentReminders(session ? household?.id : undefined);
  const isReady =
    session !== undefined &&
    (!session || (!isHouseholdLoading && !deletionQuery.isLoading && !termsQuery.isLoading));

  // Keep the native logo splash visible while persisted auth and household
  // state are restored. Once ready, reveal the actual first screen directly;
  // there is deliberately no second branded overlay in between.
  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) {
    return (
      <ThemedView style={styles.loading}>
        <LoadingSpinner />
      </ThemedView>
    );
  }

  if (session && deletionQuery.data) {
    return (
      <ThemedView style={styles.loading}>
        <DeleteAccountPanel pending />
      </ThemedView>
    );
  }

  if (session && (householdQuery.isError || deletionQuery.isError || termsQuery.isError)) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText type="default" themeColor="textSecondary" style={styles.loadingError}>
          {t('household.loadError')}
        </ThemedText>
        <PrimaryButton
          label={t('common.retry')}
          onPress={() => {
            void householdQuery.refetch();
            void deletionQuery.refetch();
            void termsQuery.refetch();
          }}
        />
      </ThemedView>
    );
  }

  if (!session) return <AuthScreen />;
  if (!termsQuery.data) return <TermsScreen userId={session.user.id} />;
  return household ? <AppTabs /> : <OnboardingScreen />;
}

function LoadingSpinner() {
  const theme = useTheme();
  return <ActivityIndicator color={theme.accent} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  loadingError: { textAlign: 'center' },
});
