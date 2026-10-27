# Sipling — what's left

Status (2026-10-09): the code checks pass (TypeScript clean, expo-doctor 21/21, all Jest tests pass). Linked to EAS as @tuahaimran/water-reminder (projectId is in app.config.ts). A first "preview" APK was built in the cloud on 2026-10-09; install it from the Builds page on expo.dev.

Redesign (2026-10-24, branch `feat/ui-polish`): every screen rebuilt on the shared kit (Lagoon palette, Figtree +
Bricolage, Lucide icons, sounds, wheel time picker, 12/24-hour setting), a chime notification channel, and a new icon.
TypeScript clean, expo-doctor 21/21, all Jest tests pass. **Not yet seen on a phone.**

## 0. New dev build (needed before any phone testing)
The redesign adds native code, so the old preview APK cannot run it: expo-dev-client, expo-linear-gradient, expo-audio,
expo-navigation-bar, the embedded fonts, the notification icon and `reminder.wav`, and the new icon/splash.
- [ ] After the free EAS quota resets (Nov 1): `cd apps/water-reminder && eas build --profile development --platform android`.
- [ ] Install it, then `npx expo start --dev-client --port 8081` and `adb reverse tcp:8081 tcp:8081`.

## 1. Try it on your phone (test checklist)
Tip: to get a reminder soon, go to Settings and set "Wake up" to about 35 minutes ago (first reminder = wake + 30 min).
1. - [ ] Install the preview APK and finish onboarding; check the goal it suggests looks sensible in kg and in lb, and that a manual goal stays after you reopen the app.
2. - [ ] Look at every screen: plant (stages, moods, skins), progress ring, confetti, goal reveal, first-glass screen. None of these has ever been seen on a screen.
3. - [ ] Check dark mode on every screen, and the app icon on your home screen.
4. - [ ] Wait for reminders: they only come between wake + 30 min and bedtime - 30 min; try a bedtime of 02:00 too.
5. - [ ] Check the reminder plays the soft chime with a gentle double vibration, shows the droplet icon in brand blue, that "Gentle reminders" is silent, that only one "Water reminders" channel is listed in system settings, and that the lock screen shows the text.
6. - [ ] Tap "Add 250 ml" and "Snooze 15 min" on a reminder with the app open, in the background, and closed (swipe it away from Recents).
7. - [ ] Change your cup size, unit and snooze time in Settings; check the reminder buttons change to match.
8. - [ ] Log a drink just before a reminder is due: that reminder should not come, the next one should.
9. - [ ] Reach your goal: the rest of today's reminders stop; undo brings them back.
10. - [ ] Restart the phone: reminders still arrive.
11. - [ ] Turn off notifications for Sipling in system settings: Today shows "Reminders are off" and "Turn on" works.
12. - [ ] Change the phone's time zone: reminders adjust next time you open the app.
13. - [ ] Log a drink at 01:30 (wake time 07:00): it counts for yesterday.
14. - [ ] Check streaks, streak freezes and plant growth over a few days; the plant never goes back a stage.
15. - [ ] Ads (test ads): no ad before the first glass; the banner under the ring never covers the plant; the consent form shows (EEA test mode) after the notification step; "Privacy choices" row works.
16. - [ ] Full-screen ads: only after 20+ s on History, 3+ min apart, 1 per session, not in your first 2 sessions, never right after logging or after tapping a reminder.
17. - [ ] Rewarded ads: freeze and skin unlock only after watching the whole ad; "Ad not available" when offline; logging always works.
18. - [ ] Backup: export, uninstall, reinstall, restore with the real file picker.
19. - [ ] Turn on TalkBack (Android's screen reader) and go through onboarding, logging, History, Garden, Settings.
20. - [ ] Set system font size to large (1.3x and 2.0x): nothing is cut off on any screen.
21. - [ ] Turn on "Remove animations" in Android settings: confetti and sway are skipped, the toast still shows.
22. - [ ] Add a drink: the − / + steps feel right (10 ml under 100, 25 under 300, then 50; fl oz 0.5 then 1), tapping the amount lets you type an exact one (e.g. 330), and the time wheel snaps and ticks.
25. - [ ] Today's hero: the water level rises smoothly on every drink, the waves drift slowly (and stop with "Remove animations"), the plant bounces, "+250 ml" floats up, and the card turns green at the goal. Feel-check on the Redmi, not just in the code.
26. - [ ] Settings → Clock: Phone / 12-hour / 24-hour changes every time on screen (Today, reminders, wheels); Sounds and Vibration toggles silence the feedback.
27. - [ ] Dark mode: pills and stepper buttons sit lighter than their tracks, Switch thumbs are visible, the hero text reads clearly.
28. - [ ] New icon on the home screen (round and squircle launchers), the monochrome themed icon, and the splash in light and dark.
23. - [ ] Check the app opens fast (under ~1.5 s) and History scrolls smoothly.
24. - [ ] If you can, repeat steps 4-6 on a Samsung and a Xiaomi phone (they kill background apps harder).

## 2. Set up money (AdMob)
- [x] Run `eas login` then `eas init` in `apps/water-reminder` to link the project (adds a projectId; commit it). *(done 2026-10-09)*
- [ ] Decide the final package name now (it can never change after the first upload); today it is the placeholder `com.fiveapps.sipling` in `app.config.ts` and `packages/shared/src/crosspromo/catalog.ts` (keep both equal).
- [x] Create the Sipling app in AdMob and 6 ad units: banner (Today), native (History list), interstitial (History exit), 2 rewarded (skin unlock, streak freeze), app open.
- [ ] Add these as EAS environment variables with `eas env:create` (never in git; see `.env.example`):
  `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`, `EXPO_PUBLIC_ADMOB_HOME_UNDER_RING`, `EXPO_PUBLIC_ADMOB_HISTORY_LIST`,
  `EXPO_PUBLIC_ADMOB_HISTORY_EXIT`, `EXPO_PUBLIC_ADMOB_GARDEN_UNLOCK_SKIN`, `EXPO_PUBLIC_ADMOB_STREAK_FREEZE`,
  `EXPO_PUBLIC_ADMOB_APP_OPEN_WARM`.
- [ ] Register your own phone as a test device in AdMob (so you never click your own real ads).
- [ ] Set up the consent (GDPR) message in AdMob's Privacy & messaging for EEA users.
- [x] Fill in `store/app-ads.txt` (replace `pub-0000000000000000` with your AdMob publisher ID) and host it at the root of your developer website.
- [ ] Verify app-ads.txt in AdMob after the app is live.

## 3. Things you must write or host
- [x] Fill the placeholders in `store/privacy-policy.md`: `[date]`, `[studio name]`, `[support email]` (twice). *(done 2026-10-27: Taha Imran, tahaimran.24@gmail.com; the policy is a page on the tahaimran.com website (`../tahaimran-website`, 2026-10-27))*
- [x] Host the privacy policy on your website and put its address in the EAS variable `EXPO_PUBLIC_PRIVACY_POLICY_URL` (Settings links to it). *(done 2026-10-27: live at https://www.tahaimran.com/apps/sipling/privacy/; `EXPO_PUBLIC_PRIVACY_POLICY_URL` set in EAS for production, preview and development)*
- [x] Create a support email address for Play Console and the privacy policy. *(done 2026-10-27: tahaimran.24@gmail.com, set in EAS as `EXPO_PUBLIC_CONTACT_EMAIL`)*
- [x] Have a developer website (needed for app-ads.txt and the policy). *(done 2026-10-27: https://www.tahaimran.com/ on Vercel; support email tahaimran.24@gmail.com)*
- [x] Run the Applyra metadata check on the new full description in `ASO.md` (it replaced misfiled Quizora trivia text; the old check result was for the wrong text). *(done 2026-10-26: valid)*

## 4. Google Play Console forms
- [ ] Create the app, turn on Play App Signing, and add a service account so `eas submit` can upload.
- [ ] Privacy policy: paste the hosted URL.
- [ ] Ads: "Yes, contains ads."
- [ ] Data safety (draft in `store/DATA_SAFETY.md`): collected by AdMob = device IDs (advertising ID), app interactions, crash logs; for ads/analytics; encrypted in transit; health info NOT collected (water logs stay on the phone). Check against Google's current AdMob guidance.
- [ ] Declare use of the advertising ID (`AD_ID`) permission.
- [ ] Health apps declaration (draft in `store/HEALTH_DECLARATION.md`): wellness / hydration tracking, not a medical device, no Health Connect.
- [ ] Content rating (IARC quiz, draft in `store/CONTENT_RATING.md`): no violence, no user content; expect Everyone / PEGI 3.
- [ ] Target audience: 13+ (13-15, 16-17, 18+), not for children, no Families program. If reviewers say the cute plant appeals to kids, restate the adult wellness audience.
- [ ] Permissions check: only notifications, boot, vibrate, ad ID, internet; no exact alarms, no battery-optimization request.

## 5. Store listing
Already there: title, short and full description (`ASO.md`), icon 512 px and feature graphic 1024x500 (`store/`, never viewed on Play), screenshot plan (`store/SCREENSHOTS.md`), demo data (`store/demo-backup.json`).
- [x] 8 screenshots (1080×1920) of the real UI: `store/screenshots/` (see `store/SCREENSHOTS.md`). Spot-check them against a device build.
- [x] Captions and art are on the screenshots (2026-10-26).
- [ ] Look at the icon and feature graphic in the Play preview (both redone 2026-10-26 to match ASO.md §7). New icon set (2026-10-26): it only shows on a phone after a new native build.
- [ ] Re-read the listing for medical claims (there must be none).

## 6. Release steps
- [ ] Build the release file: `eas build --profile production --platform android` (makes an AAB, Play's upload format).
- [ ] Check the AAB is under 40 MB and its native libraries support 16 KB pages (newer Android phones require it).
- [ ] Upload with `eas submit --platform android` (goes to the internal testing track).
- [ ] Test the internal build on your phone with real ads switched off for you (test device) and read the pre-launch report.
- [ ] Run closed testing with 12+ testers for 14 days in a row (required for new personal developer accounts).
- [ ] Apply for production, then release to 20% of users.
- [ ] Watch crashes (target 99.5%+ crash-free) and ANRs ("app not responding", under 0.3%) for 48 hours, then go to 100%.

## Nice to have later
- [ ] Home-screen widget (v1.1, skipped for now).
- [ ] Pregnancy / senior / fasting modes, schedule learning, achievements, weekly recap and comeback notifications.
- [ ] Other languages (all text is in `src/i18n/en.json`, only English ships).
- [ ] Fallback for closed-app reminder buttons (open the app and show "Logged") if step 6 above fails on some phones.
- [ ] Crash reporting (none exists; the review prompt cannot check for crashes).
- [ ] Re-check streaks when you edit past days (today a day is only judged once, when it closes).
- [ ] Mediation partners in AdMob after ~1k daily users (add their lines to app-ads.txt).
