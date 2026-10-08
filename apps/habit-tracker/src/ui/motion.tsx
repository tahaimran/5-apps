import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { StreakResult } from '@/domain/streaks';

/** Check circle fill: a quick spring pop when it turns done (damping 14, stiffness 220). */
export function PopOnChange({ active, children }: { active: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const was = useRef(active);
  useEffect(() => {
    if (active && !was.current && !reduced) {
      scale.value = 0.82;
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }
    was.current = active;
  }, [active, reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Flame and number; the flame scales 1 → 1.25 → 1 whenever the streak goes up. */
export function StreakBadge({ streak }: { streak: StreakResult }) {
  const { colors, type } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const prev = useRef(streak.current);
  useEffect(() => {
    if (streak.current > prev.current && !reduced) {
      scale.value = withSequence(withTiming(1.25, { duration: 120 }), withSpring(1, { damping: 12, stiffness: 200 }));
    }
    prev.current = streak.current;
  }, [streak.current, reduced, scale]);
  const flame = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (streak.current === 0) return null;
  return (
    <View style={styles.streak} importantForAccessibility="no-hide-descendants">
      <Animated.View style={flame}>
        <MaterialCommunityIcons name="fire" size={20} color={colors.accent} />
      </Animated.View>
      <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>
        {streak.current}
        {streak.unit === 'weeks' ? t('today.weekShort') : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
