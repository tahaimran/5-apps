import { defaultProgress } from '../defaults';
import { addFreeze, evaluateDays, liveProgress } from '../streak';
import type { DaySummary, PlantProgress } from '../types';

const reached = (d: string): DaySummary => ({ dayKey: d, effectiveMl: 2300, goalMl: 2000, count: 5, reached: true });
const missed = (d: string): DaySummary => ({ dayKey: d, effectiveMl: 900, goalMl: 2000, count: 2, reached: false });
const sums = (...list: DaySummary[]) => Object.fromEntries(list.map((s) => [s.dayKey, s]));
const start = (over: Partial<PlantProgress> = {}): PlantProgress => ({ ...defaultProgress('2026-10-01'), ...over });

describe('evaluateDays (plan §8.6)', () => {
  it('adds a reached day to the streak and goal days', () => {
    const r = evaluateDays(start(), sums(reached('2026-10-02')), '2026-10-03');
    expect(r.progress).toMatchObject({ streak: 1, goalDays: 1, bestStreak: 1, stage: 1, lastEvaluatedDay: '2026-10-02' });
  });
  it('never evaluates today', () => {
    const r = evaluateDays(start({ lastEvaluatedDay: '2026-10-02' }), sums(reached('2026-10-03')), '2026-10-03');
    expect(r.progress.streak).toBe(0);
    expect(r.progress.lastEvaluatedDay).toBe('2026-10-02');
  });
  it('resets the streak on a missed day and keeps the best', () => {
    const r = evaluateDays(
      start(),
      sums(reached('2026-10-02'), reached('2026-10-03'), missed('2026-10-04'), reached('2026-10-05')),
      '2026-10-06',
    );
    expect(r.progress).toMatchObject({ streak: 1, bestStreak: 2, goalDays: 3 });
  });
  it('treats a day without any log as missed', () => {
    const r = evaluateDays(start({ streak: 3, bestStreak: 3 }), {}, '2026-10-03');
    expect(r.progress.streak).toBe(0);
    expect(r.progress.bestStreak).toBe(3);
  });
  it('spends a freeze on a missed day and keeps the streak', () => {
    const r = evaluateDays(start({ streak: 5, bestStreak: 5, streakFreezes: 1, lastEvaluatedDay: '2026-10-02' }), {}, '2026-10-04');
    expect(r.progress).toMatchObject({ streak: 5, streakFreezes: 0 });
    expect(r.freezeDays).toEqual(['2026-10-03']);
  });
  it('spends one freeze per missed day, then resets', () => {
    const r = evaluateDays(start({ streak: 5, streakFreezes: 1, lastEvaluatedDay: '2026-10-02' }), {}, '2026-10-05');
    expect(r.freezeDays).toEqual(['2026-10-03']);
    expect(r.progress.streak).toBe(0);
  });
  it('does not waste a freeze when there is no streak to keep', () => {
    const r = evaluateDays(start({ streak: 0, streakFreezes: 1 }), {}, '2026-10-03');
    expect(r.progress.streakFreezes).toBe(1);
    expect(r.freezeDays).toEqual([]);
  });
  it('does not change anything when the day was already evaluated', () => {
    const p = start({ lastEvaluatedDay: '2026-10-02' });
    expect(evaluateDays(p, {}, '2026-10-03').progress).toBe(p);
  });
  it('is stable if the clock moves backwards', () => {
    const p = start({ lastEvaluatedDay: '2026-10-09' });
    expect(evaluateDays(p, {}, '2026-10-03').progress).toBe(p);
  });
  it('walks the plant to the next stage at 4 and 10 goal days and never back', () => {
    const days = Array.from({ length: 10 }, (_, i) => reached(`2026-10-${String(i + 2).padStart(2, '0')}`));
    const r = evaluateDays(start(), sums(...days), '2026-10-12');
    expect(r.progress).toMatchObject({ goalDays: 10, stage: 3, streak: 10 });
    const after = evaluateDays(r.progress, {}, '2026-10-20');
    expect(after.progress.stage).toBe(3);
    expect(after.progress.goalDays).toBe(10);
  });
  it('resets after a very long absence without looping forever', () => {
    const r = evaluateDays(start({ streak: 9, lastEvaluatedDay: '2020-01-01' }), {}, '2026-10-03');
    expect(r.progress.streak).toBe(0);
    expect(r.progress.lastEvaluatedDay).toBe('2026-10-02');
  });
});

describe('liveProgress', () => {
  it('counts today once the goal is reached', () => {
    const p = start({ streak: 2, bestStreak: 2, goalDays: 3, stage: 2 });
    expect(liveProgress(p, false)).toBe(p);
    expect(liveProgress(p, true)).toMatchObject({ streak: 3, bestStreak: 3, goalDays: 4, stage: 2 });
  });
  it('can lift the stage the moment today completes it', () => {
    expect(liveProgress(start({ goalDays: 3, stage: 1 }), true).stage).toBe(2);
  });
});

describe('addFreeze', () => {
  it('caps at two', () => {
    const one = addFreeze(start());
    expect(one.streakFreezes).toBe(1);
    expect(addFreeze(addFreeze(one)).streakFreezes).toBe(2);
  });
});
