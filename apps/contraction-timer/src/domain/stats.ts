/**
 * Contraction statistics, DEVELOPMENT_PLAN.md §8.1. Everything here is a pure function of the stored
 * timestamps and a `now` passed in by the caller; nothing reads the clock itself.
 */
import { MINUTE, SECOND } from './defaults';
import type { Contraction } from './types';

/** Shorter than this is probably a mis-tap: shown greyed, left out of the numbers, restorable. */
export const MIN_VALID_MS = 10 * SECOND;
/** A gap longer than this between two starts is a pause, not a pattern, and is left out of averages. */
export const MAX_INTERVAL_MS = 30 * MINUTE;
export const STATS_WINDOW_MS = 60 * MINUTE;

/** Milliseconds from start to end, or null while it is running or when the times are impossible. */
export const durationOf = (c: Contraction): number | null => (c.endedAt === null || c.endedAt < c.startedAt ? null : c.endedAt - c.startedAt);

/** The contraction that is being timed right now (only the latest one can be open). */
export function openContraction(cs: readonly Contraction[]): Contraction | null {
  let latest: Contraction | null = null;
  for (const c of cs) if (c.endedAt === null && (latest === null || c.startedAt >= latest.startedAt)) latest = c;
  return latest;
}

export const byStart = (a: Contraction, b: Contraction) => a.startedAt - b.startedAt || a.id.localeCompare(b.id);

/** True when the contraction is left out of the numbers (by choice, or because it is under 10 s). */
export function isIgnored(c: Contraction): boolean {
  const d = durationOf(c);
  if (d === null) return false;
  return c.ignored ?? d < MIN_VALID_MS;
}

/** Finished, with sane times, and not ignored: what the averages and the pattern check use. Oldest first. */
export function countable(cs: readonly Contraction[]): Contraction[] {
  return cs.filter((c) => durationOf(c) !== null && !isIgnored(c)).sort(byStart);
}

/**
 * Start-to-start gaps between neighbouring contractions (the clinical convention). Gaps of zero or
 * less (a duplicate or overlapping entry) and gaps over 30 minutes are dropped.
 */
export function intervalsOf(sorted: readonly Contraction[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].startedAt - sorted[i - 1].startedAt;
    if (gap > 0 && gap <= MAX_INTERVAL_MS) out.push(gap);
  }
  return out;
}

export const mean = (xs: readonly number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface WindowStats {
  /** Contractions that count, started within the window. */
  count: number;
  avgDurationMs: number | null;
  avgIntervalMs: number | null;
}

/** Plan F4: the last hour. A contraction that started after `now` (a clock set back) is not in it. */
export function windowStats(cs: readonly Contraction[], now: number, windowMs: number = STATS_WINDOW_MS): WindowStats {
  const inWindow = countable(cs).filter((c) => c.startedAt >= now - windowMs && c.startedAt <= now);
  return {
    count: inWindow.length,
    avgDurationMs: mean(inWindow.map((c) => durationOf(c) as number)),
    avgIntervalMs: mean(intervalsOf(inWindow)),
  };
}

export interface LastContraction {
  contraction: Contraction;
  durationMs: number;
  /** Start-to-start from the one before, when there is one that counts. */
  intervalMs: number | null;
}

/** The newest finished contraction that counts, with its interval from the one before. */
export function lastContraction(cs: readonly Contraction[]): LastContraction | null {
  const list = countable(cs);
  const last = list[list.length - 1];
  if (!last) return null;
  const before = list[list.length - 2];
  const gap = before ? last.startedAt - before.startedAt : null;
  return { contraction: last, durationMs: durationOf(last) as number, intervalMs: gap !== null && gap > 0 ? gap : null };
}

/** Interval of every contraction in the list (null for the first, and when it is not meaningful). */
export function intervalFor(cs: readonly Contraction[], id: string): number | null {
  const list = countable(cs);
  const i = list.findIndex((c) => c.id === id);
  if (i < 1) return null;
  const gap = list[i].startedAt - list[i - 1].startedAt;
  return gap > 0 ? gap : null;
}

/** Which tag was used most among the given contractions, or null when none are tagged. Ties go to the stronger one. */
export function dominantIntensity(cs: readonly Contraction[]): 'mild' | 'moderate' | 'strong' | null {
  const counts = { mild: 0, moderate: 0, strong: 0 };
  for (const c of cs) if (c.intensity) counts[c.intensity]++;
  if (counts.mild + counts.moderate + counts.strong === 0) return null;
  if (counts.strong >= counts.moderate && counts.strong >= counts.mild) return 'strong';
  return counts.moderate >= counts.mild ? 'moderate' : 'mild';
}
