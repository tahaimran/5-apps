import { defaultSettings } from '@/domain/defaults';
import { useGame } from '@/store/game';
import { useProgress } from '@/store/progress';
import { useResult } from '@/store/result';
import { useSettings } from '@/store/settings';
import { useStats } from '@/store/stats';
import { defaultStats } from '@/domain/defaults';
import { resetDisk } from './mocks';

/** Back to a fresh install between tests (the fake disk and every store). */
export function resetApp() {
  resetDisk();
  useSettings.setState({ settings: defaultSettings });
  useProgress.setState({ packs: {} });
  useStats.setState({ stats: defaultStats() });
  useGame.setState({ current: null, activeSince: null });
  useResult.setState({ last: null });
}
