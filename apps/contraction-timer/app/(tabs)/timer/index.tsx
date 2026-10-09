import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import { t } from '@shared/i18n';
import { useOnboardingComplete } from '@shared/onboarding';
import { ThemeProvider, useTheme } from '@shared/theme';
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
import { useAppColors } from '@/theme/mode';
import { FONT_SCALE, palette, PARTNER_SCALE, TOUCH_TARGET } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { mmss, spoken } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { Sheet } from '@/ui/Sheet';
import { Toast } from '@/ui/Toast';

const TOAST_MS = 5000;
/** The disclaimer sheet is offered once per launch. */
let disclaimerShownThisLaunch = false;
export const resetDisclaimerSheetForTests = () => {
  disclaimerShownThisLaunch = false;
};

function TimerContent() {
  const { colors, spacing, type, radius } = useTheme();
  useAdScreen('timer');
  const app = useAppColors();
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

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  // Plan §5.1 "Restored after kill": the session came back from disk when the app started.
  useEffect(() => {
    if (useSessions.getState().restored) {
      useSessions.setState({ restored: false });
      showToast(t('timer.restored'));
    }
  }, [showToast]);

  useKeepAwakeWhile(!!active && focused);
  useClockWatch(!!active && focused, () => showToast(t('timer.clockChanged')));

  const onTap = () => {
    if (meta.coachMarkShownAt === undefined) useMeta.getState().update({ coachMarkShownAt: Date.now() });
    const before = useSessions.getState().active;
    // Read the clock at the tap, and warn when it is behind the last thing that was saved.
    const at = Date.now();
    if (clockSetBack(before, at)) showToast(t('timer.clockChanged'));
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

  return (
    <Screen scrollEnabled={!touching}>
      <TimerHeader hideTools={partner && !!open} />
      <AppText
        accessibilityLiveRegion="polite"
        style={[type.bodyLarge, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}
      >
        {status}
      </AppText>
      {partner && !active ? (
        <AppText style={[type.title, { color: colors.text, textAlign: 'center', fontWeight: '700' }]}>{t('timer.partnerLabel')}</AppText>
      ) : null}

      {/* The running time. Its space is kept while resting so the button does not jump. */}
      <View style={{ minHeight: 96, justifyContent: 'center' }} accessible={!!open} accessibilityLabel={open ? t('timer.elapsedLabel', { time: spoken(elapsed) }) : undefined}>
        {showCoach ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.coachDismiss')}
            accessibilityHint={t('onboarding.coachMark')}
            onPress={() => useMeta.getState().update({ coachMarkShownAt: Date.now() })}
            style={{ minHeight: 72, justifyContent: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface }}
          >
            <AppText style={[type.bodyLarge, { color: colors.text, textAlign: 'center', fontWeight: '700' }]}>{t('onboarding.coachMark')}</AppText>
          </Pressable>
        ) : null}
        {open ? (
          <AppText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ color: colors.text, textAlign: 'center', fontWeight: '700', fontSize: 72 * (partner ? 1.4 : 1), lineHeight: 80 * (partner ? 1.4 : 1), fontVariant: ['tabular-nums'] }}
          >
            {mmss(elapsed)}
          </AppText>
        ) : null}
      </View>

      <TimerButton
        running={!!open}
        spokenElapsed={spoken(elapsed)}
        partner={partner}
        onPress={onTap}
        onLongPress={() => active && setUndoOpen(true)}
        onTouch={setTouching}
      />

      {isLongRunning(open, now) ? (
        <AppText style={[type.bodyLarge, { color: colors.text, textAlign: 'center' }]}>{t('timer.longRunning')}</AppText>
      ) : null}

      {idle ? (
        <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: app.alertBg, gap: spacing.md }}>
          <AppText style={[type.bodyLarge, { color: app.alertText, fontWeight: '600' }]}>{t('timer.idlePrompt')}</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <BigButton style={{ flex: 1 }} label={t('timer.idleEnd')} onPress={() => useSessions.getState().endActive()} />
            <BigButton style={{ flex: 1 }} variant="secondary" label={t('timer.idleKeep')} onPress={() => useSessions.getState().keepActive()} />
          </View>
        </View>
      ) : null}

      {!active && firstBaby !== 'no' ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('timer.howThisWorks')}
          onPress={() => setHowOpen(true)}
          style={{ minHeight: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText style={[type.bodyLarge, { color: colors.text, textDecorationLine: 'underline' }]}>{t('timer.howThisWorks')}</AppText>
        </Pressable>
      ) : null}

      {active && !partner ? (
        <>
          <StatsStrip stats={windowStats(active.contractions, now)} />
          <LastContractionCard last={lastContraction(active.contractions)} now={now} onTag={(id, level) => useSessions.getState().setIntensity(active.id, id, level)} />
        </>
      ) : null}

      {/* Under the button, so it can never move the button while a thumb is on its way to it. */}
      {showBanner ? <PatternBanner rule={rule} onShare={() => router.push({ pathname: '/modals/share-summary', params: { id: active.id } })} onDismiss={() => useSessions.getState().dismissPattern()} /> : null}

      {toast ? <Toast message={toast} /> : null}

      <Sheet visible={undoOpen} onClose={() => setUndoOpen(false)}>
        <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('timer.undoTitle')}</AppText>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('timer.undoBody')}</AppText>
        <BigButton
          tall
          label={t('timer.undoConfirm')}
          onPress={() => {
            useSessions.getState().undoTap();
            setUndoOpen(false);
          }}
        />
        <BigButton variant="secondary" label={t('common.cancel')} onPress={() => setUndoOpen(false)} />
      </Sheet>

      <Sheet visible={disclaimerOpen} onClose={() => setDisclaimerOpen(false)}>
        <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('disclaimerSheet.title')}</AppText>
        <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('onboarding.disclaimerBody')}</AppText>
        <BigButton
          tall
          label={t('onboarding.understand')}
          onPress={() => {
            useMeta.getState().acknowledgeDisclaimer();
            setDisclaimerOpen(false);
          }}
        />
        <BigButton variant="secondary" label={t('disclaimerSheet.later')} onPress={() => setDisclaimerOpen(false)} />
      </Sheet>

      <Sheet visible={howOpen} onClose={() => setHowOpen(false)}>
        <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('timer.howTitle')}</AppText>
        {(['howBody1', 'howBody2', 'howBody3'] as const).map((k) => (
          <AppText key={k} style={[type.bodyLarge, { color: colors.text }]}>{t(`timer.${k}`)}</AppText>
        ))}
        <BigButton tall label={t('common.done')} onPress={() => setHowOpen(false)} />
      </Sheet>
    </Screen>
  );
}

/** Plan §7: in Partner mode the Timer's type is 1.4 times bigger, and the secondary controls go. */
export default function TimerScreen() {
  const partner = useSettings((s) => s.settings.partnerMode);
  return (
    <ThemeProvider palette={palette} fontScale={FONT_SCALE * (partner ? PARTNER_SCALE : 1)} touchTarget={TOUCH_TARGET}>
      <TimerContent />
    </ThemeProvider>
  );
}
