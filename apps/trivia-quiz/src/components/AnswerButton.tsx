import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Check from 'lucide-react-native/icons/check';
import X from 'lucide-react-native/icons/x';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import { ANSWER_MIN_HEIGHT, extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { CSS_EASE_OUT, POP, SHAKE, SHAKE_MS, STATE_MS } from '@/ui/motion';

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
 * One answer on the quiz stage (plan §5, §7): a 60dp pill with its letter. The verdict never relies on
 * color: the right answer swaps its letter for a check mark and the wrong one for a cross, and the
 * spoken label says which. The fill changes with a CSS transition; the wrong answer shakes (240 ms) and
 * the right one gives one small bounce, unless Reduce Motion is on, when only the colors change.
 */
export function AnswerButton({ index, text, state, disabled, onPress }: AnswerButtonProps) {
  const { radius, spacing, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  const reduced = useReducedMotion();

  const filled = state === 'correct' || state === 'wrong';
  const bg = state === 'correct' ? x.correct : state === 'wrong' ? x.wrong : x.answer;
  const fg = filled ? x.onFill : x.onAnswer;
  const suffix = state === 'correct' ? t('quiz.correctSuffix') : state === 'wrong' ? t('quiz.wrongSuffix') : state === 'removed' ? t('quiz.removedSuffix') : '';
  const label = `${t('quiz.answerLabel', { letter: LETTERS[index], text })}${suffix}`;

  return (
    // The one-shot effect (shake or bounce) and the opacity transition live on separate layers.
    <Animated.View
      style={
        reduced || !filled
          ? null
          : { animationName: state === 'wrong' ? SHAKE : POP, animationDuration: state === 'wrong' ? SHAKE_MS : 220, animationTimingFunction: CSS_EASE_OUT }
      }
    >
    <Animated.View
      style={{
        opacity: state === 'dim' ? 0.5 : state === 'removed' ? 0.28 : 1,
        transitionProperty: 'opacity',
        transitionDuration: reduced ? 0 : STATE_MS,
        transitionTimingFunction: CSS_EASE_OUT,
      }}
    >
      <PressableScale
        testID={`answer-${index}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || state === 'removed', selected: filled }}
        disabled={disabled || state === 'removed'}
        onPress={() => onPress(index)}
        scaleTo={0.97}
        style={[styles.pill, { minHeight: ANSWER_MIN_HEIGHT, borderRadius: radius.lg, gap: spacing.md, paddingHorizontal: spacing.md }, filled || state === 'idle' ? shadow(1) : null]}
      >
        {/* The fill lives on its own layer so the color can transition while the press scale runs. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.lg, backgroundColor: bg, transitionProperty: 'backgroundColor', transitionDuration: reduced ? 0 : STATE_MS, transitionTimingFunction: CSS_EASE_OUT },
          ]}
        />
        <View style={[styles.badge, { backgroundColor: filled ? '#FFFFFF33' : x.answerBadge }]}>
          {state === 'correct' ? (
            <Check size={20} color={fg} strokeWidth={3} />
          ) : state === 'wrong' ? (
            <X size={20} color={fg} strokeWidth={3} />
          ) : (
            <AppText variant="body" style={{ color: fg, fontWeight: '700' }}>
              {LETTERS[index]}
            </AppText>
          )}
        </View>
        <AppText variant="answer" style={[styles.text, { color: fg, textDecorationLine: state === 'removed' ? 'line-through' : 'none' }]}>
          {text}
        </AppText>
      </PressableScale>
    </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
});
