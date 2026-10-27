# Google Play upload runbook (all 5 apps)

Checklist for creating the five listings in Play Console. Written 2026-10-26 from each app's `ASO.md`,
`WHATS_LEFT.md` and `store/` folder. Paths are relative to `apps/<app>/`. Play limits: title 30, short description 80,
full description 4,000 (UTF-16, as Play counts). All titles and short descriptions below were re-counted on 2026-10-26.

**Filling in Play Console:** each app has a paste sheet, `store/PLAY_CONSOLE.md` (2026-10-27), with every field in
Console order, ready to copy. **Closed testing** (12 testers × 14 days): plan, Google Group setup and tester messages
in `docs/CLOSED_TESTING.md`; testers sign up at https://www.tahaimran.com/testing/.

---

## A. Do once (shared)

- [ ] **Developer account.** Use one developer name for all 5 apps: **Taha Imran**. Finish identity verification.
      In each app's store settings, set the developer website **https://www.tahaimran.com/** and the support email
      **tahaimran.24@gmail.com**.
- [x] **Website live.** https://www.tahaimran.com/ (Vercel, from the GitHub repo `tahaimran/tahawebsite`; source in the
      sibling folder `../tahaimran-website`). `tahaimran.com` redirects to `www`.
      Addresses for Play Console and EAS:

      | App | Privacy policy URL | App page |
      |---|---|---|
      | habit-tracker | https://www.tahaimran.com/apps/habits/privacy/ | https://www.tahaimran.com/apps/habits/ |
      | water-reminder | https://www.tahaimran.com/apps/sipling/privacy/ | https://www.tahaimran.com/apps/sipling/ |
      | word-search | https://www.tahaimran.com/apps/word-search/privacy/ | https://www.tahaimran.com/apps/word-search/ |
      | trivia-quiz | https://www.tahaimran.com/apps/quizora/privacy/ | https://www.tahaimran.com/apps/quizora/ |
      | contraction-timer | https://www.tahaimran.com/apps/contraction-timer/privacy/ | https://www.tahaimran.com/apps/contraction-timer/ |

      Support page: https://www.tahaimran.com/support/. app-ads.txt: https://www.tahaimran.com/app-ads.txt
- [x] **Package names (final, 2026-10-27).** After the first upload a package name can never change:
      `com.tahaimran.habittracker`, `com.tahaimran.waterreminder`, `com.tahaimran.wordsearch`,
      `com.tahaimran.triviaquiz`, `com.tahaimran.contractiontimer` (each in `app.config.ts` and `packages/shared/src/crosspromo/catalog.ts`).
- [x] **Privacy policies hosted.** Placeholders are filled and the Word Search / Quizora gaps fixed (2026-10-27); each
      policy is a page on the website (table above). Both EAS variables are set for every app (production, preview and
      development, 2026-10-27): `EXPO_PUBLIC_PRIVACY_POLICY_URL` = the URL above, `EXPO_PUBLIC_CONTACT_EMAIL` =
      `tahaimran.24@gmail.com`. Paste the same URL in Play Console.
- [ ] **app-ads.txt.** Host the single line in `store/app-ads.txt`
      (`google.com, pub-4070584433937766, DIRECT, f08c47fec0942fa0`, the same for all 5) at
      `https://www.tahaimran.com/app-ads.txt` (live since 2026-10-27), then verify it in AdMob after the apps are live.
- [ ] **AdMob IDs in EAS** (never in git; the app falls back to Google test IDs without them). For each app, from its
      folder, `eas env:create` for the **production** environment before building (`EXPO_PUBLIC_*` values are baked in at
      build time):
  - all apps: `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` (`EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_CONTACT_EMAIL` are already set)
  - habit-tracker: `_TODAY_BOTTOM`, `_STATS_LIST`, `_LEAVE_STATS`, `_AFTER_EDIT`, `_STREAK_FREEZE`, `_APP_OPEN_WARM`, (`_THEME_UNLOCK` optional)
  - water-reminder: `_HOME_UNDER_RING`, `_HISTORY_LIST`, `_HISTORY_EXIT`, `_GARDEN_UNLOCK_SKIN`, `_STREAK_FREEZE`, `_APP_OPEN_WARM`
  - word-search: `_HOME_BANNER`, `_PACKS_BANNER`, `_LEVEL_COMPLETE`, `_HINT_REFILL`, `_APP_OPEN`
  - trivia-quiz: `_MENU`, `_ROUND_END`, `_LIFELINE`, `_EXTRA_LIFE`, `_DOUBLE_XP`, `_STREAK_RESTORE`, `_APP_OPEN`, `_RESULTS_NATIVE`
  - contraction-timer: `_HISTORY_BANNER`, `_WEEK_BANNER`, `_CHECKLIST_BANNER`, `_WEEK_NATIVE`, `_PDF_THEME_REWARD`, `_CHECKLIST_TEMPLATE_REWARD`, `_WEEK_CLOSE_INTERSTITIAL`, `_APP_OPEN`
  (each `_X` means `EXPO_PUBLIC_ADMOB_X`; the lists match each app's `src/ads.config.ts`). Register your own phone as an
  AdMob test device.
- [ ] **Closed test (personal accounts).** Production access needs a closed test with **at least 12 testers opted in for
      14 days in a row**. The clock starts only once a build is on the track, so upload each app to **Closed testing**
      as soon as it has a working build, and invite the **same 12 testers to all 5 apps** (docs/NEXT_SESSION.md).
      Exception: do not start contraction-timer's closed test before its clinical and legal reviews (section F).
- [x] **Play App Signing** terms accepted when the apps were created (2026-10-27). Keystores are EAS-managed.
- [ ] **Service account** for `eas submit`: create it in Google Cloud, grant it access in Play Console → Users and
      permissions, and point EAS at its JSON key. Never commit the key.

## A2. Done in the consoles (2026-10-27, through the browser)

| Where | What | State |
|---|---|---|
| Expo (EAS) | `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_CONTACT_EMAIL` | set, production + preview + development, all 5 |
| Expo (EAS) | all `EXPO_PUBLIC_ADMOB_*` (39 values, from the AdMob console) | set, **production only** (preview/dev keep Google test ads), visibility sensitive |
| Play Console | the 5 apps created with the final package names | done (Habits 4975095451855770129, Sipling 4973862907574760959, Word Search 4974372961015572305, Quizora 4974533183106744120, Contraction Timer 4973187995228226991) |
| Play Console | Store settings: category, email, website | done, all 5 (tags not set yet) |
| Play Console | Default store listing: title, short + full description, icon, feature graphic, 8 screenshots | saved as draft, all 5 |
| Play Console | App content: privacy policy, ads, sign-in details (none), government (no), financial (none), advertising ID (advertising + fraud prevention), target audience, data safety | done, all 5 |
| Play Console | Content rating (IARC) | done for Habits, Sipling, Word Search, Contraction Timer (Everyone / PEGI 3 / USK 0). **Quizora: not done** (see below) |
| Play Console | Health apps declaration | **not done**: owner fills and signs (all 5 show it) |
| AdMob | EU consent (GDPR) message | **not published**: the builder's Publish did not go through; redo by hand |

**Quizora content rating (owner):** category Game. Its history questions mention wars and assassinations, so the first
question ("references to violence") is **Yes** → tick "Violence or implied violence against humans" → setting Realistic,
not pixelated/childlike, reactions Realistic, presented **Referred to**, blood None, not in a war setting, innocent
characters No, fierce sounds No. Every other question No (as for Word Search).

**AdMob EU consent message (owner):** Privacy & messaging → European regulations → Create → name it, Select apps →
tick only the 5 current apps (not "Crickey world cup 2019", "Whats app cleaner", "4464646"), add each app's privacy URL
from the table in §A, Confirm, then Publish and check it is listed.

## B. Build and upload (per app)

- [ ] **EAS quota:** the free Android build quota is used up until **2026-11-01** (it resets then). Five production
      builds are needed; build only when the quota allows, or on a paid plan.
- [ ] **New icons and redesigns need a new native build.** The new launcher icons, splash, notification icons, fonts
      and native modules of the `feat/ui-polish` redesign exist only in builds made after them; the 2026-10-09 preview
      APKs show the old look. The production build includes them; check the icon on a real launcher from the
      internal-testing install.
- [ ] Build: `cd apps/<app> && eas build --profile production --platform android` → an **AAB** (`eas.json`:
      `app-bundle`, `autoIncrement` on).
- [ ] **First upload is manual.** Create the app in Play Console and upload the first AAB by hand (Internal testing →
      Create release); Google's API cannot submit to an app that has never had a release. After that:
      `eas submit --platform android` (goes to the **internal** track, `eas.json` → `submit.production`).
- [ ] Check the AAB is 16 KB page-size compatible (`zipalign -c -P 16 -v 4 app.aab`) and read the pre-launch report.
- [ ] Promote internal → closed (12 testers, 14 days) → production at 20%, then 100% when crash-free users ≥ 99.5%.

## C. Play Console asset rules (check before uploading)

| Asset | Play rule | Status 2026-10-26 |
|---|---|---|
| App icon `store/icon-512.png` | 512×512 PNG, 32-bit (alpha OK), ≤ 1 MB | all 5 OK (512×512, ≤ 189 KB) |
| Feature graphic `store/feature-graphic-1024x500.png` | 1024×500, **JPEG or 24-bit PNG, no alpha** | all 5 OK: redone 2026-10-26 as 24-bit RGB PNGs, no alpha |
| Phone screenshots `store/screenshots/01…08` | 2–8 images, PNG or JPEG, 9:16, 320–3,840 px per side | all 5 apps have 8 at 1080×1920, 24-bit RGB PNG, real UI (how: each `store/SCREENSHOTS.md`, tooling `tools/store-shots/`) |

Upload screenshots in filename order (01 first). Shots 1–3 show in search results.

---

## D. Per-app tables

Common rows (same for every app, so not repeated): **Contains ads** = Yes · **In-app purchases** = No · **App access** =
all functionality available without login · **Advertising ID** = Yes, used for advertising · **Price** = Free ·
**Government / financial / news** = No. The answers live in each `store/DATA_SAFETY.md` → "Other declarations".

### D1. habit-tracker (Habits)

| Play Console field | Source |
|---|---|
| Title | ASO.md §1: `Habit Tracker: Streak & Widget` (**30/30**) |
| Short description | ASO.md §1: `Habit tracker app for daily routines, streaks, reminders & a home screen widget` (**79/80**) |
| Full description | ASO.md §1.1 (2,571/4,000; Applyra log §1.2) |
| App icon | `store/icon-512.png` |
| Feature graphic | `store/feature-graphic-1024x500.png` |
| Phone screenshots | `store/screenshots/`: 01-build-habits, 02-widget, 03-progress, 04-count-timer, 05-stats, 06-streak-freeze, 07-reminders, 08-private (plan in `store/SCREENSHOTS.md`) |
| Category / tags | ASO.md §12: **Productivity**; tags Habit tracker, Productivity, Planner, Self-improvement, Reminders/To-do (closest available) |
| Privacy policy URL | https://www.tahaimran.com/apps/habits/privacy/ |
| Data safety | `store/DATA_SAFETY.md` |
| Content rating | `store/CONTENT_RATING.md` (Productivity/utility). **Owner decision:** the "No smoking"/"No alcohol" templates vs the substance-reference question |
| Health apps declaration | No health features (`store/DATA_SAFETY.md`); no medical claims |
| Target audience | 13–15, 16–17, 18+; not for children; no Families |

### D2. water-reminder (Sipling)

| Play Console field | Source |
|---|---|
| Title | ASO.md §1: `Sipling: Drink Water Reminder` (**29/30**) |
| Short description | ASO.md §1: `Water tracker & daily hydration reminder that grows a cute plant as you drink.` (**78/80**) |
| Full description | ASO.md §1 "Full description" (2,096/4,000; Applyra-checked 2026-10-26, valid, 0 warnings) |
| App icon | `store/icon-512.png` |
| Feature graphic | `store/feature-graphic-1024x500.png` |
| Phone screenshots | `store/screenshots/`: 01-grow-your-plant, 02-reminder, 03-daily-goal, 04-smart-reminders, 05-garden, 06-weekly-progress, 07-drinks, 08-private (plan in `store/SCREENSHOTS.md`) |
| Category / tags | ASO.md §12: **Health & Fitness**; tags Health & fitness tracker, Habit tracker, Water tracker/Hydration, Wellness, Reminders |
| Privacy policy URL | https://www.tahaimran.com/apps/sipling/privacy/ |
| Data safety | `store/DATA_SAFETY.md` |
| Content rating | `store/CONTENT_RATING.md` (expected Everyone / PEGI 3) |
| Health apps declaration | `store/HEALTH_DECLARATION.md` (hydration tracking; not a medical device) |
| Target audience | 13–15, 16–17, 18+; not for children; no Families (keep copy about adult wellness; the plant is cute) |

### D3. word-search (Word Search: Large Print Easy)

| Play Console field | Source |
|---|---|
| Title | ASO.md §1: `Word Search: Large Print Easy` (**29/30**) |
| Short description | ASO.md §1: `Easy word search for seniors: big letters, offline puzzles, no timer pressure.` (**78/80**) |
| Full description | ASO.md §1 "Full description" (2,537/4,000). Pack list fixed 2026-10-26 (the 12 real packs) and re-checked in Applyra: valid, 0 warnings |
| App icon | `store/icon-512.png` |
| Feature graphic | `store/feature-graphic-1024x500.png` |
| Phone screenshots | `store/screenshots/`: 01-big-letters, 02-letter-size, 03-no-timers, 04-offline, 05-packs, 06-daily, 07-contrast-dark, 08-easy-to-hard |
| Category / tags | ASO.md §12: **Games → Word**; tags Word, Word search, Puzzle, Casual, Offline |
| Privacy policy URL | https://www.tahaimran.com/apps/word-search/privacy/ |
| Data safety | `store/DATA_SAFETY.md` |
| Content rating | `store/CONTENT_RATING.md` (Game; expected Everyone / PEGI 3) |
| Health apps declaration | No health features |
| Target audience | **18+ only**; not for children; no Families |

### D4. trivia-quiz (Quizora)

| Play Console field | Source |
|---|---|
| Title | ASO.md §1: `Quizora: Trivia Quiz Offline` (**28/30**) |
| Short description | ASO.md §1: `Offline general knowledge quiz games: daily trivia challenge, IQ & movie trivia` (**79/80**) |
| Full description | ASO.md §1 "Full description (paste-ready)" (2,518/4,000). WHATS_LEFT §5 wording fixed 2026-10-26 (no accuracy promise, no "regular content updates", "Logic & IQ category", no flags implied) and re-checked in Applyra: valid, 0 warnings. The short description keeps "IQ" (a real category name) |
| App icon | `store/icon-512.png` |
| Feature graphic | `store/feature-graphic-1024x500.png` |
| Phone screenshots | `store/screenshots/`: 01-offline-questions, 02-daily-challenge, 03-learn-why, 04-categories, 05-levels, 06-blitz, 07-lifelines, 08-progress-dark |
| Category / tags | ASO.md §12: **Games → Trivia**; tags Trivia, Quiz, Offline, Single player, Casual |
| Privacy policy URL | https://www.tahaimran.com/apps/quizora/privacy/ |
| Data safety | `store/DATA_SAFETY.md` |
| Content rating | `store/CONTENT_RATING.md` (Game). **Owner decision:** one quoted "damn" and ~12 incidental alcohol/tobacco/opium references |
| Health apps declaration | No health features |
| Target audience | 13–15, 16–17, 18+; not for children; "appeals to children" = No; no Families |

### D5. contraction-timer (Contraction Timer & Kick Count)

| Play Console field | Source |
|---|---|
| Title | ASO.md §1: `Contraction Timer & Kick Count` (**30/30**) |
| Short description | ASO.md §1: `Time contractions & spot 5-1-1 patterns. Kick counter & due date calculator` (**75/80**) |
| Full description | ASO.md §1.1 (3,331/4,000). RELEASE.md §6 claims fixed 2026-10-26 ("PATTERN ALERT", the app's own banner wording, no "when labor might be starting", no "baby's rhythm", "a few taps", session-restore wording) and re-checked in Applyra: valid, 0 errors (only the usual emoji-length note) |
| App icon | `store/icon-512.png` |
| Feature graphic | `store/feature-graphic-1024x500.png` |
| Phone screenshots | `store/screenshots/`: 01-one-button, 02-pattern-511, 03-share-summary, 04-night-mode, 05-partner-mode, 06-kick-counter, 07-pregnancy-weeks, 08-hospital-bag |
| Category / tags | ASO.md §9: **Parenting**; tags Pregnancy, Parenting, Baby care, Health tracker, Timer |
| Privacy policy URL | https://www.tahaimran.com/apps/contraction-timer/privacy/ |
| Data safety | `store/DATA_SAFETY.md` |
| Content rating | `store/CONTENT_RATING.md` (expected Everyone / PEGI 3; pregnancy topics stated honestly) |
| Health apps declaration | `store/HEALTH_DECLARATION.md` (pregnancy tracking; not a medical device) |
| Target audience | **18+ only**; not for children; no Families |

---

## E. Owner decisions before submitting (all made 2026-10-27)

- [x] Feedback email: **not declared** in Data safety. The `mailto:` buttons (word-search, trivia-quiz,
      contraction-timer) only open the user's own email app; the app transmits nothing. Written into each
      `store/DATA_SAFETY.md` and `store/PLAY_CONSOLE.md`.
- [x] Content rating: edited for **Everyone / PEGI 3** (all substance and language answers No).
      habit-tracker: "No smoking" / "No alcohol" templates replaced with "No snooze button" / "No phone at meals".
      trivia-quiz: the "damn" quote, the Sex Pistols question and about a dozen alcohol, tobacco and drug references
      edited, bank rebuilt (3,600 questions). word-search: EGGNOG and CIDER swapped out of the word lists. Details in
      each `store/CONTENT_RATING.md`. **Upload a build made after these changes.**
- [x] Package names final (§A). Release notes final in each `store/PLAY_CONSOLE.md` §4.

## F. Release gates (do not publish to production until done)

- **contraction-timer:** a qualified midwife or doctor reviews the week cards, checklists, 5-1-1 alert and kick-counter
  messages; a lawyer checks the disclaimer; audience is 18+; Health apps declaration filed (WHATS_LEFT top,
  RELEASE.md §7). Do not start its closed test before the reviews.
- **trivia-quiz:** none of the 3,600 questions is fact-checked; start with `content/review/flagged-by-writers.md`.
- **all apps:** phone-test checklist in each WHATS_LEFT.md §0/§1 on the new build, with real ads and the UMP form.
