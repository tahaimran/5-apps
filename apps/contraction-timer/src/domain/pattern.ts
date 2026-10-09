/**
 * Pattern detection, DEVELOPMENT_PLAN.md §8.2: does the last stretch match the rule the provider gave
 * ("5-1-1": contractions about 5 minutes apart, about a minute long, for an hour). This only compares
 * numbers with a rule the person chose; it never says anything about labor.
 */
import { MINUTE, SECOND } from './defaults';
import { countable, durationOf, intervalsOf, mean } from './stats';
import type { Contraction, PatternRule, PatternState } from './types';

/** The pattern must cover at least this share of the sustain time. */
export const SPAN_SHARE = 0.9;
/** At least this share of gaps (and lengths) must be within the rule's own tolerance. */
export const SHARE_REQUIRED = 0.8;
/** A gap may be this much over the rule and still count (plan: max + 30 s). */
export const INTERVAL_TOLERANCE_MS = 30 * SECOND;
/** A length may be this much under the rule and still count (plan: min - 10 s). */
export const DURATION_TOLERANCE_MS = 10 * SECOND;
/** After this long with no match a new match is a new episode and may show the banner again. */
export const REARM_MS = 30 * MINUTE;

export interface PatternResult {
  matches: boolean;
  /** Why not, for tests and the debug screens. Empty when it matches. */
  reasons: string[];
}

export function evaluatePattern(rule: PatternRule, contractions: readonly Contraction[], now: number): PatternResult {
  const reasons: string[] = [];
  const sustainMs = rule.sustainMin * MINUTE;
  const intervalMaxMs = rule.intervalMaxMin * MINUTE;
  const w = countable(contractions).filter((c) => c.startedAt >= now - sustainMs && c.startedAt <= now);

  const needed = Math.ceil(rule.sustainMin / rule.intervalMaxMin) - 1;
  if (w.length < needed) reasons.push(`only ${w.length} contractions, need ${needed}`);
  if (w.length === 0) return { matches: false, reasons };

  const span = now - w[0].startedAt;
  if (span < SPAN_SHARE * sustainMs) reasons.push('has not lasted long enough');

  // Not in the plan's list: a pattern that stopped ten minutes ago should not raise a banner now.
  // The newest contraction must have started within twice the rule's gap.
  const sinceLast = now - w[w.length - 1].startedAt;
  if (sinceLast > 2 * intervalMaxMs) reasons.push('the latest contraction is too long ago');

  const gaps = intervalsOf(w);
  const avgGap = mean(gaps);
  if (avgGap === null) reasons.push('no gaps to compare');
  else {
    if (avgGap > intervalMaxMs) reasons.push('average gap is longer than the rule');
    const within = gaps.filter((g) => g <= intervalMaxMs + INTERVAL_TOLERANCE_MS).length / gaps.length;
    if (within < SHARE_REQUIRED) reasons.push('too many gaps are longer than the rule');
  }

  const lengths = w.map((c) => durationOf(c) as number);
  const avgLength = mean(lengths) as number;
  const minLengthMs = rule.durationMinSec * SECOND;
  if (avgLength < minLengthMs) reasons.push('average length is shorter than the rule');
  const longEnough = lengths.filter((d) => d >= minLengthMs - DURATION_TOLERANCE_MS).length / lengths.length;
  if (longEnough < SHARE_REQUIRED) reasons.push('too many contractions are shorter than the rule');

  return { matches: reasons.length === 0, reasons };
}

export interface EpisodeUpdate {
  state: PatternState;
  /** A new episode began: show the banner (and vibrate if the person allows it). */
  fire: boolean;
}

/**
 * Banner bookkeeping (plan §8.2 "Episode logic"): the banner shows once when the match turns on,
 * and shows again only after 30 minutes without a match.
 */
export function nextPatternState(prev: PatternState | undefined, matchesNow: boolean, now: number): EpisodeUpdate {
  const state: PatternState = { ...prev };
  if (!matchesNow) {
    // The episode closes (re-arms) once 30 minutes have passed since the last match.
    if (state.episodeStartedAt !== undefined && state.lastMatchAt !== undefined && now - state.lastMatchAt >= REARM_MS) {
      return { state: { lastMatchAt: state.lastMatchAt }, fire: false };
    }
    return { state, fire: false };
  }
  const gapSinceMatch = state.lastMatchAt === undefined ? Infinity : now - state.lastMatchAt;
  const open = state.episodeStartedAt !== undefined && gapSinceMatch < REARM_MS;
  if (open) return { state: { ...state, lastMatchAt: now }, fire: false };
  return { state: { episodeStartedAt: now, lastMatchAt: now, dismissed: false }, fire: true };
}

/** The banner is up while the pattern matches right now, within an open episode the person has not dismissed. */
export const bannerVisible = (state: PatternState | undefined, matchesNow: boolean): boolean =>
  matchesNow && !!state && state.episodeStartedAt !== undefined && !state.dismissed;
