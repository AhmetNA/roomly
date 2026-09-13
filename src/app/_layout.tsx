import '@/lib/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useHouseholdQuery } from '@/hooks/use-household';
import { usePushRegistration } from '@/hooks/use-push-registration';
import { SessionProvider, useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
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
  // Only fetch once there's a session — otherwise this query runs unauthenticated
  // and RLS correctly (but confusingly) returns nothing.
  const householdQuery = useHouseholdQuery(!!session);
  const { data: household, isLoading: isHouseholdLoading } = householdQuery;
  usePushRegistration(!!session && !!household);
  const isReady = session !== undefined && (!session || !isHouseholdLoading);

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

  if (session && householdQuery.isError) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText type="default" themeColor="textSecondary" style={styles.loadingError}>
          {t('household.loadError')}
        </ThemedText>
        <PrimaryButton label={t('common.retry')} onPress={() => householdQuery.refetch()} />
      </ThemedView>
    );
  }

  if (!session) return <AuthScreen />;
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
