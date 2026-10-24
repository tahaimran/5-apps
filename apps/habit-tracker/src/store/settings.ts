import { create } from 'zustand';
import { setHapticsEnabled } from '@shared/theme';
import { setTimeFormatPreference } from '@shared/time/preference';
import { defaultSettings } from '@/domain/defaults';
import type { Settings } from '@/domain/types';
import { db } from './storage';

export { defaultSettings };

interface SettingsState {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  /** Replaces all settings (restore from backup). */
  replace: (settings: Settings) => void;
}

/** Zustand store persisted to MMKV key `settings`. */
export const useSettings = create<SettingsState>((set, get) => ({
  settings: { ...defaultSettings, ...db.get('settings') },
  replace: (settings) => {
    db.set('settings', settings);
    set({ settings });
  },
  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    db.set('settings', settings);
    set({ settings });
  },
}));

/** Shared pieces (the wheel TimeField, useHaptics) follow the clock style and haptics toggle chosen here. */
const share = ({ timeFormat, haptics }: Settings) => {
  setTimeFormatPreference(timeFormat);
  setHapticsEnabled(haptics);
};
share(useSettings.getState().settings);
useSettings.subscribe((s) => share(s.settings));
