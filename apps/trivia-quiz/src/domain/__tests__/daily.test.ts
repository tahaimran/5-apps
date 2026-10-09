import { fixtureBank } from '@/testing/fixtureBank';
import { categoryOfId } from '../categories';
import { dailySeed, dailySet, lastSevenDays, playedToday, recordDaily } from '../daily';
import { defaultDaily } from '../defaults';

const bank = fixtureBank(100);

describe('Daily Challenge selection', () => {
  it('is the same for the same date and bank major version, on any call', () => {
    const a = dailySet(bank, '2026-10-08').questions.map((q) => q.id);
    const b = dailySet(fixtureBank(100), '2026-10-08').questions.map((q) => q.id);
    expect(a).toEqual(b);
  });
  it('differs by date and by bank major version', () => {
    const ids = (d: string, b = bank) => dailySet(b, d).questions.map((q) => q.id).join();
    expect(ids('2026-10-08')).not.toBe(ids('2026-10-09'));
    expect(ids('2026-10-08')).not.toBe(ids('2026-10-08', fixtureBank(100, '2.0.0')));
    expect(ids('2026-10-08')).toBe(ids('2026-10-08', fixtureBank(100, '1.4.2'))); // minor versions do not reshuffle it
  });
  it('seeds with hash32("quizora-daily-" + date + major)', () => {
    expect(dailySeed('2026-10-08', 1)).toBe(dailySeed('2026-10-08', 1));
    expect(dailySeed('2026-10-08', 1)).not.toBe(dailySeed('2026-10-08', 2));
  });
  it('has 3 easy, 4 medium and 3 hard questions from at least 5 distinct categories, none repeated, none with a picture', () => {
    for (let n = 1; n <= 40; n++) {
      const date = `2026-11-${String(n).padStart(2, '0')}`;
      const set = dailySet(bank, date);
      expect(set.questions).toHaveLength(10);
      const d = [1, 2, 3].map((k) => set.questions.filter((q) => q.d === k).length);
      expect(d).toEqual([3, 4, 3]);
      expect(new Set(set.questions.map((q) => categoryOfId(q.id))).size).toBeGreaterThanOrEqual(5);
      expect(new Set(set.questions.map((q) => q.id)).size).toBe(10);
      expect(set.questions.every((q) => !q.img)).toBe(true);
    }
  });
  it('is not changed by the order of questions in the bank files', () => {
    const shuffledBank = fixtureBank(100);
    for (const c of Object.keys(shuffledBank.byCategory) as (keyof typeof shuffledBank.byCategory)[]) shuffledBank.byCategory[c].reverse();
    expect(dailySet(shuffledBank, '2026-10-08').questions.map((q) => q.id)).toEqual(dailySet(bank, '2026-10-08').questions.map((q) => q.id));
  });
  it('has one spare per difficulty that is not in the set', () => {
    const set = dailySet(bank, '2026-10-08');
    const ids = new Set(set.questions.map((q) => q.id));
    for (const d of [1, 2, 3] as const) {
      expect(set.reserve[d].d).toBe(d);
      expect(ids.has(set.reserve[d].id)).toBe(false);
    }
  });
  it('skips pictures when picking', () => {
    const b = fixtureBank(100);
    for (const q of b.byCategory.general) if (q.d === 1) q.img = 'x.webp';
    for (let n = 1; n <= 20; n++) expect(dailySet(b, `2026-12-${String(n).padStart(2, '0')}`).questions.every((q) => !q.img)).toBe(true);
  });
});

describe('daily state', () => {
  it('records a result once per date and keeps the last 30', () => {
    let s = defaultDaily();
    for (let n = 1; n <= 35; n++) s = recordDaily(s, `2026-10-${String(n).padStart(2, '0')}`, n % 11);
    expect(s.history).toHaveLength(30);
    expect(s.history[0].date).toBe('2026-10-06');
    expect(recordDaily(s, '2026-10-35', 4).history.filter((h) => h.date === '2026-10-35')).toHaveLength(1);
    expect(playedToday(s, '2026-10-35')).toBe(true);
    expect(playedToday(s, '2026-10-36')).toBe(false);
  });
  it('builds the 7-day strip ending today', () => {
    const s = recordDaily(recordDaily(defaultDaily(), '2026-10-07', 8), '2026-10-09', 10);
    const week = lastSevenDays(s, '2026-10-09');
    expect(week.map((d) => d.date)).toEqual(['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
    expect(week.map((d) => d.score)).toEqual([null, null, null, null, 8, null, 10]);
  });
});
