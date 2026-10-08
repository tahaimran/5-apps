import { create } from 'zustand';
import type { DayKey, Profile } from '@/domain/types';
import { db } from './storage';

const OPEN_DAYS_CAP = 60;

const initial = (): Profile => ({
  goals: [],
  onboardingDone: false,
  firstOpenAt: Date.now(),
  openDays: [],
  notifPermission: 'unknown',
  notifReasked: false,
  review: { prompted: false },
  ...db.get('profile'),
});

interface ProfileState {
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  /** Remembers that the app was opened on `day` (distinct days, newest 60). */
  recordOpen: (day: DayKey) => void;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: initial(),
  update: (patch) => {
    const profile = { ...get().profile, ...patch };
    db.set('profile', profile);
    set({ profile });
  },
  recordOpen: (day) => {
    const { openDays } = get().profile;
    if (openDays.includes(day)) return;
    get().update({ openDays: [...openDays, day].slice(-OPEN_DAYS_CAP) });
  },
}));
