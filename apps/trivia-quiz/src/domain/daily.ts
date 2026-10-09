import type { Bank } from './bank';
import { CATEGORY_LIST } from './categories';
import { addDays } from './dateKey';
import { hash32, mulberry32, pick, shuffled } from './prng';
import type { DailyHistoryEntry, DailyState, DateKey, Difficulty, Question } from './types';

/** Plan §8: 3 easy, 4 medium, 3 hard. */
export const DAILY_MIX: readonly Difficulty[] = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
export const DAILY_SIZE = DAILY_MIX.length;
export const HISTORY_LIMIT = 30;

/** Plan §8: `hash32("quizora-daily-" + YYYY-MM-DD + contentVersionMajor)` with the local date. */
export const dailySeed = (date: DateKey, major: number): number => hash32(`quizora-daily-${date}${major}`);

export interface DailySet {
  date: DateKey;
  questions: Question[];
  /** One spare per difficulty, used when the player skips (the same spares for everyone). */
  reserve: Record<Difficulty, Question>;
}

/**
 * The Daily Challenge of a date: the same 10 questions on every device with the same bank major
 * version. Each question comes from a different category (so at least 5 distinct, plan §8), questions
 * with pictures are left out, and pools are sorted by id so the bank's file order cannot change it.
 */
export function dailySet(bank: Bank, date: DateKey): DailySet {
  const rng = mulberry32(dailySeed(date, bank.major));
  const mix = shuffled(rng, DAILY_MIX);
  const categories = shuffled(rng, CATEGORY_LIST);
  const used = new Set<string>();
  const poolFor = (category: (typeof CATEGORY_LIST)[number], d: Difficulty) =>
    bank.byCategory[category].filter((q) => q.d === d && !q.img && !used.has(q.id)).sort((a, b) => a.id.localeCompare(b.id));
  const choose = (category: (typeof CATEGORY_LIST)[number], d: Difficulty): Question => {
    let pool = poolFor(category, d);
    // A category short of this difficulty: fall back to any other category.
    for (let i = 0; pool.length === 0 && i < categories.length; i++) pool = poolFor(categories[i], d);
    const q = pick(rng, pool);
    used.add(q.id);
    return q;
  };
  const questions = mix.map((d, i) => choose(categories[i % categories.length], d));
  const spare = categories.slice(DAILY_SIZE % categories.length);
  const reserve = { 1: choose(spare[0] ?? categories[0], 1), 2: choose(spare[1] ?? categories[1], 2), 3: choose(spare[0] ?? categories[0], 3) } as Record<Difficulty, Question>;
  return { date, questions, reserve };
}

export const playedToday = (state: DailyState, today: DateKey): boolean => state.lastPlayedDate === today;

/** Records a finished Daily (once per date) and keeps the last 30 results. */
export function recordDaily(state: DailyState, date: DateKey, score: number): DailyState {
  const history: DailyHistoryEntry[] = [...state.history.filter((h) => h.date !== date), { date, score }].sort((a, b) => a.date.localeCompare(b.date)).slice(-HISTORY_LIMIT);
  return { lastPlayedDate: date, lastScore: score, history };
}

export interface CalendarDay {
  date: DateKey;
  score: number | null;
}

/** The last 7 local days ending today, for the strip on the Daily result (plan §5). */
export function lastSevenDays(state: DailyState, today: DateKey): CalendarDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const hit = state.history.find((h) => h.date === date);
    return { date, score: hit ? hit.score : null };
  });
}
