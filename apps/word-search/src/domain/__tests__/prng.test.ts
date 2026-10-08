import { hash32, mulberry32, pick, randInt, shuffled } from '../prng';

describe('prng', () => {
  it('gives the same sequence for the same seed and different ones for other seeds', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 20 }, a);
    expect(Array.from({ length: 20 }, b)).toEqual(seqA);
    expect(Array.from({ length: 20 }, mulberry32(43))).not.toEqual(seqA);
  });
  it('stays in [0, 1) and looks uniform', () => {
    const r = mulberry32(7);
    const buckets = Array(10).fill(0);
    for (let i = 0; i < 20000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      buckets[Math.floor(x * 10)]++;
    }
    for (const n of buckets) expect(n).toBeGreaterThan(1700);
  });
  it('hashes strings to stable unsigned 32-bit numbers', () => {
    expect(hash32('ws-daily-v1:2026-10-08')).toBe(hash32('ws-daily-v1:2026-10-08'));
    expect(hash32('a')).not.toBe(hash32('b'));
    for (const s of ['', 'x', 'ws-daily-v1:2026-10-08']) {
      const h = hash32(s);
      expect(Number.isInteger(h) && h >= 0 && h < 2 ** 32).toBe(true);
    }
  });
  it('draws integers in range, picks from a list and shuffles without losing items', () => {
    const r = mulberry32(1);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randInt(r, 3, 6));
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
    expect(['a', 'b']).toContain(pick(r, ['a', 'b']));
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffled(r, items);
    expect([...out].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
