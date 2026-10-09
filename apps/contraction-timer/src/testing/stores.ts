import './mocks';
import { defaultMeta, defaultProfile, defaultSettings } from '@/domain/defaults';
import { dateKeyFor } from '@/domain/dateKey';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { resetDisk, resetNotifMock } from './mocks';

/** Back to a fresh install between tests (the fake disk and every store). */
export function resetApp(now: Date = new Date()) {
  resetDisk();
  useSettings.setState({ settings: defaultSettings });
  useProfile.setState({ profile: defaultProfile() });
  useMeta.setState({ meta: defaultMeta(now.getTime()) });
  useToday.setState({ today: dateKeyFor(now) });
  resetNotifMock();
}
