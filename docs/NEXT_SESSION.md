# Kickoff prompts for build sessions (copy-paste)

Use **Sonnet 5.5**, one session per step. Everything needed is in the repo; no chat history is required.

## Session 1: shared package
> Read CLAUDE.md, packages/shared/README.md and docs/ADMOB_PLAYBOOK.md. Set up the npm-workspaces monorepo and implement packages/shared exactly as specified (consent, ads, storage, onboarding, theme, i18n, review, notify, crosspromo) with TypeScript. Use AdMob test IDs. Run tsc, then commit and push.

## Session 2+: one app (start with habit-tracker)
> Read CLAUDE.md, packages/shared/README.md and apps/habit-tracker/DEVELOPMENT_PLAN.md. Create the Expo app in apps/habit-tracker and implement milestone 1 (then 2, 3…). Tick the milestone checkboxes in the plan, run tsc and expo-doctor, then commit and push.

Order: habit-tracker → water-reminder → word-search → trivia-quiz → contraction-timer.

## Personal Play account reminder
The 14-day / 12-tester closed test can only start once the first build is uploaded. So as soon as each app has a working `preview`/`production` build, upload it to **Closed testing** and invite the same 12 testers to every app.
