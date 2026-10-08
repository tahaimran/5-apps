import { defaultDaily, defaultHints, defaultSettings, defaultStats } from '@/domain/defaults';
import { dateKeyFor } from '@/domain/dateKey';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useProgress } from '@/store/progress';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { useStats } from '@/store/stats';
import { useToday } from '@/store/today';
import { resetDisk } from './mocks';

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
}
