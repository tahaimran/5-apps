import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';

/** The tutorial's instruction (plan §6 screen 5), read out by TalkBack. */
export function CoachText() {
  const { colors, radius, spacing, type } = useTheme();
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      style={{ borderWidth: 3, borderColor: colors.primary, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md }}
    >
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', textAlign: 'center' }]}>{t('tutorial.coach')}</AppText>
    </View>
  );
}

/**
 * A finger that slides along the first word, over the grid. It is only a picture (touches go
 * through it), is hidden from screen readers, and stands still when Reduce Motion is on.
 */
export function CoachFinger({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(1, { duration: 500 }), withTiming(0, { duration: 0 })), -1);
  }, [reduced, progress]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: from.x + (to.x - from.x) * progress.value }, { translateY: from.y + (to.y - from.y) * progress.value }],
  }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.finger, style]}>
        <MaterialCommunityIcons name="gesture-tap" size={44} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ finger: { position: 'absolute', left: -12, top: -4 } });
