# 5-Apps — AdMob Portfolio for Google Play

Five offline Android apps built with **Expo (React Native)**. They have no backend, no login and no server database. Everything is stored on the device.
The goal: **$10,000/month from AdMob**, with downloads coming from ASO (organic Play Store search).

| # | Store title (validated with Applyra check_metadata) | Folder | Audience | Primary keyword (Applyra traffic / difficulty) | Launch order |
|---|-----|--------|----------|-----------------------------------------------|--------------|
| 1 | **Habit Tracker: Streak & Widget** | [`apps/habit-tracker`](apps/habit-tracker) | Young adults, students, self-improvement | `habit tracker free` **39 / 18** | 1st |
| 2 | **Sipling: Drink Water Reminder** | [`apps/water-reminder`](apps/water-reminder) | Women, weight-loss, office workers | `drink water reminder` 52 / 47, `water reminder app` 25 / 27 | 2nd |
| 3 | **Word Search: Large Print Easy** | [`apps/word-search`](apps/word-search) | Adults 45+, seniors | `word search` 79 / 70, `word search for seniors` 9 / 36 | 3rd |
| 4 | **Quizora: Trivia Quiz Offline** | [`apps/trivia-quiz`](apps/trivia-quiz) | Teens 13+ to adults | `trivia quiz` 44 / 57, `iq boost quiz` 34 / 30 | 4th |
| 5 | **Contraction Timer & Kick Count** | [`apps/contraction-timer`](apps/contraction-timer) | Pregnant women & partners | `contraction timer` 54 / 63, `baby kick counter` 25 / 51 | 5th |

Each app folder contains:
- `DEVELOPMENT_PLAN.md`: features, every screen, the onboarding flow with real copy, design system, data model, ad placement map, milestones, and release checklist.
- `ASO.md`: title, short and full description (none of them uses the word "free" in the title or short description; Google Play rejects both), keywords, competitors, screenshot storyboard, localization, and the iteration plan.

Portfolio-wide docs:
- [`docs/RESEARCH.md`](docs/RESEARCH.md): the Applyra data behind every choice, plus the ideas that were rejected and why.
- [`docs/ADMOB_PLAYBOOK.md`](docs/ADMOB_PLAYBOOK.md): ad formats, placements, frequency caps, consent, mediation, and policy.
- [`docs/PREBUILD_CHECKS.md`](docs/PREBUILD_CHECKS.md): verification done before any code (listing checks, competitor data, tooling).
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md): which Claude model to use, how to save tokens, and how to automate builds and launches with EAS.
- [`packages/shared`](packages/shared): the shared code contract (ads, storage, onboarding, theme, consent) that all 5 apps reuse.
- [`CLAUDE.md`](CLAUDE.md): rules that keep AI-generated code consistent across apps.

---

## Why these five?

1. **Mix of games and utilities.** The two games (Word Search, Trivia) bring the most ad revenue per user, because people play long sessions with natural breaks for interstitial and rewarded ads. The three utilities (Habit, Water, Contraction) bring the most installs per keyword and daily opens driven by notifications.
2. **Each one wins on a keyword it can actually rank for.** For every app we enter through a long-tail or low-difficulty keyword (e.g. `habit tracker free` has difficulty 18). As ratings and installs build up, we climb toward the head term.
3. **Different audiences, so the apps don't compete with each other.** Seniors (US, highest eCPM), women and wellness, students, expecting parents, and general trivia players. We cross-promote between apps with house ads, which is free traffic.
4. **Nothing needs a server.** Content is either bundled (word lists, question bank, pregnancy weeks) or generated on the device. Running costs are $0/month apart from the $25 one-time Play developer fee.

Ideas we rejected: kids' apps (Google's Families policy restricts AdMob to lower-paying ad networks), period tracker (traffic 79 but difficulty 72, dominated by Flo/Clue), white noise (traffic spread across too many keywords), and a full pregnancy tracker (BabyCenter and What to Expect own it, so we enter through the contraction timer niche instead).

## The $10k/month math (honest version)

Revenue = DAU × ARPDAU × 30. ARPDAU is average revenue per daily active user, from ads.

| App | Target DAU (month 9–18) | Est. ARPDAU | $/day |
|-----|------------------------|-------------|-------|
| Word Search | 4,000 | $0.05 | $200 |
| Trivia Quiz | 3,000 | $0.03 | $90 |
| Habit Tracker | 2,500 | $0.012 | $30 |
| Water Reminder | 2,500 | $0.012 | $30 |
| Contraction Timer | 1,000 | $0.015 | $15 |
| **Total** | **13,000** | | **≈ $365/day ≈ $11k/month** |

- 13k DAU usually means **300k–600k total installs**, depending on retention.
- ARPDAU depends mostly on **country mix**. US, UK, CA, AU and DE users earn 5–10× more than users in India or Indonesia. That is why the main listing targets US English and why we localize into DE, FR, JA and KO as well as the large-volume languages.
- **This is a 9–18 month target, not a 30-day one.** ASO compounds: ratings → conversion → rank → installs. No ASO strategy can guarantee it. Whether we get there depends on retention (D1 ≥ 35%, D7 ≥ 15%), keeping the rating at 4.5★ or above, and shipping updates steadily.
- Stretch levers: mediation (+20–40% eCPM), localizing all 5 listings into 10+ languages (2–4× more search surface), cross-promotion, and, once ad revenue is proven, a small UA budget on whichever app has the best ARPDAU.

## Launch plan

| Week | Milestone |
|------|-----------|
| 0 | Play Console + AdMob accounts, privacy policy page (GitHub Pages), app-ads.txt on a domain, `packages/shared` built |
| 1–2 | **Habit Tracker** MVP → internal testing → production. Easiest keyword, so it validates the pipeline |
| 3 | **Water Reminder** MVP (reuses about 60% of the Habit code: reminders, streaks, charts) |
| 4–5 | **Word Search** MVP (first game; tune interstitial and rewarded ads) |
| 6–7 | **Trivia Quiz** MVP (question bank generated with a cheap model) |
| 8 | **Contraction Timer** MVP |
| 9+ | Every 2–4 weeks per app: ASO iteration (Applyra rank tracking), localization batches, feature updates, mediation tuning |

Google Play note: new **personal** developer accounts must run a **closed test with at least 12 testers for 14 days** before they can publish to production. Start that clock in week 1 for every app; the testers can be the same 12 people for all 5 apps. An organization account (requires a D-U-N-S number) skips this requirement.

## Tech stack (all apps)

Expo SDK (latest) · Expo Router · TypeScript · `react-native-google-mobile-ads` (with Google UMP consent) · `react-native-mmkv` · `expo-notifications` (local only) · `expo-localization` + i18n JSON · Reanimated · EAS Build / Submit / Update. Organized as an npm workspaces monorepo: `apps/*` plus `packages/*`.
