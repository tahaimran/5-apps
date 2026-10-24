import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleX from 'lucide-react-native/icons/circle-x';
import Flag from 'lucide-react-native/icons/flag';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import TimerOff from 'lucide-react-native/icons/timer-off';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, EASE_OUT } from '@shared/ui';
import type { Question } from '@/domain/types';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { GoldButton } from '@/ui/GoldButton';
import { IconCircle } from '@/ui/SettingsRow';

export type Verdict = 'correct' | 'wrong' | 'timeout';

/** The domain of a source URL for the small "Source" line (plan §5). */
export const sourceDomain = (src?: string): string | null => {
  if (!src) return null;
  const match = /^https?:\/\/(?:www\.)?([^/\s]+)/.exec(src);
  return match ? match[1] : null;
};

/**
 * The explanation after every answer (plan F6): the verdict with its own icon (✓, ✗ or a stopped
 * timer, so it never relies on color), a "Did you know?" fact, the source domain and the gold Next
 * button. It rises in under the answers (220 ms) as part of the screen, not a pop-up, so nothing can
 * cover it and no ad can ever appear over it.
 */
export function ExplanationPanel({
  verdict,
  question,
  correctText,
  last,
  onNext,
  nextLabel,
}: {
  verdict: Verdict;
  question: Question;
  correctText: string;
  last: boolean;
  onNext: () => void;
  nextLabel?: string;
}) {
  const { colors, radius, spacing, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  const reduced = useReducedMotion();
  const domain = sourceDomain(question.src);
  // Literal env reference so Expo inlines it at build time.
  const contact = process.env.EXPO_PUBLIC_CONTACT_EMAIL;
  const right = verdict === 'correct';
  const icon = right ? CircleCheck : verdict === 'timeout' ? TimerOff : CircleX;
  const tint = right ? colors.success : colors.danger;
  return (
    <Animated.View
      testID="explanation"
      entering={reduced ? undefined : FadeInDown.duration(220).easing(EASE_OUT)}
      style={[styles.card, { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: x.card }, shadow(3)]}
    >
      <View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={t(`quiz.verdictSpoken.${verdict}`, { answer: correctText })}
        style={[styles.row, { gap: spacing.md }]}
      >
        <IconCircle icon={icon} tint={tint} bg={right ? x.successSoft : x.dangerSoft} size={44} />
        <View style={styles.flex}>
          <AppText variant="h1" style={{ color: tint }}>
            {t(`quiz.verdict.${verdict}`)}
          </AppText>
          {!right && (
            <AppText variant="body" style={{ fontWeight: '600' }}>
              {t('quiz.theAnswer', { answer: correctText })}
            </AppText>
          )}
        </View>
      </View>
      <View style={[styles.fact, { backgroundColor: mode === 'light' ? colors.background : colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs }]}>
        <View style={[styles.row, { gap: spacing.xs }]}>
          <Lightbulb size={16} color={colors.accent} strokeWidth={2.5} />
          <AppText variant="overline" style={{ color: colors.accent }}>
            {t('quiz.didYouKnow').toUpperCase()}
          </AppText>
        </View>
        <AppText variant="body">{question.x}</AppText>
        {domain && (
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {t('quiz.source', { domain })}
          </AppText>
        )}
      </View>
      <GoldButton label={nextLabel ?? (last ? t('quiz.seeResults') : t('quiz.next'))} onPress={onNext} icon={ArrowRight} trailing style={{ marginTop: spacing.xs }} />
      {contact ? (
        <Button
          variant="ghost"
          icon={Flag}
          label={t('quiz.report')}
          onPress={() =>
            void Linking.openURL(
              `mailto:${contact}?subject=${encodeURIComponent(t('quiz.reportSubject', { id: question.id }))}&body=${encodeURIComponent(t('quiz.reportBody', { id: question.id, rev: question.rev }))}`,
            )
          }
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  fact: {},
});
