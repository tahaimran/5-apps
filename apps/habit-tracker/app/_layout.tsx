import { useEffect } from 'react';
import { AppState } from 'react-native';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppOpenAd } from '@shared/ads';
import { useOnboardingComplete } from '@shared/onboarding';
import { initSounds } from '@shared/sound';
import { ThemeProvider, useTheme } from '@shared/theme';
import { ToastHost } from '@shared/ui';
import { hasCheckInIn, installAdGuard, useAdsStart } from '@/ads/guard';
import { useNotificationResponses, useNotificationSync } from '@/notifications/sync';
import { dayKeyFor } from '@/domain/dayKey';
import { useHabits } from '@/store/habits';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useDayRollover } from '@/store/today';
import { startWidgetSync } from '@/widget/sync';
import { fonts, palette } from '@/theme/tokens';
import '@/bootstrap';

// A render error anywhere shows a retry screen instead of closing the app in release builds.
export { CrashScreen as ErrorBoundary } from '@shared/errors';

function Root() {
  const { mode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const onboardingDone = useOnboardingComplete();
  useDayRollover();
  useNotificationSync();
  useNotificationResponses();
  useEffect(() => startWidgetSync(), []);
  useEffect(() => initSounds(), []);

  // Consent (UMP) and ads start only after onboarding and the first check-in, i.e. after the
  // first-value moment (plan §6). The veto in installAdGuard enforces the "never show" rules.
  const checkedIn = useHabits((s) => hasCheckInIn(s.entries));
  useAdsStart(checkedIn, onboardingDone);
  useEffect(() => installAdGuard(), []);
  useAppOpenAd(() => true);

  // Distinct open days (app-open ads wait for day 2).
  useEffect(() => {
    const record = () => useProfile.getState().recordOpen(dayKeyFor(new Date(), useSettings.getState().settings.dayEndsAtHour));
    record();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && record());
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      {/* Follows the in-app theme, which can differ from the system one. */}
      <NavigationBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.display, fontWeight: '600' },
        }}
      >
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="habit/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="templates" options={{ presentation: 'modal' }} />
        {/* Not formSheet: an Android form sheet with a header and keyboard is an unstable react-native-screens path. */}
        <Stack.Screen name="note/[date]" options={{ presentation: 'modal' }} />
      </Stack>
      {/* Above the tab bar and the banner. */}
      <ToastHost bottom={insets.bottom + 128} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider palette={palette} fonts={fonts}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
