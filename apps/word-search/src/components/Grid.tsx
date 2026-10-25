import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useAnimatedReaction, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { G, Line } from 'react-native-svg';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { DIRECTION_VECTORS, DIRECTIONS_BY_DIFFICULTY } from '@/domain/directions';
import { wordCells } from '@/domain/generator';
import { cellAt, cellCenter, lineBetween, projectEnd, sameCell, snapDirection, type Cell } from '@/domain/selection';
import type { SavedGame, SelectionMode, TextSize } from '@/domain/types';
import { useAppColors, useGameColors, useIsHighContrast } from '@/theme/mode';
import { GRID_FONT, textScale } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { CSS_EASE_OUT, DRAW_MS, EASE_OUT, FADE_MS, HINT_PULSE, HINT_PULSE_MS } from '@/ui/motion';
import { cellIndexAt, pillEnd, snapIndex, type Vec } from './gridGeometry';

const AnimatedLine = Animated.createAnimatedComponent(Line);

/** The frame around the grid (the board of the reference screens), in dp on each side. */
export const BOARD_FRAME = 6;

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
  /** The letters under the selection while it changes ("" when there is none), for the word bubble. */
  onPreview?: (letters: string) => void;
  /** Cells of words that are being hinted: ringed. */
  hintCells?: readonly Cell[];
}

/**
 * A found word's pill: an edge line under a fill line, both with round caps, drawn in from the first
 * letter to the last when it is found on screen (Reduce Motion: it just appears). High contrast draws a
 * thick outline only (the inner line is the cell color).
 */
const FoundPill = memo(function FoundPill({ x1, y1, x2, y2, fill, edge, width, inner, animate }: { x1: number; y1: number; x2: number; y2: number; fill: string; edge: string; width: number; inner: number; animate: boolean }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(animate && !reduced ? 0 : 1);
  useEffect(() => {
    if (animate && !reduced) progress.set(withTiming(1, { duration: DRAW_MS, easing: EASE_OUT }));
  }, [animate, reduced, progress]);
  const end = useAnimatedProps(() => ({ x2: x1 + (x2 - x1) * progress.get(), y2: y1 + (y2 - y1) * progress.get() }));
  return (
    <G>
      <AnimatedLine animatedProps={end} x1={x1} y1={y1} x2={x2} y2={y2} stroke={edge} strokeWidth={width} strokeLinecap="round" />
      <AnimatedLine animatedProps={end} x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={inner} strokeLinecap="round" />
    </G>
  );
});

/** A ring on a hinted letter that breathes for the 3 s it is shown; still under Reduce Motion. */
function HintRing({ cell, cellSize, color }: { cell: Cell; cellSize: number; color: string }) {
  const reduced = useReducedMotion();
  const d = cellSize * 0.9;
  const c = cellCenter(cell, cellSize);
  return (
    <Animated.View
      testID="hint-ring"
      pointerEvents="none"
      style={[
        styles.ring,
        { left: c.x - d / 2, top: c.y - d / 2, width: d, height: d, borderRadius: d / 2, borderColor: color },
        reduced ? null : { animationName: HINT_PULSE, animationDuration: HINT_PULSE_MS, animationIterationCount: 'infinite', animationTimingFunction: CSS_EASE_OUT },
      ]}
    />
  );
}

/**
 * The letter grid (plan §5.3, §8.4) on its board: one gesture surface over the whole grid, not one per
 * cell. The live selection is a pill driven by shared values the gesture sets on the UI thread, so it
 * follows the finger continuously without a React render; when the finger lifts, the domain decides
 * which cells were selected. A selection that is not a word just fades (no red, no buzz). Letters are
 * views in Atkinson Hyperlegible over one SVG of pills; with TalkBack on, every cell is a labelled button.
 */
export function Grid({ game, cellSize, textSize, mode, screenReader, onSelect, onSelectionStart, onPreview, hintCells = [] }: GridProps) {
  const { colors, radius, shadow } = useTheme();
  const g = useGameColors();
  const app = useAppColors();
  const hc = useIsHighContrast();
  const { puzzle } = game;
  const { size } = puzzle;
  const extent = cellSize * size;
  const allowed = DIRECTIONS_BY_DIFFICULTY[puzzle.difficulty];
  const vectors = useMemo<Vec[]>(() => allowed.map((d) => [DIRECTION_VECTORS[d].dr, DIRECTION_VECTORS[d].dc] as const), [allowed]);
  const [anchor, setAnchor] = useState<Cell | null>(null);

  // The live pill: start and end points, how visible it is, and where the finger last was.
  const start = useSharedValue(-1);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const ex = useSharedValue(0);
  const ey = useSharedValue(0);
  const fx = useSharedValue(0);
  const fy = useSharedValue(0);
  const endIndex = useSharedValue(-1);
  const visible = useSharedValue(0);

  // Words found while this grid is on screen draw themselves in; words found earlier (a resumed puzzle) just appear.
  const foundOnMount = useRef(new Set(puzzle.words.filter((w) => w.found).map((w) => w.word)));

  const foundCells = useMemo(() => {
    const set = new Set<number>();
    for (const w of puzzle.words) if (w.found) for (const i of wordCells(w, size)) set.add(i);
    return set;
  }, [puzzle.words, size]);

  const lettersBetween = useCallback(
    (a: number, b: number) => {
      const line = lineBetween({ row: Math.floor(a / size), col: a % size }, { row: Math.floor(b / size), col: b % size });
      return line ? line.map((c) => puzzle.grid[c.row][c.col]).join('') : '';
    },
    [puzzle.grid, size],
  );
  const preview = useCallback((a: number, b: number) => onPreview?.(a < 0 ? '' : lettersBetween(a, b)), [onPreview, lettersBetween]);

  // The word bubble changes only when the end cell changes (a few times per drag), never per frame.
  useAnimatedReaction(
    () => (start.get() < 0 ? -1 : endIndex.get()),
    (now, before) => {
      if (now !== before) scheduleOnRN(preview, start.get(), now);
    },
  );

  /** Shows the pill from one cell to another (tap-tap) at once. */
  const showLine = (a: Cell, b: Cell) => {
    const p = cellCenter(a, cellSize);
    const q = cellCenter(b, cellSize);
    sx.set(p.x);
    sy.set(p.y);
    ex.set(q.x);
    ey.set(q.y);
    visible.set(1);
  };
  const fadeOut = () => visible.set(withTiming(0, { duration: FADE_MS }));

  const finish = (cells: Cell[]) => {
    setAnchor(null);
    fadeOut();
    onPreview?.('');
    if (cells.length >= 2) onSelect(cells);
  };

  const tapCell = (cell: Cell) => {
    if (!anchor) {
      setAnchor(cell);
      showLine(cell, cell);
      onPreview?.(puzzle.grid[cell.row][cell.col]);
      onSelectionStart?.();
      return;
    }
    if (sameCell(anchor, cell)) {
      setAnchor(null);
      fadeOut();
      onPreview?.('');
      return;
    }
    const line = lineBetween(anchor, cell);
    if (line) {
      showLine(anchor, cell);
      finish(line);
    } else {
      // Not a straight line: start over from the tapped cell.
      setAnchor(cell);
      showLine(cell, cell);
      onPreview?.(puzzle.grid[cell.row][cell.col]);
    }
  };

  const startDrag = () => {
    setAnchor(null);
    onSelectionStart?.();
  };

  /** The finger lifted: the domain decides the cells from where the drag began and where the finger was. */
  const endDrag = (startIdx: number, x: number, y: number) => {
    const from = { row: Math.floor(startIdx / size), col: startIdx % size };
    const dir = snapDirection(from, x, y, cellSize, allowed);
    finish(dir ? lineBetween(from, projectEnd(from, dir, x, y, cellSize, size)) ?? [from] : [from]);
  };

  const tapAt = (x: number, y: number) => {
    const cell = cellAt(x, y, cellSize, size);
    if (cell) tapCell(cell);
  };

  const gesture = useMemo(() => {
    // A slow, careful press still counts (the default gives up after 500 ms).
    const tap = Gesture.Tap()
      .maxDuration(1500)
      .maxDistance(20)
      .onEnd((e: { x: number; y: number }, success?: boolean) => {
        'worklet';
        if (success === false) return;
        scheduleOnRN(tapAt, e.x, e.y);
      });
    if (mode === 'tapOnly') return tap;
    const pan = Gesture.Pan()
      .minDistance(8)
      .onStart((e: { x: number; y: number }) => {
        'worklet';
        const idx = cellIndexAt(e.x, e.y, cellSize, size);
        start.set(idx);
        if (idx < 0) return;
        const cx = ((idx % size) + 0.5) * cellSize;
        const cy = (Math.floor(idx / size) + 0.5) * cellSize;
        sx.set(cx);
        sy.set(cy);
        ex.set(cx);
        ey.set(cy);
        fx.set(e.x);
        fy.set(e.y);
        endIndex.set(idx);
        visible.set(1);
        scheduleOnRN(startDrag);
      })
      .onUpdate((e: { x: number; y: number }) => {
        'worklet';
        const idx = start.get();
        if (idx < 0) return;
        fx.set(e.x);
        fy.set(e.y);
        const d = snapIndex(idx, e.x, e.y, cellSize, size, vectors);
        const [x, y, end] = pillEnd(idx, e.x, e.y, cellSize, size, d < 0 ? null : vectors[d]);
        ex.set(x);
        ey.set(y);
        endIndex.set(end);
      })
      .onEnd(() => {
        'worklet';
        const idx = start.get();
        if (idx >= 0) scheduleOnRN(endDrag, idx, fx.get(), fy.get());
      })
      .onFinalize(() => {
        'worklet';
        if (start.get() >= 0) visible.set(withTiming(0, { duration: FADE_MS }));
        start.set(-1);
      });
    return Gesture.Race(pan, tap);
    // The JS handlers read the latest props through closures re-created on every change that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cellSize, size, anchor, vectors, onSelect, onSelectionStart, onPreview]);

  const stroke = cellSize * 0.8;
  const live = useAnimatedProps(() => ({ x1: sx.get(), y1: sy.get(), x2: ex.get(), y2: ey.get(), strokeOpacity: visible.get() }));
  const letterSize = Math.min(textScale[textSize].gridLetter, Math.floor(cellSize * 0.62));
  const label = (r: number, c: number, letter: string) =>
    t(foundCells.has(r * size + c) ? 'game.cellLabelFound' : 'game.cellLabel', { row: r + 1, col: c + 1, letter });

  const letters = puzzle.grid.map((rowText, r) => (
    <View key={r} style={styles.row}>
      {rowText.split('').map((letter, c) => {
        const isFound = foundCells.has(r * size + c);
        const isAnchor = anchor !== null && anchor.row === r && anchor.col === c;
        const inner = (
          <AppText
            maxFontSizeMultiplier={1.4}
            style={{ fontFamily: GRID_FONT, fontSize: letterSize, lineHeight: Math.ceil(letterSize * 1.2), color: isFound ? g.onHighlight : colors.text, fontWeight: '700' }}
          >
            {letter}
          </AppText>
        );
        const cellStyle = { width: cellSize, height: cellSize, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: StyleSheet.hairlineWidth, borderColor: g.gridBorder };
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

  return (
    <View style={[styles.board, { padding: BOARD_FRAME, borderRadius: radius.lg + 2, backgroundColor: app.board }, hc ? null : shadow(2)]}>
      <GestureDetector gesture={gesture}>
        <View
          style={{ width: extent, height: extent, backgroundColor: g.gridCell, borderRadius: radius.md, overflow: 'hidden' }}
          accessible={false}
          accessibilityLabel={t('game.gridLabel', { size })}
        >
          <Svg width={extent} height={extent} style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {puzzle.words
              .filter((w) => w.found)
              .map((w) => {
                const span = wordCells(w, size);
                const a = cellCenter({ row: Math.floor(span[0] / size), col: span[0] % size }, cellSize);
                const b = cellCenter({ row: Math.floor(span[span.length - 1] / size), col: span[span.length - 1] % size }, cellSize);
                const i = (w.colorIdx ?? 0) % g.highlights.length;
                return (
                  <FoundPill
                    key={w.word}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    edge={g.edges[i]}
                    fill={hc ? g.gridCell : g.highlights[i]}
                    width={stroke}
                    inner={hc ? stroke - 8 : stroke - 5}
                    animate={!foundOnMount.current.has(w.word)}
                  />
                );
              })}
            {/* The live selection, over the found pills and under the letters: a see-through pill, or in high contrast a yellow outline. */}
            <AnimatedLine testID="selection" animatedProps={live} x1={0} y1={0} x2={0} y2={0} strokeOpacity={0} stroke={hc ? g.selectionEdge : g.selection} strokeWidth={stroke} strokeLinecap="round" />
            {hc && <AnimatedLine testID="selection-inner" animatedProps={live} x1={0} y1={0} x2={0} y2={0} strokeOpacity={0} stroke={g.gridCell} strokeWidth={stroke - 8} strokeLinecap="round" />}
          </Svg>
          {letters}
          {hintCells.map((c) => (
            <HintRing key={`${c.row}-${c.col}`} cell={c} cellSize={cellSize} color={g.hintRing} />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  board: { alignSelf: 'center' },
  ring: { position: 'absolute', borderWidth: 4 },
});
