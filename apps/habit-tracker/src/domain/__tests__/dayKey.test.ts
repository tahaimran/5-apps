import { dayKeyFor } from '../dayKey';

describe('dayKeyFor', () => {
  it('uses the local date', () => {
    expect(dayKeyFor(new Date(2026, 9, 8, 14, 0))).toBe('2026-10-08');
  });

  it('counts a 01:30 check-in for the previous day when the day ends at 03:00', () => {
    expect(dayKeyFor(new Date(2026, 9, 8, 1, 30), 3)).toBe('2026-10-07');
  });

  it('rolls over to the next day after the cutoff', () => {
    expect(dayKeyFor(new Date(2026, 9, 8, 3, 0), 3)).toBe('2026-10-08');
  });

  it('crosses month and year boundaries', () => {
    expect(dayKeyFor(new Date(2027, 0, 1, 0, 30), 1)).toBe('2026-12-31');
  });
});
