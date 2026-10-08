import { detectCelebration, milestoneCrossed, type CelebrationSnapshot } from '../celebrations';
import { d } from '../testHelpers';

const DAY = d('2026-10-08');
const snap = (over: Partial<CelebrationSnapshot> = {}): CelebrationSnapshot => ({
  day: DAY,
  streaks: { a: 0 },
  totalCheckIns: 0,
  allDone: false,
  ...over,
});

describe('milestoneCrossed', () => {
  it('detects crossing a milestone', () => {
    expect(milestoneCrossed(2, 3)).toBe(3);
    expect(milestoneCrossed(6, 7)).toBe(7);
    expect(milestoneCrossed(364, 365)).toBe(365);
  });
  it('ignores non-milestones and no change', () => {
    expect(milestoneCrossed(3, 3)).toBeNull();
    expect(milestoneCrossed(3, 4)).toBeNull();
    expect(milestoneCrossed(0, 2)).toBeNull();
  });
  it('picks the highest when several are crossed', () => {
    expect(milestoneCrossed(0, 7)).toBe(7);
  });
});

describe('detectCelebration', () => {
  it('celebrates the very first check-in once', () => {
    const r = detectCelebration(snap(), snap({ totalCheckIns: 1, streaks: { a: 1 } }), {});
    expect(r.celebration).toEqual({ kind: 'first' });
    expect(r.celebrated.first).toBe(true);
    const again = detectCelebration(snap(), snap({ totalCheckIns: 1 }), r.celebrated);
    expect(again.celebration).toBeNull();
  });
  it('celebrates a streak milestone', () => {
    const r = detectCelebration(snap({ totalCheckIns: 5, streaks: { a: 2 } }), snap({ totalCheckIns: 6, streaks: { a: 3 } }), { first: true });
    expect(r.celebration).toEqual({ kind: 'milestone', habitId: 'a', milestone: 3 });
  });
  it('does not repeat a milestone after undo and redo', () => {
    const celebrated = { first: true, milestones: { a: 3 } };
    const r = detectCelebration(snap({ totalCheckIns: 5, streaks: { a: 2 } }), snap({ totalCheckIns: 6, streaks: { a: 3 } }), celebrated);
    expect(r.celebration).toBeNull();
  });
  it('celebrates a perfect day once per day', () => {
    const r = detectCelebration(snap({ totalCheckIns: 4 }), snap({ totalCheckIns: 5, allDone: true }), { first: true });
    expect(r.celebration).toEqual({ kind: 'perfectDay' });
    const again = detectCelebration(snap({ totalCheckIns: 4 }), snap({ totalCheckIns: 5, allDone: true }), r.celebrated);
    expect(again.celebration).toBeNull();
    const nextDay = detectCelebration(
      snap({ day: d('2026-10-09'), totalCheckIns: 6 }),
      snap({ day: d('2026-10-09'), totalCheckIns: 7, allDone: true }),
      r.celebrated,
    );
    expect(nextDay.celebration).toEqual({ kind: 'perfectDay' });
  });
  it('prefers first over milestone over perfect day', () => {
    const r1 = detectCelebration(snap(), snap({ totalCheckIns: 1, allDone: true, streaks: { a: 3 } }), {});
    expect(r1.celebration?.kind).toBe('first');
    const r2 = detectCelebration(snap({ totalCheckIns: 2, streaks: { a: 6 } }), snap({ totalCheckIns: 3, allDone: true, streaks: { a: 7 } }), { first: true });
    expect(r2.celebration?.kind).toBe('milestone');
  });
  it('stays quiet across a day change', () => {
    const r = detectCelebration(snap({ day: d('2026-10-07'), totalCheckIns: 3 }), snap({ totalCheckIns: 3, allDone: true }), { first: true });
    expect(r.celebration).toBeNull();
  });
  it('stays quiet when nothing changes', () => {
    expect(detectCelebration(snap({ totalCheckIns: 3 }), snap({ totalCheckIns: 3 }), { first: true }).celebration).toBeNull();
  });
});
