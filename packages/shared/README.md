# @shared — code reused by all 5 apps

Build this package **first** (one Opus or Sonnet session) and keep it stable. Every app imports it, so each app only contains its own screens and logic.
Workspace name: `@shared/*` via npm workspaces plus a TS path alias (`"@shared/*": ["../../packages/shared/src/*"]`) and Metro `watchFolders`.

## Modules & API contract

### `@shared/consent`
```ts
initConsent(): Promise<{ canRequestAds: boolean }>   // Google UMP: request info update → show form if required
openPrivacyOptions(): Promise<void>                    // Settings → "Privacy choices"
isConsentFormRequired(): Promise<boolean>              // true when UMP will show a form here (status REQUIRED); asks without showing anything, never rejects, false when offline. Lets an app show its own pre-screen only where a form follows.
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
onFullScreenAdShown(listener: (kind: 'interstitial' | 'rewarded' | 'appOpen') => void): () => void
                                                       // fires when a full-screen ad was really shown and closed; lets an app keep "90 s since any full-screen ad" rules exact
MaxAdContentRating                                     // re-exported so apps set `maxAdContentRating` without importing the SDK
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
Tokens (`colors`, `spacing`, `radius`, `type`, `motion`, `fonts`, `shadow(level)`) plus `ThemeProvider` with light, dark and high-contrast modes. Each app passes its own palette (including `primarySoft` and `shadow`), fonts and font scale. Includes `useHaptics()`.

### `@shared/ui`
Motion-ready building blocks on Reanimated + react-native-svg (each app lists both as dependencies):
```tsx
<PressableScale scaleTo={0.96}>   // dips on press-in, springs back; dims instead under reduced motion
<ProgressRing size strokeWidth progress color trackColor>{center}</ProgressRing>   // sweeps to new values
<Card level={1} padded>           // surface + radius.lg + theme.shadow(level)
<Button label onPress variant="primary|secondary|ghost|danger" icon loading />
<IconButton icon={LucideIcon} label onPress variant="plain|tonal|solid" />   // label is required
showToast({ message, icon, tone, action }) and <ToastHost bottom={…} />      // mount the host once
<Toggle label value onValueChange>                     // Switch with a visible thumb in dark mode
<Segmented options value onChange>                     // sliding pill (CSS transition, never sticks)
<Stepper label value min max step format onPressValue> // step may be (value, dir) => size; snaps to the grid
<SystemNavBar dark>                                    // nav-bar button style; renders nothing in builds without expo-navigation-bar
<Digits value="12:07" size={72} color>                 // ticking numbers in fixed-width digit slots (never shift)
<Confetti colors={[...]} onDone count duration>        // one-shot burst for a rare celebration; draws nothing under Reduce Motion
insetTones(colors, mode)           // track + raised colors; in dark mode the raised part is the lighter one
EASE_OUT, EASE_IN_OUT              // the curves to use for UI timing
```
`useHaptics()` (from `@shared/theme`) obeys `setHapticsEnabled(on)`; call it from the app's settings store so
shared components (Stepper, TimeField wheels) follow the user's toggle. Outside React (store actions, timer callbacks)
use the same gated helpers as `haptics` (`tap`, `press`, `heavy`, `select`, `success`, `warning`, `error`).
Icons are passed as components (`IconComponent`), so apps import Lucide one icon at a time:
`import Flame from 'lucide-react-native/icons/flame'`. Lucide ships types for some renamed icons without a
runtime file (e.g. `history`, use `rotate-ccw-clock`); habit-tracker's `icons.static.test.ts` guards this.

### `@shared/time`
```ts
formatTime('20:30', '12h') → '8:30 PM'; formatHour, toHHMM, fromHHMM, deviceTimeFormat()   // pure, "HH:mm" stored 24-hour
setTimeFormatPreference('12h' | '24h' | undefined)    // undefined = follow the phone's clock
useTimeFormat() → { format, periods, time(hhmm), hour(h), at(date) }; currentTimeFormat(), formatClock(date)
<TimeField label value="07:00" onChange minuteStep={5}>   // pill that opens hour/minute(/AM-PM) wheels
```
The 12/24-hour choice stays in each app's own settings (and backups); the app's settings store pushes it with
`setTimeFormatPreference`. Stores import `@shared/time/preference`, which has no UI, so pure-logic tests never load
Reanimated.

### `@shared/sound`
`initSounds(preload?)`, `playSound('tap' | 'check' | 'undo' | 'complete' | 'celebrate' | 'wrong' | 'tick')`, `setSoundsEnabled(on)`.
`wrong` (a soft falling pair) and `tick` (a quiet countdown click) are the quiz sounds; any app may use them.
expo-audio players that mix with the user's music and never play in the background. The files in
`assets/sounds` come from `scripts/generate-sounds.mjs`; `reminder.wav` is for notification channels (bundle it
with the expo-notifications plugin `sounds` option). Configure expo-audio with
`{ microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false }` so it adds no
microphone or media-service permissions.

### Fonts
`assets/fonts` holds Figtree (400–700) and Bricolage Grotesque (600, 800), both OFL. Embed them with the
expo-font plugin's `android.fonts` family syntax (see habit-tracker's `app.config.ts`) and pass
`fonts={{ body, display }}` to `ThemeProvider`; type tokens then carry `fontFamily`, and `fontWeight` picks the file.

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
