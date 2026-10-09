/**
 * Plan §18: bank load under 300 ms on a 2 GB Android 9 phone. CI is faster than that phone, so the bounds
 * here are regression guards, not device numbers (nothing was measured on a device).
 */
import { createBank } from '../bank';
import { dailySet } from '../daily';
import { mulberry32 } from '../prng';
import { pickQuestions } from '../selector';
import { buildBlitz, buildCategory } from '../modes';
import { startRound } from '../round';
import type { QuestionFile } from '../types';
import { CATEGORY_LIST } from '../categories';

const files = (): QuestionFile[] => CATEGORY_LIST.map((c) => require(`../../../assets/questions/en/${c}.json`) as QuestionFile);

describe('speed guards', () => {
  it('parses and indexes the whole bank in under 300 ms', () => {
    const raw = files();
    const t0 = performance.now();
    const bank = createBank(JSON.parse(JSON.stringify(raw)) as QuestionFile[]);
    expect(bank.all.length).toBeGreaterThanOrEqual(3000);
    expect(performance.now() - t0).toBeLessThan(300);
  });

  it('builds a Daily for 365 dates in under a second', () => {
    const bank = createBank(files());
    const t0 = performance.now();
    for (let n = 0; n < 365; n++) dailySet(bank, new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10));
    expect(performance.now() - t0).toBeLessThan(1000);
  });

  it('picks rounds and builds a Blitz queue fast even with a full seen map', () => {
    const bank = createBank(files());
    const seen = Object.fromEntries(bank.all.map((q, i) => [q.id, { d: 1000 + (i % 300), n: 1 + (i % 3), c: i % 2 }]));
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) pickQuestions({ pool: bank.byCategory.history, count: 10, seen, today: 1400, rng: mulberry32(i) });
    const blitz = buildBlitz({ bank, seed: 3, relaxed: false, seen, today: 1400 });
    expect(startRound(blitz).queue.length).toBeGreaterThan(60);
    const category = buildCategory({ bank, seed: 1, relaxed: false, category: 'logic', difficulty: 3, seen, today: 1400 });
    expect(category.questions).toHaveLength(10);
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
