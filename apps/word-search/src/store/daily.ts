import { create } from 'zustand';
import { completeDaily, effectiveStreak, type DailyCompletion } from '@/domain/daily';
import { defaultDaily } from '@/domain/defaults';
import type { DailyState, DateKey, Stars } from '@/domain/types';
import { db } from './storage';

interface DailyStore {
  daily: DailyState;
  /** Records a finished daily; `today` is read by the caller at that moment. */
  complete: (dateKey: DateKey, today: DateKey, stars: Stars) => DailyCompletion;
  streakOn: (today: DateKey) => number;
  reset: () => void;
}

/** Daily puzzle results, streak and freezes (`ws.daily`). */
export const useDaily = create<DailyStore>((set, get) => ({
  daily: { ...defaultDaily(), ...db.get('daily') },
  complete: (dateKey, today, stars) => {
    const out = completeDaily(get().daily, dateKey, today, stars, Date.now());
    db.set('daily', out.state);
    set({ daily: out.state });
    return out;
  },
  streakOn: (today) => effectiveStreak(get().daily, today),
  reset: () => {
    db.remove('daily');
    set({ daily: defaultDaily() });
  },
}));
