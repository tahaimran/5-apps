import { addDays } from '../dateKey';
import { defaultReminderPrompt } from '../defaults';
import { ASK_AGAIN_AFTER_MS, atTime, COPY_VARIANTS, planReminders, REMINDER_DAYS, shouldAskReminder, TIME_CHOICES } from '../reminder';
import { isPositiveMoment, reviewEligible, REVIEW_GAP_MS, type ReviewContext } from '../reviewRules';

describe('planReminders (plan §10)', () => {
  const base = { today: '2026-10-08', hour: 9, minute: 0, doneToday: false };
  it('plans one reminder a day for the next 7 days, today included while its time is ahead', () => {
    const plan = planReminders({ ...base, now: new Date(2026, 9, 8, 7, 0) });
    expect(plan).toHaveLength(REMINDER_DAYS);
    expect(plan.map((p) => p.dateKey)).toEqual(Array.from({ length: 7 }, (_, i) => addDays('2026-10-08', i)));
    for (const p of plan) {
      expect(p.at.getHours()).toBe(9);
      expect(p.at.getMinutes()).toBe(0);
      expect(p.variant).toBeLessThan(COPY_VARIANTS);
    }
    expect(new Set(plan.map((p) => p.dateKey)).size).toBe(plan.length); // never two in a day
  });
  it('leaves out today when the time has passed', () => {
    const plan = planReminders({ ...base, now: new Date(2026, 9, 8, 9, 0, 1) });
    expect(plan[0].dateKey).toBe('2026-10-09');
    expect(plan).toHaveLength(6);
  });
  it('skips today when today\'s daily puzzle is already done, but not tomorrow', () => {
    const plan = planReminders({ ...base, doneToday: true, now: new Date(2026, 9, 8, 7, 0) });
    expect(plan[0].dateKey).toBe('2026-10-09');
  });
  it('uses the chosen time, and rotates the message and theme by day', () => {
    const plan = planReminders({ ...base, hour: 19, minute: 15, now: new Date(2026, 9, 8, 7, 0) });
    expect(plan.every((p) => p.at.getHours() === 19 && p.at.getMinutes() === 15)).toBe(true);
    expect(new Set(plan.map((p) => p.variant)).size).toBeGreaterThan(1);
    expect(new Set(plan.map((p) => p.packId)).size).toBeGreaterThan(1);
    expect(atTime('2026-10-08', 13, 0).getHours()).toBe(13);
  });
  it('can plan fewer days', () => {
    expect(planReminders({ ...base, days: 2, now: new Date(2026, 9, 8, 7, 0) })).toHaveLength(2);
  });
  it('offers the three time chips of the plan', () => {
    expect(TIME_CHOICES.map((c) => `${c.hour}:${c.minute}`)).toEqual(['9:0', '13:0', '19:0']);
  });
});

describe('shouldAskReminder (plan §10: after the first daily or the 3rd puzzle, never earlier)', () => {
  const ask = (over: Partial<Parameters<typeof shouldAskReminder>[0]> = {}) =>
    shouldAskReminder({ prompt: defaultReminderPrompt(), reminderEnabled: false, now: 1e12, dailyJustCompleted: false, tutorial: false, ...over });
  it('does not ask before anything happened, nor after the tutorial', () => {
    expect(ask()).toBe(false);
    expect(ask({ tutorial: true, dailyJustCompleted: true })).toBe(false);
    expect(ask({ prompt: { ...defaultReminderPrompt(), completions: 2 } })).toBe(false);
  });
  it('asks after the first daily completion or the 3rd puzzle', () => {
    expect(ask({ dailyJustCompleted: true })).toBe(true);
    expect(ask({ prompt: { ...defaultReminderPrompt(), completions: 3 } })).toBe(true);
  });
  it('does not ask when reminders are already on', () => {
    expect(ask({ reminderEnabled: true, dailyJustCompleted: true })).toBe(false);
  });
  it('asks again once, after 7 days, and then never', () => {
    const asked = { askCount: 1, askedAt: 1e12 - 1000, completions: 5 };
    expect(ask({ prompt: asked, dailyJustCompleted: true })).toBe(false);
    expect(ask({ prompt: { ...asked, askedAt: 1e12 - ASK_AGAIN_AFTER_MS }, dailyJustCompleted: true })).toBe(true);
    expect(ask({ prompt: { askCount: 2, askedAt: 0, completions: 9 }, dailyJustCompleted: true })).toBe(false);
  });
});

describe('review rules (plan §12)', () => {
  const NOW = 1e12;
  const ctx = (over: Partial<ReviewContext> = {}): ReviewContext => ({ review: { promptCount: 0, positiveMoments: 0 }, sessions: 3, puzzlesCompleted: 5, stars: 3, now: NOW, lastFullScreenAt: 0, tutorial: false, ...over });
  it('asks only when every condition holds', () => {
    expect(reviewEligible(ctx())).toBe(true);
    expect(reviewEligible(ctx({ sessions: 2 }))).toBe(false);
    expect(reviewEligible(ctx({ puzzlesCompleted: 4 }))).toBe(false);
    expect(reviewEligible(ctx({ stars: 2 }))).toBe(false);
    expect(reviewEligible(ctx({ tutorial: true }))).toBe(false);
  });
  it('accepts a streak milestone instead of 3 stars, but only a counted one', () => {
    expect(reviewEligible(ctx({ stars: 1, streak: 7, streakCounted: true }))).toBe(true);
    expect(reviewEligible(ctx({ stars: 1, streak: 30, streakCounted: true }))).toBe(true);
    expect(reviewEligible(ctx({ stars: 1, streak: 8, streakCounted: true }))).toBe(false);
    expect(reviewEligible(ctx({ stars: 1, streak: 7, streakCounted: false }))).toBe(false);
    expect(isPositiveMoment({ stars: 2, streak: 100, streakCounted: true, tutorial: false })).toBe(true);
  });
  it('waits 30 days between prompts and stops after 3', () => {
    expect(reviewEligible(ctx({ review: { promptCount: 1, lastPromptAt: NOW - REVIEW_GAP_MS + 1, positiveMoments: 0 } }))).toBe(false);
    expect(reviewEligible(ctx({ review: { promptCount: 1, lastPromptAt: NOW - REVIEW_GAP_MS, positiveMoments: 0 } }))).toBe(true);
    expect(reviewEligible(ctx({ review: { promptCount: 3, lastPromptAt: 0, positiveMoments: 0 } }))).toBe(false);
  });
  it('stays quiet for 60 s after an ad', () => {
    expect(reviewEligible(ctx({ lastFullScreenAt: NOW - 59_000 }))).toBe(false);
    expect(reviewEligible(ctx({ lastFullScreenAt: NOW - 61_000 }))).toBe(true);
  });
});
