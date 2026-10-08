import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAppOpenAd } from '@shared/ads';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
import { startAds } from '@/ads/start';
import { adContext, useAdGuard } from '@/ads/guard';
import { adAllowed } from '@/domain/adRules';
import { CelebrationHost } from '@/features/celebrations/CelebrationHost';
import { useNotificationResponses, useReminderSync } from '@/notifications/sync';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { useDayRollover } from '@/store/today';
import { palette } from '@/theme/tokens';
import '@/bootstrap';

/** The "Large text" setting adds a 1.2x multiplier on top of the system font scale (plan §7.2). */
const LARGE_TEXT = 1.2;

function Root() {
  const { mode, colors } = useTheme();
  const onboardingDone = useOnboardingComplete();
  useDayRollover();
  useAdGuard();
  // Warm starts only (the hook never fires on a cold start) and never after a reminder tap (plan §12).
  useAppOpenAd(() => adAllowed('app_open_warm', adContext()));
  useReminderSync();
  useNotificationResponses();
  useEffect(() => useMeta.getState().recordLaunch(), []);

  // On later launches consent and ads start right away; on the first run onboarding starts them
  // after the notification step (plan §6 step 10), so nothing is requested before that.
  useEffect(() => {
    if (onboardingDone) void startAds();
  }, [onboardingDone]);

  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="log-custom" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-entry/[id]" options={{ presentation: 'modal' }} />
      </Stack>
      <CelebrationHost />
    </>
  );
}

export default function RootLayout() {
  const largeText = useSettings((s) => s.prefs.largeText);
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider palette={palette} fontScale={largeText ? LARGE_TEXT : 1}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
