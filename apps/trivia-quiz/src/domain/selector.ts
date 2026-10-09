import type { Rng } from './prng';
import { shuffled } from './prng';
import type { Question, QuestionId, SeenEntry } from './types';

/** Plan §8: never repeat a question seen in the last 3 days (or in this session) while others exist. */
export const RECENT_DAYS = 3;

export interface PickInput {
  /** Candidates, already filtered by category and difficulty. */
  pool: readonly Question[];
  count: number;
  seen: Readonly<Record<QuestionId, SeenEntry>>;
  /** epochDay of today. */
  today: number;
  rng: Rng;
  /** Ids to leave out: the current session, or questions already picked. */
  exclude?: ReadonlySet<QuestionId>;
}

/** Weight of a seen question: older and previously missed ones resurface first (plan §8). */
export function rotationWeight(entry: SeenEntry, today: number): number {
  const days = Math.max(1, today - entry.d);
  return days * days * (entry.c < entry.n ? 2 : 1);
}

/** Draws `count` items without replacement, each chosen with probability proportional to its weight. */
function weightedSample<T>(items: readonly T[], weight: (item: T) => number, count: number, rng: Rng): T[] {
  const left = [...items];
  const weights = left.map(weight);
  const out: T[] = [];
  while (out.length < count && left.length > 0) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let i = 0;
    while (i < left.length - 1 && r >= weights[i]) {
      r -= weights[i];
      i++;
    }
    out.push(left[i]);
    left.splice(i, 1);
    weights.splice(i, 1);
  }
  return out;
}

/**
 * Picks `count` questions: first the never-seen ones (shuffled), then, if fewer than `count` are
 * unseen, spaced rotation over the seen ones (weight = daysSince² × 2 if missed). Questions seen in
 * the last RECENT_DAYS days are used only as a last resort, oldest first, when the pool is too small.
 */
export function pickQuestions({ pool, count, seen, today, rng, exclude }: PickInput): Question[] {
  const usable = pool.filter((q) => !exclude?.has(q.id));
  const unseen = usable.filter((q) => !seen[q.id]);
  const picked = shuffled(rng, unseen).slice(0, count);
  if (picked.length >= count) return picked;

  const rotated = usable.filter((q) => {
    const s = seen[q.id];
    return s !== undefined && today - s.d >= RECENT_DAYS;
  });
  picked.push(...weightedSample(rotated, (q) => rotationWeight(seen[q.id], today), count - picked.length, rng));
  if (picked.length >= count) return picked;

  // Pool smaller than the request even without the recent window: take the oldest of the recent ones.
  const chosen = new Set(picked.map((q) => q.id));
  const recent = usable.filter((q) => !chosen.has(q.id)).sort((a, b) => (seen[a.id]?.d ?? 0) - (seen[b.id]?.d ?? 0));
  picked.push(...recent.slice(0, count - picked.length));
  return picked;
}

/** Records a shown question: last-seen day, times seen and times correct. */
export function markSeen(seen: Record<QuestionId, SeenEntry>, id: QuestionId, today: number, correct: boolean): Record<QuestionId, SeenEntry> {
  const old = seen[id];
  return { ...seen, [id]: { d: today, n: (old?.n ?? 0) + 1, c: (old?.c ?? 0) + (correct ? 1 : 0) } };
}

export const SEEN_COMPACT_ABOVE = 10_000;
export const SEEN_MAX_AGE_DAYS = 365;

/** Plan §9: when the map passes 10,000 entries, drop those not seen for a year. */
export function compactSeen(seen: Record<QuestionId, SeenEntry>, today: number): Record<QuestionId, SeenEntry> {
  const ids = Object.keys(seen);
  if (ids.length <= SEEN_COMPACT_ABOVE) return seen;
  return Object.fromEntries(ids.filter((id) => today - seen[id].d <= SEEN_MAX_AGE_DAYS).map((id) => [id, seen[id]]));
}

/** Share of a pool that has been seen, 0 to 1. */
export function seenShare(pool: readonly Question[], seen: Readonly<Record<QuestionId, SeenEntry>>): number {
  if (pool.length === 0) return 0;
  return pool.filter((q) => seen[q.id]).length / pool.length;
}
