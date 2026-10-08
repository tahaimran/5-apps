import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { dayKeyFor, monthKeyOf } from '@/domain/dayKey';
import { defaultProgress } from '@/domain/defaults';
import { addDays } from '@/domain/dayKey';
import { effectiveMl, factorOf } from '@/domain/hydration';
import { evaluateDays } from '@/domain/streak';
import { summarizeDay } from '@/domain/summaries';
import type { BeverageId, DayKey, DaySummary, LogEntry, LogSource, PlantProgress } from '@/domain/types';
import { useSettings } from './settings';
import { db } from './storage';

export interface LogInput {
  volumeMl: number;
  beverage?: BeverageId;
  source?: LogSource;
  /** Defaults to now. */
  ts?: number;
}

export interface LogResult {
  entry: LogEntry;
  summary: DaySummary;
  /** This drink is the one that reached the day's goal. */
  reachedNow: boolean;
}

interface WaterState {
  summaries: Record<DayKey, DaySummary>;
  progress: PlantProgress;
  /** Month shards read so far (`logs:YYYY-MM`). */
  months: Record<string, LogEntry[]>;
  /** Streak freezes spent while closing days, shown once as a notice. */
  freezeNotice: number;
  loadMonth: (month: string) => LogEntry[];
  logsForDay: (day: DayKey) => LogEntry[];
  logDrink: (input: LogInput) => LogResult;
  updateEntry: (id: string, patch: Partial<Pick<LogEntry, 'volumeMl' | 'beverage' | 'ts'>>) => LogEntry | null;
  deleteEntry: (id: string) => LogEntry | null;
  /** Re-sums today (after a goal change) with the current goal. */
  recomputeToday: () => void;
  /** Closes finished days into streak, goal days and plant stage. Returns the days a freeze was spent on. */
  closeDays: (today: DayKey) => DayKey[];
  setProgress: (patch: Partial<PlantProgress>) => void;
  dismissFreezeNotice: () => void;
  replaceAll: (data: { logs: Record<string, LogEntry[]>; daySummaries: Record<DayKey, DaySummary>; progress: PlantProgress }) => void;
}

const newId = (dayKey: DayKey) => `${dayKey}_${Math.random().toString(36).slice(2, 8)}`;
/** The month shard an entry lives in is encoded in its id. */
const monthOfId = (id: string) => id.slice(0, 7);
const byTime = (a: LogEntry, b: LogEntry) => a.ts - b.ts;

/** A new install starts the plant the day before today, and saves that so today still gets evaluated tomorrow. */
function initialProgress(): PlantProgress {
  const saved = db.get('progress');
  if (saved) return saved;
  const fresh = defaultProgress(addDays(dayKeyFor(new Date(), useSettings.getState().reminders.wakeMin), -1));
  db.set('progress', fresh);
  return fresh;
}

/** Drink logs (month-sharded), per-day summaries and the plant's progress. */
export const useWater = create<WaterState>((set, get) => {
  const saveMonth = (month: string, list: LogEntry[]) => {
    const sorted = [...list].sort(byTime);
    db.set(`logs:${month}`, sorted);
    set((s) => ({ months: { ...s.months, [month]: sorted } }));
  };

  /** The goal a day is measured against: today follows the current goal, past days keep theirs. */
  const goalFor = (day: DayKey): number => {
    const { goal, reminders } = useSettings.getState();
    if (day === dayKeyFor(new Date(), reminders.wakeMin)) return goal.goalMl;
    return get().summaries[day]?.goalMl ?? goal.goalMl;
  };

  const resum = (day: DayKey): DaySummary => {
    const summary = summarizeDay(day, get().loadMonth(monthKeyOf(day)), goalFor(day));
    const summaries = { ...get().summaries };
    if (summary.count === 0) delete summaries[day];
    else summaries[day] = summary;
    db.set('daySummaries', summaries);
    set({ summaries });
    return summary;
  };

  return {
    summaries: db.get('daySummaries') ?? {},
    progress: initialProgress(),
    months: {},
    freezeNotice: 0,

    loadMonth: (month) => {
      const cached = get().months[month];
      if (cached) return cached;
      const list = db.get(`logs:${month}`) ?? [];
      set((s) => ({ months: { ...s.months, [month]: list } }));
      return list;
    },
    logsForDay: (day) => get().loadMonth(monthKeyOf(day)).filter((l) => l.dayKey === day),

    logDrink: ({ volumeMl, beverage = 'water', source = 'app', ts = Date.now() }) => {
      const { reminders, beverages } = useSettings.getState();
      const dayKey = dayKeyFor(ts, reminders.wakeMin);
      const before = get().summaries[dayKey];
      const entry: LogEntry = {
        id: newId(dayKey),
        ts,
        dayKey,
        beverage,
        volumeMl,
        effectiveMl: effectiveMl(volumeMl, factorOf(beverages, beverage)),
        source,
      };
      const month = monthKeyOf(dayKey);
      saveMonth(month, [...get().loadMonth(month), entry]);
      const summary = resum(dayKey);
      return { entry, summary, reachedNow: summary.reached && !before?.reached };
    },

    updateEntry: (id, patch) => {
      const month = monthOfId(id);
      const old = get().loadMonth(month).find((l) => l.id === id);
      if (!old) return null;
      const { reminders, beverages } = useSettings.getState();
      const volumeMl = patch.volumeMl ?? old.volumeMl;
      const beverage = patch.beverage ?? old.beverage;
      const ts = patch.ts ?? old.ts;
      const dayKey = patch.ts === undefined ? old.dayKey : dayKeyFor(ts, reminders.wakeMin);
      const recount = patch.volumeMl !== undefined || patch.beverage !== undefined;
      const next: LogEntry = {
        ...old,
        id: dayKey === old.dayKey ? old.id : newId(dayKey),
        ts,
        dayKey,
        beverage,
        volumeMl,
        effectiveMl: recount ? effectiveMl(volumeMl, factorOf(beverages, beverage)) : old.effectiveMl,
      };
      saveMonth(month, get().loadMonth(month).filter((l) => l.id !== id));
      const nextMonth = monthKeyOf(dayKey);
      saveMonth(nextMonth, [...get().loadMonth(nextMonth), next]);
      resum(old.dayKey);
      if (dayKey !== old.dayKey) resum(dayKey);
      return next;
    },

    deleteEntry: (id) => {
      const month = monthOfId(id);
      const old = get().loadMonth(month).find((l) => l.id === id);
      if (!old) return null;
      saveMonth(month, get().loadMonth(month).filter((l) => l.id !== id));
      resum(old.dayKey);
      return old;
    },

    recomputeToday: () => {
      const today = dayKeyFor(new Date(), useSettings.getState().reminders.wakeMin);
      if (get().summaries[today]) resum(today);
    },

    closeDays: (today) => {
      const { progress, freezeDays } = evaluateDays(get().progress, get().summaries, today);
      if (progress !== get().progress) {
        db.set('progress', progress);
        set({ progress });
      }
      if (freezeDays.length > 0) set((s) => ({ freezeNotice: s.freezeNotice + freezeDays.length }));
      return freezeDays;
    },

    setProgress: (patch) => {
      const progress = { ...get().progress, ...patch };
      db.set('progress', progress);
      set({ progress });
    },

    dismissFreezeNotice: () => set({ freezeNotice: 0 }),

    replaceAll: ({ logs, daySummaries, progress }) => {
      for (const key of db.keys()) if (key.startsWith('logs:')) db.remove(key as `logs:${string}`);
      const months: Record<string, LogEntry[]> = {};
      for (const [month, list] of Object.entries(logs)) {
        months[month] = [...list].sort(byTime);
        db.set(`logs:${month}`, months[month]);
      }
      db.set('daySummaries', daySummaries);
      db.set('progress', progress);
      set({ months, summaries: daySummaries, progress });
    },
  };
});

// A new goal re-measures today (past days keep the goal they had).
let lastGoal = useSettings.getState().goal.goalMl;
useSettings.subscribe((s) => {
  if (s.goal.goalMl !== lastGoal) {
    lastGoal = s.goal.goalMl;
    useWater.getState().recomputeToday();
  }
});

/** The logs of one day, kept in sync with the store (loads the month on first use). */
export function useDayLogs(day: DayKey): LogEntry[] {
  const month = monthKeyOf(day);
  const list = useWater((s) => s.months[month]);
  useEffect(() => {
    if (!list) useWater.getState().loadMonth(month);
  }, [list, month]);
  return useMemo(() => (list ?? []).filter((l) => l.dayKey === day), [list, day]);
}
