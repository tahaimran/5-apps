import { MINUTE, RULE_PRESETS, SECOND } from '@/domain/defaults';
import type { Contraction, ContractionSession } from '@/domain/types';

/** A fixed "now": 2026-11-04 02:58 UTC. Tests that care about the zone build their own. */
export const NOW = Date.UTC(2026, 10, 4, 2, 58, 0);

let n = 0;
export const resetIds = () => {
  n = 0;
};
export const testId = () => `t${++n}`;

/** One finished contraction starting `startAgoMs` before `now`. */
export function made(now: number, startAgoMs: number, durationMs: number, extra: Partial<Contraction> = {}): Contraction {
  const startedAt = now - startAgoMs;
  return { id: testId(), startedAt, endedAt: startedAt + durationMs, ...extra };
}

/**
 * `count` contractions `gapMs` apart (start to start), each `durationMs` long; the newest started
 * `lastStartAgoMs` before `now`.
 */
export function series(now: number, count: number, gapMs: number, durationMs: number, lastStartAgoMs = 2 * MINUTE): Contraction[] {
  const out: Contraction[] = [];
  for (let i = 0; i < count; i++) out.push(made(now, lastStartAgoMs + (count - 1 - i) * gapMs, durationMs));
  return out;
}

export function sessionOf(contractions: Contraction[], extra: Partial<ContractionSession> = {}): ContractionSession {
  const starts = contractions.map((c) => c.startedAt);
  const lastEnd = Math.max(...contractions.map((c) => c.endedAt ?? c.startedAt));
  return {
    id: 's1',
    startedAt: starts.length ? Math.min(...starts) : NOW,
    endedAt: null,
    contractions,
    ruleAtStart: RULE_PRESETS['511'],
    lastActivityAt: lastEnd,
    ...extra,
  };
}

export { MINUTE, SECOND };
