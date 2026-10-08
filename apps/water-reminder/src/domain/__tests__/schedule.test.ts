import { defaultReminders } from '../defaults';
import { buildSlots, inQuietBlock, reminderCount, window } from '../schedule';
import type { ReminderSettings } from '../types';

const s = (over: Partial<ReminderSettings> = {}): ReminderSettings => ({ ...defaultReminders, ...over });

describe('buildSlots (plan §8.2)', () => {
  it('spreads 10 reminders from 07:30 to 22:30 for a 2,300 ml goal and a 250 ml cup', () => {
    expect(buildSlots(s(), 2300, 250)).toEqual([450, 550, 650, 750, 850, 950, 1050, 1150, 1250, 1350]);
  });
  it('never reminds before wake + 30 min or after bed - 30 min', () => {
    for (const goal of [1200, 2000, 3000, 4500]) {
      const slots = buildSlots(s({ wakeMin: 6 * 60 + 15, bedMin: 22 * 60 + 45 }), goal, 250);
      expect(Math.min(...slots)).toBeGreaterThanOrEqual(6 * 60 + 45);
      expect(Math.max(...slots)).toBeLessThanOrEqual(22 * 60 + 15);
    }
  });
  it('keeps the smart count between 4 and 16', () => {
    expect(reminderCount(s(), 1200, 500)).toBe(4);
    expect(reminderCount(s(), 4500, 150)).toBe(16);
    expect(reminderCount(s(), 2000, 250)).toBe(8);
  });
  it('derives the interval count from the window and keeps it between 2 and 16', () => {
    expect(reminderCount(s({ frequency: 'interval', intervalMin: 120 }), 2000, 250)).toBe(8); // 900 / 120 = 7.5 → 7 + 1
    expect(reminderCount(s({ frequency: 'interval', intervalMin: 60 }), 2000, 250)).toBe(16);
    expect(reminderCount(s({ frequency: 'interval', intervalMin: 180, wakeMin: 600, bedMin: 700 }), 2000, 250)).toBe(2);
  });
  it('supports a bedtime after midnight (night shift): offsets run past 1440', () => {
    const slots = buildSlots(s({ frequency: 'interval', intervalMin: 120, wakeMin: 600, bedMin: 120 }), 2000, 250);
    expect(slots).toEqual([630, 760, 885, 1015, 1145, 1275, 1400, 1530]);
    expect(window(s({ wakeMin: 600, bedMin: 120 }))).toEqual({ start: 630, end: 1530 });
  });
  it('drops slots inside a quiet block', () => {
    const slots = buildSlots(s({ quietBlocks: [{ startMin: 12 * 60, endMin: 13 * 60 }] }), 2300, 250);
    expect(slots).not.toContain(750);
    expect(slots).toHaveLength(9);
  });
  it('removes duplicates when the window is too short for the count', () => {
    const slots = buildSlots(s({ wakeMin: 600, bedMin: 700, frequency: 'smart' }), 4500, 150);
    expect(new Set(slots).size).toBe(slots.length);
    expect(slots.length).toBeLessThan(16);
  });
  it('rounds to 5 minutes and returns a sorted list', () => {
    const slots = buildSlots(s(), 2650, 250);
    expect(slots.every((m) => m % 5 === 0)).toBe(true);
    expect([...slots].sort((a, b) => a - b)).toEqual(slots);
  });
});

describe('quiet blocks', () => {
  it('matches inside, not at the end boundary', () => {
    const blocks = [{ startMin: 720, endMin: 780 }];
    expect(inQuietBlock(720, blocks)).toBe(true);
    expect(inQuietBlock(779, blocks)).toBe(true);
    expect(inQuietBlock(780, blocks)).toBe(false);
    expect(inQuietBlock(719, blocks)).toBe(false);
  });
  it('handles a block that wraps midnight and minutes past 1440', () => {
    const blocks = [{ startMin: 1380, endMin: 60 }];
    expect(inQuietBlock(1400, blocks)).toBe(true);
    expect(inQuietBlock(30, blocks)).toBe(true);
    expect(inQuietBlock(1440 + 30, blocks)).toBe(true);
    expect(inQuietBlock(600, blocks)).toBe(false);
  });
  it('is false with no blocks', () => {
    expect(inQuietBlock(600, [])).toBe(false);
  });
});
