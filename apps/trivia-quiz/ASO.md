# Quizora: Trivia Quiz Offline — ASO Plan (Google Play, en-US)

> Companion to [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md). Data: Applyra, Google Play US en-US, researched 2026-10. Traffic and difficulty are 0–100.

## 1. Final metadata

| Field | Text | Length / limit |
|---|---|---|
| **Title** | `Quizora: Trivia Quiz Offline` | 28 / 30 |
| **Short description** | `Offline general knowledge quiz games: daily trivia challenge, IQ & movie trivia` | 79 / 80 |
| **Full description** | below | 2,555 / 4,000 (Play's UTF-16 count) |
| Developer name | Portfolio publisher name (same across the 5 apps) | — |
| Category | **Trivia** (Games) | — |

Why this title: the brand "Quizora" comes first so it is memorable and the name is free to own. "Trivia Quiz" is the head term (44/57), and "Offline" is the main point of difference that the gap analysis found. Matching the autocomplete phrase "offline quiz" also helps. The title has no banned words ("free", "best", "#1", "top", "new"), no emoji and no ALL-CAPS.
The working name "Trivia Quiz Offline – General Knowledge & IQ" was dropped because it is 44 characters, over the 30-character limit.

### Applyra `check_metadata` (store GPLAY) result
- `valid: true`. Title 28/30, short description 79/80, full description 2,555/4,000.
- **0 errors, 0 warnings, 0 info, no notes.** No price, ranking, call-to-action or kids policy flags.
- Changes made before the check: v1.1 features (Pass & Play, IQ Test) were taken out of the launch description so the listing does not advertise features that are not in the app yet. They will be added back when v1.1 ships. The working short description was 81 characters and was cut to 79.

### Full description (paste-ready)

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

Keyword coverage in the description (counted naturally, 1–3 uses each, no stuffing): trivia quiz ×4, offline ×4, general knowledge ×2, daily trivia challenge ×2, quiz games ×2, geography quiz game, history trivia questions, animal facts quiz, movie trivia quiz, brain training trivia, trivia quiz for adults/seniors, family trivia night, brain games, memory challenges, IQ, trivia quiz app.

---

## 2. Keyword research (Applyra, GPLAY US en-US)

| Keyword | Traffic | Difficulty | Priority | Placement |
|---|---|---|---|---|
| trivia quiz | 44 | 57 | **P1 head** | Title, short, description |
| trivia quiz app | 25 | 33 | **P1** | Title (implied), description |
| trivia quiz games | 25 | 41 | **P1** | Short ("quiz games"), description |
| general knowledge quiz | 25 | 37 | **P1** | Short, description |
| iq boost quiz | 34 | 30 | **P1 (best ratio)** | Short ("IQ"), description ("boost your reasoning") |
| movie trivia quiz | 24 | 25 | **P1** | Short, description |
| memory challenge game | 21 | 27 | P2 | Description ("memory challenges") |
| daily trivia challenge | 9 | 31 | P2 (feature match) | Short, description ×2 |
| trivia quizzes | 10 | 32 | P2 | Covered by stemming |
| trivia quiz for adults | 9 | 32 | P2 | Description |
| trivia quiz for seniors | 8 | 31 | P2 | Description |
| family trivia night | 10 | 31 | P2 (v1.1 Pass & Play) | Description; promote at v1.1 |
| brain training trivia | 11 | 38 | P3 | Description |
| geography quiz game | 8 | 15 | P3 (easy win) | Description |
| world map guessing game | 8 | 14 | P3 (v2 picture rounds) | Not targeted until map/flag rounds ship |
| animal facts quiz | 8 | 11 | P3 (easy win) | Description |
| history trivia questions | 8 | 22 | P3 | Description |
| brain games | 63 | 60 | Long-term | Description only (too hard for now) |
| trivia quiz to earn money | 25 | 36 | **EXCLUDED** | Misleading because the app has no cash rewards. Never used. |

**Autocomplete checks (Applyra `run_autocomplete`, GPLAY US en-US, 2 queries):**
- `trivia quiz` → trivia quiz, trivia quizzes, trivia quiz games, trivia quiz to earn money, trivia quiz app
- `offline quiz` → offline quiz games, offline quiz maker, offline quiz, **offline quiz games general knowledge**, offline quiz app

The phrase "offline quiz games general knowledge" is covered by the title ("Offline") plus the short description ("Offline general knowledge quiz games"). This supports putting "Offline" in the title instead of "General Knowledge".

---

## 3. Competitors

| App | Package / owner | Model | Strengths | Weaknesses we exploit |
|---|---|---|---|---|
| TRIVIA STAR Quiz Games Offline | com.trivia.star.android | Offline, ads | Ranks for "offline", huge installs | Heavy interstitials, dated UI, few explanations |
| Trivia Crack | etermax | Online PvP, IAP + ads | Brand, social | Needs internet/account; ad and energy walls |
| QuizzLand | QuizzLand | Offline-ish, ads + IAP | Many questions, explanations | Cluttered, hint coins, aggressive monetization |
| Triviascapes (IQ & brain test) | — | Ads | IQ/brain positioning | Narrow mode set |
| Millionaire Quiz | various | Ads | Familiar format, lifelines | Single format, repeats questions |
| QuizDuel | FEO Media | Online PvP | Social duels | Needs opponents and internet |
| Jeopardy! | Uken/Sony | Online, IAP | Licensed brand | Login, energy system, US-centric |

Positioning against them: **"offline + explanations + calm ads + daily streak, no login."** Track all 7 in Applyra (`add_competitor`) to watch their metadata changes.

---

## 4. Keyword placement strategy

1. **Title (strongest weight):** brand + `trivia quiz` + `offline`. Do not change it in the first 8 weeks unless rankings stall (see §11).
2. **Short description (strong weight, conversion line):** `offline`, `general knowledge quiz`, `quiz games`, `daily trivia challenge`, `IQ`, `movie trivia`. It reads as a sentence, not a list.
3. **Full description:** put the main phrases in the first 167 characters, which show above the fold ("offline trivia quiz game", "general knowledge questions", "Daily Trivia Challenge"). Each long-tail phrase appears 1–3 times. Keep head-term density around 2–3% and avoid repetition that Play's spam filter would flag.
4. **Feature terms only:** do not target keywords for features that are not built yet (world map, family night) until they ship. v1.1 adds a Pass & Play section, and v2.0 adds picture/map rounds.
5. **Never:** "earn money", "free", "best", "#1", or competitor brand names in the metadata.
6. **Off-metadata signals:** keep the in-app review timing from DEVELOPMENT_PLAN §13, reply to reviews within 48 h using keywords naturally, and keep Play vitals healthy because ranking depends on them.

---

## 5. Icon concept

- **Primary:** a rounded indigo square (`#4F46E5` to `#6366F1` gradient) with a bold white speech-bubble "?" whose dot is a gold lightbulb (`#F59E0B`). There is no text. It is readable at 48 px.
- **A/B variant (Store listing experiments, week 4):** the same "?" on a gold background with an indigo glyph, which is more eye-catching in a grid of mostly blue and purple trivia icons.
- Avoid cartoon mascots or childish styling so the app does not "appeal to children" under Play Families rules.

## 6. Screenshot storyboard (8 × portrait 1080×1920, captions ≤ 6 words, real UI)

| # | Screen shown | Caption (top, bold) | Sub-caption |
|---|---|---|---|
| 1 | Question screen, geography Q, timer ring, lifelines | **3,000+ Trivia Questions — Offline** | No internet. No sign-up. |
| 2 | Daily Challenge card + 🔥 12-day streak | **A New Daily Trivia Challenge** | Keep your streak alive |
| 3 | Explanation sheet "Did you know?" | **Learn Why With Every Answer** | A fun fact after each question |
| 4 | Category grid (12 colorful tiles) | **12 Categories to Master** | Movies, history, science & more |
| 5 | Classic level map with stars | **30 Levels Per Category** | Earn 3 stars on every level |
| 6 | Timed Blitz with 60 s clock | **Beat the 60-Second Blitz** | How many can you answer? |
| 7 | 50/50 lifeline in use | **Use Lifelines: 50/50, Skip, +Time** | Never get stuck |
| 8 | Stats + dark mode + large text | **Track Your Brain Progress** | Dark mode & big text |

At v1.1, replace #7 with Pass & Play ("**Family Trivia Night on One Phone**"). Frame style: indigo background, device-less full-bleed UI, gold accent captions.

## 7. Feature graphic (1024×500)

Indigo gradient. On the left is "Quizora" with the tagline "Trivia that works offline." On the right are three tilted question cards (Geography, Movies, Science), and one shows a green ✓ and a "Did you know?" chip. The center 70% is kept clear of essential text in case of cropping.

## 8. Promo video (YouTube, 25 s, landscape)

1. 0–3 s: a phone on a subway with "No signal". The user opens Quizora and a question appears instantly.
2. 3–9 s: fast cuts of answers going correct (green) and wrong (red shake), each followed by a fun fact.
3. 9–15 s: the Daily Challenge, with the streak flame going from 6 to 7 and a calendar fill.
4. 15–20 s: Timed Blitz countdown, then a 3-star level-up.
5. 20–25 s: logo and "Offline trivia. 3,000+ questions." Upbeat royalty-free music, with captions for muted autoplay.

## 9. Localization priorities

Order is based on Play install volume for trivia, AdMob eCPM, and the cost of translating questions:

| # | Locale | Rationale |
|---|---|---|
| 1 | en-US (+ en-GB, en-IN, en-AU copies) | Launch |
| 2 | es-419 / es-ES | Large trivia audience in LatAm and the US |
| 3 | pt-BR | Very high trivia engagement |
| 4 | de-DE | High eCPM |
| 5 | fr-FR | High eCPM, plus Africa reach |
| 6 | hi-IN | Huge volume and strong demand for "GK quiz" |
| 7 | id-ID | Volume |
| 8 | ja-JP | High eCPM, strong quiz culture |
| 9 | it-IT | eCPM |
| 10 | tr-TR / ru-RU | Volume |

Phase 1 (week 4) translates only the store listing for locales 2–6. Phase 2 (v2.0) adds localized question banks; see DEVELOPMENT_PLAN §10.

**Localized title ideas (≤30, to be checked with `check_metadata` per locale):**
| Locale | Title | Short description idea |
|---|---|---|
| es | `Quizora: Trivia y Preguntas` | Juego de preguntas de cultura general sin internet, con reto diario |
| pt-BR | `Quizora: Quiz de Perguntas` | Quiz de conhecimentos gerais offline com desafio diário e curiosidades |
| de | `Quizora: Quiz Offline Wissen` | Allgemeinwissen Quiz ohne Internet – tägliche Challenge & Erklärungen |
| fr | `Quizora: Quiz Culture Générale` | Quiz de culture générale hors ligne, défi quotidien et anecdotes |
| hi | `Quizora: GK Quiz Hindi Offline` | हिंदी GK क्विज़ ऑफ़लाइन – डेली चैलेंज, सामान्य ज्ञान और रोचक तथ्य |

(The localized strings were not run through check_metadata in this pass. The fr title is exactly 30 characters, so recount it as UTF-16 before publishing.)

## 10. Rating strategy

- Ask for a review through the in-app Review API only at peak moments: ≥3 days since install, ≥5 rounds played, and right after a 3★ level, a score of 8/10 or better, or a 3/7/30-day streak. Never ask after a loss or right after an ad. Wait at least 60 days between asks.
- Before release, run a closed test with 12+ testers to find bugs. Do not ask testers for ratings.
- "Report question" button: wrong-answer complaints go to email instead of 1★ reviews, and fixes ship by OTA within a week.
- Reply to every review of 3★ or lower within 48 h with a specific fix or ETA. Reply to "too many ads" reviews by pointing to the caps (no ads during questions).
- Target 4.4★ or higher with 100+ ratings by week 4.

## 11. ASO iteration plan

| When | Actions (Applyra) | Decision rules |
|---|---|---|
| **Launch (day 0)** | `add_application` (GPLAY, US). `track_keywords` for all 18 P1–P3 keywords plus "offline quiz games", "offline quiz games general knowledge" and "offline quiz app". `add_competitor` for the 7 apps in §3. | Baseline ranks recorded |
| **Week 2** | `get_keyword_rank_history` and `get_aso_health`. Check Play Console search terms → store visits → installs. | If "trivia quiz" is not in the top 100 but long-tail terms rank in the top 30, keep the title and strengthen the description around the long-tail terms that are converting. Fix any keyword with impressions but listing CVR below 25% by testing screenshot order. |
| **Week 4** | `simulate_metadata` with 2 alternative short descriptions (A: "...IQ boost quiz & brain games", B: "...trivia quiz for adults & family trivia night"). Launch a Play Store listing experiment for icon A/B and screenshot #1. Publish the es/pt-BR/de/fr/hi listings. | Adopt a variant at ≥90% confidence. Ship v1.1 copy (Pass & Play, IQ Test) and track "family trivia night". |
| **Week 8** | `simulate_metadata` on a title variant if "trivia quiz" is still above position 30, for example `Quizora: Offline Trivia Games` or `Quizora: Trivia & IQ Quiz`. `run_niche_analysis` on "geography quiz" and "flag quiz" to plan v2.0 picture rounds. | Change the title only if the simulation shows a projected traffic increase of ≥15% and current top keywords are kept. Review the localized markets that have ≥500 installs. |
| Ongoing (monthly) | Re-run `check_metadata` on every edit. Update the description with seasonal hooks ("Halloween trivia week") from v2.0 events. | Change only one metadata element per 2-week window so the effect can be measured. |

## 12. Category & tags

- **Category:** Games › **Trivia**
- **Play store tags (choose up to 5):** Trivia, Quiz, Offline, Single player, Casual. Alternatives: Brain games, Stylized.
- **Content rating:** IARC, expected Everyone / PEGI 3. **Target audience:** 13+ (not Designed for Families).
- **Contains ads:** Yes. **In-app purchases:** No.
