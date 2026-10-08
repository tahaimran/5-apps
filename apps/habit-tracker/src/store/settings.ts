import { create } from 'zustand';
import type { Settings } from '@/domain/types';
import { db } from './storage';

export const defaultSettings: Settings = {
  theme: 'system',
  weekStartsOn: 1,
  dayEndsAtHour: 0,
  haptics: true,
  dailySummary: { enabled: false, time: '08:00' },
  eveningNudge: { enabled: true, time: '20:30' },
};

interface SettingsState {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

/** Zustand store persisted to MMKV key `settings`. */
export const useSettings = create<SettingsState>((set, get) => ({
  settings: { ...defaultSettings, ...db.get('settings') },
  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    db.set('settings', settings);
    set({ settings });
  },
}));
