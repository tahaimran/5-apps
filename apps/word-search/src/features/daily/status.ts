import { dailyPuzzleId, type DayStatus } from '@/domain/daily';
import type { DailyState, DateKey, SavedGame } from '@/domain/types';

/** Today's puzzle status for the Home card and the Daily tab. */
export function todayStatus(daily: DailyState, current: SavedGame | null, today: DateKey): DayStatus {
  if (daily.completed[today]) return 'done';
  if (current?.puzzle.id.startsWith(`daily:${today}:`)) return 'inProgress';
  return 'notStarted';
}

/** The id to open for a day: the one in progress if there is one, else a new one at the preferred difficulty. */
export function dailyIdToOpen(current: SavedGame | null, dateKey: DateKey, difficulty: 'easy' | 'medium' | 'hard'): string {
  if (current?.puzzle.id.startsWith(`daily:${dateKey}:`)) return current.puzzle.id;
  return dailyPuzzleId(dateKey, difficulty);
}
