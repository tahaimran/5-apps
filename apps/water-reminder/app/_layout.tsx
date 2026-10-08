import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@shared/theme';
import { palette } from '@/theme/tokens';
import '@/bootstrap';

function Root() {
  const { mode, colors } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
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
