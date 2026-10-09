import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { KickReminderSheet } from '@/components/KickReminderSheet';
import { dateKeyFor } from '@/domain/dateKey';
import { elapsedKick, isComplete, softLimitReached, timeToTarget } from '@/domain/kicks';
import { timerHaptics } from '@/features/timer/haptics';
import { useNow } from '@/hooks/useNow';
import { recordPositiveMoment } from '@/features/review/ask';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useAppColors } from '@/theme/mode';
import { KICK_BUTTON } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { IconButton } from '@/ui/IconButton';
import { mmss, timeOfDay } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { Toast } from '@/ui/Toast';
import { describeMinutes } from '@/domain/kicks';

const TOAST_MS = 5000;

/** Plan §5.3 and F10: count movements up to the target, see how long it took, and keep the history. */
export default function Kicks() {
  const { colors, spacing, radius, type } = useTheme();
  const app = useAppColors();
  const active = useKicks((s) => s.active);
  const settings = useSettings((s) => s.settings);
  const needs = useProfile((s) => s.profile.needs);
  const onboardingDay = useMeta((s) => s.meta.onboardingDay);
  const now = useNow(!!active, 500);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // The 2-hour message needs no action; the 3-hour limit saves the count and closes it.
  const second = Math.floor(now / 1000);
  useEffect(() => {
    if (useKicks.getState().checkLimits(Date.now()) === 'closed') flash(t('kicks.hardClosed'));
  }, [second]);

  const reached = !!active && isComplete(active);
  const soft = !!active && softLimitReached(active, now);
  const welcome = needs.length === 1 && needs[0] === 'kicks' && onboardingDay === dateKeyFor(new Date(now));

  const onCount = () => {
    const result = useKicks.getState().tap(Date.now());
    if (result !== 'ignored') timerHaptics.kick();
  };
  const reminder = settings.kickReminder;
  const reminderText = reminder.enabled ? t('kicks.reminderOn', { time: timeOfDay(reminder.hour, reminder.minute, settings.clock24h) }) : t('kicks.reminderOff');
  const size = KICK_BUTTON;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700', flex: 1 }]}>{t('kicks.title')}</AppText>
        <IconButton icon="history" label={t('kicks.history')} onPress={() => router.push('/kicks/history')} />
      </View>

      {!active ? (
        <>
          <AppText style={[type.bodyLarge, { color: colors.textMuted, textAlign: 'center' }]}>{welcome ? t('kicks.startedTip') : t('kicks.tip')}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('kicks.startLabel')}
            onPress={() => useKicks.getState().start(Date.now())}
            style={({ pressed }) => ({ alignSelf: 'center', width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: colors.text, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: spacing.md, opacity: pressed ? 0.85 : 1 })}
          >
            <AppText style={{ fontSize: type.headline.fontSize, fontWeight: '700', color: colors.onPrimary, textAlign: 'center' }}>{t('kicks.start')}</AppText>
          </Pressable>
        </>
      ) : (
        <>
          <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.textMuted, textAlign: 'center' }]}>{reached ? t('kicks.doneTitle', { n: active.taps.length, min: describeMinutes(timeToTarget(active) ?? 0) }) : t('kicks.tapForEach')}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('kicks.countLabel', { n: active.taps.length, target: active.target })}
            disabled={reached}
            onPress={onCount}
            hitSlop={24}
            style={({ pressed }) => ({ alignSelf: 'center', width: size + 20, height: size + 20, borderRadius: (size + 20) / 2, borderWidth: 4, borderColor: colors.text, backgroundColor: reached ? app.active : colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
          >
            <AppText adjustsFontSizeToFit numberOfLines={1} style={{ fontSize: 96, lineHeight: 104, fontWeight: '700', color: reached ? app.onActive : colors.onPrimary, fontVariant: ['tabular-nums'] }}>
              {active.taps.length}
            </AppText>
            <AppText style={[type.bodyLarge, { color: reached ? app.onActive : colors.onPrimary, fontWeight: '600' }]}>{t('kicks.target', { target: active.target })}</AppText>
          </Pressable>
          <AppText style={[type.title, { color: colors.text, textAlign: 'center', fontVariant: ['tabular-nums'] }]}>{t('kicks.elapsed', { time: mmss(elapsedKick(active, now)) })}</AppText>

          {soft ? (
            <View accessibilityLiveRegion="polite" style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: app.alertBg }}>
              <AppText style={[type.bodyLarge, { color: app.alertText, fontWeight: '600' }]}>{t('kicks.softLimit')}</AppText>
            </View>
          ) : null}

          {reached ? (
            <BigButton
              tall
              label={t('kicks.save')}
              onPress={() => {
                const saved = useKicks.getState().finish(Date.now());
                flash(t('kicks.saved'));
                // A count that reached its target is a good moment (ASO.md §7), unless it had run into the 2-hour message.
                if (saved) {
                  const softAt = useMeta.getState().meta.lastKickSoftLimitAt;
                  void recordPositiveMoment('kickTarget', { hitSoftLimit: softAt !== undefined && softAt >= saved.startedAt });
                }
              }}
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <BigButton style={{ flex: 1 }} variant="secondary" label={t('kicks.undo')} disabled={active.taps.length === 0} onPress={() => useKicks.getState().undo()} />
              <BigButton
                style={{ flex: 1 }}
                label={t('kicks.end')}
                accessibilityHint={t('kicks.endLabel')}
                onPress={() => {
                  const saved = useKicks.getState().finish(Date.now());
                  if (saved) flash(t('kicks.saved'));
                }}
              />
            </View>
          )}
        </>
      )}

      {!active ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('kicks.reminderChip', { state: reminderText })}
          onPress={() => setSheet(true)}
          style={{ alignSelf: 'center', minHeight: 56, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{reminderText}</AppText>
        </Pressable>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
      <KickReminderSheet visible={sheet} onClose={() => setSheet(false)} />
    </Screen>
  );
}
