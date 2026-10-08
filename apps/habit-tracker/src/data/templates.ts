import type { CategoryId, Schedule } from '@/domain/types';
import type { HabitColorName } from '@/theme/tokens';

export type GoalId = 'fit' | 'sleep' | 'productive' | 'mind' | 'quit' | 'learn' | 'healthier';

export interface Template {
  id: string;
  category: CategoryId;
  icon: string;
  color: HabitColorName;
  type: 'boolean' | 'count' | 'timer';
  /** Count: the number. Timer: minutes. Yes/no: 1. */
  target: number;
  /** Has a localized unit under `templates.<id>.unit`. */
  hasUnit?: boolean;
  schedule: Schedule;
  /** Suggested reminder, HH:mm. */
  reminder: string;
  goals: GoalId[];
}

/** Names (and units) live in en.json under `templates.<id>`. Generated once; edit freely. */
export const templates: Template[] = [
  { id: 'drink-water', category: 'health', icon: 'cup-water', color: 'sky', type: 'count', target: 8, hasUnit: true, schedule: { kind: 'daily' }, reminder: '10:00', goals: ['healthier'] },
  { id: 'vitamins', category: 'health', icon: 'pill', color: 'orange', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '08:00', goals: ['healthier'] },
  { id: 'in-bed-early', category: 'health', icon: 'bed-clock', color: 'violet', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '22:30', goals: ['sleep'] },
  { id: 'no-screens-late', category: 'health', icon: 'cellphone-off', color: 'slate', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '22:30', goals: ['sleep', 'mind'] },
  { id: 'eat-fruit', category: 'health', icon: 'food-apple', color: 'red', type: 'count', target: 2, hasUnit: true, schedule: { kind: 'daily' }, reminder: '12:30', goals: ['healthier'] },
  { id: 'sunlight', category: 'health', icon: 'weather-sunny', color: 'yellow', type: 'timer', target: 15, schedule: { kind: 'daily' }, reminder: '09:00', goals: ['healthier', 'sleep'] },
  { id: 'floss', category: 'health', icon: 'tooth-outline', color: 'teal', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '21:00', goals: ['healthier'] },
  { id: 'walk-daily', category: 'fitness', icon: 'walk', color: 'green', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '17:30', goals: ['fit', 'healthier'] },
  { id: 'steps', category: 'fitness', icon: 'shoe-print', color: 'green', type: 'count', target: 8000, hasUnit: true, schedule: { kind: 'daily' }, reminder: '19:00', goals: ['fit'] },
  { id: 'strength', category: 'fitness', icon: 'dumbbell', color: 'red', type: 'boolean', target: 1, schedule: { kind: 'perWeek', times: 3 }, reminder: '18:00', goals: ['fit'] },
  { id: 'run', category: 'fitness', icon: 'run', color: 'orange', type: 'boolean', target: 1, schedule: { kind: 'perWeek', times: 3 }, reminder: '07:00', goals: ['fit'] },
  { id: 'pushups', category: 'fitness', icon: 'arm-flex', color: 'rose', type: 'count', target: 20, hasUnit: true, schedule: { kind: 'daily' }, reminder: '08:30', goals: ['fit'] },
  { id: 'stretch', category: 'fitness', icon: 'yoga', color: 'pink', type: 'timer', target: 10, schedule: { kind: 'daily' }, reminder: '07:30', goals: ['fit', 'mind', 'sleep'] },
  { id: 'cycle', category: 'fitness', icon: 'bike', color: 'blue', type: 'boolean', target: 1, schedule: { kind: 'perWeek', times: 2 }, reminder: '17:00', goals: ['fit'] },
  { id: 'meditate', category: 'mind', icon: 'meditation', color: 'violet', type: 'timer', target: 10, schedule: { kind: 'daily' }, reminder: '07:00', goals: ['mind', 'sleep'] },
  { id: 'journal', category: 'mind', icon: 'notebook-edit-outline', color: 'blue', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '21:30', goals: ['mind'] },
  { id: 'gratitude', category: 'mind', icon: 'heart-outline', color: 'pink', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '21:00', goals: ['mind'] },
  { id: 'breathe', category: 'mind', icon: 'weather-windy', color: 'teal', type: 'timer', target: 5, schedule: { kind: 'daily' }, reminder: '13:00', goals: ['mind'] },
  { id: 'outside', category: 'mind', icon: 'tree-outline', color: 'green', type: 'timer', target: 20, schedule: { kind: 'daily' }, reminder: '12:00', goals: ['mind', 'healthier'] },
  { id: 'digital-detox', category: 'mind', icon: 'power-plug-off-outline', color: 'slate', type: 'boolean', target: 1, schedule: { kind: 'weekdays', days: [0, 6] }, reminder: '10:00', goals: ['mind'] },
  { id: 'call-friend', category: 'mind', icon: 'phone-in-talk-outline', color: 'sky', type: 'boolean', target: 1, schedule: { kind: 'perWeek', times: 2 }, reminder: '18:30', goals: ['mind'] },
  { id: 'make-bed', category: 'productivity', icon: 'bed', color: 'violet', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '07:30', goals: ['productive'] },
  { id: 'plan-day', category: 'productivity', icon: 'clipboard-check-outline', color: 'blue', type: 'boolean', target: 1, schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, reminder: '08:30', goals: ['productive'] },
  { id: 'deep-work', category: 'productivity', icon: 'timer-sand', color: 'orange', type: 'timer', target: 60, schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, reminder: '09:00', goals: ['productive'] },
  { id: 'tidy', category: 'productivity', icon: 'broom', color: 'teal', type: 'timer', target: 10, schedule: { kind: 'daily' }, reminder: '19:30', goals: ['productive'] },
  { id: 'inbox-zero', category: 'productivity', icon: 'email-check-outline', color: 'sky', type: 'boolean', target: 1, schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, reminder: '16:30', goals: ['productive'] },
  { id: 'weekly-review', category: 'productivity', icon: 'calendar-check-outline', color: 'yellow', type: 'boolean', target: 1, schedule: { kind: 'perWeek', times: 1 }, reminder: '17:00', goals: ['productive'] },
  { id: 'top-three', category: 'productivity', icon: 'target', color: 'red', type: 'boolean', target: 1, schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, reminder: '08:45', goals: ['productive'] },
  { id: 'read', category: 'learning', icon: 'book-open-variant', color: 'orange', type: 'count', target: 10, hasUnit: true, schedule: { kind: 'daily' }, reminder: '21:00', goals: ['learn', 'sleep'] },
  { id: 'language', category: 'learning', icon: 'translate', color: 'blue', type: 'timer', target: 15, schedule: { kind: 'daily' }, reminder: '18:00', goals: ['learn'] },
  { id: 'study', category: 'learning', icon: 'school-outline', color: 'violet', type: 'timer', target: 30, schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, reminder: '17:00', goals: ['learn', 'productive'] },
  { id: 'podcast', category: 'learning', icon: 'headphones', color: 'teal', type: 'boolean', target: 1, schedule: { kind: 'perWeek', times: 3 }, reminder: '08:15', goals: ['learn'] },
  { id: 'instrument', category: 'learning', icon: 'guitar-acoustic', color: 'rose', type: 'timer', target: 20, schedule: { kind: 'perWeek', times: 4 }, reminder: '19:00', goals: ['learn'] },
  { id: 'coding', category: 'learning', icon: 'code-tags', color: 'slate', type: 'timer', target: 30, schedule: { kind: 'perWeek', times: 4 }, reminder: '20:00', goals: ['learn', 'productive'] },
  { id: 'learn-new', category: 'learning', icon: 'lightbulb-on-outline', color: 'yellow', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '20:30', goals: ['learn'] },
  { id: 'no-smoking', category: 'quit', icon: 'smoking-off', color: 'red', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '09:00', goals: ['quit', 'healthier'] },
  { id: 'no-alcohol', category: 'quit', icon: 'glass-cocktail-off', color: 'rose', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '18:00', goals: ['quit', 'healthier'] },
  { id: 'no-sugar', category: 'quit', icon: 'candy-off-outline', color: 'pink', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '15:00', goals: ['quit', 'healthier'] },
  { id: 'no-late-coffee', category: 'quit', icon: 'coffee-off-outline', color: 'orange', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '13:30', goals: ['quit', 'sleep'] },
  { id: 'no-doomscroll', category: 'quit', icon: 'cellphone-off', color: 'slate', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '21:00', goals: ['quit', 'mind'] },
  { id: 'no-impulse-buys', category: 'quit', icon: 'cart-off', color: 'teal', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '20:00', goals: ['quit'] },
  { id: 'no-junk-food', category: 'quit', icon: 'food-off-outline', color: 'lime', type: 'boolean', target: 1, schedule: { kind: 'daily' }, reminder: '12:00', goals: ['quit', 'healthier'] },
];

export const templateById = (id: string): Template | undefined => templates.find((t) => t.id === id);

/** Templates for a category, in library order. */
export const templatesIn = (category: CategoryId): Template[] => templates.filter((t) => t.category === category);
