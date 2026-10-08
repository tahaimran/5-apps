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

## Implementation notes
- Import per module: `@shared/ads`, `@shared/storage`, … (TS alias from `tsconfig.base.json`; add the same alias to each app's Metro config / `babel-plugin-module-resolver` or rely on the workspace package). Run `npm run typecheck` at the repo root.
- **Ad units:** `initAds(policy, units)` where `units = { home: { format: 'banner', unitId: process.env.EXPO_PUBLIC_ADMOB_HOME } }`. Write the `process.env.EXPO_PUBLIC_*` reference literally (Expo only inlines static references). In `__DEV__` Google test IDs are always used; in release a placement with no ID shows no ad.
- `initAds` runs `initConsent()` itself and starts the SDK only when `canRequestAds` is true (also later, after "Privacy choices").
- App-open ads use the single unit with `format: 'appOpen'`; the guard sees the placement `app_open`.
- `setAdGuard` vetoes banner, native, interstitial and app-open; rewarded is user-initiated and ignores it. Rewarded ignores frequency caps.
- `<NativeAdCard>` falls back to `<HouseAdCard>` on no-fill. Call `setCurrentApp('habit-tracker')` (from `@shared/crosspromo`) once so an app never promotes itself. Package IDs live in `crosspromo/catalog.ts` and must match each app's `android.package`.
- i18n: `registerStrings({ en: require('./i18n/en.json') })` at startup. Shared UI strings are under the `shared.*` keys and can be overridden by the app bundle.
- `store.exportBackup()` returns a file uri; sharing it is up to the app.
- Each `sharedStore` key (onboarding, review, theme mode, session count) is in `SharedKeys`.

## Tests
`cd packages/shared && npm test` (or `npm test` at the repo root to run every workspace). `npm run test:coverage` enforces
95% statements / 90% branches. The ads rules (first-session grace, every-Nth action, minimum gap, per-session cap,
guard, rewarded-only-when-earned, consent ordering, single SDK start), consent fallbacks, storage migrations and backup,
onboarding step logic, review rules, notification scheduling, theme, i18n and cross-promo are all covered with the native
modules faked (`src/testing/`). Passing here does not replace running on a device.
