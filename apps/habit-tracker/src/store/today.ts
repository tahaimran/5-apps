import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { dayKeyFor, parseDayKey } from '@/domain/dayKey';
import type { DayKey } from '@/domain/types';
import { useHabits } from './habits';
import { useSettings } from './settings';

interface TodayState {
  today: DayKey;
  refresh: () => void;
}

/** The current day key, honouring the "day ends at" setting. */
export const useToday = create<TodayState>((set, get) => ({
  today: dayKeyFor(new Date(), useSettings.getState().settings.dayEndsAtHour),
  refresh: () => {
    const today = dayKeyFor(new Date(), useSettings.getState().settings.dayEndsAtHour);
    if (today !== get().today) set({ today });
  },
}));

function msUntilNextBoundary(dayEndsAtHour: number): number {
  const today = dayKeyFor(new Date(), dayEndsAtHour);
  const next = parseDayKey(today);
  next.setDate(next.getDate() + 1);
  next.setHours(dayEndsAtHour, 0, 1, 0);
  return Math.max(1000, next.getTime() - Date.now());
}

/**
 * Keeps `today` fresh: a timer at the next day boundary, a refresh when the app returns to the
 * foreground, and a day-close (freezes) pass whenever the day changes. Mount once in the root.
 */
export function useDayRollover() {
  const today = useToday((s) => s.today);
  const { dayEndsAtHour, weekStartsOn } = useSettings((s) => s.settings);
  const refresh = useToday((s) => s.refresh);
  const closeDays = useHabits((s) => s.closeDays);

  useEffect(() => {
    refresh();
    const timer = setTimeout(refresh, msUntilNextBoundary(dayEndsAtHour));
    return () => clearTimeout(timer);
  }, [today, dayEndsAtHour, refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    closeDays(today, weekStartsOn);
  }, [today, weekStartsOn, closeDays]);
}
