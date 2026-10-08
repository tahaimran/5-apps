import { evaluateSelection, type Cell, type SelectionResult } from './selection';
import type { PlacedWord, Puzzle, SavedGame } from './types';

export const startGame = (puzzle: Puzzle, now: number): SavedGame => ({
  puzzle,
  hintsUsed: 0,
  startedAt: now,
  elapsedMs: 0,
  hintedCells: [],
  hintedWords: [],
});

export const unfoundWords = (game: SavedGame): PlacedWord[] => game.puzzle.words.filter((w) => !w.found);
export const foundCount = (game: SavedGame): number => game.puzzle.words.filter((w) => w.found).length;
export const isComplete = (game: SavedGame): boolean => game.puzzle.words.every((w) => w.found);

export interface SelectionOutcome {
  game: SavedGame;
  result: SelectionResult;
  /** This selection found the last word. */
  complete: boolean;
}

/** Applies a finished selection: marks the word found, gives it the next highlight color, and drops its hint. */
export function applySelection(game: SavedGame, cells: readonly Cell[]): SelectionOutcome {
  const result = evaluateSelection(game.puzzle, cells);
  if (result.kind !== 'found') return { game, result, complete: false };
  const colorIdx = foundCount(game);
  const words = game.puzzle.words.map((w) => (w.word === result.word.word ? { ...w, found: true, colorIdx } : w));
  const next: SavedGame = {
    ...game,
    puzzle: { ...game.puzzle, words },
    hintedWords: game.hintedWords.filter((h) => h.word !== result.word.word),
  };
  return { game: next, result: { kind: 'found', word: { ...result.word, found: true, colorIdx } }, complete: isComplete(next) };
}
