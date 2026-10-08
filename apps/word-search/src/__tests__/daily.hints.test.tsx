import { mockGestures, mockParams, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Alert, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { dailyPuzzle } from '@/domain/daily';
import { wordCells } from '@/domain/generator';
import { cellSizeFor, effectiveGridSize } from '@/domain/gridSize';
import { cellCenter } from '@/domain/selection';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { palette, TOUCH_TARGET } from '@/theme/tokens';
import Complete from '../../app/complete/[puzzleId]';
import DailyTab from '../../app/(tabs)/daily';
import Home from '../../app/(tabs)/index';
import Play, { CELEBRATION_MS } from '../../app/play/[puzzleId]';
import SettingsScreen from '../../app/(tabs)/settings';
import { confirmReset } from '@/features/settings/reset';
import { levelPuzzle } from '@/domain/puzzles';
import { useProgress } from '@/store/progress';
import { useStats } from '@/store/stats';

const width = Dimensions.get('window').width;
const NOW = new Date(2026, 9, 8, 10, 0);
const TODAY = '2026-10-08';
const wrap = (el: React.ReactElement) => <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  jest.clearAllMocks();
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
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
const tapWord = async (id: string, index: number) => {
  const parsed = id.split(':');
  const size = effectiveGridSize(parsed[2] as 'easy', 'large', width);
  const puzzle = dailyPuzzle(parsed[1], parsed[2] as 'easy', size);
  const cell = cellSizeFor(size, width);
  const span = wordCells(puzzle.words[index], size);
  const tapAt = (n: number) => act(async () => mockGestures.tap.onEnd!({ ...cellCenter({ row: Math.floor(n / size), col: n % size }, cell) }, true));
  await tapAt(span[0]);
  await tapAt(span[span.length - 1]);
  return puzzle;
};

describe('daily puzzle flow (plan F6, §8.6)', () => {
  it('plays today\'s puzzle, counts the streak and shows the daily Complete screen', async () => {
    const id = `daily:${TODAY}:easy`;
    await playScreen(id);
    const puzzle = await tapWord(id, 0);
    for (let i = 1; i < puzzle.words.length; i++) await tapWord(id, i);
    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/complete/[puzzleId]', params: { puzzleId: id } });
    expect(useDaily.getState().daily).toMatchObject({ streak: 1, bestStreak: 1, lastDailyDateKey: TODAY });
    expect(useDaily.getState().daily.completed[TODAY].stars).toBe(3);
    expect(useResult.getState().last).toMatchObject({ isDaily: true, streak: 1, streakCounted: true, dateKey: TODAY });
    const ui = await render(wrap(<Complete />));
    expect(ui.byLabel('1-day streak')).toHaveLength(1);
    expect(ui.texts()).toContain('Come back tomorrow for a new puzzle.');
    expect(ui.texts().join(' ')).toContain("Tomorrow's theme:");
    expect(ui.byLabel('Next puzzle')).toHaveLength(0);
  });

  it('a past day is a catch-up: stars, but the streak is untouched', async () => {
    const id = 'daily:2026-10-05:easy';
    await playScreen(id);
    const puzzle = await tapWord(id, 0);
    for (let i = 1; i < puzzle.words.length; i++) await tapWord(id, i);
    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS);
    });
    expect(useDaily.getState().daily.streak).toBe(0);
    expect(useDaily.getState().daily.completed['2026-10-05']).toBeDefined();
    expect(useResult.getState().last).toMatchObject({ streakCounted: false });
    const ui = await render(wrap(<Complete />));
    expect(ui.texts().join(' ')).toContain('does not change your streak');
  });

  it('a puzzle finished after midnight counts as a catch-up, not today\'s streak', async () => {
    const id = `daily:${TODAY}:easy`;
    await playScreen(id);
    const puzzle = await tapWord(id, 0);
    jest.setSystemTime(new Date(2026, 9, 9, 0, 5));
    for (let i = 1; i < puzzle.words.length; i++) await tapWord(id, i);
    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS);
    });
    expect(useDaily.getState().daily.streak).toBe(0);
    expect(useDaily.getState().daily.completed[TODAY]).toBeDefined();
  });

  it('shows the daily title in the play screen', async () => {
    const ui = await playScreen(`daily:${TODAY}:medium`);
    expect(ui.texts()).toContain('Daily puzzle · Thu, Oct 8');
  });
});

describe('Home daily card and Daily tab', () => {
  it('shows the status of today and plays it at the preferred difficulty', async () => {
    useSettings.getState().update({ difficulty: 'medium' });
    const ui = await render(wrap(<Home />));
    expect(ui.texts()).toContain('Not started');
    await ui.press("Play today's puzzle");
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: `daily:${TODAY}:medium` } });
  });

  it('says in progress, then done, and shows the streak chip', async () => {
    useGame.getState().begin(dailyPuzzle(TODAY, 'easy', 8));
    const ui = await render(wrap(<Home />));
    expect(ui.texts()).toContain('In progress');
    expect(ui.byLabel("Continue today's puzzle").length).toBeGreaterThan(0);
    await cleanup();
    useGame.getState().discard();
    useDaily.getState().complete(TODAY, TODAY, 3);
    const done = await render(wrap(<Home />));
    expect(done.texts()).toContain('Done ✓');
    expect(done.byLabel("Play today's puzzle")).toHaveLength(0);
    expect(done.byLabel('1-day streak')).toHaveLength(1);
  });

  it('hides the streak at zero and after a missed day', async () => {
    let ui = await render(wrap(<Home />));
    expect(ui.byLabel(/-day streak$/)).toHaveLength(0);
    await cleanup();
    useDaily.setState({ daily: { completed: {}, streak: 5, bestStreak: 5, lastDailyDateKey: '2026-10-05', freezes: 0 } });
    ui = await render(wrap(<Home />));
    expect(ui.byLabel(/-day streak$/)).toHaveLength(0);
  });

  it('the Daily tab shows today, streaks, a month with checks, and catch-up days', async () => {
    useDaily.getState().complete('2026-10-07', '2026-10-07', 3);
    useDaily.getState().complete(TODAY, TODAY, 2);
    const ui = await render(wrap(<DailyTab />));
    expect(ui.texts()).toContain('Thursday, October 8');
    expect(ui.texts()).toContain('Done ✓');
    expect(ui.texts()).toContain('Come back tomorrow for a new puzzle.');
    expect(ui.texts()).toContain('2 days');
    expect(ui.byLabel('Wed, Oct 7, completed')).toHaveLength(1);
    expect(ui.byLabel('Mon, Oct 5, not completed')).toHaveLength(1);
    expect(ui.byLabel('Thu, Oct 8, completed')).toHaveLength(1);
    expect(ui.texts()).toContain('October 2026');
    await ui.press('Previous month');
    expect(ui.texts()).toContain('September 2026');
    await ui.press('Next month');
    await ui.press('Next month');
    expect(ui.texts()).toContain('November 2026');
    // catch-up: yesterday (done) is not offered, the day before is
    expect(ui.byLabel('Wed, Oct 7, catch up')).toHaveLength(0);
    await ui.press('Tue, Oct 6, catch up');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'daily:2026-10-06:easy' } });
  });

  it('plays today from the Daily tab and shows a streak freeze', async () => {
    useDaily.setState({ daily: { completed: {}, streak: 7, bestStreak: 9, lastDailyDateKey: '2026-10-07', freezes: 1 } });
    const ui = await render(wrap(<DailyTab />));
    expect(ui.texts()).toContain('7 days');
    expect(ui.texts()).toContain('9 days');
    expect(ui.texts().join(' ')).toContain('1 streak freeze ready');
    await ui.press("Play today's puzzle");
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: `daily:${TODAY}:easy` } });
  });

  it('rolls over to the next day when the date changes while the screen is open', async () => {
    const ui = await render(wrap(<Home />));
    expect(ui.texts().some((t) => /^Thursday, October 8 · \w+/.test(t))).toBe(true);
    await act(async () => {
      useToday.setState({ today: '2026-10-09' });
    });
    expect(ui.texts().some((t) => t.startsWith('Friday, October 9'))).toBe(true);
  });
});

describe('hints (plan F7, §8.5)', () => {
  const id = 'animals:easy:1';
  const hintLabel = (n: number) => `Hint, ${n} left`;

  it('starts with 3 free hints, rings the first letter for 3 seconds, and counts them', async () => {
    const ui = await playScreen(id);
    expect(ui.byLabel(hintLabel(3))).toHaveLength(1);
    await ui.press(hintLabel(3));
    expect(ui.byLabel(hintLabel(2))).toHaveLength(1);
    expect(useGame.getState().current?.hintsUsed).toBe(1);
    const rings = () => ui.root.findAll((n) => n.props.r !== undefined && n.props.fill === 'none' && typeof n.type === 'string');
    expect(rings()).toHaveLength(1);
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(rings()).toHaveLength(0);
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('a second hint on the same word also rings its last letter', async () => {
    const ui = await playScreen(id);
    await ui.press(hintLabel(3));
    await ui.press(hintLabel(2));
    const rings = ui.root.findAll((n) => n.props.r !== undefined && n.props.fill === 'none' && typeof n.type === 'string');
    expect(rings).toHaveLength(2);
  });

  it('three hints cost the third star; four or more leave one star', async () => {
    await playScreen(id);
    useHints.getState().reward();
    for (let i = 0; i < 3; i++) useGame.getState().hint();
    const size = effectiveGridSize('easy', 'large', width);
    const puzzle = levelPuzzle('animals', 'easy', 1, size);
    for (const w of puzzle.words) {
      const out = useGame.getState().select(wordCells(w, size).map((n) => ({ row: Math.floor(n / size), col: n % size })));
      expect(out?.result.kind).toBe('found');
    }
    expect(useGame.getState().finish()?.stars).toBe(1);
  });

  it('offers a video when out of hints, and says so plainly when none is available, with one courtesy hint a day', async () => {
    useHints.setState({ wallet: { free: 0, bonus: 0, resetDateKey: TODAY } });
    const ui = await playScreen(id);
    await ui.press(hintLabel(0));
    expect(ui.texts()).toContain('Out of hints');
    expect(ui.texts()).toContain('Watch a short video for 2 more hints?');
    await ui.press('Watch video'); // no ad is loaded in tests
    expect(ui.texts()).toContain("No video available right now. Here is one hint on us. You'll get 3 free hints tomorrow.");
    expect(useHints.getState().wallet.bonus).toBe(1);
    await ui.press('Done');
    await ui.press(hintLabel(1));
    expect(useGame.getState().current?.hintsUsed).toBe(1);
    // out again: the courtesy hint was used today
    await ui.press(hintLabel(0));
    await ui.press('Watch video');
    expect(ui.texts()).toContain("No video available right now. You'll get 3 free hints tomorrow.");
    expect(useHints.getState().wallet.bonus).toBe(0);
    await ui.press('No thanks').catch(() => undefined);
  });

  it('free hints come back at midnight, bonus hints stay', () => {
    useHints.setState({ wallet: { free: 0, bonus: 4, resetDateKey: '2026-10-07' } });
    expect(useHints.getState().available(TODAY)).toBe(7);
    expect(useHints.getState().wallet).toMatchObject({ free: 3, bonus: 4, resetDateKey: TODAY });
    expect(useHints.getState().spend(TODAY)).toBe(true);
    expect(useHints.getState().wallet.free).toBe(2);
  });

  it('spends nothing and rings nothing when every word is already found', async () => {
    const ui = await playScreen(id);
    expect(useGame.getState().hint()).not.toBeNull();
    const before = useHints.getState().wallet;
    useGame.setState({ current: { ...useGame.getState().current!, puzzle: { ...useGame.getState().current!.puzzle, words: useGame.getState().current!.puzzle.words.map((w) => ({ ...w, found: true })) } } });
    await ui.press(hintLabel(3));
    expect(useHints.getState().wallet).toEqual(before);
  });
});

describe('play menu', () => {
  it('changes the letter size and the colors at once, mid-puzzle', async () => {
    const ui = await playScreen('animals:easy:1');
    await ui.press('Menu');
    await ui.press('Huge');
    expect(useSettings.getState().settings.textSize).toBe('huge');
    await ui.press('High contrast');
    expect(sharedStore.get('theme.mode')).toBe('high-contrast');
    await ui.press('Done');
  });

  it('restarts the puzzle after a confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const ui = await playScreen('animals:easy:1');
    const size = effectiveGridSize('easy', 'large', width);
    const puzzle = levelPuzzle('animals', 'easy', 1, size);
    useGame.getState().select(wordCells(puzzle.words[0], size).map((n) => ({ row: Math.floor(n / size), col: n % size })));
    useGame.getState().hint();
    await ui.press('Menu');
    await ui.press('Restart puzzle');
    expect(alert).toHaveBeenCalledTimes(1);
    await act(async () => alert.mock.calls[0][2]!.find((b) => b.text === 'Restart puzzle')!.onPress!());
    expect(useGame.getState().current!.puzzle.words.every((w) => !w.found)).toBe(true);
    expect(useGame.getState().current!.hintsUsed).toBe(0);
    alert.mockRestore();
  });

  it('shows the optional timer', async () => {
    useSettings.getState().update({ showTimer: true });
    const ui = await playScreen('animals:easy:1');
    expect(ui.byLabel(/^Time \d+:\d\d$/)).toHaveLength(1);
    await act(async () => {
      jest.advanceTimersByTime(65_000);
    });
    expect(ui.byLabel('Time 1:05')).toHaveLength(1);
  });
});

describe('Settings screen (plan F12, §5.6)', () => {
  it('changes text size, selection mode, theme, vibration, difficulty and the timer', async () => {
    const ui = await render(wrap(<SettingsScreen />));
    await ui.press('Extra Large');
    expect(useSettings.getState().settings.textSize).toBe('xlarge');
    await ui.press('Tap only. Tap the first letter, then the last letter.');
    expect(useSettings.getState().settings.selectionMode).toBe('tapOnly');
    await ui.press('Dark');
    expect(sharedStore.get('theme.mode')).toBe('dark');
    await ui.press('Challenging. Bigger puzzles. Words can go in any direction, even backwards.');
    expect(useSettings.getState().settings.difficulty).toBe('hard');
    const toggles = ui.root.findAll((n) => typeof n.props.onValueChange === 'function');
    await act(async () => toggles.find((n) => n.props.accessibilityLabel === 'Show timer')!.props.onValueChange(true));
    expect(useSettings.getState().settings.showTimer).toBe(true);
    await act(async () => toggles.find((n) => n.props.accessibilityLabel === 'Vibration')!.props.onValueChange(false));
    expect(useSettings.getState().settings.haptics).toBe(false);
    expect(ui.texts()).toContain('Version 1.0.0');
    expect(ui.texts()).toContain('Off');
  });

  it('resets progress only after two confirmations, and keeps the settings', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    useProgress.getState().record('animals', 'easy', 1, 3);
    useDaily.getState().complete(TODAY, TODAY, 3);
    useStats.getState().recordSession();
    useSettings.getState().update({ textSize: 'huge' });
    useGame.getState().begin(levelPuzzle('birds', 'easy', 1, 8));
    const ui = await render(wrap(<SettingsScreen />));
    await ui.press('Reset progress');
    expect(alert).toHaveBeenCalledTimes(1);
    alert.mock.calls[0][2]!.find((b) => b.text === 'Cancel')!.onPress?.();
    expect(useProgress.getState().packs.animals).toBeDefined(); // cancel erased nothing
    alert.mock.calls[0][2]!.find((b) => b.text === 'Continue')!.onPress!();
    expect(alert).toHaveBeenCalledTimes(2);
    expect(useProgress.getState().packs.animals).toBeDefined(); // the first step erased nothing either
    alert.mock.calls[1][2]!.find((b) => b.text === 'Erase everything')!.onPress!();
    expect(useProgress.getState().packs).toEqual({});
    expect(useDaily.getState().daily.streak).toBe(0);
    expect(useGame.getState().current).toBeNull();
    expect(useStats.getState().stats.sessions).toBe(0);
    expect(useSettings.getState().settings.textSize).toBe('huge');
    alert.mockRestore();
  });

  it('calls the done callback after a full reset', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const done = jest.fn();
    confirmReset(done);
    alert.mock.calls[0][2]!.find((b) => b.text === 'Continue')!.onPress!();
    alert.mock.calls[1][2]!.find((b) => b.text === 'Erase everything')!.onPress!();
    expect(done).toHaveBeenCalled();
    alert.mockRestore();
  });
});
