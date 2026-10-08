# Sipling — release runbook and QA status

> **Nothing in this app has been run on a device or an emulator.** No Android build was made (no EAS build,
> no APK, no AAB), no ad was loaded, no notification was ever delivered, and no screen has been looked at in
> a running app. Everything marked *verified* below was checked by Jest, `tsc`, `expo-doctor`, `expo export`
> and `expo prebuild` in a Linux container. Every item that needs a phone, an account or a store is **open**.

## 1. Verified in the repo (automated, repeatable)
```bash
cd apps/water-reminder
npx tsc --noEmit && (cd ../../packages/shared && npx tsc --noEmit)
npx jest                  # 40 suites, 554 tests: domain, stores, notifications, screens, a11y, config, assets
npm run test:tz           # reminder planning and day keys in 7 time zones (DST, half-hour offsets, southern hemisphere)
npx expo-doctor           # 21/21
npx expo export --platform android --output-dir /tmp/wr-export   # Metro bundle sanity (Hermes bytecode, ~4 MB)
npx expo prebuild --platform android --no-install --clean        # native config plugins resolve; then delete android/
```
Also re-run after touching `packages/shared`: `cd apps/habit-tracker && npx tsc --noEmit && npx jest`
(425 tests pass with the shared changes made for this app).

What the automated checks actually cover:
| Area | How |
|---|---|
| Goal calculator | 12 sample profiles incl. the plan's 62 kg example, floor and cap, kg and lb (`goal.test.ts`) |
| Reminder schedule | wake + 30 / bed - 30, 4 to 16 a day, overnight bedtime, quiet blocks, weekdays (`schedule`, `reminderPlan` tests) |
| Auto-skip, goal reached, snooze | planner and scheduler against a fake notification system (`scheduler.test.ts`, `actions.test.tsx`) |
| Notification actions | "Add" and "Snooze" handlers, background-task handlers, de-duplication of one response arriving twice |
| Day rollover and DST | logical day at wake - 2 h, in 7 time zones and on transition days (`qa.dst.test.ts`) |
| Streaks, freezes, plant stages | `streak.test.ts`, `plant.test.ts`, store tests |
| Onboarding | every step, Skip, "I already know my goal", resume after a kill, consent timing, denial note |
| Ads rules | every row of the plan's "never show" column as a pure function, plus the installed veto |
| Backup | round trip, malformed and hostile files, re-sharding, rebuilt summaries (`backup.test.ts`, screen tests) |
| Accessibility | every screen at font scale 1, 1.3, 1.6 and 2.0, light and dark: labels on every Pressable, 48 dp targets, 56 dp quick-add chips; static scan for hard-coded copy |
| Store assets | icon and feature graphic sizes, listing limits, demo backup, Maestro flows only use text that exists |
| Permissions | declared list and blocked list (no exact alarms, no battery-optimization prompt), checked in `config.test.ts` and in the prebuild manifest |
| Performance (computation only) | 4 years of data: streak catch-up, charts, planning, export and import (`qa.perf.test.ts`) |

## 2. One-time setup (needs your accounts)
1. **Expo/EAS:** `cd apps/water-reminder && eas login && eas init` (adds `extra.eas.projectId`; commit it).
2. **Package name:** `com.fiveapps.sipling` in `app.config.ts` is a placeholder shared with
   `packages/shared/src/crosspromo/catalog.ts` (a test keeps them equal). Decide the final application ID
   *before the first upload* (it cannot change later) and update both.
3. **AdMob:** create the app and 6 ad units (`.env.example` lists the variables). Add them as EAS environment
   variables (`eas env:create`), never in git. Register your own phone as a test device in AdMob.
4. **Privacy policy:** finish `store/privacy-policy.md`, host it, set `EXPO_PUBLIC_PRIVACY_POLICY_URL`.
5. **app-ads.txt:** fill in `store/app-ads.txt` and host it at the root of the developer website listed in Play Console.
6. **Play Console:** create the app, enrol in Play App Signing, add a service account for `eas submit`.
7. **Check the new full description:** ASO.md now holds the Sipling description (it used to be the Quizora
   trivia text, see §6). Run Applyra `check_metadata` on it; the old result was for the wrong text.

## 3. Build and ship
```bash
eas build --profile development --platform android   # dev client (ads need a native build)
eas build --profile preview     --platform android   # APK for testers and screenshots
eas build --profile production  --platform android   # AAB, versionCode auto-increments
eas submit --platform android                        # uploads to the internal track
```
Internal testing → device QA (§4) → **closed testing** (12 testers for 14 days on a new personal account) →
production at 20% → 100% (watch crash-free ≥ 99.5%, ANR < 0.3% for 48 h). Read the pre-launch report.

## 4. Device QA matrix (all open until someone runs them)
Reminder tests need a quick way to make the next reminder come soon: Settings → set "Wake up" to about 35
minutes ago (the first reminder is wake + 30 min), keep a 2,000 to 2,300 ml goal.

| Area | Check | Status |
|---|---|---|
| Reminders | arrive on time-ish, only between wake + 30 and bed - 30; none outside; overnight bedtime (02:00) works | open |
| Reminders | channel "Water reminders" plays `drop.wav` with the short vibration; "Gentle reminders" is silent; the lock screen shows the text | open |
| Actions | "Add 250 ml" and "Snooze 15 min" with the app **open**, **in the background** and **killed** on a Pixel 8 (Android 15), a Samsung A-series (Android 14) and a Xiaomi (Android 13). Killed-app logging relies on `Notifications.registerTaskAsync` (headless JS). **Not device-verified; the plan's fallback (`opensAppToForeground: true` plus a "Logged" toast route) is not built.** | open |
| Actions | the button label follows the preferred cup, the unit and the snooze time after changing them in Settings (the category is re-registered; whether Android re-reads it for already-scheduled notifications is unconfirmed) | open |
| Actions | TalkBack reads the buttons as "Add 250 ml" and "Snooze 15 min" (plan §7.5 wanted "millilitres"; Android notification buttons only take a title) | open |
| Auto-skip | log a drink within 30 minutes before a reminder: that one does not fire, the next one does | open |
| Goal reached | reaching the goal cancels the rest of the day's reminders; undo brings them back | open |
| Doze | `adb shell dumpsys deviceidle force-idle`, then `adb shell dumpsys deviceidle unforce`: reminders arrive (late is acceptable) | open |
| Reboot | after `adb reboot`, pending reminders still fire; first foreground re-plans | open |
| Permission | revoke notifications in system settings: Today shows "Reminders are off"; "Turn on" asks again, or opens settings if refused for good | open |
| Time | change time zone and the clock across a DST change on the device: reminders re-plan on next open (pending alarms keep their old instants until then) | open |
| Rollover | a drink at 01:30 counts for yesterday (wake 07:00); changing the wake time only affects future drinks | open |
| Missed reminders | on an aggressive OEM, two dropped reminders show the "arriving late?" card once; the battery guide intents open on Samsung, Xiaomi, Huawei, OnePlus, Oppo/Vivo, Pixel | open |
| Ads | test IDs in dev; no ad before the first glass; banner under the ring never covers the plant; consent form in the EEA (UMP debug geography) before the first request, after the notification step; "Privacy choices" row | open |
| Ads | interstitial: only after ≥ 20 s on History, ≥ 3 min since the last full-screen ad, 1 per session, not in the first 2 sessions, not right after a log, not after a reminder tap | open |
| Ads | app-open only on a warm start after ≥ 4 h away, never after a reminder tap (the link event can arrive after the foreground event; ordering is best effort) | open |
| Ads | rewarded: freeze and skin unlock are granted only on a completed ad; "Ad not available" when offline; logging is never blocked | open |
| Look | the plant (5 stages, 4 moods, 6 skins), the ring sweep, confetti, goal reveal and first-glass screens have **never been seen on a screen**; the drawing code (react-native-svg paths) was written blind | open |
| Look | dark mode on every screen; the generated icon and adaptive-icon safe zone on a launcher | open |
| Backup | export → uninstall → reinstall → restore, with the real file picker and share sheet (the parsing is unit-tested) | open |
| TalkBack | full flow: onboarding → log → history → garden → settings; the progress ring, the plant, the week chart bars and the sliders | open |
| Font scale | 1.3× and 2.0× in system settings on every screen (layouts use min heights; the render audit checks targets, not clipping) | open |
| Reduced motion | confetti, sway and the sweep are skipped; the toast still shows | open |
| Performance | cold start < 1.5 s on a Pixel 4a-class phone; scrolling History day lists | open |
| Size and native libs | AAB < 40 MB; 16 KB page-size alignment (`zipalign -c -P 16 -v 4 app.aab`, or bundletool) for the native libs (mmkv, reanimated, worklets, svg, ads) | open |
| Slider | the custom amount slider (touch responder) on a real finger, and with TalkBack swipe up and down | open |

Handy commands:
```bash
adb shell dumpsys notification --noredact | grep -A6 sipling      # what is pending / posted
adb shell dumpsys alarm | grep -B1 -A4 com.fiveapps.sipling        # alarms (inexact; none should be "exact")
adb shell am kill com.fiveapps.sipling                             # kill the process, keep the alarms (a swipe from Recents is similar)
adb shell dumpsys package com.fiveapps.sipling | grep permission   # compare with the list in §5
```
Note `am force-stop` also cancels the app's alarms, so it is not a valid "killed app" test.

## 5. Play Console content (drafted in `store/`)
| Item | Where | Status |
|---|---|---|
| Listing title and short description | `ASO.md` (limits checked by a test) | ready |
| Full description | `ASO.md` (Sipling text, 2,097 chars, copied from `store/FULL_DESCRIPTION_DRAFT.md`) | replaced; **Applyra check not run** |
| Icon 512, feature graphic 1024×500 | `store/` (made by `scripts/make-assets.mjs`; the feature graphic is simpler than ASO §7) | ready, **never viewed on Play** |
| 8 screenshots 1080×1920 | `store/SCREENSHOTS.md`, `store/demo-backup.json`, Maestro flows | **to capture on a device** |
| Data safety | `store/DATA_SAFETY.md` | drafted, verify against Google's current AdMob guidance |
| Health apps declaration | `store/HEALTH_DECLARATION.md` | drafted |
| Content rating | `store/CONTENT_RATING.md` | drafted, run the IARC form |
| Privacy policy | `store/privacy-policy.md` | draft, needs hosting |
| app-ads.txt | `store/app-ads.txt` | template |
| Permissions | `app.config.ts` + `src/__tests__/config.test.ts`; merged manifest checked with `expo prebuild` | done |
| Target API | 36 (checked by test: ≥ 35) | done |

Declared permissions: `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `AD_ID`, plus `INTERNET`,
`ACCESS_NETWORK_STATE`, `WAKE_LOCK` from libraries. Blocked: `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`,
`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, storage, `SYSTEM_ALERT_WINDOW`.

## 6. Decisions, deviations and known gaps
**Found in the repo**
- `apps/water-reminder/ASO.md` §1 "Full description" was the **Quizora trivia** listing, not Sipling's. It has been
  replaced with the draft; the Applyra row beneath it now says the check is pending.
- Habit Tracker's Jest run failed once (1 of 425 tests) during one full run and passed on every rerun after that;
  I did not find the cause and did not change that app.

**Changes to `packages/shared`** (backward compatible, tested, habit-tracker tsc and jest re-run):
`OnboardingFlow` gained optional `initial`, `onProgress`, `onSkip` and `StepContext.jumpTo`; `@shared/notify`
channels accept `sound`, `vibrationPattern`, `lockscreenVisibility`; `Store.keys()`.

**Deviations from the plan**
- Logic lives in `src/domain` (the plan says `core/`), and keys in the `water` MMKV store have no `water.` prefix
  (the store id is the prefix). `water.prefs` and `onboarding:resume` are additions. `buildSlots` keeps minute offsets past 1440
  for after-midnight slots instead of wrapping them.
- Built earlier than the plan's version: backup and restore (v2.0), the skins and cup-theme shop with rewarded
  unlocks (v1.1, but the Day 6 line asks for rewarded unlocks), the review prompt (v1.1), 8 rotating reminder lines.
- Not built: the widget (v1.1, skipped as agreed), pregnancy/senior/fasting modes, schedule learning, achievements,
  localization, the weekly recap and comeback notifications (§13 loops), a "streak broken, keep your streak" sheet
  (a freeze is earned from Garden), a pre-review sentiment sheet (Play policy discourages it), Firebase.
- UI substitutes: the plant is vector drawing instead of Lottie/Rive; no Nunito font (system font); steppers
  instead of wheel and time pickers; a delete button instead of swipe-to-delete; charts from plain views
  (no charting library); no droplet particles or water-pour animation; no loading skeleton (reads are synchronous).
- Fl oz mode steps the goal by 50 ml (1.7 fl oz) so it stays on the plan's 50 ml grid.
- Dates use `en-US` formatting; copy is all in `src/i18n/en.json` but only English is shipped.

**Behaviour you may want to change**
- Past days are not re-evaluated when you edit or delete their entries: the streak and goal-day counter
  only look at a day once, when it closes.
- Only interstitials count towards the "4 a day" cap (app-open ads are limited by the 4 h away rule).
- The review prompt has no "no crash this session" check (no crash reporting exists).
- A missed-reminder is detected by a past-due notification still being pending; this is a heuristic.
- Reminders are one-off notifications re-planned on open, on every log and in a ~12 h best-effort background
  task. A user who never opens the app and whose OS blocks background work gets at most 3 days of reminders,
  ending with the "your plant misses you" message.
- `expo-background-task` and headless notification actions are Android best effort; both need the device tests above.
