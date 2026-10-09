import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { getBank } from '@/content/bank';
import { CATEGORY_IDS, checkBank, checkQuestion, ID_PREFIX, MAX_EXPLANATION_CHARS, MAX_QUESTION_CHARS, MIN_PER_TIER, normalize } from '@/content/validate';
import { CATEGORY_LIST, CONTENT_CATEGORY_IDS } from '@/domain/categories';
import { levelCount } from '@/domain/classic';
import { dailySet } from '@/domain/daily';
import { hash32, mulberry32 } from '@/domain/prng';
import { present } from '@/domain/scoring';
import type { BankQuestion } from '@/content/validate';

const dir = path.resolve(__dirname, '../../../assets/questions/en');
const bank = getBank();
const asBank = () => Object.fromEntries(CATEGORY_LIST.map((c) => [c, bank.byCategory[c] as unknown as BankQuestion[]]));

describe('bundled question bank', () => {
  it('has the same category ids as the app (validator and app lists stay in step)', () => {
    expect([...CONTENT_CATEGORY_IDS]).toEqual(CATEGORY_LIST);
    expect(CATEGORY_IDS).toEqual(CATEGORY_LIST);
  });

  it('passes every content rule: schema, lengths, options, duplicates, near duplicates, profanity, quotes', () => {
    const { problems } = checkBank(asBank());
    expect(problems).toEqual([]);
  });

  it('has at least 3,000 questions and every category large enough for 30 classic levels', () => {
    expect(bank.all.length).toBeGreaterThanOrEqual(3000);
    for (const c of CATEGORY_LIST) {
      for (const d of [1, 2, 3] as const) expect(bank.byCategory[c].filter((q) => q.d === d).length).toBeGreaterThanOrEqual(MIN_PER_TIER);
      expect(levelCount(bank, c)).toBeGreaterThanOrEqual(30);
    }
  });

  it('has unique ids with the category prefix, and unique question text across all categories', () => {
    const ids = new Set<string>();
    const texts = new Set<string>();
    for (const c of CATEGORY_LIST) {
      for (const q of bank.byCategory[c]) {
        expect(q.id.startsWith(`${ID_PREFIX[c]}-`)).toBe(true);
        expect(ids.has(q.id)).toBe(false);
        ids.add(q.id);
        const key = normalize(q.q);
        expect(texts.has(key)).toBe(false);
        texts.add(key);
      }
    }
  });

  it('has 4 different non-empty answers, an explanation and a difficulty of 1 to 3 on every question', () => {
    for (const q of bank.all) {
      expect(q.a).toHaveLength(4);
      expect(new Set(q.a.map((a) => a.trim().toLowerCase())).size).toBe(4);
      for (const a of q.a) expect(a.trim().length).toBeGreaterThan(0);
      expect(q.x.trim().length).toBeGreaterThan(0);
      expect(q.q.length).toBeLessThanOrEqual(MAX_QUESTION_CHARS);
      expect(q.x.length).toBeLessThanOrEqual(MAX_EXPLANATION_CHARS);
      expect([1, 2, 3]).toContain(q.d);
    }
  });

  it('always shows the right answer at an index from 0 to 3, wherever the shuffle puts it', () => {
    for (const q of bank.all) {
      for (let seed = 0; seed < 4; seed++) {
        const p = present(q, mulberry32(seed + q.id.length));
        expect(p.correctIndex).toBeGreaterThanOrEqual(0);
        expect(p.correctIndex).toBeLessThanOrEqual(3);
        expect(p.options[p.correctIndex]).toBe(q.a[0]);
      }
    }
  });

  it('puts the right answer in every position about equally often (no giveaway pattern)', () => {
    const spots = [0, 0, 0, 0];
    for (const q of bank.all) spots[present(q, mulberry32(hash32(`7:${q.id}:0`))).correctIndex]++;
    for (const n of spots) expect(n / bank.all.length).toBeGreaterThan(0.2);
  });

  it('re-checks cleanly question by question (the build script and the test agree)', () => {
    for (const q of bank.all) expect(checkQuestion(q, q.id)).toEqual([]);
  });

  it('matches its manifest: version, counts and sha256 of every file', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')) as { version: string; total: number; categories: Record<string, { count: number; sha256: string }> };
    expect(manifest.version).toBe(bank.version);
    expect(manifest.total).toBe(bank.all.length);
    for (const c of CATEGORY_LIST) {
      const body = fs.readFileSync(path.join(dir, `${c}.json`), 'utf8').trimEnd();
      expect(createHash('sha256').update(body).digest('hex')).toBe(manifest.categories[c].sha256);
      expect(manifest.categories[c].count).toBe(bank.byCategory[c].length);
    }
  });

  it('gives a valid Daily for 90 consecutive dates, with 3/4/3 difficulty and at least 5 categories', () => {
    for (let n = 0; n < 90; n++) {
      const date = new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10);
      const set = dailySet(bank, date);
      expect(set.questions).toHaveLength(10);
      expect(set.questions.map((q) => q.d).sort()).toEqual([1, 1, 1, 2, 2, 2, 2, 3, 3, 3]);
      expect(new Set(set.questions.map((q) => q.id.slice(0, 3))).size).toBeGreaterThanOrEqual(5);
    }
  });
});
