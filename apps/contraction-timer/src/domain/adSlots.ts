/**
 * Where the native ad card goes in the week list (plan §12: "after the 3rd card, then every 8").
 * Slots are given as "this many cards come before the ad": 3, 11, 19, ...
 */
export const FIRST_AD_AFTER = 3;
export const AD_EVERY = 8;

export type ListItem<T> = { kind: 'card'; card: T } | { kind: 'ad'; key: string };

export function withAdSlots<T>(cards: readonly T[]): ListItem<T>[] {
  const out: ListItem<T>[] = [];
  cards.forEach((card, i) => {
    if (i >= FIRST_AD_AFTER && (i - FIRST_AD_AFTER) % AD_EVERY === 0) out.push({ kind: 'ad', key: `ad-${i}` });
    out.push({ kind: 'card', card });
  });
  return out;
}
