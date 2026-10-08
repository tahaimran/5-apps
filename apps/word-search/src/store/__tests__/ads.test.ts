import { resetApp } from '@/testing/stores';
import { useAds } from '../ads';
import { db } from '../storage';

beforeEach(() => resetApp());

describe('ad counters (`ws.ads`)', () => {
  it('counts finished puzzles and resets the count when an interstitial was shown', () => {
    const ads = useAds.getState();
    ads.recordPuzzle();
    ads.recordPuzzle();
    ads.recordPuzzle();
    expect(useAds.getState().counters.levelsSinceInterstitial).toBe(3);
    expect(db.get('ads')?.levelsSinceInterstitial).toBe(3);
    useAds.getState().recordShown('interstitial', 1_000_000);
    const c = useAds.getState().counters;
    expect(c).toMatchObject({ levelsSinceInterstitial: 0, lastInterstitialAt: 1_000_000, interstitialTimes: [1_000_000] });
    expect(useAds.getState().lastFullScreenAt).toBe(1_000_000);
  });
  it('keeps only the last hour of interstitial times', () => {
    const base = 10_000_000;
    useAds.getState().recordShown('interstitial', base);
    useAds.getState().recordShown('interstitial', base + 30 * 60_000);
    useAds.getState().recordShown('interstitial', base + 70 * 60_000);
    expect(useAds.getState().counters.interstitialTimes).toEqual([base + 30 * 60_000, base + 70 * 60_000]);
  });
  it('remembers the last app-open ad and rewarded ad separately', () => {
    useAds.getState().recordShown('appOpen', 5_000);
    expect(useAds.getState().counters.lastAppOpenAt).toBe(5_000);
    expect(useAds.getState().counters.levelsSinceInterstitial).toBe(0);
    useAds.getState().recordShown('rewarded', 9_000);
    expect(useAds.getState().lastRewardedAt).toBe(9_000);
    expect(useAds.getState().lastFullScreenAt).toBe(9_000);
    expect(useAds.getState().counters.lastAppOpenAt).toBe(5_000);
  });
  it('tracks the screen and external opens in memory only, and resets', () => {
    useAds.getState().setScreen('home');
    useAds.getState().markExternalOpen();
    expect(useAds.getState().screen).toBe('home');
    expect(useAds.getState().lastExternalOpenAt).toBeGreaterThan(0);
    useAds.getState().recordPuzzle();
    useAds.getState().reset();
    expect(useAds.getState().counters.levelsSinceInterstitial).toBe(0);
    expect(db.get('ads')).toBeUndefined();
  });
});
