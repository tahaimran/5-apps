/**
 * Motion (plan §7, expo-animation): every animated path renders with Reduce Motion off, everything the
 * player causes finishes in under 300 ms, the stars land one after another, the confetti is on Puzzle
 * Complete only and never under Reduce Motion, and the right Reanimated tool is used for each effect.
 */
import { mockMotion, mockParams } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import type { ReactTestInstance } from 'react-test-renderer';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { applySelection } from '@/domain/game';
import { wordCells } from '@/domain/generator';
import { levelPuzzle } from '@/domain/puzzles';
import { useGame } from '@/store/game';
import { useResult } from '@/store/result';
import { themeProps } from '@/theme/tokens';
import {
  BURST_MS,
  CHIP_TICK,
  CONFETTI_MS,
  DRAW_MS,
  FADE_MS,
  FLAME_MS,
  GRID_IN,
  GRID_IN_MS,
  HINT_PULSE,
  RISE_MS,
  STAR_GAP_MS,
  STAR_MS,
  STAR_POP,
  STATE_MS,
  TICK_MS,
} from '@/ui/motion';
import { WordList } from '@/components/WordList';
import Complete from '../../app/complete/[puzzleId]';
import Play from '../../app/play/[puzzleId]';

const wrap = (el: React.ReactElement) => <ThemeProvider {...themeProps}>{el}</ThemeProvider>;

/** Every flattened host style in the tree. */
const styles = (root: ReactTestInstance) =>
  root
    .findAll((n) => typeof n.type === 'string')
    .map((n) => StyleSheet.flatten(n.props.style) as Record<string, unknown> | undefined)
    .filter((s): s is Record<string, unknown> => !!s);
const keyframed = (root: ReactTestInstance, name: object) => styles(root).filter((s) => s.animationName === name);

beforeEach(() => {
  resetApp();
  mockMotion.reduced = false;
  // The shared Confetti reads the motion setting itself (it is not the app's Reanimated stand-in).
  jest.spyOn(Reanimated, 'useReducedMotion').mockImplementation(() => mockMotion.reduced);
});
afterEach(async () => {
  mockMotion.reduced = true;
  jest.restoreAllMocks();
  await cleanup();
  sharedStore.remove('theme.mode');
});

describe('motion tokens', () => {
  it('keeps every effect the player causes under 300 ms', () => {
    for (const ms of [STATE_MS, DRAW_MS, FADE_MS, GRID_IN_MS, TICK_MS, STAR_MS, RISE_MS, BURST_MS, FLAME_MS]) expect(ms).toBeLessThan(300);
  });
  it('never starts anything from nothing (no scale 0)', () => {
    expect(STAR_POP['0%'].transform[0]).toEqual({ scale: 0.6 });
    expect(GRID_IN['0%'].transform[1]).toEqual({ scale: 0.98 });
    expect(CHIP_TICK['0%'].transform[0]).toEqual({ scale: 1 });
    expect(HINT_PULSE['0%'].opacity).toBe(1);
  });
  it('keeps the confetti short', () => {
    expect(CONFETTI_MS).toBeLessThanOrEqual(2000);
  });
});

const finish = (stars: 1 | 2 | 3, daily = false) =>
  useResult.getState().set({
    puzzleId: daily ? 'daily:2026-10-08:easy' : 'animals:easy:3',
    packId: 'animals',
    difficulty: 'easy',
    level: daily ? undefined : 3,
    dateKey: daily ? '2026-10-08' : undefined,
    isDaily: daily,
    isTutorial: false,
    stars,
    wordsFound: 7,
    elapsedMs: 5000,
    hintsUsed: 0,
    streak: daily ? 4 : undefined,
    streakCounted: daily ? true : undefined,
  });

describe('Puzzle Complete', () => {
  it('pops the earned stars one after another, opens the rays once and bursts confetti', async () => {
    finish(3);
    const ui = await render(wrap(<Complete />));
    const stars = keyframed(ui.root, STAR_POP);
    expect(stars).toHaveLength(3);
    expect(stars.map((s) => s.animationDelay as number)).toEqual([0, 1, 2].map((i) => (stars[0].animationDelay as number) + i * STAR_GAP_MS));
    expect(styles(ui.root).some((s) => s.animationIterationCount === 'infinite')).toBe(false);
    // Confetti: a layer that takes no touches and is hidden from screen readers.
    expect(ui.root.findAll((n) => typeof n.type === 'string' && n.props.pointerEvents === 'none' && n.props.importantForAccessibility === 'no-hide-descendants').length).toBeGreaterThan(1);
  });

  it('pops only the stars that were earned', async () => {
    finish(1);
    const ui = await render(wrap(<Complete />));
    expect(keyframed(ui.root, STAR_POP)).toHaveLength(1);
  });

  it('lands the streak flame after the last star on a counted daily', async () => {
    finish(2, true);
    const ui = await render(wrap(<Complete />));
    const { FLAME_POP } = require('@/ui/motion') as typeof import('@/ui/motion');
    const flame = keyframed(ui.root, FLAME_POP);
    expect(flame).toHaveLength(1);
    const lastStar = Math.max(...keyframed(ui.root, STAR_POP).map((s) => s.animationDelay as number));
    expect(flame[0].animationDelay as number).toBeGreaterThan(lastStar);
  });

  it('has no movement and no confetti under Reduce Motion', async () => {
    mockMotion.reduced = true;
    finish(3);
    const ui = await render(wrap(<Complete />));
    expect(styles(ui.root).filter((s) => 'animationName' in s)).toHaveLength(0);
    expect(ui.texts()).toContain('Well done!');
  });
});

describe('the Game screen', () => {
  it('settles the board in once, and the hint ring breathes', async () => {
    mockParams.current = { puzzleId: 'animals:easy:1' };
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    try {
      const ui = await render(wrap(<Play />));
      await act(async () => {
        jest.advanceTimersByTime(10);
      });
      await flush();
      expect(keyframed(ui.root, GRID_IN)).toHaveLength(1);
      expect(keyframed(ui.root, GRID_IN)[0].animationIterationCount).toBeUndefined();
      await act(async () => {
        ui.root.findAll((n) => typeof n.props.onPress === 'function' && /^Hint, /.test(String(n.props.accessibilityLabel)))[0].props.onPress();
      });
      const ring = keyframed(ui.root, HINT_PULSE);
      expect(ring).toHaveLength(1);
      expect(ring[0].animationIterationCount).toBe('infinite');
    } finally {
      jest.useRealTimers();
    }
  });

  it('ticks a word chip when its word is found on screen, not the ones found before', async () => {
    const puzzle = levelPuzzle('animals', 'easy', 1, 8);
    useGame.getState().begin(puzzle);
    const cells = (i: number) => wordCells(puzzle.words[i], puzzle.size).map((n) => ({ row: Math.floor(n / puzzle.size), col: n % puzzle.size }));
    let game = applySelection(useGame.getState().current!, cells(0)).game;
    const ui = await render(wrap(<WordList words={game.puzzle.words} textSize="large" />));
    expect(keyframed(ui.root, CHIP_TICK)).toHaveLength(0);
    game = applySelection(game, cells(1)).game;
    await ui.update(wrap(<WordList words={game.puzzle.words} textSize="large" />));
    expect(keyframed(ui.root, CHIP_TICK)).toHaveLength(1);
  });
});
