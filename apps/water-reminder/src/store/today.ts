import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { addDays, atMinute, dayKeyFor } from '@/domain/dayKey';
import type { DayKey } from '@/domain/types';
import { useSettings } from './settings';
import { useWater } from './water';

interface TodayState {
  today: DayKey;
  refresh: () => void;
}

const currentDay = () => dayKeyFor(new Date(), useSettings.getState().reminders.wakeMin);

/** The current logical day, which turns over two hours before the wake-up time. */
export const useToday = create<TodayState>((set, get) => ({
  today: currentDay(),
  refresh: () => {
    const today = currentDay();
    if (today !== get().today) set({ today });
  },
}));

/** Milliseconds until the logical day next turns over (at wake - 2 h). */
export function msUntilNextBoundary(now: Date, wakeMin: number): number {
  const today = dayKeyFor(now, wakeMin);
  const next = atMinute(addDays(today, 1), wakeMin - 120);
  return Math.max(1000, next.getTime() - now.getTime() + 1000);
}

/**
 * Keeps `today` fresh (timer at the next boundary, refresh on foreground) and closes finished
 * days into the streak and plant (also whenever the day or the wake time changes). Mount once.
 */
export function useDayRollover() {
  const today = useToday((s) => s.today);
  const wakeMin = useSettings((s) => s.reminders.wakeMin);
  const refresh = useToday((s) => s.refresh);
  const closeDays = useWater((s) => s.closeDays);

  useEffect(() => {
    refresh();
    closeDays(useToday.getState().today);
    const timer = setTimeout(refresh, msUntilNextBoundary(new Date(), wakeMin));
    return () => clearTimeout(timer);
  }, [today, wakeMin, refresh, closeDays]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);
}
