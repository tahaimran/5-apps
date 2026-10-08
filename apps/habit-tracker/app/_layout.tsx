import { useEffect } from 'react';
import { AppState } from 'react-native';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAppOpenAd } from '@shared/ads';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
import { hasCheckInIn, installAdGuard, useAdsStart } from '@/ads/guard';
import { useNotificationResponses, useNotificationSync } from '@/notifications/sync';
import { dayKeyFor } from '@/domain/dayKey';
import { useHabits } from '@/store/habits';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useDayRollover } from '@/store/today';
import { startWidgetSync } from '@/widget/sync';
import { palette } from '@/theme/tokens';
import '@/bootstrap';

function Root() {
  const { mode, colors } = useTheme();
  const onboardingDone = useOnboardingComplete();
  useDayRollover();
  useNotificationSync();
  useNotificationResponses();
  useEffect(() => startWidgetSync(), []);

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
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="habit/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="templates" options={{ presentation: 'modal' }} />
        <Stack.Screen name="note/[date]" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider palette={palette}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
