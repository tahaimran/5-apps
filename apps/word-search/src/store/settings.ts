import { create } from 'zustand';
import { setSoundsEnabled } from '@shared/sound';
import { setHapticsEnabled } from '@shared/theme';
import { setTimeFormatPreference } from '@shared/time/preference';
import { defaultSettings } from '@/domain/defaults';
import type { Settings } from '@/domain/types';
import { db } from './storage';

interface SettingsState {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  /** Back to the defaults (Reset progress). */
  reset: () => void;
}

/** Merges stored values over the defaults so a key added in a later version is never undefined. */
const load = (): Settings => {
  const stored = db.get('settings');
  return { ...defaultSettings, ...stored, reminder: { ...defaultSettings.reminder, ...stored?.reminder } };
};

/** Display and play preferences (`ws.settings`). The theme mode lives in @shared/theme. */
export const useSettings = create<SettingsState>((set, get) => ({
  settings: load(),
  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    db.set('settings', settings);
    set({ settings });
  },
  reset: () => {
    db.remove('settings');
    set({ settings: defaultSettings });
  },
}));

/** Shared pieces (sounds, haptics, the wheel TimeField, every formatted time) follow the choices made here. */
const share = ({ sounds, haptics, timeFormat }: Settings) => {
  setSoundsEnabled(sounds);
  setHapticsEnabled(haptics);
  setTimeFormatPreference(timeFormat);
};
share(useSettings.getState().settings);
useSettings.subscribe((s) => share(s.settings));
