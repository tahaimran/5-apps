import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Calendar } from '@/components/Calendar';
import { dailyPackId, catchUpDays } from '@/domain/daily';
import { monthKeyOf, shiftMonth } from '@/domain/dateKey';
import { getPack } from '@/domain/packs';
import { dailyIdToOpen, todayStatus } from '@/features/daily/status';
import { startPuzzle } from '@/features/play/navigation';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { formatDay, formatLongDay } from '@/ui/format';
import { Screen } from '@/ui/Screen';

/** Plan §5.5: today's puzzle, the month, the streak, and past days to catch up on. */
export default function DailyTab() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const today = useToday((s) => s.today);
  const daily = useDaily((s) => s.daily);
  const current = useGame((s) => s.current);
  const difficulty = useSettings((s) => s.settings.difficulty);
  const [month, setMonth] = useState(monthKeyOf(today));
  const status = todayStatus(daily, current, today);
  const theme = getPack(dailyPackId(today))?.name ?? '';
  const streak = useDaily.getState().streakOn(today);
  const missed = catchUpDays(daily, today);
  const nav = (delta: number, label: string, icon: 'chevron-left' | 'chevron-right') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => setMonth(shiftMonth(month, delta))}
      style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' }}
    >
      <MaterialCommunityIcons name={icon} size={30} color={colors.text} />
    </Pressable>
  );
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>{t('daily.title')}</AppText>
      <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, gap: spacing.sm }}>
        <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{formatLongDay(today)}</AppText>
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('daily.theme', { theme })}</AppText>
        <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t(`daily.status.${status}`)}</AppText>
        {status === 'done' ? (
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('daily.comeBack')}</AppText>
        ) : (
          <BigButton tall label={status === 'inProgress' ? t('daily.continue') : t('daily.play')} onPress={() => startPuzzle(dailyIdToOpen(current, today, difficulty))} />
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <AppText style={[type.caption, { color: colors.textMuted }]}>{t('daily.streak')}</AppText>
          <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('daily.days', { count: streak })}</AppText>
        </View>
        <View style={{ flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <AppText style={[type.caption, { color: colors.textMuted }]}>{t('daily.best')}</AppText>
          <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('daily.days', { count: daily.bestStreak })}</AppText>
        </View>
      </View>
      {daily.freezes > 0 && <AppText style={[type.body, { color: colors.textMuted }]}>{t('daily.freezes', { count: daily.freezes })}</AppText>}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {nav(-1, t('daily.prevMonth'), 'chevron-left')}
        {nav(1, t('daily.nextMonth'), 'chevron-right')}
      </View>
      <Calendar monthKey={month} daily={daily} today={today} />

      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>{t('daily.catchUp')}</AppText>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('daily.catchUpNote')}</AppText>
      {missed.map((key) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={t('daily.catchUpLabel', { date: formatDay(key) })}
          onPress={() => startPuzzle(dailyIdToOpen(current, key, difficulty))}
          style={{ minHeight: touchTarget + 8, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
        >
          <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{formatDay(key)}</AppText>
          <AppText style={[type.body, { color: colors.primary, fontWeight: '700' }]}>{t('daily.catchUpAction')}</AppText>
        </Pressable>
      ))}
    </Screen>
  );
}
