import { msUntilMidnight } from '@/domain/dateKey';
import { effectiveStreak, streakAtRisk } from '@/domain/streak';
import type { DailyState, DateKey, StreakState } from '@/domain/types';

export type DailyCardState = 'notPlayed' | 'played';

export interface DailyCard {
  state: DailyCardState;
  /** First day: no streak yet and nothing played. */
  firstDay: boolean;
  streak: number;
  /** Amber "streak at risk" card (after 18:00, not played, streak to lose). */
  atRisk: boolean;
  score: number;
  /** Milliseconds until the next local midnight. */
  msToReset: number;
}

/** The Daily card of plan §5, from the stores and the current time (read at render, never captured earlier). */
export function dailyCard(daily: DailyState, streak: StreakState, today: DateKey, now: Date): DailyCard {
  const played = daily.lastPlayedDate === today;
  return {
    state: played ? 'played' : 'notPlayed',
    firstDay: daily.history.length === 0 && streak.current === 0,
    streak: effectiveStreak(streak, today),
    atRisk: streakAtRisk(streak, today, now.getHours(), played),
    score: played ? daily.lastScore : 0,
    msToReset: msUntilMidnight(now),
  };
}

/** "7h 12m" or "42m" until the Daily resets. */
export function formatCountdown(ms: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.floor(ms / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}
