import { create } from 'zustand';
import { defaultAdState } from '@/domain/defaults';
import { dateKeyFor } from '@/domain/dateKey';
import type { AdScreen } from '@/domain/adRules';
import type { AdState } from '@/domain/types';
import { db } from './storage';

type FullScreenKind = 'interstitial' | 'rewarded' | 'appOpen';

interface AdsState {
  /** Frequency-cap memory that survives restarts (`ct.adState`). */
  state: AdState;
  /** In memory: when any full-screen ad last closed this launch. */
  lastFullScreenAt: number;
  /** In memory: the screen in front, reported by each screen. */
  screen: AdScreen;
  keyboardOpen: boolean;
  /** In memory: the app was opened by a notification or link at this time. */
  lastExternalOpenAt: number;
  /** In memory: a week article was closed at this time after being read this long. */
  articleClosedAt: number;
  articleReadMs: number;
  setScreen: (screen: AdScreen) => void;
  setKeyboard: (open: boolean) => void;
  markExternalOpen: () => void;
  recordArticleClose: (readMs: number, now?: number) => void;
  /** A full-screen ad was really shown and closed. */
  recordShown: (kind: FullScreenKind, now?: number) => void;
  /** Tests and "delete all data" never call this: the caps are not personal data and must survive a reset. */
  reset: () => void;
}

const load = (now: number): AdState => ({ ...defaultAdState(dateKeyFor(new Date(now))), ...db.get('adState') });

export const useAds = create<AdsState>((set, get) => {
  const save = (state: AdState) => {
    db.set('adState', state);
    set({ state });
  };
  return {
    state: load(Date.now()),
    lastFullScreenAt: 0,
    screen: 'other',
    keyboardOpen: false,
    lastExternalOpenAt: 0,
    articleClosedAt: 0,
    articleReadMs: 0,
    setScreen: (screen) => set({ screen }),
    setKeyboard: (keyboardOpen) => set({ keyboardOpen }),
    markExternalOpen: () => set({ lastExternalOpenAt: Date.now() }),
    recordArticleClose: (articleReadMs, now = Date.now()) => set({ articleClosedAt: now, articleReadMs }),
    recordShown: (kind, now = Date.now()) => {
      set({ lastFullScreenAt: now });
      const today = dateKeyFor(new Date(now));
      const s = get().state;
      const sameDay = s.day === today;
      if (kind === 'interstitial') save({ ...s, day: today, interstitialsToday: (sameDay ? s.interstitialsToday : 0) + 1, lastInterstitialAt: now });
      else if (kind === 'appOpen') save({ ...s, day: today, interstitialsToday: sameDay ? s.interstitialsToday : 0, lastAppOpenAt: now });
    },
    reset: () => {
      db.remove('adState');
      set({ state: defaultAdState(dateKeyFor(new Date())), lastFullScreenAt: 0, screen: 'other', keyboardOpen: false, lastExternalOpenAt: 0, articleClosedAt: 0, articleReadMs: 0 });
    },
  };
});
