import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@shared/theme';
import { useAdGuard } from '@/ads/guard';
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

function Root() {
  const { mode, colors } = useTheme();
  useAdGuard();
  useSessionMaintenance();
  useKickReminderSync();
  useWeeklyCardSync();
  useNotificationResponses();
  useEffect(() => installSessionNotifier(), []);
  useEffect(() => {
    useMeta.getState().recordLaunch();
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
