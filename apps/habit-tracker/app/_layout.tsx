import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initAds } from '@shared/ads';
import { setCurrentApp } from '@shared/crosspromo';
import { registerStrings } from '@shared/i18n';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
import { adPolicy, adUnits } from '@/ads.config';
import en from '@/i18n/en.json';
import { useDayRollover } from '@/store/today';
import { palette } from '@/theme/tokens';
import '@/store/storage';

registerStrings({ en });
setCurrentApp('habit-tracker');

function Root() {
  const { mode, colors } = useTheme();
  const onboardingDone = useOnboardingComplete();
  useDayRollover();

  // Consent (UMP) and ads start only after onboarding, i.e. after the first-value moment (plan §6).
  useEffect(() => {
    if (onboardingDone) initAds(adPolicy, adUnits).catch(() => undefined);
  }, [onboardingDone]);

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
