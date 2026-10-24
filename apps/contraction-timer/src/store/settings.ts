import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { setSoundsEnabled } from '@shared/sound';
import { setHapticsEnabled } from '@shared/theme';
import { setTimeFormatPreference } from '@shared/time/preference';
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
/** Settings saved before the redesign had `clock24h: boolean`; only an explicit 24-hour choice is kept (12-hour was the default). */
type Legacy = Partial<Settings> & { clock24h?: boolean };

const load = (): Settings => {
  const { clock24h, ...stored } = (db.get('settings') ?? {}) as Legacy;
  if (clock24h === true && stored.timeFormat === undefined) stored.timeFormat = '24h';
  // The first time, sizes follow the phone's region (US and UK: inches and pounds); the person can change it in Settings.
  const units = stored?.units ?? unitsForRegion(getLocales()[0]?.measurementSystem);
  return { ...defaultSettings, ...stored, units, kickReminder: { ...defaultSettings.kickReminder, ...stored.kickReminder } };
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

/** Shared pieces (sounds, useHaptics, the wheel TimeField, every formatted time) follow the choices made here. */
const share = ({ sounds, haptics, timeFormat }: Settings) => {
  setSoundsEnabled(sounds);
  setHapticsEnabled(haptics);
  setTimeFormatPreference(timeFormat);
};
share(useSettings.getState().settings);
useSettings.subscribe((s) => share(s.settings));
