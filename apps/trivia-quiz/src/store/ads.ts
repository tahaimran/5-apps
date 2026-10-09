import { create } from 'zustand';
import type { AdScreen } from '@/domain/adRules';
import { currentDateKey } from './today';
import { useAdCounters } from './stores';

type FullScreenKind = 'interstitial' | 'rewarded' | 'appOpen';

interface AdsState {
  /** In memory: when the last full-screen ad of any kind closed this session. */
  lastFullScreenAt: number;
  lastRewardedAt: number;
  /** In memory: the screen being shown, reported by each screen. */
  screen: AdScreen;
  lastExternalOpenAt: number;
  setScreen: (screen: AdScreen) => void;
  /** A notification tap, a link, or the share sheet just opened or closed. */
  markExternalOpen: () => void;
  /** A real round was finished (the warm-up does not count). */
  recordRound: () => void;
  /** A full-screen ad was really shown and closed. */
  recordShown: (kind: FullScreenKind, now?: number) => void;
  /** A lifeline video was earned (counts toward the 15 a day). */
  recordLifelineVideo: () => void;
  reset: () => void;
}

const sameDay = (d: { date: string; count: number }, today: string) => (d.date === today ? d.count : 0);

/** Frequency-cap state: persisted counters (`tq.ads`) plus the in-memory "what just happened" the rules read. */
export const useAds = create<AdsState>((set) => ({
  lastFullScreenAt: 0,
  lastRewardedAt: 0,
  screen: 'other',
  lastExternalOpenAt: 0,
  setScreen: (screen) => set({ screen }),
  markExternalOpen: () => set({ lastExternalOpenAt: Date.now() }),
  recordRound: () => {
    const c = useAdCounters.getState().value;
    useAdCounters.getState().set({ ...c, roundsSinceInterstitial: c.roundsSinceInterstitial + 1 });
  },
  recordShown: (kind, now = Date.now()) => {
    const store = useAdCounters.getState();
    const c = store.value;
    const today = currentDateKey();
    set({ lastFullScreenAt: now, ...(kind === 'rewarded' ? { lastRewardedAt: now } : {}) });
    if (kind === 'interstitial') {
      store.set({ ...c, roundsSinceInterstitial: 0, lastInterstitialAt: now, interstitialDay: { date: today, count: sameDay(c.interstitialDay, today) + 1 } });
    } else if (kind === 'appOpen') {
      store.set({ ...c, lastAppOpenAt: now });
    }
  },
  recordLifelineVideo: () => {
    const store = useAdCounters.getState();
    const today = currentDateKey();
    store.set({ ...store.value, rewardedDay: { date: today, count: sameDay(store.value.rewardedDay, today) + 1 } });
  },
  reset: () => {
    useAdCounters.getState().reset();
    set({ lastFullScreenAt: 0, lastRewardedAt: 0, lastExternalOpenAt: 0 });
  },
}));

export const lifelineVideosToday = (): number => sameDay(useAdCounters.getState().value.rewardedDay, currentDateKey());
export const interstitialsToday = (): number => sameDay(useAdCounters.getState().value.interstitialDay, currentDateKey());
