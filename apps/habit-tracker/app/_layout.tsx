import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initAds } from '@shared/ads';
import { setCurrentApp } from '@shared/crosspromo';
import { registerStrings } from '@shared/i18n';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
import { adPolicy, adUnits } from '@/ads.config';
import en from '@/i18n/en.json';
import { palette } from '@/theme/tokens';
import '@/store/storage';

registerStrings({ en });
setCurrentApp('habit-tracker');

function Root() {
  const { mode, colors } = useTheme();
  const onboardingDone = useOnboardingComplete();

  // Consent (UMP) and ads start only after onboarding, i.e. after the first-value moment (plan §6).
  useEffect(() => {
    if (onboardingDone) initAds(adPolicy, adUnits).catch(() => undefined);
  }, [onboardingDone]);

  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider palette={palette}>
      <Root />
    </ThemeProvider>
  );
}
