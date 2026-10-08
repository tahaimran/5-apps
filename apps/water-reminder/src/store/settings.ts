import { create } from 'zustand';
import { defaultBeverages } from '@/domain/hydration';
import { defaultCups, defaultGoal, defaultPrefs, defaultProfile, defaultReminders } from '@/domain/defaults';
import type { BeverageFactor, Cup, GoalSettings, Prefs, Profile, ReminderSettings } from '@/domain/types';
import { db } from './storage';

interface Snapshot {
  profile: Profile;
  goal: GoalSettings;
  reminders: ReminderSettings;
  cups: Cup[];
  beverages: BeverageFactor[];
  prefs: Prefs;
}

interface SettingsState extends Snapshot {
  setProfile: (patch: Partial<Profile>) => void;
  setGoal: (patch: Partial<GoalSettings>) => void;
  setReminders: (patch: Partial<ReminderSettings>) => void;
  setCups: (cups: Cup[]) => void;
  setBeverages: (beverages: BeverageFactor[]) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  /** Replaces everything (restore from a backup). */
  replaceAll: (snapshot: Snapshot) => void;
}

/** Merges stored values over the defaults so a key added in a later version is never undefined. */
const load = (): Snapshot => ({
  profile: { ...defaultProfile, ...db.get('profile') },
  goal: { ...defaultGoal(), ...db.get('goal') },
  reminders: { ...defaultReminders, ...db.get('reminders') },
  cups: db.get('cups') ?? defaultCups,
  beverages: defaultBeverages.map((b) => db.get('beverages')?.find((s) => s.id === b.id) ?? b),
  prefs: { ...defaultPrefs, ...db.get('prefs') },
});

/** Everything the user can set: profile, goal, reminders, cups, beverage factors and preferences (MMKV-backed). */
export const useSettings = create<SettingsState>((set, get) => ({
  ...load(),
  setProfile: (patch) => {
    const profile = { ...get().profile, ...patch };
    db.set('profile', profile);
    set({ profile });
  },
  setGoal: (patch) => {
    const goal = { ...get().goal, ...patch, updatedAt: Date.now() };
    db.set('goal', goal);
    set({ goal });
  },
  setReminders: (patch) => {
    const reminders = { ...get().reminders, ...patch };
    db.set('reminders', reminders);
    set({ reminders });
  },
  setCups: (cups) => {
    db.set('cups', cups);
    set({ cups });
  },
  setBeverages: (beverages) => {
    db.set('beverages', beverages);
    set({ beverages });
  },
  setPrefs: (patch) => {
    const prefs = { ...get().prefs, ...patch };
    db.set('prefs', prefs);
    set({ prefs });
  },
  replaceAll: (snapshot) => {
    db.set('profile', snapshot.profile);
    db.set('goal', snapshot.goal);
    db.set('reminders', snapshot.reminders);
    db.set('cups', snapshot.cups);
    db.set('beverages', snapshot.beverages);
    db.set('prefs', snapshot.prefs);
    set(snapshot);
  },
}));

/** The cup behind the "+250 ml" notification button; falls back to the first cup. */
export function preferredCup(s: Pick<Snapshot, 'cups' | 'prefs'>): Cup {
  return s.cups.find((c) => c.id === s.prefs.preferredCupId) ?? s.cups[0] ?? defaultCups[1];
}
