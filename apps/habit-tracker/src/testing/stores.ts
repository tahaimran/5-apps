import { emptyFreezes } from '@/domain/freezes';
import { defaultSettings } from '@/domain/defaults';
import { useCelebration } from '@/store/celebrations';
import { useHabits } from '@/store/habits';
import { useNotes } from '@/store/notes';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { resetDisk } from './mocks';

/** Back to a fresh install between tests (the fake disk and every store). */
export function resetApp() {
  resetDisk();
  useHabits.setState({ habits: {}, habitOrder: [], entries: {}, freezes: emptyFreezes });
  useNotes.setState({ notes: {} });
  useSettings.setState({ settings: defaultSettings });
  useCelebration.setState({ current: null });
  useProfile.setState({
    profile: { goals: [], onboardingDone: false, firstOpenAt: Date.now(), openDays: [], notifPermission: 'unknown', notifReasked: false, review: { prompted: false } },
  });
}
