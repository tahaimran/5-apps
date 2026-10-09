# Quizora: Trivia Quiz Offline — Development Plan

> App 3 of the 5-app AdMob portfolio. Google Play only. Expo (latest SDK) + Expo Router + TypeScript.
> No backend, no auth, no server DB. All state on device (react-native-mmkv). Revenue: AdMob only.
> Store listing, keywords and screenshots: see [`ASO.md`](./ASO.md).

- **Final store name:** `Quizora: Trivia Quiz Offline` (28 chars)
- **Package id:** `com.<portfolio>.quizora.trivia`
- **Play category:** Trivia · **Target audience:** 13–15, 16–17, 18+ (NOT under 13, NOT Families program)
- **Working name retired:** "Trivia Quiz Offline – General Knowledge & IQ" (too long for the 30-char title limit)

---

## 1. Concept & positioning

**One-liner:** 3,000+ hand-checked trivia questions with explanations, playable fully offline, with a daily challenge and streaks — no login, no pay-to-win, ads that never interrupt a question.

**Positioning statement:** For commuters, trivia-night regulars and curious adults who want a quick brain workout without signing up or getting blasted by ads, Quizora is an offline trivia game that teaches you something on every question. Unlike Trivia Crack/QuizDuel (online, account-driven, aggressive ads) or TRIVIA STAR/QuizzLand (offline but cluttered, thin explanations), Quizora pairs a large bundled bank with a "learn why" fun fact on every answer and a calm, minimal-ads layout.

**Differentiators (from ASO gap analysis):**
1. **Truly offline + no login** — the whole bank ships in the APK; content updates arrive via EAS Update (OTA JSON).
2. **Explanation on every question** — "Did you know?" card after each answer.
3. **Daily Challenge + streaks** — same 10 questions for everyone that day (seeded by date), no server needed.
4. **Clean minimal-ads UX** — no banner during questions, interstitials only between rounds with time caps.
5. **Pass-and-play family trivia night** — 2–6 players on one phone, offline.

**Non-goals:** online PvP, leaderboards that need a server, real-money/"earn money" mechanics, user accounts, IAP (v1), kids-directed content.

---

## 2. Personas

| | **Maya Ortiz, 24** — commuter quizzer | **Dave Kowalski, 58** — retiree brain-trainer | **The Nguyen family** — trivia-night host (Linh, 41) |
|---|---|---|---|
| Context | Marketing coordinator, Chicago; 35-min subway ride with patchy signal | Retired electrician, Ohio; plays mornings with coffee | Hosts Friday game night with 2 teens (14, 16) and partner |
| Goals | Kill time, feel smart, keep a streak | Keep his mind sharp, learn history facts, larger text | One phone, everyone plays, no setup, no accounts |
| Frustrations | Online quiz apps fail in tunnels; ads every 30 s | Tiny fonts, confusing menus, "connect with Facebook" | Apps require each player to install; kid-ads/age gates |
| Key modes | Daily Challenge, Timed Blitz, Movies/Music | Classic levels, History/Geography, IQ Test | Pass-and-play, Category play |
| Win condition | 30-day streak badge, shares score screenshot | Finishes all History levels with 3 stars | Game night lasts 45 min without arguments over rules |
| Ad tolerance | Will watch rewarded for 50/50 | Dislikes video ads; tolerates banner in menus | Interstitial only between full games, never mid-round |

---

## 3. Features by release

### MVP v1.0 (launch, ~9 days)
| # | Feature | Acceptance criteria |
|---|---|---|
| F1 | **Classic levels** | 12 categories × 30 levels × 10 questions; difficulty ramps (L1–10 easy, 11–20 medium, 21–30 hard). Level unlocks at ≥1 star on the previous. Stars: 1★ ≥5/10, 2★ ≥7/10, 3★ ≥9/10. Progress persists across app kill. |
| F2 | **Daily Challenge** | 10 mixed questions, identical for all users on the same local date (seeded PRNG). Playable once per day; result card shows streak. Works airplane-mode. Resets at local midnight. |
| F3 | **Category play (endless practice)** | Pick category + difficulty; rounds of 10; no repeats until ≥80% of that pool seen. |
| F4 | **Timed Blitz** | 60-second run, as many questions as possible; +1 s on correct, −3 s on wrong; personal best stored per day/all-time. |
| F5 | **Lifelines** | 50/50, Skip, +15 s Extra Time. 1 free of each per round; extra via rewarded ad. Disabled state when used. |
| F6 | **Explanations** | Every answer shows correct option + 1–2 sentence fun fact; "Next" button; auto-advance off by default. |
| F7 | **XP, levels, streaks** | XP per correct answer (§8); player level bar on Home; streak counter with 1 freeze token per 7 days. |
| F8 | **Onboarding + warm-up** | Flow in §6; first answered question < 30 s from first open on a mid-range device. |
| F9 | **Ads + consent** | UMP consent before any ad request; placements per §12; caps enforced and unit-tested. |
| F10 | **Local notifications** | Daily reminder (user-chosen time), streak-at-risk at 20:00 if not played. |
| F11 | **Settings** | Sound, haptics, music, text size (S/M/L/XL), theme (system/light/dark), reminder time, privacy options (re-open UMP form), reset progress. |
| F12 | **Stats** | Accuracy per category, total answered, best streak, Blitz PB. |

### v1.1 (week 3–4 post-launch)
| # | Feature | Acceptance criteria |
|---|---|---|
| F13 | **Pass-and-play (family trivia night)** | 2–6 players, names + colors, 5/10/15 rounds, category wheel; "hand the phone to Alex" screen hides answers; final podium. Fully offline. Interstitial only after the full game. |
| F14 | **IQ Test style mode** | 30 logic/pattern/number-series questions, 20-min timer, result shows a "Quiz IQ score" band with disclaimer "for entertainment, not a clinical IQ test". |
| F15 | **Achievements** | 25 badges (e.g. "Globetrotter: 100 geography correct"). |
| F16 | **Review mistakes** | Replay last 50 wrong answers as a round. |
| F17 | **Content pack 1 via OTA** | +500 questions shipped with EAS Update; "New questions" chip on affected categories. |

### v2.0 (month 2–3)
| # | Feature | Acceptance criteria |
|---|---|---|
| F18 | **Localization** | es, pt-BR, de, fr, hi question banks (≥1,500 each) + UI strings; locale-specific bank loaded lazily. |
| F19 | **Picture rounds** | Flags/landmarks with bundled WebP images (< 8 MB total). |
| F20 | **Weekly themed event** | Date-seeded 7-day themed set (e.g. "Space Week"); badge on completion. |
| F21 | **Home-screen widget** | Android widget showing today's challenge status + streak (expo widget module). |
| F22 | **Optional "Remove ads" IAP** | Only if ARPDAU < target and reviews cite ads; evaluate, not committed. |

---

## 4. Information architecture & navigation

```
app/
├─ (onboarding)/                 stack, shown until onboarding.done === true
│   welcome → categories → difficulty → warmup → warmup-result → notifications
├─ (tabs)/                       bottom tabs
│   ├─ index        Home  (Daily Challenge card, Continue Classic, mode grid, XP bar, streak)
│   ├─ play         Modes (Classic map, Category, Blitz, IQ Test*, Pass & Play*)
│   ├─ stats        Stats & Achievements*
│   └─ settings     Settings
├─ classic/[category]            level map for one category
├─ quiz/[sessionId]              the question screen (all modes share it; fullScreenModal, no tabs)
├─ results/[sessionId]           round results (+ native ad)
├─ daily/result                  daily result + streak animation + share
├─ party/setup → party/handoff → quiz → party/podium   (v1.1)
└─ modal/lifeline-offer          rewarded-ad offer sheet
* v1.1
```

Rules: back from `quiz` shows "Quit round? Progress for this round will be lost." Android hardware back on Home exits. Deep links: `quizora://daily` (from notification) opens Daily Challenge directly.

---

## 5. Screen-by-screen UI spec

| Screen | Content | States |
|---|---|---|
| **Home** | Greeting + player level bar; **Daily Challenge** hero card (date, "10 questions · ~2 min", streak flame); "Continue: Geography L7" card; 2×3 mode grid; banner at bottom | *Daily not played* (primary CTA "Play today's challenge"); *Daily done* (shows score, "Come back in 7h 12m"); *Streak at risk* (amber card after 18:00); *First day* (streak 0, copy "Start your streak today") |
| **Modes (Play tab)** | Cards: Classic, Category, Timed Blitz, IQ Test, Pass & Play; each with 1-line description and PB | *Locked* (v1.1 modes show "Coming soon" in v1.0 — hidden instead, decision: hide) |
| **Classic map** | Vertical path of 30 level nodes with stars; category header with % complete | *Locked node* (lock icon, tap → toast "Get 1★ on level 6 first"); *Current* (pulsing); *Completed* (stars) |
| **Category picker** | 12 category tiles (icon, name, accuracy %); difficulty segmented control | *Category exhausted* → "You've seen 90% — we'll mix in your oldest questions" |
| **Quiz (question)** | Top: progress (3/10), timer ring (20 s default, Blitz shows global clock), score; question card; 4 answer buttons (min 56 dp); lifeline row (50/50, Skip, +15 s) | *Idle*; *Answered-correct* (green, haptic success, +XP float); *Answered-wrong* (red shake, correct one highlighted green); *Timeout* ("Time's up!", counts wrong); *Lifeline used* (greyed); *Lifeline empty* (shows ▶ icon = rewarded offer); *Paused* (app backgrounded → timer pauses, overlay "Paused — Resume") |
| **Explanation sheet** | Slides up after answer: ✓/✗ title, "Did you know?" fact, source domain in small text, Next button | *Last question* → button "See results" |
| **Results** | Score X/10, stars animation, XP gained, accuracy, time; buttons: Next level / Replay / Home; native ad card below the fold; "Double XP ▶" rewarded button | *New best*; *Level failed* (0★: "So close! 4/10 — you need 5 to pass"); *Level up* (confetti) |
| **Daily result** | Score, streak flame +1 animation, calendar strip of last 7 days, Share (image via react-native-view-shot + expo-sharing) | *Streak freeze used* banner; *Already played* |
| **Stats** | Totals, accuracy per category bar list, best streak, Blitz PB | *Empty* (no games: "Play a round to see your stats") |
| **Settings** | Toggles + pickers listed in F11; "Privacy options" (UMP), "Privacy policy" (link), version + content version (e.g. bank v1.0.3) | *Consent not required region* hides Privacy options row |
| **Party setup (v1.1)** | Add 2–6 players, rounds, categories | *Fewer than 2 players* disables Start |
| **Handoff (v1.1)** | Full-screen color of next player: "Pass to Alex — tap when ready" | — |

Global states: **loading** (bank parse < 300 ms; skeleton on first launch only), **error** (corrupt MMKV → reset dialog with backup of progress keys), **offline** (no special state — everything works; ads silently absent).

---

## 6. Onboarding (target: first answer < 30 s)

Principles: value before asks; every screen skippable except the warm-up; consent (UMP) shown **after** the warm-up and **before** the first ad request; notification permission asked only after the user has felt value and opted in to a reminder.

**Screen O1 — Welcome** (no skip needed, 1 tap)
- Illustration: stack of question cards with a lightbulb.
- Title: **"Test what you know. Learn what you don't."**
- Body: "3,000+ trivia questions. Works offline. No sign-up."
- Primary: **"Let's play"** · Secondary (text): "I've played before — skip intro" → sets defaults (all categories, Medium), jumps to O6 consent then Home.

**Screen O2 — Pick favorite categories** (`@shared/onboarding` step component, multi-select chips)
- Title: **"What are you into?"**
- Sub: "Pick at least 3. You can change this anytime."
- 12 chips with icons; pre-selected: General Knowledge.
- Primary: **"Continue"** (disabled until 3 picked; counter "2 of 3 picked") · Top-right: **"Skip"** → all categories.

**Screen O3 — Pick difficulty**
- Title: **"How tough should we go?"**
- Options (radio cards): **Easy** — "Warm and friendly" · **Medium** — "A real challenge" (default) · **Hard** — "Trivia night champion".
- Footnote: "We'll adapt as you play."
- Primary: **"Start warm-up"** · Skip → Medium.

**Screen O4 — Warm-up quiz (first-value moment)**
- Header: "Warm-up · 1 of 3". 3 easy questions drawn from picked categories (always easy regardless of O3, to guarantee success), no timer, no lifelines, no ads.
- After each answer: explanation sheet (same as real game) so the user sees the "learn why" hook.
- No skip (it *is* the product); takes ~20 s.

**Screen O5 — Warm-up result**
- Title (3/3): **"Perfect start! 🧠"** · (2/3) **"Nice! You're a natural."** · (0–1/3) **"Everyone starts somewhere."**
- Body: "+30 XP · Your streak starts today."
- Primary: **"Continue"**.

**Screen O6 — Consent (UMP)** via `@shared/consent.requestConsent()`
- Only in regions where the UMP form is required; otherwise skipped silently. Pre-screen copy: **"Quizora is free thanks to a few ads. Next, choose how ads can use your data."** Button: **"OK"** → Google UMP form. Never block play on refusal; non-personalized ads served.

**Screen O7 — Daily reminder (soft ask, then OS ask)**
- Title: **"Keep your streak alive"**
- Body: "Get one friendly nudge a day for the Daily Challenge. Nothing else."
- Time picker default 19:00. Primary: **"Remind me"** → Android 13+ `POST_NOTIFICATIONS` system dialog. Secondary: **"Not now"** → re-offer once after first 3-day streak (from Daily result screen).

**Exit:** Home with Daily Challenge card highlighted (coach-mark: "Your first Daily Challenge is ready"). `onboarding.done = true`. Interstitials and app-open ads suppressed for the entire first session.

Skip behavior summary: skip on O2/O3 uses defaults; O1 "skip intro" bypasses O2–O5; O6 cannot be skipped where legally required (form handles); O7 "Not now" is honored.

Funnel events (local counters only, logged via `@shared/storage` analytics counters; optional Firebase Analytics later): `onb_start`, `onb_cat_done`, `onb_diff_done`, `onb_warmup_q1..3`, `onb_consent_shown`, `onb_notif_accept|decline`, `onb_done`. Target: ≥85% `onb_done`.

---

## 7. Design system (`@shared/theme` overrides)

**Palette**
| Token | Light | Dark |
|---|---|---|
| `primary` (brand indigo) | `#4F46E5` | `#818CF8` |
| `primaryContainer` | `#E0E7FF` | `#312E81` |
| `accent` (quiz gold, stars/XP) | `#F59E0B` | `#FBBF24` |
| `streak` (flame) | `#F97316` | `#FB923C` |
| `success` | `#16A34A` | `#4ADE80` |
| `error` | `#DC2626` | `#F87171` |
| `bg` | `#F8FAFC` | `#0B1020` |
| `surface` | `#FFFFFF` | `#151B2E` |
| `surfaceAlt` | `#EEF2F7` | `#1E2640` |
| `text` | `#0F172A` | `#E5E7EB` |
| `textMuted` | `#475569` | `#94A3B8` |
| `border` | `#E2E8F0` | `#2A3350` |

Category colors (chips/icons): GK `#6366F1`, Geography `#0EA5E9`, History `#A16207`, Science `#10B981`, Movies `#E11D48`, Music `#D946EF`, Sports `#F97316`, Animals `#84CC16`, Food `#EAB308`, Literature `#8B5CF6`, Logic/IQ `#14B8A6`, Flags `#EF4444`. All text-on-color pairs verified ≥4.5:1 (white text on darker shade variants where needed).

**Type scale** (Inter via expo-font; scaled by text-size setting ×0.9/1/1.15/1.3 and respects OS font scale up to 1.5):
Display 32/40 bold · H1 24/32 bold · H2 20/28 semibold · Question 20/28 semibold · Answer 17/24 medium · Body 16/24 · Caption 13/18 · Overline 12/16 caps.

**Spacing/shape:** 4-pt grid; radius 12 (buttons), 20 (cards); answer buttons min height 56 dp, 12 dp gap.

**Motion (Reanimated):** answer press scale 0.97 (spring), correct → green fill 180 ms + subtle bounce; wrong → 3-cycle shake 240 ms; explanation sheet slide-up 220 ms; stars pop sequentially 150 ms apart; respects `AccessibilityInfo.isReduceMotionEnabled` (crossfade only).

**Sounds/haptics (expo-av / expo-audio, expo-haptics):** correct chime, wrong soft buzz, tick in last 5 s, level-up fanfare; all < 30 KB OGG. Haptics: `notificationAsync(Success|Error)`, light impact on tap. Independent toggles; default sound ON, music OFF.

**Accessibility:** TalkBack labels ("Answer B, Paris"); result announced via `announceForAccessibility`; never rely on color only (✓/✗ icons); timer can be disabled in Settings ("Relaxed mode" — no timer, still earns XP ×0.8); touch targets ≥48 dp; dynamic type tested at 1.5×.

---

## 8. Game logic

**Question selection (no repeats)**
- Each question has a stable `id`. `seen` map: `id → { lastSeen: epochDay, timesSeen, timesCorrect }`.
- Pool for a request = bank filtered by category/difficulty/locale.
- Pick order: (1) never-seen questions, shuffled; (2) when unseen < round size, fall back to **spaced rotation**: weight = `daysSince(lastSeen)² × (timesCorrect < timesSeen ? 2 : 1)` — older and previously-missed questions resurface first; never repeat a question seen in the last 3 days or in the current session.
- Classic levels are **deterministic**: level N of a category = slice of a per-category ordering generated at build time (stable across installs), so stars are meaningful; replays shuffle answer order only.
- Answer options shuffled per display (Fisher–Yates with session PRNG).

**Daily seed by date**
- `seed = hash32("quizora-daily-" + YYYY-MM-DD + contentVersionMajor)` using local date.
- `mulberry32(seed)` selects 10 questions: 3 easy, 4 medium, 3 hard, ≥5 distinct categories, excluding `flags` images in v1.0. Same on every device with the same bank major version. Questions do not affect the general `seen` exclusion (daily may repeat a practice question; acceptable).

**Timer:** 20 s per question (Easy 25 s, Hard 18 s); Blitz global 60 s. Pauses on `AppState` background.

**Lifelines** (per round: 1 free each; then rewarded ad grants +1 of the chosen lifeline, max 2 rewarded lifelines per round)
- **50/50:** removes 2 wrong options at random (seeded).
- **Skip:** replaces with another question of the same difficulty; skipped question not marked seen.
- **Extra time:** +15 s (Blitz: +10 s, once per run).
- Not available in Daily Challenge (fairness) except Skip ×1; not available in IQ Test.

**Scoring & XP**
- Points per correct: Easy 100, Medium 150, Hard 200; time bonus `+floor(remainingSec × 5)`; streak-in-round bonus ×1.1 after 3 consecutive correct, ×1.25 after 5.
- XP = correct answers × (10 easy / 15 medium / 20 hard) + 20 per level completion + 30 for Daily. Lifeline use −0 XP (no punishment). **Double XP** rewarded: doubles round XP, max 3/day.
- Player level: XP needed for level L = `100 × L^1.5` (rounded). Titles: Curious (1–4), Quizzer (5–9), Brainiac (10–19), Scholar (20–34), Trivia Legend (35+).
- Stars per Classic level as in F1; best stars kept.

**Streaks**
- Daily streak increments when the Daily Challenge is completed on a local date. Missed day → reset to 0 unless a **freeze** is available (earn 1 per 7-day streak, max 2 held); rewarded "Restore streak" ad offered once if streak ≥3 and missed exactly 1 day.
- Timezone change: use device local date; guard against >1 increment per 20 h.

**Extra life (Classic hard levels 21–30):** 3 hearts per level; at 0 hearts, rewarded "Continue with 1 heart" once per level.

**IQ Test mode (v1.1):** 30 items, raw score → band (e.g. 22–25 → "115–124 Quiz IQ"); shown with entertainment disclaimer.

---

## 9. Local data model

Storage: `@shared/storage` (MMKV wrapper, `createStore('trivia')`, typed `get/set/useValue`). All keys prefixed `tq.`.

| Key | Type | Notes |
|---|---|---|
| `tq.schemaVersion` | `number` | migrations |
| `tq.onboarding` | `OnboardingState` | via `@shared/onboarding` |
| `tq.profile` | `Profile` | XP, level, prefs |
| `tq.settings` | `Settings` | |
| `tq.progress.classic` | `Record<CategoryId, ClassicProgress>` | |
| `tq.seen` | `Record<QuestionId, SeenEntry>` | compacted (see below) |
| `tq.daily` | `DailyState` | |
| `tq.streak` | `StreakState` | |
| `tq.stats` | `Stats` | |
| `tq.ads` | managed by `@shared/ads` | caps, last-shown timestamps |
| `tq.content.version` | `string` | installed bank version |
| `tq.party.lastPlayers` | `string[]` | v1.1 |

```ts
type CategoryId = 'general' | 'geography' | 'history' | 'science' | 'movies' | 'music'
  | 'sports' | 'animals' | 'food' | 'literature' | 'logic' | 'flags';
type Difficulty = 1 | 2 | 3; // easy | medium | hard
type QuestionId = string;    // e.g. "geo-000412"

interface Profile { xp: number; level: number; favoriteCategories: CategoryId[];
  preferredDifficulty: Difficulty; createdAt: number; }
interface Settings { sound: boolean; music: boolean; haptics: boolean;
  textScale: 0.9 | 1 | 1.15 | 1.3; theme: 'system' | 'light' | 'dark'; relaxedMode: boolean;
  reminder: { enabled: boolean; hour: number; minute: number }; }
interface ClassicProgress { stars: Record<number, 0 | 1 | 2 | 3>; unlocked: number; bestScores: Record<number, number>; }
interface SeenEntry { d: number /* epochDay */; n: number /* timesSeen */; c: number /* timesCorrect */; }
interface DailyState { lastPlayedDate: string | null /* YYYY-MM-DD */; lastScore: number;
  history: Array<{ date: string; score: number }>; /* last 30 */ }
interface StreakState { current: number; best: number; freezes: number; lastDate: string | null; restoredAt?: string; }
interface Stats { answered: number; correct: number; byCategory: Record<CategoryId, { a: number; c: number }>;
  blitzBest: number; roundsPlayed: number; doubleXpToday: { date: string; count: number }; }
```

`tq.seen` size: 3,000 entries × ~30 B ≈ 90 KB — fine for MMKV. Compaction: drop entries older than 365 days when > 10k.

**Question JSON schema** (`assets/questions/en/<category>.json`, one file per category, lazy-required):
```ts
interface QuestionFile { category: CategoryId; locale: string; version: string; questions: Question[]; }
interface Question {
  id: QuestionId;               // "<cat3>-<6 digits>", never reused
  q: string;                    // ≤ 140 chars
  a: [string, string, string, string]; // a[0] is ALWAYS the correct answer; shuffled at runtime
  d: Difficulty;
  x: string;                    // explanation / fun fact, ≤ 220 chars
  src?: string;                 // source URL (domain shown in UI)
  tags?: string[];              // "1990s", "europe", "oscars"
  img?: string;                 // v2 picture rounds
  ev?: 1;                       // evergreen flag: false for time-sensitive facts ("current champion")
  rev: number;                  // revision, bump on fact fix
}
```
Bundled size estimate: 3,000 × ~400 B ≈ 1.2 MB uncompressed (≈350 KB in APK).

---

## 10. Content pipeline (no backend)

Location: `apps/trivia-quiz/content/` (scripts in Node/TS, run locally or in CI).

1. **Topic plan** — `content/plan.yaml`: per category, 250+ subtopics × difficulty quotas (e.g. geography: capitals 40, rivers 15, …), 260 questions per category target (12 × 260 = 3,120).
2. **Generation** — `scripts/generate.ts` calls a Haiku-class Claude model (Message Batches API for ~50% cost) with a strict JSON tool schema; prompt includes subtopic, difficulty definition ("easy = 70% of adults know it"), rules (no trick questions, unambiguous single answer, plausible distractors same type/length, no time-sensitive facts unless `ev:0`, no offensive/political/religious-controversy content, US-English). Generate 1.5× target to allow culling. Est. cost: ~4,700 questions × ~600 tokens ≈ 3M tokens ≈ low single-digit USD.
3. **Validation** — `scripts/validate.ts` (zod): schema, lengths, 4 unique options, correct answer not a substring of question, no "all of the above", profanity list, banned topics list, option length variance, ASCII quote normalization. Fails CI.
4. **Dedupe** — `scripts/dedupe.ts`: normalize (lowercase, strip punctuation/stopwords) → exact hash dedupe; then near-dup via MinHash/Jaccard on word 3-shingles (> 0.6 flagged) and same-answer+same-category check; keep higher-quality variant.
5. **Fact-check** — `scripts/factcheck.ts`: a second, independent model pass (Sonnet-class) answers each question blind; mismatches with `a[0]` or low confidence are flagged (expect ~5–8%). Flagged + random 10% sample → human spot-check in a CSV/Google Sheet (~2 h/category). Any category with >3% error in the sample gets a full manual review.
6. **Difficulty calibration** — after launch, local per-question stats can't reach us (no backend); instead use internal beta (20 testers) answer rates + model-predicted difficulty; re-label at v1.1.
7. **Build** — `scripts/build-bank.ts` assigns stable IDs, generates deterministic Classic level ordering, writes `assets/questions/<locale>/*.json` + `manifest.json` (`{version, counts, sha256}`).
8. **Shipping updates** — question JSON lives in the JS bundle/assets, so `eas update --channel production` ships new/corrected questions OTA without a store release (same runtimeVersion). Bank `version` bump → app migrates `tq.content.version`; removed IDs are ignored in `seen`. Major ordering changes are forbidden (Classic levels stay stable; new questions append new levels).
9. **Corrections** — "Report question" button (explanation sheet) opens a prefilled `mailto:` with question id; fixes batched weekly into an OTA.
10. **Localization of questions (v2.0)** — translate *selected* culturally neutral questions (geography, science, animals, logic) via model translation + native-speaker review of 10% sample; replace US-centric categories (sports, movies, music) with locally generated sets per locale. IDs shared across locales when translated (`geo-000412` in es = same fact).

---

## 11. Notifications (local only, expo-notifications)

| Notification | Trigger | Copy (examples, rotate) | Rules |
|---|---|---|---|
| Daily reminder | User-chosen time (default 19:00), daily | "Today's 10 questions are ready. Keep your 🔥 4-day streak!" / "2 minutes, 10 questions. Ready?" | Cancel today's if Daily already played (reschedule from tomorrow) |
| Streak at risk | 20:30 if streak ≥2 and daily not played, only when reminder time is earlier | "Your 6-day streak ends at midnight." | Max 1/day total including reminder |
| Comeback | Day 3 and day 7 of inactivity | "We added a new history level for you." | Stop after day 7; no more until next open |
| Weekly event (v2.0) | Monday 18:00 | "Space Week starts now 🚀" | Opt-out toggle |

Android channel `daily` (default importance). Tapping deep-links to `quizora://daily`. Never more than 1 notification per day. All rescheduled on app open (idempotent).

---

## 12. AdMob placement map (`@shared/ads`)

Init order: `@shared/consent.requestConsent()` → `canRequestAds` → `mobileAds().initialize()` → preload. Test IDs in dev via `__DEV__`. Max ad content rating: **T** (`maxAdContentRating: 'T'`), `tagForUnderAgeOfConsent: false`, not child-directed.

| Format | Placement id | Where / trigger | Frequency cap | Never show when |
|---|---|---|---|---|
| Interstitial | `tq_round_end` | `showInterstitial('round_end')` when navigating from Results → next/home | After every **2 completed rounds** AND ≥ **90 s** since last full-screen ad; max 8/day | First session; during onboarding; directly after a rewarded ad (< 90 s); Daily result screen (streak celebration); mid-party-game; user is < 60 s into session |
| Rewarded | `tq_lifeline` | Lifeline empty → offer sheet "Watch a short video for another 50/50?" | Max 2 per round, 15/day | Daily Challenge (except none), IQ Test |
| Rewarded | `tq_extra_life` | Hearts = 0 on hard Classic levels | 1 per level attempt | — |
| Rewarded | `tq_double_xp` | Results screen button | 3/day | Score 0 |
| Rewarded | `tq_streak_restore` | Home, after a single missed day, streak ≥3 | 1 per break | — |
| App open | `tq_app_open` | **Warm start only** (resume from background after ≥ 4 h) | 1 per 4 h | Cold start; first 2 days after install; returning from a rewarded/interstitial or share sheet; notification deep-link to Daily |
| Banner (adaptive anchored) | `<AdBanner placement="menu" />` | Home, Modes, Classic map, Stats, Settings | — | Quiz screen, explanation sheet, onboarding, party handoff |
| Native advanced | `tq_results_native` | Results screen card below buttons (styled to theme, "Ad" label) | 1 per Results view | Daily result, onboarding warm-up result |

Reward is granted only on `EARNED_REWARD`; if ad fails to load, the button shows "Not available right now" (never grant silently, never spin > 3 s). All caps live in `@shared/ads` config and are unit-tested with fake timers.

**Mediation (from week 2, once ≥1k DAU):** AdMob bidding + Meta Audience Network, AppLovin, Unity Ads, Liftoff/Vungle, IronSource via Google mediation adapters (Expo config plugin for Gradle deps). Waterfall floors only for interstitial (eCPM floors $8 / $4 / $1.5 US). `app-ads.txt` on portfolio domain lists Google + each network.

Projected ad load: ~3 interstitials, ~1.5 rewarded, ~15 banner impressions per DAU.

---

## 13. Retention loops & in-app review

- **Daily loop:** notification → Daily Challenge (2 min) → streak +1 → explanation facts → "Play a level while you're here" CTA.
- **Progression loop:** Classic stars unlock levels → category % complete → player level titles.
- **Mastery loop:** Stats show weakest category → "Practice Science" shortcut → accuracy rises.
- **Social loop (offline):** Share daily score image ("Quizora Daily · Oct 8 · 9/10 🔥12") with Play link; Pass & Play introduces new installs at game nights.
- **Variable reward:** fun facts, surprise "Perfect round" badge, weekly themed events.

**In-app review (`expo-store-review`)** — trigger `requestReview()` only when ALL: ≥3 days since install, ≥5 rounds played, just finished a round with ≥8/10 or a 3★ level or streak milestone (3/7/30), no ad shown in last 60 s, not asked in last 60 days (Play quota also limits). Never after a failed level. Settings has "Rate Quizora" link to Play.

---

## 14. Tech stack

- Expo SDK (latest stable), Expo Router (typed routes), TypeScript strict, React Native New Architecture.
- `react-native-mmkv` via `@shared/storage`; `zustand` for in-memory session state (quiz engine).
- `react-native-google-mobile-ads` via `@shared/ads`; UMP via `@shared/consent`. EAS **dev build** required (no Expo Go).
- `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, `expo-audio`, `expo-font` (Inter), `expo-notifications`, `expo-store-review`, `expo-sharing` + `react-native-view-shot`, `expo-localization`, `expo-updates` (EAS Update), `@shopify/flash-list` (stats/level lists), `zod` (content scripts + runtime manifest check).
- Testing: Jest + `@testing-library/react-native` (engine, caps, seeds), Maestro E2E flows (onboarding, daily, ad caps with test IDs).
- Crash reporting: Sentry (`@sentry/react-native`, no PII) — declared in Data safety.
- CI: EAS Workflows — lint/typecheck/test → content validate → preview build; `eas update` on `main` to `preview` channel.

---

## 15. Folder structure

```
apps/trivia-quiz/
├─ app/                      # Expo Router routes (see §4)
│  ├─ _layout.tsx            # ThemeProvider (@shared/theme), consent+ads bootstrap, notification listeners
│  ├─ (onboarding)/…
│  ├─ (tabs)/…
│  ├─ quiz/[sessionId].tsx
│  └─ results/[sessionId].tsx
├─ src/
│  ├─ engine/                # pure TS, 100% unit tested
│  │  ├─ prng.ts             # mulberry32, hash32
│  │  ├─ selector.ts         # no-repeat + spaced rotation
│  │  ├─ daily.ts            # date seed → question ids
│  │  ├─ scoring.ts          # points, XP, stars, levels
│  │  ├─ streak.ts
│  │  └─ lifelines.ts
│  ├─ content/               # bank loader, manifest, migrations
│  ├─ state/                 # zustand session store, MMKV-backed selectors
│  ├─ components/            # AnswerButton, TimerRing, LifelineBar, ExplanationSheet, StarRow…
│  ├─ features/              # home, classic, blitz, daily, party, stats, settings
│  ├─ ads/placements.ts      # placement ids + cap config passed to @shared/ads
│  ├─ notifications/
│  └─ i18n/                  # UI strings (en at launch)
├─ assets/
│  ├─ questions/en/*.json    # generated, committed
│  ├─ sounds/  fonts/  images/
├─ content/                  # pipeline (not bundled)
│  ├─ plan.yaml  raw/  review/
│  └─ scripts/ generate.ts validate.ts dedupe.ts factcheck.ts build-bank.ts
├─ e2e/                      # Maestro flows
├─ app.config.ts  eas.json  package.json  tsconfig.json
├─ DEVELOPMENT_PLAN.md  ASO.md
```

---

## 16. KPIs & targets

| Metric | Target (month 1) | Stretch | Benchmark note |
|---|---|---|---|
| Onboarding completion | ≥85% | 92% | |
| D1 retention | 35% | 42% | trivia genre median ~28–32% |
| D7 retention | 14% | 18% | |
| D30 retention | 5% | 8% | streak + daily drive this |
| Sessions / DAU / day | 2.2 | 3.0 | |
| Avg session length | 6 min | 9 min | |
| Daily Challenge participation (of DAU) | 45% | 60% | |
| Rewarded opt-in rate (of DAU) | 25% | 35% | |
| ARPDAU (US) | $0.04 | $0.06 | blended global $0.015–0.02 |
| Crash-free users | ≥99.5% | 99.8% | Play vitals |
| Store rating | ≥4.4 | 4.6 | |
| Store listing conversion | 30% | 40% | Play Console |

Data sources: Play Console (retention cohorts, vitals, acquisition), AdMob (ARPDAU, eCPM, fill), optional Firebase Analytics (declared in Data safety if added).

---

## 17. Milestones (MVP in 9 working days)

| Day | Deliverables | Done when |
|---|---|---|
| **D1** | Scaffold in monorepo, Expo Router tabs, `@shared/theme` tokens, `@shared/storage` keys, EAS dev build with ads plugin + test IDs; kick off content generation batch | Dev build runs on device; banner test ad visible on Home |
| **D2** | Engine: prng, selector, scoring, streak, daily seed + Jest tests (≥90% engine coverage); content validate/dedupe scripts | `pnpm test` green; same daily ids on two devices |
| **D3** | Quiz screen (timer, answer states, explanation sheet, lifelines), Results screen | Can play a 10-question Category round end-to-end |
| **D4** | Classic level map + stars/unlocks, Timed Blitz, Daily Challenge + result + share image | All 4 v1.0 modes playable |
| **D5** | Onboarding O1–O7 via `@shared/onboarding`, consent via `@shared/consent`, notifications | First answer < 30 s measured; reminder fires |
| **D6** | Ads: all placements + caps + rewarded flows; native results card; app-open warm-start | Cap unit tests pass; Maestro ad flow with test IDs |
| **D7** | Content: fact-check pass, human spot-check, build bank (≥3,000 q), Stats + Settings screens | Bank manifest committed; validator 0 errors |
| **D8** | Polish: sounds/haptics, dark mode, a11y (TalkBack, 1.5× font), reduce motion, performance (cold start < 2 s mid-range) | a11y checklist passed |
| **D9** | Store assets (ASO.md), privacy policy, Data safety, IARC, internal testing track, app-ads.txt, production EAS build | Internal test release live; closed-testing started |
| D10–D23 | Closed testing (≥12 testers × 14 days, required for new personal dev accounts), fix bugs, OTA content fixes | Production access granted → staged rollout 20% → 100% |

### Milestone checklist (tick when done; a note says what a phone, an account or a store is still needed for)

- [x] **D1 — Scaffold:** app in the monorepo, Expo Router tabs, theme tokens, storage keys, ads plugin with test IDs, test harness. *(~~dev build runs on a device and a banner test ad shows on Home~~: not done, it needs a device and an EAS account; nothing has been run on a device. The tabs are placeholders until D3–D7; Home shows the banner slot only, no ad request is made yet.)*
- [x] **D2 — Engine and content:** prng, selector, scoring, streak, daily seed, lifelines, Jest tests; content validate/dedupe scripts; question bank. *(The bank has 3,600 questions in 12 categories, built by `scripts/build-bank.mjs` and checked by `src/content/__tests__/bank.test.ts` for format, duplicates, near duplicates, profanity and size. ~~Haiku generation via the Batches API and the independent Sonnet fact-check pass~~ were not done: the questions were written by model agents in one pass, **nothing was fact-checked** and no human spot check was done; see `content/review/`. ~~"Same daily ids on two devices"~~ is tested as the same ids from the same date in one process and in 7 time zones, not on two phones. Engine coverage was not measured as a percentage.)*
- [x] **D3 — Quiz and results:** quiz screen (timer, answer states, explanation, lifelines), Results screen. *(Tested in Jest with the real screens, fake timers and fake native modules; ~~"can play a 10-question Category round end to end"~~ on a phone is not done. The explanation is a panel inside the screen, not a sliding sheet, and the rewarded lifeline offer arrives with D6. Haptics, sounds, the ring and the shake animation have never been seen or heard on a device.)*
- [x] **D4 — Modes:** Classic map with stars and unlocks, Timed Blitz, Daily Challenge with result and share image. *(Built together with D3 and committed with it. Blitz shows the explanation after each answer with the clock stopped, so the 60 s is thinking time; the share image goes through `react-native-view-shot` and `expo-sharing`, which are mocked in Jest and were never run on a device. The `modal/lifeline-offer` route of §4 is a sheet inside the quiz screen instead.)*
- [x] **D5 — Onboarding and reminders:** O1–O7 on `@shared/onboarding`, consent, notifications. *(All of it is tested in Jest against the real screens and fake native modules. ~~"First answer < 30 s measured"~~ and ~~"reminder fires"~~ need a phone: nothing was timed, no notification was ever delivered, and Doze, reboot and killed-app behaviour are untested. The Google consent form was never shown (the UMP status is faked). Deviations: the closing text says "Play today's Daily Challenge to start your streak" because the plan's "your streak starts today" would be untrue (only the Daily counts); "streak at risk" replaces today's reminder at 20:30 instead of being a second message, to keep one notification a day; reminders are a week of one-off notifications planned on every open, not a repeating trigger. `@shared/consent` gained `isConsentFormRequired()` so the pre-screen shows only where Google's form follows.)*
- [ ] **D6 — Ads:** all placements, caps, rewarded flows, native results card, app-open warm start.
- [ ] **D7 — Stats, Settings, content check:** Stats and Settings screens, bank manifest, validator at 0 errors.
- [ ] **D8 — Polish:** sounds and haptics, dark mode, accessibility, reduce motion, review prompt, RELEASE.md.
- [ ] **D9 — Release prep:** store assets, privacy policy, Data safety, IARC, internal testing track, production build. *(not started)*
- [ ] **D10–D23 — Closed testing and bug bash.** *(not started)*

---

## 18. QA & Play release checklist

**Functional QA**
- [ ] Airplane mode from fresh install: onboarding, all modes, daily, stats work; no crashes when ads can't load.
- [ ] Daily ids identical on 2 devices same date; change date → new set; timezone change doesn't double-increment streak.
- [ ] No question repeats within 3 days in Category play (scripted test over 300 rounds).
- [ ] Timer pauses on background; resumes correctly; incoming call.
- [ ] Ad caps: interstitial never < 90 s apart, never during a question, never in first session; app-open only on warm start; banner absent on quiz screen.
- [ ] Rewarded: reward only on earn; failure path messages; no double-grant on fast taps.
- [ ] UMP: EEA (debug geography) shows form; "Privacy options" re-opens it; ads non-personalized on refusal.
- [ ] Notifications: Android 13+ permission flow; reminder cancels after daily played; deep link works from killed state.
- [ ] OTA: `eas update` with new bank version applies on next cold start; progress preserved.
- [ ] Low-end device (2 GB RAM, Android 9): bank load < 300 ms, 60 fps answer animations.
- [ ] Accessibility: TalkBack full round; font 1.5×; contrast audit.

**Play Console**
- [ ] **Target audience & content:** age groups 13–15, 16–17, 18+; app NOT designed for children; not in Families program; "appeals to children" = No (neutral art style, no cartoon mascots aimed at kids).
- [ ] **Content rating (IARC):** questionnaire → expected Everyone/PEGI 3 (trivia, no violence); ads present = Yes.
- [ ] **Ads declaration:** Contains ads = Yes.
- [ ] **Data safety:** Data collected/shared by AdMob SDK — Device or other IDs (advertising ID), App interactions, Diagnostics, approximate location (IP-derived), for Advertising/Analytics/Fraud prevention; shared with Google ad partners; encrypted in transit; no account so deletion = uninstall. Sentry: crash logs/diagnostics. No personal info collected by the app itself.
- [ ] **AD_ID permission** declared (react-native-google-mobile-ads includes it); Advertising ID declaration form = Yes.
- [ ] **Privacy policy** URL on portfolio site (covers AdMob, UMP, Sentry, local storage, notifications, contact email); linked in-app (Settings) and in listing.
- [ ] **app-ads.txt** at `https://<portfolio-domain>/app-ads.txt` with `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` + mediation partners; developer website set in Play listing; verified in AdMob.
- [ ] **AdMob app** linked to Play listing after publish; ad units created per placement; "Max ad content rating" = T in AdMob blocking controls; sensitive categories (gambling, dating) blocked.
- [ ] Store listing per ASO.md; no "earn money" claims; screenshots show real UI.
- [ ] Target API level = current Play requirement; 16 KB page size compatible build; AAB signed by Play App Signing.
- [ ] Closed test 12+ testers × 14 days (if personal account) → production access application.
- [ ] Staged rollout 20% → monitor vitals 48 h (ANR < 0.47%, crash < 1.09%) → 100%.
