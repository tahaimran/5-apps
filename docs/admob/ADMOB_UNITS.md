# AdMob apps, ad units and ID mapping (all 5 apps)

Source of truth for what to create in AdMob. Generated from each app's `src/ads.config.ts`, `app.config.ts`
and `WHATS_LEFT.md` §2 on 2026-10-13. If a placement is added or renamed in an `ads.config.ts`, update this file.

Rules that apply to every row below:
- One AdMob app per Expo app, platform **Android**, "Is the app listed on a supported app store?" = **No** (none are on Play yet).
  Link each to its Play listing after it is published.
- One ad unit per placement, so eCPM can be compared per placement (`docs/ADMOB_PLAYBOOK.md` §1).
- The `Env var` column is the exact name `src/ads.config.ts` reads. The app ID goes in `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`.
- Real IDs are stored only as EAS environment variables (`eas env:create`) and in the git-ignored
  `docs/admob/ADMOB_IDS.local.json`. They are never committed. Dev builds use Google test IDs automatically.
- Ad unit name format: `<AppShort> | <placement> | <Format>`. Keep it exactly, so the dashboard sorts by app.

AdMob format mapping: `banner` = Banner (adaptive anchored), `native` = Native advanced, `interstitial` = Interstitial,
`rewarded` = Rewarded, `appOpen` = App open.

---

## 1. Habit Tracker

| Field | Value |
|---|---|
| AdMob app name | `Habit Tracker: Streak & Widget` |
| Package | `com.fiveapps.habittracker` |
| Max ad content rating | **T** |
| App folder | `apps/habit-tracker` |

| Placement | Ad unit name | Format | Env var | Notes |
|---|---|---|---|---|
| `today_bottom` | `Habits \| today_bottom \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_TODAY_BOTTOM` | Adaptive banner, bottom of Today |
| `stats_list` | `Habits \| stats_list \| Native` | Native advanced | `EXPO_PUBLIC_ADMOB_STATS_LIST` | Inside the stats list; must be labelled "Ad" |
| `leave_stats` | `Habits \| leave_stats \| Interstitial` | Interstitial | `EXPO_PUBLIC_ADMOB_LEAVE_STATS` | |
| `after_edit` | `Habits \| after_edit \| Interstitial` | Interstitial | `EXPO_PUBLIC_ADMOB_AFTER_EDIT` | |
| `streak_freeze` | `Habits \| streak_freeze \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_STREAK_FREEZE` | Reward: Streak freeze, amount 1 |
| `theme_unlock` | `Habits \| theme_unlock \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_THEME_UNLOCK` | Reward: Theme unlock, amount 1. Premium themes are not built yet: create the unit anyway; the env var may stay unset |
| `app_open_warm` | `Habits \| app_open_warm \| App open` | App open | `EXPO_PUBLIC_ADMOB_APP_OPEN_WARM` | Warm start only |

Plus: `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`. Units: 7 (1 banner, 1 native, 2 interstitial, 2 rewarded, 1 app open).

## 2. Sipling (water reminder)

| Field | Value |
|---|---|
| AdMob app name | `Sipling: Drink Water Reminder` |
| Package | `com.fiveapps.sipling` (**placeholder: the final package name is undecided, see Open questions**) |
| Max ad content rating | **T** |
| App folder | `apps/water-reminder` |

| Placement | Ad unit name | Format | Env var | Notes |
|---|---|---|---|---|
| `home_under_ring` | `Sipling \| home_under_ring \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_HOME_UNDER_RING` | |
| `history_list` | `Sipling \| history_list \| Native` | Native advanced | `EXPO_PUBLIC_ADMOB_HISTORY_LIST` | |
| `history_exit` | `Sipling \| history_exit \| Interstitial` | Interstitial | `EXPO_PUBLIC_ADMOB_HISTORY_EXIT` | |
| `garden_unlock_skin` | `Sipling \| garden_unlock_skin \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_GARDEN_UNLOCK_SKIN` | Reward: Plant skin, amount 1 |
| `streak_freeze` | `Sipling \| streak_freeze \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_STREAK_FREEZE` | Reward: Streak freeze, amount 1 |
| `app_open_warm` | `Sipling \| app_open_warm \| App open` | App open | `EXPO_PUBLIC_ADMOB_APP_OPEN_WARM` | |

Plus: `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`. Units: 6 (1 banner, 1 native, 1 interstitial, 2 rewarded, 1 app open).
Block extra categories: weight loss, supplements (health-claim app, keep medical-claim ads out).

## 3. Word Search: Large Print Easy

| Field | Value |
|---|---|
| AdMob app name | `Word Search: Large Print Easy` |
| Package | `com.fiveapps.wordsearchlarge` |
| Max ad content rating | **PG** (older audience; the app sets PG in code, set the same in AdMob; G is also acceptable per `WHATS_LEFT.md`, PG is what the code sends) |
| App folder | `apps/word-search` |

| Placement | Ad unit name | Format | Env var | Notes |
|---|---|---|---|---|
| `home_banner` | `WordSearch \| home_banner \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_HOME_BANNER` | Never over the letter grid |
| `packs_banner` | `WordSearch \| packs_banner \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_PACKS_BANNER` | |
| `level_complete` | `WordSearch \| level_complete \| Interstitial` | Interstitial | `EXPO_PUBLIC_ADMOB_LEVEL_COMPLETE` | |
| `hint_refill` | `WordSearch \| hint_refill \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_HINT_REFILL` | Reward: Hint, amount 3 (informational; the app grants the real amount) |
| `app_open` | `WordSearch \| app_open \| App open` | App open | `EXPO_PUBLIC_ADMOB_APP_OPEN` | |

Plus: `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`. Units: 5 (2 banner, 1 interstitial, 1 rewarded, 1 app open).
Block: gambling, dating.

## 4. Quizora (trivia quiz)

| Field | Value |
|---|---|
| AdMob app name | `Quizora: Trivia Quiz Offline` |
| Package | `com.fiveapps.quizora` |
| Max ad content rating | **T** |
| App folder | `apps/trivia-quiz` |

| Placement | Ad unit name | Format | Env var | Notes |
|---|---|---|---|---|
| `menu` | `Quizora \| menu \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_MENU` | |
| `round_end` | `Quizora \| round_end \| Interstitial` | Interstitial | `EXPO_PUBLIC_ADMOB_ROUND_END` | |
| `lifeline` | `Quizora \| lifeline \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_LIFELINE` | Reward: Lifeline, amount 1 |
| `extra_life` | `Quizora \| extra_life \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_EXTRA_LIFE` | Reward: Extra life, amount 1 |
| `double_xp` | `Quizora \| double_xp \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_DOUBLE_XP` | Reward: Double XP, amount 1 |
| `streak_restore` | `Quizora \| streak_restore \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_STREAK_RESTORE` | Reward: Streak restore, amount 1 |
| `app_open` | `Quizora \| app_open \| App open` | App open | `EXPO_PUBLIC_ADMOB_APP_OPEN` | |
| `results_native` | `Quizora \| results_native \| Native` | Native advanced | `EXPO_PUBLIC_ADMOB_RESULTS_NATIVE` | |

Plus: `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`. Units: 8 (1 banner, 1 interstitial, 4 rewarded, 1 app open, 1 native).
Block: gambling, dating.

## 5. Contraction Timer & Kick Count

| Field | Value |
|---|---|
| AdMob app name | `Contraction Timer & Kick Count` |
| Package | `com.fiveapps.contractiontimer` (the plan says decide the final name before first upload) |
| Max ad content rating | **G** |
| App folder | `apps/contraction-timer` |

| Placement | Ad unit name | Format | Env var | Notes |
|---|---|---|---|---|
| `history_banner` | `ContractionTimer \| history_banner \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_HISTORY_BANNER` | |
| `week_banner` | `ContractionTimer \| week_banner \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_WEEK_BANNER` | |
| `checklist_banner` | `ContractionTimer \| checklist_banner \| Banner` | Banner | `EXPO_PUBLIC_ADMOB_CHECKLIST_BANNER` | |
| `week_native` | `ContractionTimer \| week_native \| Native` | Native advanced | `EXPO_PUBLIC_ADMOB_WEEK_NATIVE` | |
| `pdf_theme_reward` | `ContractionTimer \| pdf_theme_reward \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_PDF_THEME_REWARD` | Reward: PDF theme, amount 1 |
| `checklist_template_reward` | `ContractionTimer \| checklist_template_reward \| Rewarded` | Rewarded | `EXPO_PUBLIC_ADMOB_CHECKLIST_TEMPLATE_REWARD` | Reward: Checklist template, amount 1 |
| `week_close_interstitial` | `ContractionTimer \| week_close_interstitial \| Interstitial` | Interstitial | `EXPO_PUBLIC_ADMOB_WEEK_CLOSE_INTERSTITIAL` | |
| `app_open` | `ContractionTimer \| app_open \| App open` | App open | `EXPO_PUBLIC_ADMOB_APP_OPEN` | |

Plus: `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`. Units: 8 (3 banner, 1 native, 2 rewarded, 1 interstitial, 1 app open).
Block (from `WHATS_LEFT.md`): dating, gambling, alcohol, sexual and reproductive health, weight loss, cosmetic procedures,
get-rich-quick, politics, religion, drugs and supplements, astrology, shocking content, personal loans.

---

## Totals

| App | Units | Env vars (incl. app ID) |
|---|---|---|
| Habit Tracker | 7 | 8 |
| Sipling | 6 | 7 |
| Word Search | 5 | 6 |
| Quizora | 8 | 9 |
| Contraction Timer | 8 | 9 |
| **All** | **34** | **39** |

## Account-level settings (once, then per app where noted)

1. **Blocking controls** (per app, AdMob > Blocking controls > Sensitive categories): block gambling and dating in all five;
   use the longer list above for Contraction Timer and the health items for Sipling.
2. **Max ad content rating** (per app): see each app's header table.
3. **Privacy & messaging**: create the **GDPR (EEA/UK) message** and the **US state regulations message**, and attach them
   to all five apps. The app shows them on first launch through `@shared/consent` before any ad request.
4. **Test devices**: add the owner's phone (Settings > Test devices) so live ads are never clicked by accident.
5. **Publisher ID** (Settings > Account information, `pub-XXXXXXXXXXXXXXXX`): needed for `app-ads.txt`.
   Line: `google.com, pub-<id>, DIRECT, f08c47fec0942fa0`. Do not edit or host the file as part of the browser task.

## Open questions (resolve before or during the run)

- **Sipling package name** is a placeholder (`com.fiveapps.sipling`, also set in
  `packages/shared/src/crosspromo/catalog.ts`). It cannot change after the first Play upload. AdMob does not need the
  package for an unlisted app, so the browser task is not blocked, but confirm the final name before the first Play upload.
- **Contraction Timer** has the same note about its final package name.
- **Reward amounts** above are labels shown in AdMob only. The app code decides what is granted.

---

## Status (2026-10-13)

Done in the AdMob console: 5 apps and 34 ad units created, content ratings and blocking controls applied, US state
regulations message published. Publisher `pub-4070584433937766` (appears in `apps/*/store/app-ads.txt`, which is public
by design). Real app and unit IDs are in the git-ignored `ADMOB_IDS.local.json`; the matching
`eas-env-create.local.sh` (also git-ignored) sets them as EAS environment variables.

**Blocking state (applied in AdMob; do not change in code or docs without checking AdMob).** All 5 apps block: Dating,
Leisure Gambling, Social Casino Games, Alcohol & Substance Abuse, Alcoholic Beverages, Credit & Lending, Astrology &
Horoscopes, References to Sex, Sensationalism, Politics, Religion. Also blocked: Sipling adds Drugs & Supplements and
Weight Loss; Contraction Timer blocks all 11 sensitive categories. Max ad content rating: Habit T, Sipling T,
Word Search PG, Quizora T, Contraction Timer G.

Still open: GDPR (EEA+UK) message (needs a privacy policy URL per app first), test device ID, final Sipling and
Contraction Timer package names, linking AdMob apps to Play listings, Play Data safety, hosting `app-ads.txt`, mediation at ~1k DAU.
