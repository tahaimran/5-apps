import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Pointer from 'lucide-react-native/icons/pointer';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { EASE_OUT } from '@/ui/motion';

/** The tutorial's instruction (plan §6 screen 5) on a gold-edged card, read out by TalkBack. */
export function CoachText() {
  const { colors, radius, spacing, type, shadow } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      style={[{ borderWidth: 3, borderColor: hc ? colors.primary : app.ribbon, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md, alignSelf: 'stretch' }, hc ? null : shadow(1)]}
    >
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', textAlign: 'center' }]}>{t('tutorial.coach')}</AppText>
    </View>
  );
}

/**
 * A hand that slides along the first word, over the grid: the one looping hint in the app, shown only
 * until the first touch. It is only a picture (touches go through it), is hidden from screen readers,
 * and stands still on the first letter when Reduce Motion is on.
 */
export function CoachFinger({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    progress.set(withRepeat(withSequence(withTiming(1, { duration: 1400, easing: EASE_OUT }), withTiming(1, { duration: 500 }), withTiming(0, { duration: 0 })), -1));
  }, [reduced, progress]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: from.x + (to.x - from.x) * progress.get() }, { translateY: from.y + (to.y - from.y) * progress.get() }],
  }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.finger, style]}>
        <View style={[styles.disc, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <Pointer size={30} color={colors.primary} strokeWidth={2.4} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  finger: { position: 'absolute', left: -6, top: 4 },
  disc: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', opacity: 0.94 },
});
