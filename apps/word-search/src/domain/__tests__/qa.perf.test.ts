/** Plan F1 / §17: 12x12 in under 50 ms on a mid-range phone. CI is faster than a Moto G, so the bound here is a regression guard, not the device number. */
import { generatePuzzle } from '../generator';
import { PACKS } from '../packs';
import { verifyPuzzle } from '../verify';

describe('generator speed and fuzz', () => {
  it('builds hard 12x12 puzzles quickly (p95 under 50 ms on this machine)', () => {
    const times: number[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const pack = PACKS[seed % PACKS.length];
      const t0 = performance.now();
      generatePuzzle({ id: 'p', packId: pack.id, difficulty: 'hard', size: 12, seed, words: pack.words });
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    expect(p95).toBeLessThan(50);
  });

  it('10,000-seed fuzz across difficulties, sizes and packs finds no invalid puzzle', () => {
    const sizes = { easy: [6, 7, 8], medium: [8, 9, 10], hard: [10, 11, 12] } as const;
    const bad: string[] = [];
    for (let seed = 1; seed <= 10000; seed++) {
      const difficulty = (['easy', 'medium', 'hard'] as const)[seed % 3];
      const size = sizes[difficulty][seed % 3];
      const pack = PACKS[seed % PACKS.length];
      const p = generatePuzzle({ id: 'f', packId: pack.id, difficulty, size, seed, words: pack.words });
      const problems = verifyPuzzle(p);
      if (problems.length) bad.push(`${seed}: ${problems[0]}`);
    }
    expect(bad).toEqual([]);
  }, 120000);
});
