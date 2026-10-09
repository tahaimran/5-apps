# Habits (Habit Tracker: Streak & Widget) — what's left

Status (2026-10-09): the code checks pass (TypeScript has no errors, expo-doctor 21/21, all Jest tests pass). Linked to EAS as @tuahaimran/habit-tracker (projectId is in app.config.ts). A first "preview" APK was built in the cloud on 2026-10-09; install it from the Builds page on expo.dev.

## 1. Try it on your phone (test checklist)
1. - [x] Run `cd apps/habit-tracker && eas login && eas init` once, then commit the `projectId` it adds to the config. *(done 2026-10-09)*
2. - [ ] Install the preview APK on your phone (`eas build --profile preview --platform android`).
3. - [ ] Widget: long-press the home screen → Widgets → add "Habits: Today"; resize it from 4x2 to 4x4.
4. - [ ] Widget: tick a yes/no habit and tap +1 on a count habit; check dark mode, after a reboot, after an app update, and after midnight.
5. - [ ] Widget: tap a timer row (opens that habit) and "+N more" (opens Today).
6. - [ ] Notifications: allow them, then deny them, then turn them back on from Settings; reboot and check reminders still come.
7. - [ ] Notifications: meet a "X times per week" goal and confirm that week's reminders stop; complete a habit and confirm its nudge disappears; tap "Done ✓" with the app closed.
8. - [ ] Backup: export a backup → uninstall → reinstall → import, and confirm everything is back.
9. - [ ] Ads (test ads in dev): the bottom banner never covers the + button; no full-screen ad right after a check-in; the Privacy choices row in Settings works.
10. - [ ] Ads: the consent popup (EU privacy form) shows when using UMP debug geography (a test setting that pretends you're in Europe).
11. - [ ] Ads: a "welcome back" ad shows when you return after 4+ hours on day 2 or later, but not when you open from a notification or the widget.
12. - [ ] Speed: the app opens in under 1.5 s; Today scrolls smoothly with 30 habits; a full-year heatmap scrolls smoothly.
13. - [ ] Reorder: long-press and drag habits on Today.
14. - [ ] TalkBack (Android's screen reader): go through onboarding → check-in → habit detail → settings.
15. - [ ] Font size: set the phone's text size to the largest (about 1.6×) and look at every screen.
16. - [ ] Reduced motion: turn on "Remove animations" in Android settings; confetti should be skipped but the toast still shows.
17. - [ ] Register your own phone as a test device in AdMob so real ads never count as your own clicks.

## 2. Set up money (AdMob)
- [ ] Create the app in AdMob (Android, not yet listed on Play).
- [ ] Create the ad units: 1 banner, 1 native, 2 interstitial (full-screen), 2 rewarded (watch-to-earn), 1 app-open.
- [ ] Add each real ID as an EAS environment variable with `eas env:create` (never put them in git):
  - [ ] `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` (the app ID, `ca-app-pub-...~...`)
  - [ ] `EXPO_PUBLIC_ADMOB_TODAY_BOTTOM` (banner)
  - [ ] `EXPO_PUBLIC_ADMOB_STATS_LIST` (native)
  - [ ] `EXPO_PUBLIC_ADMOB_LEAVE_STATS` (interstitial)
  - [ ] `EXPO_PUBLIC_ADMOB_AFTER_EDIT` (interstitial)
  - [ ] `EXPO_PUBLIC_ADMOB_STREAK_FREEZE` (rewarded)
  - [ ] `EXPO_PUBLIC_ADMOB_APP_OPEN_WARM` (app-open)
  - [ ] `EXPO_PUBLIC_ADMOB_THEME_UNLOCK` (rewarded; optional for now, premium themes are not built yet)
- [ ] In AdMob, set the max ad content rating to **T** and block sensitive categories.
- [ ] Set up the GDPR consent message (EU privacy form) in AdMob → Privacy & messaging.
- [ ] Replace `pub-0000000000000000` in `store/app-ads.txt` with your publisher ID (AdMob → Settings → Account information).
- [ ] Host `app-ads.txt` at the root of your developer website (e.g. `https://yoursite.com/app-ads.txt`) and wait for AdMob to verify it.

## 3. Things you must write or host
- [ ] Pick the final package name (permanent app ID). `com.fiveapps.habittracker` is a placeholder and cannot change after the first upload; if you change it, also update `packages/shared/src/crosspromo/catalog.ts`.
- [ ] Fill in `[date]`, `[studio name]` and `[support email]` in `store/privacy-policy.md` (the email appears twice).
- [ ] Host the privacy policy on a public web page and set its link as `EXPO_PUBLIC_PRIVACY_POLICY_URL` in EAS.
- [ ] Get a developer website (needed for app-ads.txt and the Play listing) and a support email address.

## 4. Google Play Console forms
- [ ] Create the app, turn on Play App Signing (Google keeps the signing key), and add a service account (robot login for `eas submit`).
- [ ] Data safety: answer from `store/DATA_SAFETY.md`. You collect nothing yourself; the ads SDK collects device/advertising ID, app interactions, diagnostics and approximate location (from IP) for advertising, analytics and fraud prevention; encrypted in transit; no deletion request (no accounts). Double-check against Google's current AdMob guidance.
- [ ] Ads: answer "Contains ads" = Yes, and declare the advertising ID (`AD_ID`) permission.
- [ ] Content rating: decide how to handle the "No smoking" / "No alcohol" templates (see `store/CONTENT_RATING.md`). Answer truthfully; expected result is around Everyone / PEGI 3, maybe higher. Write the final answers into that file.
- [ ] Target audience: 13+ (13–15, 16–17, 18+). Not for children; do not join the Families program.
- [ ] Health apps declaration: answer honestly for a general habit tracker (the plan doesn't cover this; check what Play asks).
- [ ] Privacy policy: paste the hosted URL.

## 5. Store listing
Already done:
- [x] Title, short and full description in `ASO.md` (length limits checked).
- [x] Icon 512×512 (`store/icon-512.png`) and feature graphic 1024×500 (`store/feature-graphic-1024x500.png`).

Still missing:
- [ ] Capture 8 screenshots (1080×1920) from a real build, following `store/SCREENSHOTS.md` (demo data in `store/demo-backup.json`, Maestro scripts for most shots).
- [ ] Take the widget and notification shots by hand, then add captions and the violet frame in a design tool.

## 6. Release steps
- [ ] Run the checks in `RELEASE.md` §1 before every build.
- [ ] Build the store file: `eas build --profile production --platform android` (makes an AAB, the Play upload format).
- [ ] Check the AAB supports 16 KB memory pages (a new Play requirement) with `zipalign` or bundletool, as in `RELEASE.md`.
- [ ] Upload with `eas submit --platform android` (goes to the internal testing track).
- [ ] Read Play's pre-launch report (automatic test on real phones) and fix anything it flags.
- [ ] Run closed testing with at least 12 testers for 14 days (required for new personal developer accounts).
- [ ] Apply for production, then roll out 20% → 50% → 100%, watching crash-free ≥ 99.5% and ANR (app freezes) < 0.3%.

## Nice to have later
- [ ] Premium themes and the "theme unlock" rewarded ad (planned for v1.1).
- [ ] Category filter chips on Today, and long-press on a count for −1 or a custom value.
- [ ] Lottie flame on the welcome screen (an animated flame is used now).
- [ ] Interstitial cap per day (now per session) and "no ads until 3 habits"; crash-free check before asking for a review.
- [ ] Weekly repeating reminders (now re-planned each time the app or widget refreshes).
- [ ] Fix: unarchived habits show a broken streak for the days they were hidden.
- [ ] Widget buttons are 36 dp, below the 48 dp rule (limited by launcher space).
