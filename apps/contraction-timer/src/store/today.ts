import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { dateKeyFor, msUntilMidnight } from '@/domain/dateKey';
import type { DateKey } from '@/domain/types';

interface TodayState {
  today: DateKey;
  refresh: () => void;
}

/** The local date, re-read when the day changes. Never trust a `today` captured earlier. */
export const useToday = create<TodayState>((set, get) => ({
  today: dateKeyFor(new Date()),
  refresh: () => {
    const today = dateKeyFor(new Date());
    if (today !== get().today) set({ today });
  },
}));

/** Reads the date right now (for decisions in event handlers). */
export const currentDateKey = (): DateKey => dateKeyFor(new Date());

/**
 * Keeps `today` fresh: a timer at the next local midnight and a refresh whenever the app comes
 * back to the foreground, so the Daily tab and the free hints roll over while the app stays open
 * (plan §17: "date change at midnight while in app handled"). Mount once.
 */
export function useDayRollover() {
  const today = useToday((s) => s.today);
  const refresh = useToday((s) => s.refresh);
  useEffect(() => {
    refresh();
    const timer = setTimeout(refresh, msUntilMidnight(new Date()));
    return () => clearTimeout(timer);
  }, [today, refresh]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);
}
