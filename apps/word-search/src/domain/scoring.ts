import { defaultPackProgress } from './defaults';
import type { Difficulty, LevelTrack, PackProgress, SavedGame, Stars, Stats } from './types';

/** Plan §8.7: 3 stars = no hints, 2 = one or two hints, 1 = three or more. There is no time component. */
export const starsFor = (hintsUsed: number): Stars => (hintsUsed <= 0 ? 3 : hintsUsed <= 2 ? 2 : 1);

/**
 * Records a finished level on its track: keeps the best stars, and moves the current level on when
 * the level finished was the current one (replaying an old level never moves it back).
 */
export function recordLevel(progress: PackProgress | undefined, difficulty: Difficulty, level: number, stars: Stars): PackProgress {
  const base = progress ?? defaultPackProgress();
  const track: LevelTrack = base[difficulty];
  const best = Math.max(track.stars[level] ?? 0, stars) as Stars;
  return {
    ...base,
    [difficulty]: {
      currentLevel: level >= track.currentLevel ? level + 1 : track.currentLevel,
      stars: { ...track.stars, [level]: best },
    },
  };
}

export const totalStars = (progress: Record<string, PackProgress>): number =>
  Object.values(progress).reduce(
    (sum, p) => sum + (['easy', 'medium', 'hard'] as const).reduce((s, d) => s + Object.values(p[d].stars).reduce((a, b) => a + b, 0), 0),
    0,
  );

/** Counts a finished puzzle into the lifetime stats (plan §9 `ws.stats`). */
export function recordStats(stats: Stats, game: SavedGame): Stats {
  const foundWords = { ...stats.foundWords };
  for (const w of game.puzzle.words) foundWords[w.word] = (foundWords[w.word] ?? 0) + 1;
  return {
    ...stats,
    puzzlesCompleted: stats.puzzlesCompleted + 1,
    wordsFound: stats.wordsFound + game.puzzle.words.length,
    foundWords,
  };
}

/** The part of the day for the Home greeting. */
export const partOfDay = (hour: number): 'morning' | 'afternoon' | 'evening' => (hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');
