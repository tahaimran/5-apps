import { CATEGORY_IDS, ID_PREFIX } from '@/content/validate';
import type { CategoryId, Difficulty } from './types';

export interface CategoryInfo {
  id: CategoryId;
  /** The category hue (icon fills, tile tints, bars). Its Lucide icon lives in src/ui/icons.tsx. */
  color: string;
  /** A darker shade of the hue that carries white text at 4.5:1 or better (contrast test). */
  strong: string;
}

/** Twelve distinct hues (plan §7), each with a white-text-safe `strong` shade. */
export const CATEGORIES: readonly CategoryInfo[] = [
  { id: 'general', color: '#6366F1', strong: '#4F46E5' },
  { id: 'geography', color: '#0EA5E9', strong: '#0369A1' },
  { id: 'history', color: '#D97706', strong: '#A44A04' },
  { id: 'science', color: '#10B981', strong: '#047857' },
  { id: 'movies', color: '#F43F5E', strong: '#BE123C' },
  { id: 'music', color: '#D946EF', strong: '#A21CAF' },
  { id: 'sports', color: '#F97316', strong: '#C2410C' },
  { id: 'animals', color: '#84CC16', strong: '#4D7C0F' },
  { id: 'food', color: '#EAB308', strong: '#946200' },
  { id: 'literature', color: '#8B5CF6', strong: '#6D28D9' },
  { id: 'logic', color: '#14B8A6', strong: '#0F766E' },
  { id: 'flags', color: '#EF4444', strong: '#B91C1C' },
];

export const CATEGORY_LIST: CategoryId[] = CATEGORIES.map((c) => c.id);
export const categoryInfo = (id: CategoryId): CategoryInfo => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
export const isCategory = (v: unknown): v is CategoryId => typeof v === 'string' && (CATEGORY_LIST as string[]).includes(v);

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3];

/** Same ids, same order as the content validator uses. Checked by a test. */
export const CONTENT_CATEGORY_IDS: readonly string[] = CATEGORY_IDS;

/** The category an id belongs to ("geo-000412" is geography), from its three-letter prefix. */
export const categoryOfId = (id: string): CategoryId => {
  const prefix = id.slice(0, 3);
  return (CATEGORY_LIST.find((c) => ID_PREFIX[c] === prefix) ?? 'general') as CategoryId;
};
