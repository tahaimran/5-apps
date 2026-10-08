# Screenshots (8 × 1080×1920, portrait)

The storyboard and captions are in `../ASO.md §6`. Screenshots must show the real app, so they have to be
captured from a build on a device or emulator. They are not generated here. **None has been captured yet.**

## Capture
1. Install a build (`eas build --profile preview`), clean install, system language English, light theme,
   1080×1920 emulator (Pixel 4a class), demo mode on (clock 9:41, full battery).
2. Onboarding screens: `maestro test .maestro/screenshots-onboarding.yaml`
3. Load demo data: `adb push store/demo-backup.json /sdcard/Download/` →
   Settings → Backup and restore → Restore from a backup → pick `demo-backup.json` → Restore.
   (`node scripts/make-demo-backup.mjs --end YYYY-MM-DD` regenerates it so the history ends today.)
4. App screens: `maestro test .maestro/screenshots-app.yaml` (writes PNGs to `store/screenshots/`).
5. The notification shot (2) is taken by hand: trigger a reminder with
   `adb shell cmd notification post -S bigtext -t 'Time for a sip' sipling 'Your plant is a little thirsty.'`
   (the real action buttons come from a scheduled reminder: use Settings → Reminders and wait, or set the wake
   time to a few minutes ago).
6. Add captions and the light-blue frame in a design tool (Nunito ExtraBold, `#11263A`, accent `#2B9FE6`).

## Mapping
| # | Source |
|---|---|
| 1 Today, plant + ring | `screenshots-app.yaml` → `01-today` (demo data: streak 6, 53% of 2,300 ml) |
| 2 Reminder with "Add 250 ml" | manual |
| 3 Goal reveal | `screenshots-onboarding.yaml` → `goal` |
| 4 Reminder schedule | `screenshots-app.yaml` → `02-reminders` |
| 5 Garden | `screenshots-app.yaml` → `03-garden` |
| 6 History charts | `screenshots-app.yaml` → `04-history-week` |
| 7 Quick add cups + drink picker | `screenshots-app.yaml` → `05-log-custom` (the widget in ASO §6 is v1.1: use this instead) |
| 8 Privacy + dark mode | `screenshots-app.yaml` → `06-privacy-dark` |
