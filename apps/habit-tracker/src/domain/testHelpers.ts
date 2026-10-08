import type { DayKey, Entry, Habit, Schedule } from './types';

export const d = (s: string) => s as DayKey;

export function habit(over: Partial<Habit> & { schedule?: Schedule } = {}): Habit {
  return {
    id: 'h1',
    name: 'Test',
    icon: 'check',
    color: '#7C5CFF',
    type: 'boolean',
    target: 1,
    schedule: { kind: 'daily' },
    category: 'general',
    reminders: [],
    createdAt: d('2026-10-01'),
    ...over,
  };
}

export const entry = (value = 1, extra: Partial<Entry> = {}): Entry => ({ value, updatedAt: 0, ...extra });
export const frozen = (): Entry => ({ value: 0, frozen: true, updatedAt: 0 });

/** Entries with value 1 on each given day. */
export function done(...days: string[]): Record<DayKey, Entry> {
  return Object.fromEntries(days.map((day) => [day, entry()])) as Record<DayKey, Entry>;
}
