import { KICK_TARGET_LIMITS } from '../defaults';
import {
  autoClose,
  clampTarget,
  elapsedKick,
  finishKick,
  hardLimitReached,
  HARD_LIMIT_MS,
  isComplete,
  KICK_DEBOUNCE_MS,
  softLimitReached,
  SOFT_LIMIT_MS,
  startKickSession,
  tapKick,
  timeToTarget,
  undoKick,
} from '../kicks';
import { NOW, MINUTE, SECOND } from '@/testing/fixtures';

const fresh = (target = 10) => startKickSession(NOW, target, 'k1');

function tapMany(n: number, every = 70 * SECOND, from = fresh()) {
  let s = from;
  for (let i = 1; i <= n; i++) s = tapKick(s, NOW + i * every).session;
  return s;
}

describe('counting', () => {
  it('counts a tap and reaches the target on the 10th', () => {
    const nine = tapMany(9);
    expect(nine.taps).toHaveLength(9);
    expect(isComplete(nine)).toBe(false);
    const ten = tapKick(nine, NOW + 10 * 70 * SECOND).session;
    expect(ten.taps).toHaveLength(10);
    expect(ten.targetReachedAt).toBe(NOW + 700 * SECOND);
    expect(timeToTarget(ten)).toBe(700 * SECOND);
  });
  it('treats flutters within a second as one movement', () => {
    const a = tapKick(fresh(), NOW + 5 * SECOND).session;
    const b = tapKick(a, NOW + 5 * SECOND + KICK_DEBOUNCE_MS - 1);
    expect(b.counted).toBe(false);
    expect(b.session).toBe(a);
    expect(tapKick(a, NOW + 5 * SECOND + KICK_DEBOUNCE_MS).counted).toBe(true);
  });
  it('counts a tap if the clock was set back rather than ignoring it', () => {
    const a = tapKick(fresh(), NOW + 60 * SECOND).session;
    expect(tapKick(a, NOW + 10 * SECOND).counted).toBe(true);
  });
  it('stops counting once the target is reached or the session is saved', () => {
    const done = tapMany(10);
    expect(tapKick(done, NOW + 900 * SECOND).counted).toBe(false);
    expect(tapKick(finishKick(tapMany(3), NOW + 10 * MINUTE), NOW + 11 * MINUTE).counted).toBe(false);
  });
  it('honours another target', () => {
    expect(isComplete(tapMany(5, 70 * SECOND, fresh(5)))).toBe(true);
  });
  it('clamps the target to 5–20', () => {
    expect(clampTarget(1)).toBe(KICK_TARGET_LIMITS.min);
    expect(clampTarget(99)).toBe(KICK_TARGET_LIMITS.max);
    expect(clampTarget(12.4)).toBe(12);
    expect(startKickSession(NOW, 3).target).toBe(5);
  });
});

describe('undo', () => {
  it('takes back the last movement', () => {
    expect(undoKick(tapMany(4)).taps).toHaveLength(3);
  });
  it('takes the "target reached" mark back with the 10th', () => {
    const undone = undoKick(tapMany(10));
    expect(undone.taps).toHaveLength(9);
    expect(undone.targetReachedAt).toBeUndefined();
  });
  it('does nothing on an empty or saved session', () => {
    const s = fresh();
    expect(undoKick(s)).toBe(s);
    const saved = finishKick(tapMany(2), NOW + 5 * MINUTE);
    expect(undoKick(saved)).toBe(saved);
  });
});

describe('finishing and limits', () => {
  it('a completed session ends when the target was reached, however late it is saved', () => {
    const saved = finishKick(tapMany(10), NOW + 90 * MINUTE);
    expect(saved.endedAt).toBe(NOW + 700 * SECOND);
    expect(elapsedKick(saved, NOW + 5 * 60 * MINUTE)).toBe(700 * SECOND);
  });
  it('an unfinished one ends when the person ends it', () => {
    expect(finishKick(tapMany(4), NOW + 30 * MINUTE).endedAt).toBe(NOW + 30 * MINUTE);
  });
  it('shows the provider card after 2 hours without the target, not before, not once complete', () => {
    const s = tapMany(4);
    expect(softLimitReached(s, NOW + SOFT_LIMIT_MS - 1)).toBe(false);
    expect(softLimitReached(s, NOW + SOFT_LIMIT_MS)).toBe(true);
    expect(softLimitReached(tapMany(10), NOW + 3 * SOFT_LIMIT_MS)).toBe(false);
  });
  it('closes by itself at 3 hours, at exactly 3 hours', () => {
    const s = tapMany(4);
    expect(hardLimitReached(s, NOW + HARD_LIMIT_MS - 1)).toBe(false);
    expect(hardLimitReached(s, NOW + HARD_LIMIT_MS)).toBe(true);
    expect(autoClose(s).endedAt).toBe(NOW + HARD_LIMIT_MS);
  });
  it('never reports a negative elapsed time', () => {
    expect(elapsedKick(fresh(), NOW - 5 * MINUTE)).toBe(0);
  });
});
