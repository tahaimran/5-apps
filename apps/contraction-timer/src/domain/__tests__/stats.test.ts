import { countable, dominantIntensity, durationOf, intervalFor, intervalsOf, isIgnored, lastContraction, openContraction, windowStats } from '../stats';
import { made, NOW, resetIds, series, MINUTE, SECOND } from '@/testing/fixtures';

beforeEach(resetIds);

describe('durationOf and ignored contractions', () => {
  it('measures start to end and is null while running or with impossible times', () => {
    expect(durationOf({ id: 'a', startedAt: 1000, endedAt: 61_000 })).toBe(60_000);
    expect(durationOf({ id: 'a', startedAt: 1000, endedAt: null })).toBeNull();
    expect(durationOf({ id: 'a', startedAt: 5000, endedAt: 1000 })).toBeNull();
  });
  it('greys out anything under 10 s unless the person restored it, and keeps a long one unless they ignored it', () => {
    expect(isIgnored(made(NOW, MINUTE, 9 * SECOND))).toBe(true);
    expect(isIgnored(made(NOW, MINUTE, 10 * SECOND))).toBe(false);
    expect(isIgnored(made(NOW, MINUTE, 3 * SECOND, { ignored: false }))).toBe(false);
    expect(isIgnored(made(NOW, MINUTE, 60 * SECOND, { ignored: true }))).toBe(true);
  });
  it('never calls a running contraction ignored', () => {
    expect(isIgnored({ id: 'a', startedAt: NOW, endedAt: null })).toBe(false);
  });
});

describe('intervals', () => {
  it('are start to start, not end to start', () => {
    const cs = series(NOW, 3, 5 * MINUTE, 60 * SECOND);
    expect(intervalsOf(countable(cs))).toEqual([5 * MINUTE, 5 * MINUTE]);
  });
  it('drop a gap over 30 minutes (a pause) and a zero or negative gap (a duplicate)', () => {
    const a = made(NOW, 90 * MINUTE, 60 * SECOND);
    const b = made(NOW, 40 * MINUTE, 60 * SECOND); // 50 min after a
    const c = { ...made(NOW, 40 * MINUTE, 60 * SECOND), id: 'dup' }; // same start as b
    const d = made(NOW, 35 * MINUTE, 60 * SECOND);
    expect(intervalsOf(countable([a, b, c, d]))).toEqual([5 * MINUTE]);
  });
  it('skip a mis-tap, so the gap runs between the two real ones', () => {
    const a = made(NOW, 12 * MINUTE, 60 * SECOND);
    const tap = made(NOW, 8 * MINUTE, 2 * SECOND);
    const b = made(NOW, 6 * MINUTE, 60 * SECOND);
    expect(intervalsOf(countable([a, tap, b]))).toEqual([6 * MINUTE]);
  });
  it('are found for one contraction by id', () => {
    const cs = series(NOW, 3, 4 * MINUTE, 50 * SECOND);
    expect(intervalFor(cs, cs[0].id)).toBeNull();
    expect(intervalFor(cs, cs[2].id)).toBe(4 * MINUTE);
    expect(intervalFor(cs, 'nope')).toBeNull();
  });
});

describe('windowStats (the last hour)', () => {
  it('averages duration and interval over finished contractions that started within 60 minutes', () => {
    const cs = [made(NOW, 70 * MINUTE, 90 * SECOND), ...series(NOW, 4, 5 * MINUTE, 60 * SECOND, MINUTE)];
    const w = windowStats(cs, NOW);
    expect(w.count).toBe(4);
    expect(w.avgDurationMs).toBe(60 * SECOND);
    expect(w.avgIntervalMs).toBe(5 * MINUTE);
  });
  it('has no numbers for an empty window, and no interval for one contraction', () => {
    expect(windowStats([], NOW)).toEqual({ count: 0, avgDurationMs: null, avgIntervalMs: null });
    const one = windowStats([made(NOW, MINUTE, 40 * SECOND)], NOW);
    expect(one.avgDurationMs).toBe(40 * SECOND);
    expect(one.avgIntervalMs).toBeNull();
  });
  it('leaves out the contraction being timed and one that starts after "now" (the clock was set back)', () => {
    const running = { id: 'r', startedAt: NOW - 20 * SECOND, endedAt: null };
    const future = made(NOW, -10 * MINUTE, 60 * SECOND);
    expect(windowStats([running, future], NOW).count).toBe(0);
  });
  it('treats overlapping or reversed entries safely', () => {
    const bad = { id: 'x', startedAt: NOW - MINUTE, endedAt: NOW - 5 * MINUTE };
    const ok = made(NOW, 10 * MINUTE, 60 * SECOND);
    expect(windowStats([bad, ok], NOW).count).toBe(1);
  });
});

describe('lastContraction, openContraction and intensity', () => {
  it('returns the newest one that counts, with its interval', () => {
    const cs = [...series(NOW, 3, 6 * MINUTE, 55 * SECOND), made(NOW, 20 * SECOND, 3 * SECOND)];
    const last = lastContraction(cs)!;
    expect(last.contraction.id).toBe(cs[2].id);
    expect(last.intervalMs).toBe(6 * MINUTE);
    expect(last.durationMs).toBe(55 * SECOND);
    expect(lastContraction([])).toBeNull();
  });
  it('finds the open one', () => {
    const open = { id: 'o', startedAt: NOW, endedAt: null };
    expect(openContraction([made(NOW, MINUTE, SECOND * 30), open])).toBe(open);
    expect(openContraction([made(NOW, MINUTE, SECOND * 30)])).toBeNull();
  });
  it('names the most used tag, the stronger on a tie, and nothing when untagged', () => {
    const t = (i?: 'mild' | 'moderate' | 'strong') => made(NOW, MINUTE, 30 * SECOND, { intensity: i });
    expect(dominantIntensity([t(), t()])).toBeNull();
    expect(dominantIntensity([t('mild'), t('mild'), t('strong')])).toBe('mild');
    expect(dominantIntensity([t('mild'), t('strong')])).toBe('strong');
    expect(dominantIntensity([t('moderate'), t('mild'), t('moderate')])).toBe('moderate');
  });
});
