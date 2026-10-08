import '@/testing/mocks';
import { msUntilNextBoundary } from '../today';

describe('msUntilNextBoundary', () => {
  it('counts down to wake - 2 h of the next day', () => {
    const now = new Date(2026, 9, 8, 12, 0, 0);
    // next boundary: 2026-10-09 05:00 → 17 h away (+1 s margin)
    expect(msUntilNextBoundary(now, 420)).toBe(17 * 3_600_000 + 1000);
  });
  it('is the next morning when it is still night of the previous logical day', () => {
    const now = new Date(2026, 9, 8, 2, 0, 0); // logical day is Oct 7
    expect(msUntilNextBoundary(now, 420)).toBe(3 * 3_600_000 + 1000);
  });
  it('never returns less than a second', () => {
    expect(msUntilNextBoundary(new Date(2026, 9, 8, 4, 59, 59, 999), 420)).toBeGreaterThanOrEqual(1000);
  });
});
