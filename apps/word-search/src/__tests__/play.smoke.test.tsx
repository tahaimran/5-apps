import { mockGestures, mockParams, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { wordCells } from '@/domain/generator';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { levelPuzzle } from '@/domain/puzzles';
import { cellCenter } from '@/domain/selection';
import { useSettings } from '@/store/settings';
import { palette, TOUCH_TARGET } from '@/theme/tokens';
import Play from '../../app/play/[puzzleId]';

const width = Dimensions.get('window').width;
const wrap = (el: React.ReactElement) => <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;

beforeEach(() => {
  resetApp();
  jest.clearAllMocks();
});
afterEach(cleanup);

const loaded = async (id: string) => {
  mockParams.current = { puzzleId: id };
  const ui = await render(wrap(<Play />));
  for (let i = 0; i < 20 && ui.byLabel('Getting your puzzle ready').length; i++) await act(async () => new Promise((r) => setTimeout(r, 20)));
  await flush();
  return ui;
};

describe('Play screen (milestone 3)', () => {
  it('shows a placeholder while the puzzle is built, then the grid and the word list', async () => {
    mockParams.current = { puzzleId: 'animals:easy:1' };
    const ui = await render(wrap(<Play />));
    expect(ui.byLabel('Getting your puzzle ready').length).toBe(1);
    await act(async () => new Promise((r) => setTimeout(r, 50)));
    const size = effectiveGridSize('easy', 'large', width);
    const puzzle = levelPuzzle('animals', 'easy', 1, size);
    expect(ui.texts()).toContain('Animals · Level 1');
    expect(ui.texts()).toContain(`${puzzle.words.length} words left`);
    for (const w of puzzle.words) expect(ui.texts()).toContain(w.word);
  });

  it('finds every word by tapping first and last letters, with haptics and the final message', async () => {
    const ui = await loaded('animals:easy:1');
    const size = effectiveGridSize('easy', 'large', width);
    const puzzle = levelPuzzle('animals', 'easy', 1, size);
    const cell = cellSizeFor(size, width);
    const tapAt = (n: number) => act(async () => mockGestures.tap.onEnd!({ ...cellCenter({ row: Math.floor(n / size), col: n % size }, cell) }, true));
    for (const [i, w] of puzzle.words.entries()) {
      const span = wordCells(w, size);
      await tapAt(span[0]);
      await tapAt(span[span.length - 1]);
      const cap = w.word.charAt(0) + w.word.slice(1).toLowerCase();
      expect(ui.byLabel(`${cap}, found`)).toHaveLength(1);
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(i + 1);
    }
    expect(ui.texts()).toContain('All words found');
  });

  it('does nothing for a wrong selection (no buzz, no red)', async () => {
    const ui = await loaded('animals:easy:1');
    const size = effectiveGridSize('easy', 'large', width);
    const cell = cellSizeFor(size, width);
    const puzzle = levelPuzzle('animals', 'easy', 1, size);
    const tapRC = (row: number, col: number) => act(async () => mockGestures.tap.onEnd!({ ...cellCenter({ row, col }, cell) }, true));
    // pick a line that is not a word: the first cell and its right neighbour, unless that happens to be a 2-letter word (none: words are 3+ letters)
    await tapRC(0, 0);
    await tapRC(0, 1);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(ui.texts()).toContain(`${puzzle.words.length} words left`);
  });

  it('goes back with the back button', async () => {
    const ui = await loaded('animals:easy:1');
    await ui.press('Back');
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('says so when the puzzle id is wrong', async () => {
    const ui = await loaded('nonsense');
    expect(ui.texts()).toContain("This puzzle couldn't open. Please try another one.");
  });

  it('reads tap-only mode from the settings', async () => {
    useSettings.getState().update({ selectionMode: 'tapOnly' });
    mockGestures.pan = {};
    await loaded('animals:easy:1');
    expect(mockGestures.pan.onStart).toBeUndefined();
  });
});
