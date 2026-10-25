import type { DailyState, PackId, PackProgress } from '@/domain/types';

/** Stars collected in one pack, every difficulty together (each level counts its best result). */
export function packStars(progress: PackProgress | undefined): number {
  if (!progress) return 0;
  return Object.values(progress).reduce((sum, track) => sum + Object.values(track.stars).reduce((a, s) => a + s, 0), 0);
}

/** All stars collected: every pack's levels plus every daily puzzle. A display total only; nothing spends it. */
export function totalStars(packs: Record<PackId, PackProgress>, daily: DailyState): number {
  const fromPacks = Object.values(packs).reduce((sum, p) => sum + packStars(p), 0);
  return fromPacks + Object.values(daily.completed).reduce((sum, d) => sum + d.stars, 0);
}
