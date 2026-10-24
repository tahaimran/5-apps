import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Heart from 'lucide-react-native/icons/heart';
import Pause from 'lucide-react-native/icons/pause';
import Star from 'lucide-react-native/icons/star';
import X from 'lucide-react-native/icons/x';
import Zap from 'lucide-react-native/icons/zap';
import { t } from '@shared/i18n';
import { playSound } from '@shared/sound';
import { useTheme } from '@shared/theme';
import { Button, IconButton, SystemNavBar } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { AnswerButton, type AnswerState } from '@/components/AnswerButton';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { LifelineBar } from '@/components/LifelineBar';
import { TimerRing } from '@/components/TimerRing';
import { rewardedDecision } from '@/domain/adRules';
import { categoryOfId } from '@/domain/categories';
import { allowanceFor, LIFELINES, type LifelineKind } from '@/domain/lifelines';
import { answer, canContinueWithHeart, canOfferRewarded, continueWithHeart, grantRewardedLifeline, isBlitz, lifelineLeft, next, tick, useLifeline } from '@/domain/round';
import { isWatchingAd, watchRewarded } from '@/features/ads/rewarded';
import { commitRound } from '@/features/play/commit';
import { useRoundClock } from '@/features/play/useRoundClock';
import { lifelineVideosToday, useAds } from '@/store/ads';
import { useFeedback } from '@/store/feedback';
import { logFunnel } from '@/store/funnel';
import { useRound } from '@/store/round';
import { extraColorsFor, frost } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { GoldButton } from '@/ui/GoldButton';
import { categoryIcons } from '@/ui/icons';
import { Sheet } from '@/ui/Sheet';

/** Where a finished round goes (plan §4). */
const destination = (mode: string) => (mode === 'daily' ? '/daily/result' : mode === 'warmup' ? '/warmup-result' : '/results/[sessionId]');

/**
 * The question screen all modes share, and the app's hero moment (plan §4, §5): a violet stage with
 * the question card, its timer ring sitting on the card's top edge, four answer pills, and the
 * lifelines, which give way to the explanation once an answer is in. Full-screen, no tabs, no banner,
 * no ads of any kind. The clock runs only while a question is open: it stops for the explanation, a
 * pause overlay and the sheets, and the paused time is never counted.
 */
export default function Quiz() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { colors, spacing, radius, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  const feedback = useFeedback();
  const sid = useRound((s) => s.sessionId);
  const round = useRound((s) => s.state);
  const apply = useRound((s) => s.apply);
  const [paused, setPaused] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [offer, setOffer] = useState<LifelineKind | 'heart' | null>(null);
  const [offerNote, setOfferNote] = useState<string | null>(null);
  const [adBusy, setAdBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);
  useAdScreen('quiz');
  const committed = useRef(false);

  const live = round !== null && sid === sessionId;
  const timed = live && round.msLeft !== null;
  const isWarmup = live && round.config.mode === 'warmup';

  // Pause when the app goes to the background (plan §5: "Paused — Resume").
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && !isWatchingAd() && useRound.getState().state?.msLeft != null) setPaused(true);
    });
    return () => sub.remove();
  }, []);

  // Android Back asks before leaving; in the warm-up there is nothing to quit to.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isWarmup) setQuitOpen(true);
      return true;
    });
    return () => sub.remove();
  }, [isWarmup]);

  const running = live && round.phase === 'question' && !paused && !quitOpen && offer === null;
  const onTick = useCallback(
    (delta: number) => {
      const before = useRound.getState().state;
      apply((s) => tick(s, delta));
      const after = useRound.getState().state;
      if (before && after && before.msLeft !== null && after.msLeft !== null && !isBlitz(after.config)) {
        const was = Math.ceil(before.msLeft / 1000);
        const now = Math.ceil(after.msLeft / 1000);
        if (now !== was && now <= 5 && now > 0) playSound('tick');
      }
    },
    [apply],
  );
  useRoundClock(running, onTick);

  // Feedback once per answer: a sound, a haptic and a spoken verdict, then the explanation scrolls in.
  const answered = live ? round.answers.length : 0;
  const lastCorrect = live ? round.correct : null;
  useEffect(() => {
    if (!live || answered === 0 || round.phase === 'question') return;
    if (round.config.mode === 'warmup') logFunnel(`onb_warmup_q${Math.min(answered, 3)}`);
    if (lastCorrect) {
      playSound('check');
      void feedback.success();
    } else {
      playSound('wrong');
      void feedback.error();
    }
    const spoken = lastCorrect ? t('quiz.verdictSpoken.correct') : t(`quiz.verdictSpoken.${round.timedOut ? 'timeout' : 'wrong'}`, { answer: round.current.options[round.current.correctIndex] });
    AccessibilityInfo.announceForAccessibility(spoken);
    const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per answer
  }, [answered]);

  // The round is over: store it once, then show the results.
  const done = live && round.phase === 'done';
  useEffect(() => {
    if (!done || committed.current || useRound.getState().committed) return;
    committed.current = true;
    const state = useRound.getState();
    const result = commitRound(sessionId, state.state!, Date.now() - state.startedAt);
    state.markCommitted();
    if (result.mode === 'classic' && result.stars >= 1) playSound('celebrate');
    router.replace({ pathname: destination(result.mode) as '/results/[sessionId]', params: { sessionId } });
  }, [done, sessionId]);

  if (!live) return <Redirect href="/(tabs)" />;
  if (done) return null;

  const cur = round.current;
  const allow = allowanceFor(round.config.mode);
  const shown = { fifty: allow.free.fifty > 0, skip: allow.free.skip > 0, time: allow.free.time > 0 };
  const enabled = { fifty: lifelineLeft(round, 'fifty'), skip: lifelineLeft(round, 'skip'), time: lifelineLeft(round, 'time') };
  const questionNo = round.answers.length + (round.phase === 'question' ? 1 : 0);
  const total = round.config.questions.length;
  const blitz = isBlitz(round.config);
  const correctCount = round.answers.filter((a) => a.correct).length;
  const category = round.config.category ?? categoryOfId(cur.question.id);
  const CategoryIcon = categoryIcons[category];
  const stateOf = (i: number): AnswerState => {
    if (round.removed.includes(i)) return 'removed';
    if (round.phase === 'question') return 'idle';
    if (i === cur.correctIndex) return 'correct';
    if (i === round.chosen) return 'wrong';
    return 'dim';
  };
  const verdict = round.correct ? 'correct' : round.timedOut ? 'timeout' : 'wrong';
  const last = !blitz && round.queue.length === 0 && !round.outOfHearts ? true : round.outOfHearts;
  const rewardedOk = (placement: 'lifeline' | 'extra_life') =>
    rewardedDecision(placement, { today: '', screen: 'quiz', onboardingDone: true, lifelineVideosToday: lifelineVideosToday(), doubleXpToday: 0, heartContinueUsed: round.heartContinueUsed }).allowed;
  const offerFor: Record<LifelineKind, boolean> = {
    fifty: canOfferRewarded(round, 'fifty') && rewardedOk('lifeline'),
    skip: canOfferRewarded(round, 'skip') && rewardedOk('lifeline'),
    time: canOfferRewarded(round, 'time') && rewardedOk('lifeline'),
  };
  const openOffer = (kind: LifelineKind | 'heart') => {
    setOfferNote(null);
    setOffer(kind);
  };
  const closeOffer = () => {
    setOffer(null);
    setOfferNote(null);
  };
  const watch = async () => {
    if (adBusy || offer === null) return;
    setAdBusy(true);
    setOfferNote(null);
    const outcome = await watchRewarded(offer === 'heart' ? 'extra_life' : 'lifeline');
    setAdBusy(false);
    if (outcome === 'granted') {
      if (offer === 'heart') {
        apply((s) => next(continueWithHeart(s)));
      } else {
        apply((s) => grantRewardedLifeline(s, offer));
        useAds.getState().recordLifelineVideo();
      }
      closeOffer();
    } else if (outcome !== 'busy') {
      setOfferNote(t(outcome === 'unavailable' ? 'ads.unavailable' : 'ads.notEarned'));
    }
  };
  // Hearts ran out: one rewarded continue per level attempt, else the level ends.
  const onNext = () => {
    if (canContinueWithHeart(round) && rewardedOk('extra_life')) openOffer('heart');
    else apply(next);
  };
  const quit = () => {
    setQuitOpen(false);
    useRound.getState().clear();
    router.dismissTo('/(tabs)');
  };
  const title = isWarmup ? t('quiz.warmupTitle') : round.config.mode === 'daily' ? t('home.dailyTitle') : blitz ? t('modes.blitz') : t(`categories.${category}`);
  const progressText = blitz ? t('quiz.blitzCount', { count: correctCount }) : isWarmup ? t('quiz.warmupProgress', { n: questionNo, total }) : t('quiz.progress', { n: questionNo, total });
  const progressLabel = blitz ? progressText : isWarmup ? progressText : t('quiz.progressLabel', { n: questionNo, total });

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <SystemNavBar dark />
      <LinearGradient colors={x.stage} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Top bar: quit, the round's name, the score. */}
        <View style={[styles.bar, { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm }]}>
          {isWarmup ? (
            <View style={styles.side} />
          ) : (
            <IconButton icon={X} label={t('quiz.quit')} onPress={() => setQuitOpen(true)} color="#FFFFFF" style={{ backgroundColor: frost }} />
          )}
          <View style={[styles.titleBox, { gap: spacing.xs }]}>
            {blitz ? <Zap size={18} color={x.gold} fill={x.gold} strokeWidth={2} /> : <CategoryIcon size={18} color="#FFFFFF" strokeWidth={2.4} />}
            <AppText variant="h2" numberOfLines={1} style={[styles.white, styles.shrink]}>
              {title}
            </AppText>
          </View>
          {isWarmup ? (
            <View style={styles.side} />
          ) : (
            <View accessible accessibilityLabel={t('quiz.scoreLabel', { score: round.score })} style={[styles.chip, { backgroundColor: frost, borderRadius: radius.pill }]}>
              <Star size={15} color={x.gold} fill={x.gold} strokeWidth={2} />
              <AppText variant="body" style={[styles.white, styles.bold]}>
                {String(round.score)}
              </AppText>
            </View>
          )}
        </View>

        {/* Progress: "3 of 10" over one pill per question (or the Blitz count). */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <View accessible accessibilityLabel={progressLabel}>
              <AppText variant="body" style={[styles.white, styles.semi]}>
                {progressText}
              </AppText>
            </View>
            {round.config.hearts > 0 && (
              <View accessible accessibilityLabel={t('quiz.heartsLabel', { count: round.hearts })} style={[styles.row, { gap: 3 }]}>
                {Array.from({ length: round.config.hearts }, (_, i) => (
                  <Heart key={i} size={20} color={i < round.hearts ? '#FF8FA3' : '#FFFFFF80'} fill={i < round.hearts ? '#FF8FA3' : 'transparent'} strokeWidth={2.2} />
                ))}
              </View>
            )}
          </View>
          {!blitz && (
            <View style={[styles.row, { gap: 5 }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {Array.from({ length: total }, (_, i) => (
                <View
                  key={i}
                  style={[styles.segment, { backgroundColor: i < round.answers.length ? '#FFFFFF' : i === round.answers.length ? x.gold : '#FFFFFF38' }]}
                />
              ))}
            </View>
          )}
        </View>

        <ScrollView ref={scroll} contentContainerStyle={{ padding: spacing.lg, paddingTop: timed ? 44 : spacing.lg, gap: spacing.md, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* The question card; the timer ring sits on its top edge. */}
          <View style={[styles.card, { borderRadius: radius.xl, backgroundColor: x.card, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: timed ? 44 : spacing.xl }, shadow(3)]}>
            {timed && (
              <View style={[styles.ringSlot, shadow(2)]}>
                <TimerRing msLeft={round.msLeft ?? 0} msTotal={round.msTotal ?? 1} running={running} resetKey={`${cur.question.id}:${round.answers.length}`} />
              </View>
            )}
            <AppText variant="question" accessibilityRole="header" style={styles.center}>
              {cur.question.q}
            </AppText>
          </View>

          <View style={{ gap: spacing.md }}>
            {cur.options.map((text, i) => (
              <AnswerButton key={`${cur.question.id}-${i}`} index={i} text={text} state={stateOf(i)} disabled={round.phase !== 'question' || paused} onPress={(idx) => apply((s) => answer(s, idx))} />
            ))}
          </View>

          <View style={styles.grow} />
          {round.phase === 'question' ? (
            LIFELINES.some((k) => shown[k]) && (
              <LifelineBar counts={round.lifelines} enabled={enabled} shown={shown} offer={offerFor} onUse={(kind: LifelineKind) => apply((s) => useLifeline(s, kind))} onOffer={openOffer} />
            )
          ) : (
            <ExplanationPanel verdict={verdict} question={cur.question} correctText={cur.options[cur.correctIndex]} last={last} onNext={onNext} />
          )}
        </ScrollView>
      </SafeAreaView>

      {paused && round.phase === 'question' && (
        <View style={[StyleSheet.absoluteFill, styles.pause, { padding: spacing.xl, gap: spacing.lg }]} accessibilityViewIsModal>
          <LinearGradient colors={x.stage} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={[styles.pauseIcon, { backgroundColor: frost }]}>
            <Pause size={36} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
          </View>
          <AppText variant="display" accessibilityRole="header" style={styles.white}>
            {t('quiz.paused')}
          </AppText>
          <GoldButton label={t('quiz.resume')} onPress={() => setPaused(false)} style={styles.pauseButton} />
        </View>
      )}

      <Sheet visible={offer !== null} onClose={closeOffer}>
        <AppText variant="h1" accessibilityRole="header">
          {offer === 'heart' ? t('ads.heartTitle') : t('ads.lifelineTitle', { name: offer ? t(`quiz.lifeline.${offer}`) : '' })}
        </AppText>
        <AppText variant="body" style={{ color: colors.textMuted }}>
          {offer === 'heart' ? t('ads.heartBody') : t('ads.lifelineBody', { name: offer ? t(`quiz.lifeline.${offer}`) : '' })}
        </AppText>
        {offerNote && (
          <AppText accessibilityLiveRegion="polite" variant="body" style={styles.bold}>
            {offerNote}
          </AppText>
        )}
        <Button label={t('ads.watch')} onPress={() => void watch()} disabled={adBusy} />
        <Button
          variant="secondary"
          block
          label={offer === 'heart' ? t('ads.endLevel') : t('ads.noThanks')}
          onPress={() => {
            const heart = offer === 'heart';
            closeOffer();
            if (heart) apply(next);
          }}
        />
      </Sheet>

      <Sheet visible={quitOpen} onClose={() => setQuitOpen(false)}>
        <AppText variant="h1" accessibilityRole="header">
          {t('quiz.quitTitle')}
        </AppText>
        <AppText variant="body" style={{ color: colors.textMuted }}>
          {t('quiz.quitBody')}
        </AppText>
        <Button label={t('quiz.keepPlaying')} onPress={() => setQuitOpen(false)} />
        <Button variant="secondary" block label={t('quiz.quitConfirm')} onPress={quit} />
      </Sheet>
    </View>
  );
}

// White text sits on the violet stage or on frost over it; both are covered by the contrast test.
const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  shrink: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { width: 48, height: 48 },
  titleBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12 },
  segment: { flex: 1, height: 8, borderRadius: 4 },
  card: { alignItems: 'center' },
  ringSlot: { position: 'absolute', top: -32, alignSelf: 'center', borderRadius: 32 },
  center: { textAlign: 'center' },
  white: { color: '#FFFFFF' },
  bold: { fontWeight: '700' },
  semi: { fontWeight: '600' },
  pause: { alignItems: 'center', justifyContent: 'center' },
  pauseIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  pauseButton: { alignSelf: 'stretch' },
});
