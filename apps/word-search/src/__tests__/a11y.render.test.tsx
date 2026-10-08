/**
 * Plan §7.5 and §17: every screen, rendered for real, has labelled controls with 56dp touch
 * targets at the system font scales the QA checklist names (1.3x, 2.0x), in every color mode and
 * at every text size.
 */
import { mockMotion, mockParams } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, flush, isPressable, render } from '@/testing/ui';
import { act } from 'react';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import Home from '../../app/(tabs)/index';
import Daily from '../../app/(tabs)/daily';
import SettingsTab from '../../app/(tabs)/settings';
import TabsLayout from '../../app/(tabs)/_layout';
import Play from '../../app/play/[puzzleId]';
import Complete from '../../app/complete/[puzzleId]';
import Onboarding from '../../app/onboarding';
import PackScreen from '../../app/packs/[packId]';
import { useGame } from '@/store/game';
import { useResult } from '@/store/result';
import { useDaily } from '@/store/daily';
import { HintSheet } from '@/components/HintSheet';
import { MenuSheet } from '@/components/MenuSheet';
import { useProgress } from '@/store/progress';
import { levelPuzzle } from '@/domain/puzzles';
import { useSettings } from '@/store/settings';
import { fontScaleFor, palette, TEXT_SIZES, TOUCH_TARGET } from '@/theme/tokens';

const themed = (el: ReactElement, scale: number) => <ThemeProvider palette={palette} fontScale={scale} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;

beforeEach(() => {
  resetApp();
  mockParams.current = { puzzleId: 'animals:easy:1', packId: 'animals' };
  useResult.getState().set({ puzzleId: 'animals:easy:3', packId: 'animals', difficulty: 'easy', level: 3, isDaily: false, isTutorial: false, stars: 2, wordsFound: 7, elapsedMs: 5000, hintsUsed: 1 });
  useProgress.getState().record('animals', 'easy', 1, 3);
  useProgress.getState().record('animals', 'easy', 2, 2);
  useGame.getState().begin(levelPuzzle('birds', 'easy', 1, 8)); // Home shows the Continue card
  useDaily.getState().complete('2026-10-07', '2026-10-07', 3);
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('theme.mode');
});

const screens: [string, () => ReactElement, boolean][] = [
  ['Home', () => <Home />, false],
  ['Daily', () => <Daily />, false],
  ['Settings', () => <SettingsTab />, false],
  ['Tabs', () => <TabsLayout />, false],
  ['Play', () => <Play />, true],
  ['Hint sheet', () => <HintSheet visible onClose={() => undefined} />, true],
  ['Play menu', () => <MenuSheet visible onClose={() => undefined} />, true],
  ['Complete', () => <Complete />, true],
  ['Pack levels', () => <PackScreen />, true],
];

describe.each([1.3, 2])('font scale %s', (scale) => {
  describe.each(['light', 'dark', 'high-contrast'] as const)('%s mode', (mode) => {
    it.each(screens)('%s', async (_name, make, needsButtons) => {
      sharedStore.set('theme.mode', mode);
      const ui = await render(themed(make(), scale));
      await act(async () => new Promise((r) => setTimeout(r, 20)));
      await flush();
      if (needsButtons) expect(ui.root.findAll(isPressable).length).toBeGreaterThan(0);
      expect(auditPressables(ui.root)).toEqual([]);
    });
  });
});

describe.each([1.3, 2])('onboarding at font scale %s', (scale) => {
  it.each(['welcome', 'letter size', 'how to play'])('%s screen', async (_name) => {
    const ui = await render(themed(<Onboarding />, scale));
    const steps = ['welcome', 'letter size', 'how to play'];
    for (let i = 0; i < steps.indexOf(_name); i++) await ui.press(i === 0 ? "Let's begin" : 'Continue');
    expect(ui.root.findAll(isPressable).length).toBeGreaterThan(0);
    expect(auditPressables(ui.root)).toEqual([]);
  });
});

describe('the tutorial and Reduce Motion', () => {
  afterEach(() => {
    mockMotion.reduced = true;
  });
  it.each([true, false])('renders with reduced motion = %s, with a labelled skip button after 10 s', async (reduced) => {
    mockMotion.reduced = reduced;
    mockParams.current = { puzzleId: 'tutorial' };
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    try {
      const ui = await render(themed(<Play />, 1.3));
      await act(async () => {
        jest.advanceTimersByTime(10_500);
      });
      await flush();
      expect(ui.byLabel('Skip tutorial')).toHaveLength(1);
      expect(auditPressables(ui.root)).toEqual([]);
      // the finger is only a picture: hidden from screen readers and ignores touches
      const hidden = ui.root.findAll((n) => n.props.importantForAccessibility === 'no-hide-descendants' && n.props.pointerEvents === 'none');
      expect(hidden.length).toBeGreaterThan(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('every text size', () => {
  it.each(TEXT_SIZES)('%s: the play screen renders with labelled 56dp controls', async (size) => {
    useSettings.getState().update({ textSize: size });
    const ui = await render(themed(<Play />, fontScaleFor(size)));
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    await flush();
    expect(auditPressables(ui.root)).toEqual([]);
  });
});
