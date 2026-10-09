import { resetDisk } from '../../testing/native';
import { mockSdk, resetAds } from '../../testing/adsNative';

function load() {
  let m!: typeof import('../index');
  jest.isolateModules(() => {
    m = require('../index');
  });
  return m;
}

beforeEach(() => {
  resetDisk();
  resetAds();
});

describe('initConsent', () => {
  it('asks Google UMP and returns whether ads may be requested', async () => {
    const consent = load();
    mockSdk.consent.canRequestAds = true;
    await expect(consent.initConsent()).resolves.toEqual({ canRequestAds: true });
    expect(consent.getCanRequestAds()).toBe(true);
  });
  it('returns false when consent is not given', async () => {
    const consent = load();
    await expect(consent.initConsent()).resolves.toEqual({ canRequestAds: false });
    expect(consent.getCanRequestAds()).toBe(false);
  });
  it('runs the form flow once, however often and however concurrently it is called', async () => {
    const consent = load();
    mockSdk.consent.canRequestAds = true;
    await Promise.all([consent.initConsent(), consent.initConsent(), consent.initConsent()]);
    await consent.initConsent();
    expect(mockSdk.consent.gather).toHaveBeenCalledTimes(1);
  });
  it('falls back to the consent stored from an earlier run when the form flow fails (offline)', async () => {
    const consent = load();
    mockSdk.consent.gatherFails = true;
    mockSdk.consent.canRequestAds = true;
    await expect(consent.initConsent()).resolves.toEqual({ canRequestAds: true });
    expect(mockSdk.consent.info).toHaveBeenCalled();
  });
  it('stays on "no ads" when nothing can be determined', async () => {
    const consent = load();
    mockSdk.consent.gatherFails = true;
    mockSdk.consent.infoFails = true;
    mockSdk.consent.canRequestAds = true;
    await expect(consent.initConsent()).resolves.toEqual({ canRequestAds: false });
  });
  it('never rejects', async () => {
    const consent = load();
    mockSdk.consent.gatherFails = true;
    mockSdk.consent.infoFails = true;
    await expect(consent.initConsent()).resolves.toBeDefined();
  });
});

describe('privacy options', () => {
  it('re-evaluates consent after the user changes their choice', async () => {
    const consent = load();
    await consent.initConsent();
    mockSdk.consent.canRequestAds = true;
    await consent.openPrivacyOptions();
    expect(mockSdk.consent.privacyForm).toHaveBeenCalledTimes(1);
    expect(consent.getCanRequestAds()).toBe(true);
    mockSdk.consent.canRequestAds = false;
    await consent.openPrivacyOptions();
    expect(consent.getCanRequestAds()).toBe(false);
  });
  it('reports whether a "Privacy choices" entry is required in this region', async () => {
    const consent = load();
    expect(await consent.isPrivacyOptionsRequired()).toBe(false);
    mockSdk.consent.required = true;
    expect(await consent.isPrivacyOptionsRequired()).toBe(true);
  });
});

describe('onConsentChange', () => {
  it('notifies only when the answer actually changes', async () => {
    const consent = load();
    const listener = jest.fn();
    consent.onConsentChange(listener);
    await consent.initConsent(); // false → false: no change
    expect(listener).not.toHaveBeenCalled();
    mockSdk.consent.canRequestAds = true;
    await consent.openPrivacyOptions();
    await consent.openPrivacyOptions(); // true → true
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(true);
  });
  it('can be unsubscribed', async () => {
    const consent = load();
    const listener = jest.fn();
    const off = consent.onConsentChange(listener);
    off();
    mockSdk.consent.canRequestAds = true;
    await consent.openPrivacyOptions();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('isConsentFormRequired', () => {
  it('is true only when UMP reports that consent is required, and shows no form while asking', async () => {
    const consent = load();
    mockSdk.consent.status = 'REQUIRED';
    await expect(consent.isConsentFormRequired()).resolves.toBe(true);
    expect(mockSdk.consent.gather).not.toHaveBeenCalled();
    for (const status of ['NOT_REQUIRED', 'OBTAINED', 'UNKNOWN']) {
      mockSdk.consent.status = status;
      await expect(consent.isConsentFormRequired()).resolves.toBe(false);
    }
  });
  it('is false and never rejects when the status cannot be fetched (offline)', async () => {
    const consent = load();
    mockSdk.consent.status = 'REQUIRED';
    mockSdk.consent.infoUpdateFails = true;
    await expect(consent.isConsentFormRequired()).resolves.toBe(false);
  });
});
