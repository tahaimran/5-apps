import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Flame from 'lucide-react-native/icons/flame';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { showInterstitial } from '@shared/ads';
import { maybeAskForReview } from '@shared/review';
import { Button, Confetti } from '@shared/ui';
import { ReminderSheet } from '@/components/ReminderSheet';
import { shouldAskReminder } from '@/domain/reminder';
import { reviewEligible } from '@/domain/reviewRules';
import { useAds } from '@/store/ads';
import { useReminderPrompt } from '@/store/reminder';
import { useReview } from '@/store/review';
import { useStats } from '@/store/stats';
import { useAdScreen } from '@/ads/guard';
import { replaceWithPuzzle } from '@/features/play/navigation';
import { PackTile } from '@/features/packs/PackArt';
import { DEFAULT_PACK, getPack } from '@/domain/packs';
import { levelPuzzleId } from '@/domain/puzzles';
import { dailyPackId } from '@/domain/daily';
import { addDays } from '@/domain/dateKey';
import type { CompletedResult } from '@/domain/types';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { useAppColors, useGameColors, useIsHighContrast } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { GameButton } from '@/ui/GameButton';
import { BURST_IN, BURST_MS, CONFETTI_MS, CSS_EASE_OUT, FLAME_MS, FLAME_POP, RISE_IN, RISE_MS, STAR_GAP_MS, STAR_LEAD_MS, STAR_MS } from '@/ui/motion';
import { Ribbon } from '@/ui/Ribbon';
import { SkyBackdrop } from '@/ui/SkyBackdrop';
import { StarRow } from '@/ui/StarRow';

/** A beat after the celebration before any prompt appears, so the stars are seen first. */
export const REVIEW_DELAY_MS = 800;

/** `m:ss` for the optional timer. */
export const formatElapsed = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Where "Next puzzle" goes: the next level of the pack at the same difficulty. */
export const nextPuzzleId = (r: CompletedResult): string | null =>
  r.level !== undefined ? levelPuzzleId(r.packId, r.difficulty, r.level + 1) : null;

/** Twelve soft rays behind the stars (drawn once; they open, they never spin). */
function Burst({ size, color }: { size: number; color: string }) {
  const reduced = useReducedMotion();
  const c = size / 2;
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a0 = ((i * 30 - 6) * Math.PI) / 180;
    const a1 = ((i * 30 + 6) * Math.PI) / 180;
    return `M${c} ${c} L${c + c * Math.cos(a0)} ${c + c * Math.sin(a0)} L${c + c * Math.cos(a1)} ${c + c * Math.sin(a1)} Z`;
  });
  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[styles.burst, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }, reduced ? null : { animationName: BURST_IN, animationDuration: BURST_MS, animationTimingFunction: CSS_EASE_OUT }]}
    >
      <Svg width={size} height={size}>
        {rays.map((d, i) => (
          <Path key={i} d={d} fill={color} />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Plan §5.4: "Well done!", stars, words found, and the next step. A modal, so Back returns to where the puzzle was started. */
export default function Complete() {
  const result = useResult((s) => s.last);
  useAdScreen('complete');
  const [reminderOpen, setReminderOpen] = useState(false);
  const [confetti, setConfetti] = useState(true);
  const reviewAsked = useRef(false);
  const puzzleId = result?.puzzleId;
  // After the celebration (plan §10, §12): the reminder pre-prompt, or else the store review, never both and never for the tutorial.
  useEffect(() => {
    const r = useResult.getState().last;
    if (!r || r.isTutorial) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      const dailyJustCompleted = r.isDaily && r.streakCounted === true;
      if (shouldAskReminder({ prompt: useReminderPrompt.getState().prompt, reminderEnabled: useSettings.getState().settings.reminder.enabled, now, dailyJustCompleted, tutorial: false })) {
        useReminderPrompt.getState().recordAsk(now);
        setReminderOpen(true);
        return;
      }
      const stats = useStats.getState().stats;
      if (reviewEligible({ review: useReview.getState().review, sessions: stats.sessions, puzzlesCompleted: stats.puzzlesCompleted, stars: r.stars, streak: r.streak, streakCounted: r.streakCounted, now, lastFullScreenAt: useAds.getState().lastFullScreenAt, tutorial: false })) {
        // The rules above are the app's; the shared call only does the system prompt.
        void maybeAskForReview('puzzle_complete', { minPositiveEvents: 1, minDaysSinceInstall: 0, minDaysBetweenAsks: 30 })
          .then((asked) => {
            if (!asked) return;
            useReview.getState().recordPrompt(now);
            reviewAsked.current = true; // skip the interstitial this cycle
          })
          .catch(() => undefined);
      }
    }, REVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [puzzleId]);
  const showTimer = useSettings((s) => s.settings.showTimer);
  const difficulty = useSettings((s) => s.settings.difficulty);
  const { colors, spacing, type, radius, shadow, fonts } = useTheme();
  const app = useAppColors();
  const g = useGameColors();
  const hc = useIsHighContrast();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  if (!result) return <Redirect href="/(tabs)" />;
  const next = result.isTutorial ? levelPuzzleId(DEFAULT_PACK, difficulty, 1) : nextPuzzleId(result);
  const pack = getPack(result.packId)?.name ?? '';
  // The interstitial slot of plan §11: after "Next puzzle" is tapped, before the next puzzle loads.
  // The app rules and @shared/ads decide; if no ad is ready it is skipped at once, never waited for.
  const goNext = async (id: string) => {
    if (!result.isTutorial && !reviewAsked.current) await showInterstitial('level_complete').catch(() => false);
    replaceWithPuzzle(id);
  };
  const leave = () => router.replace('/(tabs)');
  const streakMoment = result.isDaily && result.streakCounted && result.streak !== undefined;
  // The flame lands after the last star.
  const flameDelay = STAR_LEAD_MS + 3 * STAR_GAP_MS + STAR_MS / 2;
  const rise = (delay: number) => (reduced ? null : { animationName: RISE_IN, animationDuration: RISE_MS, animationDelay: delay, animationFillMode: 'backwards' as const, animationTimingFunction: CSS_EASE_OUT });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <SkyBackdrop />
      <ScrollView style={styles.clip} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <Animated.View style={rise(0)}>
            <Ribbon title={result.isTutorial ? t('tutorial.wonderful') : t('complete.title')} size="lg" />
          </Animated.View>
          {!result.isTutorial && (
            <View style={[styles.stage, { minHeight: 150 }]}>
              {!hc && <Burst size={Math.min(width - 32, 300)} color={app.burst} />}
              <StarRow stars={result.stars} size={64} pop />
            </View>
          )}
          {!result.isTutorial && (
            <Animated.View style={[styles.praise, { gap: spacing.sm }, rise(STAR_LEAD_MS)]}>
              <AppText style={[type.title, { color: colors.text, fontWeight: '800', textAlign: 'center' }]}>{t(`complete.praise.${result.stars}`)}</AppText>
              <View style={[styles.row, { gap: spacing.md, backgroundColor: hc ? colors.background : app.frost, borderRadius: radius.lg, padding: spacing.md }, hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1)]}>
                <PackTile packId={result.packId} px={56} radius={radius.md} />
                <View style={styles.flex}>
                  <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
                    {result.level !== undefined ? t('game.title', { pack, level: result.level }) : result.isDaily ? t('daily.title') : pack}
                  </AppText>
                  <AppText style={[type.body, { color: colors.textMuted }]}>{t('complete.words', { count: result.wordsFound })}</AppText>
                  {showTimer && <AppText style={[type.body, { color: colors.textMuted }]}>{t('complete.time', { time: formatElapsed(result.elapsedMs) })}</AppText>}
                </View>
              </View>
            </Animated.View>
          )}
          {streakMoment && (
            <Animated.View
              accessible
              accessibilityLabel={t('complete.streak', { count: result.streak! })}
              style={[
                styles.row,
                { gap: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 56, borderRadius: radius.pill, backgroundColor: hc ? colors.background : colors.surface },
                hc ? { borderWidth: 2, borderColor: colors.border } : shadow(2),
                reduced ? null : { animationName: FLAME_POP, animationDuration: FLAME_MS, animationDelay: flameDelay, animationFillMode: 'backwards', animationTimingFunction: CSS_EASE_OUT },
              ]}
            >
              <Flame size={32} color={app.flame} strokeWidth={2.4} />
              <AppText style={[type.title, { color: colors.text, fontWeight: '800', fontFamily: fonts.display }]}>{t('complete.streak', { count: result.streak! })}</AppText>
            </Animated.View>
          )}
          {result.isDaily && result.streakCounted === false && (
            <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('complete.catchUpNote')}</AppText>
          )}
          {result.isDaily && result.streakCounted && (
            <View style={{ gap: spacing.xs }}>
              <AppText style={[type.bodyLarge, { color: colors.text, textAlign: 'center' }]}>{t('complete.comeBack')}</AppText>
              <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
                {t('daily.tomorrow', { theme: getPack(dailyPackId(addDays(result.dateKey ?? '', 1)))?.name ?? '' })}
              </AppText>
            </View>
          )}
        </View>
        <View style={{ gap: spacing.md }}>
          {next ? (
            <>
              <GameButton icon={ArrowRight} trailing label={result.isTutorial ? t('tutorial.next') : t('complete.next')} onPress={() => void goNext(next)} />
              <Button variant="ghost" label={result.isTutorial ? t('complete.home') : t('complete.backToPacks')} onPress={leave} />
            </>
          ) : (
            <GameButton label={t('complete.home')} onPress={leave} />
          )}
        </View>
      </ScrollView>
      {confetti && !reduced && <Confetti colors={[...(hc ? g.edges : g.highlights), app.gold]} duration={CONFETTI_MS} onDone={() => setConfetti(false)} />}
      <ReminderSheet visible={reminderOpen} onClose={() => setReminderOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  stage: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  burst: { position: 'absolute', left: '50%', top: '50%' },
  praise: { alignItems: 'center', alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
