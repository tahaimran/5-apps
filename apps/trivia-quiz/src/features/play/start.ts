import { getBank } from '@/content/bank';
import { epochDay } from '@/domain/dateKey';
import { currentDateKey } from '@/store/today';
import { buildBlitz, buildCategory, buildClassic, buildDaily, buildWarmup } from '@/domain/modes';
import { startRound, type RoundConfig } from '@/domain/round';
import type { CategoryId, Difficulty } from '@/domain/types';
import { useProfile, useSeen } from '@/store/stores';
import { useRound } from '@/store/round';
import { useSettings } from '@/store/settings';

const newSeed = () => Math.floor(Math.random() * 2 ** 31);
const common = () => ({ bank: getBank(), seed: newSeed(), relaxed: useSettings.getState().settings.relaxedMode });
const seenNow = () => ({ seen: useSeen.getState().value, today: epochDay(currentDateKey()) });

let counter = 0;
const newId = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Puts a built round into the round store and returns the id for the `quiz/[sessionId]` route. */
export function beginRound(config: RoundConfig | null): string | null {
  if (!config || config.questions.length === 0) return null;
  const id = newId();
  useRound.getState().begin(id, startRound(config));
  return id;
}

export const startClassic = (category: CategoryId, level: number) => beginRound(buildClassic({ ...common(), ...seenNow(), category, level }));
export const startCategory = (category: CategoryId, difficulty: Difficulty) => beginRound(buildCategory({ ...common(), ...seenNow(), category, difficulty }));
export const startBlitz = () => beginRound(buildBlitz({ ...common(), ...seenNow() }));
/** The Daily of the date at this moment (read now, not captured earlier). */
export const startDaily = () => beginRound(buildDaily({ ...common(), date: currentDateKey() }));
export const startWarmup = () => beginRound(buildWarmup({ ...common(), favorites: useProfile.getState().value.favoriteCategories }));
