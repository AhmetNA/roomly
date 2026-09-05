import '@/lib/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { ThemedView } from '@/components/themed-view';
import { useHouseholdQuery } from '@/hooks/use-household';
import { SessionProvider, useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const session = useSession();
  // Only fetch once there's a session — otherwise this query runs unauthenticated
  // and RLS correctly (but confusingly) returns nothing.
  const { data: household, isLoading: isHouseholdLoading } = useHouseholdQuery(!!session);

  if (session === undefined || (session && isHouseholdLoading)) {
    return (
      <ThemedView style={styles.loading}>
        <LoadingSpinner />
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
  },
});
