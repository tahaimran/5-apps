# Screenshots (8 × 1080×1920, portrait) and feature graphic

Final files: `store/screenshots/01-…08-*.png` (upload in this order) and `store/feature-graphic-1024x500.png`.
Storyboard source: `../ASO.md §6`; feature graphic: `§7`.

## How they were made (2026-10-26)
Every phone screen is the **real app UI**, rendered by Expo web from this app's own code, not redrawn:

1. Temporary web build: `platforms: ['android', 'web']` in `app.config.ts`, a `metro.config.js` that swaps the
   native-only modules (AdMob, notifications, task manager, background task, intent launcher, store review) for
   no-op stubs on web, and an `app/shots.tsx` route that restores the demo backup
   (`scripts/make-demo-backup.mjs`, history ending Thu 2026-10-29, edited to a 12-day streak) and opens a screen.
   All of these were removed again afterwards.
2. Headless Chrome (puppeteer-core) captured each screen at a 412×915 dp phone viewport (DPR 2.625 ≈ 1080×2400),
   light mode, clock pinned to 13:41, the app's Figtree/Bricolage fonts loaded.
3. A compositor placed each capture in a phone frame with a status bar (13:41), a big Bricolage caption with one
   accent phrase, a water panorama that runs across all 8 slides (sky, droplets, leaves, waves, bubbles), and
   "pop-out" zooms cropped from the same capture.

Compromise: **slide 2's notification shade is a faithful mock**, since a system notification can't be rendered on
web. Its text and buttons are the app's own strings (`notify.title`, `notify.messages.0`, `notify.addCup`,
`notify.snooze` in `src/i18n/en.json`) and the real notification icon; the background is the blurred Today screen.
Replace it with a device capture (`adb shell cmd notification post …`, see below) when a phone is at hand if you prefer.

The feature graphic uses the app's real plant art (the SVG from `src/components/Plant.tsx`, stages 0, 2 and 4) and
the new icon. Policy checks: no "free"/price/promo/ranking wording anywhere (the Privacy screen, which says "ads to
stay free", was replaced by Backup and restore on slide 8); no medical claims.

## Captions
| # | File | Caption (accent in *italics*) | Sub-line | Screen |
|---|---|---|---|---|
| 1 | 01-grow-your-plant | Drink water, *grow your plant* | Every glass helps it bloom | Today, hero zoomed |
| 2 | 02-reminder | Log right from *the reminder* | One tap adds a glass. No need to open the app. | Notification shade (mock, real copy) |
| 3 | 03-daily-goal | Your personal *daily goal* | Based on weight, activity & climate | Settings → Daily goal |
| 4 | 04-smart-reminders | Smart reminders, *only when awake* | Spread from wake-up to bedtime | Settings → Reminders |
| 5 | 05-garden | Build a streak, *watch it bloom* | Your plant grows with every goal day | Garden, streak 12 |
| 6 | 06-weekly-progress | See your *weekly progress* | Daily, weekly & monthly charts | History → Week |
| 7 | 07-drinks | Water, coffee, tea *& more* | Quick-add cups in one tap | Add a drink + Today's quick-add row |
| 8 | 08-private | Private, offline, *no sign-up* | Your data stays on your phone | Backup and restore + Today in dark mode |

## Regenerating
The tooling is in `tools/store-shots/` (see its README): spec `specs/wr.cjs`, feature graphic `specs/wr-feature.cjs`,
capture configs `capture/wr*.json`, demo data `data/wr-demo.json`. After any UI change, re-capture rather than editing
the PNGs. The app's temporary seeding route (`app/shots.tsx`) was deleted after capture; write a new one the same
way (see the README) when you recapture.

The icon set comes from `scripts/generate-icons.cjs` (see its header); the 512 icon is used inside slide 2 and the
feature graphic, so regenerate those after an icon change.

## Device capture (optional, for the notification slide)
`adb shell cmd notification post -S bigtext -t 'Time for a sip' sipling 'Your plant is a little thirsty. A few sips?'`
gives the shade without the action buttons; the real "Add 250 ml / Snooze 15 min" buttons come from a scheduled
reminder (Settings → Reminders, or set the wake time a few minutes ago).
