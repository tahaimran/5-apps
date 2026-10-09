import '@/testing/stores';
import React from 'react';
import { mockParams } from '@/testing/mocks';
import { auditPressables, cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { commitRound } from '@/features/play/commit';
import { startBlitz, startCategory, startClassic, startDaily, startWarmup } from '@/features/play/start';
import { useRound } from '@/store/round';
import { useSettings } from '@/store/settings';
import { answer, next } from '@/domain/round';
import Home from '../../app/(tabs)/index';
import Play from '../../app/(tabs)/play';
import ClassicCategories from '../../app/classic/index';
import ClassicMap from '../../app/classic/[category]';
import CategoryPicker from '../../app/category';
import Quiz from '../../app/quiz/[sessionId]';
import Results from '../../app/results/[sessionId]';
import DailyResult from '../../app/daily/result';
import { StatsContent } from '../../app/(tabs)/stats';

beforeEach(() => resetApp());
afterEach(cleanup);

const SCALES = [0.9, 1, 1.3] as const;

/** Plays the round in the store to its end and commits it, as the quiz screen does. */
function finish(id: string) {
  const store = useRound.getState();
  let s = store.state!;
  while (s.phase !== 'done') {
    s = s.phase === 'question' ? answer(s, s.current.correctIndex) : next(s);
  }
  commitRound(id, s, 60_000);
}

describe.each(SCALES)('touch targets and labels at text size %s', (scale) => {
  const audit = async (el: React.ReactElement) => {
    const r = await render(el, { fontScale: scale });
    expect(auditPressables(r.root)).toEqual([]);
    return r;
  };

  it('Home, Play, the category lists and the level map', async () => {
    useSettings.getState().update({ textScale: scale });
    await audit(<Home />);
    await cleanup();
    await audit(<Play />);
    await cleanup();
    await audit(<ClassicCategories />);
    await cleanup();
    await audit(<CategoryPicker />);
    await cleanup();
    mockParams.current = { category: 'food' };
    await audit(<ClassicMap />);
  });

  it('the question screen before and after an answer, with lifelines', async () => {
    const id = startClassic('animals', 1)!;
    mockParams.current = { sessionId: id };
    const r = await audit(<Quiz />);
    await r.press(/^Answer [ABCD], /);
    expect(auditPressables(r.root)).toEqual([]);
  });

  it('answer buttons are at least 56dp tall (plan §7)', async () => {
    const id = startClassic('animals', 1)!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />, { fontScale: scale });
    const { StyleSheet } = require('react-native') as typeof import('react-native');
    const buttons = r.root.findAll((n) => typeof n.props.testID === 'string' && /^answer-\d$/.test(n.props.testID) && typeof n.props.onPress === 'function');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
    for (const b of buttons) expect(StyleSheet.flatten(b.props.style).minHeight).toBeGreaterThanOrEqual(56);
  });

  it('the results, the daily result and the stats', async () => {
    const id = startCategory('music', 2)!;
    finish(id);
    mockParams.current = { sessionId: id };
    await audit(<Results />);
    await cleanup();
    const daily = startDaily()!;
    finish(daily);
    await audit(<DailyResult />);
    await cleanup();
    await audit(<StatsContent />);
  });
});

describe('every round mode builds a question screen that can be read aloud', () => {
  it.each([
    ['classic', () => startClassic('science', 4)],
    ['category', () => startCategory('flags', 3)],
    ['blitz', () => startBlitz()],
    ['daily', () => startDaily()],
    ['warmup', () => startWarmup()],
  ] as const)('%s', async (_name, start) => {
    const id = start()!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />);
    expect(r.byLabel(/^Answer [ABCD], /)).toHaveLength(4);
    expect(auditPressables(r.root)).toEqual([]);
  });
});
