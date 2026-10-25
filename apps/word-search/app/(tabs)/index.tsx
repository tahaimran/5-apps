import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Play from 'lucide-react-native/icons/play';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { dailyIdToOpen, todayStatus } from '@/features/daily/status';
import { openPuzzle, startPuzzle } from '@/features/play/navigation';
import { packStars, totalStars } from '@/features/home/stars';
import { PackTile, SceneArt } from '@/features/packs/PackArt';
import { dailyPackId } from '@/domain/daily';
import { foundCount } from '@/domain/game';
import { getPack, PACKS } from '@/domain/packs';
import { parsePuzzleId } from '@/domain/puzzles';
import { partOfDay } from '@/domain/scoring';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { trackOf, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useAdScreen } from '@/ads/guard';
import { useIsHighContrast } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { HudChip, StreakChip } from '@/ui/Chip';
import { GameButton } from '@/ui/GameButton';
import { PackCard } from '@/ui/PackCard';
import { ProgressBar } from '@/ui/ProgressBar';
import { Ribbon } from '@/ui/Ribbon';
import { formatLongDay } from '@/ui/format';
import { DayStatus } from '@/ui/DayStatus';
import { Screen } from '@/ui/Screen';
import { SkyBackdrop } from '@/ui/SkyBackdrop';
import { StarShape } from '@/ui/StarRow';

/** A white card on the sky (an outlined black one in high contrast). */
function SkyCard({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  const { colors, radius, spacing, shadow } = useTheme();
  const hc = useIsHighContrast();
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
        hc ? { borderWidth: highlight ? 3 : 2, borderColor: highlight ? colors.primary : colors.border } : [shadow(2), highlight ? { borderWidth: 2, borderColor: colors.primary } : null],
      ]}
    >
      {children}
    </View>
  );
}

/** Plan §5.1: a greeting with the streak and stars, the puzzle in progress, today's puzzle, and the packs. */
export default function Home() {
  const { colors, spacing, radius, type } = useTheme();
  useAdScreen('home');
  const current = useGame((s) => s.current);
  const packs = useProgress((s) => s.packs);
  const difficulty = useSettings((s) => s.settings.difficulty);
  const today = useToday((s) => s.today);
  const daily = useDaily((s) => s.daily);
  const status = todayStatus(daily, current, today);
  const streak = useDaily.getState().streakOn(today);
  const stars = totalStars(packs, daily);
  const greeting = t(`home.greeting.${partOfDay(new Date().getHours())}`);
  const inProgress = current ? getPack(current.puzzle.packId) : undefined;
  const parsed = current ? parsePuzzleId(current.puzzle.id) : null;
  const todayPack = dailyPackId(today);
  const found = current ? foundCount(current) : 0;
  const total = current?.puzzle.words.length ?? 0;
  return (
    <Screen backdrop={<SkyBackdrop scene="home" />} footer={<BannerSlot placement="home_banner" />}>
      <View style={[styles.header, { gap: spacing.sm }]}>
        {/* Grows, but wraps the chips onto the next line rather than squeezing the greeting. */}
        <View style={styles.greeting}>
          <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>
            {greeting}
          </AppText>
          <AppText style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{formatLongDay(today)}</AppText>
        </View>
        <View style={[styles.chips, { gap: spacing.sm }]}>
          <StreakChip streak={streak} />
          {stars > 0 && <HudChip art={<StarShape size={22} filled />} value={String(stars)} label={t('home.starsLabel', { count: stars })} />}
        </View>
      </View>

      {current && (
        <SkyCard highlight>
          <View style={[styles.row, { gap: spacing.md }]}>
            {inProgress && <PackTile packId={inProgress.id} px={64} radius={radius.md} />}
            <View style={styles.flex}>
              <AppText style={[type.caption, { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }]}>{t('home.continueLabel')}</AppText>
              <AppText style={[type.title, { color: colors.text, fontWeight: '800' }]}>
                {parsed?.kind === 'daily' ? t('home.today') : inProgress?.name ?? t('home.continue')}
              </AppText>
              <AppText style={[type.body, { color: colors.textMuted }]}>
                {parsed?.kind === 'level' && parsed.level ? `${t(`difficulty.${current.puzzle.difficulty}`)} · ${t('packs.level', { level: parsed.level })}` : t(`difficulty.${current.puzzle.difficulty}`)}
              </AppText>
            </View>
          </View>
          <View style={{ gap: spacing.xs }}>
            <ProgressBar progress={total ? found / total : 0} />
            <AppText style={[type.body, { color: colors.text, fontWeight: '600' }]}>{t('home.progress', { found, total })}</AppText>
          </View>
          <GameButton label={t('home.continue')} icon={Play} onPress={() => openPuzzle(current.puzzle.id)} />
        </SkyCard>
      )}

      <SkyCard highlight={!current && status !== 'done'}>
        <View style={[styles.row, { gap: spacing.md }]}>
          <SceneArt scene="calendar" px={64} />
          <View style={styles.flex}>
            <AppText style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t('home.today')}</AppText>
            <AppText style={[type.body, { color: colors.textMuted }]}>{t('home.todayTheme', { theme: getPack(todayPack)?.name ?? '' })}</AppText>
          </View>
        </View>
        <DayStatus status={status} />
        {status !== 'done' && (
          <GameButton
            variant={current ? 'plain' : 'go'}
            label={status === 'inProgress' ? t('home.continueToday') : t('home.playToday')}
            onPress={() => startPuzzle(dailyIdToOpen(current, today, difficulty))}
          />
        )}
      </SkyCard>

      <View style={{ marginTop: spacing.sm }}>
        <Ribbon title={t('home.packs')} />
      </View>
      <View style={[styles.grid, { gap: spacing.md }]}>
        {PACKS.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            level={trackOf(packs, pack.id, difficulty).currentLevel}
            stars={packStars(packs[pack.id])}
            onPress={() => router.push({ pathname: '/packs/[packId]', params: { packId: pack.id } })}
          />
        ))}
      </View>
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  greeting: { flexGrow: 1, flexBasis: 220 },
  header: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', paddingTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
