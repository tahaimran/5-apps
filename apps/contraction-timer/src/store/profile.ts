import { create } from 'zustand';
import { defaultProfile } from '@/domain/defaults';
import { eddFrom } from '@/domain/dueDate';
import type { DueInput } from '@/domain/dueDate';
import type { Profile } from '@/domain/types';
import { db } from './storage';

interface ProfileState {
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  /** Saves what the person entered and the due date worked out from it. */
  setDue: (input: DueInput) => void;
  clearDue: () => void;
  reset: () => void;
}

const load = (): Profile => ({ ...defaultProfile(), ...db.get('profile') });

/** Due date and answers from onboarding (`ct.profile`). */
export const useProfile = create<ProfileState>((set, get) => {
  const save = (profile: Profile) => {
    db.set('profile', profile);
    set({ profile });
  };
  return {
    profile: load(),
    update: (patch) => save({ ...get().profile, ...patch }),
    setDue: (input) =>
      save({
        ...get().profile,
        dateMode: input.mode,
        inputDate: input.date,
        cycleLength: input.mode === 'lmp' ? input.cycleLength : undefined,
        ivfEmbryoDay: input.mode === 'ivf' ? input.ivfEmbryoDay : undefined,
        edd: eddFrom(input),
      }),
    clearDue: () => {
      const { dateMode: _a, inputDate: _b, cycleLength: _c, ivfEmbryoDay: _d, edd: _e, ...rest } = get().profile;
      void [_a, _b, _c, _d, _e];
      save(rest);
    },
    reset: () => {
      db.remove('profile');
      set({ profile: defaultProfile() });
    },
  };
});
