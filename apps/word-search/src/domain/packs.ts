import type { PackId } from './types';

export interface WordPack {
  id: PackId;
  name: string;
  /** MaterialCommunityIcons name. */
  icon: string;
  words: string[];
}

/** The 12 bundled packs (plan F5). Order is the order on Home. */
export const PACKS: WordPack[] = [
  require('../../assets/wordlists/animals.json'),
  require('../../assets/wordlists/birds.json'),
  require('../../assets/wordlists/food.json'),
  require('../../assets/wordlists/baking.json'),
  require('../../assets/wordlists/travel.json'),
  require('../../assets/wordlists/cities.json'),
  require('../../assets/wordlists/nature.json'),
  require('../../assets/wordlists/holidays.json'),
  require('../../assets/wordlists/seasons.json'),
  require('../../assets/wordlists/hobbies.json'),
  require('../../assets/wordlists/music.json'),
  require('../../assets/wordlists/home.json'),
];

export const DEFAULT_PACK: PackId = 'animals';

export const getPack = (id: PackId): WordPack | undefined => PACKS.find((p) => p.id === id);

/** Daily themes rotate through the packs in this order (plan §8.6). */
export const DAILY_ROTATION: PackId[] = [
  'animals', 'food', 'nature', 'travel', 'music', 'baking', 'birds', 'home', 'seasons', 'hobbies', 'cities', 'holidays',
];
