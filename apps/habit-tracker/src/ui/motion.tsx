import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Flame from 'lucide-react-native/icons/flame';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { StreakResult } from '@/domain/streaks';

/** Flame and number; the flame pops 1 → 1.3 → 1 whenever the streak goes up. */
export function StreakBadge({ streak }: { streak: StreakResult }) {
  const { colors, type } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const prev = useRef(streak.current);
  useEffect(() => {
    if (streak.current > prev.current && !reduced) {
      scale.set(withSequence(withTiming(1.3, { duration: 120 }), withSpring(1, { duration: 400, dampingRatio: 0.45 })));
    }
    prev.current = streak.current;
  }, [streak.current, reduced, scale]);
  const flame = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  if (streak.current === 0) return null;
  return (
    <View style={styles.streak} importantForAccessibility="no-hide-descendants">
      <Animated.View style={flame}>
        <Flame size={15} color={colors.accent} fill={colors.accent} strokeWidth={2} />
      </Animated.View>
      {/* Ember on white is under 4.5:1 for small text, so only the flame carries the color. */}
      <Text style={[type.caption, { color: colors.text, fontWeight: '700' }]}>
        {streak.current}
        {streak.unit === 'weeks' ? t('today.weekShort') : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
