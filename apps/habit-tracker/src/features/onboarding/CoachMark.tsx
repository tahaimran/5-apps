import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Pointer from 'lucide-react-native/icons/pointer';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button } from '@shared/ui';

/** Step 5 of onboarding: points at the first habit until it is checked off or dismissed. */
export function CoachMark({ onDismiss }: { onDismiss: () => void }) {
  const { colors, spacing, radius, type } = useTheme();
  const reduced = useReducedMotion();
  const nudge = useSharedValue(0);
  // A small tap gesture loop: explanation, plays only while the hint is up.
  useEffect(() => {
    if (reduced) return;
    nudge.set(withRepeat(withSequence(withTiming(1, { duration: 450 }), withTiming(0, { duration: 450 })), -1));
  }, [reduced, nudge]);
  const hand = useAnimatedStyle(() => ({ transform: [{ translateY: nudge.get() * 4 }, { scale: 1 - nudge.get() * 0.08 }] }));
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.md, paddingLeft: spacing.lg, gap: spacing.md }]}
    >
      <Animated.View style={hand}>
        <Pointer size={24} color={colors.primary} strokeWidth={2.25} />
      </Animated.View>
      <Text style={[type.body, { color: colors.text, flex: 1, fontWeight: '600' }]}>{t('coach.checkIt')}</Text>
      <Button label={t('coach.gotIt')} variant="ghost" block={false} onPress={onDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center' },
});
