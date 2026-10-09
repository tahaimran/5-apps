/**
 * Time zones, midnight and daylight saving. Run in several zones with `npm run test:tz`
 * (the zone comes from the TZ environment variable); a plain `jest` run covers the local zone.
 * Contractions are epoch milliseconds, so lengths and gaps must not change when the wall clock jumps;
 * only what is printed (clock times, the date) follows the phone's local time.
 */
import '@/testing/mocks';
import '@/bootstrap';
import { MINUTE, HOUR, RULE_PRESETS, SECOND } from '../defaults';
import { gestationOn } from '../dueDate';
import { addDays, dateKeyFor } from '../dateKey';
import { evaluatePattern } from '../pattern';
import { tap, endSession } from '../session';
import { intervalsOf, countable, windowStats } from '../stats';
import { buildTextSummary, clockText, dateText } from '../summary';
import type { ContractionSession } from '../types';
import { resetIds, testId } from '@/testing/fixtures';

beforeEach(resetIds);

/** The first instant in `year` at which this zone's UTC offset changes, or null (UTC, India...). */
function firstOffsetChange(year: number): { at: number; deltaMin: number } | null {
  let prev = new Date(Date.UTC(year, 0, 1)).getTimezoneOffset();
  for (let h = 1; h < 366 * 24; h++) {
    const t = Date.UTC(year, 0, 1) + h * HOUR;
    const off = new Date(t).getTimezoneOffset();
    if (off !== prev) return { at: t, deltaMin: prev - off }; // positive when clocks go forward
    prev = off;
  }
  return null;
}

/** A session of `count` contractions 5 minutes apart and 60 s long, the first `first` ms from `from`. */
function sessionFrom(from: number, count: number): ContractionSession {
  let s: ContractionSession | null = null;
  for (let i = 0; i < count; i++) {
    s = tap(s, from + i * 5 * MINUTE, RULE_PRESETS['511'], testId).session;
    s = tap(s, from + i * 5 * MINUTE + 60 * SECOND, RULE_PRESETS['511'], testId).session;
  }
  return endSession(s!, from + count * 5 * MINUTE);
}

describe(`in ${process.env.TZ ?? 'the local zone'}`, () => {
  it('a session across local midnight keeps one date (its start) and 5-minute gaps', () => {
    const start = new Date(2026, 10, 3, 23, 40).getTime();
    const s = sessionFrom(start, 10); // 23:40 .. 00:25
    const text = buildTextSummary({ session: s, clock24h: true, now: start + 2 * HOUR });
    expect(text.split('\n')[0]).toBe(`Contraction summary — ${dateText(start)}`);
    expect(text).toContain('Tue 3 Nov 2026');
    expect(text).toContain('23:40');
    expect(intervalsOf(countable(s.contractions)).every((g) => g === 5 * MINUTE)).toBe(true);
    expect(dateKeyFor(new Date(s.contractions[9].startedAt))).toBe('2026-11-04');
  });

  it('the last-hour stats do not depend on the zone', () => {
    const start = new Date(2026, 10, 3, 23, 40).getTime();
    const s = sessionFrom(start, 10);
    const w = windowStats(s.contractions, start + 50 * MINUTE);
    expect(w.count).toBe(10);
    expect(w.avgIntervalMs).toBe(5 * MINUTE);
    expect(w.avgDurationMs).toBe(60 * SECOND);
  });

  const change = firstOffsetChange(2026);
  (change ? describe : describe.skip)('across a clock change in this zone', () => {
    it('lengths and gaps stay exact; the printed span is real elapsed time, not the difference of two clock readings', () => {
      const { at, deltaMin } = change!;
      const start = at - 40 * MINUTE;
      const s = sessionFrom(start, 14); // spans the change
      expect(intervalsOf(countable(s.contractions)).every((g) => g === 5 * MINUTE)).toBe(true);
      expect(s.contractions.every((c) => c.endedAt! - c.startedAt === 60 * SECOND)).toBe(true);
      const text = buildTextSummary({ session: s, clock24h: true, now: at + HOUR });
      const first = new Date(start);
      const last = new Date(s.endedAt!);
      const wallMinutes = (last.getHours() * 60 + last.getMinutes()) - (first.getHours() * 60 + first.getMinutes());
      const real = Math.round((s.endedAt! - start) / MINUTE);
      // the printed length is the real one, which differs from the wall-clock difference by the jump
      const printed = /\((?:(\d+) h )?(\d+) min\)/.exec(text)!;
      const printedMin = (printed[1] ? Number(printed[1]) * 60 : 0) + Number(printed[2]);
      expect(printedMin).toBe(real);
      if (Math.abs(deltaMin) >= 30 && Math.abs(wallMinutes) < 12 * 60 && wallMinutes > 0) expect(wallMinutes - real).toBe(deltaMin);
    });

    it('the 5-1-1 check gives the same answer on either side of the change', () => {
      const { at } = change!;
      const start = at - 30 * MINUTE;
      const s = sessionFrom(start, 14);
      const after = start + 13 * 5 * MINUTE + 5 * MINUTE; // 5 min after the 14th began
      expect(evaluatePattern(RULE_PRESETS['511'], s.contractions, after).matches).toBe(true);
    });

    it('gestational age uses calendar dates, so the change never moves a week boundary', () => {
      const { at } = change!;
      const day = dateKeyFor(new Date(at + 3 * HOUR));
      const before = dateKeyFor(new Date(at - 30 * HOUR));
      const edd = addDays(day, 100); // far enough that neither day is before the start of pregnancy
      const g1 = gestationOn(edd, before);
      const g2 = gestationOn(edd, day);
      expect(g2.days - g1.days).toBe(Math.round((Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8)) - Date.UTC(+before.slice(0, 4), +before.slice(5, 7) - 1, +before.slice(8))) / 86_400_000));
    });

    it('clock times near the change print the local wall time', () => {
      const { at } = change!;
      const t = new Date(at + 10 * MINUTE);
      const text = clockText(t.getTime(), true);
      expect(text).toBe(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
    });
  });

  it('gestational age counts whole calendar days from local dates at any hour of the day', () => {
    for (const hour of [0, 1, 12, 23]) {
      const key = dateKeyFor(new Date(2026, 9, 9, hour, 30));
      expect(key).toBe('2026-10-09');
      expect(gestationOn('2026-11-12', key).days).toBe(246);
    }
  });
});
