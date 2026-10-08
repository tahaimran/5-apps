import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { useAppOpenAd } from '@shared/ads';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
import { adContext, useAdGuard } from '@/ads/guard';
import { startAds } from '@/ads/start';
import { adAllowed } from '@/domain/adRules';
import { useSettings } from '@/store/settings';
import { useStats } from '@/store/stats';
import { useDayRollover } from '@/store/today';
import { fontScaleFor, palette, TOUCH_TARGET } from '@/theme/tokens';
import { FONT_BOLD, FONT_REGULAR } from '@/ui/AppText';
import '@/bootstrap';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Root() {
  const { mode, colors } = useTheme();
  const setupDone = useOnboardingComplete();
  useAdGuard();
  // Warm starts only (the hook never fires on a cold start); the rules also keep it out of a puzzle in progress.
  useAppOpenAd(() => adAllowed('app_open', adContext()));
  // On a first run consent and ads start after the setup screens (app/onboarding.tsx); on later launches right away.
  useEffect(() => {
    if (setupDone) void startAds();
  }, [setupDone]);
  useDayRollover();
  useEffect(() => useStats.getState().recordSession(), []);
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="complete/[puzzleId]" options={{ presentation: 'modal', gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const textSize = useSettings((s) => s.settings.textSize);
  // The splash stays up until the fonts are ready; if they fail to load the system font is used.
  const [loaded, error] = useFonts({ [FONT_REGULAR]: AtkinsonHyperlegible_400Regular, [FONT_BOLD]: AtkinsonHyperlegible_700Bold });
  const ready = loaded || error !== null;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider palette={palette} fontScale={fontScaleFor(textSize)} touchTarget={TOUCH_TARGET}>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
