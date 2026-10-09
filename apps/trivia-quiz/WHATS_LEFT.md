# Quizora — what's left

Status (2026-10-09): the code checks pass (type check clean, expo-doctor 21/21, all Jest tests pass), but the app has never run on a phone. Linked to EAS as @tuahaimran/trivia-quiz (projectId is in app.config.ts). A first "preview" APK was built in the cloud on 2026-10-09; install it from the Builds page on expo.dev.

**Biggest risk:** none of the 3,600 questions has been fact-checked. Do not publish until that is done (step 3).

## 1. Try it on your phone (test checklist)
- [x] Run `eas login`, then `eas init` in `apps/trivia-quiz` to get the EAS project id. *(done 2026-10-09)*
- [ ] Install the preview APK; check the splash shows the icon, then the onboarding starts.
1. [ ] Go through every onboarding screen; kill the app midway and reopen: it should resume where you were.
2. [ ] Time first launch to first answered question: should be under 30 seconds.
3. [ ] Play a Category round: tap answers, see the shake/bounce, timer ring, last-5-seconds tick, and the explanation.
4. [ ] Press Home during a question: the timer pauses and "Paused — Resume" appears. Same for an incoming call.
5. [ ] Press Android Back during a round: it should ask "Quit round?".
6. [ ] Play Blitz (60 s clock, +1 s right, −3 s wrong) and a few Classic levels; kill the app and check stars stay.
7. [ ] Play the Daily on two phones on the same day: the same 10 questions should appear.
8. [ ] Share the Daily result: the share sheet opens with the picture.
9. [ ] Turn on airplane mode on a fresh install: every mode, Daily and Stats still work, no crash.
10. [ ] Check sound and vibration feel right, and that Settings switches turn them off.
11. [ ] Try Settings text size Small to Extra large, and phone font size at maximum: nothing cut off.
12. [ ] Play a full round with TalkBack (the screen reader) on; answers are read out.
13. [ ] Turn on "Remove animations" in phone settings: no shaking or bouncing, everything still works.
14. [ ] Look at every screen in light and dark mode, and the icon on your home screen.
15. [ ] Tap "Remind me": allow notifications, and check one arrives at the chosen time and opens the Daily.
16. [ ] Restart the phone and change the time zone: reminders still arrive; the streak does not count twice.
17. [ ] Check test ads (dev build, Settings → "Ad rules (development)"): banners only on Home, Play, Classic, Stats, Settings; never during a question; no full-screen ad in the first session.
18. [ ] Try each "watch a video" reward (lifeline, extra heart, Double XP, streak restore): reward only after the video ends.
19. [ ] Check the Google consent (privacy permission) form appears for Europe (debug setting) before the first ad.
20. [ ] "Reset progress" asks twice and keeps your settings.
21. [ ] If possible, test on a cheap old phone (2 GB, Android 9): starts in under 2 seconds, smooth animations.

## 2. Set up money (AdMob)
- [ ] Create the Quizora app in AdMob (Android).
- [ ] Create 8 ad units: menu (banner), round_end (interstitial), lifeline, extra_life, double_xp, streak_restore (rewarded), app_open, results_native (native).
- [ ] Put the real IDs in EAS environment variables (never in git): `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`, `EXPO_PUBLIC_ADMOB_MENU`, `EXPO_PUBLIC_ADMOB_ROUND_END`, `EXPO_PUBLIC_ADMOB_LIFELINE`, `EXPO_PUBLIC_ADMOB_EXTRA_LIFE`, `EXPO_PUBLIC_ADMOB_DOUBLE_XP`, `EXPO_PUBLIC_ADMOB_STREAK_RESTORE`, `EXPO_PUBLIC_ADMOB_APP_OPEN`, `EXPO_PUBLIC_ADMOB_RESULTS_NATIVE`.
- [ ] Set "Max ad content rating" to T in AdMob, and block sensitive categories (gambling, dating).
- [ ] Publish `app-ads.txt` (a file proving you own the ads) at `https://<your-site>/app-ads.txt` with `google.com, pub-<your id>, DIRECT, f08c47fec0942fa0`, then verify it in AdMob.
- [ ] After the app is on Play, link the AdMob app to the Play listing.

## 3. Things you must write or host
- [ ] Fact-check the questions: start with `content/review/flagged-by-writers.md`, then spot-check every category (wrong answers hurt ratings).
- [ ] Fill in `store/privacy-policy.md`: replace [date], [Developer name], [contact email], [partners], [email]; delete the Sentry line (no crash reporter is in this build).
- [ ] Host the privacy policy on your website and set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in EAS.
- [ ] Pick a contact email and set `EXPO_PUBLIC_CONTACT_EMAIL` in EAS (without it, "Report this question" and feedback stay hidden).
- [ ] Set a developer website (the same site that hosts the policy and app-ads.txt).

## 4. Google Play Console forms
- [ ] Target audience: ages 13–15, 16–17, 18+. Not for children, not in the Families program, "appeals to children" = No.
- [ ] Content rating (IARC questionnaire): trivia, no violence; expect Everyone / PEGI 3; ads = Yes.
- [ ] Ads: Contains ads = Yes. In-app purchases: none.
- [ ] Data safety: AdMob collects advertising ID, approximate location (from IP), app interactions and diagnostics, for advertising, analytics and fraud prevention; shared with Google ad partners; encrypted in transit; no account, so deletion = uninstall. No crash reporter (no Sentry). The app itself collects no personal info.
- [ ] Advertising ID declaration: Yes.
- [ ] Privacy policy URL: paste the hosted link.

## 5. Store listing
Already exist: title, short and full description (`ASO.md` §1), icon (`store/icon-512.png`), feature graphic (`store/feature-graphic-1024x500.png`).
- [ ] Remove or soften "Each question is checked for accuracy" in the description until the fact-check is done.
- [ ] Remove "regular content updates" unless you set up EAS Update (see step 6).
- [ ] Soften "IQ" and "boost your reasoning" (there is a Logic & IQ category, but no IQ score).
- [ ] Don't imply flag pictures: flags are text descriptions only.
- [ ] Take 8 phone screenshots (1080×1920) of the real app, following `ASO.md` §6 (none exist yet).
- [ ] Set category to Trivia (Games).

## 6. Release steps
- [ ] Build the store file: `eas build --profile production --platform android` (makes an AAB, the file Play wants).
- [ ] Upload it: `eas submit --platform android` (goes to the internal testing track).
- [ ] Check the build targets the current Play API level and is 16 KB page-size compatible (a new Play requirement).
- [ ] Run a closed test with at least 12 testers for 14 days (required for new personal accounts), then apply for production.
- [ ] Release to 20% of users, watch crashes for 48 hours (crash < 1.09%, freezes < 0.47%), then go to 100%.
- [ ] Optional, for adding or fixing questions without a store update: `npx expo install expo-updates`, `eas update:configure`, set a `runtimeVersion`, then `eas update --channel production` (not set up yet).

## Nice to have later
- [ ] Sentry crash reporting (planned, not built; update the policy and Data safety if added).
- [ ] Ad mediation (more ad networks for higher earnings; plan says week 2).
- [ ] Background music, corrupt-storage reset dialog, Firebase Analytics, Maestro automated phone tests.
- [ ] Plan v1.1 / v2: Pass & Play, IQ Test mode, achievements, review mistakes, picture rounds, weekly event, widget, "Remove ads", other languages.
- [ ] Check the translated titles in `ASO.md` §9 before publishing other languages.
