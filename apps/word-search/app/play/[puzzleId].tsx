import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { unfoundWords } from '@/domain/game';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { getPack } from '@/domain/packs';
import { levelPuzzle, parsePuzzleId } from '@/domain/puzzles';
import type { Cell } from '@/domain/selection';
import type { Puzzle } from '@/domain/types';
import { Grid } from '@/components/Grid';
import { WordList } from '@/components/WordList';
import { useFeedback } from '@/store/feedback';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { useScreenReader } from '@/ui/useScreenReader';

/** Plan §5.3: the celebration beat before the Complete screen. */
export const CELEBRATION_MS = 600;

const titleOf = (puzzle: Puzzle): string => {
  const parsed = parsePuzzleId(puzzle.id);
  const pack = getPack(puzzle.packId)?.name ?? '';
  return parsed?.kind === 'level' ? t('game.title', { pack, level: parsed.level ?? 1 }) : pack;
};

/** Builds the puzzle behind an id for this screen size; throws for an id that is not a puzzle. */
function buildPuzzle(id: string, textSize: Parameters<typeof effectiveGridSize>[1], width: number): Puzzle {
  const parsed = parsePuzzleId(id);
  if (parsed?.kind === 'level' && parsed.packId && parsed.difficulty && parsed.level) {
    return levelPuzzle(parsed.packId, parsed.difficulty, parsed.level, effectiveGridSize(parsed.difficulty, textSize, width));
  }
  throw new Error(`Cannot build ${id}`);
}

export default function Play() {
  const { puzzleId: rawId } = useLocalSearchParams<{ puzzleId: string }>();
  const puzzleId = String(rawId);
  const { colors, spacing, type, touchTarget } = useTheme();
  const { width } = useWindowDimensions();
  const settings = useSettings((s) => s.settings);
  const feedback = useFeedback();
  const screenReader = useScreenReader();
  const current = useGame((s) => s.current);
  const [failed, setFailed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const finishing = useRef(false);
  const mounted = useRef(true);
  const game = current && current.puzzle.id === puzzleId ? current : null;

  // Resume the saved puzzle, or build a new one after the placeholder has painted.
  useEffect(() => {
    finishing.current = false;
    if (useGame.getState().resume(puzzleId)) return;
    const timer = setTimeout(() => {
      try {
        useGame.getState().begin(buildPuzzle(puzzleId, useSettings.getState().settings.textSize, width));
      } catch {
        setFailed(true);
      }
    }, 0);
    return () => clearTimeout(timer);
    // The puzzle is built once per screen; text size changes later only re-draw the letters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Autosave when the app leaves the foreground or the screen closes (plan §9 write strategy).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useGame.getState().resume(puzzleId);
      else useGame.getState().pause();
    });
    return () => {
      sub.remove();
      useGame.getState().pause();
    };
  }, [puzzleId]);

  const onSelect = useCallback(
    (cells: Cell[]) => {
      const out = useGame.getState().select(cells);
      if (!out || out.result.kind !== 'found') return; // a wrong selection just fades: no buzz, no red
      const left = unfoundWords(out.game).length;
      AccessibilityInfo.announceForAccessibility(t('game.foundAnnounce', { word: out.result.word.word, count: left }));
      if (!out.complete) {
        feedback.success();
        return;
      }
      feedback.complete();
      if (finishing.current) return;
      finishing.current = true;
      setCelebrating(true);
      setTimeout(() => {
        const result = useGame.getState().finish();
        // Leaving during the celebration still records the finished puzzle, but does not navigate.
        if (result && mounted.current) router.replace({ pathname: '/complete/[puzzleId]', params: { puzzleId: result.puzzleId } });
      }, CELEBRATION_MS);
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
          {game ? titleOf(game.puzzle) : ''}
        </AppText>
      </View>
      {failed ? (
        <AppText style={[type.bodyLarge, { color: colors.text, padding: spacing.lg }]}>{t('game.loadError')}</AppText>
      ) : !game ? (
        <View accessible accessibilityLabel={t('game.loading')} style={{ alignSelf: 'center', width: width - 32, height: width - 32, backgroundColor: colors.surfaceAlt, borderRadius: 12, marginTop: spacing.md }} />
      ) : (
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: spacing.lg, gap: spacing.lg }}>
          <Grid
            game={game}
            cellSize={cellSize}
            textSize={settings.textSize}
            mode={settings.selectionMode}
            screenReader={screenReader}
            onSelect={celebrating ? () => undefined : onSelect}
            onSelectionStart={feedback.select}
          />
          <View style={{ alignSelf: 'stretch' }}>
            <WordList words={game.puzzle.words} textSize={settings.textSize} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ bar: { flexDirection: 'row', alignItems: 'center' } });
