import './mocks';
import { defaultDaily, defaultHints, defaultSettings, defaultStats } from '@/domain/defaults';
import { dateKeyFor } from '@/domain/dateKey';
import { defaultAdCounters } from '@/domain/defaults';
import { useAds } from '@/store/ads';
import { defaultReminderPrompt, defaultReview } from '@/domain/defaults';
import { useDaily } from '@/store/daily';
import { useReminderPrompt } from '@/store/reminder';
import { useReview } from '@/store/review';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useProgress } from '@/store/progress';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { useStats } from '@/store/stats';
import { useToday } from '@/store/today';
import { resetSounds } from '@/audio/sounds';
import { resetDisk, resetNotifMock } from './mocks';

/** Back to a fresh install between tests (the fake disk and every store). */
export function resetApp(now: Date = new Date()) {
  resetDisk();
  const today = dateKeyFor(now);
  useSettings.setState({ settings: defaultSettings });
  useProgress.setState({ packs: {} });
  useStats.setState({ stats: defaultStats() });
  useGame.setState({ current: null, activeSince: null });
  useResult.setState({ last: null });
  useDaily.setState({ daily: defaultDaily() });
  useHints.setState({ wallet: defaultHints(today) });
  useToday.setState({ today });
  useReminderPrompt.setState({ prompt: defaultReminderPrompt() });
  useReview.setState({ review: defaultReview() });
  resetNotifMock();
  resetSounds();
  useAds.setState({ counters: defaultAdCounters(), lastFullScreenAt: 0, lastRewardedAt: 0, screen: 'other', lastExternalOpenAt: 0 });
}
