# Contraction Timer & Kick Count — what's left

**Status (2026-10-09):** The code is done for milestones 1–8: `tsc` is clean, `expo-doctor` passes 21/21 and all Jest tests pass. It has never run on a phone. Linked to EAS as @tuahaimran/contraction-timer (projectId is in app.config.ts). A first "preview" APK was built in the cloud on 2026-10-09; install it from the Builds page on expo.dev.

> **STOP: this is a pregnancy and health app. Do not release it to the public until all three of these are done:**
> 1. A **qualified midwife or doctor** has reviewed the week-by-week cards (weeks 4–42), the hospital bag and birth plan lists, the 5-1-1 pattern alert and its wording, and the kick counter messages, with sources. Only then may the About screen name the reviewer.
> 2. The **Health apps declaration** is filled in Play Console (see section 4).
> 3. The audience is set to **18+ only**, and the **medical disclaimer** ("Not a medical device. Not medical advice. Always follow your provider's guidance.") has been checked by a lawyer for the countries you ship to.

## 1. Try it on your phone (test checklist)
Install the preview APK, then check each item. Full list: `RELEASE.md` section 4.
- [ ] 1. Open the app: the splash shows, then onboarding. Go from first launch to timing a contraction in under 60 seconds.
- [ ] 2. Tap Skip on every onboarding screen, and kill the app on each screen; it should pick up where you left off.
- [ ] 3. Start a contraction, swipe the app away, reopen 3 minutes later: it shows about 3:00 and "Timing restored".
- [ ] 4. Restart the phone during a session: the session comes back.
- [ ] 5. Change the phone clock and time zone during a session: a warning appears, no negative or lost times.
- [ ] 6. Tap a 5-1-1 pattern against a stopwatch: the banner appears once and stays dismissed.
- [ ] 7. Hold the big button for over half a second: "Undo last tap?" opens and the timer does not toggle.
- [ ] 8. Slide your thumb over the big button and the kick counter: the page must not scroll.
- [ ] 9. Check that the screen stays on while a session is open on the Timer, and turns off normally elsewhere.
- [ ] 10. Turn on Night mode in a dark room: readable, does not light the room.
- [ ] 11. Try Partner mode at arm's length; check the "Exit partner mode" chip is easy to hit.
- [ ] 12. Set Android font size to the largest and display size to Largest: nothing cut off on any screen.
- [ ] 13. Walk through the app with TalkBack (Android's screen reader) on.
- [ ] 14. Turn off animations in Android settings: everything still works.
- [ ] 15. Edit, add, undo and delete contractions in History.
- [ ] 16. Share a summary as text and as PDF to Gmail, WhatsApp and Messages, also in airplane mode.
- [ ] 17. Count kicks with a shaky finger; check the 2-hour card.
- [ ] 18. Set a due date with each method; scroll the week list; try metric and imperial.
- [ ] 19. Tick, add and reorder checklist items with the keyboard open.
- [ ] 20. Turn on the kick reminder: Android asks for notification permission only then; the reminder arrives, also after a restart.
- [ ] 21. Check that test ads show only on History, the week list and article, and checklists, and never on Timer, Kicks, onboarding, or while a session is open. (More → "Ad rules" in dev builds shows why.)
- [ ] 22. Check the consent form (EEA privacy pop-up) appears after onboarding, before the Timer, never mid-session.
- [ ] 23. Use airplane mode for everything: no ads, no layout jump over the button.
- [ ] 24. Use More → Delete all data: the app goes back to the first screen with nothing left.
- [ ] 25. If you can, try a cheap old phone (Android 8–10), a newer one and a large 6.7" one.

## 2. Set up money (AdMob)
- [ ] Create the app in AdMob (Android, package `com.fiveapps.contractiontimer`). Decide the final package name first; it can never change after the first upload.
- [ ] Create 8 ad units: 4 banners, 1 native, 2 rewarded, 1 interstitial, 1 app open (one per placement below).
- [ ] Run `eas env:create` (stores secrets in EAS, not git) for each of:
  `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`, `EXPO_PUBLIC_ADMOB_HISTORY_BANNER`, `EXPO_PUBLIC_ADMOB_WEEK_BANNER`,
  `EXPO_PUBLIC_ADMOB_CHECKLIST_BANNER`, `EXPO_PUBLIC_ADMOB_WEEK_NATIVE`, `EXPO_PUBLIC_ADMOB_PDF_THEME_REWARD`,
  `EXPO_PUBLIC_ADMOB_CHECKLIST_TEMPLATE_REWARD`, `EXPO_PUBLIC_ADMOB_WEEK_CLOSE_INTERSTITIAL`, `EXPO_PUBLIC_ADMOB_APP_OPEN`.
- [ ] Never put real IDs in git. Until set, the app uses Google's test IDs.
- [ ] Register your phone as a test device in AdMob, so you never click your own real ads.
- [ ] Block sensitive ad categories in AdMob: dating, gambling, alcohol, sexual and reproductive health, weight loss, cosmetic procedures, get-rich-quick, politics, religion, drugs and supplements, astrology, shocking content, personal loans.
- [ ] Set the maximum ad content rating to **G** in AdMob.
- [ ] Host `app-ads.txt` (a file proving you own the ads) at the root of your developer website, with your AdMob publisher line.

## 3. Things you must write, host or get reviewed
- [ ] **Get the midwife/doctor review** listed at the top (week cards, checklists, pattern alert, kick counter limits, summary/PDF contents).
- [ ] Get the disclaimer wording reviewed by a lawyer (onboarding screen 2, More → "Not medical advice", the Skip sheet, every export footer).
- [ ] Write and host a privacy policy covering: health data stays on the phone, AdMob and UMP (Google's consent tool) get device data, Android backup is off, contact email.
- [ ] Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in EAS (the link is hidden in the app until set).
- [ ] Set `EXPO_PUBLIC_CONTACT_EMAIL` in EAS (the "Send feedback" button is hidden until set).
- [ ] Fix the store description claims flagged in `RELEASE.md` §6: "Consider calling them now" (use the app's wording), the "LABOR PATTERN ALERT" heading and "when labor might be starting" (sounds like it detects labour), "your baby's rhythm", "in two taps" (it is three), and check "keeps timing even if the app is closed".
- [ ] Decide on crash reporting. Sentry is in the plan but **not built**; if you add it, update the policy and Data safety too.

## 4. Google Play Console forms
- [ ] **Health apps declaration:** category "Pregnancy & reproductive health / fitness & wellness tracking"; not a medical device, no diagnosis, no regulated medical function.
- [ ] **Target audience:** **18+ only**; not designed for children; Families policy does not apply.
- [ ] **Data safety:** health data "not collected" (stays on the device). Disclose AdMob: advertising ID, approximate location (IP), app interactions, diagnostics, shared with Google for ads. Encrypted in transit: yes. Deletion: in-app "Delete all data". (Leave out Sentry unless you add it.)
- [ ] **Content rating (IARC questionnaire):** health/reference tool, no user-generated content; expect Everyone / PEGI 3; mention pregnancy and birth topics honestly.
- [ ] **Ads:** "Contains ads" = Yes.
- [ ] **Category:** Parenting. Tags: Pregnancy, Parenting, Baby care, Health tracker, Timer.
- [ ] Add the developer website (where `app-ads.txt` lives), support email and privacy policy URL.

## 5. Store listing
- [x] Title, short and full description: written in `ASO.md` (fix the claims in section 3 first).
- [x] Icon 512×512: `store/icon-512.png` (never viewed on Play).
- [x] Feature graphic 1024×500: `store/feature-graphic-1024x500.png`.
- [ ] Capture 8 screenshots (1080×1920) from a real phone, following the storyboard in `ASO.md` §5. Real UI only.
- [ ] Optional: make the 30-second promo video (`ASO.md` §5).

## 6. Release steps
- [x] Run `cd apps/contraction-timer && eas login && eas init`, and commit the new `projectId`. *(done 2026-10-09)*
- [ ] Create the app in Play Console, turn on Play App Signing, and add a service account (a key that lets `eas submit` upload).
- [ ] Build: `eas build --profile production --platform android` (makes the AAB file Play needs).
- [ ] Upload: `eas submit --platform android` (goes to the internal testing track).
- [ ] Read the pre-launch report in Play Console.
- [ ] Do not start closed testing until the midwife and legal reviews are done.
- [ ] Run closed testing with at least **12 testers for 14 days** (required for new personal accounts).
- [ ] Release to production at 20%, then 100% once crash-free users are 99.5% or more.

## Nice to have later
- [ ] Ongoing notification with Start/Stop buttons (so timing shows in the notification bar).
- [ ] App shortcut, water-break and note events, contraction chart.
- [ ] Other languages (ASO.md §6 lists the top 10).
- [ ] Hydration and weight logs, "Baby is here" postpartum flow, backup and restore, Wear OS tile.
- [ ] AdMob mediation (other ad networks) after about 1,000 daily users.
- [ ] Maestro (automated tap-through tests) flows.
- [ ] Battery-saver guide for Samsung/Xiaomi phones that may delay reminders.
