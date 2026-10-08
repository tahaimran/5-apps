import { FREE_HINTS_PER_DAY } from './defaults';
import { wordCells } from './generator';
import type { Cell } from './selection';
import type { DateKey, HintWallet, SavedGame } from './types';

export const MAX_BONUS_HINTS = 10;
export const REWARD_HINTS = 2;
/** How long the ring stays on the hinted letter (plan §8.5). */
export const HINT_RING_MS = 3000;

/** Free hints come back at local midnight; bonus hints stay. */
export const refreshWallet = (w: HintWallet, today: DateKey): HintWallet =>
  w.resetDateKey === today ? w : { ...w, free: FREE_HINTS_PER_DAY, resetDateKey: today };

export const hintsAvailable = (w: HintWallet): number => w.free + w.bonus;

/** Spends a free hint first, then a bonus one; null if there are none. */
export function spendHint(w: HintWallet): HintWallet | null {
  if (w.free > 0) return { ...w, free: w.free - 1 };
  if (w.bonus > 0) return { ...w, bonus: w.bonus - 1 };
  return null;
}

/** +2 hints for a finished rewarded video, up to 10 bonus hints in the wallet. */
export const grantReward = (w: HintWallet): HintWallet => ({ ...w, bonus: Math.min(MAX_BONUS_HINTS, w.bonus + REWARD_HINTS) });

/** One courtesy hint per day when no video can be shown, so a missing ad never blocks the player. */
export function grantCourtesy(w: HintWallet, today: DateKey): HintWallet | null {
  if (w.courtesyUsedDateKey === today) return null;
  return { ...w, bonus: Math.min(MAX_BONUS_HINTS, w.bonus + 1), courtesyUsedDateKey: today };
}

/** The tutorial puzzle gives one extra hint (plan §8.5). */
export const grantTutorialBonus = (w: HintWallet): HintWallet => ({ ...w, bonus: Math.min(MAX_BONUS_HINTS, w.bonus + 1) });

export interface HintOutcome {
  game: SavedGame;
  word: string;
  /** 1 = first letter, 2 = first and last letter. */
  level: 1 | 2;
  /** Cells to ring for HINT_RING_MS. */
  cells: Cell[];
}

/**
 * Plan §8.5: picks the shortest unfound word, rings its first letter; a second hint on the same
 * word also rings its last letter. Returns null when every word is found.
 */
export function applyHint(game: SavedGame): HintOutcome | null {
  const unfound = game.puzzle.words.filter((w) => !w.found);
  if (unfound.length === 0) return null;
  const target = unfound.reduce((a, b) => (b.word.length < a.word.length ? b : a));
  const span = wordCells(target, game.puzzle.size);
  const toCell = (n: number): Cell => ({ row: Math.floor(n / game.puzzle.size), col: n % game.puzzle.size });
  const earlier = game.hintedWords.find((h) => h.word === target.word);
  const level: 1 | 2 = earlier ? 2 : 1;
  const cells = level === 2 ? [toCell(span[0]), toCell(span[span.length - 1])] : [toCell(span[0])];
  const hintedCells = [...game.hintedCells];
  for (const c of cells) if (!hintedCells.some(([r, col]) => r === c.row && col === c.col)) hintedCells.push([c.row, c.col]);
  return {
    game: {
      ...game,
      hintsUsed: game.hintsUsed + 1,
      hintedCells,
      hintedWords: [...game.hintedWords.filter((h) => h.word !== target.word), { word: target.word, level }],
    },
    word: target.word,
    level,
    cells,
  };
}
