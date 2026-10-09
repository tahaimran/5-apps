import { create } from 'zustand';
import { defaultSettings } from '@/domain/defaults';
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
  return { ...defaultSettings, ...stored, reminder: { ...defaultSettings.reminder, ...stored?.reminder } };
};

/** Sound, haptics, text size, theme, relaxed mode and the reminder (`tq.settings`). */
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
