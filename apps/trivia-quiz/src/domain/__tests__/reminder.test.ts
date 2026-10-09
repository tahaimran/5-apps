import { addDays } from '../dateKey';
import { AT_RISK, atTime, planReminders, REMINDER_DAYS, shouldReask } from '../reminder';

const today = '2026-10-08';
const at = (h: number, m = 0) => new Date(2026, 9, 8, h, m);
const plan = (over: Partial<Parameters<typeof planReminders>[0]> = {}) => planReminders({ now: at(9), today, hour: 19, minute: 0, doneToday: false, streak: 0, ...over });

describe('planning notifications', () => {
  it('plans today and the next 7 days, one a day at the chosen time', () => {
    const p = plan();
    expect(p).toHaveLength(REMINDER_DAYS);
    expect(p.map((x) => x.dateKey)).toEqual(Array.from({ length: 8 }, (_, i) => addDays(today, i)));
    for (const x of p) expect([x.at.getHours(), x.at.getMinutes()]).toEqual([19, 0]);
    expect(new Set(p.map((x) => x.dateKey)).size).toBe(p.length);
  });
  it('leaves out today when the Daily is played or the time has passed', () => {
    expect(plan({ doneToday: true })[0].dateKey).toBe(addDays(today, 1));
    expect(plan({ now: at(19, 1) })[0].dateKey).toBe(addDays(today, 1));
    expect(plan({ now: at(18, 59) })[0].dateKey).toBe(today);
  });
  it('puts the comeback message on days 3 and 7 and the plain one elsewhere', () => {
    expect(plan().map((x) => x.kind)).toEqual(['daily', 'daily', 'daily', 'comeback3', 'daily', 'daily', 'daily', 'comeback7']);
  });
  it('rotates the daily message by day', () => {
    const variants = plan().map((x) => x.variant);
    expect(new Set(variants).size).toBeGreaterThan(1);
  });
  it('turns today\'s into the 20:30 streak-at-risk message when a streak of 2+ is at stake and the reminder is earlier and not yet sent', () => {
    const p = plan({ streak: 5 });
    expect(p[0]).toMatchObject({ kind: 'atRisk', streak: 5 });
    expect([p[0].at.getHours(), p[0].at.getMinutes()]).toEqual([AT_RISK.hour, AT_RISK.minute]);
    expect(p.filter((x) => x.dateKey === today)).toHaveLength(1); // still one a day
    expect(p[1].kind).toBe('daily'); // other days keep the chosen time
  });
  it('does not add a streak-at-risk message for a streak of 1, when played, or after the reminder time', () => {
    expect(plan({ streak: 1 })[0].kind).toBe('daily');
    expect(plan({ streak: 5, doneToday: true })[0].dateKey).toBe(addDays(today, 1));
    expect(plan({ streak: 5, now: at(19, 30) })[0].dateKey).toBe(addDays(today, 1));
  });
  it('uses the streak wording, not a second message, when the reminder is already at or after 20:30', () => {
    const p = plan({ streak: 5, hour: 21, minute: 0 });
    expect(p[0]).toMatchObject({ kind: 'streak' });
    expect(p[0].at.getHours()).toBe(21);
  });
  it('is the same for any date arithmetic across a clock change', () => {
    const p = planReminders({ now: new Date(2026, 2, 6, 9), today: '2026-03-06', hour: 19, minute: 0, doneToday: false, streak: 0 });
    for (const x of p) expect([x.at.getHours(), x.at.getMinutes()]).toEqual([19, 0]);
    expect(atTime('2026-03-08', 19, 0).getHours()).toBe(19);
  });
  it('offers the reminder again once, after a decline and a 3-day streak', () => {
    const base = { reminderEnabled: false, declinedAt: 1, reaskedAt: 0, streak: 3 };
    expect(shouldReask(base)).toBe(true);
    expect(shouldReask({ ...base, streak: 2 })).toBe(false);
    expect(shouldReask({ ...base, reaskedAt: 5 })).toBe(false);
    expect(shouldReask({ ...base, declinedAt: 0 })).toBe(false);
    expect(shouldReask({ ...base, reminderEnabled: true })).toBe(false);
  });
});
