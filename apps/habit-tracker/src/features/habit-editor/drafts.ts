import { t } from '@shared/i18n';
import type { Template } from '@/data/templates';
import { normalizeDraft, type HabitDraft } from '@/domain/validate';
import type { DayKey, Habit } from '@/domain/types';
import { habitColors } from '@/theme/tokens';

export const blankDraft = (today: DayKey): HabitDraft => ({
  name: '',
  icon: 'star-outline',
  color: habitColors.violet,
  type: 'boolean',
  target: 1,
  schedule: { kind: 'daily' },
  category: 'other',
  createdAt: today,
  reminderTime: null,
});

export function draftFromTemplate(template: Template, today: DayKey): HabitDraft {
  return normalizeDraft({
    name: t(`templates.${template.id}.name`),
    icon: template.icon,
    color: habitColors[template.color],
    type: template.type,
    target: template.target,
    unit: template.hasUnit ? t(`templates.${template.id}.unit`) : undefined,
    schedule: template.schedule,
    category: template.category,
    createdAt: today,
    templateId: template.id,
    reminderTime: template.reminder,
  });
}

export const draftFromHabit = (h: Habit): HabitDraft => ({
  name: h.name,
  icon: h.icon,
  color: h.color,
  type: h.type,
  target: h.target,
  unit: h.unit,
  schedule: h.schedule,
  category: h.category,
  createdAt: h.createdAt,
  templateId: h.templateId,
  reminderTime: h.reminders[0]?.time ?? null,
});

/** Keeps existing notification ids when the reminder time did not change. */
export function applyDraft(habit: Habit | undefined, draft: HabitDraft, id: string): Habit {
  const d = normalizeDraft(draft);
  const prev = habit?.reminders[0];
  const reminders = d.reminderTime
    ? [{ time: d.reminderTime, notifIds: prev && prev.time === d.reminderTime ? prev.notifIds : [] }]
    : [];
  return {
    ...habit,
    id,
    name: d.name,
    icon: d.icon,
    color: d.color,
    type: d.type,
    target: d.target,
    unit: d.unit,
    schedule: d.schedule,
    category: d.category,
    createdAt: d.createdAt,
    templateId: d.templateId,
    reminders,
  };
}
