# Word Search: Large Print Easy — what's left

Status (2026-10-09): the code checks pass (tsc clean, expo-doctor 21/21, all jest tests pass), but the app has never run on a phone. Linked to EAS as @tuahaimran/word-search (projectId is in app.config.ts). A first "preview" APK was built in the cloud on 2026-10-09; install it from the Builds page on expo.dev.

## 1. Try it on your phone (test checklist)
Tip: in a development build, Settings → "Ad rules (development builds only)" shows why each ad would or would not show.
1. - [ ] Install the preview APK, open it: splash shows the icon on cream, then onboarding, in the Atkinson Hyperlegible font.
2. - [ ] Time first launch to first found word (goal: about 30 s); tap Skip once and check it picks Large text and Easy.
3. - [ ] Drag across words on Easy, Medium and Hard; check backwards words are refused on Easy/Medium and accepted on Hard.
4. - [ ] Drag on the grid at a large text size and check the page never scrolls instead.
5. - [ ] Try tap-first-letter, tap-last-letter; tap the same cell to cancel; try "Tap only" in Settings.
6. - [ ] Check letters stay readable on every highlight color, in light, dark and high-contrast themes.
7. - [ ] Change text size mid-puzzle (play menu); set Android font size to 1.3× and 2.0× and look for cut-off text on every screen.
8. - [ ] Feel the vibrations (start, found word, finish; none on a wrong pick); turn Vibration off in Settings.
9. - [ ] Listen to the sounds; check they obey silent mode and the Sounds switch.
10. - [ ] Swipe the app away mid-puzzle, reopen: same grid, found words kept, Home "Continue" count right.
11. - [ ] Play the Daily puzzle on two days; check the streak; leave the app open past midnight.
12. - [ ] Use hints: first letter ring for 3 s, second hint also rings the last letter.
13. - [ ] Turn on airplane mode: the whole app works and ad spaces close up with no blank boxes.
14. - [ ] Check no ads at all until the tutorial and level 2 are done; never on the game, Complete or Settings screens.
15. - [ ] Check banners on Home, pack lists and Daily sit above the tab bar.
16. - [ ] Check the full-screen ad shows only every 3rd "Next puzzle", never after a daily puzzle.
17. - [ ] Watch a hint video to the end (gets 2 hints); close one early (gets nothing).
18. - [ ] Leave the app 4+ minutes and come back: an app-open ad may show, never on a fresh start or mid-puzzle.
19. - [ ] Test the consent form (UMP, the EU privacy pop-up) with the EEA debug setting; "Privacy choices" reopens it.
20. - [ ] Turn on the daily reminder: allow the permission, wait for it at the chosen time, tap it to open the daily puzzle.
21. - [ ] Refuse the reminder permission (twice); check the messages and "Open phone settings".
22. - [ ] Reboot the phone and change the time zone; check reminders still come.
23. - [ ] Do a full TalkBack (Android screen reader) playthrough in tap mode.
24. - [ ] Turn on "Remove animations" and check the tutorial and word strokes don't animate.
25. - [ ] Use "Reset progress": it asks twice and keeps your settings.
26. - [ ] Press Android Back from the game and during the celebration.
27. - [ ] If you can, try a cheap Android 10 phone, a mid Android 13 phone and a tablet (Samsung/Xiaomi/Pixel for reminders).

## 2. Set up money (AdMob)
- [ ] Create the app in AdMob (Android, "not yet published").
- [ ] Create 5 ad units: home banner, packs banner, interstitial (full-screen), rewarded (hint video), app open.
- [ ] Add these as EAS environment variables (`eas env:create`), never in git:
  - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` (the app ID, `ca-app-pub-…~…`)
  - `EXPO_PUBLIC_ADMOB_HOME_BANNER`, `EXPO_PUBLIC_ADMOB_PACKS_BANNER`
  - `EXPO_PUBLIC_ADMOB_LEVEL_COMPLETE` (interstitial), `EXPO_PUBLIC_ADMOB_HINT_REFILL` (rewarded), `EXPO_PUBLIC_ADMOB_APP_OPEN`
- [ ] Register your own phone as a test device in AdMob (so you never click your own real ads).
- [ ] Set max ad content rating to G or PG and block gambling and dating ad categories in AdMob.
- [ ] Set up the EU consent message (GDPR) in AdMob's Privacy & messaging page.
- [ ] Write app-ads.txt (a file proving you own the ad slots): `google.com, pub-<your publisher id>, DIRECT, f08c47fec0942fa0`.
- [ ] Host app-ads.txt at the root of the website you list in Play Console.
- [ ] Later (once over ~1k daily users): add mediation (other ad networks bidding): Meta, AppLovin, Unity; then list each in app-ads.txt, privacy policy and Data safety.

## 3. Things you must write or host
- [ ] Decide the final package name now (placeholder `com.fiveapps.wordsearchlarge`); it can never change after the first upload. Update `app.config.ts` and `packages/shared/src/crosspromo/catalog.ts` together.
- [ ] Fill the placeholders in `store/privacy-policy.md`: developer name, contact email, date, ad partners.
- [ ] Host the privacy policy (e.g. GitHub Pages) and set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in EAS.
- [ ] Set `EXPO_PUBLIC_CONTACT_EMAIL` in EAS (the "Send feedback" row is hidden without it).
- [ ] Fix the store description: it names packs that don't exist (Garden, Kitchen, Movies, Everyday Life). Real packs: Animals, Birds, Food, Baking, Travel, Cities, Nature, Holidays, Seasons, Hobbies, Music, Home & Family.
- [x] Run `eas login` and `eas init` in `apps/word-search` and commit the added `projectId`. *(done 2026-10-09)*

## 4. Google Play Console forms
- [ ] Create the app, turn on Play App Signing, add a service account (robot login) for `eas submit`.
- [ ] Target audience: 18+ only; "Not designed for children"; not in the Families program.
- [ ] Content rating (IARC questionnaire): puzzle/word game, no violence, no chat, no gambling → expect Everyone / PEGI 3.
- [ ] Ads declaration: Contains ads = Yes.
- [ ] Data safety: Device or other IDs (advertising ID) collected and shared with ad networks, for Advertising, Analytics, Fraud prevention.
- [ ] Data safety: App info & performance (crash logs, diagnostics) collected by the Google ads SDK, for Analytics.
- [ ] Data safety: Approximate location (from IP, by ad SDKs), following Google's AdMob Data safety guidance.
- [ ] Data safety: encrypted in transit = Yes; no account; progress is on the phone only (uninstall or "Reset progress" deletes it).
- [ ] Data safety: no personal info, contacts, photos, precise location or account creation.
- [ ] Paste the privacy policy URL.

## 5. Store listing
Already made:
- [x] Title, short and full description (`ASO.md`), but fix the pack names first (see section 3).
- [x] Icon 512×512 (`store/icon-512.png`) and feature graphic 1024×500 (`store/feature-graphic-1024x500.png`); never seen on Play.

Still missing:
- [ ] Capture 8 screenshots, 1080×1920, from the preview build on a phone.
- [ ] Look at the icon, adaptive icon and feature graphic on a real launcher and in the Play preview.

## 6. Release steps
- [ ] Build the release file: `cd apps/word-search && eas build --profile production --platform android` (AAB, version number goes up by itself).
- [ ] Check the AAB meets Play's 16 KB memory-page rule: `zipalign -c -P 16 -v 4 app.aab`.
- [ ] Upload it: `eas submit --platform android` (goes to the internal testing track).
- [ ] Install from internal testing, redo the key checks in section 1 with real ads, read the pre-launch report.
- [ ] Run closed testing: 12 testers for 14 days in a row (required for new personal developer accounts).
- [ ] Apply for production, then roll out in stages: 20% → 50% → 100%.
- [ ] Watch crash-free users (aim ≥ 99.5%) and ANRs ("app not responding" freezes) at each stage.

## Nice to have later
- [ ] Help screen; battery/reminder troubleshooting guide.
- [ ] Return loops: gentle-return message, pack badges, word collections, milestone pop-ups, streak restore (v1.1).
- [ ] v1.1+: word definitions, more packs, stats screen, relax sounds, seasonal events, hidden phrases, tablet two-pane layout, other languages, mediation.
- [ ] Settings option "highlight start letter on hint".
- [ ] Maestro (automated tap-through) test flows.
