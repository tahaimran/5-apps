import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import MobileAds, {
  BannerAd,
  BannerAdSize,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
  useNativeAd,
} from 'react-native-google-mobile-ads';
import { getCanRequestAds, initConsent, onConsentChange } from '../consent';
import { HouseAdCard, type PromoAppId } from '../crosspromo';
import { t } from '../i18n';
import { useTheme } from '../theme';
import { maybeShowAppOpen, preloadAll } from './fullscreen';
import { defaultAdPolicy, type AdPolicy, type AdUnits } from './policy';
import {
  adsAvailable,
  adsState,
  beginSession,
  getAdsVersion,
  guardAllows,
  notifyAds,
  subscribeAds,
  unitIdFor,
} from './state';

export { defaultAdPolicy, type AdPolicy, type AdUnits, type AdUnitConfig, type AdFormat } from './policy';
export { showInterstitial, showRewarded, isRewardedReady } from './fullscreen';

async function startSdk(): Promise<void> {
  if (adsState.ready || !getCanRequestAds() || !adsState.policy.adsEnabled) return;
  await MobileAds().setRequestConfiguration({
    maxAdContentRating: adsState.policy.maxAdContentRating,
    testDeviceIdentifiers: adsState.policy.testDeviceIds,
  });
  await MobileAds().initialize();
  adsState.ready = true;
  preloadAll();
  notifyAds();
}

let started = false;

/**
 * Call once at app start. Runs consent (UMP) first, then initializes the Mobile Ads SDK and
 * preloads full-screen ads. Ads stay off until consent allows requests; if the user changes
 * their choice later in "Privacy choices" the SDK starts then.
 */
export async function initAds(policy: Partial<AdPolicy>, units: AdUnits): Promise<void> {
  adsState.policy = { ...defaultAdPolicy, ...policy };
  adsState.units = units;
  if (!started) {
    started = true;
    beginSession();
    onConsentChange(() => {
      startSdk().catch(() => undefined);
    });
  }
  await initConsent();
  await startSdk();
}

/** App-level veto, e.g. `setAdGuard(() => !isSessionActive())` for the contraction timer. */
export function setAdGuard(fn: ((placement: string) => boolean) | null): void {
  adsState.guard = fn;
  notifyAds();
}

function useAdsVersion() {
  return useSyncExternalStore(subscribeAds, getAdsVersion);
}

/**
 * Warm-start app-open ads. Shows when the app returns from the background after
 * `appOpenMinBackgroundMs`, never on cold start. `canShow` lets the app veto (e.g. opened from a
 * notification action, or an active task).
 */
export function useAppOpenAd(canShow: () => boolean): void {
  const canShowRef = useRef(canShow);
  canShowRef.current = canShow;
  useEffect(() => {
    let backgroundedAt: number | null = null;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        backgroundedAt = Date.now();
      } else if (next === 'active' && backgroundedAt !== null) {
        const away = Date.now() - backgroundedAt;
        backgroundedAt = null;
        if (away >= adsState.policy.appOpenMinBackgroundMs && canShowRef.current()) {
          maybeShowAppOpen().catch(() => undefined);
        }
      }
    });
    return () => sub.remove();
  }, []);
}

/** Adaptive anchored banner. Renders nothing if ads are off, vetoed, unconfigured or unfilled. */
export function AdBanner({ placement }: { placement: string }) {
  useAdsVersion();
  const [failed, setFailed] = useState(false);
  const unitId = unitIdFor(placement, 'banner');
  if (!adsAvailable() || !unitId || failed || !guardAllows(placement)) return null;
  return (
    <View style={styles.banner} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        maxHeight={60}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

function NativeAdLoaded({ placement, currentApp }: { placement: string; currentApp?: PromoAppId }) {
  const { colors, spacing, radius, type } = useTheme();
  const unitId = unitIdFor(placement, 'native');
  const result = useNativeAd({ adUnitId: unitId });
  if (result.status === 'no-fill' || result.status === 'error') return <HouseAdCard currentApp={currentApp} />;
  if (result.status !== 'loaded') return null;
  const ad = result.nativeAd;
  return (
    <NativeAdView
      nativeAd={ad}
      style={[
        styles.native,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: colors.accent, borderRadius: radius.sm }]}>
        <Text style={[styles.badgeText, { color: colors.background }]}>{t('shared.ads.badge')}</Text>
      </View>
      <NativeAsset assetType={NativeAssetType.HEADLINE}>
        <Text style={[type.title, { color: colors.text, marginTop: spacing.sm }]}>{ad.headline}</Text>
      </NativeAsset>
      <NativeMediaView style={styles.media} resizeMode="cover" />
      <NativeAsset assetType={NativeAssetType.BODY}>
        <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.sm }]}>{ad.body}</Text>
      </NativeAsset>
      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <Text
          style={[
            type.body,
            styles.cta,
            { backgroundColor: colors.primary, color: colors.onPrimary, borderRadius: radius.pill, marginTop: spacing.md },
          ]}
        >
          {ad.callToAction}
        </Text>
      </NativeAsset>
    </NativeAdView>
  );
}

export interface NativeAdCardProps {
  placement: string;
  /** Overrides `setCurrentApp` for the house-ad fallback. */
  currentApp?: PromoAppId;
}

/**
 * Native ad styled as a card with an "Ad" badge and distinct background. Use at most one per
 * screen. Falls back to a house ad (`<HouseAdCard>`) when the native ad fails to fill.
 */
export function NativeAdCard({ placement, currentApp }: NativeAdCardProps) {
  useAdsVersion();
  if (!adsAvailable() || !unitIdFor(placement, 'native') || !guardAllows(placement)) return null;
  return <NativeAdLoaded placement={placement} currentApp={currentApp} />;
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', justifyContent: 'center', maxHeight: 60 },
  native: { borderWidth: StyleSheet.hairlineWidth },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  media: { width: '100%', height: 160, marginTop: 8 },
  cta: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, overflow: 'hidden', fontWeight: '600' },
});
