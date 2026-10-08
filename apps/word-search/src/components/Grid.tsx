import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { DIRECTIONS_BY_DIFFICULTY } from '@/domain/directions';
import { wordCells } from '@/domain/generator';
import { cellAt, cellCenter, lineBetween, projectEnd, sameCell, snapDirection, type Cell } from '@/domain/selection';
import type { SavedGame, SelectionMode, TextSize } from '@/domain/types';
import { gameColors, textScale } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

const AnimatedLine = Animated.createAnimatedComponent(Line);

export interface GridProps {
  game: SavedGame;
  cellSize: number;
  textSize: TextSize;
  mode: SelectionMode;
  /** TalkBack is on: cells become labelled buttons and the drag gesture is off (plan §7.5). */
  screenReader: boolean;
  /** Called with the selected line when a drag or a tap-tap finishes. */
  onSelect: (cells: Cell[]) => void;
  /** A selection just started (a haptic tick). */
  onSelectionStart?: () => void;
  /** Cells of words that are being hinted: ringed. */
  hintCells?: readonly Cell[];
}

/** The stroke that appears when a word is found; draws itself in unless Reduce Motion is on. */
function FoundStroke({ x1, y1, x2, y2, stroke, width, opacity, animate }: { x1: number; y1: number; x2: number; y2: number; stroke: string; width: number; opacity: number; animate: boolean }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(animate && !reduced ? 0 : 1);
  useEffect(() => {
    if (animate && !reduced) progress.value = withTiming(1, { duration: 260 });
  }, [animate, reduced, progress]);
  const animatedProps = useAnimatedProps(() => ({ x2: x1 + (x2 - x1) * progress.value, y2: y1 + (y2 - y1) * progress.value }));
  return (
    <AnimatedLine
      animatedProps={animatedProps}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

/**
 * The letter grid (plan §5.3, §8.4): one gesture surface over the whole grid, not one per cell.
 * Letters are drawn in views, strokes in a single SVG underneath. Drag snaps to the directions the
 * difficulty allows; tap-first-tap-last works everywhere; with TalkBack on, every cell is a labelled button.
 */
export function Grid({ game, cellSize, textSize, mode, screenReader, onSelect, onSelectionStart, hintCells = [] }: GridProps) {
  const { colors, mode: themeMode } = useTheme();
  const g = gameColors[themeMode];
  const { puzzle } = game;
  const { size } = puzzle;
  const extent = cellSize * size;
  const allowed = DIRECTIONS_BY_DIFFICULTY[puzzle.difficulty];
  const [selection, setSelection] = useState<Cell[]>([]);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const startRef = useRef<Cell | null>(null);
  const selectionRef = useRef<Cell[]>([]);
  const select = (cells: Cell[]) => {
    selectionRef.current = cells;
    setSelection(cells);
  };

  // Words found while this grid is on screen draw themselves in; words found earlier (a resumed puzzle) just appear.
  const foundOnMount = useRef(new Set(puzzle.words.filter((w) => w.found).map((w) => w.word)));

  const foundCells = useMemo(() => {
    const set = new Set<number>();
    for (const w of puzzle.words) if (w.found) for (const i of wordCells(w, size)) set.add(i);
    return set;
  }, [puzzle.words, size]);

  const finish = (cells: Cell[]) => {
    select([]);
    setAnchor(null);
    if (cells.length >= 2) onSelect(cells);
  };

  const tapCell = (cell: Cell) => {
    if (!anchor) {
      setAnchor(cell);
      select([cell]);
      onSelectionStart?.();
      return;
    }
    if (sameCell(anchor, cell)) {
      setAnchor(null);
      select([]);
      return;
    }
    const line = lineBetween(anchor, cell);
    if (line) finish(line);
    else {
      // Not a straight line: start over from the tapped cell.
      setAnchor(cell);
      select([cell]);
    }
  };

  const drag = (x: number, y: number) => {
    const start = startRef.current;
    if (!start) return;
    const dir = snapDirection(start, x, y, cellSize, allowed);
    select(dir ? lineBetween(start, projectEnd(start, dir, x, y, cellSize, size)) ?? [start] : [start]);
  };

  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(20)
      .onEnd((e: { x: number; y: number }, success?: boolean) => {
        if (success === false) return;
        const cell = cellAt(e.x, e.y, cellSize, size);
        if (cell) tapCell(cell);
      });
    if (mode === 'tapOnly') return tap;
    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(8)
      .onStart((e: { x: number; y: number }) => {
        const cell = cellAt(e.x, e.y, cellSize, size);
        startRef.current = cell;
        setAnchor(null);
        if (cell) {
          select([cell]);
          onSelectionStart?.();
        }
      })
      .onUpdate((e: { x: number; y: number }) => drag(e.x, e.y))
      .onEnd(() => finish(selectionRef.current))
      .onFinalize(() => {
        startRef.current = null;
        select([]);
      });
    return Gesture.Race(pan, tap);
    // The handlers read the latest props through the closures re-created on every change that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cellSize, size, anchor, allowed, onSelect, onSelectionStart]);

  const stroke = cellSize * 0.8;
  const letterSize = Math.min(textScale[textSize].gridLetter, Math.floor(cellSize * 0.62));
  const hintSet = new Set(hintCells.map((c) => c.row * size + c.col));
  const label = (r: number, c: number, letter: string) =>
    t(foundCells.has(r * size + c) ? 'game.cellLabelFound' : 'game.cellLabel', { row: r + 1, col: c + 1, letter });

  const letters = puzzle.grid.map((rowText, r) => (
    <View key={r} style={styles.row}>
      {rowText.split('').map((letter, c) => {
        const idx = r * size + c;
        const isFound = foundCells.has(idx);
        const isAnchor = anchor !== null && anchor.row === r && anchor.col === c;
        const inner = (
          <AppText
            maxFontSizeMultiplier={1.4}
            style={{ fontSize: letterSize, lineHeight: Math.ceil(letterSize * 1.2), color: isFound ? g.onHighlight : colors.text, fontWeight: '700' }}
          >
            {letter}
          </AppText>
        );
        const cellStyle = {
          width: cellSize,
          height: cellSize,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: g.gridBorder,
        };
        return screenReader ? (
          <Pressable
            key={c}
            testID={`cell-${r}-${c}`}
            accessibilityRole="button"
            accessibilityLabel={label(r, c, letter)}
            accessibilityState={{ selected: isAnchor }}
            onPress={() => tapCell({ row: r, col: c })}
            style={cellStyle}
          >
            {inner}
          </Pressable>
        ) : (
          <View key={c} style={cellStyle}>
            {inner}
          </View>
        );
      })}
    </View>
  ));

  const hc = themeMode === 'high-contrast';
  const selFrom = selection[0];
  const selTo = selection[selection.length - 1];

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ width: extent, height: extent, backgroundColor: g.gridCell, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: g.gridBorder }}
        accessible={false}
      >
        <Svg width={extent} height={extent} style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {puzzle.words.filter((w) => w.found).map((w) => {
            const span = wordCells(w, size);
            const a = cellCenter({ row: Math.floor(span[0] / size), col: span[0] % size }, cellSize);
            const b = cellCenter({ row: Math.floor(span[span.length - 1] / size), col: span[span.length - 1] % size }, cellSize);
            const hue = g.highlights[(w.colorIdx ?? 0) % g.highlights.length];
            const animate = !foundOnMount.current.has(w.word);
            return hc ? (
              <G key={w.word}>
                <FoundStroke x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hue} width={stroke} opacity={1} animate={animate} />
                <FoundStroke x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={g.gridCell} width={stroke - 8} opacity={1} animate={animate} />
              </G>
            ) : (
              <FoundStroke key={w.word} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hue} width={stroke} opacity={g.highlightAlpha} animate={animate} />
            );
          })}
          {selFrom && selTo && (
            <Line
              x1={cellCenter(selFrom, cellSize).x}
              y1={cellCenter(selFrom, cellSize).y}
              x2={cellCenter(selTo, cellSize).x}
              y2={cellCenter(selTo, cellSize).y}
              stroke={g.selection}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          )}
          {[...hintSet].map((i) => {
            const c = cellCenter({ row: Math.floor(i / size), col: i % size }, cellSize);
            return <Circle key={i} cx={c.x} cy={c.y} r={cellSize * 0.44} stroke={g.hintRing} strokeWidth={4} fill="none" />;
          })}
        </Svg>
        {letters}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row' } });
