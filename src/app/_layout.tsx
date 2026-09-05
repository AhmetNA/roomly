import '@/lib/i18n';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { useStoreHydrated } from '@/hooks/use-store-hydrated';
import { useHouseholdStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const hydrated = useStoreHydrated();
  const household = useHouseholdStore((state) => state.household);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {hydrated && (household ? <AppTabs /> : <OnboardingScreen />)}
    </ThemeProvider>
  );
}
