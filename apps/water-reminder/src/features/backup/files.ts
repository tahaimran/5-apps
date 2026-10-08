import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { t } from '@shared/i18n';
import { backupFileName, buildBackup, parseBackup, type ParseResult } from '@/domain/backup';
import { dayKeyFor } from '@/domain/dayKey';
import type { BackupFile, LogEntry } from '@/domain/types';
import { migrations, SCHEMA_VERSION } from '@/store/migrations';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';

/** Every month shard on disk, not just the ones read so far. */
function allLogs(): Record<string, LogEntry[]> {
  const logs: Record<string, LogEntry[]> = {};
  for (const key of db.keys()) {
    if (!key.startsWith('logs:')) continue;
    const list = db.get(key as `logs:${string}`);
    if (list) logs[key.slice('logs:'.length)] = list;
  }
  return logs;
}

export function currentBackup(now = new Date()): BackupFile {
  const s = useSettings.getState();
  const w = useWater.getState();
  return buildBackup(
    { profile: s.profile, goal: s.goal, reminders: s.reminders, cups: s.cups, beverages: s.beverages, prefs: s.prefs, logs: allLogs(), daySummaries: w.summaries, progress: w.progress },
    now,
    SCHEMA_VERSION,
  );
}

/** Writes the backup JSON to the cache folder and opens the share sheet. */
export async function exportBackup(): Promise<void> {
  const now = new Date();
  const file = new File(Paths.cache, backupFileName(dayKeyFor(now, 0)));
  file.create({ overwrite: true });
  file.write(JSON.stringify(currentBackup(now), null, 2));
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
 * Replaces everything with the backup. A goal that is already reached in the file must not
 * trigger today's confetti, so today counts as celebrated; finished days are then closed into the
 * streak the way a normal morning would.
 */
export function restoreBackup(backup: BackupFile): void {
  const settings = useSettings.getState();
  settings.replaceAll({
    profile: backup.profile,
    goal: backup.goal,
    reminders: backup.reminders,
    cups: backup.cups,
    beverages: backup.beverages,
    prefs: backup.prefs,
  });
  useWater.getState().replaceAll({ logs: backup.logs, daySummaries: backup.daySummaries, progress: backup.progress });
  useToday.getState().refresh();
  const today = dayKeyFor(new Date(), backup.reminders.wakeMin);
  useToday.setState({ today });
  if (backup.daySummaries[today]?.reached) useSettings.getState().setPrefs({ celebratedDay: today });
  useWater.getState().closeDays(today);
}
