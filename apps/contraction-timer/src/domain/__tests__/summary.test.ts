import '@/testing/mocks';
import '@/bootstrap';
import { RULE_PRESETS } from '../defaults';
import { buildTextSummary, clockText, dateText, lengthText, longDuration, ruleText, spanText, summaryFacts, summaryRows, TEXT_ROW_LIMIT } from '../summary';
import type { Contraction, ContractionSession } from '../types';
import { resetIds } from '@/testing/fixtures';

beforeEach(resetIds);

/** Local time on Wed 4 Nov 2026. */
const at = (h: number, m: number, s = 0) => new Date(2026, 10, 4, h, m, s).getTime();

/** 18 contractions from 01:12 to 03:05; the last 12 are about 5 minutes apart and a minute long. */
function planSession(): ContractionSession {
  const cs: Contraction[] = [];
  let n = 0;
  const add = (start: number, len: number, intensity?: 'mild' | 'moderate' | 'strong', note?: string) => cs.push({ id: `c${++n}`, startedAt: start, endedAt: start + len * 1000, intensity, note });
  // six early ones, 8 minutes apart (all before the last hour)
  for (let i = 0; i < 6; i++) add(at(1, 12 + i * 8), 45, 'mild');
  // twelve in the last hour: 02:05 .. 03:00, a gap of 5 minutes (the first two are 4 and 6 minutes after the early ones; fine)
  for (let i = 0; i < 12; i++) add(at(2, 5 + i * 5), 62, i > 3 ? 'strong' : 'moderate', i === 10 ? 'waters not broken' : undefined);
  return {
    id: 's',
    startedAt: at(1, 12),
    endedAt: at(3, 5),
    contractions: cs,
    ruleAtStart: RULE_PRESETS['511'],
    patternMatchedAt: at(2, 51),
    lastActivityAt: at(3, 1),
  };
}

describe('text summary (plan §11)', () => {
  const text = buildTextSummary({ session: planSession(), edd: '2026-11-09', clock24h: true, now: at(3, 30) });
  const lines = text.split('\n');

  it('starts with the title and the pregnancy line', () => {
    expect(lines[0]).toBe('Contraction summary — Wed 4 Nov 2026');
    expect(lines[1]).toBe('Pregnancy: 39 weeks + 2 days (due 9 Nov)'); // the plan's own example
  });
  it('has the session line with start, end, length and count', () => {
    expect(lines[2]).toBe('Session: 01:12 – 03:05 (1 h 53 min) · 18 contractions'); // the plan's own example
  });
  it('averages the last 60 minutes the way the plan prints them', () => {
    expect(text).toContain('Last 60 min: 12 contractions');
    expect(text).toContain('  Avg duration: 1 min 02 s   Avg interval: every 5 min 00 s');
    expect(text).toContain('  Intensity: mostly strong');
  });
  it('says which rule was set and when it matched', () => {
    expect(text).toContain('Pattern rule set in app: 5-1-1 → matched at 02:51');
  });
  it('lists contractions newest first with start, length, gap and strength', () => {
    const i = lines.indexOf('Recent contractions (start · duration · interval · intensity)');
    expect(i).toBeGreaterThan(0);
    expect(lines[i + 1]).toBe('  03:00 · 1:02 · 5:00 · strong');
  });
  it('keeps a typed note and ends with the disclaimer footer, word for word', () => {
    expect(text).toContain('Notes:');
    expect(text).toContain('  02:55 · waters not broken');
    expect(lines[lines.length - 1]).toBe('Recorded with Contraction Timer. This is a personal log, not a medical assessment. Not medical advice.');
    expect(text).toContain('Recorded with Contraction Timer. This is a personal log, not a medical assessment.');
  });
  it('writes "1 day" and "1 week" in the singular', () => {
    const s = buildTextSummary({ session: planSession(), edd: '2026-11-12', clock24h: true, now: at(3, 30) });
    expect(s).toContain('Pregnancy: 38 weeks + 6 days (due 12 Nov)');
    expect(buildTextSummary({ session: planSession(), edd: '2026-11-10', clock24h: true, now: at(3, 30) })).toContain('Pregnancy: 39 weeks + 1 day (due 10 Nov)');
    expect(buildTextSummary({ session: planSession(), edd: '2027-08-03', clock24h: true, now: at(3, 30) })).toContain('Pregnancy: 1 week + 1 day (due 3 Aug)');
  });
  it('uses the 12-hour clock when chosen', () => {
    expect(buildTextSummary({ session: planSession(), edd: null, clock24h: false, now: at(3, 30) })).toContain('Session: 1:12 AM – 3:05 AM');
  });
  it('leaves out the pregnancy line without a due date', () => {
    expect(buildTextSummary({ session: planSession(), edd: null, clock24h: true, now: at(3, 30) })).not.toContain('Pregnancy:');
  });
  it('says "no match recorded" when the rule never matched, and never claims anything about labor', () => {
    const s = { ...planSession(), patternMatchedAt: undefined };
    const out = buildTextSummary({ session: s, clock24h: true, now: at(3, 30) });
    expect(out).toContain('Pattern rule set in app: 5-1-1 → no match recorded');
    expect(out.toLowerCase()).not.toMatch(/in labou?r|active labou?r|you should|go to the hospital/);
  });
  it('caps the list in the text and points to the PDF', () => {
    const cs: Contraction[] = Array.from({ length: TEXT_ROW_LIMIT + 5 }, (_, i) => ({ id: `x${i}`, startedAt: at(1, 0) + i * 120_000, endedAt: at(1, 0) + i * 120_000 + 50_000 }));
    const out = buildTextSummary({ session: { ...planSession(), contractions: cs }, clock24h: true, now: at(3, 30) });
    expect(out).toContain('(+5 earlier, shown in the PDF)');
  });
  it('flags an ignored short tap instead of hiding it', () => {
    const cs: Contraction[] = [{ id: 'a', startedAt: at(1, 0), endedAt: at(1, 0, 4) }, { id: 'b', startedAt: at(1, 5), endedAt: at(1, 6) }];
    const out = buildTextSummary({ session: { ...planSession(), contractions: cs, patternMatchedAt: undefined }, clock24h: true, now: at(3, 30) });
    expect(out).toContain('01:00 · 0:04 · – (left out of the averages)');
  });
  it('copes with an empty or one-contraction session', () => {
    const one = buildTextSummary({ session: { ...planSession(), contractions: [{ id: 'a', startedAt: at(1, 0), endedAt: at(1, 1) }], patternMatchedAt: undefined }, clock24h: true, now: at(1, 30) });
    expect(one).toContain('Avg interval: not enough yet');
    const none = buildTextSummary({ session: { ...planSession(), contractions: [], patternMatchedAt: undefined }, clock24h: true, now: at(1, 30) });
    expect(none).toContain('Last 60 min: 0 contractions');
    expect(none).toContain('No finished contractions in this hour');
  });
  it('an open session summarises the hour up to now', () => {
    const s = { ...planSession(), endedAt: null };
    const f = summaryFacts({ session: s, clock24h: true, now: at(3, 2) }, undefined);
    expect(f.lastHour).toBe('Last 60 min: 12 contractions');
  });
});

describe('formatting', () => {
  it('writes durations the plan way', () => {
    expect(longDuration(62_000)).toBe('1 min 02 s');
    expect(longDuration(58_000)).toBe('58 s');
    expect(longDuration(288_000)).toBe('4 min 48 s');
    expect(spanText(113 * 60_000)).toBe('1 h 53 min');
    expect(spanText(7 * 60_000)).toBe('7 min');
    expect(spanText(20_000)).toBe('under 1 min');
    expect(lengthText(65_000)).toBe('1:05');
    expect(lengthText(3_665_000)).toBe('1:01:05');
  });
  it('names the rules', () => {
    expect(ruleText(RULE_PRESETS['411'])).toBe('4-1-1');
    expect(ruleText({ preset: 'custom', intervalMaxMin: 8, durationMinSec: 45, sustainMin: 30 })).toBe('custom (every 8 min or less, 45 s or longer, for 30 min)');
  });
  it('formats clock and date in local time', () => {
    expect(clockText(at(0, 7), false)).toBe('12:07 AM');
    expect(clockText(at(13, 5), true)).toBe('13:05');
    expect(dateText(at(12, 0))).toBe('Wed 4 Nov 2026');
  });
  it('builds rows with gaps, skipping greyed ones in the gap maths', () => {
    const s = planSession();
    const rows = summaryRows(s, true);
    expect(rows).toHaveLength(18);
    expect(rows[0].start).toBe('03:00');
    expect(rows[rows.length - 1].interval).toBeNull();
  });
});
