import { create } from 'zustand';
import type { NewHabit } from '@/data/quickAdds';
import { addDays, startOfWeek } from '@/domain/dayKey';
import { emptyFreezes, earnPerfectWeek, isPerfectWeek, planFreezes } from '@/domain/freezes';
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
  addHabit: (input: NewHabit, today: DayKey) => Habit;
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

export const useHabits = create<HabitsState>((set, get) => ({
  ...hydrate(),

  addHabit: (input, today) => {
    const habit: Habit = { ...input, id: newId(), reminders: [], createdAt: today };
    const habits = { ...get().habits, [habit.id]: habit };
    const habitOrder = [...get().habitOrder, habit.id];
    db.set('habits', habits);
    db.set('habitOrder', habitOrder);
    set({ habits, habitOrder, entries: { ...get().entries, [habit.id]: {} } });
    return habit;
  },

  setValue: (habitId, day, value) => {
    const current = get().entries[habitId] ?? {};
    const next: Entries = { ...current };
    if (value <= 0) delete next[day];
    else next[day] = { value, updatedAt: Date.now() } satisfies Entry;
    db.set(`entries:${habitId}`, next);
    set({ entries: { ...get().entries, [habitId]: next } });
  },

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
}));
