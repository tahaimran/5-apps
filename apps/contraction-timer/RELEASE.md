# Contraction Timer & Kick Count — release runbook and QA status

> **Nothing in this app has been run on a device or an emulator.** No Android build was made (no EAS build, no APK, no AAB), no ad
> was requested from Google, the consent form was never shown, no notification was ever delivered, and no screen has been looked at
> in a running app. Everything marked *verified* below was checked by Jest, `tsc`, `expo-doctor`, `expo export` and `expo prebuild`
> in a Linux container. Every item that needs a phone, an account or a store is **open**.
>
> **The timing logic has been checked only against unit tests and fixtures. It has not been used by a real person in labour, timed
> against a stopwatch on a phone, or reviewed by a midwife, doctor or lawyer.** This is a health-adjacent app people will use under
> stress. Do not put it in front of the public before the items in §7 are closed by a human.
>
> **Scope:** this build covers plan milestones 1 to 8 (Day 1 to Day 8 of `DEVELOPMENT_PLAN.md` §17; the status lines are in §19).
> Milestone 9 (store listing, Data safety, Health apps declaration, privacy policy, screenshots, Maestro, release build, testing
> tracks) is **not built**; see §6 for the full list of what is missing.

## 1. Verified in the repo (automated, repeatable)
```bash
cd apps/contraction-timer
npm run check             # the pre-commit gate: tsc (app), tsc (shared), jest, expo-doctor, expo export; stops at the first failure
npx jest                  # 41 suites, 767 tests passing (4 skipped: the clock-change cases, which only run in zones that have one); domain, stores, screens, notifications, ads rules and wiring, a11y, config, assets, release
npm run test:tz           # midnight, daylight saving, due-date and summary maths in 7 time zones (US, UK, Lord Howe, India, Auckland, São Paulo, UTC)
npx expo prebuild --platform android --no-install --clean   # native config plugins resolve; read the manifest; then delete android/
```
After touching `packages/shared`, also run `npx tsc --noEmit && npx jest` in the three finished apps (nothing in `packages/shared` was
changed for this app; see §6). `scripts/check.sh` uses `set -euo pipefail` and pipes nothing into `tail`, so a failing Jest run aborts
the commit: `npm run check && git commit`.

What the automated checks actually cover:
| Area | How |
|---|---|
| Timing core | One button toggles a contraction; the open session is written to MMKV before the screen changes; a running timer is `now − startedAt` and nothing else; a 500 ms double-tap guard; undo of the last tap; clock set back never gives a negative time; kill and relaunch rebuilt from the fake disk, including a kill between "file the session" and "clear the open one" and a file with two running contractions (`session.test.ts`, `sessions.test.ts`, `timer.screen.test.tsx`) |
| Stats | Duration, start-to-start interval, the last-hour window, outlier rules (under 10 s greyed out and restorable, gaps over 30 minutes dropped), duplicates, overlaps, reversed times, a contraction that starts after "now" (`stats.test.ts`) |
| Pattern rule | 5-1-1, 4-1-1, 3-1-1 and a custom rule against fixtures: match, 10 of 11 contractions, 6-minute gaps, 40-second contractions, irregular gaps with a good average, mis-taps, a pattern that stopped, the contraction being timed; the once-per-episode banner and its 30-minute re-arm (`pattern.test.ts`, `sessions.test.ts`) |
| Idle and guards | "Still going?" after 3 minutes, the 2-hour prompt and "Keep", the 6-hour automatic end, a forgotten running contraction closed at its own start, the clock-change toast (saved-time comparison and a wall-versus-monotonic check) (`session.test.ts`, `clock.test.ts`, `timer.screen.test.tsx`) |
| History and editing | List, detail, edit start and length, tag, note, leave out or count again, join, delete with a 5-second undo, add a missed one, overlap and future refusals with reasons, delete a session after a confirmation (`history.test.tsx`) |
| Summary and PDF | The §11 text summary (including the plan's own example numbers), caps and notes, 12/24 h, open and empty sessions, four PDF looks, an inline chart that starts at zero, HTML escaping of typed notes, no network requests, PDF files deleted from the cache after 24 hours (`summary.test.ts`, `pdf.test.ts`, `history.test.tsx`) |
| Time zones | A session across local midnight, across a daylight-saving jump (lengths and gaps exact, printed span is real elapsed time), gestational age and weekly cards by calendar date (`tz.test.ts`, `summary.test.ts`, `dueDate.test.ts`; `npm run test:tz`) |
| Kicks | Target 5–20, one-second flutter guard, undo, saved on every tap, kill and relaunch, the 2-hour card and the 3-hour automatic close, history and the time-to-target line (`kicks.test.ts`, `kicks.screen.test.tsx`) |
| Due date and weeks | LMP with 21/28/35-day cycles, conception, IVF day 3 and 5, a known date, leap year, daylight saving, the plan's validation limits, trimesters, past 42 weeks, display clamp to 44; weeks 4–42 present, ordered, three notes each, no predictive wording (`dueDate.test.ts`, `weeks.test.ts`, `pregnancy.test.tsx`) |
| Checklists | Prefilled hospital bag (Mom, Partner, Baby) and birth plan, tick, add, delete, reorder inside a group, progress, templates added once, text export (`checklists.test.ts`, `pregnancy.test.tsx`) |
| Notifications | Kick reminder: permission only after "Turn on", one daily trigger, stops 21 days after the due date, off when the phone's permission is taken away; weekly size cards at 10:00 local, only with permission; "session left open" note scheduled on each stop, cancelled by the next tap, never asks for permission; a tap opens only the Timer or Kicks tab; channels (`kickReminder.test.ts`, `weekly.test.ts`, `sessionOpen.test.ts`, `responses.test.tsx`, `kicks.screen.test.tsx`) |
| Onboarding | Every screen's exact copy, the "I understand" gate, a due date that the person never touched is never saved, Skip everywhere, resume after a kill, consent before the Timer (and deferred after Skip), permission only when the reminder switch is turned on, landing on Kicks for "kicks only" on day 1 only (`onboarding.test.tsx`, `answers.test.ts`, `landing.test.ts`) |
| Partner and night mode | ×1.4 type, fewer controls, the tab bar hidden while a contraction runs, the "Exit partner mode" chip; Night in one tap and back (`timer.screen.test.tsx`) |
| Settings and More | Every switch saved, the rule editor within the plan's ranges, theme, units, kick target, rate and feedback links, delete all data with two confirmations and a check that every key, notification and cached PDF is gone (`more.test.tsx`) |
| Ads rules | Every row of plan §12 "never show when" as a pure function with reasons, plus the stricter "nothing while a session or kick count is open" (`adRules.test.ts`); then against the real `@shared/ads` with a fake AdMob SDK: consent before the SDK and not before the disclaimer, rating G, banners only where listed, none on Timer/Kicks/onboarding/session detail, none and removed at once when a session opens, the native card position, the single interstitial with its read time, gaps and daily cap, rewarded unlocks only when earned and refused during a session, the app-open ad on warm starts (`ads.integration.test.tsx`, `ads.start.test.tsx`) |
| Ad imports | A static scan stands in for the plan's lint rule: no app file imports the AdMob SDK, no ad module is reachable from the Timer, Kicks or onboarding code, full-screen ads are requested from two helper files only (`ads.static.test.ts`) |
| Accessibility | Every screen at font scale 1.3 and 2.0 in light, dark and night: a label on every Pressable, 56 dp targets (the audit in `src/testing/ui.tsx`); a static scan for hard-coded copy, missing labels and anything that turns off font scaling (`a11y.render.test.tsx`, `a11y.static.test.ts`) |
| Contrast | Body text 4.5:1 in all three themes, button labels 3:1 (large text), control edges 3:1, the banner text 4.5:1, night uses no blue (`contrast.test.ts`) |
| Config | Package equals the cross-promo catalog, permissions and blocked permissions, **Android automatic backup off**, target API 36, test AdMob id until EAS sets one, no real id in git, `.env.example` matches the placements (`config.test.ts`); the manifest was read after `expo prebuild` |
| Store files | Icon and graphic sizes, listing limits counted as Play counts them, banned words, no text from the other four apps, no "detects labour" promise, the disclaimer is in the description (`store.assets.test.ts`) |
| Honesty of this file | `release.test.ts` fails if this document stops saying nothing ran on a device or that the timing logic was never used in labour, or if a device QA row is ticked |

No test was flaky: three consecutive full runs at the end gave the same result (41 suites, 767 passed, 4 skipped), and the suite ran green at each of the eight milestone commits. Two harness mistakes of my own were found and fixed while writing tests
(a `jest-each` row with a missing third value, which Jest treats as a `done` callback, and a mock that returned `undefined` where the
real haptics API returns a promise); neither was in the app.

## 2. One-time setup (needs your accounts)
1. **Expo/EAS:** `cd apps/contraction-timer && eas login && eas init` (adds `extra.eas.projectId`; commit it).
2. **Package name:** `com.fiveapps.contractiontimer` in `app.config.ts` is shared with `packages/shared/src/crosspromo/catalog.ts`
   (a test keeps them equal). The plan says the studio prefix is chosen once and never changed: decide the final application ID
   *before the first upload* and update both.
3. **AdMob:** create the app and 8 ad units (`.env.example` lists the variables, one per placement) and set them as EAS environment
   variables (`eas env:create`), never in git. Register your own phone as a test device. **In the AdMob console** (plan §12, not done):
   block the sensitive categories listed there (dating, gambling, alcohol, sexual and reproductive health, weight loss, cosmetic
   procedures, get-rich-quick, politics, religion, drugs and supplements, astrology, shocking content, personal loans), set the
   maximum ad content rating to G, and decide about mediation (the plan says after about 1,000 daily users). The app also asks for G in code.
4. **Privacy policy:** not written (milestone 9). When it exists, host it and set `EXPO_PUBLIC_PRIVACY_POLICY_URL` (More → Privacy and ads shows
   the link only when it is set). Set `EXPO_PUBLIC_CONTACT_EMAIL` for "Send feedback" (hidden without it).
5. **app-ads.txt:** host it at the root of the developer website listed in Play Console.
6. **Play Console:** create the app, enrol in Play App Signing, add a service account for `eas submit`, and complete the Health apps declaration (§7).

## 3. Build and ship
```bash
eas build --profile development --platform android   # dev client (ads and MMKV need a native build)
eas build --profile preview     --platform android   # APK for testers and screenshots
eas build --profile production  --platform android   # AAB, versionCode auto-increments
eas submit --platform android                        # uploads to the internal track
```
Internal testing → device QA (§4) → closed testing (the plan says 12 testers for 14 days on a new personal account) → production at 20% → 100%
(watch crash-free ≥ 99.5% and ANR). Read the pre-launch report. **Do not start closed testing before the §7 reviews.**

## 4. Device QA matrix (all open until someone runs them)
A quick way to see ad decisions on a development build: More → "Ad rules (development builds only)" lists every placement, whether it would show now and why not.

| Area | Check | Status |
|---|---|---|
| Build | The dev client builds with EAS, installs, launches; the splash shows the icon on cream (dark: near black), then onboarding | open |
| Resume | Kill the app mid-contraction with a swipe from Recents **and** with `adb shell am kill`, reopen 3 minutes later: about 3:00 elapsed (±1 s), "Timing restored", the same button state | open |
| Resume | Reboot the phone during a session: the session is restored, the idle rules apply (prompt after 2 h, automatic end after 6 h) | open |
| Keep awake | The screen stays on while a session is open and the Timer is in front (also while resting between contractions), and goes back to the phone's timeout on another tab, after ending the session and when the app is backgrounded; the effect on battery over a long night | open |
| Haptics | Heavy on Start, two medium on Stop, a warning when the banner appears, light per kick; Settings → Vibration turns all of it off; the feel is right through a phone case | open |
| Touch | The 220 dp button is reachable with one thumb on a 6.7" phone and on a small phone; the 24 dp hit slop does not cause stray taps; the 500 ms double-tap guard feels right | open |
| Long press | A press held for 600 ms opens "Undo last tap?" and does **not** toggle the timer; check that a slow, firm press while stopping a contraction is not mistaken for it (the contraction would keep running) | open |
| Scroll lock | The Timer button and the kick counter inside a scroll view **never scroll the page** under a sliding thumb, also at 200% font size where the page overflows (the page's scrolling is switched off while a finger is on the button; this is untested on a real touch screen) | open |
| Night mode | In a dark room: the Night palette is readable and does not light the room; contrast of the Start/Stop labels, the digits and the banner; the status bar; the splash in Night; the OLED black | open |
| Partner mode | Readable from arm's length; the tab bar goes while a contraction runs and the "Exit partner mode" chip is easy to hit; "Tell me when it starts" | open |
| Text size | Android font size 1.3× and 2.0× and "display size: Largest" on every screen: nothing clipped or overlapping, the digits fit (they shrink to fit; Jest checks targets and labels, not clipping) | open |
| TalkBack | A full walk through onboarding, the Timer ("Start contraction" / "Stop contraction, 42 seconds"), the stats, the banner, history and detail rows, the editor, kicks, the checklists, settings; the announcement after each stop; the live regions are not chatty | open |
| Reduce motion | With animations off the ring around the button is still and everything still works | open |
| Look | Every screen in light, dark and night looks right; the icon, adaptive icon and monochrome icon in a launcher; the week list and the emoji on older Android versions (the plan's illustrations are emoji only) | open |
| Clock | Set the phone clock back and forward during a session, change the time zone and cross a daylight-saving change: the toast appears, times are right, nothing negative or lost | open |
| Pattern | Time real contractions (or taps on a stopwatch) to a 5-1-1 pattern and check the banner appears once, stays dismissed, and re-arms after 30 quiet minutes; also with 4-1-1, 3-1-1 and a custom rule | open |
| Idle | The "Looks like things calmed down" prompt after 2 hours (change the clock with `adb`), "Keep", the automatic end after 6 hours, the "Still timing?" notification (needs notification permission) | open |
| History | The list, the detail, editing with the plus and minus buttons at large text, the 5-second undo, adding a missed contraction, deleting a session | open |
| Share | Share as text and as PDF to Gmail, WhatsApp and Messages on Android 8, 10, 13 and 15; the PDF looks right in each theme; the file is gone from the cache after a day; works in airplane mode | open |
| Kicks | Counting with a wet or shaky finger; the flutter guard; the 2-hour card and the 3-hour close; history; the reminder (below) | open |
| Pregnancy | Due date by each method, the week list scroll, the cards at large text, imperial and metric, the nudge in weeks 34, 36 and 37 | open |
| Checklists | Ticking, adding with the keyboard open (the banner hides), reordering, the templates after a rewarded video | open |
| Onboarding | First launch to the first timed contraction in under 60 seconds; Skip on each screen; killing the app on each screen resumes it; the Skip-then-disclaimer sheet; "kicks only" lands on Kicks on day 1 | open |
| Consent | The UMP form (use the EEA debug geography) appears after the last onboarding screen and before the Timer; after Skip it appears only after the first move away from the Timer and never during a session; "Change my ad choices" appears only where the law requires it; the app works if the form fails or the phone is offline | open |
| Ads | Test ids in a dev build, real ids in a release build; banners on the two history lists, the week list and article and the checklists, never on the Timer, Kicks, onboarding or a session detail; nothing at all, and no layout jump, while a session or kick count is open | open |
| Ads | The native card after the 3rd week card is labelled "Ad", falls back cleanly with no fill, and never appears in a session | open |
| Ads | The one interstitial on closing a week article after 20 seconds of reading; never with a session open or within 2 minutes after one; at most 4 a day and 3 minutes apart; none on install day, the first launch or in Partner mode; the app never waits for an ad that is not ready | open |
| Ads | The app-open ad only on a warm start after 4 hours, never within 30 minutes of a session, never from a notification or link (the ordering of the foreground event and the notification response is best effort) | open |
| Ads | Rewarded unlocks for a PDF look and a checklist list: granted only when the video completes; with no fill the message appears and the default PDF still works; "Available after your session" while a session is open | open |
| Notifications | The Android 13+ permission prompt appears only after "Turn on"; the daily kick reminder arrives at the chosen time, after a reboot, in Doze (`adb shell dumpsys deviceidle force-idle`), after a time-zone change; it stops 21 days after the due date | open |
| Notifications | The weekly size card arrives at 10:00 on the first day of each week; its channel is silent; tapping any notification opens the Timer or Kicks tab (app killed, backgrounded, open); revoking the permission in system settings stops them without a crash | open |
| Notifications | The reminders on a Samsung, a Xiaomi and a Pixel (OEM battery managers may delay or drop them; the app has no battery guide) | open |
| Privacy | More → Delete all data (two confirmations) returns the app to the first screen with nothing left, and cancels reminders; Android backup is off (`adb shell dumpsys backup`); the policy link works once set | open |
| Airplane mode | Every feature works (ads absent, no layout jump over the button, PDF and text sharing still work) | open |
| Performance | Cold start time; the Timer's 250 ms tick does not warm the phone or drain the battery over an hour; the week list scrolls smoothly | open |
| Size and native libs | AAB size; 16 KB page-size alignment of the native libs (mmkv, reanimated, worklets, svg, gesture handler, ads) with `zipalign -c -P 16 -v 4 app.aab` | open |
| Devices | The plan's three devices: a low-end Android 8–10 phone, a mid Android 13 phone, a large 6.7" phone; and a tablet | open |
| Usability | Someone who has never seen the app times 14 contractions without asking "which button?"; a partner in the dark; a pregnant person near term; a midwife reads the summary | open |
| Moto G class | Cold start and the Timer under load on a low-end phone such as a Moto G | open |

Handy commands:
```bash
adb shell dumpsys package com.fiveapps.contractiontimer | grep permission   # compare with the list in §5
adb shell am kill com.fiveapps.contractiontimer                             # kill the process (not force-stop) to test resume
adb shell dumpsys backup | grep -i contractiontimer                         # backup must not list the app
```

## 5. Play Console content
Only the icon and the feature graphic exist (made by `scripts/make-assets.mjs`; the feature graphic is a drawing, not a screenshot).
| Item | Where | Status |
|---|---|---|
| Listing title and short description | `ASO.md` (limits checked by a test) | ready, **but see "ASO claims" in §6** |
| Full description | `ASO.md` (3,320 characters as Play counts them; Applyra `check_metadata` valid on 2026-10-08) | ready, **claims need the edits listed in §6** |
| Icon 512, feature graphic 1024×500 | `store/` | made, **never viewed on Play** |
| 8 screenshots 1080×1920, promo video | — | **to capture on a device** |
| Privacy policy, Data safety, Health apps declaration, content rating, app-ads.txt, target audience 18+ | — | **not written** (milestone 9, and see §7) |
| Permissions | `app.config.ts` + `src/__tests__/config.test.ts`; manifest read after `expo prebuild` | done |
| Target API | 36 (a test checks ≥ 35) | done |

Declared in `app.config.ts`: `POST_NOTIFICATIONS`, `VIBRATE`, `com.google.android.gms.permission.AD_ID`. Added by libraries: `INTERNET`,
`ACCESS_NETWORK_STATE`, `WAKE_LOCK` (the ads SDK) and `RECEIVE_BOOT_COMPLETED` (`expo-notifications`, so the daily reminder survives a reboot).
The plan's list had no `RECEIVE_BOOT_COMPLETED`; I kept it because without it the kick reminder would stop after a reboot. Blocked:
`SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` (added by
`expo-file-system`'s own manifest) and `SYSTEM_ALERT_WINDOW`. There is no audio plugin, so none of the microphone and foreground-service
permissions that `expo-audio` adds in the sister apps. **The merged manifest is only produced by Gradle**, so the final permission list of a real
build still has to be read from the built AAB. `expo-keep-awake` adds no permission; it sets a window flag.

## 6. Decisions, deviations and known gaps
**Found in the repo**
- `ASO.md` of this app had no text from another app (a test guards that). Its listing text makes claims to fix or confirm before shipping. **ASO claims**:
  1. The pattern-alert sentence quoted in the description ends "Consider calling them now." and is not the app's wording ("Your last hour matches the
     5-1-1 pattern your provider mentioned. It may be time to call them."); "now" is more urgent. The app's wording is the plan's.
  2. The heading "LABOR PATTERN ALERT" and the phrase "when labor might be starting" lean toward detecting labour, which the plan forbids ("detects
     labor", "tells you when to go"). The plan's own feature name is "Pattern alert".
  3. "so you can notice your baby's usual rhythm" (kick counter) and the screenshot caption "see your baby's rhythm" imply that a normal pattern can be
     read from the history. The plan does not claim that; this needs clinical review or removal.
  4. "Send a clean text summary … in two taps" is not true: from the banner it is Share summary → Share as text → pick an app (three taps); from
     history it is more.
  5. "Keeps timing even if your phone locks or the app is closed" is true in the sense that elapsed time is computed from the saved start time; there
     is **no** ongoing notification or foreground service (that is v1.1). Check the wording on a device.
  6. ASO §7's soft rating pre-prompt ("Is Contraction Timer helping you feel prepared?") is **not built** on purpose: sending only happy people to the
     review dialog is against Google Play's review rules.
  7. "Works one-handed and in the dark", "Screen stays awake" and "haptic feedback on every tap" are device checks (§4).
- **Habit Tracker's Jest run fails on any day but 2026-10-08.** `apps/habit-tracker/src/__tests__/today.smoke.test.tsx` (3 tests) fakes the clock
  to 2026-10-08 but the app's "today" store reads the real date when it loads, so the entries are saved under the real date. In this container
  (UTC, 2026-10-09) it fails; with `TZ=Pacific/Honolulu`, where the local date is still 8 October, all 10 tests pass. It is not caused by this
  build (nothing in `packages/shared` or in that app was touched); I did not change that app. The one-off failure noted in Word Search's release
  notes was probably the same thing at midnight. The other three apps and `packages/shared` pass.
- No commit of this build was pushed with a failing check: each of the eight milestone commits passed `npm run check` (tsc, shared tsc, jest,
  expo-doctor, expo export) first. The gate refused one attempt (a type error in a test) and I fixed it before committing. Two smaller slips: the plan's
  Day 7 checkbox was left unticked in the milestone 7 commit and ticked in the final one (`release.test.ts` now checks all eight), and the kick counter's
  scroll lock was added after milestone 8, in the final commit.

**Changes to `packages/shared`:** none. Everything this app needed was already there (`setAdGuard`, `onFullScreenAdShown`, `MaxAdContentRating`,
`scheduleDaily`, `scheduleSeries`, the onboarding `onSkip`/`initial`/`onProgress` options).

**Deviations from the plan**
- **Folders and names.** Logic is in `src/domain` (the plan says `src/logic`), stores are `sessions.ts` and `kicks.ts` (not `sessionStore.ts`), one onboarding
  route `app/onboarding.tsx` (not five routes in `(onboarding)/`), and `src/features/...` as in the plan. MMKV keys have no `ct.` prefix (the store id is the prefix).
- **Data model.** `Settings` has no `theme` (the shared theme owns it) and gains `units`; **night mode is kept in the shared theme's `high-contrast` slot**
  because adding a fourth mode to `@shared/theme` would break the finished apps' `Record<ThemeMode, …>` types (only `src/theme/mode.ts` and `tokens.ts`
  know). `Contraction.ignored` is three-valued (undefined = decide by the 10-second rule); `ContractionSession` gains `pattern` and `snoozedAt`;
  `ruleAtStart` is **the rule in effect**, replaced (and the match history reset) if the rule is changed during a session; `Meta` gains rating counts,
  `lastSessionEndedAt`, `lastKickEndedAt`, `lastKickSoftLimitAt`, `launches`, `onboardingDay`, `coachMarkShownAt`. `ongoingNotif` is stored but unused (v1.1).
- **Libraries.** No `date-fns`, `nanoid`, `i18next`, `expo-font`/Nunito or Sentry: date maths uses UTC day numbers, ids are a time-plus-random string, strings
  use `@shared/i18n`, and the system font is used (it scales with the phone and nothing caps it). Dates and times are set with plus and minus buttons, not a picker
  library. The only libraries added over the sister apps are `expo-keep-awake`, `expo-print`, `expo-sharing`, `expo-file-system` and `expo-store-review`.
- **Colors.** Where the plan's palette falls under WCAG AA it was adjusted: dark ink on the teal Start button (white was 3.3:1), `textMuted` `#5F6374` in light
  (was 4.3:1 on the warm surface), night `textMuted` `#D65A4B` (was 3.9:1), night `onPrimary` `#FF8272` (3.8:1, large text only), and stronger control borders.
  The big buttons have a text-colored ring because night's dark red fill is close to black. The plan's own night palette is not strictly "no blue/green above 30%".
- **Pattern rule.** The plan's rule is implemented as written, plus **one extra condition**: the newest contraction must have started within twice the rule's gap
  (10 minutes for 5-1-1), so a pattern that stopped does not raise "matches" later when the window happens to reach 90%. Clinically unreviewed.
- **Double-tap guard.** A second tap within 500 ms is ignored, so a shaky double tap cannot stop a contraction that just began. Not in the plan.
- **Ads are stricter than the plan.** While a contraction session or kick count is open (also while resting between contractions) *no* ad of any kind is requested or
  shown, and rewarded buttons are off. The plan only forbade the full-screen formats and the screens around the button. Consent never starts on the Timer button's
  screen or mid-session, and never before the disclaimer is acknowledged (so after Skip the ads wait for "I understand").
- **Native card positions** are after the 3rd card and then every 8 (3, 11, 19, …); the plan's "1 per screen view" cap was read as per position.
- **Privacy.** `android:allowBackup` is `false`: Android's automatic backup would copy the MMKV files (contractions, due date) to a Google account.
  Delete all data keeps the install date and the ad frequency counters, not personal data, so deleting cannot be used to get around the ad limits.
- **Onboarding.** Skip is top right on screens 1–4 (the shared flow shows none on the last screen), so screen 5 has its own "Skip" under the button. A starting date in the
  due-date form is never saved or shared until the person has moved it; the form starts with no date chosen. The third choice, "Conception or IVF date", opens a
  second choice. The disclaimer sheet after Skip is shown once per launch (and never over a session) until it is acknowledged, not once ever. If the consent form has not answered after 10 seconds the first screen moves on to the Timer (the shared layer has no timeout of its own). The ad and rating "quiet times after a session" count from the moment the session was closed, not from its last contraction.
- **Kicks.** The plan words the 2-hour message twice (F10 and §5.3); the longer §5.3 wording is used. History has no row delete.
- **Notifications.** The weekly size card is "on by default" but can only be scheduled when the notification permission already exists (it is asked for when the person turns
  on a reminder, never on its own), so for most people it is effectively off until they enable the kick reminder or the weekly switch. The "session left open" note has
  the same rule and uses the `timing` channel. The custom-rule banner sentence ("Your recent contractions match the pattern you set in the app. It may be time to call your provider.")
  is **mine**: the plan only words the 5-1-1 style. The rule editor's note ("Always follow what your provider told you…") and the explanations in the stats sheets are also mine.
- **Content.** Weeks 4–42 (`assets/content/weeks.en.json`) and the checklists were written for this build, with commonly published average sizes. They are **not** medical content
  that has been reviewed; the About screen therefore claims no review. The week article shows an emoji where the plan says "illustration". English only (other locales are v1.1).
  The plan's text-summary example is dated "Tue 4 Nov 2026" but 4 November 2026 is a Wednesday; the app prints the real weekday. The text summary lists the 30 newest contractions
  (the PDF lists all). Units follow the phone's region (US and UK: inches and pounds), with a switch in Settings.
- **Partner mode** scales the Timer's type with a nested theme provider (×1.4) and the button to 280 dp; other screens keep their size.
- **Consent** is run by `@shared/ads`' `initAds` (which runs UMP itself) rather than by a separate `requestConsentIfNeeded` call.
- **Time handling.** "Clock change" detection uses the saved-time comparison at every tap and a wall-versus-monotonic check while the Timer is in front; the monotonic clock
  stops when the phone sleeps, so the baseline is retaken on every return to the foreground.

**Not built (plan items outside milestones 1 to 8, or skipped)**
- Milestone 9 in full: privacy policy, Data safety, Health apps declaration, content rating, screenshots, promo video, Maestro flows, `app-ads.txt`, the QA run and the testing tracks.
- Crash reporting (Sentry) and any analytics. The plan lists them, but each is a network SDK in a health-adjacent app and a privacy decision for a human; the in-app text says
  health entries never leave the phone. If added later, Data safety, the privacy text and the policy must change with it.
- AdMob mediation adapters, the AdMob console filters, real ad unit ids.
- v1.1 and later: the ongoing notification with Start and Stop actions, the app shortcut, water-break and notes events, the contraction chart, other languages, hydration and weight
  logs, the postpartum "Baby is here" flow, multiple pregnancies, backup and restore, the Wear OS tile.
- From the retention loops: the shareable weekly card image, the congratulations screen, the postpartum handoff card (reminders simply stop 21 days after the due date).
- ASO §7's rating pre-prompt (on purpose, see above).

**Behaviour you may want to change**
- A 600 ms press on the big button opens "Undo last tap?" and does not toggle; a very slow press while stopping would leave the contraction running.
- A forgotten running contraction is closed at its own start (zero length, greyed out) when the session ends by itself after 6 hours; it is not invented.
- The screen stays on while a session is open and the Timer is in front, also while resting, for up to six hours.
- Opening the app from a notification counts as an "external open" for the app-open ad rule, but the order of Android's foreground event and the notification response is not guaranteed.
- A rating prompt is only requested after a kick count reaches its target or a checklist reaches 100%, with the rules of ASO §7; it never appears during or within 24 hours of a contraction session.

## 7. Clinical, legal and policy review needed before release (open items for a human)
None of this was done, and none of it can be done by Jest.
1. **Health apps declaration (Play Console → App content).** Choose the category, state that the app is not a medical device, makes no diagnosis and has no regulated medical function,
   and check that the pattern alert is not a "regulated medical functionality" in the markets you ship to (for example FDA wellness policy, EU MDR, UK MHRA). Needs a person who can sign it.
2. **Disclaimer wording.** The text in onboarding screen 2, More → "Not medical advice", the sheet after Skip and every export footer is the plan's wording. Have it reviewed by a lawyer for the
   countries you target. It names "emergency services" in general; no regional emergency number is shown.
3. **The pattern alert** (5-1-1 / 4-1-1 / 3-1-1 and custom ranges, the 80% tolerances, the 10-second mis-tap rule, the extra recency condition) and every sentence around it: a midwife or obstetrician must
   confirm the logic and the wording ("It may be time to call them").
4. **The week cards and the checklists**: all 39 cards (sizes, weights, notes, "questions for your next appointment") and the hospital bag and birth plan lists must be reviewed by a qualified midwife
   or doctor, with sources, before release. Only then may About credit a reviewer (the plan says so); nothing is credited now.
5. **The kick counter's messages and limits** (target 10, the 2-hour message, the 3-hour automatic close, the one-second flutter rule) against the guidance your target countries give; they differ.
6. **The summary and PDF contents** (what a provider needs to see), the "mostly strong" line, and whether the birth plan text belongs in a share.
7. **The store listing**: the claims in §6 "ASO claims", "Pregnancy & reproductive health" wording, the category choice, screenshots that show real UI only.
8. **Privacy policy and Data safety.** Health entries stay on the phone; Google AdMob and UMP receive device data; Android backup is off. Decide about crash reporting before writing the form. Health data
   is special-category data in the EU even when it is local.
9. **Ads near pregnancy.** The AdMob category blocks and the G rating are console settings; decide whether to keep banners near the due-date and week content, and whether any ad should ever appear after
   pregnancy loss content (none exists, but the week list can be opened by anyone).
10. **A usability study** with pregnant people and partners, in the dark and one-handed, and with a screen reader. The plan's persona success moments are claims about people, not tests.
11. **The timing itself** has been checked only against unit tests. Before trusting it, time a real series against a stopwatch on a real phone, kill it, reboot it, change its clock.

## 8. Final run (this build)
`npm run check` passed on the last commit; three full Jest runs in a row were identical (41 suites, 767 passed, 4 skipped); `npm run test:tz` passed in all 7 zones. Re-run the other apps after any `packages/shared` change: at the time of this build Water Reminder (554 tests), Word Search (505) and `packages/shared` (244) pass, and Habit Tracker has the date-dependent failure described in §6.
