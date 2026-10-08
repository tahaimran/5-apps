import { mockGestures, mockParams, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { Dimensions, PixelRatio } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { wordCells } from '@/domain/generator';
import { cellSizeFor } from '@/domain/gridSize';
import { tutorialPuzzle } from '@/domain/puzzles';
import { cellCenter } from '@/domain/selection';
import { startAds } from '@/ads/start';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { palette, TOUCH_TARGET } from '@/theme/tokens';
import Complete from '../../app/complete/[puzzleId]';
import Index from '../../app/index';
import Onboarding from '../../app/onboarding';
import Play, { CELEBRATION_MS, TUTORIAL_SKIP_MS } from '../../app/play/[puzzleId]';

jest.mock('@/ads/start', () => ({ startAds: jest.fn(() => Promise.resolve()) }));

const width = Dimensions.get('window').width;
const wrap = (el: React.ReactElement) => <ThemeProvider palette={palette} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;
const COACH = 'Slide your finger across C-A-T to find the word. Or tap C, then tap T.';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 10, 0), doNotFake: ['nextTick', 'setImmediate'] });
  resetApp();
  jest.clearAllMocks();
  // The jest environment reports a font scale of 2; the app's default is judged against a normal phone.
  jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1);
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
  sharedStore.remove('onboarding.completedAt');
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const settle = async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
  await flush();
};

describe('setup screens (plan §6 screens 1 to 3)', () => {
  it('walks welcome → letter size → how to play, then opens the tutorial with the choices saved', async () => {
    const ui = await render(wrap(<Onboarding />));
    expect(ui.texts()).toContain('Welcome to Word Search');
    expect(ui.texts()).toContain('Big, clear letters. No timers. Play anytime, even without internet.');
    expect(ui.byLabel('Skip')).toHaveLength(0); // no Skip on the welcome screen
    await ui.press("Let's begin");

    expect(ui.texts()).toContain('Choose a comfortable letter size');
    expect(ui.byLabel('Large. Recommended').length).toBe(1);
    expect(ui.byLabel('Skip').length).toBe(1);
    await ui.press('Huge');
    const toggle = ui.root.findAll((n) => typeof n.props.onValueChange === 'function' && n.props.accessibilityLabel === 'High-contrast colors')[0];
    await act(async () => toggle.props.onValueChange(true));
    await ui.press('Continue');

    expect(ui.texts()).toContain('How would you like to play?');
    for (const label of ['Relaxed. Smaller puzzles. Words go across and down.', 'Classic. Words can also go diagonally.', 'Challenging. Bigger puzzles. Words can go in any direction, even backwards.']) {
      expect(ui.byLabel(label)).toHaveLength(1);
    }
    expect(ui.texts()).toContain('Not sure? Start with Relaxed — you can switch anytime.');
    await ui.press('Classic. Words can also go diagonally.');
    await ui.press('Start my first puzzle');
    await settle();

    expect(useSettings.getState().settings).toMatchObject({ textSize: 'huge', difficulty: 'medium' });
    expect(sharedStore.get('theme.mode')).toBe('high-contrast');
    expect(sharedStore.get('onboarding.completedAt')).toBeGreaterThan(0);
    expect(db.get('onboarding.resume')).toBeUndefined();
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'tutorial' } });
  });

  it('Skip on the size screen applies Large text and Easy and still goes to the tutorial', async () => {
    const ui = await render(wrap(<Onboarding />));
    await ui.press("Let's begin");
    await ui.press('Skip');
    await settle();
    expect(useSettings.getState().settings).toMatchObject({ textSize: 'large', difficulty: 'easy' });
    expect(sharedStore.get('theme.mode')).toBeUndefined();
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'tutorial' } });
  });

  it('preselects Extra Large when the phone font size is 1.3x or more', async () => {
    jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.4);
    const ui = await render(wrap(<Onboarding />));
    await ui.press("Let's begin");
    expect(ui.byLabel('Extra Large').length).toBe(1);
    await ui.press('Continue');
    await ui.press('Start my first puzzle');
    await settle();
    expect(useSettings.getState().settings.textSize).toBe('xlarge');
  });

  it('asks for consent (starts the ads) before the tutorial opens, not after', async () => {
    const order: string[] = [];
    (startAds as jest.Mock).mockImplementationOnce(async () => {
      order.push('consent');
    });
    mockRouter.replace.mockImplementationOnce(() => order.push('tutorial'));
    const ui = await render(wrap(<Onboarding />));
    await ui.press("Let's begin");
    await ui.press('Continue');
    expect(startAds).not.toHaveBeenCalled(); // nothing is requested while the setup screens are open
    await ui.press('Start my first puzzle');
    await settle();
    expect(order).toEqual(['consent', 'tutorial']);
  });

  it('killed in the middle, it comes back on the same screen with the answers so far', async () => {
    const first = await render(wrap(<Onboarding />));
    await first.press("Let's begin");
    await first.press('Extra Large');
    await act(async () => first.unmount());
    expect(db.get('onboarding.resume')?.index).toBe(1);
    const again = await render(wrap(<Onboarding />));
    expect(again.texts()).toContain('Choose a comfortable letter size');
    const selected = again.root.findAll((n) => n.props.accessibilityLabel === 'Extra Large' && n.props.accessibilityState?.selected === true);
    expect(selected.length).toBeGreaterThan(0);
  });

  it('lets Back return to an earlier screen', async () => {
    const ui = await render(wrap(<Onboarding />));
    await ui.press("Let's begin");
    await ui.press('Back');
    expect(ui.texts()).toContain('Welcome to Word Search');
  });
});

describe('where the app opens', () => {
  it('first launch: setup; after setup: the tutorial; after the tutorial: Home', async () => {
    const hrefOf = async () => {
      const ui = await render(<Index />);
      const href = ui.root.findAll((n) => (n.type as unknown) === 'Redirect')[0].props.href;
      await cleanup();
      return href;
    };
    expect(await hrefOf()).toBe('/onboarding');
    sharedStore.set('onboarding.completedAt', Date.now());
    expect(await hrefOf()).toEqual({ pathname: '/play/[puzzleId]', params: { puzzleId: 'tutorial' } });
    db.set('onboarding.tutorialDone', true);
    expect(await hrefOf()).toBe('/(tabs)');
  });
});

describe('tutorial puzzle (plan §6 screen 5)', () => {
  const play = async () => {
    mockParams.current = { puzzleId: 'tutorial' };
    const ui = await render(wrap(<Play />));
    await settle();
    return ui;
  };
  const tapWord = async (word: string) => {
    const puzzle = tutorialPuzzle();
    const cell = cellSizeFor(puzzle.size, width);
    const w = puzzle.words.find((x) => x.word === word)!;
    const span = wordCells(w, puzzle.size);
    const tapAt = (n: number) => act(async () => mockGestures.tap.onEnd!({ ...cellCenter({ row: Math.floor(n / puzzle.size), col: n % puzzle.size }, cell) }, true));
    await tapAt(span[0]);
    await tapAt(span[span.length - 1]);
  };

  it('is the 6x6 grid with CAT, DOG, COW and HEN and a coach mark, and grants one bonus hint', async () => {
    const ui = await play();
    expect(ui.texts()).toContain('Your first puzzle');
    expect(ui.texts()).toContain(COACH);
    for (const w of ['CAT', 'DOG', 'COW', 'HEN']) expect(ui.texts()).toContain(w);
    expect(useGame.getState().current?.puzzle.size).toBe(6);
    expect(useHints.getState().wallet.bonus).toBe(1);
    expect(ui.byLabel('Hint, 4 left')).toHaveLength(1);
  });

  it('hides the coach mark at the first touch', async () => {
    const ui = await play();
    await act(async () => mockGestures.pan.onStart!({ x: 10, y: 10 }));
    expect(ui.texts()).not.toContain(COACH);
  });

  it('says "You found it!" after the first word', async () => {
    const ui = await play();
    await tapWord('CAT');
    expect(ui.texts()).toContain('You found it! Find the other 3 words.');
    expect(ui.texts()).not.toContain(COACH);
    await act(async () => {
      jest.advanceTimersByTime(4100);
    });
    expect(ui.texts()).not.toContain('You found it! Find the other 3 words.');
  });

  it('offers "Skip tutorial" only after 10 seconds, and skipping ends onboarding', async () => {
    const ui = await play();
    expect(ui.byLabel('Skip tutorial')).toHaveLength(0);
    await act(async () => {
      jest.advanceTimersByTime(TUTORIAL_SKIP_MS);
    });
    expect(ui.byLabel('Skip tutorial')).toHaveLength(1);
    await ui.press('Skip tutorial');
    expect(db.get('onboarding.tutorialDone')).toBe(true);
    expect(useGame.getState().current).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('finishing it ends onboarding and the next puzzle is Animals level 1 at the chosen difficulty', async () => {
    useSettings.getState().update({ difficulty: 'medium' });
    await play();
    for (const w of ['CAT', 'DOG', 'COW', 'HEN']) await tapWord(w);
    await act(async () => {
      jest.advanceTimersByTime(CELEBRATION_MS);
    });
    expect(db.get('onboarding.tutorialDone')).toBe(true);
    expect(useResult.getState().last?.isTutorial).toBe(true);
    const ui = await render(wrap(<Complete />));
    expect(ui.texts()).toContain("Wonderful! You're all set.");
    expect(ui.byLabel(/stars? out of 3/)).toHaveLength(0);
    await ui.press('Play the next puzzle');
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/play/[puzzleId]', params: { puzzleId: 'animals:medium:1' } });
  });

  it('does not end onboarding before the last word is found', async () => {
    await play();
    await tapWord('CAT');
    expect(db.get('onboarding.tutorialDone')).toBeUndefined();
  });

  it('resumes the same tutorial after a kill without a second bonus hint', async () => {
    const ui = await play();
    await tapWord('CAT');
    await act(async () => ui.unmount());
    useGame.setState({ current: db.get('current') ?? null, activeSince: null });
    const again = await play();
    expect(again.byLabel('Cat, found')).toHaveLength(1);
    expect(useHints.getState().wallet.bonus).toBe(1);
  });
});
