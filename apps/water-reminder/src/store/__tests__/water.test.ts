import '@/testing/mocks';
import { addDays } from '@/domain/dayKey';
import { resetApp } from '@/testing/stores';
import { useSettings } from '../settings';
import { db } from '../storage';
import { useWater } from '../water';

const at = (d: number, h: number, mi = 0, mo = 10) => new Date(2026, mo - 1, d, h, mi).getTime();
const water = () => useWater.getState();

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 12, 0), doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(new Date(2026, 9, 8, 12, 0));
});
afterEach(() => jest.useRealTimers());

describe('logDrink', () => {
  it('records the drink on the right day and sums the day', () => {
    const r = water().logDrink({ volumeMl: 250, ts: at(8, 9) });
    expect(r.entry).toMatchObject({ dayKey: '2026-10-08', volumeMl: 250, effectiveMl: 250, beverage: 'water', source: 'app' });
    expect(r.entry.id.startsWith('2026-10-08_')).toBe(true);
    expect(r.summary).toMatchObject({ effectiveMl: 250, count: 1, reached: false, goalMl: 2000 });
    water().logDrink({ volumeMl: 500, ts: at(8, 10) });
    expect(water().summaries['2026-10-08']).toMatchObject({ effectiveMl: 750, count: 2 });
  });
  it('applies the beverage factor', () => {
    const r = water().logDrink({ volumeMl: 250, beverage: 'coffee' });
    expect(r.entry.effectiveMl).toBe(200);
    expect(r.entry.volumeMl).toBe(250);
  });
  it('counts a 01:30 drink for yesterday (wake 07:00)', () => {
    const r = water().logDrink({ volumeMl: 250, ts: at(8, 1, 30) });
    expect(r.entry.dayKey).toBe('2026-10-07');
    expect(water().summaries['2026-10-07'].effectiveMl).toBe(250);
    expect(water().summaries['2026-10-08']).toBeUndefined();
  });
  it('flags the drink that reaches the goal, once', () => {
    expect(water().logDrink({ volumeMl: 1500 }).reachedNow).toBe(false);
    const reaching = water().logDrink({ volumeMl: 500 });
    expect(reaching.reachedNow).toBe(true);
    expect(reaching.summary.reached).toBe(true);
    expect(water().logDrink({ volumeMl: 250 }).reachedNow).toBe(false);
  });
  it('keeps notification and widget sources', () => {
    expect(water().logDrink({ volumeMl: 250, source: 'notification' }).entry.source).toBe('notification');
  });
  it('shards logs by month and lists a day', () => {
    water().logDrink({ volumeMl: 250, ts: at(8, 9) });
    water().logDrink({ volumeMl: 250, ts: at(30, 9, 0, 9) });
    expect(db.get('logs:2026-10')).toHaveLength(1);
    expect(db.get('logs:2026-09')).toHaveLength(1);
    expect(water().logsForDay('2026-10-08')).toHaveLength(1);
  });
  it('keeps logs sorted by time', () => {
    water().logDrink({ volumeMl: 100, ts: at(8, 11) });
    water().logDrink({ volumeMl: 200, ts: at(8, 9) });
    expect(water().logsForDay('2026-10-08').map((l) => l.volumeMl)).toEqual([200, 100]);
  });
  it('survives a restart: summaries and logs are read back from disk', () => {
    water().logDrink({ volumeMl: 250 });
    useWater.setState({ months: {}, summaries: db.get('daySummaries') ?? {} });
    expect(water().logsForDay('2026-10-08')).toHaveLength(1);
    expect(water().summaries['2026-10-08'].effectiveMl).toBe(250);
  });
});

describe('updateEntry / deleteEntry', () => {
  it('changes the volume and re-sums the day', () => {
    const { entry } = water().logDrink({ volumeMl: 250 });
    const next = water().updateEntry(entry.id, { volumeMl: 400 });
    expect(next).toMatchObject({ volumeMl: 400, effectiveMl: 400, id: entry.id });
    expect(water().summaries['2026-10-08'].effectiveMl).toBe(400);
  });
  it('re-applies the factor when the beverage changes', () => {
    const { entry } = water().logDrink({ volumeMl: 250 });
    expect(water().updateEntry(entry.id, { beverage: 'juice' })?.effectiveMl).toBe(213);
  });
  it('keeps the counted amount when only the time changes', () => {
    const { entry } = water().logDrink({ volumeMl: 250, beverage: 'coffee', ts: at(8, 9) });
    useSettings.getState().setBeverages([{ id: 'coffee', factor: 0.5 }]);
    expect(water().updateEntry(entry.id, { ts: at(8, 10) })?.effectiveMl).toBe(200);
  });
  it('moves a drink to another day when its time moves across the boundary', () => {
    const { entry } = water().logDrink({ volumeMl: 250, ts: at(8, 9) });
    const moved = water().updateEntry(entry.id, { ts: at(7, 20) });
    expect(moved?.dayKey).toBe('2026-10-07');
    expect(moved?.id).not.toBe(entry.id);
    expect(water().summaries['2026-10-08']).toBeUndefined();
    expect(water().summaries['2026-10-07'].effectiveMl).toBe(250);
  });
  it('returns null for an unknown entry', () => {
    expect(water().updateEntry('2026-10-08_nope', { volumeMl: 1 })).toBeNull();
    expect(water().deleteEntry('2026-10-08_nope')).toBeNull();
  });
  it('deletes and drops an empty day', () => {
    const { entry } = water().logDrink({ volumeMl: 250 });
    expect(water().deleteEntry(entry.id)?.id).toBe(entry.id);
    expect(water().summaries['2026-10-08']).toBeUndefined();
    expect(water().logsForDay('2026-10-08')).toEqual([]);
  });
  it('can undo a drink that reached the goal', () => {
    const { entry } = water().logDrink({ volumeMl: 2000 });
    expect(water().summaries['2026-10-08'].reached).toBe(true);
    water().deleteEntry(entry.id);
    expect(water().summaries['2026-10-08']).toBeUndefined();
  });
});

describe('goal changes', () => {
  it('re-measures today with the new goal, but past days keep theirs', () => {
    water().logDrink({ volumeMl: 1800, ts: at(7, 12) });
    water().logDrink({ volumeMl: 1800 });
    expect(water().summaries['2026-10-08'].reached).toBe(false);
    useSettings.getState().setGoal({ goalMl: 1800 });
    expect(water().summaries['2026-10-08']).toMatchObject({ goalMl: 1800, reached: true });
    expect(water().summaries['2026-10-07']).toMatchObject({ goalMl: 2000, reached: false });
  });
});

describe('closeDays', () => {
  it('turns reached days into streak, goal days and plant stage', () => {
    water().logDrink({ volumeMl: 2000, ts: at(5, 12) });
    water().logDrink({ volumeMl: 2000, ts: at(6, 12) });
    water().setProgress({ lastEvaluatedDay: '2026-10-04' });
    const freeze = water().closeDays('2026-10-08');
    expect(freeze).toEqual([]);
    expect(water().progress).toMatchObject({ goalDays: 2, streak: 0, stage: 1, lastEvaluatedDay: '2026-10-07' });
  });
  it('saves the plant on a new install so the first day is evaluated the next morning', () => {
    expect(db.get('progress')).toBeUndefined();
    jest.isolateModules(() => {
      require('../water');
    });
    expect(db.get('progress')).toMatchObject({ lastEvaluatedDay: '2026-10-07', streak: 0 });
  });
  it('reports and counts streak freezes spent', () => {
    water().setProgress({ streak: 4, bestStreak: 4, streakFreezes: 1, lastEvaluatedDay: '2026-10-06' });
    expect(water().closeDays('2026-10-08')).toEqual(['2026-10-07']);
    expect(water().freezeNotice).toBe(1);
    water().dismissFreezeNotice();
    expect(water().freezeNotice).toBe(0);
  });
  it('does nothing twice', () => {
    water().closeDays('2026-10-08');
    const progress = water().progress;
    water().closeDays('2026-10-08');
    expect(water().progress).toBe(progress);
  });
});

describe('replaceAll', () => {
  it('replaces logs on disk, including months that were never loaded', () => {
    water().logDrink({ volumeMl: 250, ts: at(8, 9) });
    useWater.setState({ months: {} });
    const log = { id: '2026-08-01_x', ts: at(1, 9, 0, 8), dayKey: '2026-08-01', beverage: 'water' as const, volumeMl: 300, effectiveMl: 300, source: 'app' as const };
    water().replaceAll({
      logs: { '2026-08': [log] },
      daySummaries: { '2026-08-01': { dayKey: '2026-08-01', effectiveMl: 300, goalMl: 2000, count: 1, reached: false } },
      progress: { ...water().progress, goalDays: 7 },
    });
    expect(db.get('logs:2026-10')).toBeUndefined();
    expect(db.get('logs:2026-08')).toEqual([log]);
    expect(water().progress.goalDays).toBe(7);
    expect(Object.keys(water().summaries)).toEqual(['2026-08-01']);
    expect(addDays('2026-08-01', 1)).toBe('2026-08-02');
  });
});
