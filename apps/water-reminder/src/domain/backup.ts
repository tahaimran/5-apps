import type { Migration } from '@shared/storage';
import { defaultBeverages } from './hydration';
import { defaultCups, defaultGoal, defaultPrefs, defaultProfile, defaultReminders } from './defaults';
import { monthKeyOf } from './dayKey';
import { summarizeDay } from './summaries';
import type {
  BackupFile,
  BeverageFactor,
  BeverageId,
  Cup,
  DayKey,
  DaySummary,
  GoalSettings,
  LogEntry,
  PlantProgress,
  Prefs,
  Profile,
  ReminderSettings,
} from './types';
import { clamp } from './units';

export type BackupError = 'invalid' | 'notBackup' | 'newer';

export interface BackupSummary {
  drinks: number;
  days: number;
  goalDays: number;
}

export type ParseResult = { ok: true; backup: BackupFile; summary: BackupSummary } | { ok: false; error: BackupError };

export interface BackupSource {
  profile: Profile;
  goal: GoalSettings;
  reminders: ReminderSettings;
  cups: Cup[];
  beverages: BeverageFactor[];
  prefs: Prefs;
  /** Month shards, e.g. '2026-10'. */
  logs: Record<string, LogEntry[]>;
  daySummaries: Record<DayKey, DaySummary>;
  progress: PlantProgress;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const BEVERAGES: BeverageId[] = ['water', 'sparkling', 'tea', 'coffee', 'juice', 'milk', 'soda'];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isDay = (v: unknown): v is DayKey => isStr(v) && DAY.test(v);
const oneOf = <T extends string | number>(v: unknown, options: readonly T[]): T | undefined => options.find((o) => o === v);

export function buildBackup(src: BackupSource, now: Date, schemaVersion: number): BackupFile {
  const logs: Record<string, LogEntry[]> = {};
  for (const [month, list] of Object.entries(src.logs)) if (list.length > 0) logs[month] = list;
  return { app: 'water-reminder', schemaVersion, exportedAt: now.toISOString(), ...src, logs };
}

export const backupFileName = (day: string) => `sipling-backup-${day}.json`;

function cleanProfile(v: unknown): Profile {
  const p: Profile = { ...defaultProfile };
  if (!isObj(v)) return p;
  const sex = oneOf(v.sex, ['female', 'male', 'unspecified'] as const);
  if (sex) p.sex = sex;
  if (isNum(v.weightKg)) p.weightKg = clamp(v.weightKg, 20, 300);
  p.weightUnit = oneOf(v.weightUnit, ['kg', 'lb'] as const) ?? p.weightUnit;
  p.activity = oneOf(v.activity, ['sedentary', 'light', 'active', 'very_active'] as const) ?? p.activity;
  p.climate = oneOf(v.climate, ['cool', 'mild', 'warm', 'hot'] as const) ?? p.climate;
  p.mode = oneOf(v.mode, ['standard', 'pregnancy', 'breastfeeding', 'senior', 'fasting'] as const) ?? p.mode;
  return p;
}

function cleanGoal(v: unknown): GoalSettings {
  const g = defaultGoal(0);
  if (!isObj(v)) return g;
  if (isNum(v.goalMl)) g.goalMl = clamp(Math.round(v.goalMl), 500, 10_000);
  g.source = oneOf(v.source, ['calculated', 'manual'] as const) ?? g.source;
  g.unit = oneOf(v.unit, ['ml', 'floz'] as const) ?? g.unit;
  g.updatedAt = isNum(v.updatedAt) ? v.updatedAt : 0;
  return g;
}

const minute = (v: unknown, fallback: number) => (isNum(v) && v >= 0 && v < 1440 ? Math.round(v) : fallback);

function cleanReminders(v: unknown): ReminderSettings {
  const r: ReminderSettings = { ...defaultReminders, quietBlocks: [], activeWeekdays: [...defaultReminders.activeWeekdays] };
  if (!isObj(v)) return r;
  if (typeof v.enabled === 'boolean') r.enabled = v.enabled;
  r.wakeMin = minute(v.wakeMin, r.wakeMin);
  r.bedMin = minute(v.bedMin, r.bedMin);
  r.frequency = oneOf(v.frequency, ['smart', 'interval'] as const) ?? r.frequency;
  r.intervalMin = oneOf(v.intervalMin, [60, 90, 120, 180] as const) ?? r.intervalMin;
  r.style = oneOf(v.style, ['gentle', 'normal'] as const) ?? r.style;
  r.snoozeMin = oneOf(v.snoozeMin, [10, 15, 30] as const) ?? r.snoozeMin;
  if (isNum(v.skipWindowMin)) r.skipWindowMin = clamp(Math.round(v.skipWindowMin), 0, 120);
  if (Array.isArray(v.quietBlocks)) {
    r.quietBlocks = v.quietBlocks
      .filter((b): b is Record<string, unknown> => isObj(b) && isNum(b.startMin) && isNum(b.endMin))
      .map((b) => ({ startMin: minute(b.startMin, 0), endMin: minute(b.endMin, 0) }))
      .slice(0, 6);
  }
  if (Array.isArray(v.activeWeekdays)) {
    const days = [...new Set(v.activeWeekdays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (days.length > 0) r.activeWeekdays = days;
  }
  return r;
}

function cleanCups(v: unknown): Cup[] {
  if (!Array.isArray(v)) return defaultCups;
  const cups = v
    .filter((c): c is Record<string, unknown> => isObj(c) && isStr(c.id) && isNum(c.ml) && isStr(c.label))
    .map((c) => ({ id: c.id as string, ml: clamp(Math.round(c.ml as number), 50, 1000), label: (c.label as string).slice(0, 30), icon: isStr(c.icon) ? c.icon : 'cup-water' }));
  return cups.length > 0 ? cups.slice(0, 4) : defaultCups;
}

function cleanBeverages(v: unknown): BeverageFactor[] {
  const list = Array.isArray(v) ? v : [];
  return defaultBeverages.map((d) => {
    const found = list.find((b) => isObj(b) && b.id === d.id);
    return found && isObj(found) && isNum(found.factor) ? { id: d.id, factor: clamp(Math.round(found.factor * 20) / 20, 0.5, 1) } : d;
  });
}

function cleanPrefs(v: unknown, cups: Cup[]): Prefs {
  const p: Prefs = { ...defaultPrefs };
  if (!isObj(v)) return p;
  if (isStr(v.preferredCupId) && cups.some((c) => c.id === v.preferredCupId)) p.preferredCupId = v.preferredCupId;
  else p.preferredCupId = (cups.find((c) => c.id === defaultPrefs.preferredCupId) ?? cups[0]).id;
  if (typeof v.largeText === 'boolean') p.largeText = v.largeText;
  if (typeof v.haptics === 'boolean') p.haptics = v.haptics;
  if (isDay(v.freezeEarnedDay)) p.freezeEarnedDay = v.freezeEarnedDay;
  return p;
}

function cleanLog(v: unknown, counter: { n: number }): LogEntry | null {
  if (!isObj(v) || !isNum(v.ts) || !isDay(v.dayKey) || !isNum(v.volumeMl) || !isNum(v.effectiveMl)) return null;
  const beverage = oneOf(v.beverage, BEVERAGES);
  if (!beverage || v.volumeMl <= 0 || v.volumeMl > 5000 || v.effectiveMl < 0 || v.effectiveMl > 5000) return null;
  const dayKey = v.dayKey;
  // The id carries the day (and so the month shard); rebuild it if a file has something else.
  const id = isStr(v.id) && v.id.startsWith(`${dayKey}_`) ? v.id : `${dayKey}_r${(counter.n++).toString(36)}`;
  return {
    id,
    ts: v.ts,
    dayKey,
    beverage,
    volumeMl: Math.round(v.volumeMl),
    effectiveMl: Math.round(v.effectiveMl),
    source: oneOf(v.source, ['app', 'notification', 'widget'] as const) ?? 'app',
  };
}

function cleanProgress(v: unknown, fallbackDay: DayKey, unlockedFallback: string[]): PlantProgress {
  const base: PlantProgress = {
    goalDays: 0,
    stage: 0,
    streak: 0,
    bestStreak: 0,
    streakFreezes: 0,
    lastEvaluatedDay: fallbackDay,
    activeSkin: 'classic',
    activeCupTheme: 'classic',
    unlocked: unlockedFallback,
  };
  if (!isObj(v)) return base;
  const int = (x: unknown, max: number) => (isNum(x) ? clamp(Math.round(x), 0, max) : 0);
  const stage = int(v.stage, 4);
  return {
    goalDays: int(v.goalDays, 100_000),
    stage: stage as PlantProgress['stage'],
    streak: int(v.streak, 100_000),
    bestStreak: int(v.bestStreak, 100_000),
    streakFreezes: int(v.streakFreezes, 2),
    lastEvaluatedDay: isDay(v.lastEvaluatedDay) ? v.lastEvaluatedDay : fallbackDay,
    activeSkin: isStr(v.activeSkin) ? v.activeSkin.slice(0, 30) : 'classic',
    activeCupTheme: isStr(v.activeCupTheme) ? v.activeCupTheme.slice(0, 30) : 'classic',
    unlocked: Array.isArray(v.unlocked) ? v.unlocked.filter(isStr).slice(0, 50) : unlockedFallback,
  };
}

/**
 * Checks and cleans a backup file's text. Rejects other apps' files, files from a newer schema
 * ("Update the app to import this backup") and anything malformed; migrates older schemas; drops
 * unusable entries rather than failing the whole import; rebuilds the per-day summaries so the
 * numbers always match the drinks.
 */
export function parseBackup(text: string, currentVersion: number, migrations: Record<number, Migration> = {}): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (!isObj(raw) || raw.app !== 'water-reminder') return { ok: false, error: 'notBackup' };
  const version = raw.schemaVersion;
  if (!Number.isInteger(version) || (version as number) < 1) return { ok: false, error: 'invalid' };
  if ((version as number) > currentVersion) return { ok: false, error: 'newer' };

  let data: Record<string, unknown> = raw;
  if ((version as number) < currentVersion) {
    let snap: Record<string, unknown> = { ...raw };
    for (let v = (version as number) + 1; v <= currentVersion; v++) {
      const migrate = migrations[v];
      if (migrate) snap = migrate(snap);
    }
    data = snap;
  }
  if (!isObj(data.logs) || !isObj(data.daySummaries) || !isObj(data.progress)) return { ok: false, error: 'invalid' };

  const profile = cleanProfile(data.profile);
  const goal = cleanGoal(data.goal);
  const reminders = cleanReminders(data.reminders);
  const cups = cleanCups(data.cups);
  const beverages = cleanBeverages(data.beverages);
  const prefs = cleanPrefs(data.prefs, cups);

  // Entries are re-sharded by their own day, so a hand-edited file cannot put a drink in the wrong month.
  const counter = { n: 0 };
  const logs: Record<string, LogEntry[]> = {};
  const seen = new Set<string>();
  for (const list of Object.values(data.logs)) {
    if (!Array.isArray(list)) return { ok: false, error: 'invalid' };
    for (const item of list) {
      const entry = cleanLog(item, counter);
      if (!entry || seen.has(entry.id)) continue;
      seen.add(entry.id);
      (logs[monthKeyOf(entry.dayKey)] ??= []).push(entry);
    }
  }
  for (const list of Object.values(logs)) list.sort((a, b) => a.ts - b.ts);

  const goalOf = (day: DayKey): number => {
    const s = data.daySummaries as Record<string, unknown>;
    const stored = isObj(s[day]) ? (s[day] as Record<string, unknown>).goalMl : undefined;
    return isNum(stored) ? clamp(Math.round(stored), 500, 10_000) : goal.goalMl;
  };
  const days = new Set(Object.values(logs).flatMap((l) => l.map((e) => e.dayKey)));
  const daySummaries: Record<DayKey, DaySummary> = {};
  for (const day of days) daySummaries[day] = summarizeDay(day, logs[monthKeyOf(day)], goalOf(day));

  const lastDay = [...days].sort().at(-1) ?? '1970-01-01';
  const progress = cleanProgress(data.progress, lastDay, ['classic']);

  const backup: BackupFile = {
    app: 'water-reminder',
    schemaVersion: currentVersion,
    exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : '',
    profile,
    goal,
    reminders,
    cups,
    beverages,
    prefs,
    logs,
    daySummaries,
    progress,
  };
  return { ok: true, backup, summary: summarizeBackup(backup) };
}

export function summarizeBackup(b: BackupFile): BackupSummary {
  return {
    drinks: Object.values(b.logs).reduce((n, l) => n + l.length, 0),
    days: Object.keys(b.daySummaries).length,
    goalDays: b.progress.goalDays,
  };
}
