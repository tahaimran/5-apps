import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { showInterstitial } from '@shared/ads';
import { useAdScreen } from '@/ads/guard';
import { replaceWithPuzzle } from '@/features/play/navigation';
import { DEFAULT_PACK, getPack } from '@/domain/packs';
import { levelPuzzleId } from '@/domain/puzzles';
import { dailyPackId } from '@/domain/daily';
import { addDays } from '@/domain/dateKey';
import type { CompletedResult } from '@/domain/types';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { StarRow } from '@/ui/StarRow';

/** `m:ss` for the optional timer. */
export const formatElapsed = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Where "Next puzzle" goes: the next level of the pack at the same difficulty. */
export const nextPuzzleId = (r: CompletedResult): string | null =>
  r.level !== undefined ? levelPuzzleId(r.packId, r.difficulty, r.level + 1) : null;

/** Plan §5.4: "Well done!", stars, words found, and the next step. A modal, so Back returns to where the puzzle was started. */
export default function Complete() {
  const result = useResult((s) => s.last);
  useAdScreen('complete');
  const showTimer = useSettings((s) => s.settings.showTimer);
  const difficulty = useSettings((s) => s.settings.difficulty);
  const { colors, spacing, type } = useTheme();
  if (!result) return <Redirect href="/(tabs)" />;
  const next = result.isTutorial ? levelPuzzleId(DEFAULT_PACK, difficulty, 1) : nextPuzzleId(result);
  const pack = getPack(result.packId)?.name ?? '';
  // The interstitial slot of plan §11: after "Next puzzle" is tapped, before the next puzzle loads.
  // The app rules and @shared/ads decide; if no ad is ready it is skipped at once, never waited for.
  const goNext = async (id: string) => {
    if (!result.isTutorial) await showInterstitial('level_complete').catch(() => false);
    replaceWithPuzzle(id);
  };
  const leave = () => router.replace('/(tabs)');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <AppText accessibilityRole="header" style={[type.display, { color: colors.text, fontWeight: '700', textAlign: 'center' }]}>
          {result.isTutorial ? t('tutorial.wonderful') : t('complete.title')}
        </AppText>
        {!result.isTutorial && <StarRow stars={result.stars} size={48} />}
        {!result.isTutorial && (
          <AppText style={[type.bodyLarge, { color: colors.textMuted, textAlign: 'center' }]}>
            {t('complete.words', { count: result.wordsFound })}
            {result.level !== undefined ? ` · ${t('game.title', { pack, level: result.level })}` : ''}
          </AppText>
        )}
        {result.isDaily && result.streakCounted && result.streak !== undefined && (
          <View accessible accessibilityLabel={t('complete.streak', { count: result.streak })} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <MaterialCommunityIcons name="fire" size={40} color={colors.accent} />
            <AppText style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('complete.streak', { count: result.streak })}</AppText>
          </View>
        )}
        {result.isDaily && result.streakCounted === false && (
          <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>{t('complete.catchUpNote')}</AppText>
        )}
        {result.isDaily && result.streakCounted && (
          <>
            <AppText style={[type.bodyLarge, { color: colors.text, textAlign: 'center' }]}>{t('complete.comeBack')}</AppText>
            <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
              {t('daily.tomorrow', { theme: getPack(dailyPackId(addDays(result.dateKey ?? '', 1)))?.name ?? '' })}
            </AppText>
          </>
        )}
        {showTimer && <AppText style={[type.body, { color: colors.textMuted }]}>{t('complete.time', { time: formatElapsed(result.elapsedMs) })}</AppText>}
      </View>
      <View style={{ gap: spacing.md, marginTop: spacing.xl * 2 }}>
        {next ? (
          <>
            <BigButton tall label={result.isTutorial ? t('tutorial.next') : t('complete.next')} onPress={() => void goNext(next)} />
            <BigButton variant="secondary" label={result.isTutorial ? t('complete.home') : t('complete.backToPacks')} onPress={leave} />
          </>
        ) : (
          <BigButton tall label={t('complete.home')} onPress={leave} />
        )}
      </View>
    </SafeAreaView>
  );
}
