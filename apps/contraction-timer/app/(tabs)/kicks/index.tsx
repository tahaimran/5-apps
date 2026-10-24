import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Bell from 'lucide-react-native/icons/bell';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Footprints from 'lucide-react-native/icons/footprints';
import HeartHandshake from 'lucide-react-native/icons/heart-handshake';
import RotateCcwClock from 'lucide-react-native/icons/rotate-ccw-clock';
import Undo2 from 'lucide-react-native/icons/undo-2';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Digits, IconButton, PressableScale, ProgressRing, showToast } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { KickReminderSheet } from '@/components/KickReminderSheet';
import { dateKeyFor } from '@/domain/dateKey';
import { describeMinutes, elapsedKick, isComplete, softLimitReached, timeToTarget } from '@/domain/kicks';
import { recordPositiveMoment } from '@/features/review/ask';
import { timerHaptics } from '@/features/timer/haptics';
import { useNow } from '@/hooks/useNow';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useAppColors } from '@/theme/mode';
import { KICK_BUTTON } from '@/theme/tokens';
import { AlertCard } from '@/ui/AlertCard';
import { AppText } from '@/ui/AppText';
import { mmss, timeOfDay, useClock24h } from '@/ui/format';
import { CSS_EASE_OUT, KICK_POP, POP_MS } from '@/ui/motion';
import { Screen } from '@/ui/Screen';

/** The count's size in sp: 96 (plan §5.3), shrunk only if the phone's font scale would push it out of the disc. */
const countSize = (disc: number, digits: number, fontScale: number) => Math.max(40, Math.floor(Math.min(96, (disc * 0.62) / (Math.max(digits, 2) * 0.64 * fontScale))));

/**
 * Plan §5.3 and F10: count movements up to the target, see how long it took, and keep the history. The
 * counter is the screen's one loud thing: a disc on a lavender stage, a ring that fills toward the target,
 * and a small pop on every counted movement (a one-shot CSS keyframe, none with Reduce Motion).
 */
export default function Kicks() {
  const { colors, spacing, radius, type, shadow, fonts } = useTheme();
  useAdScreen('kicks');
  const app = useAppColors();
  const reduced = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const active = useKicks((s) => s.active);
  const reminder = useSettings((s) => s.settings.kickReminder);
  const clock24h = useClock24h();
  const needs = useProfile((s) => s.profile.needs);
  const onboardingDay = useMeta((s) => s.meta.onboardingDay);
  const now = useNow(!!active, 500);
  const [sheet, setSheet] = useState(false);
  // Locks the page's scrolling while a finger is on the counter, so a thumb that slides a little cannot turn a tap into a scroll.
  const [touching, setTouching] = useState(false);

  // The 2-hour message needs no action; the 3-hour limit saves the count and closes it.
  const second = Math.floor(now / 1000);
  useEffect(() => {
    if (useKicks.getState().checkLimits(Date.now()) === 'closed') showToast({ message: t('kicks.hardClosed'), icon: CircleCheck, duration: 5000 });
  }, [second]);

  const reached = !!active && isComplete(active);
  const soft = !!active && softLimitReached(active, now);
  const welcome = needs.length === 1 && needs[0] === 'kicks' && onboardingDay === dateKeyFor(new Date(now));

  const onCount = () => {
    const result = useKicks.getState().tap(Date.now());
    if (result === 'counted') timerHaptics.kick();
    if (result === 'reached') timerHaptics.kickTarget();
  };
  const saved = () => showToast({ message: t('kicks.saved'), icon: CircleCheck, tone: 'success' });
  const reminderText = reminder.enabled ? t('kicks.reminderOn', { time: timeOfDay(reminder.hour, reminder.minute, clock24h) }) : t('kicks.reminderOff');
  const disc = active ? KICK_BUTTON + 20 : KICK_BUTTON;
  const ring = disc + 28;
  const count = active?.taps.length ?? 0;
  const digits = countSize(disc, String(count).length, fontScale);
  // "Start counting" on two lines inside the disc: the title size, shrunk only as far as the font scale needs.
  const startSize = Math.max(14, Math.min(type.title.fontSize, Math.floor((disc * 0.62) / (8 * 0.6 * fontScale))));

  return (
    <Screen scrollEnabled={!touching} title={t('kicks.title')} titleAccessory={<IconButton icon={RotateCcwClock} variant="tonal" label={t('kicks.history')} onPress={() => router.push('/kicks/history')} />}>
      <View style={[{ borderRadius: radius.xl }, shadow(3)]}>
        <View style={[styles.stage, { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg }]}>
          <LinearGradient colors={app.kickStage} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
          <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: app.onKick, textAlign: 'center', fontWeight: '600' }]}>
            {!active ? (welcome ? t('kicks.startedTip') : t('kicks.tip')) : reached ? t('kicks.doneTitle', { n: count, min: describeMinutes(timeToTarget(active) ?? 0) }) : t('kicks.tapForEach')}
          </AppText>

          {!active ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t('kicks.startLabel')}
              onPress={() => useKicks.getState().start(Date.now())}
              scaleTo={0.96}
              style={[styles.disc, { width: disc, height: disc, borderRadius: disc / 2, backgroundColor: app.kickDisc, padding: spacing.lg, gap: spacing.sm }, shadow(2)]}
            >
              <Footprints size={40} color={app.onKickDisc} strokeWidth={2.25} />
              <AppText style={{ fontSize: startSize, lineHeight: Math.round(startSize * 1.2), color: app.onKickDisc, textAlign: 'center', fontFamily: fonts.display, fontWeight: '800' }}>{t('kicks.start')}</AppText>
            </PressableScale>
          ) : (
            <View style={[styles.center, { width: ring, height: ring }]}>
              <View style={StyleSheet.absoluteFill}>
                <ProgressRing size={ring} strokeWidth={8} progress={count / active.target} color={app.kickRing} trackColor={app.kickTrack} duration={POP_MS} />
              </View>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t('kicks.countLabel', { n: count, target: active.target })}
                disabled={reached}
                onPress={onCount}
                onPressIn={() => setTouching(true)}
                onPressOut={() => setTouching(false)}
                hitSlop={24}
                scaleTo={0.96}
                style={[styles.disc, { width: disc, height: disc, borderRadius: disc / 2, backgroundColor: app.kickDisc }, shadow(2)]}
              >
                <Animated.View
                  style={reduced || count === 0 ? null : { animationName: KICK_POP[count % 2], animationDuration: POP_MS, animationTimingFunction: CSS_EASE_OUT }}
                >
                  <Digits value={String(count)} size={digits} lineHeight={Math.round(digits * 1.1)} color={app.onKickDisc} />
                </Animated.View>
                <AppText style={[type.bodyLarge, { color: app.onKickDisc, fontWeight: '700' }]}>{t('kicks.target', { target: active.target })}</AppText>
              </PressableScale>
            </View>
          )}

          {active ? (
            <AppText style={[type.title, { color: app.onKick, textAlign: 'center', fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{t('kicks.elapsed', { time: mmss(elapsedKick(active, now)) })}</AppText>
          ) : null}
        </View>
      </View>

      {soft ? <AlertCard icon={HeartHandshake}>{t('kicks.softLimit')}</AlertCard> : null}

      {active && reached ? (
        <Button
          icon={CircleCheck}
          label={t('kicks.save')}
          onPress={() => {
            const done = useKicks.getState().finish(Date.now());
            saved();
            // A count that reached its target is a good moment (ASO.md §7), unless it had run into the 2-hour message.
            if (done) {
              const softAt = useMeta.getState().meta.lastKickSoftLimitAt;
              void recordPositiveMoment('kickTarget', { hitSoftLimit: softAt !== undefined && softAt >= done.startedAt });
            }
          }}
        />
      ) : null}
      {active && !reached ? (
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Button
            variant="secondary"
            icon={Undo2}
            label={t('kicks.undoShort')}
            accessibilityLabel={t('kicks.undo')}
            disabled={count === 0}
            onPress={() => {
              useKicks.getState().undo();
              timerHaptics.undo();
            }}
            style={styles.grow}
          />
          <Button
            label={t('kicks.end')}
            accessibilityHint={t('kicks.endLabel')}
            onPress={() => {
              if (useKicks.getState().finish(Date.now())) saved();
            }}
            style={styles.grow}
          />
        </View>
      ) : null}

      {!active ? <Button variant="secondary" block icon={Bell} label={reminderText} onPress={() => setSheet(true)} accessibilityHint={t('kicks.reminderHint')} /> : null}

      <KickReminderSheet visible={sheet} onClose={() => setSheet(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { overflow: 'hidden', alignItems: 'center' },
  disc: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  grow: { flexGrow: 1, flexBasis: 140 },
});
