# Workflow: models, token budget, automation & fast launch

## 1. Which Claude model for what
| Task | Model | Why |
|------|-------|-----|
| Writing app code from `DEVELOPMENT_PLAN.md` (≈90% of the work) | **Sonnet 5.5** (`claude-sonnet-5-5`) | Strong at React Native/Expo coding, much cheaper than Opus, and fast. Use it as your default in Claude Code. |
| Architecture decisions, `packages/shared` design, tricky bugs, pre-release review | **Opus 5.5** (`claude-opus-5-5`) | Use only at checkpoints, roughly 1–2 sessions per app. |
| Bulk content: the trivia question bank, word lists, pregnancy week cards, translations of strings and store listings, ASO description variants | **Haiku 5.5** (`claude-haiku-5-5`) | Cheapest model, and good enough for structured generation that gets validated by scripts. |

In Claude Code you can switch with `/model sonnet` (default), `/model opus` (review), `/model haiku` (content).

## 2. How to spend fewer tokens
1. **One app per session**, and start each session with: *"Read CLAUDE.md and apps/<app>/DEVELOPMENT_PLAN.md. Implement milestone N."* Don't paste requirements again; the plan already holds them.
2. **Build `packages/shared` once** (ads, consent, storage, onboarding carousel, theme, i18n, rating prompt). After that, each app only writes its own screens and logic.
3. **Clone the pattern instead of re-explaining it.** Water Reminder reuses Habit Tracker's reminders, streaks and charts: *"Copy src/features/streaks from habit-tracker and adapt it."*
4. **Keep sessions short.** Finish a milestone, commit, then start a new session. Long sessions pay to re-read context every turn.
5. **Let scripts verify instead of the model.** `tsc --noEmit`, `expo-doctor`, JSON schema validation for content. Ask Claude to run them instead of reading the code to reason about it.
6. **Generate content in batches with Haiku.** For example, 200 questions per call written to JSON, followed by a dedupe and validation script.

## 3. Automation pipeline (EAS)
One-time per app:
```bash
cd apps/<app>
npx eas-cli@latest login
eas init                    # creates the projectId
eas build:configure         # creates eas.json
eas credentials             # let EAS generate & hold the Android upload keystore
```
`eas.json` profiles: `development` (dev client, internal), `preview` (APK for testers), `production` (AAB, autoIncrement versionCode).

Google Play submit (one-time): create a **Google Cloud service account** with access in Play Console → upload its JSON key to EAS (`eas credentials` → Google Service Account). After that:
```bash
eas build -p android --profile production --auto-submit   # build + upload to Play internal track
```
**CI/CD with EAS Workflows** (`.eas/workflows/release.yml` in each app):
- On push to `main` with changes under `apps/<app>/**`: build production → submit to the **internal** track.
- Promote internal → closed → production manually in Play Console. Use staged rollouts: 20% → 50% → 100%.
- JS-only or content changes (new questions, word packs, ad caps JSON): `eas update --channel production`. This ships in minutes with no store review.

## 4. Fastest path to launch (per app, ~1 week each)
| Day | Work |
|-----|------|
| 1 | `create-expo-app` in `apps/<app>`, wire shared packages, theme, navigation skeleton, dev build with test ads |
| 2–4 | Core features from the plan (MVP section only) |
| 5 | Onboarding, notifications, ads placements, settings, privacy link |
| 6 | Polish, i18n file, screenshots (Android emulator + a frame tool), store listing from `ASO.md` |
| 7 | Production build → internal testing → closed testing (the 12-tester/14-day rule for new personal accounts) |

Run the closed tests for several apps **in parallel**, since the 14-day clock is the bottleneck, not the coding.

## 5. After launch (every 2–4 weeks, per app)
1. Add the published app in Applyra (`add_application`) and `track_keywords` with the list from its `ASO.md`.
2. Read rank history and ASO health. Rewrite the short or long description with `simulate_metadata` and keep a change only if the score improves.
3. Localize the listing into the next 2–3 languages (Haiku translates; a native speaker spot-checks the title).
4. Ship one visible improvement per update. Freshness of updates is part of the ranking.
5. Ask for ratings at happy moments only (Google In-App Review API via `expo-store-review`).
