import { DEFAULT_BUDGET, habitSeriesId, planNotifications, type PlanInput } from '../notificationPlan';
import type { Habit } from '../types';
import { d, done, entry, habit } from '../testHelpers';

// Thursday 2026-10-08, 10:00 local
const NOW = new Date(2026, 9, 8, 10, 0, 0);
const withReminder = (over: Partial<Habit> = {}, time = '19:00'): Habit =>
  habit({ reminders: [{ time, notifIds: [] }], createdAt: d('2026-09-01'), ...over });

const plan = (over: Partial<PlanInput> = {}) =>
  planNotifications({
    habits: [],
    entries: {},
    now: NOW,
    dayEndsAtHour: 0,
    weekStartsOn: 1,
    dailySummary: { enabled: false, time: '08:00' },
    eveningNudge: { enabled: false, time: '20:30' },
    ...over,
  });

const habitOnes = (n: ReturnType<typeof plan>) => n.filter((x) => x.kind === 'habit');
const days = (n: ReturnType<typeof plan>) => n.map((x) => x.day);

describe('habit reminders', () => {
  it('plans a daily habit for each of the next 7 days at its time', () => {
    const out = habitOnes(plan({ habits: [withReminder()] }));
    expect(out).toHaveLength(7);
    expect(out[0].at).toEqual(new Date(2026, 9, 8, 19, 0));
    expect(out[0].seriesId).toBe(habitSeriesId('h1'));
    expect(out[6].day).toBe('2026-10-14');
  });
  it('skips today when the time has passed', () => {
    const out = habitOnes(plan({ habits: [withReminder({}, '09:00')] }));
    expect(out).toHaveLength(6);
    expect(out[0].day).toBe('2026-10-09');
  });
  it('skips today when the habit is already done', () => {
    const out = habitOnes(plan({ habits: [withReminder()], entries: { h1: done('2026-10-08') } }));
    expect(days(out)).not.toContain('2026-10-08');
    expect(out).toHaveLength(6);
  });
  it('only plans scheduled weekdays', () => {
    const h = withReminder({ schedule: { kind: 'weekdays', days: [1, 3] } }); // Mon, Wed
    expect(days(habitOnes(plan({ habits: [h] })))).toEqual(['2026-10-12', '2026-10-14']);
  });
  it('ignores habits with no reminder, archived habits and days before the start', () => {
    const none = habit();
    const archived = withReminder({ id: 'x', archivedAt: '2026-10-01' });
    const later = withReminder({ id: 'y', createdAt: d('2026-10-10') });
    const out = habitOnes(plan({ habits: [none, archived, later] }));
    expect(out.every((x) => x.habitId === 'y')).toBe(true);
    expect(days(out)[0]).toBe('2026-10-10');
  });
  it('stops reminding for the rest of the week once a per-week target is met', () => {
    const h = withReminder({ schedule: { kind: 'perWeek', times: 2 } });
    const out = habitOnes(plan({ habits: [h], entries: { h1: done('2026-10-05', '2026-10-06') } }));
    // this week (Thu 8 - Sun 11) skipped; next week (Mon 12 - Wed 14) planned
    expect(days(out)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
  });
  it('keeps reminding a per-week habit while the target is unmet', () => {
    const h = withReminder({ schedule: { kind: 'perWeek', times: 3 } });
    const out = habitOnes(plan({ habits: [h], entries: { h1: done('2026-10-05') } }));
    expect(days(out)).toContain('2026-10-08');
  });
  it('shows progress in today\'s count reminder only', () => {
    const h = withReminder({ type: 'count', target: 8, unit: 'glasses' });
    const out = habitOnes(plan({ habits: [h], entries: { h1: { '2026-10-08': entry(3) } as never } }));
    expect(out[0].message).toMatchObject({ bodyKey: 'notify.habitProgress', params: { value: 3, target: 8, unit: 'glasses' } });
    expect(out[1].message.bodyKey).toBe('notify.habitBody');
  });
  it('attributes a reminder after midnight to the previous day when the day ends later', () => {
    const h = withReminder({}, '01:00');
    const out = habitOnes(plan({ habits: [h], dayEndsAtHour: 3 }));
    expect(out[0].at).toEqual(new Date(2026, 9, 9, 1, 0));
    expect(out[0].day).toBe('2026-10-08');
  });
});

describe('daily summary', () => {
  const summary = { enabled: true, time: '08:00' };
  it('is off by default and plans the following days when on', () => {
    expect(plan({ habits: [habit()] }).filter((x) => x.kind === 'summary')).toHaveLength(0);
    const out = plan({ habits: [habit({ createdAt: d('2026-09-01') })], dailySummary: summary }).filter((x) => x.kind === 'summary');
    expect(out).toHaveLength(6); // 08:00 today has passed
    expect(out[0].channel).toBe('summary');
    expect(out[0].message.params.count).toBe(1);
  });
  it('counts what is left today', () => {
    const out = plan({
      habits: [habit({ id: 'a' }), habit({ id: 'b' })],
      entries: { a: done('2026-10-08') },
      dailySummary: { enabled: true, time: '21:00' },
    }).filter((x) => x.kind === 'summary');
    expect(out[0]).toMatchObject({ day: '2026-10-08', message: { params: { count: 1 } } });
  });
  it('skips today when everything is done', () => {
    const out = plan({
      habits: [habit({ id: 'a' })],
      entries: { a: done('2026-10-08') },
      dailySummary: { enabled: true, time: '21:00' },
    }).filter((x) => x.kind === 'summary');
    expect(days(out)).not.toContain('2026-10-08');
  });
});

describe('evening nudge', () => {
  const nudge = { enabled: true, time: '20:30' };
  const streaky = habit({ id: 'a', createdAt: d('2026-09-01') });
  const streak6 = done('2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07');

  it('fires for today when a streak of 2+ is at risk', () => {
    const out = plan({ habits: [streaky], entries: { a: streak6 }, eveningNudge: nudge }).filter((x) => x.kind === 'nudge');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ at: new Date(2026, 9, 8, 20, 30), channel: 'streak', message: { params: { count: 6 } } });
  });
  it('stays quiet when the habit is already done today', () => {
    const e = { a: { ...streak6, ...done('2026-10-08') } };
    expect(plan({ habits: [streaky], entries: e, eveningNudge: nudge }).filter((x) => x.kind === 'nudge')).toHaveLength(0);
  });
  it('stays quiet for streaks shorter than 2', () => {
    const e = { a: done('2026-10-07') };
    expect(plan({ habits: [streaky], entries: e, eveningNudge: nudge }).filter((x) => x.kind === 'nudge')).toHaveLength(0);
  });
  it('stays quiet when it is off, or the time has passed', () => {
    const base = { habits: [streaky], entries: { a: streak6 } };
    expect(plan({ ...base }).filter((x) => x.kind === 'nudge')).toHaveLength(0);
    expect(plan({ ...base, eveningNudge: { enabled: true, time: '09:00' } }).filter((x) => x.kind === 'nudge')).toHaveLength(0);
  });
  it('stays quiet if the app was opened within 30 minutes before it', () => {
    const lastOpenAt = new Date(2026, 9, 8, 20, 10).getTime();
    const out = plan({ habits: [streaky], entries: { a: streak6 }, eveningNudge: nudge, lastOpenAt, now: new Date(2026, 9, 8, 20, 10) });
    expect(out.filter((x) => x.kind === 'nudge')).toHaveLength(0);
  });
  it('ignores per-week habits', () => {
    const p = habit({ id: 'p', schedule: { kind: 'perWeek', times: 1 }, createdAt: d('2026-09-01') });
    expect(plan({ habits: [p], entries: { p: done('2026-09-30') }, eveningNudge: nudge }).filter((x) => x.kind === 'nudge')).toHaveLength(0);
  });
});

describe('re-engagement and budget', () => {
  it('plans one nudge 48 hours after the last open', () => {
    const lastOpenAt = NOW.getTime() - 3_600_000;
    const out = plan({ habits: [habit()], lastOpenAt }).filter((x) => x.kind === 'reengage');
    expect(out).toHaveLength(1);
    expect(out[0].at.getTime()).toBe(lastOpenAt + 48 * 3_600_000);
  });
  it('does not plan it without habits', () => {
    expect(plan().filter((x) => x.kind === 'reengage')).toHaveLength(0);
  });
  it('caps the total and keeps the nudge and re-engagement', () => {
    const many = Array.from({ length: 20 }, (_, i) => withReminder({ id: `h${i}` }, '18:00'));
    const streaky = withReminder({ id: 'a' }, '07:00');
    const streak = done('2026-10-05', '2026-10-06', '2026-10-07');
    const out = plan({
      habits: [...many, streaky],
      entries: { a: streak },
      eveningNudge: { enabled: true, time: '20:30' },
      budget: 10,
    });
    expect(out).toHaveLength(10);
    expect(out.some((x) => x.kind === 'nudge')).toBe(true);
    expect(out.some((x) => x.kind === 'reengage')).toBe(true);
  });
  it('is sorted by time and under the default budget with a typical load', () => {
    const out = plan({ habits: Array.from({ length: 12 }, (_, i) => withReminder({ id: `h${i}` })) });
    expect(out.length).toBeLessThanOrEqual(DEFAULT_BUDGET);
    for (let i = 1; i < out.length; i++) expect(out[i].at.getTime()).toBeGreaterThanOrEqual(out[i - 1].at.getTime());
  });
  it('keeps no more than 3 summary-type notifications per day', () => {
    const out = plan({
      habits: [withReminder()],
      dailySummary: { enabled: true, time: '21:00' },
      eveningNudge: { enabled: true, time: '20:30' },
    });
    const perDay: Record<string, number> = {};
    for (const n of out.filter((x) => x.kind !== 'habit')) perDay[n.day] = (perDay[n.day] ?? 0) + 1;
    for (const count of Object.values(perDay)) expect(count).toBeLessThanOrEqual(3);
  });
});
