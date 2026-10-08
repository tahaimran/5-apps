import { create } from 'zustand';
import { defaultHints } from '@/domain/defaults';
import { grantCourtesy, grantReward, grantTutorialBonus, hintsAvailable, refreshWallet, spendHint } from '@/domain/hints';
import type { DateKey, HintWallet } from '@/domain/types';
import { currentDateKey } from './today';
import { db } from './storage';

interface HintsState {
  wallet: HintWallet;
  /** The wallet for `today`: free hints are topped up if the day changed. */
  refresh: (today?: DateKey) => HintWallet;
  available: (today?: DateKey) => number;
  /** Spends one hint; false if there are none. */
  spend: (today?: DateKey) => boolean;
  /** +2 for a finished rewarded video. */
  reward: () => void;
  /** One courtesy hint a day when no video is available; false if today's was already given. */
  courtesy: (today?: DateKey) => boolean;
  tutorialBonus: () => void;
  reset: () => void;
}

const load = (): HintWallet => ({ ...defaultHints(currentDateKey()), ...db.get('hints') });

/** The hint wallet (`ws.hints`): 3 free hints a day plus up to 10 earned ones. */
export const useHints = create<HintsState>((set, get) => {
  const put = (wallet: HintWallet) => {
    db.set('hints', wallet);
    set({ wallet });
    return wallet;
  };
  return {
    wallet: load(),
    refresh: (today = currentDateKey()) => {
      const next = refreshWallet(get().wallet, today);
      return next === get().wallet ? next : put(next);
    },
    available: (today) => hintsAvailable(get().refresh(today)),
    spend: (today) => {
      const next = spendHint(get().refresh(today));
      if (!next) return false;
      put(next);
      return true;
    },
    reward: () => void put(grantReward(get().refresh())),
    courtesy: (today = currentDateKey()) => {
      const next = grantCourtesy(get().refresh(today), today);
      if (!next) return false;
      put(next);
      return true;
    },
    tutorialBonus: () => void put(grantTutorialBonus(get().refresh())),
    reset: () => {
      db.remove('hints');
      set({ wallet: defaultHints(currentDateKey()) });
    },
  };
});
