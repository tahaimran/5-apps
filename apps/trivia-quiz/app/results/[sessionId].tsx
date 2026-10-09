import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { NativeAdCard, showInterstitial } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { rewardedDecision } from '@/domain/adRules';
import { levelProgress, titleFor } from '@/domain/scoring';
import { watchRewarded } from '@/features/ads/rewarded';
import { applyDoubleXp } from '@/features/play/commit';
import { useReviewPrompt } from '@/features/play/useReviewPrompt';
import { currentDateKey } from '@/store/today';
import { useStats } from '@/store/stores';
import { goHome, replaceWithRound } from '@/features/play/navigation';
import { startAgain } from '@/features/play/replay';
import { useResult } from '@/store/result';
import { useProfile } from '@/store/stores';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
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
  const { colors, spacing, radius } = useTheme();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, alignItems: 'center' }}>
        <AppText variant="display" accessibilityRole="header" style={{ textAlign: 'center' }}>{title}</AppText>
        {r.category && (
          <AppText variant="body" style={{ color: colors.textMuted }}>
            {t(`categories.${r.category}`)}
            {r.level ? ` · ${t('results.levelN', { level: r.level })}` : ''}
          </AppText>
        )}
        {!blitz && <StarRow stars={r.stars} size={48} />}
        <View accessible accessibilityLabel={blitz ? t('results.blitzScoreLabel', { count: r.correct }) : t('results.scoreLabel', { correct: r.correct, total: r.total })}>
          <AppText variant="display" style={{ textAlign: 'center', color: colors.primary }}>{blitz ? String(r.correct) : `${r.correct}/${r.total}`}</AppText>
        </View>
        {failed && !r.failedByHearts && <AppText variant="body" style={{ textAlign: 'center' }}>{t('results.needToPass', { correct: r.correct, total: r.total, need: 5 })}</AppText>}
        {r.failedByHearts && <AppText variant="body" style={{ textAlign: 'center' }}>{t('results.heartsBody')}</AppText>}
        {r.newBest && (
          <View accessible style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}>
            <AppText variant="body" style={{ fontWeight: '700' }}>{blitz ? t('results.newBestBlitz') : t('results.newBest')}</AppText>
          </View>
        )}
        <View style={{ width: '100%', gap: spacing.xs, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Row label={t('results.points')} value={String(r.score)} />
          <Row label={t('results.xp')} value={`+${r.xp}${r.doubled ? ` (${t('results.doubled')})` : ''}`} />
          <Row label={t('results.accuracy')} value={`${Math.round(r.accuracy * 100)}%`} />
          <Row label={t('results.time')} value={formatElapsed(r.elapsedMs)} />
          {r.relaxed && <AppText variant="caption" style={{ color: colors.textMuted }}>{t('results.relaxedNote')}</AppText>}
        </View>
        {r.levelAfter > r.levelBefore && (
          <View accessible accessibilityLiveRegion="polite" style={{ width: '100%', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, borderWidth: 2, borderColor: colors.primary, alignItems: 'center' }}>
            <AppText variant="h1">{t('results.levelUp', { level: r.levelAfter })}</AppText>
            <AppText variant="body" style={{ color: colors.textMuted }}>{t(`titles.${titleFor(r.levelAfter)}`)}</AppText>
          </View>
        )}
        <AppText variant="caption" style={{ color: colors.textMuted }}>{t('results.nextLevelXp', { into: progress.into, need: progress.need, level: progress.level + 1 })}</AppText>
        <View style={{ width: '100%', gap: spacing.md }}>
          {classic && r.nextLevel !== null && <BigButton tall label={t('results.nextLevel')} onPress={() => again(true)} />}
          {(blitz || r.mode === 'category' || (classic && r.nextLevel === null)) && <BigButton tall label={t('results.playAgain')} onPress={() => again(false)} />}
          {classic && r.nextLevel !== null && <BigButton variant="secondary" label={t('results.replay')} onPress={() => again(false)} />}
          {canDouble && <BigButton variant="secondary" label={t('results.doubleXp')} accessibilityHint={t('results.doubleXpHint')} onPress={() => void doubleXp()} />}
          {adNote && <AppText accessibilityLiveRegion="polite" variant="body" style={{ textAlign: 'center', color: colors.textMuted }}>{adNote}</AppText>}
          <BigButton variant="secondary" label={t('results.home')} onPress={() => void leave(goHome)} />
        </View>
        <View style={{ width: '100%' }}>
          <NativeAdCard placement="results_native" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 32, alignItems: 'center' }}>
      <AppText variant="body">{label}</AppText>
      <AppText variant="body" style={{ fontWeight: '700' }}>{value}</AppText>
    </View>
  );
}
