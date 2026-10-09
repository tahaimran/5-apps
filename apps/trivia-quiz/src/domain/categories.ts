import { CATEGORY_IDS, ID_PREFIX } from '@/content/validate';
import type { CategoryId, Difficulty } from './types';

export interface CategoryInfo {
  id: CategoryId;
  /** MaterialCommunityIcons glyph. */
  icon: string;
  /** Plan §7 category colour, used for the tile edge and icon. */
  color: string;
  /** Darker variant used behind white text so the pair keeps 4.5:1. */
  strong: string;
}

/** Plan §7 category colours, with a darker `strong` shade wherever white text on the base colour is under 4.5:1. */
export const CATEGORIES: readonly CategoryInfo[] = [
  { id: 'general', icon: 'lightbulb-on-outline', color: '#6366F1', strong: '#4F46E5' },
  { id: 'geography', icon: 'earth', color: '#0EA5E9', strong: '#0369A1' },
  { id: 'history', icon: 'castle', color: '#A16207', strong: '#854D0E' },
  { id: 'science', icon: 'flask-outline', color: '#10B981', strong: '#047857' },
  { id: 'movies', icon: 'movie-open-outline', color: '#E11D48', strong: '#BE123C' },
  { id: 'music', icon: 'music-note', color: '#D946EF', strong: '#A21CAF' },
  { id: 'sports', icon: 'soccer', color: '#F97316', strong: '#C2410C' },
  { id: 'animals', icon: 'paw', color: '#84CC16', strong: '#4D7C0F' },
  { id: 'food', icon: 'food-apple-outline', color: '#EAB308', strong: '#A16207' },
  { id: 'literature', icon: 'book-open-page-variant-outline', color: '#8B5CF6', strong: '#6D28D9' },
  { id: 'logic', icon: 'puzzle-outline', color: '#14B8A6', strong: '#0F766E' },
  { id: 'flags', icon: 'flag-variant-outline', color: '#EF4444', strong: '#B91C1C' },
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
