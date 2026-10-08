import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdBanner } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Plant } from '@/components/Plant';
import { beverageIcons } from '@/domain/hydration';
import { moodFor } from '@/domain/plant';
import { parseDayKey } from '@/domain/dayKey';
import { planReminders } from '@/domain/reminderPlan';
import { liveProgress } from '@/domain/streak';
import { formatAmount, percentOf } from '@/domain/units';
import { CupChip } from '@/features/today/CupChip';
import { StreakChip } from '@/features/today/StreakChip';
import { useGoalCelebration } from '@/features/today/useGoalCelebration';
import { shouldOfferGuide } from '@/domain/misses';
import { requestReminderPermission, useNotificationPermission } from '@/notifications/permission';
import { useMeta } from '@/store/meta';
import { useCelebration } from '@/store/celebrations';
import { useFeedback } from '@/store/feedback';
import { preferredCup, useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useDayLogs, useWater } from '@/store/water';
import { extraColorsFor } from '@/theme/tokens';
import { clockTime, dayLabel, spokenVolume, volume } from '@/ui/format';
import { ProgressRing } from '@/ui/ProgressRing';
import { Snackbar } from '@/ui/Snackbar';
import { PrimaryButton, TextButton } from '@/ui/controls';

const UNDO_MS = 5000;
const RING = 248;

export default function Today() {
  const { colors, spacing, radius, type, mode, touchTarget } = useTheme();
  const feedback = useFeedback();
  const settings = useSettings();
  const { goal, reminders, cups, prefs } = settings;
  const today = useToday((s) => s.today);
  const summary = useWater((s) => s.summaries[today]);
  const progress = useWater((s) => s.progress);
  const freezeNotice = useWater((s) => s.freezeNotice);
  const logs = useDayLogs(today);
  const { permission, refresh } = useNotificationPermission();
  const meta = useMeta((s) => s.meta);
  const offerBattery = shouldOfferGuide(meta.suspectedMisses ?? 0, meta.batteryGuideOffered === true);
  useGoalCelebration();

  const unit = goal.unit;
  const effective = summary?.effectiveMl ?? 0;
  const percent = percentOf(effective, goal.goalMl);
  const reached = summary?.reached ?? false;
  const live = liveProgress(progress, reached);
  const mood = moodFor(percent);

  // Tell the user once when a streak freeze was spent while they were away.
  useEffect(() => {
    if (freezeNotice > 0) {
      useWater.getState().dismissFreezeNotice();
      useCelebration.getState().show({ kind: 'freezeUsed', count: freezeNotice });
    }
  }, [freezeNotice]);

  // One-tap logging with an undo that lasts 5 seconds.
  const [undo, setUndo] = useState<{ id: string; label: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const bounce = useSharedValue(1);
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));

  const add = (ml: number) => {
    feedback.tap();
    const { entry } = useWater.getState().logDrink({ volumeMl: ml, source: 'app' });
    bounce.value = withSequence(withTiming(1.08, { duration: 100 }), withSpring(1, { damping: 12 }));
    setUndo({ id: entry.id, label: t('today.added', { amount: volume(ml, unit) }) });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setUndo(null), UNDO_MS);
  };
  const undoLast = () => {
    if (!undo) return;
    useWater.getState().deleteEntry(undo.id);
    feedback.select();
    setUndo(null);
  };

  const next = useMemo(() => {
    if (!reminders.enabled || !permission?.granted) return null;
    const now = new Date();
    const plan = planReminders({
      now,
      reminders,
      goalMl: goal.goalMl,
      cupMl: preferredCup({ cups, prefs }).ml,
      logTimes: logs.map((l) => l.ts),
      todayReached: reached,
    });
    const first = plan[0];
    if (!first) return null;
    const sameDay = first.at.toDateString() === now.toDateString();
    return { text: sameDay ? t('today.nextReminder', { time: clockTime(first.at) }) : t('today.nextReminderTomorrow', { time: clockTime(first.at) }) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, goal.goalMl, cups, prefs.preferredCupId, logs, reached, permission?.granted, today]);

  const note = effective === 0 ? t('today.emptyNote') : percent > 150 ? t('today.overNote') : reached ? t('today.reachedNote') : null;
  const ringLabel = t('today.ringLabel', { amount: spokenVolume(effective, unit), goal: spokenVolume(goal.goalMl, unit), percent });
  const showOffCard = reminders.enabled && permission !== null && !permission.granted;
  const date = parseDayKey(today);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Animated.ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 112, gap: spacing.lg }}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', flex: 1 }]}>
            {dayLabel(date)}
          </Text>
          <StreakChip streak={live.streak} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('today.settings')}
            onPress={() => router.push('/settings')}
            style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="cog-outline" size={26} color={colors.text} />
          </Pressable>
        </View>

        {showOffCard && (
          <View
            style={{
              backgroundColor: extraColorsFor(mode).warning + '26',
              borderRadius: radius.md,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('today.remindersOff')}</Text>
            <Text style={[type.body, { color: colors.text }]}>{t('today.remindersOffBody')}</Text>
            <PrimaryButton
              label={permission.canAskAgain ? t('today.turnOn') : t('today.openSettings')}
              onPress={() => void requestReminderPermission().then(refresh)}
            />
          </View>
        )}

        {offerBattery && !showOffCard && (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }}>
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('today.lateTitle')}</Text>
            <Text style={[type.body, { color: colors.text }]}>{t('today.lateBody')}</Text>
            <PrimaryButton
              label={t('today.lateShow')}
              onPress={() => {
                useMeta.getState().update({ batteryGuideOffered: true });
                router.push('/settings/battery-guide');
              }}
            />
            <TextButton label={t('today.lateDismiss')} onPress={() => useMeta.getState().update({ batteryGuideOffered: true })} />
          </View>
        )}

        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <ProgressRing fraction={effective / Math.max(1, goal.goalMl)} size={RING} done={reached} label={ringLabel} percent={percent}>
            <Animated.View style={bounceStyle}>
              <Plant stage={live.stage} mood={mood} skin={progress.activeSkin} size={170} />
            </Animated.View>
          </ProgressRing>
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[type.title, { color: colors.text, fontWeight: '800' }]}>
            {t('today.ringText', { amount: formatAmount(effective, unit), goal: formatAmount(goal.goalMl, unit), unit: t(`units.${unit}`) })}
            {' · '}
            {t('today.ringPercent', { percent })}
          </Text>
          {note && (
            <Text accessibilityLiveRegion="polite" style={[type.body, { color: reached ? colors.success : colors.textMuted, fontWeight: '600', textAlign: 'center' }]}>
              {note}
            </Text>
          )}
          {next && <Text style={[type.body, { color: colors.textMuted }]}>{next.text}</Text>}
        </View>

        <AdBanner placement="home_under_ring" />

        <View style={{ gap: spacing.sm }}>
          <Text accessibilityRole="header" style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>
            {t('today.quickAdd')}
          </Text>
          <View style={styles.chips}>
            {cups.slice(0, 4).map((cup) => (
              <CupChip key={cup.id} cup={cup} unit={unit} theme={progress.activeCupTheme} onPress={() => add(cup.ml)} />
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('today.otherLabel')}
              onPress={() => router.push('/log-custom')}
              style={{
                minHeight: 56,
                minWidth: 76,
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceAlt,
                paddingHorizontal: 12,
              }}
            >
              <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t('today.other')}</Text>
            </Pressable>
          </View>
        </View>

        {logs.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>
                {t('today.logTitle')}
              </Text>
              <TextButton label={t('today.seeAll')} onPress={() => router.push('/history')} />
            </View>
            {logs
              .slice(-3)
              .reverse()
              .map((l) => (
                <View
                  key={l.id}
                  accessible
                  accessibilityLabel={t('today.entry', { time: clockTime(new Date(l.ts)), beverage: t(`beverages.${l.beverage}`), amount: spokenVolume(l.volumeMl, unit) })}
                  style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, minHeight: touchTarget }]}
                >
                  <MaterialCommunityIcons name={beverageIcons[l.beverage] as never} size={22} color={colors.primary} />
                  <Text style={[type.body, { color: colors.textMuted, width: 72 }]}>{clockTime(new Date(l.ts))}</Text>
                  <Text style={[type.body, { color: colors.text, flex: 1, fontWeight: '600' }]}>{volume(l.volumeMl, unit)}</Text>
                  {l.effectiveMl !== l.volumeMl && (
                    <Text style={[type.caption, { color: colors.textMuted }]}>{t('today.countsAs', { amount: volume(l.effectiveMl, unit) })}</Text>
                  )}
                </View>
              ))}
          </View>
        )}
      </Animated.ScrollView>
      {undo && (
        <View style={styles.snack}>
          <Snackbar message={undo.label} actionLabel={t('today.undo')} onAction={undoLast} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  snack: { position: 'absolute', left: 16, right: 16, bottom: 16 },
});
