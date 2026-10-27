# Screenshots (8 × 1080×1920, portrait) and feature graphic

The final set is in `store/screenshots/` (`01-build-habits.png` … `08-private.png`) and the feature graphic is
`store/feature-graphic-1024x500.png`. Upload them in this order. They follow the storyboard in `../ASO.md §6`.

## How they were made
Every phone screen and pop-out card is the **real app UI**: the app was run with Expo for web (react-native-web)
in headless Chrome at a 412×915 dp phone viewport (2.625× density, so a 1082×2402 capture), with demo data restored
from `store/demo-backup.json` (history ending Thursday 2026-10-29, clock fixed at 9:41). Native-only modules
(AdMob, notifications) were stubbed for the web render. The home-screen widget on slide 2 is the real `TodayWidget`
component rendered from the same data; the launcher around it (wallpaper, clock, dock) is drawn.
The compositor then adds the violet panorama art (one ribbon flowing across all 8 slides), captions in Bricolage
Grotesque 800, a phone frame with a 9:41 status bar, and enlarged "pop-out" crops of the same captures.
The tooling is in `tools/store-shots/` (see its README).

## Captions
| # | File | Caption | Sub-line |
|---|---|---|---|
| 1 | 01-build-habits | Build habits that **stick** | Daily streaks, reminders & a widget |
| 2 | 02-widget | Check off from your **home screen** | Tick habits without opening the app |
| 3 | 03-progress | See your progress **grow** | Heatmap, best streak & completion rates |
| 4 | 04-count-timer | Track water, workouts & **study time** | Yes/no, counts and timers |
| 5 | 05-stats | Weekly stats that **motivate** | Every check-in adds up |
| 6 | 06-streak-freeze | Missed a day? **Keep your streak** | Streak freezes protect your progress |
| 7 | 07-reminders | Gentle reminders, **your way** | Pick the time for each habit |
| 8 | 08-private | Private. Offline. **No sign-up.** | Your habits stay on your phone |

Play's graphics policy bans price and promotional wording in screenshots and the feature graphic, so "no paywall"
and "free" are not used there (they stay in the full description). The feature graphic tagline is
"Streaks, reminders & a widget".

## Before upload
- Recapture after any UI change that shows on these screens (the captures reflect `main` on 2026-10-26).
- When a real device build is available, spot-check that the screens match it (fonts, spacing).
