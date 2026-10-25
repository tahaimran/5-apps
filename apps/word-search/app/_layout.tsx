import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppOpenAd } from '@shared/ads';
import { useOnboardingComplete } from '@shared/onboarding';
import { initSounds } from '@shared/sound';
import { ThemeProvider, useTheme } from '@shared/theme';
import { SystemNavBar, ToastHost } from '@shared/ui';
import { adContext, useAdGuard } from '@/ads/guard';
import { startAds } from '@/ads/start';
import { adAllowed } from '@/domain/adRules';
import { useNotificationResponses, useReminderSync } from '@/notifications/reminder';
import { useSettings } from '@/store/settings';
import { useStats } from '@/store/stats';
import { useDayRollover } from '@/store/today';
import { fontScaleFor, tabBarHeight, themeProps } from '@/theme/tokens';
import '@/bootstrap';

// A render error anywhere shows a retry screen instead of closing the app in release builds.
export { CrashScreen as ErrorBoundary } from '@shared/errors';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  const { mode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const setupDone = useOnboardingComplete();
  const sounds = useSettings((s) => s.settings.sounds);
  // The found-word chime and the finish arpeggio load up front so the first one plays without a delay.
  useEffect(() => {
    if (sounds) initSounds(['check', 'complete']);
  }, [sounds]);
  useAdGuard();
  // Warm starts only (the hook never fires on a cold start); the rules also keep it out of a puzzle in progress.
  useAppOpenAd(() => adAllowed('app_open', adContext()));
  // On a first run consent and ads start after the setup screens (app/onboarding.tsx); on later launches right away.
  useEffect(() => {
    if (setupDone) void startAds();
  }, [setupDone]);
  useDayRollover();
  useReminderSync();
  useNotificationResponses();
  useEffect(() => {
    useStats.getState().recordSession();
    // Fonts are embedded in the build (expo-font plugin), so there is nothing to wait for.
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <SystemNavBar dark={mode !== 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="complete/[puzzleId]" options={{ presentation: 'modal', gestureEnabled: false, animation: 'fade' }} />
      </Stack>
      {/* Above the tab bar; one host for every screen (the tutorial's "You found it!" and other short notes). */}
      <ToastHost bottom={tabBarHeight(fontScale) + insets.bottom + 12} />
    </>
  );
}

export default function RootLayout() {
  const textSize = useSettings((s) => s.settings.textSize);
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider {...themeProps} fontScale={fontScaleFor(textSize)}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
