# CLAUDE.md — rules for AI coding sessions in this repo

## Project status (update when it changes)
- Default branch: `main` (renamed from `Main`). Branch from it and PR back into it.
  The old `claude/*` build branches are merged and can be ignored.
- Built: shared package + all 5 apps (habit-tracker, water-reminder, word-search,
  trivia-quiz, contraction-timer). Milestones are ticked in each app's DEVELOPMENT_PLAN.md.
- Verified on `main` (2026-10-26, after merging `feat/ui-polish`): tsc clean, all jest tests pass in every package.
- EAS: all 5 apps linked to Expo account `tuahaimran` (owner + projectId in each `app.config.ts`);
  first `preview` APKs built 2026-10-09. Keystores are EAS-managed. Build from the app folder.
- UI redesign from `feat/ui-polish` (merged into `main` 2026-10-26): Habits, Water and Quizora are on the shared kit
  (Figtree/Bricolage, Lucide, motion, sounds, 12/24-hour TimeField, chime channels, new icons). Quizora's redesign
  (2026-10-24) is Jest-verified only and needs a new dev build before it can be seen on a phone.
  Contraction Timer's redesign ("Dawn", 2026-10-25, plan §7) is on the kit too (Night stays in the shared
  high-contrast slot, sounds off by default, chime channel `kick-chime`); also Jest-verified only, needs a dev build.
  Word Search's redesign ("Sky Garden", 2026-10-25, plan §7) is on the kit too: sky stage, gold ribbons, lime 64dp
  game buttons, hand-drawn pack pictures, Atkinson for the grid (Figtree/Bricolage elsewhere), a UI-thread selection
  pill, shared `Confetti` (new in `@shared/ui`), chime channel `daily-chime`; high contrast stays black/white/yellow AAA.
  Jest-verified only; it adds native modules, so it needs its own new dev build.
- Store assets (2026-10-26, uncommitted until reviewed): every app has 8 Play screenshots in `store/screenshots/`
  (real UI rendered with Expo web + captions/art; tooling and how-to in `tools/store-shots/`), a new feature graphic,
  a new icon set (from each `scripts/generate-icons.cjs`; needs a new native build to show on a phone), and
  privacy policy / DATA_SAFETY / CONTENT_RATING docs in `store/`. `docs/PLAY_UPLOAD.md` is the upload runbook.
  The listing wording fixes from WHATS_LEFT are applied in each `ASO.md` and re-checked in Applyra.
- Next: `docs/PLAY_UPLOAD.md` §E decisions, then each app's `WHATS_LEFT.md` (device testing, real AdMob IDs
  in EAS, privacy policy hosting, Play Console forms, closed testing).

## What this repo is
An npm-workspaces monorepo of 5 Expo (React Native, TypeScript) Android apps monetized only by AdMob.
There is no backend, no auth and no remote database. All data lives on the device (MMKV), and content is either bundled or generated locally.

```
apps/<app>/                 # one Expo app each: habit-tracker, water-reminder, word-search, trivia-quiz, contraction-timer
apps/<app>/DEVELOPMENT_PLAN.md   # THE spec. Build from it; do not invent features outside it.
apps/<app>/ASO.md                # store listing source of truth
packages/shared/            # ads, consent, storage, onboarding, theme, i18n helpers (see its README)
docs/                       # strategy, AdMob playbook, workflow, research
```

## Working rules
1. **One app per session.** Read only `CLAUDE.md`, the target app's `DEVELOPMENT_PLAN.md` and `packages/shared/README.md`. Don't read the other apps' plans.
2. **Build milestone by milestone** using the plan's milestone checklist. Tick the boxes in the plan as you finish them.
3. **Never call AdMob SDK APIs directly from app code.** Always go through `@shared/ads` (`<AdBanner placement>`, `showInterstitial(placement)`, `showRewarded(placement)`, `<NativeAdCard>`). Frequency caps and the rules about when ads must not show live in the shared layer, configured per app in `apps/<app>/src/ads.config.ts`.
4. **Storage** goes only through `@shared/storage` (MMKV, typed keys, versioned migrations). Never use network calls for app data.
5. **Use test ad unit IDs in dev.** Real IDs come from `EXPO_PUBLIC_ADMOB_*` env vars set in EAS. Never commit real IDs.
6. **Use Expo Router file-based routes.** Use `expo-image`, Reanimated for animation, and `expo-haptics` for feedback.
7. **Accessibility:** minimum touch target 48dp (56dp in the senior/maternity apps), respect the system font scale, set `accessibilityLabel` on every icon button.
8. **All user-facing strings go in `src/i18n/en.json`.** No hardcoded copy. This keeps localization cheap.
9. **Keep dependencies minimal.** Before adding a library, check whether Expo or the shared package already covers it.
10. **Before committing:** run `npx tsc --noEmit` and `npx expo-doctor` in the app folder, and `npx eslint .` if configured.

## Commands
- Dev build (needed for AdMob): `cd apps/<app> && eas build --profile development --platform android`
- Run: `npx expo start --dev-client`
- Production: `eas build --profile production --platform android && eas submit --platform android`
- OTA JS/content update: `eas update --channel production`
