import { dailyPuzzleId } from '@/domain/daily';
import type { DateKey, Difficulty, SavedGame } from '@/domain/types';

/** The id to open for a day: the one in progress if there is one, else a new one at the preferred difficulty. */
export function dailyIdToOpen(current: SavedGame | null, dateKey: DateKey, difficulty: Difficulty): string {
  if (current?.puzzle.id.startsWith(`daily:${dateKey}:`)) return current.puzzle.id;
  return dailyPuzzleId(dateKey, difficulty);
}
