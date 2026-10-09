import { RULE_PRESETS } from '../defaults';
import {
  addContraction,
  clockSetBack,
  deleteContraction,
  editTimes,
  elapsedOf,
  endSession,
  IDLE_AUTO_END_MS,
  IDLE_PROMPT_MS,
  idleStatus,
  isLongRunning,
  mergeWithNext,
  repairSession,
  sessionEnd,
  sessionStart,
  setIntensity,
  setNote,
  snooze,
  tap,
  TAP_DEBOUNCE_MS,
  toggleIgnored,
  undoLastTap,
} from '../session';
import { isIgnored, openContraction } from '../stats';
import type { ContractionSession } from '../types';
import { made, NOW, resetIds, sessionOf, testId, MINUTE, SECOND } from '@/testing/fixtures';

beforeEach(resetIds);
const rule = RULE_PRESETS['511'];

/** Taps start, stop, start... at the given offsets (ms after NOW). */
function tapAll(offsets: number[], from: ContractionSession | null = null) {
  let s = from;
  for (const o of offsets) s = tap(s, NOW + o, rule, testId).session;
  return s!;
}

describe('the one button', () => {
  it('the first tap starts a session and a contraction; the next stops it', () => {
    const a = tap(null, NOW, rule, testId);
    expect(a.kind).toBe('started');
    expect(a.session.startedAt).toBe(NOW);
    expect(a.session.contractions).toHaveLength(1);
    expect(a.session.contractions[0]).toMatchObject({ startedAt: NOW, endedAt: null });
    const b = tap(a.session, NOW + 45 * SECOND, rule, testId);
    expect(b.kind).toBe('stopped');
    expect(b.session.contractions[0].endedAt).toBe(NOW + 45 * SECOND);
    expect(b.session.lastActivityAt).toBe(NOW + 45 * SECOND);
  });

  it('remembers the rule the session began with', () => {
    expect(tap(null, NOW, RULE_PRESETS['411'], testId).session.ruleAtStart.preset).toBe('411');
  });

  it('ignores a second tap within half a second (a double tap must not stop what just began)', () => {
    const a = tap(null, NOW, rule, testId).session;
    const b = tap(a, NOW + TAP_DEBOUNCE_MS - 1, rule, testId);
    expect(b.kind).toBe('ignored');
    expect(b.session).toBe(a);
    expect(tap(a, NOW + TAP_DEBOUNCE_MS, rule, testId).kind).toBe('stopped');
  });

  it('does not ignore a tap when the clock went backwards', () => {
    const a = tap(null, NOW, rule, testId).session;
    expect(tap(a, NOW - 10 * MINUTE, rule, testId).kind).toBe('stopped');
  });

  it('a running contraction is derived from its start time: killing and reopening 3 minutes later shows 3:00', () => {
    const a = tap(null, NOW, rule, testId).session;
    const reloaded = JSON.parse(JSON.stringify(a)) as ContractionSession;
    expect(elapsedOf(openContraction(reloaded.contractions)!, NOW + 3 * MINUTE)).toBe(3 * MINUTE);
  });

  it('never shows a negative time when the clock is set back, and stops at zero length', () => {
    const a = tap(null, NOW, rule, testId).session;
    expect(elapsedOf(a.contractions[0], NOW - 5 * MINUTE)).toBe(0);
    const stopped = tap(a, NOW - 5 * MINUTE, rule, testId).session;
    expect(stopped.contractions[0].endedAt).toBe(NOW);
    expect(isIgnored(stopped.contractions[0])).toBe(true);
  });

  it('works across midnight and a DST change because it only stores epoch milliseconds', () => {
    const base = Date.UTC(2026, 2, 8, 6, 59, 0); // around the US spring-forward instant
    let s = tap(null, base, rule, testId).session;
    s = tap(s, base + 60 * SECOND, rule, testId).session;
    s = tap(s, base + 5 * MINUTE, rule, testId).session;
    s = tap(s, base + 5 * MINUTE + 60 * SECOND, rule, testId).session;
    expect(s.contractions.map((c) => (c.endedAt as number) - c.startedAt)).toEqual([60 * SECOND, 60 * SECOND]);
    expect(s.contractions[1].startedAt - s.contractions[0].startedAt).toBe(5 * MINUTE);
  });
});

describe('undo last tap', () => {
  it('removes a contraction that was just started, and the whole session if it was the only one', () => {
    const a = tapAll([0]);
    expect(undoLastTap(a)).toBeNull();
    const b = tapAll([0, 40 * SECOND, 5 * MINUTE]);
    const undone = undoLastTap(b)!;
    expect(undone.contractions).toHaveLength(1);
    expect(undone.lastActivityAt).toBe(NOW + 40 * SECOND);
  });
  it('runs the contraction again when the last tap stopped it', () => {
    const b = tapAll([0, 40 * SECOND]);
    const undone = undoLastTap(b)!;
    expect(undone.contractions[0].endedAt).toBeNull();
    expect(undone.lastActivityAt).toBe(NOW);
  });
  it('has nothing to undo in an empty session', () => {
    expect(undoLastTap({ ...sessionOf([made(NOW, MINUTE, 30 * SECOND)]), contractions: [] })).toBeNull();
  });
});

describe('intensity, notes and ignoring', () => {
  it('tags and untags a contraction', () => {
    const s = sessionOf([made(NOW, MINUTE, 30 * SECOND, { id: 'a' })]);
    expect(setIntensity(s, 'a', 'strong').contractions[0].intensity).toBe('strong');
    expect(setIntensity(setIntensity(s, 'a', 'strong'), 'a', undefined).contractions[0].intensity).toBeUndefined();
  });
  it('trims notes and drops empty ones', () => {
    const s = sessionOf([made(NOW, MINUTE, 30 * SECOND, { id: 'a' })]);
    expect(setNote(s, 'a', '  waters not broken ').contractions[0].note).toBe('waters not broken');
    expect(setNote(setNote(s, 'a', 'x'), 'a', '   ').contractions[0].note).toBeUndefined();
  });
  it('restores a greyed-out contraction and greys out a good one, by explicit choice', () => {
    const s = sessionOf([made(NOW, MINUTE, 4 * SECOND, { id: 'short' }), made(NOW, 5 * MINUTE, 60 * SECOND, { id: 'long' })]);
    const restored = toggleIgnored(s, 'short');
    expect(isIgnored(restored.contractions[0])).toBe(false);
    expect(isIgnored(toggleIgnored(restored, 'short').contractions[0])).toBe(true);
    expect(isIgnored(toggleIgnored(s, 'long').contractions[1])).toBe(true);
  });
});

describe('editing', () => {
  const s = () => sessionOf([made(NOW, 20 * MINUTE, 60 * SECOND, { id: 'a' }), made(NOW, 15 * MINUTE, 60 * SECOND, { id: 'b' }), made(NOW, 10 * MINUTE, 60 * SECOND, { id: 'c' })]);

  it('moves a contraction', () => {
    const r = editTimes(s(), 'b', { startedAt: NOW - 14 * MINUTE - 30 * SECOND, endedAt: NOW - 13 * MINUTE }, NOW);
    expect(r.ok && r.session.contractions[1].startedAt).toBe(NOW - 14 * MINUTE - 30 * SECOND);
  });
  it('refuses an end before the start, a zero length, the future, over 30 minutes, and an overlap', () => {
    const reason = (patch: { startedAt?: number; endedAt?: number }, id = 'b') => {
      const r = editTimes(s(), id, patch, NOW);
      return r.ok ? 'ok' : r.reason;
    };
    expect(reason({ endedAt: NOW - 16 * MINUTE })).toBe('end-before-start');
    expect(reason({ endedAt: NOW - 15 * MINUTE })).toBe('too-short');
    expect(reason({ endedAt: NOW + MINUTE })).toBe('in-future');
    expect(addContraction(s(), NOW - 100 * MINUTE, 31 * MINUTE, NOW, testId)).toEqual({ ok: false, reason: 'too-long' });
    expect(reason({ endedAt: NOW - 9 * MINUTE - 30 * SECOND })).toBe('overlaps');
    expect(reason({ startedAt: NOW - 19 * MINUTE - 30 * SECOND })).toBe('overlaps');
    expect(reason({ endedAt: NOW - 14 * MINUTE }, 'zzz')).toBe('not-found');
  });
  it('does not edit the contraction being timed', () => {
    const running = { ...sessionOf([made(NOW, 20 * MINUTE, 60 * SECOND)]), contractions: [{ id: 'r', startedAt: NOW - 10 * SECOND, endedAt: null }] };
    const r = editTimes(running, 'r', { startedAt: NOW - 20 * SECOND }, NOW);
    expect(r).toEqual({ ok: false, reason: 'open' });
  });
  it('allows touching times (end of one equals start of the next)', () => {
    const r = editTimes(s(), 'a', { endedAt: NOW - 15 * MINUTE }, NOW);
    expect(r.ok).toBe(true);
  });
  it('adds a missed contraction and moves the session start earlier if needed', () => {
    const r = addContraction(s(), NOW - 30 * MINUTE, 50 * SECOND, NOW, testId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.session.contractions).toHaveLength(4);
      expect(r.session.startedAt).toBe(NOW - 30 * MINUTE);
      expect(sessionStart(r.session)).toBe(NOW - 30 * MINUTE);
    }
    const clash = addContraction(s(), NOW - 15 * MINUTE + 10 * SECOND, 30 * SECOND, NOW, testId);
    expect(clash).toEqual({ ok: false, reason: 'overlaps' });
  });
  it('deletes a row', () => {
    expect(deleteContraction(s(), 'b').contractions.map((c) => c.id)).toEqual(['a', 'c']);
  });
  it('merges a row with the next: earliest start, latest end, the stronger tag, notes joined', () => {
    const base = sessionOf([
      made(NOW, 20 * MINUTE, 30 * SECOND, { id: 'a', intensity: 'mild', note: 'one' }),
      made(NOW, 20 * MINUTE - 40 * SECOND, 30 * SECOND, { id: 'b', intensity: 'strong', note: 'two' }),
      made(NOW, 10 * MINUTE, 60 * SECOND, { id: 'c' }),
    ]);
    const r = mergeWithNext(base, 'a');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.session.contractions).toHaveLength(2);
      expect(r.session.contractions[0]).toMatchObject({ id: 'a', startedAt: NOW - 20 * MINUTE, endedAt: NOW - 20 * MINUTE + 70 * SECOND, intensity: 'strong', note: 'one · two' });
    }
    expect(mergeWithNext(base, 'c')).toEqual({ ok: false, reason: 'not-found' });
  });
});

describe('idle and ending', () => {
  const resting = () => sessionOf([made(NOW, 10 * MINUTE, 60 * SECOND)]); // lastActivityAt = NOW - 9 min

  it('is active, then asks after 2 hours, then ends itself after 6', () => {
    const s = resting();
    expect(idleStatus(s, NOW)).toBe('active');
    expect(idleStatus(s, s.lastActivityAt + IDLE_PROMPT_MS - 1)).toBe('active');
    expect(idleStatus(s, s.lastActivityAt + IDLE_PROMPT_MS)).toBe('prompt');
    expect(idleStatus(s, s.lastActivityAt + IDLE_AUTO_END_MS)).toBe('autoEnd');
  });
  it('"Keep" silences the prompt for 2 more hours but not the 6-hour end', () => {
    const s = resting();
    const at = s.lastActivityAt + IDLE_PROMPT_MS + 5 * MINUTE;
    const kept = snooze(s, at);
    expect(idleStatus(kept, at + MINUTE)).toBe('active');
    expect(idleStatus(kept, at + IDLE_PROMPT_MS)).toBe('prompt');
    expect(idleStatus(kept, s.lastActivityAt + IDLE_AUTO_END_MS)).toBe('autoEnd');
  });
  it('is active when the clock is behind the last activity', () => {
    expect(idleStatus(resting(), NOW - 5 * 60 * MINUTE)).toBe('active');
  });
  it('ends by hand at the end of the last contraction, or now if one is running', () => {
    const s = resting();
    const done = endSession(s, NOW + 3 * 60 * MINUTE);
    expect(done.endedAt).toBe(s.lastActivityAt);
    expect(sessionEnd(done)).toBe(s.lastActivityAt);
    const running = tap(s, NOW, rule, testId).session;
    const ended = endSession(running, NOW + 20 * SECOND);
    expect(ended.endedAt).toBe(NOW + 20 * SECOND);
    expect(openContraction(ended.contractions)).toBeNull();
  });
  it('an automatic end closes a forgotten running contraction at its own start (greyed out, not invented)', () => {
    const running = tap(null, NOW, rule, testId).session;
    const ended = endSession(running, NOW + 7 * 60 * MINUTE, true);
    expect(ended.contractions[0].endedAt).toBe(NOW);
    expect(isIgnored(ended.contractions[0])).toBe(true);
    expect(ended.endedAt).toBe(NOW);
  });
});

describe('guards', () => {
  it('flags a clock set back more than 2 seconds behind the last saved activity', () => {
    const s = sessionOf([made(NOW, MINUTE, 30 * SECOND)]);
    expect(clockSetBack(s, s.lastActivityAt - 3 * SECOND)).toBe(true);
    expect(clockSetBack(s, s.lastActivityAt - SECOND)).toBe(false);
    expect(clockSetBack(null, NOW)).toBe(false);
  });
  it('flags a contraction running longer than 3 minutes', () => {
    const c = { id: 'a', startedAt: NOW, endedAt: null };
    expect(isLongRunning(c, NOW + 3 * MINUTE)).toBe(false);
    expect(isLongRunning(c, NOW + 3 * MINUTE + 1)).toBe(true);
    expect(isLongRunning(null, NOW)).toBe(false);
  });
  it('repairs a session that holds two open contractions: only the newest counts as running', () => {
    const odd = { ...sessionOf([]), contractions: [{ id: 'a', startedAt: NOW - 10 * MINUTE, endedAt: null }, { id: 'b', startedAt: NOW - MINUTE, endedAt: null }] };
    expect(openContraction(odd.contractions)!.id).toBe('b');
    const repaired = repairSession(odd);
    expect(repaired.contractions.find((c) => c.id === 'a')!.endedAt).toBe(NOW - 10 * MINUTE);
    expect(repairSession(repaired)).toBe(repaired);
    const stopped = tap(repaired, NOW, rule, testId).session;
    expect(openContraction(stopped.contractions)).toBeNull();
  });
});
