import { fixtureBank } from '@/testing/fixtureBank';
import { poolOf } from '../bank';
import { mulberry32 } from '../prng';
import { compactSeen, markSeen, pickQuestions, rotationWeight, seenShare } from '../selector';
import type { SeenEntry } from '../types';

const bank = fixtureBank(100);
const pool = poolOf(bank, 'science', 2);

describe('pickQuestions', () => {
  it('prefers never-seen questions and returns the requested count without repeats', () => {
    const rng = mulberry32(1);
    const picked = pickQuestions({ pool, count: 10, seen: {}, today: 100, rng });
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((q) => q.id)).size).toBe(10);
  });

  it('is reproducible for a seed', () => {
    const a = pickQuestions({ pool, count: 10, seen: {}, today: 100, rng: mulberry32(9) }).map((q) => q.id);
    const b = pickQuestions({ pool, count: 10, seen: {}, today: 100, rng: mulberry32(9) }).map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('skips excluded ids (the current session)', () => {
    const exclude = new Set(pool.slice(0, 95).map((q) => q.id));
    const picked = pickQuestions({ pool, count: 5, seen: {}, today: 100, rng: mulberry32(3), exclude });
    for (const q of picked) expect(exclude.has(q.id)).toBe(false);
  });

  it('falls back to spaced rotation once fewer than a round are unseen, never a question from the last 3 days while others exist', () => {
    const seen: Record<string, SeenEntry> = {};
    pool.forEach((q, i) => {
      seen[q.id] = { d: i < 50 ? 10 : 99, n: 1, c: 1 }; // half old, half seen yesterday
    });
    const picked = pickQuestions({ pool, count: 10, seen, today: 100, rng: mulberry32(4) });
    expect(picked).toHaveLength(10);
    for (const q of picked) expect(100 - seen[q.id].d).toBeGreaterThanOrEqual(3);
  });

  it('weights older and previously missed questions higher', () => {
    expect(rotationWeight({ d: 90, n: 1, c: 1 }, 100)).toBe(100);
    expect(rotationWeight({ d: 50, n: 1, c: 1 }, 100)).toBe(2500);
    expect(rotationWeight({ d: 90, n: 2, c: 1 }, 100)).toBe(200);
  });

  it('missed questions come back more often than answered ones', () => {
    const small = pool.slice(0, 20);
    const seen: Record<string, SeenEntry> = {};
    small.forEach((q, i) => (seen[q.id] = { d: 50, n: 1, c: i < 10 ? 0 : 1 }));
    let missed = 0;
    for (let s = 0; s < 300; s++) {
      for (const q of pickQuestions({ pool: small, count: 3, seen, today: 100, rng: mulberry32(s) })) if (seen[q.id].c === 0) missed++;
    }
    expect(missed).toBeGreaterThan(450); // 900 picks: 50% would be 450, weight 2 gives about 67%
  });

  it('still fills a round when the pool is small, using the oldest recent ones last', () => {
    const small = pool.slice(0, 12);
    const seen: Record<string, SeenEntry> = {};
    small.forEach((q, i) => (seen[q.id] = { d: 99 - (i % 2), n: 1, c: 1 }));
    expect(pickQuestions({ pool: small, count: 10, seen, today: 100, rng: mulberry32(2) })).toHaveLength(10);
  });

  it('scripted run: 300 rounds across a whole category never repeat a question within 3 days at 3 rounds a day', () => {
    const cat = bank.byCategory.history; // 300 questions: 30 a day gives a 90-question window
    let seen: Record<string, SeenEntry> = {};
    const lastDay = new Map<string, number>();
    for (let round = 0; round < 300; round++) {
      const day = 1000 + Math.floor(round / 3);
      for (const q of pickQuestions({ pool: cat, count: 10, seen, today: day, rng: mulberry32(round) })) {
        const before = lastDay.get(q.id);
        if (before !== undefined) expect(day - before).toBeGreaterThanOrEqual(3);
        lastDay.set(q.id, day);
        seen = markSeen(seen, q.id, day, true);
      }
    }
    expect(lastDay.size).toBeGreaterThan(250);
  });
});

describe('seen map', () => {
  it('counts times seen and times correct', () => {
    let seen = markSeen({}, 'a', 10, false);
    seen = markSeen(seen, 'a', 12, true);
    expect(seen.a).toEqual({ d: 12, n: 2, c: 1 });
  });
  it('compacts only above 10,000 entries, dropping those older than a year', () => {
    const big: Record<string, SeenEntry> = {};
    for (let i = 0; i < 10_001; i++) big[`x${i}`] = { d: i < 5000 ? 100 : 900, n: 1, c: 1 };
    const out = compactSeen(big, 1000);
    expect(Object.keys(out)).toHaveLength(5001);
    expect(compactSeen({ a: { d: 1, n: 1, c: 1 } }, 1000)).toEqual({ a: { d: 1, n: 1, c: 1 } });
  });
  it('measures how much of a pool was seen', () => {
    expect(seenShare(pool, {})).toBe(0);
    expect(seenShare(pool, Object.fromEntries(pool.slice(0, 50).map((q) => [q.id, { d: 1, n: 1, c: 1 }])))).toBe(0.5);
  });
});
