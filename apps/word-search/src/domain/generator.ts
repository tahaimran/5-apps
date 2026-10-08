import { BLOCKED_WORDS } from './blocklist';
import { DIRECTIONS_BY_DIFFICULTY, DIRECTION_VECTORS } from './directions';
import { mulberry32, pick, randInt, shuffled, type Rng } from './prng';
import type { Difficulty, Direction, PackId, PlacedWord, Puzzle } from './types';

/** Plan §8.1/§8.3: base grid and word counts per difficulty. */
export const DIFFICULTY_CONFIG: Record<Difficulty, { baseSize: number; minWords: number; maxWords: number }> = {
  easy: { baseSize: 8, minWords: 6, maxWords: 8 },
  medium: { baseSize: 10, minWords: 8, maxWords: 10 },
  hard: { baseSize: 12, minWords: 10, maxWords: 14 },
};

export const MIN_GRID = 6;
export const MIN_WORD_LENGTH = 3;
const PLACEMENT_TRIES = 200;
const OVERLAP_CANDIDATES = 5;
const MAX_RESTARTS = 30;
const FILL_PASSES = 10;

/** English letter frequencies (per mille), used for the filler letters. */
const LETTER_WEIGHTS: Record<string, number> = {
  A: 82, B: 15, C: 28, D: 43, E: 127, F: 22, G: 20, H: 61, I: 70, J: 2, K: 8, L: 40, M: 24,
  N: 67, O: 75, P: 19, Q: 1, R: 60, S: 63, T: 91, U: 28, V: 10, W: 24, X: 2, Y: 20, Z: 1,
};
const LETTERS = Object.keys(LETTER_WEIGHTS);
const TOTAL_WEIGHT = LETTERS.reduce((n, l) => n + LETTER_WEIGHTS[l], 0);

function randomLetter(rng: Rng): string {
  let x = rng() * TOTAL_WEIGHT;
  for (const l of LETTERS) {
    x -= LETTER_WEIGHTS[l];
    if (x < 0) return l;
  }
  return 'E';
}

/** Uppercase A–Z only; spaces, hyphens and apostrophes are dropped (plan §8.3 step 2). */
export const normalizeWord = (word: string): string => word.toUpperCase().replace(/[^A-Z]/g, '');

export interface GenerateOptions {
  id: string;
  packId: PackId;
  difficulty: Difficulty;
  seed: number;
  size: number;
  /** Candidate words (any case; normalized here). */
  words: readonly string[];
  /** Exact number of words; default: drawn from the difficulty's range, capped by the grid size. */
  wordCount?: number;
}

/** How many words fit a grid: the plan's range, capped so small grids stay solvable. */
export function wordCountRange(difficulty: Difficulty, size: number): { min: number; max: number } {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const cap = Math.max(3, Math.floor((size * size) / 9));
  return { min: Math.min(cfg.minWords, cap), max: Math.min(cfg.maxWords, cap) };
}

/** Grid lines in the four axes (rows, columns, both diagonals) as arrays of cell indexes. */
const lineCache = new Map<number, number[][]>();
function linesFor(size: number): number[][] {
  let lines = lineCache.get(size);
  if (lines) return lines;
  lines = [];
  for (let r = 0; r < size; r++) lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  // down-right diagonals, starting on the top row and the left column
  for (let start = -(size - 1); start < size; start++) {
    const line: number[] = [];
    for (let r = 0; r < size; r++) {
      const c = r + start;
      if (c >= 0 && c < size) line.push(r * size + c);
    }
    if (line.length >= MIN_WORD_LENGTH) lines.push(line);
  }
  // up-right diagonals
  for (let sum = 0; sum <= 2 * (size - 1); sum++) {
    const line: number[] = [];
    for (let r = size - 1; r >= 0; r--) {
      const c = sum - r;
      if (c >= 0 && c < size) line.push(r * size + c);
    }
    if (line.length >= MIN_WORD_LENGTH) lines.push(line);
  }
  lineCache.set(size, lines);
  return lines;
}

const reverse = (s: string) => [...s].reverse().join('');

export interface Occurrence {
  /** First and last cell index of the occurrence. */
  start: number;
  end: number;
  /** All cells of the occurrence. */
  cells: number[];
}

/**
 * Every place `word` can be read in the grid in any of the 8 directions. A palindrome read both
 * ways is one occurrence. Cells that are still empty are `''` and never match.
 */
export function findOccurrences(cells: readonly string[], size: number, word: string): Occurrence[] {
  const found = new Map<string, Occurrence>();
  const rev = reverse(word);
  for (const line of linesFor(size)) {
    if (line.length < word.length) continue;
    const text = line.map((i) => cells[i] || '.').join('');
    for (const probe of word === rev ? [word] : [word, rev]) {
      let at = text.indexOf(probe);
      while (at >= 0) {
        const span = line.slice(at, at + word.length);
        const a = span[0];
        const b = span[span.length - 1];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!found.has(key)) found.set(key, { start: a, end: b, cells: span });
        at = text.indexOf(probe, at + 1);
      }
    }
  }
  return [...found.values()];
}

const placedKey = (p: PlacedWord, size: number) => {
  const { dr, dc } = DIRECTION_VECTORS[p.dir];
  const a = p.row * size + p.col;
  const b = (p.row + dr * (p.word.length - 1)) * size + p.col + dc * (p.word.length - 1);
  return a < b ? `${a}-${b}` : `${b}-${a}`;
};

const occurrenceKey = (o: Occurrence) => (o.start < o.end ? `${o.start}-${o.end}` : `${o.end}-${o.start}`);

/** Cell indexes a placed word covers. */
export function wordCells(p: Pick<PlacedWord, 'word' | 'row' | 'col' | 'dir'>, size: number): number[] {
  const { dr, dc } = DIRECTION_VECTORS[p.dir];
  return Array.from({ length: p.word.length }, (_, i) => (p.row + dr * i) * size + p.col + dc * i);
}

/** Two listed words must not hide each other (CAT inside CATTLE, or read backwards). */
const conflicts = (a: string, b: string) => a.includes(b) || b.includes(a) || a.includes(reverse(b)) || b.includes(reverse(a));

function selectWords(rng: Rng, pool: readonly string[], count: number, size: number): string[] | null {
  const budget = Math.floor(size * size * 0.6);
  const order = shuffled(rng, pool);
  const chosen: string[] = [];
  let letters = 0;
  const accept = (w: string) => {
    if (chosen.length >= count || chosen.includes(w) || chosen.some((c) => conflicts(c, w))) return false;
    // Keep room for the rest: no word may eat the budget the others still need (3 letters each at least).
    if (letters + w.length + (count - chosen.length - 1) * MIN_WORD_LENGTH > budget) return false;
    chosen.push(w);
    letters += w.length;
    return true;
  };
  // At least one long word (plan §8.3 step 2), then fill up with a mix.
  const long = order.find((w) => w.length >= size - 2);
  if (long) accept(long);
  for (const w of order) {
    if (chosen.length >= count) break;
    accept(w);
  }
  return chosen.length === count ? chosen : null;
}

interface Candidate {
  row: number;
  col: number;
  dir: Direction;
  overlap: number;
}

function tryPlace(cells: string[], size: number, word: string, dirs: readonly Direction[], rng: Rng, prefersOverlap: boolean): PlacedWord | null {
  const wanted = prefersOverlap ? OVERLAP_CANDIDATES : 1;
  const valid: Candidate[] = [];
  for (let attempt = 0; attempt < PLACEMENT_TRIES && valid.length < wanted; attempt++) {
    const dir = pick(rng, dirs);
    const { dr, dc } = DIRECTION_VECTORS[dir];
    const row = randInt(rng, 0, size - 1);
    const col = randInt(rng, 0, size - 1);
    const endR = row + dr * (word.length - 1);
    const endC = col + dc * (word.length - 1);
    if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
    let overlap = 0;
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const existing = cells[(row + dr * i) * size + col + dc * i];
      if (existing === '') continue;
      if (existing !== word[i]) {
        ok = false;
        break;
      }
      overlap++;
    }
    if (ok) valid.push({ row, col, dir, overlap });
  }
  if (valid.length === 0) return null;
  const best = valid.reduce((a, b) => (b.overlap > a.overlap ? b : a));
  const { dr, dc } = DIRECTION_VECTORS[best.dir];
  for (let i = 0; i < word.length; i++) cells[(best.row + dr * i) * size + best.col + dc * i] = word[i];
  return { word, row: best.row, col: best.col, dir: best.dir, found: false };
}

/** A list of problems with the grid: extra copies of listed words and blocked words made of filler. */
function violations(cells: readonly string[], size: number, placed: readonly PlacedWord[], isFiller: readonly boolean[]): Occurrence[] {
  const bad: Occurrence[] = [];
  for (const p of placed) {
    const own = placedKey(p, size);
    for (const o of findOccurrences(cells, size, p.word)) if (occurrenceKey(o) !== own) bad.push(o);
  }
  for (const word of BLOCKED_WORDS) {
    for (const o of findOccurrences(cells, size, word)) if (o.cells.some((i) => isFiller[i])) bad.push(o);
  }
  return bad;
}

function attempt(opts: GenerateOptions, rng: Rng, words: string[]): { grid: string[]; words: PlacedWord[] } | null {
  const { size, difficulty } = opts;
  const dirs = DIRECTIONS_BY_DIFFICULTY[difficulty];
  const cells: string[] = Array(size * size).fill('');
  const placed: PlacedWord[] = [];
  const byLength = [...words].sort((a, b) => b.length - a.length);
  for (const word of byLength) {
    const p = tryPlace(cells, size, word, dirs, rng, difficulty !== 'easy');
    if (!p) return null;
    placed.push(p);
  }
  // Overlaps must not have spelled a listed word a second time.
  for (const p of placed) {
    const own = placedKey(p, size);
    if (findOccurrences(cells, size, p.word).some((o) => occurrenceKey(o) !== own)) return null;
  }
  const isFiller = cells.map((c) => c === '');
  for (let i = 0; i < cells.length; i++) if (isFiller[i]) cells[i] = randomLetter(rng);
  for (let pass = 0; pass < FILL_PASSES; pass++) {
    const bad = violations(cells, size, placed, isFiller);
    if (bad.length === 0) return { grid: rows(cells, size), words: placed };
    for (const o of bad) {
      const fillers = o.cells.filter((i) => isFiller[i]);
      if (fillers.length === 0) return null;
      const i = pick(rng, fillers);
      let next = randomLetter(rng);
      while (next === cells[i]) next = randomLetter(rng);
      cells[i] = next;
    }
  }
  return violations(cells, size, placed, isFiller).length === 0 ? { grid: rows(cells, size), words: placed } : null;
}

const rows = (cells: readonly string[], size: number): string[] =>
  Array.from({ length: size }, (_, r) => cells.slice(r * size, (r + 1) * size).join(''));

/**
 * Builds a puzzle (plan §8.3): picks words from the pool, places them, fills the rest with letters
 * and checks that every listed word appears exactly once and no blocked word shows up. The same
 * options always give the same puzzle. Throws only if the pool is too small for the grid.
 */
export function generatePuzzle(opts: GenerateOptions): Puzzle {
  const size = Math.max(MIN_GRID, opts.size);
  const options = { ...opts, size };
  const pool = [...new Set(opts.words.map(normalizeWord))].filter((w) => w.length >= MIN_WORD_LENGTH && w.length <= size);
  const range = wordCountRange(opts.difficulty, size);
  const rng = mulberry32(opts.seed);
  const target = opts.wordCount ?? randInt(rng, range.min, range.max);
  for (let restart = 0; restart < MAX_RESTARTS; restart++) {
    // "Reduce the word count by 1 after 3 restarts" (plan §8.3 step 4); never below 3 words.
    const count = Math.max(Math.min(3, target), target - Math.floor(restart / 3));
    const words = selectWords(rng, pool, count, size);
    if (!words) continue;
    const result = attempt(options, rng, words);
    if (result) {
      return {
        id: opts.id,
        seed: opts.seed,
        size,
        grid: result.grid,
        words: result.words.sort((a, b) => a.word.localeCompare(b.word)),
        packId: opts.packId,
        difficulty: opts.difficulty,
      };
    }
  }
  throw new Error(`Could not build a ${size}x${size} ${opts.difficulty} puzzle for ${opts.id}`);
}
