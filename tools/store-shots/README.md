# store-shots — Play Store art from the real app UI

Makes each app's 8 phone screenshots (1080×1920), its feature graphic (1024×500) and an icon stand-out check.
Every phone screen and pop-out card is the **real app UI**. The app runs with Expo for web (react-native-web) in
headless Chrome at a 412×915 dp phone viewport (2.625×, so captures are 1082×2402), using seeded demo data and a
fixed clock. The art around it (backgrounds, captions, phone frame, status bar) is HTML/SVG rendered by the same
Chrome. Not an npm workspace; it has its own `node_modules`.

Made on 2026-10-26 for all 5 apps. Outputs live in each app's `store/` (see each `store/SCREENSHOTS.md`).

## Setup (once)
```sh
cd tools/store-shots
npm install            # puppeteer-core, @resvg/resvg-js, pngjs
npm run fonts          # writes web/fonts.css + web/pre.js from the repo's Figtree / Bricolage / Atkinson files
# Expo web needs these at the repo root; --no-save keeps package.json and the lockfile untouched:
cd ../.. && npm i --no-save react-native-web@~0.21.0 @expo/metro-runtime@~57.0.17
```
Chrome is expected at `C:/Program Files/Google/Chrome/Application/chrome.exe`; set `CHROME=<path>` otherwise.

## Layout
| Path | What |
|---|---|
| `capture.cjs <capture/x.json> [names]` | Opens each shot URL in its own incognito context, injects fonts, a fake clock (`fakeTime`), extra CSS and demo data (`window.__DEMO__`), runs steps (click by text/label, scroll, eval), saves PNGs to `raw/<app>/`. |
| `compose.cjs <specs/x.cjs> [names]` | Builds the 1080×1920 screenshots: panorama art across all slides, caption, phone frame + status bar, pop-out crops (`anchor: true` scales a crop up over its own spot). `OUT=<dir>` renders elsewhere for a dry run. |
| `render.cjs <specs/x-feature.cjs> <out.png>` | Renders a module that exports `{ width, height, html }` (Habits, Quizora, Contraction Timer feature graphics). |
| `specs/wr-feature.cjs <out.png>`, `specs/ws-feature.cjs` | Standalone feature-graphic scripts (Sipling, Word Search). |
| `sheet.cjs`, `grid.cjs`, `rows.cjs`, `crop.cjs` | Review helpers: contact sheet, ruler overlay for reading crop coordinates, card edges in a column, crop. |
| `serp.cjs <out> <icon> <title> "<url>\|<name>"…` | Mock Play search grid: your icon among competitors' (icon URLs from Applyra `inspect_keyword`). |
| `web/` | `metro.web.js` (stubs native-only modules on web: AdMob, notifications, task manager…; renders the Habits widget with `widget-shim.js`), `serve.sh` / `wait.sh` / `kill.sh` for the Expo web server. |
| `capture/` | The capture configs used (`*.json`; `ws-gen.cjs` writes `ws.json`). Paths are relative to the config file. |
| `data/` | Demo data fed to the seeding route (Habits backup, Sipling backup). |
| `routes/habit-tracker/` | The temporary seeding routes used for Habits, as an example for the others. |
| `raw/` | Captures (git-ignored; kept locally so compositions can be re-rendered without recapturing). |

## Recapture one app (example: Habits on port 8090)
1. In `apps/habit-tracker`, temporarily:
   - add `'web'` to `platforms` in `app.config.ts`;
   - create `metro.config.js`: `module.exports = require('../../tools/store-shots/web/metro.web.js')(__dirname);`
   - copy `routes/habit-tracker/*.tsx` into `app/`. Other apps need their own `app/shots.tsx` that seeds the stores
     (onboarding done, progress, streaks) from route params / `window.__DEMO__` and then `router.replace(go)`.
2. `tools/store-shots/web/serve.sh habit-tracker 8090` (keep it running), then `web/wait.sh habit-tracker 8090`.
   The server runs in CI mode, so restart it after adding routes.
3. `node capture.cjs capture/ht.json`, then `node compose.cjs specs/ht.cjs` and
   `node render.cjs specs/ht-feature.cjs ../../apps/habit-tracker/store/feature-graphic-1024x500.png`.
4. Read every PNG (`node sheet.cjs out.png ../../apps/habit-tracker/store/screenshots/*.png`).
5. Undo step 1 (`git checkout app.config.ts`, delete `metro.config.js` and `app/shots*.tsx`) and `web/kill.sh 8090`.

Ports used: Habits 8090, Sipling 8091, Word Search 8092, Quizora 8093, Contraction Timer 8094. Each Metro server
takes about 1 GB; on a 16 GB PC run two at a time.

## Gotchas found
- Add `a[role=tab] div{overflow:visible !important}` to a config's `css`: on web the tab-bar labels are clipped by
  about 7 px ("Settinas").
- Habits' check mark is drawn under the fill on web; its config's CSS lifts the SVG.
- Puppeteer PNGs are RGB without alpha, which Play wants for screenshots and feature graphics.
- Play's graphics policy: no "free", price or promo wording, ranking claims or "download now" in screenshots,
  feature graphics or icons.
