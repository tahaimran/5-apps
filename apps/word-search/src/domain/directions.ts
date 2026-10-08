import type { Difficulty, Direction } from './types';

/** Row/column step of each of the 8 directions (row grows downward). */
export const DIRECTION_VECTORS: Record<Direction, { dr: number; dc: number }> = {
  E: { dr: 0, dc: 1 },
  S: { dr: 1, dc: 0 },
  SE: { dr: 1, dc: 1 },
  NE: { dr: -1, dc: 1 },
  W: { dr: 0, dc: -1 },
  N: { dr: -1, dc: 0 },
  NW: { dr: -1, dc: -1 },
  SW: { dr: 1, dc: -1 },
};

export const ALL_DIRECTIONS: Direction[] = ['E', 'S', 'SE', 'NE', 'W', 'N', 'NW', 'SW'];

/** Plan §8.2. */
export const DIRECTIONS_BY_DIFFICULTY: Record<Difficulty, Direction[]> = {
  easy: ['E', 'S'],
  medium: ['E', 'S', 'SE', 'NE'],
  hard: ALL_DIRECTIONS,
};

/** The direction that reads the same line the other way round. */
export const OPPOSITE: Record<Direction, Direction> = { E: 'W', W: 'E', S: 'N', N: 'S', SE: 'NW', NW: 'SE', NE: 'SW', SW: 'NE' };

/** Which way the arrow of each direction points, for screen reader text. */
export const DIRECTION_NAMES: Record<Direction, string> = {
  E: 'right',
  W: 'left',
  S: 'down',
  N: 'up',
  SE: 'down and right',
  NE: 'up and right',
  SW: 'down and left',
  NW: 'up and left',
};
