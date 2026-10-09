import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useAppOpenAd } from '@shared/ads';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
import { adContext, useAdGuard } from '@/ads/guard';
import { startAds } from '@/ads/start';
import { adAllowed } from '@/domain/adRules';
import { useAds } from '@/store/ads';
import { db } from '@/store/storage';
import { useNotificationResponses, useReminderSync } from '@/notifications/reminder';
import { useStats } from '@/store/stores';
import { useDayRollover } from '@/store/today';
import { useSettings } from '@/store/settings';
import { palette, TOUCH_TARGET } from '@/theme/tokens';
import { FONT_BOLD, FONT_MEDIUM, FONT_REGULAR, FONT_SEMIBOLD } from '@/ui/AppText';
import '@/bootstrap';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  const { mode, colors } = useTheme();
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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(onboarding)/welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(onboarding)/warmup-result" options={{ gestureEnabled: false }} />
        <Stack.Screen name="quiz/[sessionId]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="results/[sessionId]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="debug-ads" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const textScale = useSettings((s) => s.settings.textScale);
  // The splash stays up until the fonts are ready; if they fail to load the system font is used.
  const [loaded, error] = useFonts({
    [FONT_REGULAR]: Inter_400Regular,
    [FONT_MEDIUM]: Inter_500Medium,
    [FONT_SEMIBOLD]: Inter_600SemiBold,
    [FONT_BOLD]: Inter_700Bold,
  });
  const ready = loaded || error !== null;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider palette={palette} fontScale={textScale} touchTarget={TOUCH_TARGET}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
