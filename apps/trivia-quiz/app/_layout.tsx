import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
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
import { useAds } from '@/store/ads';
import { db } from '@/store/storage';
import { useNotificationResponses, useReminderSync } from '@/notifications/reminder';
import { useStats } from '@/store/stores';
import { useDayRollover } from '@/store/today';
import { useSettings } from '@/store/settings';
import { fonts, palette, TOUCH_TARGET } from '@/theme/tokens';
import '@/bootstrap';

// A render error anywhere shows a retry screen instead of closing the app in release builds.
export { CrashScreen as ErrorBoundary } from '@shared/errors';

function Root() {
  const { mode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [onboardingDone] = db.useStored('onboarding.done', false);
  const setupDone = useOnboardingComplete();
  useAdGuard();
  // Warm starts only (the hook never fires on a cold start); the rules also keep it off the question screen.
  useAppOpenAd(() => adAllowed('app_open', adContext()));
  // Consent and ads start after the first value on a first run (app/(onboarding)/warmup-result.tsx), and at launch afterwards.
  useEffect(() => {
    if (setupDone && onboardingDone) void startAds();
  }, [setupDone, onboardingDone]);
  useDayRollover();
  useEffect(() => initSounds(['check', 'wrong', 'tick', 'tap']), []);
  useReminderSync();
  useNotificationResponses(() => useAds.getState().markExternalOpen());
  // One more cold start, counted once per process.
  useEffect(() => {
    const stats = useStats.getState();
    stats.update({ sessions: stats.value.sessions + 1 });
  }, []);
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      {/* Follows the in-app theme, which can differ from the system one; the quiz stage sets its own. */}
      <SystemNavBar dark={mode !== 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(onboarding)/welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(onboarding)/warmup-result" options={{ gestureEnabled: false }} />
        <Stack.Screen name="quiz/[sessionId]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="results/[sessionId]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="debug-ads" options={{ presentation: 'modal' }} />
      </Stack>
      {/* Above the tab bar and the banner. */}
      <ToastHost bottom={insets.bottom + 128} />
    </>
  );
}

export default function RootLayout() {
  const textScale = useSettings((s) => s.settings.textScale);
  // Figtree and Bricolage are embedded as Android font families (app.config.ts), so nothing waits on fonts.
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider palette={palette} fonts={fonts} fontScale={textScale} touchTarget={TOUCH_TARGET}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
