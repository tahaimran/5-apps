import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BatteryWarning from 'lucide-react-native/icons/battery-warning';
import BellOff from 'lucide-react-native/icons/bell-off';
import Droplet from 'lucide-react-native/icons/droplet';
import Settings from 'lucide-react-native/icons/settings';
import { AdBanner } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useTimeFormat } from '@shared/time';
import { Card, IconButton, showToast } from '@shared/ui';
import { moodFor } from '@/domain/plant';
import { parseDayKey } from '@/domain/dayKey';
import { planReminders } from '@/domain/reminderPlan';
import { liveProgress } from '@/domain/streak';
import { percentOf } from '@/domain/units';
import { shouldOfferGuide } from '@/domain/misses';
import { DrinkList } from '@/features/today/DrinkList';
import { QuickAdd } from '@/features/today/QuickAdd';
import { TodayHero } from '@/features/today/TodayHero';
import { useGoalCelebration } from '@/features/today/useGoalCelebration';
import { useMinuteTick } from '@/features/today/useMinuteTick';
import { requestReminderPermission, useNotificationPermission } from '@/notifications/permission';
import { useMeta } from '@/store/meta';
import { useCelebration } from '@/store/celebrations';
import { useFeedback } from '@/store/feedback';
import { preferredCup, useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useDayLogs, useWater } from '@/store/water';
import { extraColorsFor } from '@/theme/tokens';
import { dayLabel, volume } from '@/ui/format';
import { IconCircle } from '@/ui/SettingsRow';
import { PrimaryButton, TextButton } from '@/ui/controls';

const UNDO_MS = 5000;
const RECENT = 3;

const greetingKey = (hour: number) => (hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');

export default function Today() {
  const { colors, spacing, type, mode, shadow } = useTheme();
  const feedback = useFeedback();
  const clock = useTimeFormat();
  const { goal, reminders, cups, prefs } = useSettings();
  const today = useToday((s) => s.today);
  const summary = useWater((s) => s.summaries[today]);
  const progress = useWater((s) => s.progress);
  const freezeNotice = useWater((s) => s.freezeNotice);
  const logs = useDayLogs(today);
  const { permission, refresh } = useNotificationPermission();
  const meta = useMeta((s) => s.meta);
  const offerBattery = shouldOfferGuide(meta.suspectedMisses ?? 0, meta.batteryGuideOffered === true);
  useGoalCelebration();
  const tick = useMinuteTick();
  const [added, setAdded] = useState({ count: 0, ml: 0 });

  const unit = goal.unit;
  const effective = summary?.effectiveMl ?? 0;
  const percent = percentOf(effective, goal.goalMl);
  const reached = summary?.reached ?? false;
  const live = liveProgress(progress, reached);
  const mood = moodFor(percent);
  const usual = preferredCup({ cups, prefs });

  // Tell the user once when a streak freeze was spent while they were away.
  useEffect(() => {
    if (freezeNotice > 0) {
      useWater.getState().dismissFreezeNotice();
      useCelebration.getState().show({ kind: 'freezeUsed', count: freezeNotice });
    }
  }, [freezeNotice]);

  /** One-tap logging with an Undo in the toast for 5 seconds. */
  const add = (ml: number) => {
    feedback.add();
    const { entry } = useWater.getState().logDrink({ volumeMl: ml, source: 'app' });
    setAdded((a) => ({ count: a.count + 1, ml }));
    showToast({
      message: t('today.added', { amount: volume(ml, unit) }),
      icon: Droplet,
      duration: UNDO_MS,
      action: {
        label: t('today.undo'),
        onPress: () => {
          useWater.getState().deleteEntry(entry.id);
          feedback.undo();
        },
      },
    });
  };

  const next = useMemo(() => {
    if (!reminders.enabled || !permission?.granted) return null;
    const now = new Date();
    const plan = planReminders({
      now,
      reminders,
      goalMl: goal.goalMl,
      cupMl: usual.ml,
      logTimes: logs.map((l) => l.ts),
      todayReached: reached,
    });
    const first = plan[0];
    if (!first) return null;
    return { at: first.at, tomorrow: first.at.toDateString() !== now.toDateString() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, goal.goalMl, usual.ml, logs, reached, permission?.granted, today, tick]);

  const note = effective === 0 ? t('today.emptyNote') : percent > 150 ? t('today.overNote') : reached ? t('today.reachedNote') : null;
  const showOffCard = reminders.enabled && permission !== null && !permission.granted;
  const date = parseDayKey(today);
  const extra = extraColorsFor(mode);
  const nextTime = next ? clock.at(next.at) : null;
  const recent = logs.slice(-RECENT).reverse();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{dayLabel(date)}</Text>
            <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>
              {t(`today.greeting.${greetingKey(new Date().getHours())}`)}
            </Text>
          </View>
          <IconButton icon={Settings} label={t('today.settings')} onPress={() => router.push('/settings')} style={[{ backgroundColor: colors.surface }, shadow(1)]} />
        </View>

        {showOffCard && (
          <Card style={{ gap: spacing.md }}>
            <View style={styles.cardHead}>
              <IconCircle icon={BellOff} tint={extra.warning} bg={extra.sunSoft} />
              <View style={styles.flex}>
                <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('today.remindersOff')}</Text>
                <Text style={[type.body, { color: colors.textMuted }]}>{t('today.remindersOffBody')}</Text>
              </View>
            </View>
            <PrimaryButton
              label={permission.canAskAgain ? t('today.turnOn') : t('today.openSettings')}
              onPress={() => void requestReminderPermission().then(refresh)}
            />
          </Card>
        )}

        {offerBattery && !showOffCard && (
          <Card style={{ gap: spacing.md }}>
            <View style={styles.cardHead}>
              <IconCircle icon={BatteryWarning} tint={extra.warning} bg={extra.sunSoft} />
              <View style={styles.flex}>
                <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('today.lateTitle')}</Text>
                <Text style={[type.body, { color: colors.textMuted }]}>{t('today.lateBody')}</Text>
              </View>
            </View>
            <PrimaryButton
              label={t('today.lateShow')}
              onPress={() => {
                useMeta.getState().update({ batteryGuideOffered: true });
                router.push('/settings/battery-guide');
              }}
            />
            <TextButton label={t('today.lateDismiss')} onPress={() => useMeta.getState().update({ batteryGuideOffered: true })} />
          </Card>
        )}

        <TodayHero
          effectiveMl={effective}
          goalMl={goal.goalMl}
          unit={unit}
          percent={percent}
          reached={reached}
          mood={mood}
          stage={live.stage}
          skin={progress.activeSkin}
          streak={live.streak}
          nextReminder={nextTime}
          nextIsTomorrow={next?.tomorrow ?? false}
          note={note}
          usualCup={usual}
          addCount={added.count}
          lastAddedMl={added.ml}
          onDrink={() => add(usual.ml)}
          onChooseCup={() => router.push('/settings/cups')}
        />

        <AdBanner placement="home_under_ring" />

        <View style={{ gap: spacing.sm }}>
          <Text accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
            {t('today.quickAdd')}
          </Text>
          <QuickAdd cups={cups} unit={unit} theme={progress.activeCupTheme} onAdd={(cup) => add(cup.ml)} onOther={() => router.push('/log-custom')} />
        </View>

        {(recent.length > 0 || next) && (
          <View style={{ gap: spacing.sm }}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '700' }]}>
                {t('today.logTitle')}
              </Text>
              {logs.length > 0 && <TextButton label={t('today.seeAll')} onPress={() => router.push('/history')} />}
            </View>
            <DrinkList
              entries={recent}
              unit={unit}
              next={nextTime && !next?.tomorrow ? { time: nextTime, ml: usual.ml } : null}
              onEdit={(id) => router.push({ pathname: '/edit-entry/[id]', params: { id } })}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
});
