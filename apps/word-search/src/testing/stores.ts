import { defaultSettings } from '@/domain/defaults';
import { useSettings } from '@/store/settings';
import { resetDisk } from './mocks';

/** Back to a fresh install between tests (the fake disk and every store). */
export function resetApp() {
  resetDisk();
  useSettings.setState({ settings: defaultSettings });
}
