# Screenshots (8 × 1080×1920, portrait) and feature graphic

Made on 2026-10-26 from the **real app UI**: the app was rendered with Expo web (react-native-web) in headless
Chrome at a 412×915 dp phone viewport (×2.625, so 1082×2402 px captures), with believable state seeded through a
temporary route, then framed by a compositor. Storyboard and copy follow `../ASO.md §6`.

## Final set (`store/screenshots/`)
| # | File | Caption | Sub-line | Real screens used |
|---|---|---|---|---|
| 1 | `01-big-letters.png` | **Big Letters. Easy to Read.** | Word search in large print | Game, Large text, 3 of 5 words found; zoomed crop of the grid |
| 2 | `02-letter-size.png` | **Pick Your Letter Size** | From comfortable to huge | Settings → Letter size; the grid at Comfortable and at Huge |
| 3 | `03-no-timers.png` | **No Timers. No Pressure.** | Play at your own pace | Game (Food, Extra Large text), word list crop |
| 4 | `04-offline.png` | **Play Offline, Anywhere** | Unlimited puzzles, no Wi-Fi needed | Home; the airplane-mode and Wi-Fi chips are art |
| 5 | `05-packs.png` | **12 Themed Word Packs** | Animals, food, travel, holidays and more | Home scrolled to Word packs; Animals and Travel cards |
| 6 | `06-daily.png` | **A New Puzzle Every Day** | Build your daily streak | Daily tab (calendar, 12-day streak); Puzzle Complete stars and 13-day streak |
| 7 | `07-contrast-dark.png` | **High Contrast & Dark Mode** | Comfortable day or night | Game in high contrast and in dark |
| 8 | `08-easy-to-hard.png` | **Easy to Hard. You Choose.** | Diagonals and backwards words for a challenge | Pack screen (Easy/Medium/Hard), a Hard grid with diagonal words |

Changes from the ASO.md storyboard: #5 says "12 Themed Word Packs" instead of "Dozens of Themed Packs" (the app
ships 12 packs). Style: one continuous "Sky Garden" panorama across all 8 (sky, sun, clouds, rolling hills with
flowers, floating letter tiles), Bricolage captions in ink `#13233F` with the accent phrase in `#E0591F`, a phone
frame with a 9:41 status bar, and pop-out crops of the same captures. No price, "free", ranking or award text.

`feature-graphic-1024x500.png`: sky scene, the app icon, "Large Print **Word Search**", "Big letters · No timers ·
Play offline", and a tilted phone with the real game screen plus a zoomed grid crop. Key text sits left of center,
inside the safe area.

The app icon (`icon-512.png` and the launcher set in `../assets`) comes from `../scripts/generate-icons.cjs`.

## Regenerate
The tooling is in `tools/store-shots/` (see its README): `capture.cjs` (puppeteer-core + system Chrome, one
incognito context per shot, fake clock, injected fonts), `compose.cjs` (HTML compositor), the spec `specs/ws.cjs` and
`specs/ws-feature.cjs`, capture configs `capture/ws*.json` (`capture/ws-gen.cjs` writes `ws.json`), and `web/` (Metro
config that stubs AdMob/notifications on web, font CSS, serve/wait/kill scripts).

1. Temporarily: add `'web'` to `platforms` in `app.config.ts`, add `metro.config.js` with
   `module.exports = require('../../tools/store-shots/web/metro.web.js')(__dirname);`, and an `app/shots.tsx` route that marks
   onboarding and the tutorial done, sets the text size, theme and difficulty, records pack progress (stars), a
   12-day daily streak, stats, and an in-progress puzzle with N words found (`useGame`/`db.set('current')`), then
   `router.replace(go)`. Install `react-native-web@~0.21.0 @expo/metro-runtime@~57.0.17` with `npm i --no-save`.
2. `tools/store-shots/web/serve.sh word-search 8092`, then capture with `fakeTime: 2026-10-29T10:12:00` and the CSS
   `a[role=tab] div{overflow:visible !important}` (on web the tab labels are clipped by 7px without it).
3. `node compose.cjs specs/ws.cjs` and `node render.cjs specs/ws-feature.cjs ../../apps/word-search/store/feature-graphic-1024x500.png`; check every PNG.
4. Revert `app.config.ts` and delete `metro.config.js` and `app/shots.tsx`.

Before upload, recapture if the UI changes; the screenshots must keep matching the app.
