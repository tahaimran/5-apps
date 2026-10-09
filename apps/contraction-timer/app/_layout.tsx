import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@shared/theme';
import { useAppOpenAd } from '@shared/ads';
import { adContext, useAdGuard } from '@/ads/guard';
import { useStartAdsWhenSafe } from '@/ads/useStartAds';
import { adAllowed } from '@/domain/adRules';
import { useSessionMaintenance } from '@/features/timer/maintenance';
import { cleanPdfCache } from '@/export/pdfCache';
import { useKickReminderSync } from '@/notifications/kickReminder';
import { useWeeklyCardSync } from '@/notifications/weekly';
import { useNotificationResponses } from '@/notifications/responses';
import { installSessionNotifier } from '@/notifications/sessionOpen';
import { useMeta } from '@/store/meta';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import '@/bootstrap';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** One cold start is one launch, even if the root remounts. */
let launchCounted = false;

function Root() {
  const { mode, colors } = useTheme();
  useAdGuard();
  // Warm starts only (never a cold start); the rules also keep it away from any open session, notification taps and the first launches.
  useAppOpenAd(() => adAllowed('app_open', adContext()));
  // Consent and the ads SDK start for everyone who did not just finish onboarding, but never on the Timer button's screen or mid-session.
  useStartAdsWhenSafe();
  useSessionMaintenance();
  useKickReminderSync();
  useWeeklyCardSync();
  useNotificationResponses();
  useEffect(() => installSessionNotifier(), []);
  useEffect(() => {
    if (!launchCounted) {
      launchCounted = true;
      useMeta.getState().recordLaunch();
    }
    cleanPdfCache();
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <>
      {/* Light content on the dark and night themes, dark content on the light one. */}
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="modals/share-summary" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/alert-rule" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modals/pdf-theme" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
