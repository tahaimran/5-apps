import { File } from 'expo-file-system';
import { cancel } from '@shared/notify';
import { sharedStore } from '@shared/storage';
import { KICK_REMINDER_ID } from '@/notifications/kickReminder';
import { SESSION_OPEN_ID } from '@/notifications/sessionOpen';
import { WEEKLY_ID } from '@/notifications/weekly';
import { useChecklists } from '@/store/checklists';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useUnlocks } from '@/store/unlocks';

/**
 * "Delete all data" (plan §5.5): sessions, kick counts, due date, checklists, settings, unlocks, the onboarding flag and
 * every scheduled notification and cached PDF, and the saved colour choice. What stays is not about the person: the install
 * date and the ad frequency counters (so deleting cannot be used to get around the ad limits).
 */
export async function deleteAllData(): Promise<void> {
  useSessions.getState().reset();
  useKicks.getState().reset();
  useProfile.getState().reset();
  useSettings.getState().reset();
  useChecklists.getState().reset();
  useUnlocks.getState().reset();
  useMeta.getState().reset();
  for (const p of db.get('pdfCache') ?? []) {
    try {
      const file = new File(p.uri);
      if (file.exists) file.delete();
    } catch {
      // a file that cannot be removed is in the cache, which the phone clears itself
    }
  }
  for (const key of ['pdfCache', 'onboarding.resume', 'themeBeforeNight', 'handledResponse'] as const) db.remove(key);
  sharedStore.remove('onboarding.completedAt');
  sharedStore.remove('theme.mode');
  await Promise.all([KICK_REMINDER_ID, WEEKLY_ID, SESSION_OPEN_ID].map((id) => cancel(id).catch(() => undefined)));
}
