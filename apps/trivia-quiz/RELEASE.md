# Quizora: Trivia Quiz Offline — release runbook and QA status

> **Nothing in this app has been run on a device or an emulator.** No Android build was made (no EAS build, no APK,
> no AAB), no ad was requested from Google, the consent form was never shown, no notification was ever delivered, and
> no screen has been looked at in a running app. Everything marked *verified* below was checked by Jest, `tsc`,
> `expo-doctor`, `expo export` and `expo prebuild` in a Linux container. Every item that needs a phone, an account or a
> store is **open**.
>
> **Scope:** this build covers plan milestones 1 to 8 (D1 to D8 of `DEVELOPMENT_PLAN.md` §17). Milestone 9 (store
> listing, Data safety, screenshots, release build) is **not built**; see §6 for the full list of what is missing.
>
> **The 3,600 questions have not been fact-checked.** They were written by model agents in one pass and checked only for
> format, duplicates and wording. There was no independent second-model pass and no human spot check (plan §10). Do not
> ship before that happens. See §6 and `content/review/`.

## 1. Verified in the repo (automated, repeatable)
```bash
cd apps/trivia-quiz
npm run check             # the pre-commit gate: tsc here and in packages/shared, jest, expo-doctor, expo export (stops on the first failure)
npm run test:tz           # day keys, streak, Daily seed and reminder planning in 7 time zones (DST, half-hour offsets, southern hemisphere)
npx expo prebuild --platform android --no-install --clean        # native config plugins resolve; read the manifest, then delete android/
node scripts/build-bank.mjs                                      # rebuilds assets/questions/en from content/raw and validates the whole bank
node scripts/check-raw.mjs content/raw/<category>-1.json ...     # checks raw question files while they are being written
```
Results at the last run: `npx jest` 31 suites, 377 tests; the same suite also passes with `TZ=America/Los_Angeles` and
`TZ=Pacific/Auckland`; `npm run test:tz` passes in all 7 zones; `expo-doctor` 21/21; `expo export --platform android`
bundles about 6 MB of Hermes bytecode plus 1 MB of question JSON. There is no ESLint config in the repo, so `eslint` was not run.

After touching `packages/shared` also run `cd packages/shared && npx tsc --noEmit && npx jest` (246 tests), and in
`apps/habit-tracker`, `apps/water-reminder` and `apps/word-search` run `npx tsc --noEmit && npx jest`. The last run was
green except two habit-tracker suites that fail only after UTC midnight (see §6, "Test that was flaky").

What the automated checks actually cover:
| Area | How |
|---|---|
| Engine | pure functions in `src/domain` with tests: seeded PRNG, question selector (unseen first, spaced rotation, no repeats in 3 days, a scripted 300-round run), points, XP, levels and titles, streak with freezes, restore and time-zone guard, Daily seed, lifelines, the round state machine (answers, timeouts, skip, 50/50, extra time, hearts, Blitz clock), Classic levels and unlocks |
| Content | `src/content/__tests__/bank.test.ts` runs the validator over the real bank: 4 different answers, lengths, no duplicate or near-duplicate question, profanity, curly quotes, ids, at least 100 questions per category and difficulty, the right answer lands at index 0 to 3 after every shuffle and in every position about equally often, manifest sha256 |
| Screens | real screens in Jest with fake native modules: Home (all Daily states, coach mark, streak restore), Play, Classic list and map, Category picker, quiz screen (answers, explanation, lifelines, clock, pause, quit, Back), Results, Daily and its result with share, Stats, Settings, Privacy, onboarding, closing screens |
| Ads | `src/__tests__/ads.integration.test.tsx` runs the real `@shared/ads` against a fake AdMob SDK: consent before the SDK, banners only where allowed, never an ad mid-question, interstitial cadence, the four rewarded flows (earned vs closed vs unavailable, double tap, caps), native card, app-open on warm start |
| Accessibility | `a11y.static` (every Pressable has a label, no `allowFontScaling` or `maxFontSizeMultiplier`, no user-facing text in JSX), `a11y.render` (48dp targets and labels on every screen at text scale 0.9, 1 and 1.3; answer buttons 56dp), contrast of every text pair in light and dark |
| Config | `config.test.ts` (permissions, blocked permissions, package id equals the cross-promo catalog, target SDK, plugins, test AdMob id, no real ids, `.env.example` matches the placements), `store.assets.test.ts` (listing limits, foreign text, unbuilt features) |
| Strings | `strings.test.ts`: every `t()` key exists in `en.json` |

## 2. One-time setup (needs your accounts)
1. `eas login`, then `eas init` in `apps/trivia-quiz` (creates the EAS project id).
2. Create the AdMob app and the 8 ad units (`menu`, `round_end`, `lifeline`, `extra_life`, `double_xp`, `streak_restore`, `app_open`, `results_native`); set the ids as EAS environment variables named in `.env.example`. Never commit them.
3. Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_CONTACT_EMAIL` (the in-app "Report this question" button and the Settings feedback and policy rows stay hidden without them).
4. Host the privacy policy (`store/privacy-policy.md` is a draft) and `app-ads.txt` on the portfolio domain.
5. For OTA content updates (not set up): `npx expo install expo-updates`, `eas update:configure`, a `runtimeVersion` policy, then `eas update --channel production`.

## 3. Build and ship
```bash
cd apps/trivia-quiz
eas build --profile development --platform android   # dev client (AdMob needs a native build, not Expo Go)
npx expo start --dev-client
eas build --profile production --platform android    # AAB
eas submit --platform android                        # internal track
```

## 4. Device QA matrix (all open until someone runs them)
Nothing below was run. A quick way to see ad decisions on a development build: Settings → "Ad rules (development)" lists
every placement, whether it would show now and why not, with the counters.

| Area | Check | Status |
|---|---|---|
| Build | dev client builds with EAS, installs, launches; the splash shows the icon, then the fonts load, then onboarding | open |
| Fonts | Inter (regular, medium, semibold, bold) renders everywhere including tab labels; the app still works if the fonts fail to load | open |
| First answer | first launch to the first answered warm-up question takes under 30 s on a mid-range phone (nothing was timed) | open |
| Onboarding | every screen O1 to O7 on a phone; "skip intro" skips the warm-up; killing the app on each screen resumes it; the warm-up has no timer, no lifelines and no ads | open |
| Quiz | the answer buttons, the shake and bounce, the timer ring, the tick in the last 5 s, the +points feel; the ring never jumps when 50/50 or +Time is used | open |
| Quiz | the timer pauses when the app is backgrounded (home button, an incoming call, the share sheet) and the paused time is not counted; "Paused — Resume" appears | open |
| Quiz | Android Back during a round asks "Quit round?"; Back on the Results screen goes where expected; the quiz is a full-screen modal with no tab bar | open |
| Haptics | a light tap on press, success on a right answer, error on a wrong one or a timeout; Settings → Vibration turns them off | open |
| Sounds | the chime, the buzz, the tick and the fanfare are pleasant at 60%; they follow the phone's silent mode (whether `playsInSilentMode: false` is enough on Android is unconfirmed); other music keeps playing; Settings → Sound turns them off; the WAV files are under 30 KB, not OGG | open |
| Clock | Blitz: 60 s, +1 s on a right answer, −3 s on a wrong one, the clock stands still while the explanation shows, +10 s once; Classic and Category timers 25, 20 and 18 s | open |
| Classic | stars and unlocks survive killing the app; 30 levels in each of 12 categories; hearts on levels 21 to 30 | open |
| Daily | the same 10 questions on two phones on the same date; the streak, freeze and restore across real midnights and a time-zone change; airplane mode | open |
| Share | the Daily result image is made and the Android share sheet opens with it (`react-native-view-shot`, `expo-sharing` are mocked in Jest); returning from the share sheet shows no app-open ad | open |
| Text size | Settings text size Small to Extra large, and Android font size 1.5× and "display size: Largest" on every screen (Jest checks targets and labels at a theme scale of 1.3, not clipping and not the OS scale) | open |
| TalkBack | a full round with TalkBack (answers read as "Answer B, Paris", the verdict is announced, the explanation is reachable, lifelines read their state), the Classic map, the Daily result strip, Settings and onboarding | open |
| Reduce motion | with "Remove animations" on: no shake, bounce or pulse; everything still works | open |
| Look | every screen in light and dark; the icon, adaptive icon and monochrome icon in a launcher; the feature graphic; category tile colors | open |
| Consent | UMP form with the EEA debug geography appears after the warm-up and before the first ad request, with our pre-screen first; where no form is required there is no pre-screen; "Privacy choices" appears only where required and reopens the form; the app works if the form fails or the phone is offline | open |
| Ads | test ids in a dev build, real ids in a release build; nothing before onboarding ends; no interstitial or app-open in the first session or the first 60 s | open |
| Ads | banners on Home, Play, Classic, Stats and Settings sit above the tab bar with nothing blank when no ad fills; none on the quiz, explanation, Results, Daily result or onboarding | open |
| Ads | interstitial after every 2nd round when leaving Results, at least 90 s after any full-screen ad, at most 8 a day, never after the Daily, never mid-question, never right after the review dialog; the app never waits for an ad that is not ready | open |
| Ads | rewarded: lifeline (+1, max 2 a round, 15 a day, never in the Daily or warm-up), continue with 1 heart, Double XP (3 a day, not at 0 correct), restore streak; a reward only when the video completes; "Not available right now" when nothing is loaded | open |
| Ads | the native card on Results, below the buttons, with the "Ad" badge, and the house-ad fallback when it does not fill | open |
| Ads | app-open only on a warm start after 4 hours away and 4 hours since the last, never in the first 2 days, never on a cold start, never from a notification tap, never over a question | open |
| Reminders | after "Remind me" the Android 13+ permission dialog appears and a notification arrives at the chosen time; channel "Daily Challenge" exists with default importance | open |
| Reminders | tapping a notification opens the Daily (app killed, in the background and open); `quizora://daily` works from adb; the ad rules treat a tap as an external open | open |
| Reminders | none today after the Daily is played; the 20:30 "streak ends at midnight" message replaces today's reminder when a streak of 2+ is at stake; comeback messages on day 3 and 7; one a day only; after 7 days of never opening the app they stop | open |
| Reminders | Doze (`adb shell dumpsys deviceidle force-idle`), a reboot (`adb reboot`), a time-zone change and a clock change: pending notifications still fire or are re-planned on the next open | open |
| Reminders | permission refused, then refused for good: the messages show and "Open phone settings" opens the right page; revoking it later stops the reminders without a crash | open |
| Reminders | on a Samsung, a Xiaomi and a Pixel (OEM battery managers may delay or drop notifications; the app has no battery guide) | open |
| Review | the system review dialog appears after 8 of 10, a 3-star level or a 3, 7 or 30 day streak, once the conditions hold (Play shows it only for a build installed from Play), never after a failed level, never within 60 s of an ad | open |
| Reset | "Reset progress" asks twice; it keeps the settings, favourites, reminder and ad counters | open |
| Privacy | the in-app privacy summary reads well at large text; the hosted policy URL opens from Settings | open |
| Performance | cold start under 2 s and the bank load under 300 ms on a 2 GB Android 9 phone (Jest times the load on this machine only); 60 fps answer animations | open |
| Size and native libs | AAB size; 16 KB page-size alignment of the native libs (mmkv, reanimated, worklets, svg, gesture handler, ads, view-shot) with `zipalign -c -P 16 -v 4 app.aab` | open |
| Permissions | `adb shell dumpsys package com.fiveapps.quizora | grep permission` matches §5 (the Gradle-merged manifest of the real build was never seen) | open |
| Devices | the plan's closed testing: at least 12 testers for 14 days if the developer account needs it, low-end Android 9 or 10, mid Android 13, a tablet | open |

Handy commands:
```bash
adb shell dumpsys package com.fiveapps.quizora | grep permission    # compare with the list in §5
adb shell am kill com.fiveapps.quizora                              # kill the process (not force-stop) to test the lost round and onboarding resume
adb shell am start -a android.intent.action.VIEW -d quizora://daily # the notification deep link
```

## 5. Play Console content
Declare from this build (not yet done anywhere; milestone 9):
- **Target audience:** 13–15, 16–17, 18+. Not for children, not in the Families program.
- **Contains ads:** yes. **In-app purchases:** none. **Ads max content rating:** T (set in code and in AdMob).
- **Data safety:** AdMob collects the advertising ID, approximate location from the IP address, app interactions and diagnostics, for advertising, analytics and fraud prevention, shared with Google ad partners, encrypted in transit; no account, so deletion is uninstalling. There is no crash reporter in this build (the plan's Sentry was not added), so declare none.
- **Permissions in the app-level merged manifest** (from `expo prebuild`): `INTERNET`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `com.google.android.gms.permission.AD_ID`, and `MODIFY_AUDIO_SETTINGS` (added by `expo-audio`; left in because blocking it was not tested). Blocked with `tools:node="remove"`: `RECORD_AUDIO`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`. The ads SDK adds `ACCESS_NETWORK_STATE` and `WAKE_LOCK` when Gradle merges libraries; that step needs a real build.
- **Advertising ID declaration:** yes. **Privacy policy URL, app-ads.txt, developer website:** open.

## 6. Decisions, deviations and known gaps

**Not built (so nobody mistakes this for a finished app)**
- Milestone 9 and later: the Play listing, screenshots, Data safety and IARC forms, hosted privacy policy and app-ads.txt, the production release build, the internal and closed test tracks, the bug bash. `store/privacy-policy.md` is a draft with placeholders.
- No Help screen was in the plan for this app; there is none.
- Plan v1.1 and v2 (skipped on purpose): Pass & Play, IQ Test mode, achievements, review mistakes, the OTA content pack, localization, picture rounds, the weekly event, the home-screen widget, "Remove ads".
- Plan v1.0 pieces **not** built: background music and its switch (no music is bundled); `expo-updates` and EAS Update (so "regular content updates" in the store text is not yet possible); Sentry; FlashList (plain scroll views are used; 30 levels and 12 tiles); Maestro E2E flows; the "corrupt storage → reset dialog with a backup" state; ad mediation (week 2 in the plan); Firebase Analytics (only local funnel counters exist, in `tq.funnel`).
- Content pipeline: `generate.ts` (model generation through the Batches API), `factcheck.ts` (independent second pass), `plan.yaml`, the human spot-check sheet and the post-launch calibration were **not** built or done. `scripts/build-bank.mjs` and `scripts/check-raw.mjs` do the validation, dedupe (exact, 3-word shingles over 0.6, and same-answer word overlap of 0.5) and id assignment. The Classic level order is derived at run time from the file order (append-only, tested to stay stable when questions are appended), not written at build time.

**The questions (read this before shipping)**
- 12 category files of 300 questions each (100 easy, 100 medium, 100 hard), 3,600 in all, written by 12 model agents in one pass each. Each agent was told to include only facts it was at least 95% sure of and to run the validator; each then listed what it trusted least. Those lists are in `content/review/flagged-by-writers.md`. The animals writer said its tier 3 is uneven. **No independent check was made**: a question can be wrong without being listed.
- 26 exact or near duplicates across categories were found by the build and replaced by hand after the agents finished (mostly easy science); the replacements were also checked only by the validator.
- Flags is text only (descriptions of flags); no pictures exist or are claimed.

**ASO claims that the app does not yet back up** (`ASO.md` was checked; it has no text from the other four apps)
- "Each question is checked for accuracy" is **not true yet**: see above. Remove or soften it until a fact-check pass and a spot check are done.
- "we keep adding more with regular content updates" needs EAS Update, which is not configured.
- "IQ & movie trivia" in the short description and "Logic and IQ rounds" in the long one: there is a "Logic & IQ" category of number series, riddles and deduction puzzles, but the plan's IQ Test mode (v1.1) is not built, so there is no IQ score. "boost your reasoning" is a claim nothing measures.
- "Geography quiz game: capitals, rivers, countries and flags": flags are asked from text descriptions, never shown.
- Everything else in the listing (12 categories, 3,000+ questions, offline, no sign-up, Daily challenge with streaks and freezes, Classic levels with stars, Category play, 60-second Blitz, lifelines, explanations, relaxed mode, text size, dark mode, no ads while answering, levels from Curious to Trivia Legend, stats) is built. `store.assets.test.ts` fails if the listing starts naming Pass & Play, an IQ Test, achievements, widgets or other unbuilt features, if it passes the Play limits, or if text from another app appears.
- The localized titles in `ASO.md` §9 were never checked with `check_metadata`; the French one is exactly 30 characters.

**Deviations from the plan**
- Milestones D3 and D4 were built together and are in one commit.
- Plan names: the engine lives in `src/domain` (the plan says `src/engine`), stores in `src/store`; the notification code is `src/notifications/reminder.ts`; routes `(onboarding)/welcome` and `(onboarding)/warmup-result` carry O1–O3 and O5–O7 (the warm-up O4 is the quiz screen in warm-up mode).
- Fonts: Inter through `@expo-google-fonts/inter`. Sounds: WAV (30 KB or less), not OGG. The explanation is a panel inside the quiz screen, not a sliding sheet. The lifeline-offer is a sheet in the quiz screen, not a route. The mode grid on Home is 2×2 (v1.1 modes are hidden).
- The plan's OS font scale "up to 1.5" is not capped (capping would break "respect the system font scale"); the layout was tested at a theme text scale of 1.3 only.
- The Blitz score and personal best are the number of right answers. Blitz shows an explanation after each answer with the clock stopped, so the 60 s is thinking time.
- Plan §6 O5 says "Your streak starts today"; only the Daily counts toward the streak, so the text says to play today's Daily Challenge to start it. The warm-up pays a flat 30 XP.
- The streak "20 h" guard blocks a second counted day within 20 h only when the UTC offset changed (a time-zone change); a late game followed by an early one in the same zone both count.
- Notifications: a week plus a day of one-off notifications planned on every app open, one a day. The "streak at risk" message replaces today's reminder at 20:30 (it is never a second notification); the comeback messages are the day 3 and day 7 reminders. All of them depend on the one reminder switch.
- The app-open ad is also held back for 10 s after a notification tap, a link or the share sheet (an in-memory window).
- A rewarded video that is not loaded says "Not available right now" at once instead of waiting; the shared layer's own 6 s wait is never used.
- Dependencies added beyond the Word Search set: `@expo-google-fonts/inter`, `expo-sharing`, `react-native-view-shot`.

**Shared package changes (for reconciliation with the other thread)**
- `packages/shared/src/consent/index.ts`: new `isConsentFormRequired()` (calls `AdsConsent.requestInfoUpdate()` and returns true only for status `REQUIRED`; never rejects). Tests added in `consent/__tests__/consent.test.ts`. The README line is in the `@shared/consent` block.
- `packages/shared/src/testing/adsNative.ts`: the fake SDK gained `AdsConsent.requestInfoUpdate`, `AdsConsentStatus`, `mockSdk.consent.status` and `mockSdk.consent.infoUpdateFails` (defaults keep every existing test unchanged).
- Nothing else in `packages/shared` was touched. The earlier `onFullScreenAdShown` and `MaxAdContentRating` exports are used as they came.

**Test that was flaky, and commits in a bad state**
- No flaky test in this app: the full suite passed under the container's own zone, `America/Los_Angeles` and `Pacific/Auckland`, and `npm run test:tz` passed in 7 zones.
- Jest prints about 38 `not wrapped in act(...)` warnings (a store was changed from the test body while a screen was mounted, mostly the text-size and relaxed-mode tests). No test depends on them and none fails because of them.
- `apps/habit-tracker`: `today.smoke.test.tsx` (3 tests) and `screens.smoke.test.tsx` (1 test) **fail whenever the container's real UTC date is later than the fixed `2026-10-08` the tests assume** (they did after UTC midnight on the day of this work) and pass with `TZ=America/Los_Angeles`. This is a date dependency in that app's tests, not caused by the shared changes above; it was not fixed because it is another app's code.
- No commit was pushed with a failing test. `npm run check` stopped twice: after milestone 5 (a missing string key, caught by `strings.test.ts`) and after milestone 6 (two tests whose expectations changed with the new rewarded offers); both were fixed before the commit. A real jest exit code aborts the gate (`set -euo pipefail`, no pipe into `tail`).
- Milestones 3 and 4 share one commit (the user asked for a commit per milestone).

**Things I could not verify**
- Everything in §4. The tests use fakes for MMKV, the ads SDK, notifications, audio, haptics, sharing, view-shot, Reanimated, gesture handler and the router; none of those fakes proves the real module behaves the same.
- That the question bank is correct, that Metro's lazy `require` of the 12 JSON files is fast on a phone, that the Gradle-merged manifest matches §5, and that `expo-audio`, `expo-sharing` and `react-native-view-shot` behave on Android 9 to 15.
- The first-answer time, the cold-start time and the animation frame rate.
