import { addDays, dayKeyFor } from '@/domain/dayKey';
import { defaultBeverages } from '@/domain/hydration';
import { defaultCups, defaultGoal, defaultMeta, defaultPrefs, defaultProfile, defaultProgress, defaultReminders } from '@/domain/defaults';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';
import { resetDisk } from './mocks';

/** Back to a fresh install between tests (the fake disk and every store). */
export function resetApp(now: Date = new Date()) {
  resetDisk();
  useSettings.setState({
    profile: defaultProfile,
    goal: defaultGoal(now.getTime()),
    reminders: defaultReminders,
    cups: defaultCups,
    beverages: defaultBeverages,
    prefs: defaultPrefs,
  });
  const today = dayKeyFor(now, defaultReminders.wakeMin);
  useWater.setState({ summaries: {}, months: {}, freezeNotice: 0, progress: defaultProgress(addDays(today, -1)) });
  useMeta.setState({ meta: defaultMeta(now.getTime()) });
  useToday.setState({ today });
}
