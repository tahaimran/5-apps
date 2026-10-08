import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { t } from '@shared/i18n';
import { backupFileName, buildBackup, parseBackup, type ParseResult } from '@/domain/backup';
import { dayKeyFor } from '@/domain/dayKey';
import { MILESTONES } from '@/domain/celebrations';
import { computeStreaks } from '@/domain/streaks';
import { useHabits } from '@/store/habits';
import { useNotes } from '@/store/notes';
import { migrations, SCHEMA_VERSION } from '@/store/migrations';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import type { BackupFile } from '@/domain/types';

/** Writes the backup JSON to the cache folder and opens the share sheet. */
export async function exportBackup(): Promise<void> {
  const { habits, habitOrder, entries, freezes } = useHabits.getState();
  const settings = useSettings.getState().settings;
  const now = new Date();
  const backup = buildBackup({ habits, habitOrder, entries, freezes, notes: useNotes.getState().notes, settings }, now, SCHEMA_VERSION);
  const file = new File(Paths.cache, backupFileName(dayKeyFor(now, 0)));
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: t('backup.shareTitle') });
}

export type PickResult = { kind: 'canceled' } | ({ kind: 'parsed' } & ParseResult) | { kind: 'unreadable' };

/** Lets the user pick a file and checks it. Nothing is changed until `restoreBackup`. */
export async function pickBackup(): Promise<PickResult> {
  try {
    const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', 'application/octet-stream'] });
    if (picked.canceled) return { kind: 'canceled' };
    const text = await picked.result.text();
    return { kind: 'parsed', ...parseBackup(text, SCHEMA_VERSION, migrations) };
  } catch {
    return { kind: 'unreadable' };
  }
}

/**
 * Replaces everything with the backup. What the backup already contains must not trigger
 * "first check-in" or milestone confetti, so those are marked as celebrated first.
 */
export function restoreBackup(backup: BackupFile): void {
  useHabits.getState().replaceAll(backup);
  useNotes.getState().replaceAll(backup.notes);
  useSettings.getState().replace(backup.settings);

  const { dayEndsAtHour, weekStartsOn } = useSettings.getState().settings;
  const today = dayKeyFor(new Date(), dayEndsAtHour);
  const milestones: Record<string, number> = {};
  for (const habit of backup.habits) {
    if (habit.archivedAt) continue;
    const current = computeStreaks(habit, backup.entries[habit.id] ?? {}, today, weekStartsOn).current;
    const reached = MILESTONES.filter((m) => m <= current).pop();
    if (reached) milestones[habit.id] = reached;
  }
  db.set('celebrated', { first: true, perfectDay: today, milestones });
}
