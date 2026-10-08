# Screenshots (8 × 1080×1920, portrait)

The storyboard and captions are in `../ASO.md §6`. Screenshots must show the real app, so they have to be
captured from a build on a device or emulator. They are not generated here.

## Capture
1. Install a build (`eas build --profile preview`), clean install, system language English, light theme,
   1080×1920 emulator (Pixel 4a class), demo mode on (clock 9:41, full battery).
2. Onboarding slides (5): `maestro test .maestro/screenshots-onboarding.yaml`
3. Load demo data: `adb push store/demo-backup.json /sdcard/Download/` →
   Settings → Backup & restore → Import → pick `demo-backup.json` → Replace and restore.
   (`node scripts/make-demo-backup.mjs --end YYYY-MM-DD` regenerates it so the history ends today.)
4. App screens: `maestro test .maestro/screenshots-app.yaml` (writes PNGs to `store/screenshots/`).
5. Widget slide (2) and notification slide (7) are taken by hand: add the widget to a launcher with the
   light and dark wallpaper; trigger a reminder with `adb shell cmd notification post`.
6. Add captions and the violet gradient frame in a design tool (Inter Bold 64px, one orange word).

## Mapping
| # | Source |
|---|---|
| 1 Today, streak 12 | `screenshots-app.yaml` → `01-today` (demo data: 4 habits, flame 12) |
| 2 Widget | manual |
| 3 Heatmap | `02-detail` |
| 4 Count + timer | `03-count-timer` (Today scrolled to water + study) |
| 5 Onboarding | `screenshots-onboarding.yaml` → `goals`, `starters` |
| 6 Freeze | manual: Settings → Streak freezes, or the at-risk card on Today in the evening |
| 7 Reminders | Settings → Reminders + a system notification |
| 8 Privacy/backup | `04-backup` |
