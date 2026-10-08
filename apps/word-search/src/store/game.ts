import { create } from 'zustand';
import { applySelection, startGame, type SelectionOutcome } from '@/domain/game';
import { parsePuzzleId } from '@/domain/puzzles';
import { starsFor } from '@/domain/scoring';
import type { Cell } from '@/domain/selection';
import type { CompletedResult, Puzzle, SavedGame } from '@/domain/types';
import { useProgress } from './progress';
import { useResult } from './result';
import { useStats } from './stats';
import { db } from './storage';

interface GameState {
  /** The puzzle in progress (`ws.current`), autosaved after every found word and when the app leaves the foreground. */
  current: SavedGame | null;
  /** When the player came back to the puzzle (ms), for the elapsed time; null while paused. Not persisted. */
  activeSince: number | null;
  /** Resumes the saved puzzle if it is this one; returns null otherwise. */
  resume: (puzzleId: string) => SavedGame | null;
  /** Starts a new puzzle, replacing whatever was in progress. */
  begin: (puzzle: Puzzle) => SavedGame;
  select: (cells: Cell[]) => SelectionOutcome | null;
  /** Adds the time since the puzzle was last active and saves (app to background, leaving the screen). */
  pause: () => void;
  /** Finishes the puzzle: records stars, progress and stats, clears the save, and returns what the Complete screen shows. */
  finish: () => CompletedResult | null;
  discard: () => void;
}

const save = (game: SavedGame | null) => db.set('current', game);

export const useGame = create<GameState>((set, get) => ({
  current: db.get('current') ?? null,
  activeSince: null,
  resume: (puzzleId) => {
    const game = get().current;
    if (!game || game.puzzle.id !== puzzleId) return null;
    set({ activeSince: Date.now() });
    return game;
  },
  begin: (puzzle) => {
    const now = Date.now();
    const game = startGame(puzzle, now);
    save(game);
    set({ current: game, activeSince: now });
    return game;
  },
  select: (cells) => {
    const game = get().current;
    if (!game) return null;
    const out = applySelection(game, cells);
    if (out.result.kind === 'found') {
      save(out.game);
      set({ current: out.game });
    }
    return out;
  },
  pause: () => {
    const { current, activeSince } = get();
    if (!current || activeSince === null) return;
    const game = { ...current, elapsedMs: current.elapsedMs + (Date.now() - activeSince) };
    save(game);
    set({ current: game, activeSince: null });
  },
  finish: () => {
    get().pause();
    const game = get().current;
    if (!game) return null;
    const parsed = parsePuzzleId(game.puzzle.id);
    const stars = starsFor(game.hintsUsed);
    if (parsed?.kind === 'level' && parsed.packId && parsed.difficulty && parsed.level) {
      useProgress.getState().record(parsed.packId, parsed.difficulty, parsed.level, stars);
    }
    useStats.getState().recordPuzzle(game);
    const result: CompletedResult = {
      puzzleId: game.puzzle.id,
      packId: game.puzzle.packId,
      difficulty: game.puzzle.difficulty,
      level: parsed?.level,
      dateKey: parsed?.dateKey,
      isDaily: parsed?.kind === 'daily',
      isTutorial: parsed?.kind === 'tutorial',
      stars,
      wordsFound: game.puzzle.words.length,
      elapsedMs: game.elapsedMs,
      hintsUsed: game.hintsUsed,
    };
    useResult.getState().set(result);
    save(null);
    set({ current: null, activeSince: null });
    return result;
  },
  discard: () => {
    save(null);
    set({ current: null, activeSince: null });
  },
}));
