import { mockGestures } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, render } from '@/testing/ui';
import { act } from 'react';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { applySelection, startGame } from '@/domain/game';
import { generatePuzzle, wordCells } from '@/domain/generator';
import { cellCenter, type Cell } from '@/domain/selection';
import { PACKS } from '@/domain/packs';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import type { Difficulty, SelectionMode, TextSize } from '@/domain/types';
import { palette, minCellDp, TOUCH_TARGET } from '@/theme/tokens';
import { Grid } from '../Grid';
import { WordList } from '../WordList';

const CELL = 44;
const puzzleOf = (difficulty: Difficulty, seed = 3) => {
  const size = difficulty === 'easy' ? 7 : difficulty === 'medium' ? 8 : 10;
  return generatePuzzle({ id: `g:${difficulty}`, packId: 'animals', difficulty, size, seed, words: PACKS[0].words });
};
const cellsOf = (p: ReturnType<typeof puzzleOf>, i: number): Cell[] =>
  wordCells(p.words[i], p.size).map((n) => ({ row: Math.floor(n / p.size), col: n % p.size }));
const themed = (el: ReactElement, mode?: 'light' | 'dark' | 'high-contrast') => {
  if (mode) sharedStore.set('theme.mode', mode);
  return <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;
};

beforeEach(() => {
  resetApp();
  mockGestures.pan = {};
  mockGestures.tap = {};
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

type Over = Partial<Omit<Parameters<typeof Grid>[0], 'onSelect'>> & { difficulty?: Difficulty };
const props = (over: Over = {}) => {
  const puzzle = puzzleOf(over.difficulty ?? 'easy');
  const { difficulty, ...rest } = over;
  void difficulty;
  return { game: startGame(puzzle, 0), cellSize: CELL, textSize: 'large' as TextSize, mode: 'both' as SelectionMode, screenReader: false, onSelect: jest.fn<void, [Cell[]]>(), puzzle, ...rest };
};
const centerOf = (c: Cell) => cellCenter(c, CELL);

describe('Grid drag (plan §8.4)', () => {
  it('draws one letter per cell', async () => {
    const p = props();
    const ui = await render(themed(<Grid {...p} />));
    const letters = p.puzzle.grid.join('').split('');
    const texts = ui.texts();
    expect(texts.length).toBe(letters.length);
    expect(texts.join('')).toBe(letters.join(''));
  });

  it('selects a word by dragging from its first to its last letter', async () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const p = props({ difficulty });
      await render(themed(<Grid {...p} />));
      const cells = cellsOf(p.puzzle, 0);
      const a = centerOf(cells[0]);
      const b = centerOf(cells[cells.length - 1]);
      await act(async () => {
        mockGestures.pan.onStart!({ x: a.x, y: a.y });
        mockGestures.pan.onUpdate!({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        mockGestures.pan.onUpdate!({ x: b.x + 4, y: b.y - 3 });
      });
      await act(async () => {
        mockGestures.pan.onEnd!({});
        mockGestures.pan.onFinalize!({});
      });
      expect(p.onSelect).toHaveBeenCalledTimes(1);
      expect(p.onSelect.mock.calls[0][0]).toEqual(cells);
      await cleanup();
    }
  });

  it('does not select anything for a drag that goes backwards on Easy', async () => {
    const p = props({ difficulty: 'easy' });
    await render(themed(<Grid {...p} />));
    const cells = cellsOf(p.puzzle, 0);
    const last = cells[cells.length - 1];
    const first = cells[0];
    const a = centerOf(last);
    const b = centerOf(first);
    await act(async () => {
      mockGestures.pan.onStart!({ x: a.x, y: a.y });
      mockGestures.pan.onUpdate!({ x: b.x, y: b.y });
      mockGestures.pan.onEnd!({});
      mockGestures.pan.onFinalize!({});
    });
    expect(p.onSelect).not.toHaveBeenCalled();
  });

  it('ticks when a selection starts and clears after the finger lifts', async () => {
    const onSelectionStart = jest.fn();
    const p = props({ onSelectionStart });
    await render(themed(<Grid {...p} />));
    await act(async () => {
      mockGestures.pan.onStart!({ x: 10, y: 10 });
      mockGestures.pan.onFinalize!({});
    });
    expect(onSelectionStart).toHaveBeenCalledTimes(1);
    expect(p.onSelect).not.toHaveBeenCalled();
  });

  it('ignores a drag that starts outside the grid', async () => {
    const onSelectionStart = jest.fn();
    const p = props({ onSelectionStart });
    await render(themed(<Grid {...p} />));
    await act(async () => {
      mockGestures.pan.onStart!({ x: -500, y: -500 });
      mockGestures.pan.onUpdate!({ x: 100, y: 100 });
      mockGestures.pan.onEnd!({});
    });
    expect(onSelectionStart).not.toHaveBeenCalled();
    expect(p.onSelect).not.toHaveBeenCalled();
  });
});

describe('Grid tap-tap', () => {
  const tap = (c: Cell) => act(async () => mockGestures.tap.onEnd!({ ...centerOf(c) }, true));

  it('selects a word by tapping its first and then its last letter', async () => {
    const p = props();
    await render(themed(<Grid {...p} />));
    const cells = cellsOf(p.puzzle, 1);
    await tap(cells[0]);
    expect(p.onSelect).not.toHaveBeenCalled();
    await tap(cells[cells.length - 1]);
    expect(p.onSelect).toHaveBeenCalledWith(cells);
  });

  it('cancels when the first letter is tapped again', async () => {
    const p = props();
    await render(themed(<Grid {...p} />));
    const cells = cellsOf(p.puzzle, 1);
    await tap(cells[0]);
    await tap(cells[0]);
    await tap(cells[cells.length - 1]); // this is a new first tap now
    expect(p.onSelect).not.toHaveBeenCalled();
  });

  it('starts over when the second tap is not on a straight line', async () => {
    const p = props();
    await render(themed(<Grid {...p} />));
    const cells = cellsOf(p.puzzle, 1);
    await tap({ row: 0, col: 0 });
    await tap({ row: 1, col: 3 });
    expect(p.onSelect).not.toHaveBeenCalled();
    // the crooked tap became the new first letter: a line from it works
    await tap({ row: 1, col: 5 });
    expect(p.onSelect).toHaveBeenCalledWith([{ row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 }]);
    void cells;
  });

  it('ignores a failed tap gesture and taps outside the grid', async () => {
    const p = props();
    await render(themed(<Grid {...p} />));
    await act(async () => mockGestures.tap.onEnd!({ x: 5, y: 5 }, false));
    await act(async () => mockGestures.tap.onEnd!({ x: -400, y: -400 }, true));
    expect(p.onSelect).not.toHaveBeenCalled();
  });

  it('uses only taps when the setting is "Tap only"', async () => {
    const p = props({ mode: 'tapOnly' });
    await render(themed(<Grid {...p} />));
    expect(mockGestures.pan.onStart).toBeUndefined();
    expect(mockGestures.tap.onEnd).toBeDefined();
  });
});

describe('Grid with TalkBack (plan §7.5)', () => {
  it('makes every cell a labelled button that works as tap-tap', async () => {
    const p = props({ screenReader: true });
    const ui = await render(themed(<Grid {...p} />));
    const cells = ui.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('cell-') && typeof n.props.onPress === 'function');
    expect(cells.length).toBe(p.puzzle.size * p.puzzle.size);
    const letter = p.puzzle.grid[2][4];
    expect(ui.byLabel(`Row 3, column 5, letter ${letter}`).length).toBeGreaterThan(0);
    expect(auditPressables(ui.root)).toEqual([]);
    const word = cellsOf(p.puzzle, 0);
    const press = async (c: Cell) => ui.press(`Row ${c.row + 1}, column ${c.col + 1}, letter ${p.puzzle.grid[c.row][c.col]}`);
    await press(word[0]);
    await press(word[word.length - 1]);
    expect(p.onSelect).toHaveBeenCalledWith(word);
  });

  it('says when a cell belongs to a found word', async () => {
    const puzzle = puzzleOf('easy');
    const word = cellsOf(puzzle, 0);
    const game = applySelection(startGame(puzzle, 0), word).game;
    const ui = await render(themed(<Grid {...props({ screenReader: true, game })} />));
    const c = word[0];
    expect(ui.byLabel(`Row ${c.row + 1}, column ${c.col + 1}, letter ${puzzle.grid[c.row][c.col]}, in a found word`).length).toBeGreaterThan(0);
  });

  it('keeps the grid cells at least 44dp at every text size on narrow and wide screens', () => {
    for (const width of [320, 360, 411, 600, 800]) {
      for (const textSize of Object.keys(minCellDp) as TextSize[]) {
        for (const difficulty of ['easy', 'medium', 'hard'] as const) {
          const size = effectiveGridSize(difficulty, textSize, width);
          expect(size).toBeGreaterThanOrEqual(6);
          // The grid never gets cells below the text size's minimum, except when the floor of 6 is hit.
          if (size > 6) expect(cellSizeFor(size, width)).toBeGreaterThanOrEqual(minCellDp[textSize]);
        }
      }
    }
    // On a 360dp phone the default text size leaves cells of at least 50dp.
    expect(cellSizeFor(effectiveGridSize('easy', 'large', 360), 360)).toBeGreaterThanOrEqual(50);
    expect(cellSizeFor(effectiveGridSize('easy', 'comfortable', 360), 360)).toBeGreaterThanOrEqual(44);
  });
});

describe('Grid drawing', () => {
  it('draws one stroke per found word, in the high-contrast outline style too', async () => {
    const puzzle = puzzleOf('medium', 5);
    let game = startGame(puzzle, 0);
    game = applySelection(game, cellsOf(puzzle, 0)).game;
    game = applySelection(game, cellsOf(game.puzzle, 1)).game;
    for (const mode of ['light', 'dark', 'high-contrast'] as const) {
      const ui = await render(themed(<Grid {...props({ game, difficulty: 'medium' })} />, mode));
      const strokes = ui.root.findAll((n) => typeof n.props.strokeLinecap === 'string' && n.props.x1 !== undefined && typeof n.type === 'string');
      expect(strokes.length).toBe(mode === 'high-contrast' ? 4 : 2);
      await cleanup();
    }
  });

  it('rings the hinted cells', async () => {
    const puzzle = puzzleOf('easy');
    const ui = await render(themed(<Grid {...props({ hintCells: [{ row: 0, col: 0 }, { row: 1, col: 1 }] })} />));
    expect(ui.root.findAll((n) => n.props.r !== undefined && n.props.fill === 'none' && typeof n.type === 'string').length).toBe(2);
    void puzzle;
  });

  it('shows the selection as the finger moves', async () => {
    const p = props();
    const ui = await render(themed(<Grid {...p} />));
    const cells = cellsOf(p.puzzle, 0);
    const a = centerOf(cells[0]);
    await act(async () => {
      mockGestures.pan.onStart!({ x: a.x, y: a.y });
    });
    expect(ui.root.findAll((n) => typeof n.props.strokeLinecap === 'string' && n.props.x1 !== undefined && typeof n.type === 'string').length).toBe(1);
  });
});

describe('WordList', () => {
  it('says found and not found, never by color alone, and counts what is left', async () => {
    const puzzle = puzzleOf('easy');
    const game = applySelection(startGame(puzzle, 0), cellsOf(puzzle, 0)).game;
    const words = game.puzzle.words;
    const ui = await render(themed(<WordList words={words} textSize="large" />));
    const first = words[0].word;
    const cap = first.charAt(0) + first.slice(1).toLowerCase();
    expect(ui.byLabel(`${cap}, found`)).toHaveLength(1);
    expect(ui.byLabel(/, not found$/)).toHaveLength(words.length - 1);
    expect(ui.texts()).toContain(`${words.length - 1} words left`);
    const struck = ui.root.findAll((n) => n.props.style && JSON.stringify(n.props.style).includes('line-through'));
    expect(struck.length).toBeGreaterThan(0);
  });

  it('shows the all-found message and the singular "word left"', async () => {
    const puzzle = puzzleOf('easy');
    let game = startGame(puzzle, 0);
    for (let i = 0; i < puzzle.words.length - 1; i++) game = applySelection(game, cellsOf(game.puzzle, i)).game;
    const ui = await render(themed(<WordList words={game.puzzle.words} textSize="huge" />));
    expect(ui.texts()).toContain('1 word left');
    game = applySelection(game, cellsOf(game.puzzle, puzzle.words.length - 1)).game;
    await ui.update(themed(<WordList words={game.puzzle.words} textSize="huge" />));
    expect(ui.texts()).toContain('All words found');
  });
});
