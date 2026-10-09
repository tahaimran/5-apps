import '@/testing/stores';
import React from 'react';
import { sharedStore } from '@shared/storage';
import { cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { mockMotion } from '@/testing/mocks';
import { startCategory } from '@/features/play/start';
import { mockParams } from '@/testing/mocks';
import RootLayout from '../../app/_layout';
import Home from '../../app/(tabs)/index';
import Play from '../../app/(tabs)/play';
import Stats from '../../app/(tabs)/stats';
import SettingsTab from '../../app/(tabs)/settings';
import TabsLayout from '../../app/(tabs)/_layout';
import Quiz from '../../app/quiz/[sessionId]';
import ClassicMap from '../../app/classic/[category]';
import { useRound } from '@/store/round';
import { answer } from '@/domain/round';

beforeEach(() => resetApp());
afterEach(async () => {
  await cleanup();
  mockMotion.reduced = true;
  sharedStore.remove('theme.mode');
});

describe('app shell', () => {
  it('renders the root layout with its providers', async () => {
    const ui = await render(<RootLayout />);
    expect(ui.root).toBeTruthy();
  });

  it('renders every tab screen with its title', async () => {
    for (const [Screen, title] of [[Home, 'Quizora'], [Play, 'Play'], [Stats, 'Stats'], [SettingsTab, 'Settings']] as const) {
      const ui = await render(<Screen />);
      expect(ui.texts()).toContain(title);
      await cleanup();
    }
  });

  it('renders the tab bar layout', async () => {
    const ui = await render(<TabsLayout />);
    expect(ui.root).toBeTruthy();
  });
});

describe('dark mode and the largest text', () => {
  it.each(['light', 'dark'] as const)('renders the question screen and an explanation in %s', async (mode) => {
    sharedStore.set('theme.mode', mode);
    const id = startCategory('geography', 2)!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />, { fontScale: 1.3 });
    expect(r.byLabel(/^Answer [ABCD], /)).toHaveLength(4);
    const s = useRound.getState().state!;
    const { act } = require('react');
    await act(async () => useRound.getState().apply((x) => answer(x, x.current.correctIndex)));
    expect(useRound.getState().state!.phase).toBe('answered');
    expect(s).toBeTruthy();
    expect(r.byLabel(/^(Next|See results)$/)).toHaveLength(1);
  });
});

describe('Reduce Motion (plan §7)', () => {
  it.each([true, false])('answers and the level map work with reduced motion = %s', async (reduced) => {
    mockMotion.reduced = reduced;
    const id = startCategory('geography', 2)!;
    mockParams.current = { sessionId: id };
    const quiz = await render(<Quiz />);
    await quiz.press(/^Answer [ABCD], /);
    expect(useRound.getState().state!.phase).toBe('answered');
    await cleanup();
    mockParams.current = { category: 'music' };
    const map = await render(<ClassicMap />);
    expect(map.byLabel(/^Level 1, /)).toHaveLength(1);
  });
});
