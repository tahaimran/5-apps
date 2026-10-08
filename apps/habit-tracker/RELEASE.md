# Habit Tracker — release runbook and QA status

What is **done in the repo** (automated, repeatable) versus what **needs a device or an account**. Nothing
here claims a device test happened; those rows are open.

## 1. Automated checks (run before every build)
```bash
cd apps/habit-tracker
npx tsc --noEmit && (cd ../../packages/shared && npx tsc --noEmit)
npx jest                  # 420+ tests: domain, stores, UI smoke, a11y, config, assets
npm run test:tz           # streak/day-key tests in 7 time zones (DST, half-hour offsets, southern hemisphere)
npx expo-doctor
npx expo export --platform android --output-dir /tmp/ht-export   # Metro bundle sanity
npx expo prebuild --platform android --no-install --clean        # native config plugins resolve
```

## 2. One-time setup (needs your accounts)
1. **Expo/EAS:** `cd apps/habit-tracker && eas login && eas init` (adds `extra.eas.projectId` to the config; commit it).
2. **Package name:** `com.fiveapps.habittracker` in `app.config.ts` is a placeholder. Decide the final application ID
   *before the first upload* (it cannot change later). Update `packages/shared/src/crosspromo/catalog.ts` to match.
3. **AdMob:** create the app and 7 ad units (`.env.example` lists the variables). Add them as EAS environment variables
   (`eas env:create`), never in git. Register your own phone as a test device in AdMob.
4. **Privacy policy:** finish `store/privacy-policy.md`, host it, set `EXPO_PUBLIC_PRIVACY_POLICY_URL`.
5. **app-ads.txt:** fill in `store/app-ads.txt` and host it at the root of the developer website listed in Play Console.
6. **Play Console:** create the app, enrol in Play App Signing, add a service account for `eas submit` (see EAS docs).

## 3. Build and ship
```bash
eas build --profile development --platform android   # dev client (ads and widget need a native build)
eas build --profile preview     --platform android   # APK for testers and screenshots
eas build --profile production  --platform android   # AAB, versionCode auto-increments
eas submit --platform android                        # uploads to the internal track
```
- Internal testing → verify on real devices (section 4) → **closed testing** (12 testers for 14 days; personal accounts
  only) → production at 20% → 50% → 100% (watch crash-free ≥ 99.5%, ANR < 0.3%).
- After upload, read the **pre-launch report** and fix anything it flags.

## 4. Device QA matrix (all open until someone runs them)
| Area | Check | Status |
|---|---|---|
| Widget | add (long-press → Widgets), resize 4x2→4x4, toggle yes/no and +1 count, dark mode, after reboot, after app update, across midnight | open |
| Widget | tap timer row opens the habit; "+N more" opens Today; row icon tile shows the first letter (no icon font in widgets) | open |
| Notifications | grant / deny / re-ask from Settings, reboot, per-week target met cancels reminders, nudge disappears after completion, "Done ✓" with the app closed | open |
| Backup | export → uninstall → reinstall → import restores everything (file round trip is unit-tested) | open |
| Ads | test IDs in dev; banner under the list never covers the + button; no interstitial right after a check-in; consent form in the EEA (UMP debug geography); Privacy choices row | open |
| Ads | app-open after returning from background > 4 h on day ≥ 2; **not** after tapping a notification or the widget (ordering of the link event is best-effort) | open |
| Performance | cold start < 1.5 s on a Pixel 4a-class phone; scroll Today with 30 habits (`src/domain/__tests__/qa.perf.test.ts` covers the computation only) | open |
| Heatmap | a full year scrolls at 60 fps on a mid-range phone | open |
| Reorder | long-press drag on Today (`react-native-reorderable-list` + Reanimated 4 is untested on a device) | open |
| TalkBack | full flow: onboarding → check-in → detail → settings. Rows expose actions (increment, decrement, details, move up/down) | open |
| Font scale | 1.6× on every screen (layouts use min heights; the render audit runs at 1.6×) | open |
| Reduced motion | confetti and animations are skipped, toast still shows | open |
| 16 KB pages | `zipalign -c -P 16 -v 4 app.aab` / check the AAB with bundletool; confirm native libs (mmkv, reanimated, worklets, ads) are 16 KB-aligned | open |

## 5. Play Console content (drafted in `store/`)
| Item | Where | Status |
|---|---|---|
| Listing text (title, short, full) | `ASO.md` (limits checked by a test) | drafted |
| Icon 512, feature graphic 1024×500 | `store/` (made by `scripts/make-assets.mjs`) | ready |
| 8 screenshots 1080×1920 | `store/SCREENSHOTS.md`, demo data and Maestro flows | **to capture on a device** |
| Data safety | `store/DATA_SAFETY.md` | drafted, verify against Google's current AdMob guidance |
| Content rating | `store/CONTENT_RATING.md` | **decision needed** (substance templates) |
| Privacy policy | `store/privacy-policy.md` | draft, needs hosting |
| app-ads.txt | `store/app-ads.txt` | template |
| Permissions | `app.config.ts` + `src/__tests__/config.test.ts`; merged manifest checked with `expo prebuild` | done |
| Target API | 36 (checked by test: ≥ 35) | done |

## 6. Known gaps carried over from days 1–6
- Welcome step uses an animated flame, not the plan's Lottie.
- Widget rows show a letter tile, widget controls are 36 dp (launcher space), not 48 dp.
- Premium themes and the rewarded `theme_unlock` placement are v1.1 (not built).
- Per-session (6) rather than per-day interstitial cap; no "after the first 3 habits" rule; no crash-free-session check
  before the review prompt.
- `app-open` suppression for notification/widget launches depends on event ordering.
- Reminders are dated triggers re-planned on open/widget refresh, not weekly repeating triggers.
- Category filter chips on Today and count long-press (−1 / custom value) from the plan are not built.
- Archived habits that are unarchived after many days show a broken streak for the hidden days.
