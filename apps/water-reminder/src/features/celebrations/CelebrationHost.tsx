import { useCallback, useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useCelebration } from '@/store/celebrations';
import { Confetti } from './Confetti';

const TOAST_MS = 3200;

/** Overlay for the goal-reached confetti and the toast. It never intercepts touches. */
export function CelebrationHost() {
  const { colors, spacing, radius, type } = useTheme();
  const reduced = useReducedMotion();
  const current = useCelebration((s) => s.current);
  const dismiss = useCelebration((s) => s.dismiss);

  const message = !current ? null : current.kind === 'goal' ? t('celebrate.goal') : t('celebrate.freezeUsed', { count: current.count });

  useEffect(() => {
    if (!current || !message) return;
    AccessibilityInfo.announceForAccessibility(message);
    const timer = setTimeout(dismiss, TOAST_MS);
    return () => clearTimeout(timer);
  }, [current, message, dismiss]);

  const onConfettiDone = useCallback(() => undefined, []);

  if (!current || !message) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {!reduced && current.kind === 'goal' && <Confetti key={current.id} onDone={onConfettiDone} />}
      <Animated.View
        key={`toast-${current.id}`}
        entering={reduced ? undefined : FadeInDown.duration(220)}
        exiting={FadeOut.duration(200)}
        style={[styles.toast, { backgroundColor: colors.text, borderRadius: radius.md, padding: spacing.md, top: spacing.xl }]}
      >
        <Text style={[type.bodyLarge, { color: colors.background, fontWeight: '700', textAlign: 'center' }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ toast: { position: 'absolute', left: 24, right: 24 } });
