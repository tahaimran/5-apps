import { defaultReminders } from '../defaults';
import { dayKeyFor, minuteOfDay } from '../dayKey';
import { MAX_PENDING, planReminders, planSnooze, type PlanInput } from '../reminderPlan';

const at = (d: number, h: number, mi = 0, mo = 10) => new Date(2026, mo - 1, d, h, mi);
const input = (over: Partial<PlanInput> = {}): PlanInput => ({
  now: at(8, 6, 0),
  reminders: defaultReminders,
  goalMl: 2300,
  cupMl: 250,
  logTimes: [],
  todayReached: false,
  ...over,
});
const clock = (p: { at: Date }) => minuteOfDay(p.at);

describe('planReminders (plan §10.2)', () => {
  it('plans today and the next two days, 10 a day', () => {
    const plan = planReminders(input());
    expect(plan).toHaveLength(30);
    expect(plan[0].at).toEqual(at(8, 7, 30));
    expect(plan.map((p) => p.day).filter((d, i, a) => a.indexOf(d) === i)).toEqual(['2026-10-08', '2026-10-09', '2026-10-10']);
  });
  it('only plans what is still ahead', () => {
    const plan = planReminders(input({ now: at(8, 12, 0) }));
    expect(plan[0].at).toEqual(at(8, 12, 30));
    expect(plan.every((p) => p.at.getTime() > at(8, 12, 0).getTime())).toBe(true);
  });
  it('never plans outside wake + 30 and bed - 30', () => {
    for (const p of planReminders(input())) {
      expect(clock(p)).toBeGreaterThanOrEqual(450);
      expect(clock(p)).toBeLessThanOrEqual(1350);
    }
  });
  it('plans nothing when reminders are off', () => {
    expect(planReminders(input({ reminders: { ...defaultReminders, enabled: false } }))).toEqual([]);
  });
  it('skips days that are switched off (Thursday 8 Oct 2026 = 4)', () => {
    const plan = planReminders(input({ reminders: { ...defaultReminders, activeWeekdays: [0, 1, 2, 3, 5, 6] } }));
    expect(plan.some((p) => p.day === '2026-10-08')).toBe(false);
    expect(plan.some((p) => p.day === '2026-10-09')).toBe(true);
  });

  describe('auto-skip (F5)', () => {
    it('drops the next slot when a drink was logged within 30 minutes before it', () => {
      const now = at(8, 9, 0);
      const plan = planReminders(input({ now, logTimes: [at(8, 9, 0).getTime()] }));
      // next slot is 09:10, 10 minutes after the log
      expect(plan[0].at).toEqual(at(8, 10, 50));
    });
    it('keeps a slot that is more than 30 minutes after the log', () => {
      const plan = planReminders(input({ now: at(8, 8, 30), logTimes: [at(8, 8, 30).getTime()] }));
      expect(plan[0].at).toEqual(at(8, 9, 10));
    });
    it('uses the configured window', () => {
      const reminders = { ...defaultReminders, skipWindowMin: 60 };
      const plan = planReminders(input({ now: at(8, 8, 30), reminders, logTimes: [at(8, 8, 30).getTime()] }));
      expect(plan[0].at).toEqual(at(8, 10, 50));
    });
    it('only cancels the instance, not the same slot on other days', () => {
      const plan = planReminders(input({ now: at(8, 9, 0), logTimes: [at(8, 9, 0).getTime()] }));
      expect(plan.some((p) => p.at.getTime() === at(9, 9, 10).getTime())).toBe(true);
    });
  });

  describe('goal reached', () => {
    it('cancels the rest of today and keeps tomorrow', () => {
      const plan = planReminders(input({ now: at(8, 12, 0), todayReached: true }));
      expect(plan.every((p) => p.day !== '2026-10-08')).toBe(true);
      expect(plan[0].at).toEqual(at(9, 7, 30));
    });
  });

  it('spreads a bedtime after midnight over the right calendar days', () => {
    const reminders = { ...defaultReminders, wakeMin: 600, bedMin: 120, frequency: 'interval' as const };
    const plan = planReminders(input({ now: at(8, 0, 30), reminders }));
    // 00:30 on the 8th still belongs to the 7th's waking day: the 01:30 slot is today's carry-over.
    expect(plan[0].at).toEqual(at(8, 1, 30));
    expect(plan[0].day).toBe(dayKeyFor(at(8, 1, 30), 600));
    expect(plan[0].day).toBe('2026-10-07');
    const times = plan.map((p) => p.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it('ends with the soft "misses you" message, which only fires after days away', () => {
    const plan = planReminders(input());
    expect(plan.at(-1)?.kind).toBe('misses');
    expect(plan.filter((p) => p.kind === 'misses')).toHaveLength(1);
    expect(plan.at(-1)?.day).toBe('2026-10-10');
  });
  it('rotates through the friendly lines', () => {
    const lines = new Set(planReminders(input()).map((p) => p.messageIndex));
    expect(lines.size).toBeGreaterThan(3);
  });
  it('stays under the pending cap even with 16 slots a day', () => {
    const plan = planReminders(input({ goalMl: 4500, cupMl: 150 }));
    expect(plan.length).toBeLessThanOrEqual(MAX_PENDING);
    expect(plan).toHaveLength(48);
  });
});

describe('planSnooze (plan §8.3)', () => {
  const s = { wakeMin: 420, bedMin: 1380, snoozeMin: 15 as const };
  it('fires after the snooze time', () => {
    expect(planSnooze(at(8, 14, 0), s)).toEqual(at(8, 14, 15));
    expect(planSnooze(at(8, 14, 0), { ...s, snoozeMin: 30 })).toEqual(at(8, 14, 30));
  });
  it('is dropped when it would land after bedtime', () => {
    expect(planSnooze(at(8, 22, 50), s)).toBeNull();
    expect(planSnooze(at(8, 22, 45), s)).toEqual(at(8, 23, 0));
  });
  it('is dropped outside the waking window', () => {
    expect(planSnooze(at(8, 3, 0), s)).toBeNull();
  });
  it('works for an overnight schedule', () => {
    const night = { wakeMin: 600, bedMin: 120, snoozeMin: 15 as const };
    expect(planSnooze(at(8, 0, 30), night)).toEqual(at(8, 0, 45));
    expect(planSnooze(at(8, 1, 50), night)).toBeNull();
  });
});
