import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { extraColors, ANSWER_MIN_HEIGHT } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'dim' | 'removed';

const LETTERS = ['A', 'B', 'C', 'D'];

export interface AnswerButtonProps {
  index: number;
  text: string;
  state: AnswerState;
  disabled: boolean;
  onPress: (index: number) => void;
}

/**
 * One answer (plan §5, §7): at least 56dp tall, never coloured alone: a correct answer shows a check
 * mark and a wrong one a cross. The wrong answer shakes three times and the right one bounces, unless
 * Reduce Motion is on, when it only changes colour.
 */
export function AnswerButton({ index, text, state, disabled, onPress }: AnswerButtonProps) {
  const { colors, radius, spacing, type, mode } = useTheme();
  const extra = extraColors[mode];
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const shift = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    if (state === 'wrong') shift.value = withSequence(withTiming(-8, { duration: 40 }), withTiming(8, { duration: 80 }), withTiming(-8, { duration: 80 }), withTiming(0, { duration: 40 }));
    if (state === 'correct') scale.value = withSequence(withTiming(1.03, { duration: 90 }), withSpring(1));
  }, [state, reduced, scale, shift]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateX: shift.value }] }));

  const filled = state === 'correct' || state === 'wrong';
  const bg = state === 'correct' ? colors.success : state === 'wrong' ? colors.danger : colors.surface;
  const fg = state === 'correct' ? extra.onSuccess : state === 'wrong' ? extra.onDanger : colors.text;
  const suffix = state === 'correct' ? t('quiz.correctSuffix') : state === 'wrong' ? t('quiz.wrongSuffix') : state === 'removed' ? t('quiz.removedSuffix') : '';
  const label = `${t('quiz.answerLabel', { letter: LETTERS[index], text })}${suffix}`;

  return (
    <Animated.View style={[animated, { opacity: state === 'dim' ? 0.55 : state === 'removed' ? 0.3 : 1 }]}>
      <Pressable
        testID={`answer-${index}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || state === 'removed', selected: state === 'wrong' || state === 'correct' }}
        disabled={disabled || state === 'removed'}
        onPressIn={() => {
          if (!reduced && !disabled) scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          if (!reduced) scale.value = withSpring(1);
        }}
        onPress={() => onPress(index)}
        style={{
          minHeight: ANSWER_MIN_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: filled ? 0 : 2,
          borderColor: colors.border,
          backgroundColor: bg,
        }}
      >
        <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? 'transparent' : colors.surfaceAlt }}>
          {state === 'correct' ? (
            <MaterialCommunityIcons name="check-bold" size={22} color={fg} />
          ) : state === 'wrong' ? (
            <MaterialCommunityIcons name="close-thick" size={22} color={fg} />
          ) : (
            <AppText variant="caption" style={{ color: colors.text, fontWeight: '700' }}>{LETTERS[index]}</AppText>
          )}
        </View>
        <AppText variant="answer" style={{ flex: 1, color: fg, textDecorationLine: state === 'removed' ? 'line-through' : 'none', fontSize: type.body.fontSize + 1 }}>{text}</AppText>
      </Pressable>
    </Animated.View>
  );
}
