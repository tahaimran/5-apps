import { templates, type GoalId, type Template } from './templates';

export interface Goal {
  id: GoalId;
  emoji: string;
}

/** The goal chips of onboarding step 1 (labels live under `onboarding.goals.<id>`). */
export const goals: Goal[] = [
  { id: 'fit', emoji: '💪' },
  { id: 'sleep', emoji: '😴' },
  { id: 'productive', emoji: '⚡' },
  { id: 'mind', emoji: '🧘' },
  { id: 'quit', emoji: '🚭' },
  { id: 'learn', emoji: '📚' },
  { id: 'healthier', emoji: '💧' },
];

/** Shown when no goal matches (and to top up short lists). */
const DEFAULT_STARTERS = ['drink-water', 'make-bed', 'walk-daily', 'meditate', 'journal', 'read'];

/**
 * Six templates for the starter-habits step, best match for the chosen goals first.
 * "Quit" templates only appear when the Break a bad habit goal is chosen.
 */
export function rankTemplates(chosen: GoalId[], limit = 6, pool: Template[] = templates): Template[] {
  const wantsQuit = chosen.includes('quit');
  const scored = pool
    .filter((t) => wantsQuit || t.category !== 'quit')
    .map((t, order) => ({ t, order, score: t.goals.filter((g) => chosen.includes(g)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((x) => x.t);

  const out = scored.slice(0, limit);
  for (const id of DEFAULT_STARTERS) {
    if (out.length >= limit) break;
    const t = pool.find((x) => x.id === id);
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}
