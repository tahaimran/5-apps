import { PixelRatio } from 'react-native';
import { sharedStore } from '@shared/storage';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { resolveAnswers } from './answers';

/** Saves the setup choices; high contrast is a theme mode, the rest are settings. */
export function applyOnboardingAnswers(answers: Record<string, unknown>): void {
  const setup = resolveAnswers(answers, PixelRatio.getFontScale());
  useSettings.getState().update({ textSize: setup.textSize, difficulty: setup.difficulty });
  if (setup.highContrast) sharedStore.set('theme.mode', 'high-contrast');
}

export const clearOnboardingResume = () => db.remove('onboarding.resume');

/** The tutorial is done (finished or skipped): from now on the app opens on Home. */
export const markTutorialDone = () => db.set('onboarding.tutorialDone', true);
