import { create } from 'zustand';
import { applyDraft } from '@/features/habit-editor/drafts';
import { addSeconds, pauseTimer, startTimer } from '@/domain/timer';
import { moveInOrder } from '@/domain/reorder';
import type { HabitDraft } from '@/domain/validate';
import { valueAfterAction, type WidgetAction } from '@/domain/widgetSnapshot';
import { addDays, startOfWeek } from '@/domain/dayKey';
import { canEarnFromAd, earnFromAd, emptyFreezes, earnPerfectWeek, isPerfectWeek, planFreezes } from '@/domain/freezes';
import type { BackupFile } from '@/domain/types';
import type { Entries } from '@/domain/streaks';
import type { DayKey, FreezeState, Habit, HabitId } from '@/domain/types';
import { db } from './storage';

type Entry = Entries[DayKey];

const newId = (): HabitId => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  return id;
};

const readEntries = (id: HabitId): Entries => db.get(`entries:${id}`) ?? {};

interface HabitsState {
  habits: Record<HabitId, Habit>;
  habitOrder: HabitId[];
  entries: Record<HabitId, Entries>;
  freezes: FreezeState;
  addHabit: (draft: HabitDraft) => Habit;
  updateHabit: (id: HabitId, draft: HabitDraft) => void;
  /** Hides the habit from Today but keeps its history. */
  archiveHabit: (id: HabitId, today: DayKey) => void;
  unarchiveHabit: (id: HabitId) => void;
  deleteHabit: (id: HabitId) => void;
  setOrder: (order: HabitId[]) => void;
  move: (id: HabitId, delta: -1 | 1) => void;
  startTimer: (habitId: HabitId, day: DayKey) => void;
  pauseTimer: (habitId: HabitId, day: DayKey) => void;
  /** Adds a streak freeze for a watched rewarded ad (1 a day, max 2). Returns whether it was added. */
  earnFreeze: (today: DayKey) => boolean;
  /** Replaces all habits, entries and freezes (restore from backup). */
  replaceAll: (backup: BackupFile) => void;
  /** A tap on the home-screen widget. Ignored when it does not apply to the habit. */
  applyWidgetAction: (action: WidgetAction, habitId: HabitId, day: DayKey) => void;
  /** Manual minutes for a timer habit (negative to undo). */
  addMinutes: (habitId: HabitId, day: DayKey, minutes: number) => void;
  /** Sets the value for a day. A value of 0 or less removes the entry. */
  setValue: (habitId: HabitId, day: DayKey, value: number) => void;
  /** Lazy day-close: perfect-week freeze bonus, then spend freezes on recently missed days. */
  closeDays: (today: DayKey, weekStartsOn: 0 | 1) => void;
}

function hydrate() {
  const habits = db.get('habits') ?? {};
  const habitOrder = (db.get('habitOrder') ?? []).filter((id) => habits[id]);
  const entries: Record<HabitId, Entries> = {};
  for (const id of Object.keys(habits)) entries[id] = readEntries(id);
  return { habits, habitOrder, entries, freezes: db.get('freezes') ?? emptyFreezes };
}

export const useHabits = create<HabitsState>((set, get) => {
  /** Writes (or, for undefined / an empty stopped entry, removes) one day's entry and persists it. */
  const writeEntry = (habitId: HabitId, day: DayKey, entry: Entry | undefined) => {
    const next: Entries = { ...(get().entries[habitId] ?? {}) };
    if (!entry || (entry.value <= 0 && entry.timerStartedAt === undefined && !entry.frozen)) delete next[day];
    else next[day] = entry;
    db.set(`entries:${habitId}`, next);
    set({ entries: { ...get().entries, [habitId]: next } });
  };

  return {
  ...hydrate(),

  addHabit: (draft) => {
    const habit = applyDraft(undefined, draft, newId());
    const habits = { ...get().habits, [habit.id]: habit };
    const habitOrder = [...get().habitOrder, habit.id];
    db.set('habits', habits);
    db.set('habitOrder', habitOrder);
    set({ habits, habitOrder, entries: { ...get().entries, [habit.id]: {} } });
    return habit;
  },

  updateHabit: (id, draft) => {
    const current = get().habits[id];
    if (!current) return;
    const habits = { ...get().habits, [id]: applyDraft(current, draft, id) };
    db.set('habits', habits);
    set({ habits });
  },

  archiveHabit: (id, today) => {
    const current = get().habits[id];
    if (!current) return;
    const habits = { ...get().habits, [id]: { ...current, archivedAt: today } };
    const habitOrder = get().habitOrder.filter((x) => x !== id);
    db.set('habits', habits);
    db.set('habitOrder', habitOrder);
    set({ habits, habitOrder });
  },

  unarchiveHabit: (id) => {
    const current = get().habits[id];
    if (!current) return;
    const { archivedAt: _archivedAt, ...rest } = current;
    const habits = { ...get().habits, [id]: rest };
    const habitOrder = get().habitOrder.includes(id) ? get().habitOrder : [...get().habitOrder, id];
    db.set('habits', habits);
    db.set('habitOrder', habitOrder);
    set({ habits, habitOrder });
  },

  deleteHabit: (id) => {
    const { [id]: _removed, ...habits } = get().habits;
    const { [id]: _entries, ...entries } = get().entries;
    const habitOrder = get().habitOrder.filter((x) => x !== id);
    db.set('habits', habits);
    db.set('habitOrder', habitOrder);
    db.remove(`entries:${id}`);
    set({ habits, habitOrder, entries });
  },

  setOrder: (order) => {
    db.set('habitOrder', order);
    set({ habitOrder: order });
  },

  move: (id, delta) => get().setOrder(moveInOrder(get().habitOrder, id, delta)),

  startTimer: (habitId, day) =>
    writeEntry(habitId, day, startTimer(get().entries[habitId]?.[day], Date.now())),
  pauseTimer: (habitId, day) =>
    writeEntry(habitId, day, pauseTimer(get().entries[habitId]?.[day], Date.now())),
  earnFreeze: (today) => {
    const current = get().freezes;
    if (!canEarnFromAd(current, today)) return false;
    const freezes = earnFromAd(current, today);
    db.set('freezes', freezes);
    set({ freezes });
    return true;
  },

  replaceAll: (backup) => {
    for (const id of Object.keys(get().habits)) db.remove(`entries:${id}`);
    const habits = Object.fromEntries(backup.habits.map((h) => [h.id, h]));
    const entries: Record<HabitId, Entries> = {};
    for (const id of Object.keys(habits)) {
      entries[id] = backup.entries[id] ?? {};
      db.set(`entries:${id}`, entries[id]);
    }
    db.set('habits', habits);
    db.set('habitOrder', backup.habitOrder);
    db.set('freezes', backup.freezes);
    set({ habits, habitOrder: backup.habitOrder, entries, freezes: backup.freezes });
  },

  applyWidgetAction: (action, habitId, day) => {
    const habit = get().habits[habitId];
    if (!habit || habit.archivedAt) return;
    const value = valueAfterAction(habit, get().entries[habitId]?.[day], action);
    if (value !== null) get().setValue(habitId, day, value);
  },
  addMinutes: (habitId, day, minutes) =>
    writeEntry(habitId, day, addSeconds(get().entries[habitId]?.[day], minutes * 60, Date.now())),

  setValue: (habitId, day, value) =>
    writeEntry(habitId, day, value <= 0 ? undefined : { value, updatedAt: Date.now() }),

  closeDays: (today, weekStartsOn) => {
    const { habits, entries } = get();
    const list = Object.values(habits).filter((h) => !h.archivedAt);
    if (list.length === 0) return;

    let freezes = get().freezes;
    const lastWeek = addDays(startOfWeek(today, weekStartsOn), -7);
    if (isPerfectWeek(list, entries, lastWeek, today, weekStartsOn)) {
      freezes = earnPerfectWeek(freezes, lastWeek);
    }

    const plan = planFreezes({ habits: list, entries, freezes, today, weekStartsOn });
    const nextEntries = { ...entries };
    for (const w of plan.writes) {
      nextEntries[w.habitId] = { ...nextEntries[w.habitId], [w.day]: w.entry };
      db.set(`entries:${w.habitId}`, nextEntries[w.habitId]);
    }
    if (plan.freezes !== get().freezes) db.set('freezes', plan.freezes);
    set({ entries: nextEntries, freezes: plan.freezes });
  },
};
});
