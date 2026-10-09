import { Linking, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { Question } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';

export type Verdict = 'correct' | 'wrong' | 'timeout';

/** The domain of a source URL for the small "Source" line (plan §5). */
export const sourceDomain = (src?: string): string | null => {
  if (!src) return null;
  const match = /^https?:\/\/(?:www\.)?([^/\s]+)/.exec(src);
  return match ? match[1] : null;
};

/**
 * The explanation shown after every answer (plan F6): the verdict with an icon, a "Did you know?"
 * fact, the source domain, and the Next button. It is part of the screen, not a pop-up, so nothing
 * can cover it and no ad can ever appear over it.
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
  const { colors, radius, spacing } = useTheme();
  const domain = sourceDomain(question.src);
  // Literal env reference so Expo inlines it at build time.
  const contact = process.env.EXPO_PUBLIC_CONTACT_EMAIL;
  const icon = verdict === 'correct' ? 'check-circle' : verdict === 'timeout' ? 'timer-off-outline' : 'close-circle';
  const tint = verdict === 'correct' ? colors.success : colors.danger;
  return (
    <View
      testID="explanation"
      style={{ gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: tint }}
    >
      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={t(`quiz.verdictSpoken.${verdict}`, { answer: correctText })} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <MaterialCommunityIcons name={icon} size={28} color={tint} />
        <AppText variant="h2" style={{ color: tint, flex: 1 }}>{t(`quiz.verdict.${verdict}`)}</AppText>
      </View>
      {verdict !== 'correct' && <AppText variant="body" style={{ fontWeight: '600' }}>{t('quiz.theAnswer', { answer: correctText })}</AppText>}
      <AppText variant="overline" style={{ color: colors.textMuted, fontWeight: '700' }}>{t('quiz.didYouKnow').toUpperCase()}</AppText>
      <AppText variant="body">{question.x}</AppText>
      {domain && <AppText variant="caption" style={{ color: colors.textMuted }}>{t('quiz.source', { domain })}</AppText>}
      {contact ? (
        <BigButton
          variant="secondary"
          label={t('quiz.report')}
          onPress={() => void Linking.openURL(`mailto:${contact}?subject=${encodeURIComponent(t('quiz.reportSubject', { id: question.id }))}&body=${encodeURIComponent(t('quiz.reportBody', { id: question.id, rev: question.rev }))}`)}
        />
      ) : null}
      <BigButton tall label={nextLabel ?? (last ? t('quiz.seeResults') : t('quiz.next'))} onPress={onNext} />
    </View>
  );
}
