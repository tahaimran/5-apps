import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import ClockAlert from 'lucide-react-native/icons/clock-alert';
import Hand from 'lucide-react-native/icons/hand';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Info from 'lucide-react-native/icons/info';
import Moon from 'lucide-react-native/icons/moon';
import RotateCcwClock from 'lucide-react-native/icons/rotate-ccw-clock';
import { t } from '@shared/i18n';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
import { Button, Digits, PressableScale, showToast } from '@shared/ui';
import { clockSetBack, elapsedOf, idleStatus, isLongRunning } from '@/domain/session';
import { evaluatePattern, bannerVisible } from '@/domain/pattern';
import { lastContraction, openContraction, windowStats } from '@/domain/stats';
import { useAdScreen } from '@/ads/guard';
import { timerHaptics } from '@/features/timer/haptics';
import { LastContractionCard } from '@/features/timer/LastContractionCard';
import { PatternBanner } from '@/features/timer/PatternBanner';
import { StatsStrip } from '@/features/timer/StatsStrip';
import { TimerButton } from '@/features/timer/TimerButton';
import { TimerHeader } from '@/features/timer/TimerHeader';
import { useKeepAwakeWhile } from '@/features/timer/useKeepAwake';
import { useClockWatch } from '@/hooks/useClockWatch';
import { useFocused, useNow } from '@/hooks/useNow';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { useAppColors, useIsNight } from '@/theme/mode';
import { DIGITS, FONT_SCALE, partnerFactor, themeProps } from '@/theme/tokens';
import { AlertCard } from '@/ui/AlertCard';
import { AppText } from '@/ui/AppText';
import { mmss, spoken } from '@/ui/format';
import { CSS_EASE_OUT, WASH_MS } from '@/ui/motion';
import { Screen } from '@/ui/Screen';
import { Sheet } from '@/ui/Sheet';

/** The disclaimer sheet is offered once per launch. */
let disclaimerShownThisLaunch = false;
export const resetDisclaimerSheetForTests = () => {
  disclaimerShownThisLaunch = false;
};

/** The running time's size in sp: 72 (×1.4 in Partner mode), shrunk only as far as the screen width needs. */
export function digitsSize(value: string, want: number, width: number, fontScale: number): number {
  const ems = [...value].reduce((sum, ch) => sum + (/\d/.test(ch) ? 0.64 : 0.34), 0);
  return Math.max(32, Math.floor(Math.min(want, (width - 48) / (ems * fontScale))));
}

/**
 * The page wash: mint while resting, warming to peach while a contraction runs (two gradients that
 * crossfade with a CSS transition; with Reduce Motion the change is instant).
 */
function Wash({ warm }: { warm: boolean }) {
  const app = useAppColors();
  const reduced = useReducedMotion();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={app.wash} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: warm ? 1 : 0, transitionProperty: 'opacity', transitionDuration: reduced ? 0 : WASH_MS, transitionTimingFunction: CSS_EASE_OUT }]}>
        <LinearGradient colors={app.washActive} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/** What is happening, in one pill: a colored dot (coral while contracting) and the plan's words. */
function StatusPill({ text, tone }: { text: string; tone: 'idle' | 'resting' | 'contracting' }) {
  const { colors, radius, spacing, type, shadow } = useTheme();
  const app = useAppColors();
  const dot = tone === 'contracting' ? app.active : tone === 'resting' ? colors.primary : colors.textMuted;
  return (
    <View style={[styles.pill, { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }, shadow(1)]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, styles.shrink, { color: colors.text, fontWeight: '600', textAlign: 'center' }]}>
        {text}
      </AppText>
    </View>
  );
}

function TimerContent() {
  const { colors, spacing, type, radius } = useTheme();
  useAdScreen('timer');
  const night = useIsNight();
  const { width, fontScale } = useWindowDimensions();
  const active = useSessions((s) => s.active);
  const partner = useSettings((s) => s.settings.partnerMode);
  const rule = useSettings((s) => s.settings.rule);
  const patternAlerts = useSettings((s) => s.settings.patternAlerts);
  const firstBaby = useProfile((s) => s.profile.firstBaby);
  const focused = useFocused();
  const now = useNow(!!active);
  const open = active ? openContraction(active.contractions) : null;

  // Recomputed every second while visible (plan F4); the pattern is also checked at every tick so the banner can
  // appear without a tap (the window moves) and so the episode bookkeeping is saved.
  const second = Math.floor(now / 1000);
  useEffect(() => {
    if (!active || !patternAlerts || !focused) return;
    if (useSessions.getState().evaluate(Date.now())) timerHaptics.banner();
  }, [second, active, patternAlerts, focused]);
  const matchesNow = !!active && patternAlerts && evaluatePattern(rule, active.contractions, now).matches;
  const showBanner = !!active && matchesNow && bannerVisible(active.pattern, matchesNow);

  const [touching, setTouching] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const meta = useMeta((s) => s.meta);
  const onboarded = useOnboardingComplete();
  // Plan §6 "Landing": a one-time hint around the button. It sits in the space the running time uses, so nothing moves.
  const showCoach = onboarded && !active && meta.coachMarkShownAt === undefined && !partner;
  // Plan §6: after Skip the disclaimer comes as a sheet on the first visit, once per launch, and never over a session.
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  useEffect(() => {
    if (onboarded && meta.disclaimerAckAt === undefined && !useSessions.getState().active && !disclaimerShownThisLaunch) {
      disclaimerShownThisLaunch = true;
      setDisclaimerOpen(true);
    }
  }, [onboarded, meta.disclaimerAckAt]);

  // Plan §5.1 "Restored after kill": the session came back from disk when the app started.
  useEffect(() => {
    if (useSessions.getState().restored) {
      useSessions.setState({ restored: false });
      showToast({ message: t('timer.restored'), icon: RotateCcwClock, duration: 5000 });
    }
  }, []);

  const clockToast = () => showToast({ message: t('timer.clockChanged'), icon: ClockAlert, tone: 'warning', duration: 5000 });
  useKeepAwakeWhile(!!active && focused);
  useClockWatch(!!active && focused, clockToast);

  const onTap = () => {
    if (meta.coachMarkShownAt === undefined) useMeta.getState().update({ coachMarkShownAt: Date.now() });
    const before = useSessions.getState().active;
    // Read the clock at the tap, and warn when it is behind the last thing that was saved.
    const at = Date.now();
    if (clockSetBack(before, at)) clockToast();
    const kind = useSessions.getState().tap(at);
    if (kind === 'started') timerHaptics.start();
    if (kind === 'stopped') {
      timerHaptics.stop();
      const done = useSessions.getState().active?.contractions.find((c) => c.endedAt === at);
      if (done) void AccessibilityInfo.announceForAccessibility(t('timer.stopped', { time: spoken(at - done.startedAt) }));
    }
  };

  const idle = active && idleStatus(active, now) === 'prompt';
  const last = active ? Math.max(0, ...active.contractions.map((c) => c.startedAt)) : 0;
  const elapsed = open ? elapsedOf(open, now) : 0;
  const status = !active ? t(partner ? 'timer.partnerIdleStatus' : 'timer.idleStatus') : open ? t('timer.contracting') : t('timer.resting', { time: mmss(now - last) });
  const running = mmss(elapsed);
  const want = DIGITS.size * (partner ? partnerFactor(fontScale) : 1);
  const size = digitsSize(running, want, width, fontScale);

  return (
    <Screen scrollEnabled={!touching} backdrop={<Wash warm={!!open} />}>
      <TimerHeader hideTools={partner && !!open} />
      <StatusPill text={status} tone={!active ? 'idle' : open ? 'contracting' : 'resting'} />
      {partner && !active ? (
        <AppText style={[type.title, { color: colors.text, textAlign: 'center', fontWeight: '800' }]}>{t('timer.partnerLabel')}</AppText>
      ) : null}

      {/* The running time. Its space is kept while resting so the button does not jump. */}
      <View style={[styles.center, { minHeight: Math.round(size * 1.12) * fontScale }]}>
        {showCoach ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.coachDismiss')}
            accessibilityHint={t('onboarding.coachMark')}
            onPress={() => useMeta.getState().update({ coachMarkShownAt: Date.now() })}
            scaleTo={0.98}
            style={[styles.coach, { padding: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderColor: colors.primary }]}
          >
            <Hand size={24} color={colors.primary} strokeWidth={2.25} />
            <AppText style={[type.bodyLarge, styles.shrink, { color: colors.text, fontWeight: '700' }]}>{t('onboarding.coachMark')}</AppText>
          </PressableScale>
        ) : null}
        {open ? <Digits value={running} size={size} lineHeight={Math.round(size * 1.12)} color={colors.text} accessibilityLabel={t('timer.elapsedLabel', { time: spoken(elapsed) })} /> : null}
      </View>

      <TimerButton
        running={!!open}
        spokenElapsed={spoken(elapsed)}
        partner={partner}
        onPress={onTap}
        onLongPress={() => active && setUndoOpen(true)}
        onTouch={setTouching}
      />
      {open && !partner ? <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('timer.breathe')}</AppText> : null}

      {isLongRunning(open, now) ? <AlertCard icon={Hourglass}>{t('timer.longRunning')}</AlertCard> : null}

      {idle ? (
        <AlertCard
          icon={Moon}
          actions={
            <>
              <Button label={t('timer.idleEnd')} onPress={() => useSessions.getState().endActive()} style={styles.grow} />
              <Button variant="secondary" label={t('timer.idleKeep')} onPress={() => useSessions.getState().keepActive()} style={styles.grow} />
            </>
          }
        >
          {t('timer.idlePrompt')}
        </AlertCard>
      ) : null}

      {!active && firstBaby !== 'no' ? <Button variant="ghost" icon={Info} label={t('timer.howThisWorks')} onPress={() => setHowOpen(true)} /> : null}

      {active && !partner ? (
        <>
          <StatsStrip stats={windowStats(active.contractions, now)} />
          <LastContractionCard last={lastContraction(active.contractions)} now={now} onTag={(id, level) => useSessions.getState().setIntensity(active.id, id, level)} />
        </>
      ) : null}

      {/* Under the button, so it can never move the button while a thumb is on its way to it. */}
      {showBanner ? <PatternBanner rule={rule} onShare={() => router.push({ pathname: '/modals/share-summary', params: { id: active.id } })} onDismiss={() => useSessions.getState().dismissPattern()} /> : null}

      {night ? <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('timer.nightHint')}</AppText> : null}

      <Sheet visible={undoOpen} onClose={() => setUndoOpen(false)} title={t('timer.undoTitle')}>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('timer.undoBody')}</AppText>
        <Button
          label={t('timer.undoConfirm')}
          onPress={() => {
            useSessions.getState().undoTap();
            timerHaptics.undo();
            setUndoOpen(false);
          }}
        />
        <Button variant="secondary" label={t('common.cancel')} onPress={() => setUndoOpen(false)} />
      </Sheet>

      <Sheet visible={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} title={t('disclaimerSheet.title')}>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('onboarding.disclaimerBody')}</AppText>
        <Button
          label={t('onboarding.understand')}
          onPress={() => {
            useMeta.getState().acknowledgeDisclaimer();
            setDisclaimerOpen(false);
          }}
        />
        <Button variant="secondary" label={t('disclaimerSheet.later')} onPress={() => setDisclaimerOpen(false)} />
      </Sheet>

      <Sheet visible={howOpen} onClose={() => setHowOpen(false)} title={t('timer.howTitle')}>
        {(['howBody1', 'howBody2', 'howBody3'] as const).map((k) => (
          <AppText key={k} style={[type.bodyLarge, { color: colors.text }]}>
            {t(`timer.${k}`)}
          </AppText>
        ))}
        <Button label={t('common.done')} onPress={() => setHowOpen(false)} />
      </Sheet>
    </Screen>
  );
}

/**
 * Plan §7: in Partner mode the Timer's type is 1.4 times bigger (capped so Partner × the phone's own font
 * scale stays at or under 2), and the secondary controls go.
 */
export default function TimerScreen() {
  const partner = useSettings((s) => s.settings.partnerMode);
  const { fontScale } = useWindowDimensions();
  return (
    <ThemeProvider {...themeProps} fontScale={FONT_SCALE * (partner ? partnerFactor(fontScale) : 1)}>
      <TimerContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', maxWidth: '100%' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  shrink: { flexShrink: 1 },
  grow: { flexGrow: 1 },
  coach: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, minHeight: 72 },
});
