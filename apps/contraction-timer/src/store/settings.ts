import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { defaultSettings } from '@/domain/defaults';
import { unitsForRegion } from '@/domain/weeks';
import type { Settings } from '@/domain/types';
import { db } from './storage';

interface SettingsState {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

/** Merges stored values over the defaults so a key added in a later version is never undefined. */
const load = (): Settings => {
  const stored = db.get('settings');
  // The first time, sizes follow the phone's region (US and UK: inches and pounds); the person can change it in Settings.
  const units = stored?.units ?? unitsForRegion(getLocales()[0]?.measurementSystem);
  return { ...defaultSettings, ...stored, units, kickReminder: { ...defaultSettings.kickReminder, ...stored?.kickReminder } };
};

/** Preferences (`ct.settings`). The theme mode lives in @shared/theme. */
export const useSettings = create<SettingsState>((set, get) => ({
  settings: load(),
  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    db.set('settings', settings);
    set({ settings });
  },
  reset: () => {
    db.remove('settings');
    set({ settings: load() });
  },
}));
