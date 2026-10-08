import type { Migration } from '@shared/storage';
import { defaultSettings } from './defaults';
import type { Entries } from './streaks';
import type { BackupFile, DayKey, DayNote, Entry, FreezeState, Habit, HabitId, Settings } from './types';

export type BackupError = 'invalid' | 'notBackup' | 'newer';

export interface BackupSummary {
  habits: number;
  checkIns: number;
  notes: number;
}

export type ParseResult = { ok: true; backup: BackupFile; summary: BackupSummary } | { ok: false; error: BackupError };

export interface BackupSource {
  habits: Record<HabitId, Habit>;
  habitOrder: HabitId[];
  entries: Record<HabitId, Entries>;
  notes: Record<DayKey, DayNote>;
  freezes: FreezeState;
  settings: Settings;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

export function buildBackup(src: BackupSource, now: Date, schemaVersion: number): BackupFile {
  const entries: Record<HabitId, Entries> = {};
  for (const [id, e] of Object.entries(src.entries)) if (src.habits[id] && Object.keys(e).length > 0) entries[id] = e;
  return {
    app: 'habit-tracker',
    schemaVersion,
    exportedAt: now.toISOString(),
    habits: Object.values(src.habits),
    habitOrder: src.habitOrder,
    entries,
    notes: src.notes,
    freezes: src.freezes,
    settings: src.settings,
  };
}

export const backupFileName = (day: string) => `habits-backup-${day}.json`;

function cleanHabit(v: unknown): Habit | null {
  if (!isObj(v)) return null;
  const { id, name, icon, color, type, target, schedule, category, createdAt } = v;
  if (!isStr(id) || id === '' || !isStr(name) || !isStr(icon) || !isStr(color) || !isStr(category)) return null;
  if (type !== 'boolean' && type !== 'count' && type !== 'timer') return null;
  if (!isNum(target) || target < 1) return null;
  if (!isStr(createdAt) || !DAY.test(createdAt)) return null;
  if (!isObj(schedule)) return null;
  let sched: Habit['schedule'];
  if (schedule.kind === 'daily') sched = { kind: 'daily' };
  else if (schedule.kind === 'weekdays' && Array.isArray(schedule.days) && schedule.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
    sched = { kind: 'weekdays', days: schedule.days as never };
  } else if (schedule.kind === 'perWeek' && Number.isInteger(schedule.times) && (schedule.times as number) >= 1 && (schedule.times as number) <= 6) {
    sched = { kind: 'perWeek', times: schedule.times as never };
  } else return null;

  const reminders = Array.isArray(v.reminders)
    ? v.reminders.filter((r): r is { time: string } => isObj(r) && isStr(r.time) && HHMM.test(r.time)).map((r) => ({ time: r.time, notifIds: [] }))
    : [];
  return {
    id,
    name: name.slice(0, 80),
    icon,
    color,
    type,
    target,
    unit: isStr(v.unit) ? v.unit : undefined,
    schedule: sched,
    category,
    reminders,
    templateId: isStr(v.templateId) ? v.templateId : undefined,
    createdAt: createdAt as DayKey,
    archivedAt: isStr(v.archivedAt) ? v.archivedAt : undefined,
  };
}

function cleanEntries(v: unknown): Entries | null {
  if (!isObj(v)) return null;
  const out: Entries = {};
  for (const [day, e] of Object.entries(v)) {
    if (!DAY.test(day) || !isObj(e) || !isNum(e.value) || e.value < 0) continue;
    const entry: Entry = { value: e.value, updatedAt: isNum(e.updatedAt) ? e.updatedAt : 0 };
    if (e.frozen === true) entry.frozen = true;
    out[day as DayKey] = entry;
  }
  return out;
}

function cleanNotes(v: unknown): Record<DayKey, DayNote> {
  const out: Record<DayKey, DayNote> = {};
  if (!isObj(v)) return out;
  for (const [day, n] of Object.entries(v)) {
    if (!DAY.test(day) || !isObj(n) || !isStr(n.text)) continue;
    const mood = n.mood;
    out[day as DayKey] = {
      text: n.text.slice(0, 1000),
      mood: mood === 1 || mood === 2 || mood === 3 || mood === 4 || mood === 5 ? mood : undefined,
      updatedAt: isNum(n.updatedAt) ? n.updatedAt : 0,
    };
  }
  return out;
}

function cleanFreezes(v: unknown): FreezeState {
  if (!isObj(v) || !Number.isInteger(v.count)) return { count: 0, log: [] };
  const log = Array.isArray(v.log)
    ? v.log.filter(
        (l): l is FreezeState['log'][number] =>
          isObj(l) && isStr(l.day) && DAY.test(l.day) && (l.source === 'ad' || l.source === 'perfectWeek' || l.source === 'used'),
      )
    : [];
  return {
    count: Math.min(2, Math.max(0, v.count as number)),
    lastAdEarnDay: isStr(v.lastAdEarnDay) && DAY.test(v.lastAdEarnDay) ? (v.lastAdEarnDay as DayKey) : undefined,
    lastPerfectWeek: isStr(v.lastPerfectWeek) && DAY.test(v.lastPerfectWeek) ? (v.lastPerfectWeek as DayKey) : undefined,
    log: log.slice(-100),
  };
}

function cleanSettings(v: unknown): Settings {
  const s: Settings = { ...defaultSettings };
  if (!isObj(v)) return s;
  if (v.theme === 'system' || v.theme === 'light' || v.theme === 'dark') s.theme = v.theme;
  if (v.weekStartsOn === 0 || v.weekStartsOn === 1) s.weekStartsOn = v.weekStartsOn;
  if (v.dayEndsAtHour === 0 || v.dayEndsAtHour === 1 || v.dayEndsAtHour === 2 || v.dayEndsAtHour === 3 || v.dayEndsAtHour === 4) s.dayEndsAtHour = v.dayEndsAtHour;
  if (typeof v.haptics === 'boolean') s.haptics = v.haptics;
  for (const key of ['dailySummary', 'eveningNudge'] as const) {
    const x = v[key];
    if (isObj(x) && typeof x.enabled === 'boolean' && isStr(x.time) && HHMM.test(x.time)) s[key] = { enabled: x.enabled, time: x.time };
  }
  return s;
}

/** Backups are flat key snapshots to the migrations, the same shape the MMKV store uses. */
function toSnapshot(raw: Record<string, unknown>): Record<string, unknown> {
  const snap: Record<string, unknown> = {
    habits: raw.habits,
    habitOrder: raw.habitOrder,
    notes: raw.notes,
    freezes: raw.freezes,
    settings: raw.settings,
  };
  if (isObj(raw.entries)) for (const [id, e] of Object.entries(raw.entries)) snap[`entries:${id}`] = e;
  return snap;
}

function fromSnapshot(raw: Record<string, unknown>, snap: Record<string, unknown>): Record<string, unknown> {
  const entries: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(snap)) if (k.startsWith('entries:')) entries[k.slice('entries:'.length)] = v;
  return { ...raw, habits: snap.habits, habitOrder: snap.habitOrder, notes: snap.notes, freezes: snap.freezes, settings: snap.settings, entries };
}

/**
 * Checks and cleans a backup file's text. Rejects other apps' files, files from a newer schema
 * ("Update the app to import this backup") and anything malformed; migrates older schemas; drops
 * unusable entries rather than failing the whole import.
 */
export function parseBackup(text: string, currentVersion: number, migrations: Record<number, Migration> = {}): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (!isObj(raw) || raw.app !== 'habit-tracker') return { ok: false, error: 'notBackup' };
  const version = raw.schemaVersion;
  if (!Number.isInteger(version) || (version as number) < 1) return { ok: false, error: 'invalid' };
  if ((version as number) > currentVersion) return { ok: false, error: 'newer' };

  let data: Record<string, unknown> = raw;
  if ((version as number) < currentVersion) {
    let snap = toSnapshot(raw);
    for (let v = (version as number) + 1; v <= currentVersion; v++) {
      const migrate = migrations[v];
      if (migrate) snap = migrate(snap);
    }
    data = fromSnapshot(raw, snap);
  }

  if (!Array.isArray(data.habits) && !isObj(data.habits)) return { ok: false, error: 'invalid' };
  const habitList = Array.isArray(data.habits) ? data.habits : Object.values(data.habits as Record<string, unknown>);
  const habits: Habit[] = [];
  for (const h of habitList) {
    const clean = cleanHabit(h);
    if (!clean) return { ok: false, error: 'invalid' };
    habits.push(clean);
  }
  if (new Set(habits.map((h) => h.id)).size !== habits.length) return { ok: false, error: 'invalid' };
  const ids = new Set(habits.map((h) => h.id));

  const entries: Record<HabitId, Entries> = {};
  if (data.entries !== undefined) {
    if (!isObj(data.entries)) return { ok: false, error: 'invalid' };
    for (const [id, e] of Object.entries(data.entries)) {
      if (!ids.has(id)) continue;
      const clean = cleanEntries(e);
      if (!clean) return { ok: false, error: 'invalid' };
      entries[id] = clean;
    }
  }
  const order = Array.isArray(data.habitOrder) ? data.habitOrder.filter((id): id is string => isStr(id) && ids.has(id)) : [];
  const active = habits.filter((h) => !h.archivedAt).map((h) => h.id);
  const habitOrder = [...new Set([...order.filter((id) => active.includes(id)), ...active])];

  const backup: BackupFile = {
    app: 'habit-tracker',
    schemaVersion: currentVersion,
    exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : '',
    habits,
    habitOrder,
    entries,
    notes: cleanNotes(data.notes),
    freezes: cleanFreezes(data.freezes),
    settings: cleanSettings(data.settings),
  };
  return { ok: true, backup, summary: summarizeBackup(backup) };
}

export function summarizeBackup(b: BackupFile): BackupSummary {
  let checkIns = 0;
  for (const e of Object.values(b.entries)) for (const entry of Object.values(e)) if (entry.value > 0) checkIns++;
  return { habits: b.habits.length, checkIns, notes: Object.keys(b.notes).length };
}
