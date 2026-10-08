import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { applySelection, startGame, unfoundWords } from '@/domain/game';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { getPack } from '@/domain/packs';
import { levelPuzzle, parsePuzzleId } from '@/domain/puzzles';
import type { Cell } from '@/domain/selection';
import type { SavedGame } from '@/domain/types';
import { Grid } from '@/components/Grid';
import { WordList } from '@/components/WordList';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { useScreenReader } from '@/ui/useScreenReader';

const titleOf = (game: SavedGame): string => {
  const parsed = parsePuzzleId(game.puzzle.id);
  const pack = getPack(game.puzzle.packId)?.name ?? '';
  return parsed?.kind === 'level' ? t('game.title', { pack, level: parsed.level ?? 1 }) : pack;
};

export default function Play() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();
  const { colors, spacing, type, touchTarget } = useTheme();
  const { width } = useWindowDimensions();
  const settings = useSettings((s) => s.settings);
  const feedback = useFeedback();
  const screenReader = useScreenReader();
  const [game, setGame] = useState<SavedGame | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const task = setTimeout(() => {
      const parsed = parsePuzzleId(String(puzzleId));
      try {
        if (parsed?.kind !== 'level' || !parsed.packId || !parsed.difficulty || !parsed.level) throw new Error('bad id');
        const size = effectiveGridSize(parsed.difficulty, settings.textSize, width);
        setGame(startGame(levelPuzzle(parsed.packId, parsed.difficulty, parsed.level, size), Date.now()));
      } catch {
        setFailed(true);
      }
    }, 0); // lets the placeholder paint first; InteractionManager is deprecated in this React Native
    return () => clearTimeout(task);
    // The puzzle is built once per screen; text size changes later only re-draw the letters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleId]);

  const onSelect = useCallback(
    (cells: Cell[]) => {
      setGame((current) => {
        if (!current) return current;
        const out = applySelection(current, cells);
        if (out.result.kind === 'found') {
          if (out.complete) feedback.complete();
          else feedback.success();
          const left = unfoundWords(out.game).length;
          AccessibilityInfo.announceForAccessibility(t('game.foundAnnounce', { word: out.result.word.word, count: left }));
        }
        return out.game;
      });
    },
    [feedback],
  );

  const cellSize = game ? cellSizeFor(game.puzzle.size, width) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.bar, { minHeight: 64, paddingHorizontal: spacing.sm, gap: spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('game.back')}
          onPress={() => router.back()}
          style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <AppText accessibilityRole="header" numberOfLines={1} style={[type.title, { color: colors.text, fontWeight: '700', flex: 1 }]}>
          {game ? titleOf(game) : ''}
        </AppText>
      </View>
      {failed ? (
        <AppText style={[type.bodyLarge, { color: colors.text, padding: spacing.lg }]}>{t('game.loadError')}</AppText>
      ) : !game ? (
        <View accessible accessibilityLabel={t('game.loading')} style={{ alignSelf: 'center', width: width - 32, height: width - 32, backgroundColor: colors.surfaceAlt, borderRadius: 12, marginTop: spacing.md }} />
      ) : (
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: spacing.lg, gap: spacing.lg }}>
          <Grid game={game} cellSize={cellSize} textSize={settings.textSize} mode={settings.selectionMode} screenReader={screenReader} onSelect={onSelect} onSelectionStart={feedback.select} />
          <View style={{ alignSelf: 'stretch' }}>
            <WordList words={game.puzzle.words} textSize={settings.textSize} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ bar: { flexDirection: 'row', alignItems: 'center' } });
