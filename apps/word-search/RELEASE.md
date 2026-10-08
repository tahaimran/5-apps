# Word Search: Large Print Easy — release runbook and QA status

> **Nothing in this app has been run on a device or an emulator.** No Android build was made (no EAS build,
> no APK, no AAB), no ad was requested from Google, the consent form was never shown, no notification exists
> yet, and no screen has been looked at in a running app. Everything marked *verified* below was checked by
> Jest, `tsc`, `expo-doctor`, `expo export` and `expo prebuild` in a Linux container. Every item that needs a
> phone, an account or a store is **open**.
>
> **Scope:** this build covers plan milestones 1 to 7 (Day 1 to Day 7 of `DEVELOPMENT_PLAN.md` §16). Milestone 8
> (daily reminder, review prompt, sounds, privacy policy page) and milestone 9 (store listing, release build)
> are **not built**; see §6 for the full list of what is missing.

## 1. Verified in the repo (automated, repeatable)
```bash
cd apps/word-search
npx tsc --noEmit && (cd ../../packages/shared && npx tsc --noEmit)
npx jest                  # 26 suites, 422 tests: domain, generator fuzz, stores, screens, ads rules, a11y, config, assets
npm run test:tz           # day keys, streaks and midnight roll-over in 7 time zones (DST, half-hour offsets, southern hemisphere)
npx expo-doctor           # 21/21
npx expo export --platform android --output-dir /tmp/ws-export   # Metro bundle sanity (Hermes bytecode, ~4 MB)
npx expo prebuild --platform android --no-install --clean        # native config plugins resolve; then delete android/
```
After touching `packages/shared` also re-run `cd packages/shared && npm run test:coverage` and, in `apps/habit-tracker`
and `apps/water-reminder`, `npx tsc --noEmit && npx jest` (all green with the shared change made for this app; see §6 for
one flaky run).

What the automated checks actually cover:
| Area | How |
|---|---|
| Puzzle generator | 1,000 seeds × 3 difficulties, every grid size 6 to 12, every pack; a separate 10,000-seed fuzz. Each puzzle is checked by `verifyPuzzle`: all words present exactly once (palindromes counted once), only the difficulty's directions, A–Z grid, no blocked word spelled by filler letters (`generator.test.ts`, `qa.perf.test.ts`) |
| Word packs | 12 packs of 130 to 145 words each, all A–Z and 3 to 12 letters, no blocked word, no religious pack (`packs.test.ts`) |
| Selection | direction snapping, projection onto the line, touch slop, backwards words refused on Easy and Medium and accepted on Hard (`selection.test.ts`, `Grid.test.tsx`) |
| Game loop | autosave after every found word, resume with the same grid, elapsed time, finish → stars, level, stats, "Start a new puzzle?" prompt, celebration beat, leaving during it (`game.test.ts`, `loop.test.tsx`) |
| Daily puzzle | same puzzle for the same date, difficulty and grid size; theme rotation over a year; streak, freezes (earn at 7, max 2), catch-up days, clock set back, midnight during a puzzle (`daily.test.ts`, `daily.hints.test.tsx`, `qa.tz.test.ts`) |
| Hints | 3 free a day, reset at local midnight, shortest word first, last letter on the second hint, +2 for a finished video (max 10 held), one courtesy hint a day without a video, tutorial bonus (`hints.test.ts`, `daily.hints.test.tsx`) |
| Settings | text size, selection mode, theme, vibration, preferred difficulty, timer, two-step reset that keeps settings (`daily.hints.test.tsx`) |
| Onboarding | every screen, Skip, defaults, font-scale ≥ 1.3 preselects Extra Large, resume after a kill, consent before the tutorial, tutorial coach mark, "You found it!", Skip tutorial after 10 s, where the app opens (`onboarding.test.tsx`) |
| Ads rules | every row of plan §11 "never show when" as a pure function with reasons (`adRules.test.ts`), then against the real `@shared/ads` with a fake AdMob SDK: consent before the SDK starts, PG rating, banners only on Home / pack list / Daily, never on the game, Complete or Settings screens, interstitial every 3rd puzzle with 90 s gap and 6 an hour, skipped for daily and first-session puzzles, rewarded only when earned, app-open only on a warm start after 4 minutes away and 4 hours apart, not during a puzzle (`ads.integration.test.tsx`) |
| Accessibility | every screen at font scale 1.3 and 2.0 in light, dark and high contrast, and the play screen at all four text sizes: labels on every Pressable, 56 dp targets (grid cells are the plan's 44 dp and are checked separately); static scan for hard-coded copy, missing labels, and anything that turns off font scaling (`a11y.render.test.tsx`, `a11y.static.test.ts`) |
| Contrast | body text 7:1 in all three themes, large-text pairs 4.5:1, letters on every found-word highlight 4.5:1 (`contrast.test.ts`) |
| Config | package matches the cross-promo catalog, permissions and blocked permissions, target API 36, no real AdMob id in git, `.env.example` matches the placements (`config.test.ts`); merged manifest checked with `expo prebuild` (VIBRATE and AD_ID only, plus the ads SDK's own) |
| Store files | icon and graphic sizes, listing limits, no text from the other four apps in `ASO.md` (`store.assets.test.ts`) |
| Honesty of this file | `release.test.ts` fails if this document stops saying nothing ran on a device, or if a device QA row is ticked |
| Performance (computation only) | hard 12×12 puzzle p95 under 50 ms on this CI machine; mean about 4.5 ms (measured in `qa.perf.test.ts`; **not** on a Moto G) |

## 2. One-time setup (needs your accounts)
1. **Expo/EAS:** `cd apps/word-search && eas login && eas init` (adds `extra.eas.projectId`; commit it).
2. **Package name:** `com.fiveapps.wordsearchlarge` in `app.config.ts` is a placeholder shared with
   `packages/shared/src/crosspromo/catalog.ts` (a test keeps them equal). The plan says "pick the portfolio prefix once and
   never change it": decide the final application ID *before the first upload* and update both.
3. **AdMob:** create the app and 4 ad units (home banner, packs banner, interstitial, rewarded) plus one app-open unit
   (`.env.example` lists the variables). Add them as EAS environment variables (`eas env:create`), never in git. Register
   your own phone as a test device in AdMob. Set the maximum ad content rating to G or PG and block gambling and dating
   categories in the AdMob console (plan §11); the app also asks for PG in code.
4. **Privacy policy:** write and host one, then set `EXPO_PUBLIC_PRIVACY_POLICY_URL` (Settings shows the link only when it is set).
5. **app-ads.txt:** host it at the root of the developer website listed in Play Console.
6. **Play Console:** create the app, enrol in Play App Signing, add a service account for `eas submit`.
7. **Fonts and licence:** Atkinson Hyperlegible comes from `@expo-google-fonts/atkinson-hyperlegible` (SIL Open Font License).

## 3. Build and ship
```bash
eas build --profile development --platform android   # dev client (ads need a native build)
eas build --profile preview     --platform android   # APK for testers and screenshots
eas build --profile production  --platform android   # AAB, versionCode auto-increments
eas submit --platform android                        # uploads to the internal track
```
Internal testing → device QA (§4) → **closed testing** (12 testers for 14 days on a new personal account) → production at
20% → 50% → 100% (watch crash-free ≥ 99.5% and ANR). Read the pre-launch report.

## 4. Device QA matrix (all open until someone runs them)
A quick way to see ad decisions on a development build: Settings → "Ad rules (development builds only)" lists every
placement, whether it would show now and why not, with the counters.

| Area | Check | Status |
|---|---|---|
| Build | dev client builds with EAS, installs, launches; splash shows the icon on cream, then the fonts load, then onboarding | open |
| Fonts | Atkinson Hyperlegible (regular and bold) renders in all text, the grid letters and the tab labels; the app still works if the fonts fail to load | open |
| Grid | dragging a finger across a word selects it on Easy, Medium and Hard; the direction snaps at 45°; the highlight follows the finger; a wrong selection fades with no buzz | open |
| Grid | **a drag on the grid never scrolls the page**, including on a small phone or at a large text size where the page overflows (the page's scrolling is switched off while a finger is on the grid; this is untested on a real touch screen) | open |
| Grid | tap-first-tap-last works; tapping the same cell cancels; "Tap only" in Settings removes dragging; touch slop at the grid edge feels right | open |
| Grid | the found-word stroke draws itself (Reanimated `animatedProps` on an SVG `Line`) and the letters stay readable on every highlight color; high-contrast outlines are two solid colors | open |
| Grid | cells are at least 44 dp at every text size on a 360 dp phone and on a small 320 dp phone; the grid shrinks to fit rather than overflow; a tablet shows a centered grid no wider than 560 dp | open |
| Text size | changing the size mid-puzzle (play menu) resizes the letters at once within the existing cells; the next puzzle uses the larger grid cells; Android "font size" 1.3× and 2.0× and "display size: Largest" on every screen (jest checks targets and labels, not clipping) | open |
| Haptics | a tick when a selection starts, success on a found word, success then a medium bump on completion, nothing on a wrong selection; Settings → Vibration turns them off | open |
| Resume | kill the app mid-puzzle (swipe from Recents) and reopen: same grid, found words kept; Home "Continue" shows the right count; midnight passing while the app is open | open |
| Daily | same puzzle on two phones with the same difficulty and screen size; the streak and the freeze behave across real midnights and a time-zone change; catch-up days do not touch the streak | open |
| Hints | the ring on the first letter lasts 3 s; the second hint also rings the last letter; the screen reader announces the row and column | open |
| Onboarding | first launch to first found word in about 30 s; Skip applies Large text and Easy; killing the app on each screen resumes it; the tutorial coach finger is visible and stops when touched; "Skip tutorial" appears after 10 s | open |
| Onboarding | with Android font size at 1.3× or more, Extra Large is preselected | open |
| Consent | UMP form with the EEA debug geography (`setDebugGeography`) appears after the setup screens and before the tutorial; "Privacy choices" row appears only where required and reopens the form; the app works if the form fails or the phone is offline | open |
| Ads | test ids in a dev build, real ids in a release build; no ad of any kind before the tutorial is done and level 2 is completed in the first session | open |
| Ads | banners on Home, pack lists and the Daily tab sit ≥ 8 dp above the tab bar with a divider; nothing blank when no ad fills; none on the game, Complete or Settings screens | open |
| Ads | interstitial after "Next puzzle" every 3rd puzzle, ≥ 90 s after any full-screen ad, max 6 an hour, never after a daily puzzle, never mid-puzzle or on Back; the app never waits for an ad that is not ready | open |
| Ads | rewarded hint refill: "Watch video" grants 2 hints only when the video completes; closing early grants nothing; with no fill the message and the daily courtesy hint appear | open |
| Ads | app-open only when returning after ≥ 4 minutes and ≥ 4 hours since the last one, never on a cold start, never with a puzzle open (the app-open event ordering with other lifecycle events is best effort) | open |
| TalkBack | full walk-through of onboarding, a puzzle in tap mode (cells are labelled "Row 3, column 5, letter K"), the word list ("Lion, found"), found-word announcements, the Daily calendar, Settings | open |
| Reduce motion | no finger animation in the tutorial, no stroke animation; everything else still works | open |
| Look | every screen in light, dark and high contrast looks right; the icon, adaptive icon and monochrome icon in a launcher; the feature graphic; Home pack cards are 120 dp tall | open |
| Navigation | Back from the game returns to where it started; the Complete screen is a modal; Android system Back during the celebration | open |
| Reset | "Reset progress" asks twice and keeps the settings | open |
| Performance | cold start; generating a 12×12 puzzle takes under 50 ms on a Moto G-class phone (the plan's target); scrolling the pack level list after hundreds of levels | open |
| Size and native libs | AAB size; 16 KB page-size alignment of the native libs (mmkv, reanimated, worklets, svg, gesture handler, ads) with `zipalign -c -P 16 -v 4 app.aab` | open |
| Devices | the plan's three devices: low-end Android 10, mid Android 13, a tablet | open |

Handy commands:
```bash
adb shell dumpsys package com.fiveapps.wordsearchlarge | grep permission   # compare with the list in §5
adb shell am kill com.fiveapps.wordsearchlarge                             # kill the process (not force-stop) to test resume
```

## 5. Play Console content
Only the graphics exist so far. Everything else in the plan's §17 "Play Console" list is **not drafted**.
| Item | Where | Status |
|---|---|---|
| Listing title and short description | `ASO.md` (limits checked by a test) | ready, **but see "ASO claims" in §6** |
| Full description | `ASO.md` (Word Search text, 2,608 chars, Applyra `check_metadata` valid on 2026-10-08) | ready, **claims need aligning with what is built** |
| Icon 512, feature graphic 1024×500 | `store/` (made by `scripts/make-assets.mjs`) | made, **never viewed on Play** |
| 8 screenshots 1080×1920 | — | **to capture on a device** |
| Data safety, content rating, privacy policy, app-ads.txt | — | **not written** |
| Permissions | `app.config.ts` + `src/__tests__/config.test.ts`; merged manifest checked with `expo prebuild` | done |
| Target API | 36 (checked by test: ≥ 35) | done |

Declared permissions: `VIBRATE`, `AD_ID`, plus `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK` from the ads library.
Blocked: `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, storage, `SYSTEM_ALERT_WINDOW`.
`POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` are added when the reminder (milestone 8) is built.

## 6. Decisions, deviations and known gaps
**Found in the repo**
- `ASO.md` of this app had no text from another app (a test now guards that, after the Sipling file once held the Quizora
  listing). It does describe features that are **not built yet**, so the listing would be wrong if shipped today:
  "Gentle sounds" (no sound yet), "An optional reminder can let you know when today's puzzle is ready" (no reminder yet),
  and pack names that do not exist as packs: *Garden*, *Kitchen*, *Movies*, *Everyday Life* (the 12 packs are Animals,
  Birds, Food, Baking, Travel, Cities, Nature, Holidays, Seasons, Hobbies, Music, Home & Family). Either build milestone 8 and
  rename packs, or edit the listing.
- The commit for milestone 4 (`e54106a`) was pushed with one failing test (the app-shell test still expected the old Home
  title); it was fixed in the next commit (`8aa1d56`). The pre-commit script I used did not stop on a Jest failure; it does now.
- Habit Tracker's Jest run failed once (1 of 425 tests, `screens.smoke`) during one full run after my shared change and
  passed on three reruns of that file and on a full rerun; I did not find the cause and did not change that app.

**Changes to `packages/shared`** (backward compatible, tested; shared coverage still above its thresholds; habit-tracker and
water-reminder `tsc` and Jest re-run):
`@shared/ads` now exports `onFullScreenAdShown(listener)` (fires when an interstitial, rewarded or app-open ad was really
shown and closed, so an app can keep "90 s since any full-screen ad" exact) and re-exports `MaxAdContentRating`, so app code
never imports the AdMob SDK.

**Deviations from the plan**
- Logic is in `src/domain` (the plan's folder tree says `src/game`) and the screens' helpers in `src/features`. Storage keys in
  the `ws` MMKV store have no `ws.` prefix (the store id is the prefix); `onboarding.resume` and `onboarding.tutorialDone` are
  additions. The theme mode is owned by `@shared/theme` and the onboarding flag by `@shared/onboarding`, so `Settings` has no
  `theme` field. `Settings` also has no `sounds` or `reminder` fields yet (milestone 8).
- Grid drawn with `react-native-svg` strokes under letters drawn as views, not Skia (the plan allows either). Gestures use
  `react-native-gesture-handler` Pan raced with Tap on one surface; with TalkBack on, cells become labelled buttons.
- `InteractionManager.runAfterInteractions` is deprecated in React Native 0.86, so the play screen builds the puzzle in a
  `setTimeout(0)` after the placeholder paints.
- **Daily puzzles are the same for everyone only per difficulty and grid size**, because the grid size depends on the screen
  width and text size (plan §8.1) and so is part of the seed. The same applies to pack levels.
- Text size is chosen with four radio cards and a live sample grid, not a slider. Changing the size during a puzzle resizes
  the letters at once inside the existing cells; the bigger cells arrive with the next puzzle. The grid is capped at 560 dp.
- Hints use the shortest unfound word (plan §8.5) rather than a random one (F7). The ring is a static ring for 3 s (the plan
  says the cell "pulses"). The first tapped cell is highlighted, not pulsed.
- Pack list: the current level (with Play) first, one "Next up", then finished levels newest first, instead of one ascending list.
- The Daily calendar is a display (not tappable); past days are played from a "Catch up" list of the last 7 missed days
  because 7 columns cannot all be 56 dp wide on a phone.
- The difficulty selector on a pack list and in Settings both change the one preferred difficulty.
- "Reset progress" keeps the ad frequency counters (so it cannot be used to skip a cap), settings and onboarding.
- Starting a puzzle while another is in progress asks first (one save slot); the plan did not say.
- The tutorial counts as a completed puzzle in the stats and for "level 2" in the first-session ad rule, but not for the
  "every 3 puzzles" interstitial count.
- App-open ads: "not on returning from a notification tap" is wired (deep-link events) but there are no notifications yet.

**Not built (plan items outside milestones 1 to 7, or skipped)**
- Daily reminder, its pre-prompt, notification channel and deep link (F11, §10); in-app review prompt; sounds (`expo-audio`);
  "Send feedback" and "Rate the app" rows; privacy policy page; the Help screen (§5.7); `analytics/events.ts`.
- Retention loops of §12: gentle-return message, pack badges, word collections, milestone modals, streak restore (v1.1).
- Everything marked v1.1 or later: word definitions, extra packs, stats screen, relax sound pack, seasonal events, hidden
  phrases, tablet two-pane layout, localization, mediation adapters.
- The Settings options "highlight start letter on hint" and the reminder time; the `Stats` fields beyond counts are stored
  but not shown anywhere.
- Maestro flows and store/Play Console drafts (milestone 9).

**Behaviour you may want to change**
- A puzzle finished after midnight counts as a catch-up day, not for the new day's streak.
- Hint refill video: if the SDK reports "not earned" (closed early) no courtesy hint is given; the courtesy hint is only for
  "no video ready".
- The app-open ad rule counts a rewarded or interstitial ad toward the 90 s gap and tracks the 4 h gap from the ad that was
  actually shown (via the new shared hook).
- Word counts on small grids are capped (`size² / 9`) so Easy 7×7 has 5 to 5 words, not 6 to 8; if a grid cannot be filled the
  generator retries and reduces the count by one after every three attempts (about 6% of medium 8×8 and hard 10×10 puzzles end
  one word short of the minimum).
