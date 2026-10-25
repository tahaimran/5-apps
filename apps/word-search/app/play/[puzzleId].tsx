import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import EllipsisVertical from 'lucide-react-native/icons/ellipsis-vertical';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import PartyPopper from 'lucide-react-native/icons/party-popper';
import { t } from '@shared/i18n';
import { playSound } from '@shared/sound';
import { useTheme } from '@shared/theme';
import { Button, IconButton, PressableScale, showToast } from '@shared/ui';
import { dailyPuzzle } from '@/domain/daily';
import { foundCount, unfoundWords } from '@/domain/game';
import { wordCells } from '@/domain/generator';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { hintsAvailable, HINT_RING_MS, refreshWallet } from '@/domain/hints';
import { getPack } from '@/domain/packs';
import { levelPuzzle, parsePuzzleId, TUTORIAL_ID, tutorialPuzzle } from '@/domain/puzzles';
import { cellCenter, type Cell } from '@/domain/selection';
import type { Puzzle, SavedGame } from '@/domain/types';
import { CoachFinger, CoachText } from '@/components/CoachMark';
import { ElapsedTimer } from '@/components/ElapsedTimer';
import { BOARD_FRAME, Grid } from '@/components/Grid';
import { HintSheet } from '@/components/HintSheet';
import { MenuSheet } from '@/components/MenuSheet';
import { WordList } from '@/components/WordList';
import { markTutorialDone } from '@/features/onboarding/finish';
import { useFeedback } from '@/store/feedback';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useAdScreen } from '@/ads/guard';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { GRID_FONT } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { formatDay } from '@/ui/format';
import { CSS_EASE_OUT, GRID_IN, GRID_IN_MS } from '@/ui/motion';
import { ProgressBar } from '@/ui/ProgressBar';
import { Ribbon } from '@/ui/Ribbon';
import { SkyBackdrop } from '@/ui/SkyBackdrop';
import { useScreenReader } from '@/ui/useScreenReader';

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
  const at = (n: number) => {
    const c = cellCenter({ row: Math.floor(n / game.puzzle.size), col: n % game.puzzle.size }, cellSize);
    return { x: c.x + BOARD_FRAME, y: c.y + BOARD_FRAME };
  };
  return <CoachFinger from={at(span[0])} to={at(span[span.length - 1])} />;
}

/** The gold hint disc with its count badge (plan §5.3); grey-blue badge at zero, where it opens the refill sheet. */
function HintButton({ count, onPress }: { count: number; onPress: () => void }) {
  const { colors, touchTarget, shadow, fonts } = useTheme();
  const { fontScale } = useWindowDimensions();
  const app = useAppColors();
  const hc = useIsHighContrast();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('game.hintButton', { count })}
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.hint, { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, backgroundColor: hc ? colors.background : app.gold, borderColor: app.goldEdge }, hc ? null : shadow(1)]}
    >
      <Lightbulb size={26} color={hc ? colors.primary : app.onGold} strokeWidth={2.5} />
      <View style={[styles.badge, { backgroundColor: count > 0 ? colors.primary : colors.textMuted, borderColor: colors.surface }]}>
        {/* A fixed badge: its number keeps its drawn size at any font scale (the button's label says the count). */}
        <AppText style={{ color: colors.onPrimary, fontSize: 13 / fontScale, lineHeight: 16 / fontScale, fontWeight: '800', fontFamily: fonts.display }}>
          {count}
        </AppText>
      </View>
    </PressableScale>
  );
}

/**
 * The letters under the finger, above the board, so the word being traced can be read without lifting it.
 * Its slot has a fixed height whether or not it shows letters: the board must never move under a finger
 * that is selecting. A long word shrinks to fit one line instead of growing the slot.
 */
function WordBubble({ letters }: { letters: string }) {
  const { colors, radius, spacing, type, shadow } = useTheme();
  const { fontScale } = useWindowDimensions();
  const hc = useIsHighContrast();
  const line = Math.ceil(type.bodyLarge.lineHeight * fontScale);
  return (
    <View style={[styles.bubbleRow, { height: line + 12 }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {letters.length > 0 && (
        <View style={[{ paddingHorizontal: spacing.lg, height: line + 8, maxWidth: '100%', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary }, hc ? null : shadow(1)]}>
          <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={[type.bodyLarge, { fontFamily: GRID_FONT, color: colors.text, fontWeight: '700', letterSpacing: 4 }]}>
            {letters}
          </AppText>
        </View>
      )}
    </View>
  );
}

export default function Play() {
  const { puzzleId: rawId } = useLocalSearchParams<{ puzzleId: string }>();
  const puzzleId = String(rawId);
  useAdScreen('play'); // never an ad on this screen (plan §11)
  const { colors, spacing, type, shadow, mode } = useTheme();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const settings = useSettings((s) => s.settings);
  const feedback = useFeedback();
  const screenReader = useScreenReader();
  const current = useGame((s) => s.current);
  const [failed, setFailed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [sheet, setSheet] = useState<'none' | 'refill' | 'menu'>('none');
  const [ring, setRing] = useState<Cell[]>([]);
  const [letters, setLetters] = useState('');
  const isTutorial = puzzleId === TUTORIAL_ID;
  const [touched, setTouched] = useState(false);
  // A finger on the grid must select letters, not scroll the page (the page only scrolls when it overflows).
  const [gridTouched, setGridTouched] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = useToday((s) => s.today);
  const wallet = useHints((s) => s.wallet);
  const hintsLeft = hintsAvailable(refreshWallet(wallet, today));
  const finishing = useRef(false);
  const mounted = useRef(true);
  const game = current && current.puzzle.id === puzzleId ? current : null;
  const hc = mode === 'high-contrast';

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
        playSound('check');
        if (isTutorial && foundCount(out.game) === 1) showToast({ message: t('tutorial.found'), icon: PartyPopper, tone: 'success', duration: 4000 });
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
  const found = game ? foundCount(game) : 0;
  const total = game?.puzzle.words.length ?? 0;
  const onPreview = useCallback((l: string) => setLetters(l), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <SkyBackdrop />
      <View style={[styles.bar, { minHeight: 64, paddingHorizontal: spacing.sm, gap: spacing.sm }]}>
        <IconButton
          icon={ChevronLeft}
          label={t('game.back')}
          onPress={() => router.back()}
          size={26}
          style={[{ backgroundColor: colors.surface }, hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1)]}
        />
        <View style={styles.flex}>{game ? <Ribbon title={titleOf(game.puzzle)} size="sm" /> : null}</View>
        {game && <HintButton count={hintsLeft} onPress={onHint} />}
        {game && (
          <IconButton
            icon={EllipsisVertical}
            label={t('game.menu')}
            onPress={() => setSheet('menu')}
            size={26}
            style={[{ backgroundColor: colors.surface }, hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1)]}
          />
        )}
      </View>
      {failed ? (
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('game.loadError')}</AppText>
          <Button label={t('packs.backToPacks')} onPress={() => router.replace('/(tabs)')} />
        </View>
      ) : !game ? (
        <View accessible accessibilityLabel={t('game.loading')} style={{ alignSelf: 'center', width: width - 20, height: width - 20, backgroundColor: colors.surfaceAlt, borderRadius: 20, marginTop: spacing.md }} />
      ) : (
        <ScrollView style={styles.clip} scrollEnabled={!gridTouched} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: spacing.sm, paddingBottom: spacing.lg, gap: spacing.sm }}>
          <View style={[styles.progress, { columnGap: spacing.md, rowGap: spacing.xs, paddingHorizontal: spacing.sm }]}>
            {/* The bar takes what is left of the line, and gets a line of its own when the text is large. */}
            <View style={styles.bar100}>
              <ProgressBar progress={total ? found / total : 0} />
            </View>
            <AppText style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t('game.foundProgress', { found, total })}</AppText>
            {settings.showTimer && <ElapsedTimer />}
          </View>
          <WordBubble letters={letters} />
          <Animated.View
            onTouchStart={() => setGridTouched(true)}
            onTouchEnd={() => setGridTouched(false)}
            onTouchCancel={() => setGridTouched(false)}
            style={reduced ? null : { animationName: GRID_IN, animationDuration: GRID_IN_MS, animationTimingFunction: CSS_EASE_OUT }}
          >
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
              onPreview={onPreview}
              hintCells={ring}
            />
            {isTutorial && !touched && found === 0 && <TutorialFinger game={game} cellSize={cellSize} />}
          </Animated.View>
          {/* Under the board, so the board does not move when the card goes away at the first touch. */}
          {isTutorial && !touched && found === 0 && <CoachText />}
          {isTutorial && canSkip && <Button variant="ghost" label={t('tutorial.skip')} onPress={skipTutorial} />}
          <View style={[styles.stretch, { paddingHorizontal: spacing.xs }]}>
            <WordList words={game.puzzle.words} textSize={settings.textSize} />
          </View>
        </ScrollView>
      )}
      <HintSheet visible={sheet === 'refill'} onClose={() => setSheet('none')} />
      <MenuSheet visible={sheet === 'menu'} onClose={() => setSheet('none')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  bar: { flexDirection: 'row', alignItems: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', flexWrap: 'wrap', justifyContent: 'flex-end' },
  bar100: { flexGrow: 1, flexBasis: 120 },
  stretch: { alignSelf: 'stretch' },
  bubbleRow: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  hint: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2 },
});
