import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import House from 'lucide-react-native/icons/house';
import Play from 'lucide-react-native/icons/play';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Star from 'lucide-react-native/icons/star';
import Target from 'lucide-react-native/icons/target';
import Timer from 'lucide-react-native/icons/timer';
import Trophy from 'lucide-react-native/icons/trophy';
import { NativeAdCard, showInterstitial } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Card } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { rewardedDecision } from '@/domain/adRules';
import { levelProgress, titleFor } from '@/domain/scoring';
import { watchRewarded } from '@/features/ads/rewarded';
import { applyDoubleXp } from '@/features/play/commit';
import { goHome, replaceWithRound } from '@/features/play/navigation';
import { startAgain } from '@/features/play/replay';
import { useReviewPrompt } from '@/features/play/useReviewPrompt';
import { useResult } from '@/store/result';
import { useProfile, useStats } from '@/store/stores';
import { currentDateKey } from '@/store/today';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { GoldButton } from '@/ui/GoldButton';
import { ProgressBar } from '@/ui/ProgressBar';
import { IconCircle, StatTile } from '@/ui/SettingsRow';
import { StarRow } from '@/ui/StarRow';

/** `m:ss` for the round time. */
export const formatElapsed = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Plan §5 Results: score, stars, XP, accuracy, time, and the next step. Level failed, new best and level up have their own copy. */
export default function Results() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const r = useResult((s) => s.last);
  const { colors, spacing, radius, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  const xp = useProfile((s) => s.value.xp);
  const doubleXpStats = useStats((s) => s.value.doubleXpToday);
  const [busy, setBusy] = useState(false);
  const [adNote, setAdNote] = useState<string | null>(null);
  useAdScreen('results');
  const reviewShown = useReviewPrompt(r);
  if (!r || r.id !== sessionId) return <Redirect href="/(tabs)" />;

  const blitz = r.mode === 'blitz';
  const classic = r.mode === 'classic';
  const failed = classic && r.stars === 0;
  const title = blitz ? t('results.blitzTitle') : r.failedByHearts ? t('results.outOfHearts') : failed ? t('results.soClose') : classic ? t('results.levelDone') : t('results.roundDone');
  const progress = levelProgress(xp);
  // The interstitial slot of plan §12: when leaving Results for the next round or Home. The app rules and
  // @shared/ads decide; if no ad is ready it is skipped at once, never waited for, and never right after
  // the review prompt.
  const leave = async (go: () => void) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!reviewShown.current) await showInterstitial('round_end').catch(() => false);
    } finally {
      setBusy(false);
    }
    go();
  };
  const again = (next: boolean) => void leave(() => void replaceWithRound(startAgain(r, next)));
  const used = doubleXpStats.date === currentDateKey() ? doubleXpStats.count : 0;
  const canDouble = rewardedDecision('double_xp', { today: currentDateKey(), screen: 'results', onboardingDone: true, lifelineVideosToday: 0, doubleXpToday: used, correct: r.correct, alreadyDoubled: r.doubled }).allowed;
  const doubleXp = async () => {
    if (busy) return;
    setBusy(true);
    setAdNote(null);
    const outcome = await watchRewarded('double_xp');
    setBusy(false);
    if (outcome === 'granted') applyDoubleXp();
    else if (outcome !== 'busy') setAdNote(t(outcome === 'unavailable' ? 'ads.unavailable' : 'ads.notEarned'));
  };
  const nextMain = classic && r.nextLevel !== null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {/* The result on the quiz's own violet stage. */}
        <View style={[{ borderRadius: radius.xl }, shadow(3)]}>
          <View style={[styles.hero, { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm }]}>
            <LinearGradient colors={x.stage} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
            {!blitz && <StarRow stars={r.stars} size={44} pop emptyColor="#FFFFFF66" />}
            <AppText variant="display" accessibilityRole="header" style={[styles.white, styles.center]}>
              {title}
            </AppText>
            {r.category && (
              <AppText variant="body" style={[styles.white, styles.semi]}>
                {t(`categories.${r.category}`)}
                {r.level ? ` · ${t('results.levelN', { level: r.level })}` : ''}
              </AppText>
            )}
            <View accessible accessibilityLabel={blitz ? t('results.blitzScoreLabel', { count: r.correct }) : t('results.scoreLabel', { correct: r.correct, total: r.total })}>
              <AppText variant="display" style={[styles.white, styles.score]}>
                {blitz ? String(r.correct) : `${r.correct}/${r.total}`}
              </AppText>
            </View>
            {failed && !r.failedByHearts && (
              <AppText variant="body" style={[styles.white, styles.center]}>
                {t('results.needToPass', { correct: r.correct, total: r.total, need: 5 })}
              </AppText>
            )}
            {r.failedByHearts && (
              <AppText variant="body" style={[styles.white, styles.center]}>
                {t('results.heartsBody')}
              </AppText>
            )}
            {r.newBest && (
              <View accessible style={[styles.chip, { borderRadius: radius.pill, backgroundColor: x.gold }]}>
                <Trophy size={15} color={x.onGold} strokeWidth={2.4} />
                <AppText variant="body" style={[styles.bold, { color: x.onGold }]}>
                  {blitz ? t('results.newBestBlitz') : t('results.newBest')}
                </AppText>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.row, { gap: spacing.md }]}>
          <StatTile icon={Star} value={String(r.score)} label={t('results.points')} tint={colors.accent} bg={x.goldSoft} />
          <StatTile icon={Sparkles} value={`+${r.xp}${r.doubled ? ` (${t('results.doubled')})` : ''}`} label={t('results.xp')} />
        </View>
        <View style={[styles.row, { gap: spacing.md }]}>
          <StatTile icon={Target} value={`${Math.round(r.accuracy * 100)}%`} label={t('results.accuracy')} tint={colors.success} bg={x.successSoft} />
          <StatTile icon={Timer} value={formatElapsed(r.elapsedMs)} label={t('results.time')} />
        </View>
        {r.relaxed && (
          <AppText variant="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
            {t('results.relaxedNote')}
          </AppText>
        )}

        {r.levelAfter > r.levelBefore && (
          <View accessible accessibilityLiveRegion="polite" style={[styles.row, { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: x.goldSoft }]}>
            <IconCircle icon={Trophy} tint={x.onGold} bg={x.gold} size={48} />
            <View style={styles.flex}>
              <AppText variant="h2">{t('results.levelUp', { level: r.levelAfter })}</AppText>
              <AppText variant="body" style={{ color: colors.textMuted }}>
                {t(`titles.${titleFor(r.levelAfter)}`)}
              </AppText>
            </View>
          </View>
        )}
        <Card style={{ gap: spacing.sm }}>
          <AppText variant="caption" style={{ color: colors.textMuted, fontWeight: '600' }}>
            {t('results.nextLevelXp', { into: progress.into, need: progress.need, level: progress.level + 1 })}
          </AppText>
          <ProgressBar fraction={progress.fraction} color={x.gold} />
        </Card>

        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          {nextMain && <GoldButton label={t('results.nextLevel')} icon={ArrowRight} trailing onPress={() => again(true)} />}
          {(blitz || r.mode === 'category' || (classic && r.nextLevel === null)) && <GoldButton label={t('results.playAgain')} icon={RotateCcw} onPress={() => again(false)} />}
          {nextMain && <Button variant="secondary" block icon={RotateCcw} label={t('results.replay')} onPress={() => again(false)} />}
          {canDouble && <Button variant="secondary" block icon={Play} label={t('results.doubleXp')} accessibilityHint={t('results.doubleXpHint')} onPress={() => void doubleXp()} />}
          {adNote && (
            <AppText accessibilityLiveRegion="polite" variant="body" style={{ textAlign: 'center', color: colors.textMuted }}>
              {adNote}
            </AppText>
          )}
          <Button variant="ghost" icon={House} label={t('results.home')} onPress={() => void leave(goHome)} />
        </View>
        <NativeAdCard placement="results_native" />
      </ScrollView>
    </SafeAreaView>
  );
}

// White text on the violet stage is covered by the contrast test.
const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  hero: { overflow: 'hidden', alignItems: 'center' },
  white: { color: '#FFFFFF' },
  center: { textAlign: 'center' },
  bold: { fontWeight: '700' },
  semi: { fontWeight: '600' },
  score: { fontSize: 56, lineHeight: 62 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
});
