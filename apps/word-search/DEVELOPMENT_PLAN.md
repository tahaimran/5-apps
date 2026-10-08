# Word Search: Large Print Easy — Development Plan

> App folder: `apps/word-search` · Platform: Google Play (Android only) · Stack: Expo (latest SDK) + Expo Router + TypeScript
> Monetization: AdMob only (`react-native-google-mobile-ads` via `@shared/ads`) · No backend, no auth, no server database
> Store listing and keyword research: see [`ASO.md`](./ASO.md)

**Final store name:** `Word Search: Large Print Easy` (29 chars). Launcher label: `Word Search`.
Android package: `com.<portfolio>.wordsearch.largeprint` (pick the portfolio prefix once and never change it).

---

## 1. Concept & positioning

**One-liner:** A calm, large-print word search that people aged 45+ can read without glasses-squinting, play without a clock, and keep playing offline forever.

**Problem.** The top "word search" apps (playvalve, playsimple, Wordscapes Search) are tuned for a broad, younger audience: small letters on 12x12+ grids, timers, coins, flashy rewards, and aggressive interstitials. The few "for seniors" apps (Vita Word Search for Seniors, tellmewow) prove demand but leave room on polish, content variety, and ad tolerance.

**Positioning.** "The comfortable word search." Every decision is judged against three promises:
1. **Readable** — user-chosen letter size up to extra-large; high contrast; grid cells never smaller than 44dp.
2. **Relaxed** — no timers, lives, energy, or fail state. Ads never interrupt a puzzle in progress.
3. **Always there** — 100% offline, unlimited puzzles generated on-device from bundled themed word lists, plus a daily puzzle.

**Differentiators vs. competitors**
| Pain in competitors | Our answer |
|---|---|
| Letters too small, grid too dense | 4 text sizes; grid size auto-limited by text size and screen width |
| Timers and scores create pressure | No timer shown by default; stars reward completion, not speed |
| Ads after every level, ads over the grid | Interstitial max every 3 levels and ≥90s; banner never on game screen |
| Confusing drag gestures | Drag OR tap-first-tap-last selection |
| Needs internet | Fully offline, no account |

**Business goal.** Low-CPI niche entry ("word search for seniors", "word search large print", "easy word search") then climb the head term "word search" (traffic 79) via retention and ratings. Older US/Tier-1 users have high eCPMs and long sessions, so a gentle ad cadence still yields strong ARPDAU.

---

## 2. Target personas

### Margaret, 71 — retired teacher, Ohio
- Samsung Galaxy A15, system font size set to "large". Reading glasses she often forgets.
- Played paper word search books for decades; daughter installed a word app that "shouts at her" with popups.
- Plays 20–40 min after breakfast and in the evening. Wants it to "just remember where I was."
- **Needs:** huge letters, a clear list of words, no accidental ad taps, simple settings. **Churns if:** ads appear mid-puzzle or text is tiny.

### Robert, 58 — truck dispatcher, Texas
- Pixel 7a, plays on breaks and at the doctor's office, often with poor signal.
- Likes a light challenge (diagonals, backwards words) and keeps a streak going like he does with Wordle.
- **Needs:** offline, quick to resume, Hard mode that is actually hard, daily puzzle. **Churns if:** content repeats or progress is lost.

### Linda, 64 — caregiver for her mother, Florida
- Moto G, uses the app herself and sets it up for her 88-year-old mother on a tablet.
- Mother has low vision and tremor; tapping is easier than dragging.
- **Needs:** tap-to-select mode, high-contrast theme, TalkBack-friendly, large touch targets, no sign-in. **Churns if:** setup is confusing or a mis-tap opens the Play Store.

---

## 3. Core features

### MVP v1.0 (launch)
| # | Feature | Acceptance criteria |
|---|---|---|
| F1 | Puzzle generator | Generates a valid grid for every theme × difficulty in < 50 ms on a mid-range device (Moto G); 100% of listed words placed; no accidental extra occurrence of a listed word |
| F2 | Gameplay screen | Drag and tap-tap selection both work; found word highlighted with a persistent rounded stroke; word list strikes through; puzzle autosaves after each found word |
| F3 | Difficulty levels | Easy 8x8 (→ / ↓), Medium 10x10 (+ diagonals ↘ ↗), Hard 12x12 (all 8 directions); grid capped by text size (see §8) |
| F4 | Text size & themes | 4 sizes (Comfortable, Large, Extra Large, Huge); Light, Dark, High-Contrast themes; change applies instantly including mid-puzzle |
| F5 | Themed packs | ≥ 12 packs × ≥ 120 words each bundled (animals, birds, food, baking, travel, cities, nature, holidays, seasons, hobbies, music, home & family); no religious-specific pack; profanity filter on lists |
| F6 | Daily puzzle | Same puzzle for everyone on a given local date (seeded); one per day; calendar shows completed days |
| F7 | Hints | 3 free hints per puzzle-day pool; a hint flashes the first letter of a random unfound word for 3 s; rewarded ad grants +2 hints |
| F8 | Progress & stars | Levels per pack (unlimited, numbered); 1–3 stars by hints used; streak counter for daily puzzle |
| F9 | Onboarding | ≤ 4 screens including setup; first puzzle playable within 30 s of first launch |
| F10 | Ads + consent | UMP consent before any ad request; banner/interstitial/rewarded/app-open per §11 placement map |
| F11 | Local reminder | Opt-in daily notification at user-chosen time; never requested before first puzzle complete |
| F12 | Settings | Text size, theme, selection mode, sounds, haptics, reminder time, privacy options (UMP re-open), reset progress (double-confirm) |

### v1.1 (weeks 2–4 after launch)
- **Word collection / dictionary:** tap a found word to see a one-line plain-English definition (bundled, offline). AC: definitions for ≥ 90% of words.
- **More packs:** 6 more (gardening, sports, U.S. states, cooking, ocean, 1960s–80s nostalgia). AC: lists reviewed for difficulty and offensive terms.
- **In-app review prompt** (see §12). AC: shown at most once per 30 days, never after a negative moment.
- **Stats screen:** puzzles finished, words found, best streak, favorite pack.
- **"Relax mode" sound pack:** soft ambient loop toggle.

### v2.0 (month 2–3)
- **Seasonal events** (Halloween, Thanksgiving, Christmas word packs with a badge).
- **Picture/hidden phrase puzzles:** leftover letters spell a short phrase (classic word-search-book feature). AC: phrase placed by filling remaining cells in reading order.
- **Tablet layout:** two-pane (grid + word list side by side) for ≥ 600dp width.
- **Localization** of UI + word lists: es, pt-BR, de, fr (see ASO.md).
- **Remove-ads IAP** is explicitly out of scope (AdMob-only portfolio rule); revisit only if data shows strong demand.

---

## 4. Information architecture & navigation map

```
app/
 ├─ _layout.tsx              Root Stack: ThemeProvider, ConsentGate, AdsProvider
 ├─ onboarding/              (shown once; flag `ws.onboarding.done`)
 │   ├─ welcome.tsx
 │   ├─ text-size.tsx
 │   ├─ difficulty.tsx
 │   └─ first-puzzle → routes to /play/[puzzleId]?tutorial=1
 ├─ (tabs)/                  Bottom tabs (3 tabs only, labels always visible)
 │   ├─ index.tsx            Home ("Play")
 │   ├─ daily.tsx            Daily puzzle + calendar
 │   └─ settings.tsx         Settings
 ├─ packs/[packId].tsx       Level list for a theme pack
 ├─ play/[puzzleId].tsx      Game screen (full screen, no tabs)
 ├─ complete/[puzzleId].tsx  Puzzle complete (modal)
 ├─ stats.tsx                (v1.1)
 └─ help.tsx                 How to play
```

**Primary flows**
- Cold start (returning) → Home → "Continue" → Play → Complete → Next puzzle (interstitial slot) → Play
- Daily: Home "Today's puzzle" card or Daily tab → Play(daily) → Complete → streak animation → Home
- Packs: Home → pack card → Pack level list → Play

Back button: from Play always returns to the screen that launched it, with autosave; never shows an ad on back.

---

## 5. Screen-by-screen UI spec

### 5.1 Home (tab "Play")
- **Header:** greeting ("Good morning") + streak flame chip ("3-day streak").
- **Continue card** (if unfinished puzzle): pack name, difficulty, "5 of 10 words found", big primary button "Continue". 
- **Today's puzzle card:** date, theme, status (Not started / In progress / Done ✓).
- **Packs grid:** 2 columns of large cards (icon, pack name, "Level 7"). Min card height 120dp.
- **Adaptive banner** anchored at bottom above tab bar (see §11).
- **States:** first visit after onboarding → no Continue card, Today's card highlighted. All packs done is impossible (infinite levels).

### 5.2 Pack level list (`packs/[packId]`)
- Header with pack name + difficulty selector (segmented: Easy / Medium / Hard, 56dp tall).
- Vertical list of levels: "Level 12 ★★★"; current level emphasized with "Play" button; future levels shown as "Next up" (no locks beyond current+1 to avoid confusion).
- Banner at bottom.
- **Empty/error:** if word list fails to load (corrupt bundle), show "This pack couldn't open. Please try another pack." with "Back to packs" button and log `pack_load_error`.

### 5.3 Game screen (`play/[puzzleId]`)
- **Top bar (64dp):** Back (56dp), title ("Animals · Level 12"), Hint button with count badge, overflow (text size, theme, restart).
- **Grid:** square, centered, fills width minus 16dp gutters; cell size = computed per §8 (never < 44dp). Letters uppercase, bold, font size from text-size setting.
- **Word list:** below grid, wrapping chips; found words get strikethrough + color dot matching highlight; remaining count "6 words left".
- **No banner, no ads** on this screen.
- **States:** loading (skeleton grid < 200 ms), in-progress, paused (app backgrounded → autosave), complete → navigate to Complete modal after 600 ms celebration.
- **Feedback:** valid word → highlight stroke animates, success haptic, soft chime. Invalid selection → selection fades out (no buzz, no red error; seniors read red as "you did something wrong").

### 5.4 Puzzle complete (modal)
- Big "Well done!" + stars (1–3) + words found + optional time (hidden unless "Show timer" enabled).
- Buttons: primary "Next puzzle" (full width, 64dp), secondary "Back to packs".
- Daily variant: streak flame animation, "Come back tomorrow for a new puzzle", reminder opt-in prompt (first daily completion only, §10).
- Interstitial may show **after** "Next puzzle" tap, before next puzzle loads (§11).

### 5.5 Daily tab
- Today's puzzle card with big "Play today's puzzle".
- Month calendar: completed days marked with a check; missed days neutral (no shaming red X).
- Streak + best streak.
- Past days are playable ("Catch up") — they count for stars, not for streak.

### 5.6 Settings
- Sections: **Display** (text size preview slider with live sample grid, theme, selection mode), **Sound & touch** (sounds, haptics), **Reminder** (toggle + time picker), **Game** (show timer, highlight start letter on hint), **Privacy** (Privacy options → UMP form, Privacy policy link), **About** (version, rate the app, contact email), **Reset progress** (two-step confirm).
- All rows ≥ 64dp tall, toggles labeled with on/off text.

### 5.7 Help
- 4 illustrated steps: drag across letters; or tap first + last letter; tap Hint if stuck; words can go across, down, diagonal and backwards (per difficulty).

---

## 6. Onboarding flow

Principles: max 3 setup taps before playing; every screen has one obvious button; "Skip" text link top-right on screens 2–3 (applies defaults: Large text, Easy). Back is allowed. Progress dots shown. No permission dialogs during onboarding except UMP consent (legally required before ads).

**Screen 0 — Splash (system)**: app icon on cream background. During splash: init MMKV, load bundled word lists index, start `@shared/consent` UMP info update (non-blocking).

**Screen 1 — Welcome**
- Illustration: a magnifying glass over large letters.
- Title: **"Welcome to Word Search"**
- Body: **"Big, clear letters. No timers. Play anytime, even without internet."**
- Button: **"Let's begin"**

**Screen 2 — Text size** (input: text size)
- Title: **"Choose a comfortable letter size"**
- Body: **"Pick the size you can read easily. You can change it later in Settings."**
- Live preview: a 4x4 mini grid ("C A T S / ...") re-rendering at each size.
- Options (large radio cards, 72dp): **Comfortable · Large (recommended) · Extra Large · Huge**
- Default preselected: Large; if the Android system font scale ≥ 1.3, preselect Extra Large.
- Toggle row: **"High-contrast colors"** (off by default).
- Button: **"Continue"** · Link: **"Skip"**

**Screen 3 — Difficulty** (input: difficulty)
- Title: **"How would you like to play?"**
- Cards:
  - **Relaxed** — "Smaller puzzles. Words go across and down." (= Easy)
  - **Classic** — "Words can also go diagonally." (= Medium)
  - **Challenging** — "Bigger puzzles. Words can go in any direction, even backwards." (= Hard)
- Footer: **"Not sure? Start with Relaxed — you can switch anytime."**
- Button: **"Start my first puzzle"**

*(Theme selection is intentionally NOT asked; the first puzzle uses the "Animals" pack — most universally liked — and packs are browsable on Home. This keeps time-to-first-value under 30 s.)*

**Screen 4 — Consent (UMP)**
- Shown only if `@shared/consent` reports consent is required (EEA/UK/CH, US states where applicable). Google's UMP form is displayed as-is. Not shown for most other regions.
- Pre-message is NOT added (UMP form is self-explanatory); it appears after Screen 3 tap and before the first puzzle loads so later ad requests are compliant. Ads are not shown in the first 2 levels anyway.

**Screen 5 — First puzzle (tutorial mode)**
- 6x6 Easy puzzle with 4 words (CAT, DOG, COW, HEN) regardless of chosen difficulty, so success is guaranteed.
- Coach mark overlay on first word: **"Slide your finger across C‑A‑T to find the word. Or tap C, then tap T."** with an animated finger; it disappears on first touch.
- After first found word: toast **"You found it! Find the other 3 words."**
- On completion: Complete modal with **"Wonderful! You're all set."** and button **"Play the next puzzle"** (routes to the user's chosen difficulty, Animals Level 1).
- **First-value moment:** finding "CAT" — target median ≤ 30 s from install launch (Welcome ~5 s, Text size ~8 s, Difficulty ~5 s, grid ~5 s).

**After onboarding (not part of it)**
- **Notification permission** (Android 13+ `POST_NOTIFICATIONS`): asked only after the **first daily puzzle completion** OR the **3rd completed puzzle**, whichever is first, via an in-app pre-prompt (§10). Never on first launch.
- **Skip behavior:** Skip on Screen 2 → Large text + Easy, jumps to Screen 4/5. Killing the app mid-onboarding resumes at the same screen (`ws.onboarding.step`). Onboarding flag set only after the tutorial puzzle completes or user taps "Skip tutorial" (small link on the tutorial screen after 10 s).

Implementation: `@shared/onboarding` provides `useOnboarding({ steps, storageKey: 'ws.onboarding' })` returning `{ step, next, skip, complete }`.

---

## 7. Design system

Built on `@shared/theme` tokens (`createTheme({ palette, typeScale, spacing })`), app overrides in `src/theme/`.

### 7.1 Palette
| Token | Light | Dark | High-contrast |
|---|---|---|---|
| `bg` | `#FBF7EF` (warm cream) | `#121417` | `#000000` |
| `surface` | `#FFFFFF` | `#1E2227` | `#000000` |
| `gridCell` | `#FFFFFF` | `#262B31` | `#000000` |
| `gridBorder` | `#E3DCCD` | `#3A4048` | `#FFFFFF` |
| `textPrimary` | `#1B1B1F` | `#F2F2F2` | `#FFFFFF` |
| `textSecondary` | `#4A4A55` | `#C5C9D0` | `#FFFF00` |
| `primary` | `#1F5FAF` (deep blue) | `#7FB3FF` | `#FFFF00` |
| `onPrimary` | `#FFFFFF` | `#0B1A2E` | `#000000` |
| `success` | `#2E7D32` | `#81C784` | `#00FF00` |
| `warning/hint` | `#B45309` | `#FBBF24` | `#FFA500` |
| `selection` (in-drag) | `#1F5FAF` @ 35% | `#7FB3FF` @ 40% | `#FFFF00` @ 60% |

Found-word highlight rotation (color-blind safe, ≥ 3:1 against cell): `#F4A261`, `#8ECAE6`, `#B5E48C`, `#F7B2BD`, `#CDB4DB`, `#FFD166` (light/dark use same hues at 55% opacity; high-contrast uses solid outline 4dp in `#FFFF00`/`#00FFFF` alternating). All text/background pairs ≥ 7:1 (WCAG AAA) for body text in all themes.

### 7.2 Type scale (font: Atkinson Hyperlegible via `expo-font`, fallback system)
| Role | Comfortable | Large (default) | Extra Large | Huge |
|---|---|---|---|---|
| Grid letter | 22sp | 26sp | 32sp | 38sp |
| Body | 18sp | 20sp | 22sp | 24sp |
| Word list chip | 18sp | 20sp | 24sp | 26sp |
| Button label | 20sp | 20sp | 22sp | 24sp |
| Title | 26sp | 28sp | 30sp | 32sp |
| Display (Complete) | 34sp | 36sp | 38sp | 40sp |
Respect Android font scale with `allowFontScaling` but clamp via `maxFontSizeMultiplier={1.4}` on grid letters (grid size logic already enlarges).

### 7.3 Spacing, shape, touch
- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Screen gutter 16dp (24dp on tablets).
- Radius: cards 16dp, buttons 14dp, grid 12dp, highlight stroke = cell height × 0.8 with round caps.
- **Touch targets ≥ 56dp** for all buttons/rows (primary buttons 64dp). Grid cells ≥ 44dp, with selection snapping so near-misses still register (touch slop = 30% of cell).
- Min 8dp between adjacent tappable controls.

### 7.4 Haptics & sounds
- `expo-haptics`: word found → `notificationAsync(Success)`; puzzle complete → Success + 150 ms later `impactAsync(Medium)`; selection start → `selectionAsync()`. No haptic on invalid selection.
- `expo-audio`: soft chime (word found, ~250 ms), gentle arpeggio (complete). Default ON at 60% volume, respects device silent mode. Toggles in Settings.

### 7.5 Accessibility / TalkBack
- Every grid cell `accessibilityLabel="Row 3, column 5, letter K"`; TalkBack users default to tap-tap mode (auto-switch when `AccessibilityInfo.isScreenReaderEnabled()`).
- Word list announces "Lion, found" / "Tiger, not found". Found words announced via `AccessibilityInfo.announceForAccessibility("Found LION. 5 words left.")`.
- Respect Reduce Motion (`AccessibilityInfo.isReduceMotionEnabled`) → no confetti, instant transitions.
- Never convey state by color alone (strikethrough + check icon on found words).
- Test with Android font scale 2.0 and display size "Largest".

---

## 8. Game logic

### 8.1 Grid size by difficulty and text size
Base sizes: Easy 8, Medium 10, Hard 12. Effective size = `min(base, floor((screenWidthDp - 32) / minCellDp))`, where `minCellDp` = 44 / 50 / 58 / 66 for the four text sizes. Floor of 6. Words count: Easy 6–8, Medium 8–10, Hard 10–14; max word length = grid size.

### 8.2 Directions
| Difficulty | Directions |
|---|---|
| Easy | → right, ↓ down |
| Medium | → ↓ ↘ ↗ |
| Hard | all 8 (adds ← ↑ ↖ ↙) |

### 8.3 Generation algorithm (`src/game/generator.ts`)
1. Seeded PRNG (`mulberry32(seed)`), so any puzzle is reproducible from `{packId, difficulty, level}` or the date.
2. Pick candidate words from pack: filter length `3..size`, uppercase A–Z only (strip spaces/hyphens), shuffle, prefer mix of lengths (≥ 1 word of length ≥ size-2).
3. Sort chosen words by length desc. For each word, try up to 200 random `(row, col, direction)` placements; accept if each cell is empty or already holds the same letter (overlaps allowed and favoured on Medium/Hard by scoring placements by overlap count, pick best of 5 valid).
4. If a word can't be placed, swap it for another candidate; if < min words after 3 restarts, reduce word count by 1 (never below min).
5. Fill empty cells with letters drawn from a weighted English-frequency table **excluding** letters that would form any listed word or a blocklisted word (simple check: after fill, scan all 8 directions for each listed word; occurrences must equal 1; scan profanity list; re-fill offending cells up to 10 times).
6. Output `Puzzle { id, seed, size, grid: string[], words: PlacedWord[] }`. Benchmark target < 50 ms for 12x12 on low-end device; generation runs in an `InteractionManager.runAfterInteractions` task.

### 8.4 Selection gesture
- `react-native-gesture-handler` Pan + Tap on a single grid view (not per-cell components) for performance; rendering via `react-native-svg` or Skia (`@shopify/react-native-skia`) for strokes.
- **Drag:** start cell = cell under finger down. Direction snaps to nearest of the allowed directions (angle quantized to 45°, filtered by difficulty); end cell = projection of finger onto that line. Live highlight follows.
- **Tap-tap:** tap first letter (cell pulses), tap last letter; if they form an allowed straight line, evaluate. Tap same cell again to cancel. Both modes active by default; Settings can lock to "Tap only".
- Evaluate: string from start→end compared to unfound words (also reversed match only if Hard allows backwards — on Easy/Medium the reversed string is not accepted unless direction is allowed).

### 8.5 Hints
- Free hints: 3 per day (resets at local midnight), stored in `ws.hints`. Tutorial puzzle grants 1 bonus.
- Hint action: picks the shortest unfound word, pulses its first letter cell for 3 s with a ring (second hint on the same word also reveals the last letter).
- Out of hints → sheet: "Watch a short video for 2 more hints?" [Watch video] [No thanks]. Rewarded via `showRewarded('hint_refill')`; grant only on `EARNED_REWARD` callback. If ad not loaded: "No video available right now. You'll get 3 free hints tomorrow." plus 1 courtesy hint once per day (keeps no-fill from blocking seniors).

### 8.6 Daily puzzle seeding
- `dateKey = YYYY-MM-DD` in device local time. `seed = hash32('ws-daily-v1:' + dateKey)`. Theme = `DAILY_ROTATION[dayOfYear % rotation.length]`; difficulty = user's preferred difficulty (so seed + difficulty define the puzzle; everyone on same difficulty sees the same puzzle).
- Changing device clock backwards does not award streak days already counted (streak logic uses stored `lastDailyDateKey`, only increments when new key = last + 1 day).

### 8.7 Scoring, stars, streaks
- Stars: 3 = no hints, 2 = 1–2 hints, 1 = 3+ hints. No time component (timer optional, display only).
- Streak: consecutive dateKeys with completed daily puzzle. One free **streak freeze** earned per 7-day streak (max 2 held), auto-applied for one missed day.
- Lifetime counters: words found, puzzles completed per pack, total stars (feed collections in §12).

---

## 9. Local data model

Storage via `@shared/storage` (`createStore('ws')` → MMKV instance id `ws`, AsyncStorage fallback with same API: `get<T>(key)`, `set<T>(key, value)`, `remove(key)`, `useStored<T>(key, default)`). All keys prefixed `ws.` and versioned via `ws.schemaVersion` for migrations.

| Key | Type | Notes |
|---|---|---|
| `ws.schemaVersion` | `number` | starts at 1 |
| `ws.onboarding` | `OnboardingState` | step + done |
| `ws.settings` | `Settings` | |
| `ws.progress.packs` | `Record<PackId, PackProgress>` | |
| `ws.current` | `SavedGame \| null` | autosaved in-progress puzzle |
| `ws.daily` | `DailyState` | |
| `ws.hints` | `HintWallet` | |
| `ws.stats` | `Stats` | |
| `ws.ads` | `AdCounters` | frequency-cap state (may live in `@shared/ads` store) |
| `ws.review` | `ReviewState` | in-app review gating |

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TextSize = 'comfortable' | 'large' | 'xlarge' | 'huge';
export type ThemeMode = 'light' | 'dark' | 'highContrast' | 'system';
export type PackId = string; // 'animals' | 'food' | ...
export type Direction = 'E' | 'S' | 'SE' | 'NE' | 'W' | 'N' | 'NW' | 'SW';

export interface OnboardingState { step: number; done: boolean; completedAt?: number; }

export interface Settings {
  textSize: TextSize; theme: ThemeMode; difficulty: Difficulty;
  selectionMode: 'both' | 'tapOnly'; sounds: boolean; haptics: boolean;
  showTimer: boolean;
  reminder: { enabled: boolean; hour: number; minute: number; notificationId?: string };
}

export interface PlacedWord { word: string; row: number; col: number; dir: Direction; found: boolean; colorIdx?: number; }

export interface Puzzle {
  id: string;               // `${packId}:${difficulty}:${level}` or `daily:${dateKey}:${difficulty}`
  seed: number; size: number; grid: string[]; // rows as strings
  words: PlacedWord[]; packId: PackId; difficulty: Difficulty;
}

export interface SavedGame { puzzle: Puzzle; hintsUsed: number; startedAt: number; elapsedMs: number; hintedCells: [number, number][]; }

export interface PackProgress { easy: LevelTrack; medium: LevelTrack; hard: LevelTrack; }
export interface LevelTrack { currentLevel: number; stars: Record<number, 1 | 2 | 3>; }

export interface DailyState {
  completed: Record<string, { stars: 1 | 2 | 3; at: number }>; // dateKey → result
  streak: number; bestStreak: number; lastDailyDateKey?: string; freezes: number;
}

export interface HintWallet { free: number; bonus: number; resetDateKey: string; courtesyUsedDateKey?: string; }

export interface Stats { puzzlesCompleted: number; wordsFound: number; sessions: number; firstOpenAt: number; foundWords: Record<string, number>; }

export interface AdCounters {
  levelsSinceInterstitial: number; lastInterstitialAt: number; lastAppOpenAt: number;
  sessionIndex: number; levelsThisSession: number;
}

export interface ReviewState { lastPromptAt?: number; promptCount: number; positiveMoments: number; }
```

Write strategy: autosave `ws.current` on every found word and on `AppState` → background. Puzzle state is small (< 2 KB), so MMKV sync writes are fine.

---

## 10. Notifications

- Library: `expo-notifications`, **local scheduled only** (no push token, no FCM server).
- **Opt-in timing:** in-app pre-prompt after first daily puzzle completion or 3rd puzzle completed (whichever first), never on first launch:
  - Title: "Want a reminder for tomorrow's puzzle?"
  - Body: "We'll send one gentle reminder a day. You can turn it off anytime."
  - Time chips: **9:00 AM (default) · 1:00 PM · 7:00 PM · Choose time**
  - Buttons: **"Yes, remind me"** → system `POST_NOTIFICATIONS` request (Android 13+) → schedule; **"Not now"** → ask again at most once, after 7 more days.
- Schedule: `DAILY` trigger at chosen hour/minute; channel `daily-puzzle` (importance DEFAULT, no sound override).
- Copy rotates (no guilt): "Your daily puzzle is ready ☕ — today's theme: Garden", "A new word search is waiting for you."
- Skip today's notification if the daily puzzle is already done (reschedule next one at completion via cancel + one-off trigger for tomorrow, then restore daily trigger).
- Deep link: tapping opens `/play/daily-<dateKey>`.
- Never more than one notification per day; no re-engagement spam in v1.

---

## 11. AdMob placement map

All calls go through `@shared/ads`: `showInterstitial(placement)`, `showRewarded(placement)`, `<AdBanner placement=... />`, plus `useAppOpenAd()` if provided by the shared package. The shared wrapper enforces consent (`@shared/consent` → `canRequestAds`), preloading, and test IDs in dev. App-level caps below are enforced in `src/ads/policy.ts`.

| Format | Placement ID | Where | Trigger | Frequency cap | Never show when |
|---|---|---|---|---|---|
| Adaptive banner (anchored) | `home_banner` | Home tab, bottom above tab bar | Screen mount | Always on Home | During onboarding; first session before level 2 is completed |
| Adaptive banner (anchored) | `packs_banner` | Pack level list + Daily tab | Screen mount | Always on those screens | On Game screen, Complete modal, Settings, Help — **never over or adjacent to the grid** |
| Interstitial | `level_complete` | Between puzzles | After tapping "Next puzzle" on Complete modal | Every **3** completed puzzles AND ≥ **90 s** since last interstitial/app-open; max 6/hour | First session's first 2 levels (tutorial + level 1); daily puzzle completion (protect the streak moment); after a rewarded ad in last 90 s; on back navigation; mid-puzzle |
| Rewarded | `hint_refill` | Out-of-hints sheet | User taps "Watch video" | User-initiated, unlimited (wallet bonus max 10) | Never auto-shown; never without explicit tap |
| Rewarded (v1.1) | `streak_restore` | Daily tab when streak broke yesterday | User taps "Restore streak" | 1 per 7 days | Never auto-shown |
| App open | `app_open` | Warm start only | App returns to foreground after ≥ **4 min** in background | Max 1 per 4 h; ≥ 90 s since any full-screen ad | Cold start; first session; while a puzzle is in progress (resume to grid ad-free); returning from a rewarded/interstitial or notification tap |

Additional rules
- No ads of any kind in the first session until level 2 completes (tutorial + first real level are ad-free).
- Ad loading never blocks UI; if an interstitial isn't ready, skip silently (do not wait).
- Banner placed with ≥ 8dp spacing and divider from the tab bar to avoid accidental clicks (AdMob policy + seniors' tremor).
- Ad content rating: set max ad content rating **G** or **PG** in AdMob (older audience dislikes edgy ads) and block gambling/dating categories in AdMob blocking controls.
- Non-personalized ads served automatically when UMP says so.
- Ad unit IDs per placement stored in `app.config.ts` extras; test IDs via `__DEV__`.

**Mediation (AdMob mediation, bidding first):**
1. AdMob Network (default)
2. Meta Audience Network (bidding)
3. AppLovin (bidding)
4. Unity Ads (bidding)
5. ironSource Ads / Liftoff (Vungle) / Mintegral (add in week 3–4 once DAU > 1k; test via AdMob A/B mediation experiments)
Each adapter added via its Expo config-plugin or `react-native-google-mobile-ads` Gradle mediation dependencies; list each SDK in Data safety and in `app-ads.txt`.

---

## 12. Retention & engagement loops

- **Daily puzzle + streak (core loop):** reminder → daily puzzle → streak + calendar check → tease tomorrow's theme on Complete screen.
- **Infinite pack progression:** each pack shows "Level 14"; every 10 levels in a pack unlocks a pack badge (Bronze/Silver/Gold/...).
- **Collections:** "Word Collection" counts unique words found per pack ("Animals: 87 / 140 words collected"); completing a pack's collection earns a framed badge. Drives variety across packs.
- **Milestones:** 10/50/100/500 puzzles, 7/30/100-day streaks — celebratory modal, no rewards that require ads.
- **Gentle return:** after missing days, Home shows "Welcome back! Here's an easy one to warm up." (Easy puzzle, no shaming).
- **In-app review (`expo-store-review`):** request when ALL true: ≥ 3 sessions, ≥ 5 puzzles completed, just completed a puzzle with 3 stars or a streak milestone, no ad shown in the last 60 s, ≥ 30 days since last prompt, promptCount < 3. Call on Complete modal after the celebration, before any interstitial (skip the interstitial that cycle). Never ask "Do you like the app?" pre-gating (Play policy discourages review gating).
- **Feedback channel:** Settings → "Send feedback" opens email with app version and device prefilled (catch issues before 1-star reviews).

---

## 13. Tech stack & libraries

All versions: "latest compatible with the current Expo SDK" — install with `npx expo install <pkg>` so Expo pins compatible versions.

| Concern | Library |
|---|---|
| Framework | Expo SDK (latest), React Native (bundled), TypeScript (strict) |
| Navigation | `expo-router` (file-based, typed routes) |
| Storage | `react-native-mmkv` (via `@shared/storage`), `@react-native-async-storage/async-storage` fallback |
| Ads | `react-native-google-mobile-ads` (via `@shared/ads`) + mediation adapters |
| Consent | UMP from `react-native-google-mobile-ads` (`AdsConsent`) via `@shared/consent` |
| Gestures / animation | `react-native-gesture-handler`, `react-native-reanimated` |
| Grid rendering | `@shopify/react-native-skia` (preferred) or `react-native-svg` |
| Haptics / audio | `expo-haptics`, `expo-audio` |
| Notifications | `expo-notifications` |
| Review | `expo-store-review` |
| Fonts | `expo-font` + Atkinson Hyperlegible (OFL) |
| Splash / icon | `expo-splash-screen`, adaptive icon in `app.config.ts` |
| Build | EAS Build (development, preview, production profiles); **dev client required** (`expo-dev-client`) — Expo Go cannot load AdMob |
| Testing | Jest + `@testing-library/react-native`; generator unit tests; Maestro for E2E smoke |
| Lint | ESLint (expo config), Prettier |
| Crash reporting (optional) | `@sentry/react-native` with PII off — or skip and rely on Play Console vitals |

---

## 14. Folder structure

```
apps/word-search/
├─ app/                          # Expo Router routes (see §4)
├─ assets/
│  ├─ fonts/AtkinsonHyperlegible-*.ttf
│  ├─ sounds/{found,complete}.mp3
│  ├─ images/{icon,adaptive-fg,splash,onboarding}.png
│  └─ wordlists/{animals,food,travel,...}.json   # { id, name, icon, words: string[], defs?: Record<string,string> }
├─ src/
│  ├─ game/
│  │  ├─ generator.ts            # placement + fill (§8.3)
│  │  ├─ prng.ts                 # mulberry32, hash32
│  │  ├─ selection.ts            # direction snap, cell projection
│  │  ├─ scoring.ts              # stars, streaks
│  │  ├─ daily.ts                # dateKey, seed, rotation
│  │  └─ __tests__/
│  ├─ components/{Grid,WordList,HintButton,PackCard,StarRow,StreakChip,BigButton}.tsx
│  ├─ features/{onboarding,daily,packs,settings,review}/
│  ├─ ads/policy.ts              # frequency caps on top of @shared/ads
│  ├─ notifications/reminder.ts
│  ├─ storage/keys.ts            # ws.* keys + migrations
│  ├─ theme/{palette,typeScale}.ts  # overrides for @shared/theme
│  └─ analytics/events.ts
├─ app.config.ts                 # package, AdMob app ID, plugins, versionCode
├─ eas.json
├─ package.json
├─ tsconfig.json                 # paths: @shared/* → ../../packages/shared/*
├─ DEVELOPMENT_PLAN.md
└─ ASO.md
```

---

## 15. Analytics & KPIs

**Analytics (privacy-light, optional).** Default plan: no third-party analytics SDK in v1.0; rely on Play Console (installs, retention, vitals) + AdMob reports. If needed in v1.1, add Firebase Analytics with ad-ID collection disabled, no user properties beyond difficulty/textSize, and declare it in Data safety. Event list (if enabled): `onboarding_step`, `onboarding_complete`, `tutorial_time_to_first_word`, `puzzle_start`, `puzzle_complete {pack, difficulty, hints, stars}`, `daily_complete {streak}`, `hint_used`, `rewarded_offer_shown/accepted/earned`, `interstitial_shown`, `reminder_opt_in`, `text_size_changed`.

**KPI targets (first 60 days)**
| KPI | Target | Notes |
|---|---|---|
| Onboarding completion | ≥ 85% | Drop-off by step |
| Time to first found word | median ≤ 30 s | |
| D1 retention | ≥ 40% | casual puzzle benchmark ~30–35% |
| D7 retention | ≥ 18% | daily puzzle + reminders |
| D30 retention | ≥ 8% | older audiences are loyal |
| Puzzles per DAU | ≥ 4 | |
| Reminder opt-in | ≥ 35% of asked | |
| Rewarded opt-in | ≥ 20% of offers | |
| ARPDAU (US) | $0.05–0.08 | interstitial-led, Tier-1 eCPM $10–20 |
| ARPDAU (blended) | ≥ $0.03 | |
| Crash-free users | ≥ 99.5% | Play vitals |
| Store rating | ≥ 4.5 | |

---

## 16. Milestones checklist (MVP in ~9 days)

- [x] **Day 1 — Setup:** scaffold app in monorepo, Expo Router, TS paths to `@shared/*`, `app.config.ts`, EAS dev build profile, ~~install dev client on a physical Android phone~~ *(needs a device and an EAS account: not done, nothing has been run on a device)*; theme tokens + fonts *(Atkinson Hyperlegible via `@expo-google-fonts`; checked in jest and `expo export`, not seen on a device)*.
- [x] **Day 2 — Generator:** PRNG, placement, fill, uniqueness scan, profanity filter; unit tests (1,000 seeds × 3 difficulties, assert all words placed exactly once); 12 word list JSON files *(12 packs of 130–145 words each; speed measured only on this CI machine, not on a Moto G)*.
- [x] **Day 3 — Grid UI:** ~~Skia grid~~ *(react-native-svg strokes under view-drawn letters instead of Skia, which the plan allows; letters are plain views so fonts and TalkBack work)*, sizing logic, drag selection with direction snap, tap-tap mode, highlights, word list *(gestures are driven by fakes in jest; how the drag feels on a phone, the stroke animation and the TalkBack cell buttons are untested on a device)*.
- [x] **Day 4 — Game loop:** autosave/resume, complete modal, stars, pack progression, Home + pack list screens *(kill-and-resume is tested by rebuilding the stores from the fake disk, not by killing a real process; the Home banner and the interstitial slot after "Next puzzle" arrive with milestone 7, the daily card and streak chip with milestone 5)*.
- [x] **Day 5 — Daily + hints:** daily seeding, calendar, streaks/freezes, hint system, settings screen (text size, themes, modes) *(daily puzzles are the same for everyone on the same difficulty and grid size, because the grid size depends on screen width and text size; the text-size control is four radio cards with a live sample grid rather than a slider; the settings rows for sounds, reminder, privacy options, rate and feedback come with milestones 7 and 8; the rewarded-video path is only tested against "no video", real rewarded ads need a device)*.
- [ ] **Day 6 — Onboarding + a11y:** onboarding screens and tutorial puzzle, TalkBack labels, reduce motion, font-scale tests.
- [ ] **Day 7 — Ads + consent:** `@shared/consent` UMP flow, banners, interstitial policy, rewarded hints, app-open warm-start; test IDs; verify caps with a debug overlay.
- [ ] **Day 8 — Notifications, review, polish:** reminder pre-prompt + scheduling, in-app review gating, sounds/haptics, icon + splash, privacy policy page.
- [ ] **Day 9 — Release prep:** production EAS build (AAB), internal testing track, store listing from ASO.md, screenshots, Data safety, content rating; closed testing (12 testers × 14 days if the developer account requires it).
- [ ] **Day 10 (buffer):** bug bash on 3 devices (low-end Android 10, mid Android 13, tablet), fix, promote.

---

## 17. QA & Play release checklist

**Functional QA**
- [ ] 10,000-seed generator fuzz: no failures, no duplicate occurrences, generation < 50 ms p95.
- [ ] Every pack × difficulty × text size renders without overflow on 360dp-wide screen and with font scale 2.0.
- [ ] Drag and tap-tap work; backwards words rejected on Easy/Medium.
- [ ] Kill app mid-puzzle → resume exactly; date change at midnight while in app handled.
- [ ] Airplane mode: whole app usable; ad slots collapse cleanly (no blank boxes).
- [ ] Ad caps: no ads during first 2 levels, never on Game screen, interstitial spacing ≥ 90 s, app-open only on warm start.
- [ ] UMP: tested with EEA debug geography; Privacy options button re-opens form.
- [ ] Notifications: permission denied path, time change, reboot persistence.
- [ ] TalkBack full playthrough in tap mode.

**Play Console**
- [ ] **Target audience & content:** age groups **18+** only (also 45+ marketing); "Not designed for children"; not in Families program. Avoid child-appealing artwork.
- [ ] **Content rating (IARC):** Puzzle/Word game; no violence, no user interaction/chat, no gambling → expected **Everyone / PEGI 3**. Answer "Yes" to "contains ads".
- [ ] **Ads declaration:** Contains ads = Yes.
- [ ] **Data safety form:**
  - Data collected: **Device or other IDs** (advertising ID, by AdMob and mediation SDKs) — purpose: Advertising/marketing, Analytics, Fraud prevention; shared with third parties: Yes (ad networks).
  - **App activity / App info & performance** (crash logs, diagnostics) — collected by Google Mobile Ads SDK; purpose: Analytics.
  - **Approximate location** — derived from IP by ad SDKs: declare per Google's AdMob Data safety guidance.
  - Data encrypted in transit: Yes. Users can request deletion: game progress is local only (uninstall/"Reset progress" deletes it); no account.
  - No personal info, no contacts, no photos, no precise location, no account creation.
- [ ] **Privacy policy URL** (required because of ads/advertising ID): hosted page (e.g. GitHub Pages under portfolio domain) listing AdMob + each mediation partner, local-only storage, contact email.
- [ ] **app-ads.txt** on developer website root (domain set in Play listing): `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` plus mediation partner lines.
- [ ] `AD_ID` permission present (AdMob plugin adds it); `POST_NOTIFICATIONS` declared; no unused permissions.
- [ ] Target API level = current Play requirement; 16 KB page-size compatible build.
- [ ] Store listing from ASO.md; screenshots 1080×1920; feature graphic 1024×500; icon 512×512.
- [ ] Internal → closed → production staged rollout (20% → 50% → 100%) while watching ANR/crash rates.
