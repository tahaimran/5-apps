import type { Difficulty, TextSize } from '@/domain/types';

/** What the setup steps collect (keys of the shared flow's answers). */
export interface OnboardingAnswers {
  display?: { textSize: TextSize; highContrast: boolean };
  level?: Difficulty;
}

export interface ResolvedSetup {
  textSize: TextSize;
  highContrast: boolean;
  difficulty: Difficulty;
}

/** Plan §6 defaults: Large text and Easy, which is also what Skip applies. */
export const SETUP_DEFAULTS: ResolvedSetup = { textSize: 'large', highContrast: false, difficulty: 'easy' };

/** The text size to preselect: one step up when the phone's own font size is already at 1.3x or more. */
export const defaultTextSize = (systemFontScale: number): TextSize => (systemFontScale >= 1.3 ? 'xlarge' : 'large');

/**
 * Turns the collected answers into settings. A skipped step keeps its default (the text-size default
 * still honors the system font scale), so Skip means "Large text and Easy" on a phone with normal text.
 */
export function resolveAnswers(answers: Record<string, unknown>, systemFontScale: number): ResolvedSetup {
  const a = answers as OnboardingAnswers;
  return {
    textSize: a.display?.textSize ?? defaultTextSize(systemFontScale),
    highContrast: a.display?.highContrast ?? SETUP_DEFAULTS.highContrast,
    difficulty: a.level ?? SETUP_DEFAULTS.difficulty,
  };
}
