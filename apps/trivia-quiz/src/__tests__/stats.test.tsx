import '@/testing/stores';
import React from 'react';
import { cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { useDaily, useProfile, useStats, useStreak } from '@/store/stores';
import Stats from '../../app/(tabs)/stats';

beforeEach(() => resetApp());
afterEach(cleanup);

describe('Stats', () => {
  it('shows the empty state before any round', async () => {
    const r = await render(<Stats />);
    expect(r.texts().join(' ')).toContain('Play a round to see your stats.');
    expect(r.byLabel(/^Questions answered/)).toHaveLength(0);
  });

  it('shows totals, accuracy, best streak, Blitz best and accuracy per category', async () => {
    useStats.getState().update({
      answered: 40,
      correct: 30,
      roundsPlayed: 5,
      blitzBest: 14,
      byCategory: { ...useStats.getState().value.byCategory, music: { a: 10, c: 9 }, flags: { a: 4, c: 1 } },
    });
    useStreak.getState().update({ best: 12 });
    useProfile.getState().update({ xp: 320 });
    const r = await render(<Stats />);
    expect(r.byLabel('Questions answered: 40')).toHaveLength(1);
    expect(r.byLabel('Accuracy: 75%')).toHaveLength(1);
    expect(r.byLabel('Best streak: 12')).toHaveLength(1);
    expect(r.byLabel('Blitz best: 14')).toHaveLength(1);
    expect(r.byLabel('Total XP: 320')).toHaveLength(1);
    expect(r.byLabel('Music: 90% of 10')).toHaveLength(1);
    expect(r.byLabel('Flags: 25% of 4')).toHaveLength(1);
    expect(r.byLabel('Food: No answers yet')).toHaveLength(1);
    expect(r.texts().join(' ')).toContain('Level 2 · Curious');
  });

  it('is not empty once a Daily was played, even with no other answers', async () => {
    useDaily.getState().update({ history: [{ date: '2026-10-08', score: 7 }] });
    const r = await render(<Stats />);
    expect(r.texts().join(' ')).not.toContain('Play a round to see your stats.');
  });
});
