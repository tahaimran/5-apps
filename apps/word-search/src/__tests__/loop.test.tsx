import { mockGestures, mockParams, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Alert, AppState, Dimensions } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { wordCells } from '@/domain/generator';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { levelPuzzle } from '@/domain/puzzles';
import { cellCenter } from '@/domain/selection';
import { startLevel } from '@/features/play/navigation';
import { useGame } from '@/store/game';
import { useProgress } from '@/store/progress';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { palette, TOUCH_TARGET } from '@/theme/tokens';
import Complete, { formatElapsed, nextPuzzleId } from '../../app/complete/[puzzleId]';
import Home from '../../app/(tabs)/index';
import PackScreen from '../../app/packs/[packId]';
import Play, { CELEBRATION_MS } from '../../app/play/[puzzleId]';

const width = Dimensions.get('window').width;
const wrap = (el: React.ReactElement) => <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;

beforeEach(() => {
  resetApp();
  jest.clearAllMocks();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 9, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

const settle = async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
  await flush();
};

const playScreen = async (id: string) => {
  mockParams.current = { puzzleId: id };
  const ui = await render(wrap(<Play />));
  await settle();
  return ui;
};

const solveAll = async (id = 'animals:easy:1') => {
  const parsed = id.split(':');
  const size = effectiveGridSize(parsed[1] as 'easy', 'large', width);
  const puzzle = levelPuzzle(parsed[0], parsed[1] as 'easy', Number(parsed[2]), size);
  const cell = cellSizeFor(size, width);
  const tapAt = (n: number) => act(async () => mockGestures.tap.onEnd!({ ...cellCenter({ row: Math.floor(n / size), col: n % size }, cell) }, true));
  for (const w of puzzle.words) {
    const span = wordCells(w, size);
    await tapAt(span[0]);
    await tapAt(span[span.length - 1]);
  }
  return puzzle;
};

describe('the game loop (plan §4 flows)', () => {
  it('play → celebration → Complete screen with the result stored', async () => {
    await playScreen('animals:easy:1');
    await solveAll();
    expect(mockRouter.replace).not.toHaveBeenCalled(); // 600 ms of celebration first
    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/complete/[puzzleId]', params: { puzzleId: 'animals:easy:1' } });
    expect(useResult.getState().last).toMatchObject({ level: 1, stars: 3 });
    expect(useGame.getState().current).toBeNull();
    expect(useProgress.getState().packs.animals.easy.currentLevel).toBe(2);
  });

  it('ignores taps during the celebration and finishes only once', async () => {
    await playScreen('animals:easy:1');
    await solveAll();
    await solveAll(); // more taps while celebrating
    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS * 3);
    });
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });

  it('still records the puzzle when the player backs out during the celebration, without navigating', async () => {
    const ui = await playScreen('animals:easy:1');
    await solveAll();
    await act(async () => ui.unmount());
    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS);
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(useProgress.getState().packs.animals.easy.currentLevel).toBe(2);
  });

  it('kill the app mid-puzzle, come back, and the same grid and found words are there', async () => {
    const ui = await playScreen('animals:easy:1');
    const size = effectiveGridSize('easy', 'large', width);
    const puzzle = levelPuzzle('animals', 'easy', 1, size);
    const cell = cellSizeFor(size, width);
    const span = wordCells(puzzle.words[0], size);
    const tapAt = (n: number) => act(async () => mockGestures.tap.onEnd!({ ...cellCenter({ row: Math.floor(n / size), col: n % size }, cell) }, true));
    await tapAt(span[0]);
    await tapAt(span[span.length - 1]);
    const first = puzzle.words[0].word;
    const cap = first.charAt(0) + first.slice(1).toLowerCase();
    expect(ui.byLabel(`${cap}, found`)).toHaveLength(1);
    await act(async () => ui.unmount());
    // the process dies: stores are rebuilt from disk
    const { db } = require('@/store/storage');
    useGame.setState({ current: db.get('current') ?? null, activeSince: null });
    const again = await playScreen('animals:easy:1');
    expect(again.byLabel(`${cap}, found`)).toHaveLength(1);
    expect(again.texts()).toContain(`${puzzle.words.length - 1} words left`);
  });

  it('saves when the app goes to the background', async () => {
    await playScreen('animals:easy:1');
    const listeners: ((s: string) => void)[] = [];
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, l: (s: string) => void) => {
      listeners.push(l);
      return { remove: () => undefined };
    }) as never);
    await cleanup();
    await playScreen('animals:easy:1');
    jest.setSystemTime(Date.now() + 30_000);
    await act(async () => listeners.forEach((l) => l('background')));
    expect(useGame.getState().current?.elapsedMs).toBeGreaterThanOrEqual(30_000);
    await act(async () => listeners.forEach((l) => l('active')));
    expect(useGame.getState().activeSince).not.toBeNull();
    spy.mockRestore();
  });
});

describe('Complete screen (plan §5.4)', () => {
  const result = { puzzleId: 'animals:easy:3', packId: 'animals', difficulty: 'easy' as const, level: 3, isDaily: false, isTutorial: false, stars: 2 as const, wordsFound: 7, elapsedMs: 125_000, hintsUsed: 1 };

  it('says well done, shows the stars and the words, and offers the next puzzle', async () => {
    useResult.getState().set(result);
    mockParams.current = { puzzleId: 'animals:easy:3' };
    const ui = await render(wrap(<Complete />));
    expect(ui.texts()).toContain('Well done!');
    expect(ui.byLabel('2 stars out of 3')).toHaveLength(1);
    expect(ui.texts().join(' ')).toContain('7 words found');
    expect(ui.texts().join(' ')).not.toContain('Time:'); // hidden unless "Show timer" is on
    await ui.press('Next puzzle');
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'animals:easy:4' } });
    await ui.press('Back to packs');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('shows the time when the timer is on', async () => {
    useSettings.getState().update({ showTimer: true });
    useResult.getState().set(result);
    const ui = await render(wrap(<Complete />));
    expect(ui.texts()).toContain('Time: 2:05');
  });

  it('goes home when there is no next level to offer', async () => {
    useResult.getState().set({ ...result, level: undefined, puzzleId: 'tutorial' });
    const ui = await render(wrap(<Complete />));
    expect(ui.byLabel('Next puzzle')).toHaveLength(0);
    await ui.press('Back to home');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('redirects home when the result is gone (the app was killed on this screen)', async () => {
    const ui = await render(wrap(<Complete />));
    expect(ui.root.findAll((n) => (n.type as unknown) === 'Redirect')[0].props.href).toBe('/(tabs)');
  });

  it('formats times and builds the next id', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(59_400)).toBe('0:59');
    expect(formatElapsed(3_725_000)).toBe('62:05');
    expect(nextPuzzleId(result)).toBe('animals:easy:4');
    expect(nextPuzzleId({ ...result, level: undefined })).toBeNull();
  });
});

describe('Home and pack screens', () => {
  it('shows the greeting for the time of day and a card for each of the 12 packs', async () => {
    const ui = await render(wrap(<Home />));
    expect(ui.texts()).toContain('Good morning');
    expect(ui.root.findAll((n) => typeof n.props.accessibilityLabel === 'string' && /^.+, Level 1$/.test(n.props.accessibilityLabel) && n.props.onPress).length).toBe(12);
    await ui.press('Animals, Level 1');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/packs/[packId]', params: { packId: 'animals' } });
  });

  it('offers Continue with the words found so far, and goes back into that puzzle', async () => {
    const puzzle = levelPuzzle('birds', 'medium', 2, 10);
    useGame.getState().begin(puzzle);
    const out = useGame.getState().select(wordCells(puzzle.words[0], 10).map((n) => ({ row: Math.floor(n / 10), col: n % 10 })));
    expect(out?.result.kind).toBe('found');
    const ui = await render(wrap(<Home />));
    expect(ui.texts().join(' ')).toContain(`1 of ${puzzle.words.length} words found`);
    await ui.press('Continue');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'birds:medium:2' } });
  });

  it('has no Continue card without a puzzle in progress, and shows the level per pack', async () => {
    useProgress.getState().record('food', 'easy', 1, 3);
    const ui = await render(wrap(<Home />));
    expect(ui.byLabel('Continue')).toHaveLength(0);
    expect(ui.byLabel('Food, Level 2')).toHaveLength(1);
  });

  it('lists the current level with Play, one Next up, and the finished levels with stars', async () => {
    useProgress.getState().record('animals', 'easy', 1, 3);
    useProgress.getState().record('animals', 'easy', 2, 1);
    mockParams.current = { packId: 'animals' };
    const ui = await render(wrap(<PackScreen />));
    expect(ui.texts()).toContain('Level 3');
    expect(ui.byLabel('Level 4, next up')).toHaveLength(1);
    expect(ui.byLabel('Level 1, 3 stars, play again')).toHaveLength(1);
    expect(ui.byLabel('Level 2, 1 star, play again')).toHaveLength(1);
    await ui.press('Play');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'animals:easy:3' } });
  });

  it('switches difficulty with the segmented control', async () => {
    mockParams.current = { packId: 'animals' };
    const ui = await render(wrap(<PackScreen />));
    await ui.press('Hard');
    expect(useSettings.getState().settings.difficulty).toBe('hard');
    await ui.press('Play');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'animals:hard:1' } });
  });

  it('shows the plan\'s error state for a pack that cannot open', async () => {
    mockParams.current = { packId: 'missing' };
    const ui = await render(wrap(<PackScreen />));
    expect(ui.texts()).toContain("This pack couldn't open. Please try another pack.");
    await ui.press('Back to packs');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('starting a puzzle while another is in progress', () => {
  it('asks first; "Keep playing" returns to the one in progress and "Start new" replaces it', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    useGame.getState().begin(levelPuzzle('birds', 'easy', 1, 8));
    startLevel('animals', 'easy', 1);
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0][2]!;
    buttons.find((b) => b.text === 'Keep playing')!.onPress!();
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'birds:easy:1' } });
    buttons.find((b) => b.text === 'Start new')!.onPress!();
    expect(useGame.getState().current).toBeNull();
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'animals:easy:1' } });
    alert.mockRestore();
  });

  it('does not ask for the same puzzle or when nothing is in progress', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    startLevel('animals', 'easy', 1);
    useGame.getState().begin(levelPuzzle('animals', 'easy', 1, 8));
    startLevel('animals', 'easy', 1);
    expect(alert).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledTimes(2);
    alert.mockRestore();
  });
});
