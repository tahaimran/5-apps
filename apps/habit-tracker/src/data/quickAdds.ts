import type { Habit } from '@/domain/types';

export type NewHabit = Pick<Habit, 'name' | 'icon' | 'color' | 'type' | 'target' | 'schedule' | 'category'> &
  Partial<Pick<Habit, 'unit' | 'templateId'>>;

/** The three starter habits offered in the empty state until the template library (day 3) lands. */
export const quickAdds: NewHabit[] = [
  {
    name: 'Drink water',
    icon: 'cup-water',
    color: '#0EA5E9',
    type: 'count',
    target: 8,
    unit: 'glasses',
    schedule: { kind: 'daily' },
    category: 'health',
    templateId: 'drink-water',
  },
  {
    name: 'Make my bed',
    icon: 'bed',
    color: '#7C5CFF',
    type: 'boolean',
    target: 1,
    schedule: { kind: 'daily' },
    category: 'productivity',
    templateId: 'make-bed',
  },
  {
    name: 'Take a walk',
    icon: 'walk',
    color: '#22C55E',
    type: 'boolean',
    target: 1,
    schedule: { kind: 'daily' },
    category: 'fitness',
    templateId: 'walk',
  },
];
