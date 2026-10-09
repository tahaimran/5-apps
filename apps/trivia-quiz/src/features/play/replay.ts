import type { RoundResult } from './commit';
import { startBlitz, startCategory, startClassic } from './start';

/** Starts the same round again (Replay) or, for a Classic result, the next level. Returns the session id or null. */
export function startAgain(r: RoundResult, nextLevel = false): string | null {
  if (r.mode === 'classic' && r.category && r.level) return startClassic(r.category, nextLevel && r.nextLevel ? r.nextLevel : r.level);
  if (r.mode === 'category' && r.category && r.difficulty) return startCategory(r.category, r.difficulty);
  if (r.mode === 'blitz') return startBlitz();
  return null;
}
