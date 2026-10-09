import type { AdState, Meta, PatternRule, Profile, RulePreset, Settings, Unlocks } from './types';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Plan §8.2 presets: interval in minutes, length in seconds, held for minutes. */
export const RULE_PRESETS: Record<Exclude<RulePreset, 'custom'>, PatternRule> = {
  '511': { preset: '511', intervalMaxMin: 5, durationMinSec: 60, sustainMin: 60 },
  '411': { preset: '411', intervalMaxMin: 4, durationMinSec: 60, sustainMin: 60 },
  '311': { preset: '311', intervalMaxMin: 3, durationMinSec: 60, sustainMin: 60 },
};

/** Ranges allowed for a custom rule (plan §8.2): 2–10 min, 30–90 s, 30–120 min. */
export const CUSTOM_LIMITS = {
  intervalMaxMin: { min: 2, max: 10 },
  durationMinSec: { min: 30, max: 90 },
  sustainMin: { min: 30, max: 120 },
} as const;

export const KICK_TARGET_LIMITS = { min: 5, max: 20, default: 10 } as const;

export const defaultSettings: Settings = {
  rule: RULE_PRESETS['511'],
  patternAlerts: true,
  partnerMode: false,
  haptics: true,
  clock24h: false,
  kickTarget: KICK_TARGET_LIMITS.default,
  // Plan §6 screen 5: 8:00 PM.
  kickReminder: { enabled: false, hour: 20, minute: 0 },
  weeklyCardNotif: true,
  ongoingNotif: false,
};

export const defaultProfile = (): Profile => ({ needs: [] });
export const defaultUnlocks = (): Unlocks => ({ pdfThemes: [], checklistTemplates: [] });
export const defaultAdState = (day: string): AdState => ({ interstitialsToday: 0, day });
export const defaultMeta = (now: number = Date.now()): Meta => ({ ratingPromptCount: 0, positiveMoments: 0, installAt: now, launches: 0 });
