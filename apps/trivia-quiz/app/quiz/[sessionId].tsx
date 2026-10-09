import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, BackHandler, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { playSound } from '@/audio/sounds';
import { AnswerButton, type AnswerState } from '@/components/AnswerButton';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { LifelineBar } from '@/components/LifelineBar';
import { TimerRing } from '@/components/TimerRing';
import { allowanceFor, LIFELINES, type LifelineKind } from '@/domain/lifelines';
import { answer, isBlitz, lifelineLeft, next, tick, useLifeline } from '@/domain/round';
import { commitRound } from '@/features/play/commit';
import { useRoundClock } from '@/features/play/useRoundClock';
import { useFeedback } from '@/store/feedback';
import { logFunnel } from '@/store/funnel';
import { useRound } from '@/store/round';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Sheet } from '@/ui/Sheet';

/** Where a finished round goes (plan §4). */
const destination = (mode: string) => (mode === 'daily' ? '/daily/result' : mode === 'warmup' ? '/warmup-result' : '/results/[sessionId]');

/**
 * The question screen all modes share (plan §4: full-screen, no tabs, no banner, no ads of any kind).
 * The clock runs only while a question is open: it stops for the explanation, a pause overlay and
 * the quit sheet, and the paused time is never counted.
 */
export default function Quiz() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { colors, spacing, radius, mode } = useTheme();
  const feedback = useFeedback();
  const sid = useRound((s) => s.sessionId);
  const round = useRound((s) => s.state);
  const apply = useRound((s) => s.apply);
  const [paused, setPaused] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const committed = useRef(false);

  const live = round !== null && sid === sessionId;
  const timed = live && round.msLeft !== null;
  const isWarmup = live && round.config.mode === 'warmup';

  // Pause when the app goes to the background (plan §5: "Paused — Resume").
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && useRound.getState().state?.msLeft != null) setPaused(true);
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

  const running = live && round.phase === 'question' && !paused && !quitOpen;
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

  // Feedback once per answer.
  const answered = live ? round.answers.length : 0;
  const lastCorrect = live ? round.correct : null;
  useEffect(() => {
    if (!live || answered === 0 || round.phase === 'question') return;
    if (round.config.mode === 'warmup') logFunnel(`onb_warmup_q${Math.min(answered, 3)}`);
    if (lastCorrect) {
      playSound('correct');
      feedback.success();
    } else {
      playSound('wrong');
      feedback.error();
    }
    const spoken = lastCorrect ? t('quiz.verdictSpoken.correct') : t(`quiz.verdictSpoken.${round.timedOut ? 'timeout' : 'wrong'}`, { answer: round.current.options[round.current.correctIndex] });
    AccessibilityInfo.announceForAccessibility(spoken);
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
    if (result.mode === 'classic' && result.stars >= 1) playSound('levelup');
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
  const stateOf = (i: number): AnswerState => {
    if (round.removed.includes(i)) return 'removed';
    if (round.phase === 'question') return 'idle';
    if (i === cur.correctIndex) return 'correct';
    if (i === round.chosen) return 'wrong';
    return 'dim';
  };
  const verdict = round.correct ? 'correct' : round.timedOut ? 'timeout' : 'wrong';
  const last = !blitz && round.queue.length === 0 && !round.outOfHearts ? true : round.outOfHearts;
  const quit = () => {
    setQuitOpen(false);
    useRound.getState().clear();
    router.replace('/(tabs)');
  };
  void mode;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          {isWarmup ? (
            <View style={{ minHeight: 48, justifyContent: 'center' }}>
              <AppText variant="body" style={{ fontWeight: '700' }}>{t('quiz.warmupProgress', { n: questionNo, total })}</AppText>
            </View>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel={t('quiz.quit')} onPress={() => setQuitOpen(true)} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="close" size={28} color={colors.text} />
            </Pressable>
          )}
          {!isWarmup && (
            <View accessible accessibilityLabel={blitz ? t('quiz.blitzCount', { count: round.answers.filter((a) => a.correct).length }) : t('quiz.progressLabel', { n: questionNo, total })}>
              <AppText variant="body" style={{ fontWeight: '700' }}>{blitz ? t('quiz.blitzCount', { count: round.answers.filter((a) => a.correct).length }) : t('quiz.progress', { n: questionNo, total })}</AppText>
            </View>
          )}
          {round.config.hearts > 0 && (
            <View accessible accessibilityLabel={t('quiz.heartsLabel', { count: round.hearts })} style={{ flexDirection: 'row', gap: 2 }}>
              {Array.from({ length: round.config.hearts }, (_, i) => (
                <MaterialCommunityIcons key={i} name={i < round.hearts ? 'heart' : 'heart-outline'} size={22} color={colors.danger} />
              ))}
            </View>
          )}
          {!isWarmup && (
            <View accessible accessibilityLabel={t('quiz.scoreLabel', { score: round.score })}>
              <AppText variant="body" style={{ fontWeight: '700' }}>{String(round.score)}</AppText>
            </View>
          )}
          {timed ? <TimerRing msLeft={round.msLeft ?? 0} msTotal={round.msTotal ?? 1} /> : <View style={{ width: 56 }} />}
        </View>

        <View style={{ gap: spacing.md, flex: 1 }}>
          <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <AppText variant="question" accessibilityRole="header">{cur.question.q}</AppText>
          </View>
          <View style={{ gap: spacing.md }}>
            {cur.options.map((text, i) => (
              <AnswerButton key={`${cur.question.id}-${i}`} index={i} text={text} state={stateOf(i)} disabled={round.phase !== 'question' || paused} onPress={(idx) => apply((s) => answer(s, idx))} />
            ))}
          </View>
          {round.phase === 'question' && round.lastPoints > 0 && null}
          {round.phase === 'question' ? (
            LIFELINES.some((k) => shown[k]) && (
              <LifelineBar counts={round.lifelines} enabled={enabled} shown={shown} onUse={(kind: LifelineKind) => apply((s) => useLifeline(s, kind))} />
            )
          ) : (
            <ExplanationPanel verdict={verdict} question={cur.question} correctText={cur.options[cur.correctIndex]} last={last} onNext={() => apply(next)} />
          )}
        </View>
      </View>

      {paused && round.phase === 'question' && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }} accessibilityViewIsModal>
          <AppText variant="h1" accessibilityRole="header">{t('quiz.paused')}</AppText>
          <BigButton tall label={t('quiz.resume')} onPress={() => setPaused(false)} />
        </View>
      )}

      <Sheet visible={quitOpen} onClose={() => setQuitOpen(false)}>
        <AppText variant="h1" accessibilityRole="header">{t('quiz.quitTitle')}</AppText>
        <AppText variant="body" style={{ color: colors.textMuted }}>{t('quiz.quitBody')}</AppText>
        <BigButton tall label={t('quiz.keepPlaying')} onPress={() => setQuitOpen(false)} />
        <BigButton variant="secondary" label={t('quiz.quitConfirm')} onPress={quit} />
      </Sheet>
    </SafeAreaView>
  );
}
