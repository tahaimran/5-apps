import './mocks';
import '@/bootstrap';
import { resetSounds } from '@/audio/sounds';
import { setBankForTests } from '@/content/bank';
import { dateKeyFor } from '@/domain/dateKey';
import { defaultAdCounters, defaultDaily, defaultProfile, defaultReview, defaultSettings, defaultStats, defaultStreak } from '@/domain/defaults';
import { resetDisk, resetNotifMock } from './mocks';
import { useRound } from '@/store/round';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useAdCounters, useClassic, useDaily, useProfile, useReview, useSeen, useStats, useStreak } from '@/store/stores';

/** Back to a fresh install between tests: the fake disk and every store, with the real question bank. */
export function resetApp(now: Date = new Date()) {
  resetDisk();
  setBankForTests(null);
  useSettings.setState({ settings: defaultSettings });
  useProfile.setState({ value: defaultProfile(now.getTime()) });
  useClassic.setState({ value: {} });
  useSeen.setState({ value: {} });
  useDaily.setState({ value: defaultDaily() });
  useStreak.setState({ value: defaultStreak() });
  useStats.setState({ value: defaultStats(now.getTime()) });
  useAdCounters.setState({ value: defaultAdCounters() });
  useReview.setState({ value: defaultReview() });
  useRound.setState({ sessionId: null, state: null, committed: false, startedAt: 0 });
  useResult.setState({ last: null });
  useToday.setState({ today: dateKeyFor(now) });
  resetNotifMock();
  resetSounds();
}
