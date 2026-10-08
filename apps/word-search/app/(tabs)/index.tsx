import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { openPuzzle, startLevel } from '@/features/play/navigation';
import { foundCount } from '@/domain/game';
import { getPack, PACKS } from '@/domain/packs';
import { partOfDay } from '@/domain/scoring';
import { useGame } from '@/store/game';
import { trackOf, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { PackCard } from '@/ui/PackCard';
import { Screen } from '@/ui/Screen';

/** Plan §5.1: greeting, the puzzle in progress, and the packs. */
export default function Home() {
  const { colors, spacing, radius, type } = useTheme();
  const current = useGame((s) => s.current);
  const packs = useProgress((s) => s.packs);
  const difficulty = useSettings((s) => s.settings.difficulty);
  const greeting = t(`home.greeting.${partOfDay(new Date().getHours())}`);
  const inProgress = current ? getPack(current.puzzle.packId) : undefined;
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>{greeting}</AppText>
      {current && (
        <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, gap: spacing.sm }}>
          <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{inProgress?.name ?? t('home.continue')}</AppText>
          <AppText style={[type.body, { color: colors.textMuted }]}>
            {t(`difficulty.${current.puzzle.difficulty}`)} · {t('home.progress', { found: foundCount(current), total: current.puzzle.words.length })}
          </AppText>
          <BigButton tall label={t('home.continue')} onPress={() => openPuzzle(current.puzzle.id)} />
        </View>
      )}
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.sm }]}>{t('home.packs')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {PACKS.map((pack) => (
          <PackCard key={pack.id} pack={pack} level={trackOf(packs, pack.id, difficulty).currentLevel} onPress={() => router.push({ pathname: '/packs/[packId]', params: { packId: pack.id } })} />
        ))}
      </View>
    </Screen>
  );
}
