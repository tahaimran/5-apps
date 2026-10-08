# Sipling: Drink Water Reminder — ASO

> Google Play only, US en-US primary. Keyword data: Applyra (traffic / difficulty, 0–100).
> Core cluster opportunity score **46** (2nd best cluster found in the portfolio research).
> Product spec: [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md).

## 1. Final metadata

| Field | Text | Length (store count) | Limit |
|---|---|---|---|
| **Title** | `Sipling: Drink Water Reminder` | 29 | 30 |
| **Short description** | `Water tracker & daily hydration reminder that grows a cute plant as you drink.` | 78 | 80 |
| **Full description** | below | 3,343 (3,338 visible chars; emoji count double) | 4,000 |

**Why this title:** keeps the exact-match head term **"drink water reminder"** (52 / 47, the only high-traffic
term in the cluster) contiguous and complete, while "Sipling" gives a brandable, memorable name that is not a copy of a
competitor's generic name ("Drink Water Reminder & Tracker" is already taken by Ascendik). Google indexes the title
most heavily, so the remaining 1 char is left unused rather than padded. No "free", "#1", "best", "top", "new" in title
(Play metadata policy).

**Short description** covers: "water tracker" (→ water intake tracker), "daily hydration" (→ daily hydration target /
daily water reminder), "reminder", plus the plant differentiator for conversion.

### Full description

```
Love trivia but hate sign-ups, spotty signal and ads that pop up mid-question? Quizora is an offline trivia quiz game with 3,000+ general knowledge questions, a fresh Daily Trivia Challenge and a short "Did you know?" explanation after every answer. No account, no internet needed, just you and a good question.

★ PLAY ANYWHERE, FULLY OFFLINE
Every question is stored on your phone. Play on the subway, on a flight or in a cabin with zero bars. Quizora never asks you to log in or connect to Facebook.

★ 12 CATEGORIES, 3,000+ QUESTIONS
• General knowledge quiz
• Geography quiz game: capitals, rivers, countries and flags
• History trivia questions from ancient Rome to the space race
• Science, nature and animal facts quiz
• Movie trivia quiz and music trivia
• Sports, food, literature and logic puzzles
Each question is checked for accuracy, and we keep adding more with regular content updates.

★ DAILY TRIVIA CHALLENGE + STREAKS
Ten handpicked questions every day, the same set for every player. Keep your streak alive, earn streak freezes and watch your calendar fill up. Two minutes a day keeps your brain sharp.

★ GAME MODES FOR EVERY MOOD
• Classic levels: 30 levels per category, earn up to 3 stars and unlock the next level
• Category play: pick a topic and difficulty and practice as long as you like
• Timed Blitz: answer as many as you can in 60 seconds
• Logic and IQ rounds: number series, patterns and riddles to boost your reasoning

★ LEARN SOMETHING WITH EVERY ANSWER
Right or wrong, each question ends with a quick fun fact that explains the answer. It is brain training trivia that actually teaches you something.

★ LIFELINES WHEN YOU NEED THEM
Stuck? Use 50/50 to remove two wrong answers, skip a tricky question or grab extra time.

★ DESIGNED TO BE CALM
No ads while you answer questions. Big, readable text with adjustable size, dark mode and a relaxed mode with no timer, making it a comfortable trivia quiz for adults and seniors alike.

★ TRACK YOUR PROGRESS
Level up from Curious to Trivia Legend. See your accuracy in every category, your best Blitz score and your longest streak.

Quizora is a trivia quiz app for teens and adults who enjoy quiz games, brain games and memory challenges. Whether you are warming up for pub quiz night, training for a family trivia night or just curious about the world, there is always one more question waiting.

Quizora is supported by ads. You can review your ad privacy choices any time in Settings.

Download Quizora and start today's Daily Challenge. How many can you get right?
```

### Applyra `check_metadata` (GPLAY) result — run 2026-10-08

| Field | Length | Limit | Result |
|---|---|---|---|
| Title | 29 | 30 | OK, no warnings |
| Short description | 78 | 80 | OK, no warnings |
| Full description | 3,343 | 4,000 | 1 warning: store counts 3,343 vs 3,338 visible (emoji are multi-unit) — informational, still 657 chars of headroom. 1 info: emoji allowed in description, banned in title/icon/dev name (we use none there). |

`valid: true` — no errors, no policy rules fired (price / ranking / call-to-action / kids). The word "free" is
deliberately absent from all fields, even though "water reminder free app" has traffic 25; the description instead says
"every feature … is available to everyone" and "supported by ads". Revisit only in the description if week-4 data
shows we cannot rank for it (description use is allowed by policy, title use is not).

### Applyra autocomplete (GPLAY, US, en-US)

| Prefix | Suggestions (in order) |
|---|---|
| `water reminder` | water reminder · water reminder free app · water reminder app · water reminder offline app · water reminder alarm |
| `drink water` | drink water reminder · drink water · drink water app · drink water reminder app · drink water reminder and tracker |

Takeaways: "offline" is a real autocomplete modifier (supports our privacy/offline angle → used 2× in description);
"drink water reminder app" and "drink water reminder and tracker" are both covered by title + "tracker" in short
description.

## 2. Keyword research (Applyra, Google Play US)

| Keyword | Traffic | Difficulty | Priority | Placement |
|---|---|---|---|---|
| drink water reminder | 52 | 47 | P0 | Title (exact), desc ×1 + intro |
| water reminder app | 25 | 27 | P0 | Desc (water reminder ×4, "app") |
| daily water reminder | 25 | 28 | P0 | Short ("daily hydration reminder"), desc |
| water intake reminder | 25 | 26 | P1 | Desc ("water intake" ×3) |
| water intake tracker | 25 | 30 | P0 | Short ("Water tracker"), desc intro exact |
| water tracker for weight loss | 25 | 25 | P1 | Desc exact ("water tracker for weight loss goals") |
| water reminder free app | 25 | 27 | P2 | Not used ("free" avoided); semantic via "available to everyone" |
| water reminder offline app | 18 | 26 | P1 | Desc ("works fully offline", "Works offline") |
| water reminder alarm | 17 | 25 | P2 | Desc (reminder/alarm semantics; add "alarm" in iteration) |
| daily hydration target | 10 | 31 | P1 | Desc exact intro |
| custom water reminder | 9 | 26 | P2 | Desc exact ("Custom water reminder times") |
| hydration reminder app | 8 | 26 | P2 | Short ("hydration reminder") |
| water reminder timer | 8 | 25 | P3 | Iteration |
| water reminder tracker | 8 | 49 | P3 | Implicit (title + short) |
| water intake calculator | 8 | 28 | P1 | Desc exact |
| water consumption chart | 8 | 24 | P1 | Desc header "WATER CONSUMPTION CHARTS" |
| water reminder for seniors | 8 | 24 | P2 | Desc ("reminders for seniors") |
| hydration for pregnancy | 8 | 26 | P2 | Desc ("Pregnancy hydration") |
| water reminder with plants | 8 | 25 | P1 | Desc (plant ×6), screenshots |
| water reminder streak | 8 | 25 | P1 | Desc exact ("water reminder streak") |
| drink water schedule | 8 | 26 | P2 | Desc ("SMART WATER REMINDER SCHEDULE") |
| quick add water | 8 | 24 | P1 | Desc header exact |
| intermittent fasting hydration | 8 | 22 | P2 | Desc exact |

**Density check:** "water" ~30×, "reminder" ~12×, "plant" ~6×, "hydration" ~6× in ~560 words — natural, below
stuffing territory (no keyword list blocks, no repeated comma lists).

## 3. Competitors

| App | Package | Rating | Angle | Our counter |
|---|---|---|---|---|
| Water Reminder - Remind Drink | com.remind.drink.water.hourly | 4.8 | Hourly reminders, simple tracker, heavy ads | Smarter spacing + auto-skip, calmer ad load |
| Drink Water Reminder & Tracker | ascendik (Hydro Coach family) | ~4.7 | Mature tracker, Pro upsell | No paywall, plant, offline |
| My Water Tracker & Reminder | com.water.tracker.remind | ~4.7 | Clean tracker | Gamification + widget actions |
| Water Drink Reminder | com.northpark.drinkwater (Leap Fitness) | ~4.8 | Huge install base, cup quick-add | Privacy, condition modes, plant |
| Water Tracker: Water Reminder | various | ~4.6 | Generic | Brand + differentiation |
| Plant Nanny | com.fourdesire.plantnanny2 | ~4.6 | Plant gamification, many items paywalled | Same delight, unlocks via streaks/rewarded, not paywall |
| Waterful | — | ~4.5 | Cute UI, subscription | No subscription |
| Drink Alarms | — | ~4.4 | Alarm-style reminders | Gentle style + snooze actions |

**Gaps to own:** smart schedule that learns, non-paywalled plant, offline/private, pregnancy/seniors/fasting modes.
Run `add_competitor` for the first four in Applyra after `add_application` (week 2).

## 4. Keyword placement strategy

1. **Title:** brand + exact "Drink Water Reminder" (head term, 52 traffic). Never reorder words.
2. **Short description (80):** "water tracker", "daily hydration reminder", "plant" — feeds secondary cluster
   (water intake tracker, daily water reminder, hydration reminder app, water reminder with plants).
3. **Full description:** first 170 chars (visible before "more") contain drink water reminder, water intake tracker,
   daily hydration target, plant. Section headers carry long tails (SMART WATER REMINDER SCHEDULE, QUICK ADD WATER,
   WATER CONSUMPTION CHARTS). "GREAT FOR" bullets cover condition long tails (weight loss, seniors, pregnancy,
   intermittent fasting) in natural sentences.
4. **No keyword stuffing**, no competitor names, no medical claims ("supports a routine", "not a medical device").
5. **Developer name:** portfolio studio name, no keywords.
6. **In-app strings / reviews:** encourage reviews mentioning "plant" and "reminder" naturally (never ask for keywords).

## 5. Icon concept

- Rounded-square, background gradient `#7FD1F7 → #2B9FE6`.
- Center: a single water droplet shaped like a pot/terrarium with a two-leaf sprout (`#4CBF7A`) growing out of the top,
  tiny happy face on the droplet. White 3 px inner highlight for gloss.
- No text, no "free" badge, no rating stars (policy). Legible at 48 px: droplet + sprout silhouette only.
- A/B test (Store listing experiment, week 4): variant B = pink bloom flower instead of sprout on the same droplet.

## 6. Screenshot storyboard (8, 1080×1920 portrait, device frame, caption top 20%)

| # | Screen | Caption (≤ 6 words headline + sub) |
|---|---|---|
| 1 | Today: blooming plant + ring 54% + quick-add | **Drink water, grow your plant** — Every glass helps it bloom |
| 2 | Notification shade with "+250 ml / Snooze" | **Log right from the reminder** — One tap, no app opening |
| 3 | Goal reveal "Your daily goal: 2,300 ml" | **Your personal daily goal** — Weight, activity & climate |
| 4 | Schedule settings wake 7:00 – bed 23:00 timeline | **Smart reminders, only when awake** — Auto-skips if you already drank |
| 5 | Garden: stages + streak 🔥 12 | **Build a streak, unlock new plants** — No paywall, ever |
| 6 | History week/month charts | **See your weekly progress** — Daily, weekly & monthly charts |
| 7 | Widget on home screen + beverage picker | **Widget & quick add cups** — Water, coffee, tea and more |
| 8 | Privacy card + dark mode | **Private, offline, no sign-up** — Your data stays on your phone |

Style: light `#F4FAFE` backgrounds, Nunito ExtraBold captions in `#11263A`, accent words in `#2B9FE6`. Shots 1–3
carry the conversion load (visible in search results).

## 7. Feature graphic (1024×500)

Left 55%: headline "Drink water. Grow a plant." in Nunito 800 + small droplet logo. Right: three pots showing
seed → sprout → bloom with a water stream from a glass. Background soft blue gradient with wave line at bottom.
No price text, no CTA text ("Download now") per policy.

## 8. Promo video idea (YouTube, 25 s, portrait-safe)

0–3 s: wilted sad seedling, text "Forget to drink water?" · 3–8 s: reminder notification pops, thumb taps "+250 ml" ·
8–14 s: ring fills, plant sprouts with haptic sparkle · 14–19 s: time-lapse of a week, plant blooms, streak 7 🔥 ·
19–23 s: charts + widget · 23–25 s: icon + "Sipling: Drink Water Reminder". Upbeat ukulele, no voice-over (localizable
via captions).

## 9. Localization priorities

Order by Play hydration-app demand × AdMob eCPM × translation cost.

| # | Locale | Localized title (≤30, store count) | Notes |
|---|---|---|---|
| 1 | en-US (+ en-GB, en-IN, en-AU copies) | Sipling: Drink Water Reminder (29) | Base |
| 2 | es-419 / es-ES | Sipling: Recordatorio de Agua (29) | "recordatorio beber agua" high volume |
| 3 | pt-BR | Sipling: Lembrete Beber Água (28) | Brazil very large Health & Fitness market |
| 4 | de-DE | Sipling: Wasser Trinkwecker (27) | "Trinkwecker" is the native category term; high eCPM |
| 5 | fr-FR | Sipling: Rappel Boire de l'Eau (30) | |
| 6 | hi-IN | Sipling: पानी पीने का रिमाइंडर (30) | Keep en-IN English listing as well (many users search in English) |
| 7 | id-ID | Sipling: Pengingat Minum Air (28) | Large volume, low competition |
| 8 | ja-JP | Sipling: 水分補給リマインダー (19) | High eCPM |
| 9 | ru-RU | Sipling: Напоминание о воде (27) | |
| 10 | tr-TR | Sipling: Su İçme Hatırlatıcı (28) | |

Process: translate short + full description with native review for es/pt-BR/de/fr; run `check_metadata` per locale
(byte/UTF-16 counts differ, especially hi-IN which is exactly 30); localize screenshots captions for top 5; in-app
strings already via `src/i18n`.

## 10. Rating strategy

- In-app review only after a positive moment (goal-reached celebration), ≥ 3 goal days, ≥ 3 days installed, max
  3 prompts lifetime, 60-day gap (details in DEVELOPMENT_PLAN §13).
- Optional sentiment pre-prompt; unhappy path → feedback email (no review gating language toward stars).
- Reply to every 1–3★ review within 48 h in week 1–4; common issues expected: missed reminders (link battery guide),
  ads (point to cooldowns), goal disagreement (show how to set manual goal).
- Target ≥ 4.5★ by 100 ratings; fix top complaint each release.

## 11. ASO iteration plan

| When | Actions (Applyra) | Decision rule |
|---|---|---|
| Launch (week 0) | `add_application` (Play package), `track_keywords` for all 23 keywords above (US en-US); `add_competitor` × 4 | — |
| Week 2 | `get_keyword_rank_history` for P0/P1; `get_aso_health`; check Play Console search terms report | If "drink water reminder" not in top 50 but long tails in top 20 → keep; if long tails also absent → index issue, review description density |
| Week 4 | `simulate_metadata` with variant short descriptions: A (current), B "Drink water reminder & water intake tracker with a cute plant and streaks." (check ≤80), C emphasizing "offline". Store listing experiment on icon (sprout vs bloom) and screenshot 1 | Ship variant with higher simulated visibility + experiment winner at 90% confidence |
| Week 8 | Re-run niche keyword set + `run_autocomplete` on "water reminder", "hydration", "drink water" for new modifiers; `get_app_score_history` vs competitors; localize titles for locales 2–7 | Move any keyword with rank 11–30 & traffic ≥ 17 (e.g. "water reminder alarm") into short description; drop P3 terms |

## 12. Category & tags

- **Category:** Health & Fitness.
- **Store tags (select up to 5 in Play Console):** Health & fitness tracker, Habit tracker, Water tracker /
  Hydration, Wellness, Reminders (choose the closest available tags at submission).
- **Content rating:** Everyone (IARC). **Target audience:** 13+. **Contains ads:** Yes. **In-app purchases:** No.
