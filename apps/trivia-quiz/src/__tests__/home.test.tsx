import '@/testing/stores';
import React from 'react';
import * as Sharing from 'expo-sharing';
import { mockParams, mockRouter } from '@/testing/mocks';
import { cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { dateKeyFor, addDays } from '@/domain/dateKey';
import { recordDaily } from '@/domain/daily';
import { completeDailyStreak } from '@/domain/streak';
import { defaultStreak } from '@/domain/defaults';
import { getBank } from '@/content/bank';
import { poolOf } from '@/domain/bank';
import { useResult } from '@/store/result';
import { useRound } from '@/store/round';
import { useDaily, useProfile, useSeen, useStreak } from '@/store/stores';
import { useToday } from '@/store/today';
import Home from '../../app/(tabs)/index';
import DailyEntry from '../../app/daily/index';
import DailyResult from '../../app/daily/result';
import CategoryPicker from '../../app/category';
import { dailyCard, formatCountdown } from '@/features/home/status';

const NOON = new Date(2026, 9, 8, 12, 0);
beforeEach(() => {
  resetApp(NOON);
  jest.useFakeTimers({ now: NOON });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

const today = () => dateKeyFor(NOON);
const playedStreak = (days: number) => {
  let s = defaultStreak();
  for (let i = days; i >= 1; i--) s = completeDailyStreak(s, addDays(today(), -i), NOON.getTime() - i * 86_400_000, 0).state;
  return s;
};

describe('Home', () => {
  it('first day: "Start your streak today", a Play button and no streak chip', async () => {
    const r = await render(<Home />);
    expect(r.texts().join(' ')).toContain('Start your streak today.');
    expect(r.texts().join(' ')).toContain('10 questions · about 2 minutes');
    expect(r.byLabel(/day streak$/)).toHaveLength(0);
    await r.press("Play today's challenge");
    expect(mockRouter.push).toHaveBeenCalledWith('/daily');
  });

  it('daily not played with a streak: names the streak and shows the chip', async () => {
    useStreak.setState({ value: playedStreak(4) });
    const r = await render(<Home />);
    expect(r.texts().join(' ')).toContain('Keep your 4-day streak going.');
    expect(r.byLabel('4 day streak')).toHaveLength(1);
  });

  it('daily played: shows the score and the time until the next one, with a result button', async () => {
    useDaily.setState({ value: recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, today(), 8) });
    const r = await render(<Home />);
    expect(r.texts().join(' ')).toContain('Today: 8 out of 10');
    expect(r.texts().join(' ')).toContain('Come back in 12h 0m for a new one.');
    await r.press("See today's result");
    expect(mockRouter.push).toHaveBeenCalledWith('/daily/result');
  });

  it('shows the amber streak-at-risk card after 18:00 only, and not once the Daily is played', async () => {
    useStreak.setState({ value: playedStreak(3) });
    let r = await render(<Home />);
    expect(r.texts().join(' ')).not.toContain('ends at midnight');
    await cleanup();
    jest.setSystemTime(new Date(2026, 9, 8, 19, 30));
    r = await render(<Home />);
    expect(r.texts().join(' ')).toContain('Your 3-day streak ends at midnight.');
  });

  it('shows the level bar and a Continue card for the first favourite category', async () => {
    useProfile.getState().update({ xp: 150, favoriteCategories: ['geography'] });
    const r = await render(<Home />);
    expect(r.texts().join(' ')).toContain('Level 2 · Curious');
    expect(r.texts().join(' ')).toContain('Geography, level 1');
    await r.press('Play level');
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
  });

  it('rolls over to the new day when today changes', async () => {
    useDaily.setState({ value: recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, today(), 8) });
    const r = await render(<Home />);
    expect(r.texts().join(' ')).toContain('Today: 8 out of 10');
    const { act } = require('react');
    await act(async () => {
      useToday.setState({ today: addDays(today(), 1) });
    });
    expect(r.texts().join(' ')).toContain("Play today's challenge");
  });
});

describe('Daily entry and result', () => {
  it('starts today\'s challenge from the deep link when it is not played yet', async () => {
    await render(<DailyEntry />);
    expect(useRound.getState().state?.config.mode).toBe('daily');
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
  });

  it('shows the result instead when it is already played', async () => {
    useDaily.setState({ value: recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, today(), 6) });
    const r = await render(<DailyEntry />);
    expect(r.root.findAll((n) => (n.type as unknown) === 'Redirect').map((n) => n.props.href)).toEqual(['/daily/result']);
    expect(useRound.getState().state).toBeNull();
  });

  it('shows score, streak, the 7-day strip and shares an image', async () => {
    let daily = recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, addDays(today(), -1), 7);
    daily = recordDaily(daily, today(), 9);
    useDaily.setState({ value: daily });
    useStreak.setState({ value: completeDailyStreak(playedStreak(1), today(), NOON.getTime(), 0).state });
    const r = await render(<DailyResult />);
    expect(r.byLabel('9 right out of 10')).toHaveLength(1);
    expect(r.byLabel('2 day streak')).toHaveLength(1);
    expect(r.byLabel(/: played, 9 out of 10$/)).toHaveLength(1);
    expect(r.byLabel(/: not played$/)).toHaveLength(5);
    await r.press('Share');
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/share.png', expect.anything());
  });

  it('says what happened with a freeze or a time-zone change, and what XP was earned', async () => {
    useDaily.setState({ value: recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, today(), 5) });
    useResult.setState({ last: { id: 'x', mode: 'daily', date: today(), correct: 5, total: 10, score: 1, stars: 1, failedByHearts: false, accuracy: 0.5, elapsedMs: 1, relaxed: false, xp: 105, baseXp: 105, doubled: false, levelBefore: 1, levelAfter: 1, newBest: false, nextLevel: null, streakCounted: true, freezeUsed: true, freezeEarned: true, blockedByTimeZone: true } });
    const r = await render(<DailyResult />);
    const text = r.texts().join(' ');
    expect(text).toContain('A streak freeze covered your missed day.');
    expect(text).toContain('You earned a streak freeze.');
    expect(text).toContain('time zone changed');
    expect(text).toContain('+105 XP');
  });

  it('offers the reminder once more after the first 3-day streak, and never a second time', async () => {
    const { db } = require('@/store/storage');
    db.set('reminderAsk', { declinedAt: 5, reaskedAt: 0 });
    useDaily.setState({ value: recordDaily({ lastPlayedDate: null, lastScore: 0, history: [] }, today(), 8) });
    useStreak.setState({ value: { ...playedStreak(2), current: 3, lastDate: today() } });
    useResult.setState({ last: { id: 'x', mode: 'daily', date: today(), correct: 8, total: 10, score: 1, stars: 2, failedByHearts: false, accuracy: 0.8, elapsedMs: 1, relaxed: false, xp: 110, baseXp: 110, doubled: false, levelBefore: 1, levelAfter: 1, newBest: false, nextLevel: null, streak: 3, streakCounted: true } });
    let r = await render(<DailyResult />);
    expect(r.texts().join(' ')).toContain('Keep your streak alive');
    expect(db.get('reminderAsk').reaskedAt).toBeGreaterThan(0);
    await cleanup();
    r = await render(<DailyResult />);
    expect(r.texts().join(' ')).not.toContain('Keep your streak alive');
  });

  it('goes home when the Daily is not played', async () => {
    const r = await render(<DailyResult />);
    expect(r.root.findAll((n) => (n.type as unknown) === 'Redirect').map((n) => n.props.href)).toEqual(['/(tabs)']);
  });
});

describe('Category picker', () => {
  it('warns when about 90% of a category and difficulty were seen', async () => {
    mockParams.current = {};
    const pool = poolOf(getBank(), 'general', 2);
    const r = await render(<CategoryPicker />);
    expect(r.texts().join(' ')).not.toContain('about 90%');
    const { act } = require('react');
    await act(async () => {
      useSeen.setState({ value: Object.fromEntries(pool.slice(0, 92).map((q) => [q.id, { d: 1, n: 1, c: 1 }])) });
    });
    expect(r.texts().join(' ')).toContain('about 90%');
  });

  it('starts a round in the chosen category and difficulty', async () => {
    const r = await render(<CategoryPicker />);
    await r.press(/^Sports\./);
    await r.press('Hard');
    await r.press('Start round');
    const cfg = useRound.getState().state!.config;
    expect(cfg).toMatchObject({ mode: 'category', category: 'sports', difficulty: 3 });
  });
});

describe('Home status helpers', () => {
  it('builds the card state', () => {
    const card = dailyCard({ lastPlayedDate: today(), lastScore: 7, history: [{ date: today(), score: 7 }] }, defaultStreak(), today(), NOON);
    expect(card).toMatchObject({ state: 'played', score: 7, atRisk: false, firstDay: false });
    expect(formatCountdown(7 * 3_600_000 + 12 * 60_000)).toEqual({ hours: 7, minutes: 12 });
    expect(formatCountdown(-5)).toEqual({ hours: 0, minutes: 0 });
  });
});
