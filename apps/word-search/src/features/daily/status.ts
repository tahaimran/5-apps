import { dailyPuzzleId, type DayStatus } from '@/domain/daily';
import type { DailyState, DateKey, SavedGame } from '@/domain/types';

/** Today's puzzle status for the Home card and the Daily tab. */
export function todayStatus(daily: DailyState, current: SavedGame | null, today: DateKey): DayStatus {
  if (daily.completed[today]) return 'done';
  if (current?.puzzle.id.startsWith(`daily:${today}:`)) return 'inProgress';
  return 'notStarted';
}

export { dailyIdToOpen } from '@/features/play/dailyOpen';
