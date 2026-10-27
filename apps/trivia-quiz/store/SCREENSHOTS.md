# Screenshots (8 × 1080×1920, portrait) and feature graphic

The final set is in `store/screenshots/` (`01-offline-questions.png` … `08-progress-dark.png`) and the feature
graphic is `store/feature-graphic-1024x500.png`. Upload them in this order. They follow the storyboard in
`../ASO.md §6`.

## How they were made
Every phone screen and pop-out card is the **real app UI**: the app was run with Expo for web (react-native-web)
in headless Chrome at a 412×915 dp phone viewport (2.625× density, so a 1082×2402 capture), clock fixed at
Thursday 2026-10-29 19:41. A temporary route seeded believable progress (12-day streak, classic stars in eight
categories, 1,440 answers at 82%, Blitz best 23) and started real rounds from the bundled bank; the browser then
answered, used the 50/50 lifeline and moved through Blitz the way a player would. Native-only modules (AdMob,
notifications) were stubbed for the web render.
The compositor then adds the violet panorama art (floating question marks, category tiles, confetti, lightbulbs and
a gold level-map trail that flows across all 8 slides), captions in Bricolage Grotesque 800 with gold accents, a
phone frame with a 9:41 status bar, and enlarged "pop-out" crops of the same captures.
The tooling is in `tools/store-shots/` (see its README).

## Captions
| # | File | Caption | Sub-line |
|---|---|---|---|
| 1 | 01-offline-questions | **3,000+** trivia questions, offline | No internet. No sign-up. |
| 2 | 02-daily-challenge | A new daily **trivia challenge** | Keep your streak alive |
| 3 | 03-learn-why | Learn **why** with every answer | A fun fact after each question |
| 4 | 04-categories | **12 categories** to master | Movies, history, science & more |
| 5 | 05-levels | **30 levels** in every category | Earn 3 stars on every level |
| 6 | 06-blitz | Beat the **60-second Blitz** | How many can you answer? |
| 7 | 07-lifelines | Use lifelines: **50/50, Skip, +Time** | Never get stuck |
| 8 | 08-progress-dark | Track your **brain progress** | Dark mode & big text |

"3,000+" is true: the bundled bank has 3,600 questions (`assets/questions/en`, 300 per category).
Play's graphics policy bans price and promotional wording, rankings and awards in screenshots and the feature
graphic, so none of them use "free", "best", "#1" or similar. The feature graphic says "Trivia that works offline."
with "3,000+ questions · 12 categories · daily challenge".

## Icon
`scripts/generate-icons.cjs` draws the new icon: a chunky violet "?" whose dot carries a gold spark, on a gold
sunburst tile. Gold was chosen because the top "trivia quiz" results on Play are almost all blue and purple
(compared with the top 10 from Applyra on 2026-10-26); the violet glyph keeps the brand.

## Before upload
- Recapture after any UI change that shows on these screens (the captures reflect `main` on 2026-10-26).
- The new icon only reaches a phone with a new native build (icons are baked into the APK).
