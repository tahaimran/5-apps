import { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } from 'react-native-google-mobile-ads';

let canRequestAds = false;
let initPromise: Promise<{ canRequestAds: boolean }> | null = null;
const listeners = new Set<(canRequestAds: boolean) => void>();

const update = (value: boolean) => {
  if (value === canRequestAds) return;
  canRequestAds = value;
  listeners.forEach((l) => l(value));
};

/**
 * Google UMP: request an info update and show the consent form if required.
 * Must complete before `MobileAds().initialize()` (the ads layer calls it for you).
 * Safe to call more than once; concurrent calls share one run.
 */
export function initConsent(): Promise<{ canRequestAds: boolean }> {
  initPromise ??= (async () => {
    try {
      const info = await AdsConsent.gatherConsent();
      update(info.canRequestAds);
    } catch {
      // Offline or UMP error: fall back to the consent state stored from an earlier run.
      try {
        update((await AdsConsent.getConsentInfo()).canRequestAds);
      } catch {
        update(false);
      }
    }
    return { canRequestAds };
  })();
  return initPromise;
}

/** Settings → "Privacy choices". Re-evaluates `canRequestAds` afterwards. */
export async function openPrivacyOptions(): Promise<void> {
  const info = await AdsConsent.showPrivacyOptionsForm();
  update(info.canRequestAds);
}

/** True when the user is in a region that requires a "Privacy choices" entry in Settings. */
export async function isPrivacyOptionsRequired(): Promise<boolean> {
  const info = await AdsConsent.getConsentInfo();
  return info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
}

export function getCanRequestAds(): boolean {
  return canRequestAds;
}

export function onConsentChange(listener: (canRequestAds: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
