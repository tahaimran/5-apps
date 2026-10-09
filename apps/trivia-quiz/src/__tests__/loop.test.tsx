import '@/testing/stores';
import React from 'react';
import { mockParams, mockRouter, mockNotifState } from '@/testing/mocks';
import { cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { getBank } from '@/content/bank';
import { levelQuestions } from '@/domain/classic';
import { useRound } from '@/store/round';
import { useResult } from '@/store/result';
import { useClassic, useDaily, useProfile, useSeen, useStats, useStreak } from '@/store/stores';
import { startBlitz, startCategory, startClassic, startDaily } from '@/features/play/start';
import { currentDateKey } from '@/store/today';
import Quiz from '../../app/quiz/[sessionId]';
import Results from '../../app/results/[sessionId]';
import ClassicMap from '../../app/classic/[category]';

void mockNotifState;
beforeEach(() => resetApp());
afterEach(cleanup);

/** The text of the answer button that is right for the question on screen. */
const rightLabel = () => {
  const s = useRound.getState().state!;
  return new RegExp(`^Answer [ABCD], ${escape(s.current.question.a[0])}$`);
};
const wrongLabel = () => {
  const s = useRound.getState().state!;
  const wrong = s.current.options.find((_, i) => i !== s.current.correctIndex)!;
  return new RegExp(`^Answer [ABCD], ${escape(wrong)}$`);
};
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function playRound(r: Awaited<ReturnType<typeof render>>, answers: ('right' | 'wrong')[]) {
  for (const a of answers) {
    await r.press(a === 'right' ? rightLabel() : wrongLabel());
    expect(r.byLabel(/^(Next|See results)$/).length).toBeGreaterThan(0); // the explanation is up
    await r.press(/^(Next|See results)$/);
  }
}

describe('a Category round, end to end', () => {
  it('plays 10 questions, shows an explanation after each, stores the result and goes to the results', async () => {
    const id = startCategory('science', 2)!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />);
    expect(r.texts().join(' ')).toContain('1 / 10');
    await playRound(r, ['right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'wrong', 'wrong']);
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/results/[sessionId]', params: { sessionId: id } });
    const res = useResult.getState().last!;
    expect(res).toMatchObject({ mode: 'category', correct: 8, total: 10, stars: 2 });
    expect(useStats.getState().value).toMatchObject({ answered: 10, correct: 8, roundsPlayed: 1 });
    expect(Object.keys(useSeen.getState().value)).toHaveLength(10);
    expect(useProfile.getState().value.xp).toBe(8 * 15);
  });

  it('shows the right answer and the fun fact after a wrong answer', async () => {
    const id = startCategory('history', 1)!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />);
    const q = useRound.getState().state!.current.question;
    await r.press(wrongLabel());
    expect(r.texts().join(' ')).toContain(q.x);
    expect(r.texts().join(' ')).toContain(`The answer is ${q.a[0]}.`);
    expect(r.byLabel(new RegExp(`^Answer [ABCD], ${escape(q.a[0])}, correct$`))).toHaveLength(1);
  });

  it('shows the Results screen with the score, xp and a way home', async () => {
    const id = startCategory('science', 3)!;
    mockParams.current = { sessionId: id };
    const quiz = await render(<Quiz />);
    await playRound(quiz, Array(10).fill('right'));
    await cleanup();
    mockParams.current = { sessionId: id };
    const r = await render(<Results />);
    expect(r.byLabel('10 right out of 10')).toHaveLength(1);
    expect(r.texts().join(' ')).toContain('+200');
    await r.press('Home');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('Classic levels', () => {
  it('3 stars on level 1 unlocks level 2 and keeps the best', async () => {
    const id = startClassic('music', 1)!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />);
    const fixed = levelQuestions(getBank(), 'music', 1).map((q) => q.id);
    expect(useRound.getState().state!.config.questions.map((q) => q.id)).toEqual(fixed);
    await playRound(r, Array(10).fill('right'));
    const p = useClassic.getState().value.music!;
    expect(p).toMatchObject({ unlocked: 2, stars: { 1: 3 } });
    expect(useProfile.getState().value.xp).toBe(10 * 10 + 20);
    expect(useResult.getState().last).toMatchObject({ stars: 3, nextLevel: 2 });
  });

  it('0 stars does not unlock and shows "So close"', async () => {
    const id = startClassic('music', 1)!;
    mockParams.current = { sessionId: id };
    const quiz = await render(<Quiz />);
    await playRound(quiz, Array(10).fill('wrong'));
    expect(useClassic.getState().value.music).toMatchObject({ unlocked: 1, stars: { 1: 0 } });
    await cleanup();
    mockParams.current = { sessionId: id };
    const r = await render(<Results />);
    expect(r.texts().join(' ')).toContain('So close!');
    expect(r.texts().join(' ')).toContain('You need 5 to pass');
  });

  it('shows the map: current level, locked levels and a toast when a locked one is tapped', async () => {
    mockParams.current = { category: 'geography' };
    const r = await render(<ClassicMap />);
    expect(r.byLabel(/^Level 1, Easy, 0 stars$/)).toHaveLength(1);
    expect(r.byLabel('Level 2, locked')).toHaveLength(1);
    await r.press('Level 2, locked');
    expect(r.byLabel('Get 1 star on level 1 first').length).toBeGreaterThan(0);
    await r.press(/^Level 1, Easy/);
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
  });

  it('level 21 has three hearts and the round ends when they are gone', async () => {
    useClassic.setState({ value: { science: { stars: {}, unlocked: 30, bestScores: {} } } });
    const id = startClassic('science', 21)!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />);
    expect(r.byLabel('3 hearts left')).toHaveLength(1);
    await playRound(r, ['wrong', 'wrong']);
    await r.press(wrongLabel());
    await r.press('See results'); // out of hearts: the continue offer opens first
    await r.press('End level');
    expect(useResult.getState().last).toMatchObject({ failedByHearts: true, stars: 0 });
  });
});

describe('Timed Blitz', () => {
  it('has no per-question ring text beyond the 60 s clock, counts right answers and ends on the clock', async () => {
    jest.useFakeTimers();
    try {
      const id = startBlitz()!;
      mockParams.current = { sessionId: id };
      const r = await render(<Quiz />);
      expect(r.byLabel(/seconds left/).length).toBe(1);
      await playRound(r, ['right', 'right', 'wrong']);
      expect(r.texts().join(' ')).toContain('2 right');
      const { act } = require('react');
      await act(async () => {
        jest.advanceTimersByTime(70_000);
      });
      expect(useResult.getState().last).toMatchObject({ mode: 'blitz', correct: 2, newBest: true });
      expect(useStats.getState().value.blitzBest).toBe(2);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('Daily Challenge', () => {
  it('plays the 10 questions of the day once, records the streak and routes to the daily result', async () => {
    const id = startDaily()!;
    mockParams.current = { sessionId: id };
    const r = await render(<Quiz />);
    expect(r.byLabel(/^50\/50/)).toHaveLength(0); // only Skip in the Daily
    expect(r.byLabel(/^Skip, 1 left$/)).toHaveLength(1);
    await playRound(r, ['right', 'right', 'right', 'right', 'right', 'right', 'right', 'wrong', 'wrong', 'wrong']);
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/daily/result', params: { sessionId: id } });
    const today = currentDateKey();
    expect(useDaily.getState().value).toMatchObject({ lastPlayedDate: today, lastScore: 7 });
    expect(useStreak.getState().value).toMatchObject({ current: 1, lastDate: today });
    expect(Object.keys(useSeen.getState().value)).toHaveLength(0); // the Daily leaves the seen map alone
    expect(useProfile.getState().value.xp).toBeGreaterThanOrEqual(30);
  });
});
