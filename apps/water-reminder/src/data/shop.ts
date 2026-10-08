/**
 * Plant skins and cup themes (plan §3 v1.1 / §5.3): 6 each, 2 free, the rest unlocked with a
 * rewarded ad or a streak milestone. Data only; the colors are decorative.
 */
export interface ShopItem {
  id: string;
  /** Pot color for skins, chip tint for cup themes. */
  pot: string;
  leaf?: string;
  /** How the item unlocks: free, a rewarded ad, or a streak (days). */
  unlock: { kind: 'free' } | { kind: 'ad' } | { kind: 'streak'; days: number };
}

export const skins: ShopItem[] = [
  { id: 'classic', pot: '#C86B3C', unlock: { kind: 'free' } },
  { id: 'sky', pot: '#5B9BD5', unlock: { kind: 'free' } },
  { id: 'berry', pot: '#B4457E', leaf: '#3FA66B', unlock: { kind: 'ad' } },
  { id: 'sunny', pot: '#E0A526', leaf: '#4CBF7A', unlock: { kind: 'ad' } },
  { id: 'mint', pot: '#3FB59A', leaf: '#2E9E5B', unlock: { kind: 'streak', days: 14 } },
  { id: 'night', pot: '#4B4F8A', leaf: '#5BC69A', unlock: { kind: 'streak', days: 30 } },
];

export const cupThemes: ShopItem[] = [
  { id: 'classic', pot: '#2B9FE6', unlock: { kind: 'free' } },
  { id: 'leaf', pot: '#4CBF7A', unlock: { kind: 'free' } },
  { id: 'peach', pot: '#F29B7A', unlock: { kind: 'ad' } },
  { id: 'lilac', pot: '#9B86E0', unlock: { kind: 'ad' } },
  { id: 'sun', pot: '#E8B21F', unlock: { kind: 'streak', days: 14 } },
  { id: 'rose', pot: '#E0668F', unlock: { kind: 'streak', days: 30 } },
];

export const skinById = (id: string): ShopItem => skins.find((s) => s.id === id) ?? skins[0];
export const cupThemeById = (id: string): ShopItem => cupThemes.find((s) => s.id === id) ?? cupThemes[0];
