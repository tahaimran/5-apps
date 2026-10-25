import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Flame from 'lucide-react-native/icons/flame';
import History from 'lucide-react-native/icons/rotate-ccw';
import Play from 'lucide-react-native/icons/play';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Trophy from 'lucide-react-native/icons/trophy';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Calendar } from '@/components/Calendar';
import { catchUpDays, dailyPackId } from '@/domain/daily';
import { monthKeyOf, shiftMonth } from '@/domain/dateKey';
import { getPack } from '@/domain/packs';
import { dailyIdToOpen, todayStatus } from '@/features/daily/status';
import { SceneArt } from '@/features/packs/PackArt';
import { startPuzzle } from '@/features/play/navigation';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useAdScreen } from '@/ads/guard';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { GameButton } from '@/ui/GameButton';
import { formatDay, formatLongDay } from '@/ui/format';
import { DayStatus } from '@/ui/DayStatus';
import { Screen } from '@/ui/Screen';
import { NavRow, SettingsGroup, StatTile } from '@/ui/SettingsRow';

/** Plan §5.5: today's puzzle, the streak, the month, and past days to catch up on. */
export default function DailyTab() {
  const { colors, spacing, radius, type, shadow } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  useAdScreen('daily');
  const today = useToday((s) => s.today);
  const daily = useDaily((s) => s.daily);
  const current = useGame((s) => s.current);
  const difficulty = useSettings((s) => s.settings.difficulty);
  const [month, setMonth] = useState(monthKeyOf(today));
  const status = todayStatus(daily, current, today);
  const theme = getPack(dailyPackId(today))?.name ?? '';
  const streak = useDaily.getState().streakOn(today);
  const missed = catchUpDays(daily, today);
  return (
    <Screen title={t('daily.title')} footer={<BannerSlot placement="packs_banner" />}>
      <View
        style={[
          { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
          hc ? { borderWidth: 3, borderColor: colors.primary } : shadow(2),
        ]}
      >
        <View style={[styles.row, { gap: spacing.md }]}>
          <SceneArt scene="calendar" px={80} />
          <View style={styles.flex}>
            <AppText style={[type.title, { color: colors.text, fontWeight: '800' }]}>{formatLongDay(today)}</AppText>
            <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('daily.theme', { theme })}</AppText>
          </View>
        </View>
        <DayStatus status={status} />
        {status === 'done' ? (
          <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('daily.comeBack')}</AppText>
        ) : (
          <GameButton icon={Play} label={status === 'inProgress' ? t('daily.continue') : t('daily.play')} onPress={() => startPuzzle(dailyIdToOpen(current, today, difficulty))} />
        )}
      </View>

      <View style={[styles.tiles, { gap: spacing.md }]}>
        <StatTile icon={Flame} tint={app.flame} bg={hc ? colors.background : colors.surfaceAlt} label={t('daily.streak')} value={t('daily.days', { count: streak })} />
        <StatTile icon={Trophy} tint={app.goldEdge} bg={hc ? colors.background : colors.surfaceAlt} label={t('daily.best')} value={t('daily.days', { count: daily.bestStreak })} />
      </View>
      {daily.freezes > 0 && (
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Snowflake size={22} color={colors.primary} strokeWidth={2.4} />
          <AppText style={[type.body, styles.flex, { color: colors.text }]}>{t('daily.freezes', { count: daily.freezes })}</AppText>
        </View>
      )}

      <Calendar monthKey={month} daily={daily} today={today} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />

      {missed.length > 0 && (
        <SettingsGroup title={t('daily.catchUp')}>
          {missed.map((key) => (
            <NavRow key={key} icon={History} label={formatDay(key)} accessibilityLabel={t('daily.catchUpLabel', { date: formatDay(key) })} onPress={() => startPuzzle(dailyIdToOpen(current, key, difficulty))} />
          ))}
        </SettingsGroup>
      )}
      {missed.length > 0 && <AppText style={[type.body, { color: colors.textMuted }]}>{t('daily.catchUpNote')}</AppText>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap' },
});
