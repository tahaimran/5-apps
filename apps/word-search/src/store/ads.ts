import { create } from 'zustand';
import type { AdScreen } from '@/domain/adRules';
import { defaultAdCounters } from '@/domain/defaults';
import type { AdCounters } from '@/domain/types';
import { db } from './storage';

type FullScreenKind = 'interstitial' | 'rewarded' | 'appOpen';

const HOUR_MS = 60 * 60_000;

interface AdsState {
  /** Frequency-cap state that survives restarts (`ws.ads`). */
  counters: AdCounters;
  /** In memory: when the last full-screen ad of any kind closed this session. */
  lastFullScreenAt: number;
  lastRewardedAt: number;
  /** In memory: the screen being shown, reported by each screen. */
  screen: AdScreen;
  lastExternalOpenAt: number;
  setScreen: (screen: AdScreen) => void;
  markExternalOpen: () => void;
  /** A real puzzle was finished (not the tutorial). */
  recordPuzzle: () => void;
  /** A full-screen ad was really shown and closed. */
  recordShown: (kind: FullScreenKind, now?: number) => void;
  reset: () => void;
}

const load = (): AdCounters => ({ ...defaultAdCounters(), ...db.get('ads') });

export const useAds = create<AdsState>((set, get) => {
  const save = (counters: AdCounters) => {
    db.set('ads', counters);
    set({ counters });
  };
  return {
    counters: load(),
    lastFullScreenAt: 0,
    lastRewardedAt: 0,
    screen: 'other',
    lastExternalOpenAt: 0,
    setScreen: (screen) => set({ screen }),
    markExternalOpen: () => set({ lastExternalOpenAt: Date.now() }),
    recordPuzzle: () => save({ ...get().counters, levelsSinceInterstitial: get().counters.levelsSinceInterstitial + 1 }),
    recordShown: (kind, now = Date.now()) => {
      const c = get().counters;
      set({ lastFullScreenAt: now, ...(kind === 'rewarded' ? { lastRewardedAt: now } : {}) });
      if (kind === 'interstitial') {
        save({ ...c, levelsSinceInterstitial: 0, lastInterstitialAt: now, interstitialTimes: [...c.interstitialTimes.filter((t) => now - t < HOUR_MS), now] });
      } else if (kind === 'appOpen') {
        save({ ...c, lastAppOpenAt: now });
      }
    },
    reset: () => {
      db.remove('ads');
      set({ counters: defaultAdCounters(), lastFullScreenAt: 0, lastRewardedAt: 0, lastExternalOpenAt: 0 });
    },
  };
});
