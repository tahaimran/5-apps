import '@/testing/mocks';
import '@/bootstrap';
import { startOfWeek } from '../dueDate';
import { upcomingWeeklyCards, WEEKLY_HOUR } from '../weekly';

describe('weekly size cards (plan §10)', () => {
  const edd = '2026-11-12';
  it('are at 10:00 local on the first day of each week still to come', () => {
    const cards = upcomingWeeklyCards(edd, new Date(2026, 9, 9, 12, 0)); // week 35 + 1 day
    expect(cards[0].week).toBe(36);
    expect(cards[0].at).toEqual(new Date(2026, 9, 15, WEEKLY_HOUR, 0)); // startOfWeek(edd, 36) = 2026-10-15
    expect(cards.map((c) => c.week)).toEqual([36, 37, 38, 39, 40, 41, 42]);
    expect(startOfWeek(edd, 36)).toBe('2026-10-15');
  });
  it('skips a week whose time has already passed, but not one that is still to come today', () => {
    expect(upcomingWeeklyCards(edd, new Date(2026, 9, 15, 10, 0)).map((c) => c.week)[0]).toBe(37);
    expect(upcomingWeeklyCards(edd, new Date(2026, 9, 15, 9, 59)).map((c) => c.week)[0]).toBe(36);
  });
  it('carries the size and the emoji', () => {
    const card = upcomingWeeklyCards(edd, new Date(2026, 9, 9)).find((c) => c.week === 35 || c.week === 36)!;
    expect(card.size.length).toBeGreaterThan(2);
    expect(upcomingWeeklyCards('2026-11-12', new Date(2026, 8, 1)).find((c) => c.week === 35)).toMatchObject({ size: 'honeydew melon', emoji: '🍈' });
  });
  it('stops 21 days after the due date: nothing is planned beyond it', () => {
    const late = upcomingWeeklyCards('2026-11-12', new Date(2026, 10, 1));
    expect(late.every((c) => c.at.getTime() < new Date(2026, 11, 4, 0, 0).getTime())).toBe(true);
    expect(upcomingWeeklyCards('2026-11-12', new Date(2027, 0, 1))).toEqual([]);
  });
  it('plans nothing before week 4 exists for a far-off date, only from week 4 on', () => {
    const early = upcomingWeeklyCards('2027-06-01', new Date(2026, 9, 9));
    expect(early[0].week).toBeGreaterThanOrEqual(4);
  });
  it('is right across a daylight-saving change: still 10:00 local', () => {
    for (const c of upcomingWeeklyCards('2027-03-20', new Date(2026, 9, 1))) expect(c.at.getHours()).toBe(10);
  });
});
