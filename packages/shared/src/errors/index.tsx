import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { t } from '../i18n';
import { defaultPalettes, MIN_TOUCH, radius, spacing } from '../theme/tokens';

/** Same shape as expo-router's `ErrorBoundaryProps`, kept local so shared code does not depend on the router. */
export interface CrashScreenProps {
  error: Error;
  retry: () => Promise<void>;
}

/**
 * Fallback for a render error, so a release build shows "Try again" instead of closing. Export it
 * from each app's root layout: `export { CrashScreen as ErrorBoundary } from '@shared/errors';`.
 * It wraps the layout's ThemeProvider, so it uses the default palette instead of `useTheme()`.
 */
export function CrashScreen({ error, retry }: CrashScreenProps) {
  const colors = defaultPalettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const message = error instanceof Error ? error.message : String(error);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {t('shared.errors.title')}
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{t('shared.errors.body')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('shared.errors.retry')}
          onPress={() => {
            retry().catch(() => undefined);
          }}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t('shared.errors.retry')}</Text>
        </Pressable>
        <Text selectable style={[styles.detail, { color: colors.textMuted }]}>
          {message}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: spacing.md },
  button: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  detail: { fontSize: 12, textAlign: 'center', marginTop: spacing.xxl },
});
