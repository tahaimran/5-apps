import type { CategoryId } from './types';

export interface Category {
  id: CategoryId;
  icon: string; // MaterialCommunityIcons name
}

/** Built-in categories (labels live under `categories.<id>` in en.json). */
export const categories: Category[] = [
  { id: 'health', icon: 'heart-pulse' },
  { id: 'fitness', icon: 'dumbbell' },
  { id: 'mind', icon: 'meditation' },
  { id: 'productivity', icon: 'check-circle-outline' },
  { id: 'learning', icon: 'school-outline' },
  { id: 'quit', icon: 'cancel' },
  { id: 'other', icon: 'dots-horizontal-circle-outline' },
];

export const categoryIds = categories.map((c) => c.id);
