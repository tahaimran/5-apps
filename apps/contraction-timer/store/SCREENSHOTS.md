# Screenshots (8 × 1080×1920, portrait) and feature graphic

The final set is in `store/screenshots/` (`01-one-button.png` … `08-hospital-bag.png`) and the feature graphic is
`store/feature-graphic-1024x500.png`. Upload them in this order. They follow the storyboard in `../ASO.md §5`.

## How they were made
Every phone screen and pop-out card is the **real app UI**: the app was run with Expo for web (react-native-web)
in headless Chrome at a 412×915 dp phone viewport (2.625× density, so a 1082×2402 capture). Demo data was seeded
through the app's own stores: two filed sessions in History, a session of 13–17 contractions about 65 s long and
4½ min apart (so the 5-1-1 rule really matches and the real banner shows), five finished kick counts, a due date of
8 Dec 2026 (34 weeks + 2 days on the capture date) and a 72%-packed hospital bag. The clock was fixed at
Thu 29 Oct 2026 21:40 (03:12 for the Night shot, 15:20 for Kicks). Native-only modules (AdMob, notifications) were
stubbed for the web render.
The compositor then adds the "dawn to night" panorama art (one sky and wave line flowing across all 8 slides, with
stars around the Night slide), captions in Bricolage Grotesque 800, a phone frame with a 9:41 status bar, and
enlarged "pop-out" crops of the same captures. The tooling is in `tools/store-shots/` (see its README).

## Captions
| # | File | Caption | Sub-line |
|---|---|---|---|
| 1 | 01-one-button | One big button. **That's it.** | Time contractions with a single tap |
| 2 | 02-pattern-511 | Know when your **5-1-1 pattern** is reached | A calm heads-up from your last hour |
| 3 | 03-share-summary | Send a clear summary to your **midwife** | As text or a PDF, made on your phone |
| 4 | 04-night-mode | Night mode made for **3 a.m.** | Red on black, easy on tired eyes |
| 5 | 05-partner-mode | Partner mode: **big text, zero setup** | Easy to read and tap at arm's length |
| 6 | 06-kick-counter | Count kicks to **10** | Every session saved in your history |
| 7 | 07-pregnancy-weeks | Due date & **week-by-week sizes** | Your pregnancy at a glance |
| 8 | 08-hospital-bag | Hospital bag & **birth plan checklists** | Private and offline. No account. |

Wording stays disclaimer-safe ("when the 5-1-1 pattern is reached", never "when you're in labor"), with no medical
claims. Play's graphics policy bans price/promotional wording, rankings and awards, so none appear. The feature
graphic reads "One tap. Calm numbers. Ready for your midwife." with the icon and "Contraction Timer & Kick Count".

## Icon
`scripts/generate-icons.cjs` draws the new mark (a stopwatch with a cream face and a coral contraction wave on a
deep teal tile). Deep teal was chosen after comparing the top 10 "contraction timer" results on Play (Applyra,
2026-10-26): they are pink, mint, purple or photo/fetus icons. The new icon only reaches phones with a new native build.

## Before upload
- Recapture after any UI change that shows on these screens (the captures reflect `main` on 2026-10-26).
- When a real device build is available, spot-check that the screens match it (fonts, spacing).
