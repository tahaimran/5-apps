import { generatePuzzle } from './generator';
import { hash32 } from './prng';
import { getPack } from './packs';
import type { Difficulty, PackId, Puzzle } from './types';

export const levelPuzzleId = (packId: PackId, difficulty: Difficulty, level: number) => `${packId}:${difficulty}:${level}`;

export interface ParsedPuzzleId {
  kind: 'level' | 'daily' | 'tutorial';
  packId?: PackId;
  difficulty?: Difficulty;
  level?: number;
  dateKey?: string;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** Reads `animals:easy:12`, `daily:2026-10-08:medium` or `tutorial`; null for anything else. */
export function parsePuzzleId(id: string): ParsedPuzzleId | null {
  if (id === TUTORIAL_ID) return { kind: 'tutorial' };
  const parts = id.split(':');
  if (parts.length !== 3) return null;
  const [a, b, c] = parts;
  if (a === 'daily') {
    return /^\d{4}-\d{2}-\d{2}$/.test(b) && DIFFICULTIES.includes(c as Difficulty) ? { kind: 'daily', dateKey: b, difficulty: c as Difficulty } : null;
  }
  const level = Number(c);
  if (!getPack(a) || !DIFFICULTIES.includes(b as Difficulty) || !Number.isInteger(level) || level < 1) return null;
  return { kind: 'level', packId: a, difficulty: b as Difficulty, level };
}

/**
 * The puzzle for a pack level. The seed comes from the id and the grid size, so the same level
 * on the same display size is always the same puzzle (it can differ between text sizes because
 * the grid size does).
 */
export function levelPuzzle(packId: PackId, difficulty: Difficulty, level: number, size: number): Puzzle {
  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown pack ${packId}`);
  const id = levelPuzzleId(packId, difficulty, level);
  return generatePuzzle({ id, packId, difficulty, size, seed: hash32(`ws-level-v1:${id}:${size}`), words: pack.words });
}

export const TUTORIAL_ID = 'tutorial';
export const TUTORIAL_WORDS = ['CAT', 'DOG', 'COW', 'HEN'] as const;

/** Plan §6 screen 5: a 6x6 puzzle with four words, whatever difficulty was chosen. */
export function tutorialPuzzle(): Puzzle {
  return generatePuzzle({
    id: TUTORIAL_ID,
    packId: 'animals',
    difficulty: 'easy',
    size: 6,
    seed: hash32('ws-tutorial-v1'),
    words: TUTORIAL_WORDS,
    wordCount: TUTORIAL_WORDS.length,
  });
}
