import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BigButton } from '@/ui/BigButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { dailyPuzzle } from '@/domain/daily';
import { unfoundWords } from '@/domain/game';
import { hintsAvailable, HINT_RING_MS, refreshWallet } from '@/domain/hints';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { getPack } from '@/domain/packs';
import { levelPuzzle, parsePuzzleId, TUTORIAL_ID, tutorialPuzzle } from '@/domain/puzzles';
import type { Cell } from '@/domain/selection';
import type { Puzzle, SavedGame } from '@/domain/types';
import { CoachFinger, CoachText } from '@/components/CoachMark';
import { ElapsedTimer } from '@/components/ElapsedTimer';
import { Grid } from '@/components/Grid';
import { HintSheet } from '@/components/HintSheet';
import { MenuSheet } from '@/components/MenuSheet';
import { WordList } from '@/components/WordList';
import { useFeedback } from '@/store/feedback';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useToday } from '@/store/today';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { formatDay } from '@/ui/format';
import { Toast } from '@/ui/Toast';
import { useScreenReader } from '@/ui/useScreenReader';
import { useAdScreen } from '@/ads/guard';
import { playSound } from '@/audio/sounds';
import { cellCenter } from '@/domain/selection';
import { wordCells } from '@/domain/generator';
import { foundCount } from '@/domain/game';
import { markTutorialDone } from '@/features/onboarding/finish';

/** Plan §5.3: the celebration beat before the Complete screen. */
export const CELEBRATION_MS = 600;
/** Plan §6: "Skip tutorial" appears after 10 seconds. */
export const TUTORIAL_SKIP_MS = 10_000;

const titleOf = (puzzle: Puzzle): string => {
  const parsed = parsePuzzleId(puzzle.id);
  const pack = getPack(puzzle.packId)?.name ?? '';
  if (parsed?.kind === 'level') return t('game.title', { pack, level: parsed.level ?? 1 });
  if (parsed?.kind === 'daily' && parsed.dateKey) return t('game.dailyTitle', { date: formatDay(parsed.dateKey) });
  if (parsed?.kind === 'tutorial') return t('game.tutorialTitle');
  return pack;
};

/** Builds the puzzle behind an id for this screen size; throws for an id that is not a puzzle. */
function buildPuzzle(id: string, textSize: Parameters<typeof effectiveGridSize>[1], width: number): Puzzle {
  const parsed = parsePuzzleId(id);
  if (parsed?.kind === 'level' && parsed.packId && parsed.difficulty && parsed.level) {
    return levelPuzzle(parsed.packId, parsed.difficulty, parsed.level, effectiveGridSize(parsed.difficulty, textSize, width));
  }
  if (parsed?.kind === 'daily' && parsed.dateKey && parsed.difficulty) {
    return dailyPuzzle(parsed.dateKey, parsed.difficulty, effectiveGridSize(parsed.difficulty, textSize, width));
  }
  if (parsed?.kind === 'tutorial') return tutorialPuzzle();
  throw new Error(`Cannot build ${id}`);
}

/** The finger of the tutorial slides along CAT (plan §6 screen 5). */
function TutorialFinger({ game, cellSize }: { game: SavedGame; cellSize: number }) {
  const cat = game.puzzle.words.find((w) => w.word === 'CAT');
  if (!cat) return null;
  const span = wordCells(cat, game.puzzle.size);
  const at = (n: number) => cellCenter({ row: Math.floor(n / game.puzzle.size), col: n % game.puzzle.size }, cellSize);
  return <CoachFinger from={at(span[0])} to={at(span[span.length - 1])} />;
}

export default function Play() {
  const { puzzleId: rawId } = useLocalSearchParams<{ puzzleId: string }>();
  const puzzleId = String(rawId);
  useAdScreen('play'); // never an ad on this screen (plan §11)
  const { colors, spacing, type, touchTarget } = useTheme();
  const { width } = useWindowDimensions();
  const settings = useSettings((s) => s.settings);
  const feedback = useFeedback();
  const screenReader = useScreenReader();
  const current = useGame((s) => s.current);
  const [failed, setFailed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [sheet, setSheet] = useState<'none' | 'refill' | 'menu'>('none');
  const [ring, setRing] = useState<Cell[]>([]);
  const isTutorial = puzzleId === TUTORIAL_ID;
  const [touched, setTouched] = useState(false);
  // A finger on the grid must select letters, not scroll the page (the page only scrolls when it overflows).
  const [gridTouched, setGridTouched] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = useToday((s) => s.today);
  const wallet = useHints((s) => s.wallet);
  const hintsLeft = hintsAvailable(refreshWallet(wallet, today));
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
        if (puzzleId === TUTORIAL_ID) useHints.getState().tutorialBonus(); // plan §8.5: the tutorial grants 1 bonus hint
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
        playSound('found');
        if (isTutorial && foundCount(out.game) === 1) setToast(t('tutorial.found'));
        return;
      }
      feedback.complete();
      playSound('complete');
      if (finishing.current) return;
      finishing.current = true;
      setCelebrating(true);
      setTimeout(() => {
        const result = useGame.getState().finish();
        // Leaving during the celebration still records the finished puzzle, but does not navigate.
        if (result && mounted.current) router.replace({ pathname: '/complete/[puzzleId]', params: { puzzleId: result.puzzleId } });
      }, CELEBRATION_MS);
    },
    [feedback, isTutorial],
  );

  useEffect(() => {
    if (!isTutorial) return;
    const timer = setTimeout(() => setCanSkip(true), TUTORIAL_SKIP_MS);
    return () => clearTimeout(timer);
  }, [isTutorial]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(
    () => () => {
      if (ringTimer.current) clearTimeout(ringTimer.current);
    },
    [],
  );

  const onHint = () => {
    if (!game || celebrating) return;
    if (useHints.getState().available() <= 0) {
      setSheet('refill');
      return;
    }
    const out = useGame.getState().hint();
    if (!out) return;
    useHints.getState().spend();
    feedback.tap();
    setRing(out.cells);
    AccessibilityInfo.announceForAccessibility(
      out.level === 2
        ? t('game.hintAnnounceEnds', { first: `${out.cells[0].row + 1}, ${out.cells[0].col + 1}`, last: `${out.cells[1].row + 1}, ${out.cells[1].col + 1}` })
        : t('game.hintAnnounce', { row: out.cells[0].row + 1, col: out.cells[0].col + 1 }),
    );
    if (ringTimer.current) clearTimeout(ringTimer.current);
    ringTimer.current = setTimeout(() => setRing([]), HINT_RING_MS);
  };

  const skipTutorial = () => {
    useGame.getState().discard();
    markTutorialDone();
    router.replace('/(tabs)');
  };

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
        {game && settings.showTimer && <ElapsedTimer />}
        {game && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('game.hintButton', { count: hintsLeft })}
            onPress={onHint}
            style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="lightbulb-on-outline" size={28} color={colors.accent} />
            <View style={[styles.badge, { backgroundColor: hintsLeft > 0 ? colors.primary : colors.textMuted }]}>
              <AppText style={{ color: colors.onPrimary, fontSize: 13, lineHeight: 16, fontWeight: '700' }}>{hintsLeft}</AppText>
            </View>
          </Pressable>
        )}
        {game && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('game.menu')}
            onPress={() => setSheet('menu')}
            style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={28} color={colors.text} />
          </Pressable>
        )}
      </View>
      {failed ? (
        <AppText style={[type.bodyLarge, { color: colors.text, padding: spacing.lg }]}>{t('game.loadError')}</AppText>
      ) : !game ? (
        <View accessible accessibilityLabel={t('game.loading')} style={{ alignSelf: 'center', width: width - 32, height: width - 32, backgroundColor: colors.surfaceAlt, borderRadius: 12, marginTop: spacing.md }} />
      ) : (
        <ScrollView scrollEnabled={!gridTouched} contentContainerStyle={{ alignItems: 'center', padding: spacing.lg, gap: spacing.lg }}>
          {isTutorial && !touched && foundCount(game) === 0 && <CoachText />}
          <View onTouchStart={() => setGridTouched(true)} onTouchEnd={() => setGridTouched(false)} onTouchCancel={() => setGridTouched(false)}>
          <Grid
            game={game}
            cellSize={cellSize}
            textSize={settings.textSize}
            mode={settings.selectionMode}
            screenReader={screenReader}
            onSelect={celebrating ? () => undefined : onSelect}
            onSelectionStart={() => {
              setTouched(true);
              feedback.select();
            }}
            hintCells={ring}
          />
          {isTutorial && !touched && foundCount(game) === 0 && <TutorialFinger game={game} cellSize={cellSize} />}
          </View>
          {toast && <View style={{ alignSelf: 'stretch' }}><Toast message={toast} /></View>}
          {isTutorial && canSkip && <BigButton variant="secondary" label={t('tutorial.skip')} onPress={skipTutorial} />}
          <View style={{ alignSelf: 'stretch' }}>
            <WordList words={game.puzzle.words} textSize={settings.textSize} />
          </View>
        </ScrollView>
      )}
      <HintSheet visible={sheet === 'refill'} onClose={() => setSheet('none')} />
      <MenuSheet visible={sheet === 'menu'} onClose={() => setSheet('none')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  badge: { position: 'absolute', top: 6, right: 4, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
