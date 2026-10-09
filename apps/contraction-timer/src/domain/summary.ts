/**
 * The shareable summary, DEVELOPMENT_PLAN.md §11. Built on the phone from the saved session; nothing is
 * sent anywhere until the person picks an app in the share sheet. All wording comes from en.json through `tr`.
 */
import { t as defaultT } from '@shared/i18n';
import { dateKeyFor } from './dateKey';
import { MINUTE } from './defaults';
import { gestationOn, displayWeeks } from './dueDate';
import { lastActivityTime, sessionEnd, sessionStart } from './session';
import { byStart, countable, dominantIntensity, durationOf, intervalFor, isIgnored, openContraction, STATS_WINDOW_MS, windowStats } from './stats';
import type { Contraction, ContractionSession, DateKey, Intensity, PatternRule } from './types';

export type Translate = (key: string, params?: Record<string, string | number>) => string;

const pad = (n: number) => String(n).padStart(2, '0');

/** `1 min 02 s`, `58 s`: the plan's summary style for averages. */
export function longDuration(ms: number, tr: Translate = defaultT): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? tr('summary.minSec', { m, s: pad(s) }) : tr('summary.sec', { s });
}

/** `1 h 53 min`, `7 min`, `under 1 min`: how long a session lasted (real elapsed time, so a daylight-saving change is counted). */
export function spanText(ms: number, tr: Translate = defaultT): string {
  const minutes = Math.round(ms / MINUTE);
  if (minutes < 1) return tr('summary.underMinute');
  const h = Math.floor(minutes / 60);
  return h > 0 ? tr('summary.hourMin', { h, m: minutes % 60 }) : tr('summary.min', { m: minutes });
}

/** `3:05` or `1:05:00`: a contraction's length in a table. */
export function lengthText(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** `02:58` or `2:58 AM`, local time. */
export function clockText(ts: number, clock24h: boolean, tr: Translate = defaultT): string {
  const d = new Date(ts);
  if (clock24h) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getHours() % 12 || 12}:${pad(d.getMinutes())} ${tr(d.getHours() < 12 ? 'time.am' : 'time.pm')}`;
}

/** `Tue 4 Nov 2026`, local date. */
export function dateText(ts: number, tr: Translate = defaultT): string {
  const d = new Date(ts);
  return `${tr(`date.weekday.${d.getDay()}`)} ${d.getDate()} ${tr(`date.month.${d.getMonth()}`)} ${d.getFullYear()}`;
}

/** `9 Nov` from a `YYYY-MM-DD` key. */
export function shortDay(key: DateKey, tr: Translate = defaultT): string {
  const [, m, d] = key.split('-').map(Number);
  return `${d} ${tr(`date.month.${m - 1}`)}`;
}

export function ruleText(rule: PatternRule, tr: Translate = defaultT): string {
  if (rule.preset === '511') return '5-1-1';
  if (rule.preset === '411') return '4-1-1';
  if (rule.preset === '311') return '3-1-1';
  return tr('summary.ruleCustom', { interval: rule.intervalMaxMin, length: rule.durationMinSec, sustain: rule.sustainMin });
}

export interface SummaryInput {
  session: ContractionSession;
  /** The due date, if one is set (adds the "Pregnancy:" line). */
  edd?: DateKey | null;
  clock24h: boolean;
  /** For an open session: the moment the summary is made, so "last 60 min" means the last hour up to now. */
  now: number;
}

export interface SummaryRow {
  contraction: Contraction;
  start: string;
  length: string;
  /** Start-to-start from the one before, or null. */
  interval: string | null;
  intensity: Intensity | null;
  ignored: boolean;
}

/** One row per contraction, newest first. */
export function summaryRows(session: ContractionSession, clock24h: boolean, tr: Translate = defaultT): SummaryRow[] {
  return [...session.contractions]
    .filter((c) => durationOf(c) !== null)
    .sort((a, b) => byStart(b, a))
    .map((c) => {
      const gap = intervalFor(session.contractions, c.id);
      return {
        contraction: c,
        start: clockText(c.startedAt, clock24h, tr),
        length: lengthText(durationOf(c) as number),
        interval: gap === null ? null : lengthText(gap),
        intensity: c.intensity ?? null,
        ignored: isIgnored(c),
      };
    });
}

/** The reference time for "last 60 min": now for an open session, else the end of its last contraction. */
export const referenceTime = (s: ContractionSession, now: number): number => (s.endedAt === null ? now : lastActivityTime(s) || s.endedAt);

/** The lines shared by the text and the PDF: the facts, in the plan's order. */
export interface SummaryFacts {
  title: string;
  pregnancy: string | null;
  session: string;
  lastHour: string;
  averages: string;
  intensity: string | null;
  rule: string;
  rows: SummaryRow[];
  notes: { time: string; note: string }[];
  footer: string;
}

export function summaryFacts(input: SummaryInput, tr: Translate = defaultT): SummaryFacts {
  const { session, edd, clock24h, now } = input;
  const start = sessionStart(session);
  const end = sessionEnd(session);
  const ref = referenceTime(session, now);
  const hour = windowStats(session.contractions, ref);
  const inHour = countable(session.contractions).filter((c) => c.startedAt >= ref - STATS_WINDOW_MS && c.startedAt <= ref);
  const mostly = dominantIntensity(inHour);
  const total = countable(session.contractions).length;

  let pregnancy: string | null = null;
  if (edd) {
    const g = displayWeeks(gestationOn(edd, dateKeyFor(new Date(start))));
    pregnancy = tr('summary.pregnancy', {
      weeks: tr(g.weeks === 1 ? 'summary.week' : 'summary.weeks', { n: g.weeks }),
      days: tr(g.day === 1 ? 'summary.day' : 'summary.days', { n: g.day }),
      due: shortDay(edd, tr),
    });
  }

  const matched = session.patternMatchedAt;
  return {
    title: tr('summary.title', { date: dateText(start, tr) }),
    pregnancy,
    session: tr('summary.session', { start: clockText(start, clock24h, tr), end: clockText(end, clock24h, tr), span: spanText(end - start, tr), count: total }),
    lastHour: tr('summary.lastHour', { count: hour.count }),
    averages:
      hour.avgDurationMs === null
        ? tr('summary.noAverages')
        : tr('summary.averages', {
            duration: longDuration(hour.avgDurationMs, tr),
            interval: hour.avgIntervalMs === null ? tr('summary.noInterval') : tr('summary.every', { time: longDuration(hour.avgIntervalMs, tr) }),
          }),
    intensity: mostly ? tr('summary.intensity', { level: tr(`summary.level.${mostly}`) }) : null,
    rule:
      matched !== undefined
        ? tr('summary.ruleMatched', { rule: ruleText(session.ruleAtStart, tr), time: clockText(matched, clock24h, tr) })
        : tr('summary.ruleNotMatched', { rule: ruleText(session.ruleAtStart, tr) }),
    rows: summaryRows(session, clock24h, tr),
    notes: session.contractions
      .filter((c) => c.note)
      .sort(byStart)
      .map((c) => ({ time: clockText(c.startedAt, clock24h, tr), note: c.note as string })),
    footer: tr('summary.footer'),
  };
}

/** How many recent contractions the text version lists (the PDF lists them all). */
export const TEXT_ROW_LIMIT = 30;

/** Plan §11: the plain-text summary (`buildTextSummary(session, profile)`). `extra` (the birth plan, plan F14) goes before the footer. */
export function buildTextSummary(input: SummaryInput, tr: Translate = defaultT, extra?: string): string {
  const f = summaryFacts(input, tr);
  const lines: string[] = [f.title];
  if (f.pregnancy) lines.push(f.pregnancy);
  lines.push(f.session, '', f.lastHour, `  ${f.averages}`);
  if (f.intensity) lines.push(`  ${f.intensity}`);
  lines.push(f.rule, '', tr('summary.recentHeader'));
  for (const r of f.rows.slice(0, TEXT_ROW_LIMIT)) {
    const parts = [r.start, r.length, r.interval ?? tr('summary.firstGap'), r.intensity ? tr(`summary.level.${r.intensity}`) : null].filter((x): x is string => x !== null);
    lines.push(`  ${parts.join(' · ')}${r.ignored ? ` ${tr('summary.ignoredMark')}` : ''}`);
  }
  if (f.rows.length > TEXT_ROW_LIMIT) lines.push(`  ${tr('summary.more', { n: f.rows.length - TEXT_ROW_LIMIT })}`);
  if (f.notes.length) {
    lines.push('', tr('summary.notesHeader'));
    for (const n of f.notes) lines.push(`  ${n.time} · ${n.note}`);
  }
  if (extra) lines.push('', extra);
  lines.push('', f.footer);
  return lines.join('\n');
}
