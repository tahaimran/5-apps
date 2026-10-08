# @shared — code reused by all 5 apps

Build this package **first** (one Opus or Sonnet session) and keep it stable. Every app imports it, so each app only contains its own screens and logic.
Workspace name: `@shared/*` via npm workspaces plus a TS path alias (`"@shared/*": ["../../packages/shared/src/*"]`) and Metro `watchFolders`.

## Modules & API contract

### `@shared/consent`
```ts
initConsent(): Promise<{ canRequestAds: boolean }>   // Google UMP: request info update → show form if required
openPrivacyOptions(): Promise<void>                    // Settings → "Privacy choices"
```
Must run before `MobileAds().initialize()`.

### `@shared/ads`
```ts
initAds(policy: AdPolicy, units: AdUnits): Promise<void>
<AdBanner placement="home" />                          // adaptive anchored; renders nothing if ads disabled/consent denied
<NativeAdCard placement="history" />                   // styled card with "Ad" badge
showInterstitial(placement: string): Promise<boolean>  // respects caps; returns false if skipped
showRewarded(placement: string): Promise<{ rewarded: boolean }>
useAppOpenAd(canShow: () => boolean)                   // hook for warm-start app-open ads
setAdGuard(fn: (placement: string) => boolean)         // app-level veto (e.g. active contraction session)
```
`AdPolicy` defaults are in `docs/ADMOB_PLAYBOOK.md §3`. Unit IDs come from `EXPO_PUBLIC_ADMOB_<PLACEMENT>`; in `__DEV__` it falls back to `TestIds`.

### `@shared/storage`
```ts
createStore<T>(id: string, version: number, migrations: Record<number, (old: any) => any>)
store.get<K extends keyof T>(key: K): T[K] | undefined
store.set<K extends keyof T>(key: K, value: T[K]): void
useStored<K extends keyof T>(key: K, fallback: T[K]): [T[K], (v: T[K]) => void]
exportBackup(): Promise<string /* file uri */>; importBackup(uri: string): Promise<void>
```
Backed by `react-native-mmkv`.

### `@shared/onboarding`
`<OnboardingFlow steps={[...]} onDone={...} />`: a paged flow with a progress dots header, Skip, Back, and support for custom input steps (pickers, chips, sliders). It persists `onboarding.completedAt`.

### `@shared/theme`
Tokens (`colors`, `spacing`, `radius`, `type`, `motion`) plus `ThemeProvider` with light, dark and high-contrast modes. Each app passes its own palette and font scale. Includes `useHaptics()`.

### `@shared/i18n`
`t(key, params)` and `useLocale()` backed by `expo-localization` with bundled JSON per app.

### `@shared/review`
`maybeAskForReview(trigger: string)` wraps `expo-store-review` with rules: at least 3 positive events, at least 2 days since install, at most once per 60 days.

### `@shared/notify`
`ensureNotificationPermission(reasonCopy)`, `scheduleDaily(id, hour, minute, content)`, `scheduleSeries(...)`, `cancel(id)`, all local via `expo-notifications`, with Android channels created on init.

### `@shared/crosspromo`
`<HouseAdCard />`: rotates promos for the other 4 apps (Play Store links), shown only where a native ad failed to fill.
