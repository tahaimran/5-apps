# Contraction Timer & Kick Count — Development Plan

> Store name: **Contraction Timer & Kick Count** (30/30 chars). In-app name: **Contraction Timer**.
> Package: `com.<studio>.contractiontimer`. Platform: Google Play only (Android 8.0+ / API 26+).
> Stack: Expo (latest SDK) + Expo Router + TypeScript, EAS dev build. No backend, no auth, no server DB.
> Monetization: AdMob only (`react-native-google-mobile-ads` via `@shared/ads`) + UMP consent (`@shared/consent`).
> Companion doc: [`ASO.md`](./ASO.md).

---

## 1. Concept & positioning

**One line:** The calmest way to time contractions — one giant button, honest numbers, and a ready-to-send summary for your midwife. Plus a kick counter and due-date tools, all offline, all on your phone.

**Problem.** In the third trimester, and especially in early labor, people want three things: *Is this the real thing? When do I call? What do I tell them?* Existing timers (wachanga, com.neiman.contractions, Full Term) are functional but stop at raw numbers; they don't interpret the pattern against the rule the provider gave, and sharing is clunky. All-in-one pregnancy apps (Pregnancy+, What to Expect, BabyCenter) are bloated, need accounts and bury the timer.

**Positioning.** "Fast, calm, offline labor tool." We don't compete on content volume. We compete on:
1. **Speed to value** — app opens on the big Timer button; first contraction timed in < 5 s from install-complete onboarding.
2. **Pattern awareness** — configurable 5-1-1 / 4-1-1 / 3-1-1 rule, framed strictly as "this matches what your provider asked you to watch for — consider calling them".
3. **Provider handoff** — one-tap text/PDF summary (generated locally with `expo-print`, shared with `expo-sharing`).
4. **3am-proof UX** — red-shifted night mode, ≥120dp button, haptics, one-handed, screen awake, partner big-text mode.
5. **Privacy** — health data never leaves the device. No account. Stated loudly in listing and Data safety.

**What we are NOT:** a medical device, a diagnostic tool, a symptom checker, a fertility/ovulation app, or a content-heavy pregnancy magazine. No claims of predicting labor.

**Lifecycle reality:** users arrive ~weeks 28–40, churn naturally at birth (~3–4 months). We design for high per-user value in that window and a postpartum handoff to a v2 newborn log (see §13).

---

## 2. Personas

### Priya, 31 — first-time mom, week 37 (primary)
- Software tester in Austin, TX. Downloaded 3 timers at week 36 "just in case", kept none open.
- Her OB said "come in when they're 5-1-1". She's unsure what that means in practice.
- Anxious at night, phone in one hand, the other on her belly. Hates ads that jump in her face.
- **Needs:** one obvious button, the rule explained in plain words, a summary she can read aloud on the phone to L&D triage.
- **Success moment:** at 2:40am the app shows "Your last hour matches 5-1-1" and she taps *Share summary* to text her doula.

### Marcus, 34 — partner, Priya's husband (partner persona)
- Will be the one holding the phone during active labor. Not a "pregnancy app" person; never opened one.
- Wants big text, zero setup, no login. Will be driving or carrying bags.
- **Needs:** Partner mode with huge digits, "she says it started" tap, readable stats from arm's length, ability to read the summary to the nurse.
- **Success moment:** he times 14 contractions without asking "which button?", then reads "avg 58s, every 4m 50s" to the hospital.

### Ana, 27 — second baby, week 30, São Paulo (global / kick-count persona)
- Midwife-led care; was asked to do daily kick counts after week 28. Uses Portuguese locale.
- Experienced; doesn't need hand-holding, wants a quick log and reminder at 20:00 after dinner.
- **Needs:** count-to-10 with time taken, history to show at check-ups, a gentle daily reminder, due date via LMP.
- **Success moment:** 10 kicks in 14 minutes, history shows her usual 12–20 min range — she feels reassured and later rates 5★.

---

## 3. Features by release

### MVP v1.0 (launch)
| # | Feature | Acceptance criteria |
|---|---|---|
| F1 | **Contraction timer** — giant start/stop button | Tap toggles state ≤ 100ms visual feedback + haptic; button ≥ 120dp (default 220dp); duration counts up live (1 s resolution); interval = start-to-start of previous contraction; frequency shown as "every Xm Ys". |
| F2 | Intensity tag | After stop, inline chips Mild / Moderate / Strong appear for 8 s; optional; editable later in history. Never blocks next start. |
| F3 | Kill-safe timing | Active contraction & session persist `startedAt` epoch ms to MMKV synchronously on tap; on cold start, UI resumes from wall clock. Killing the app mid-contraction and reopening 3 min later shows ~3:00 elapsed (±1 s). |
| F4 | Live stats | Last-hour avg duration, avg interval, count; last-contraction card. Recomputed every second while visible. |
| F5 | Pattern alert (5-1-1 / 4-1-1 / 3-1-1 / custom) | Default 5-1-1, configurable; fires an in-app calm banner (not modal) once per match-episode; copy always says "talk to your provider"; can be disabled; vibration optional. |
| F6 | Keep awake | `expo-keep-awake` active while a session is active and Timer screen focused; released otherwise. |
| F7 | Session history | List of sessions (date, count, avg duration/interval, max intensity); detail view with per-contraction rows; delete/edit/merge rows; undo for 5 s on delete. |
| F8 | Share summary (text) | Share sheet with plain-text summary (§11) via `expo-sharing`/RN `Share`. Works offline. |
| F9 | Share summary (PDF) | `expo-print` → local PDF → `expo-sharing`. Default theme free; extra themes rewarded (§12). |
| F10 | Kick counter | Start session → tap counts → auto-completes at 10 (target configurable 10/…); shows time taken; history list; 2-hour soft cap with message "Haven't reached 10 in 2 hours? Contact your provider." |
| F11 | Due date calculator | LMP (+ cycle length), conception date, IVF transfer (day 3 / day 5); shows EDD, current week+day, trimester, days to go. |
| F12 | Week-by-week cards | Bundled static JSON weeks 4–42: baby size comparison, length/weight approx, 3 bullet notes, "ask your provider" tip. Current week pinned. |
| F13 | Hospital bag checklist | Prefilled 3 groups (Mom / Partner / Baby); check, add, delete, reorder; progress %. |
| F14 | Birth plan checklist | Prefilled preferences (pain relief, environment, cord clamping, feeding…); export as text along with summary. |
| F15 | Partner mode | Toggle in Timer header and More; scales type ×1.4, hides secondary UI, shows "Tell me when it starts" label. |
| F16 | Night mode | Auto (system dark), Night (red-shifted), Light. Night mode 1-tap from Timer header. |
| F17 | Onboarding | §6 flow, skippable, < 60 s. |
| F18 | Kick reminder | Optional daily local notification; permission requested only when enabled. |
| F19 | Disclaimer & legal | First-run acknowledgement; persistent "Not medical advice" link in More and in every export footer. |
| F20 | Ads + consent | UMP via `@shared/consent` before any ad request; placements per §12. |

### v1.1 (week 3–5 post-launch)
- **Ongoing foreground notification while timing** (Android notification with elapsed time + Start/Stop actions via `expo-notifications` category actions; elapsed computed from `startedAt`). AC: stop from shade updates the session within 1 s of reopen.
- Home-screen widget-like quick action (app shortcut "Start contraction").
- Water-break / "mucus plug" / notes events on the session timeline.
- Contraction chart (duration bars + interval line over the session).
- Localization wave 1 (es, pt-BR, de, fr, id, hi).
- Hydration & weight quick logs (keywords "pregnancy hydration reminder", "pregnancy weight tracker").

### v2.0 (month 3+)
- **Postpartum handoff**: "Baby is here!" flow → archive pregnancy data, open newborn log (feeds, diapers, sleep) — either in-app module or spin-off app targeting "baby tracker" (47/72).
- Multi-pregnancy archive; backup/restore to a local file (still no server).
- Wear OS tile for start/stop.
- Optional on-device "birth story" export bundling timeline + notes.

---

## 4. Information architecture & navigation

```
Root Stack (Expo Router)
├── (onboarding)/ welcome → disclaimer → how-far → first-time → needs → done
├── (tabs)/
│   ├── timer/         Tab 1 "Timer"        (index = big button)
│   │   ├── history          session list
│   │   └── session/[id]     session detail + share
│   ├── kicks/         Tab 2 "Kicks"
│   │   └── history
│   ├── pregnancy/     Tab 3 "My Pregnancy"
│   │   ├── week/[n]         week-by-week article
│   │   ├── due-date         calculator
│   │   ├── hospital-bag
│   │   └── birth-plan
│   └── more/          Tab 4 "More"
│       ├── settings (alert rule, theme, partner mode, units, reminders)
│       ├── privacy-and-ads (consent re-open via @shared/consent)
│       ├── disclaimer
│       └── about / rate / feedback (mailto)
└── modals: share-summary, pdf-theme-picker, alert-rule-editor
```

- Bottom tabs: **Timer · Kicks · My Pregnancy · More**. App always opens on Timer (unless onboarding chose "Kicks" as main need → Kicks first on day 1 only).
- Tab bar is hidden in Partner mode while a contraction is running (avoid mis-taps); a single "Exit partner mode" chip remains.
- Deep links: `contractiontimer://timer`, `…/kicks` (used by notification taps & app shortcut).

---

## 5. Screen-by-screen UI spec

### 5.1 Timer (Tab 1)
Layout top→bottom: header (night-mode toggle, partner toggle, history icon) · status line · giant button (centered, lower-middle third for thumb reach) · stats strip · last contraction card · pattern banner slot. **No ads on this screen. Ever.**

| State | Button | Copy | Other |
|---|---|---|---|
| Idle, no session | Teal circle 220dp, "Start" | "Tap when a contraction begins" | Stats hidden; link "How this works" |
| Contracting | Coral, pulsing ring (reduce-motion: static), "Stop" + big mm:ss | "Contraction in progress" | Haptic heavy on start; keep-awake on |
| Resting (session active, between contractions) | Teal "Start" | "Resting · 3:12 since last started" | Stats strip live; intensity chips 8 s after stop |
| Pattern matched | unchanged | Banner (soft amber, non-modal): "Your last hour matches the 5-1-1 pattern your provider mentioned. It may be time to call them." [Share summary] [Dismiss] | Shown once per episode; re-arms after 30 min without match |
| Long contraction (> 3 min running) | unchanged | Inline: "Still going? Tap Stop when it eases. If something feels wrong, call your provider." | Guards forgotten stop |
| Session idle > 2 h | — | "Looks like things calmed down. End this session?" [End] [Keep] | Auto-end after 6 h idle |
| Restored after kill | Same as before kill | Toast: "Timing restored" | Elapsed computed from wall clock |
| Clock change detected | — | If `Date.now()` < last saved timestamp → toast "Phone clock changed — times may be off" | Uses monotonic delta when app alive |

Long-press button (600ms) = "Undo last tap" sheet. Stats strip items are each tappable for an explanation sheet.

### 5.2 History & session detail
- List: date, start–end time, count, avg dur, avg interval, banner icon if pattern matched. **Banner ad at bottom** (§12).
- Detail: per-contraction rows (start time, duration, interval, intensity), edit/delete row, add missed contraction manually, "Share summary" (text/PDF), "Delete session".
- Empty state: "No sessions yet. When the time comes, everything you time will be saved here — only on this phone."

### 5.3 Kicks (Tab 2)
- Idle: big counter button (180dp) "Start counting"; reminder chip "Daily reminder: Off".
- Counting: number large (96sp), "Tap for each movement", timer since start, Undo, End. Haptic light per tap.
- Complete (10 reached): "10 movements in 14 min. Nicely done." [Save] → rating hook eligible (ASO.md).
- 2 h without reaching target: calm card "It's been 2 hours. If you've noticed fewer movements than usual, contact your provider today." (never alarmist, never "something is wrong").
- History list with sparkline of time-to-10; banner at bottom.

### 5.4 My Pregnancy (Tab 3)
- Header card: "Week 34 + 2 · 40 days to go · Baby is about the size of a cantaloupe".
- Rows: Due date calculator, Week-by-week (list with **native ad card after the 3rd item**), Hospital bag (progress), Birth plan (progress).
- No due date set: "Add your due date to see your week" CTA.
- Week article: illustration, size comparison, length/weight approx, 3 bullets, "Questions for your next appointment", disclaimer footer. Back = interstitial-eligible (§12).

### 5.5 More (Tab 4)
Settings (alert rule editor, theme, partner mode, kick target, reminder time, 12/24h), Privacy & ads (re-open UMP form, ad explanation), Medical disclaimer, Rate, Feedback, About, Delete all data (double confirm).

### 5.6 Background / resume behavior
- Source of truth = persisted epoch timestamps (`startedAt`, `endedAt`) written synchronously to MMKV on each tap.
- Display = `now - startedAt`, ticking via a 250ms interval only while screen focused (`useFocusEffect`) and AppState active; no background JS timers.
- On `AppState → active` and cold start: rehydrate store, recompute, run pattern evaluation once.
- v1.1 ongoing notification uses Android chronometer (`when` = startedAt) so the shade ticks without JS.

---

## 6. Onboarding (exact copy)

Principles: calm, warm, 5 short screens max, **"Skip" top-right on every screen** (Skip jumps straight to Timer with safe defaults, but disclaimer still shown once as a non-blocking sheet on first Timer visit). Uses `@shared/onboarding` (`<OnboardingFlow steps=[…] onComplete />`, persisted `onboarding.completed`).

**Screen 1 — Welcome**
- Illustration: soft moon over a curved horizon.
- Title: "Hi there. Let's keep this simple."
- Body: "Time contractions with one big button, count your baby's kicks, and keep a clear summary ready for your midwife or doctor. Everything stays on this phone."
- CTA: "Get started" · Secondary: "Skip"

**Screen 2 — Disclaimer acknowledgement**
- Title: "A quick, important note"
- Body: "This app helps you keep track. It isn't a medical device and doesn't give medical advice. Your midwife, doctor or hospital always knows best. If you're worried — about pain, bleeding, your waters, or your baby moving less — call them or emergency services right away."
- Checkbox (required for CTA): "I understand"
- CTA: "Continue"
- Stored: `disclaimer.ackAt` (epoch). Skip on this screen = acknowledgement sheet later on Timer.

**Screen 3 — "How far along are you?"**
- Title: "How far along are you?"
- Segmented: "I know my due date" / "First day of my last period" / "Conception or IVF date"
- Date picker for the chosen mode (IVF: + "Day 3 / Day 5 transfer").
- Live result: "You're about 36 weeks and 4 days. Due around 12 November."
- Secondary: "I'll add this later"

**Screen 4 — First-time parent?**
- Title: "Is this your first baby?"
- Options (cards): "Yes, my first" / "I've done this before" / "I'm the partner"
- Effect: first → enables "How this works" tips on Timer; experienced → tips off; partner → Partner mode on by default, copy switches to "she/they" neutral: "Tap when the contraction begins."
- Footer: "This only changes tips. You can change it anytime."

**Screen 5 — What do you need right now?**
- Title: "What would help most right now?"
- Multi-select: "Timing contractions" · "Counting kicks" · "Following my pregnancy week by week"
- If "Counting kicks" selected → inline toggle: "Remind me to count kicks every day at [8:00 PM]". **Only when toggled on** do we call notification permission (Android 13+ `POST_NOTIFICATIONS`). Denied → "No problem. You can turn reminders on later in More."
- CTA: "All set"

**Consent (UMP) placement:** after Screen 5 CTA, before landing on Timer, call `await requestConsentIfNeeded()` from `@shared/consent` (shows Google UMP form only in EEA/UK/CH or where required; elsewhere no-op). Never shown before disclaimer, never mid-session. If the user hits Skip on screen 1, consent runs on first navigation away from Timer (not on top of the button).

**Landing — first-value moment:** route to `/timer` with a one-time coach mark around the button: "When a contraction starts, tap here. That's it." (dismiss on any tap; the tap itself starts timing if they want). If "Counting kicks" was the only need → land on Kicks with "Tap Start whenever you're ready to count."

Analytics-free: we log only local counters (`stats.onboardingCompletedAt`, chosen needs) for in-app logic; Firebase Analytics optional and disclosed (see §16).

---

## 7. Design system (`@shared/theme` extension)

Register app tokens via `createTheme({ ... })` from `@shared/theme`.

### Palette
| Token | Light | Dark | Night (red-shifted, 3am) |
|---|---|---|---|
| `bg` | `#FBF7F4` (warm cream) | `#141519` | `#000000` |
| `surface` | `#FFFFFF` | `#1E2026` | `#120404` |
| `textPrimary` | `#2B2D42` | `#ECEDF2` | `#FF6B5A` |
| `textSecondary` | `#6B6F80` | `#A3A7B7` | `#B3473D` |
| `primary` (Start) | `#3E9C95` (sea teal) | `#5BBFB7` | `#8C1E14` |
| `active` (Stop/contracting) | `#E07A5F` (soft coral) | `#F09A82` | `#D2321F` |
| `accent` (lavender) | `#9B8EC4` | `#B5AAE0` | `#5A1810` |
| `alertSoft` (pattern banner) | `#F2C46D` bg / `#5C4300` text | `#4A3A12` / `#F7D893` | `#3A0A05` / `#FF6B5A` |
| `success` | `#6BAA75` | `#86C590` | `#7A1A10` |
| `divider` | `#ECE4DE` | `#2C2F38` | `#2A0804` |

Night mode: no blue/green channel above ~30%, pure-black background (OLED), max brightness guidance "Lower your screen brightness too". Contrast still ≥ 4.5:1 for body text (`#FF6B5A` on `#000` ≈ 7:1).

### Type scale (sp; Partner mode ×1.4, capped by system font scale ≤ 2.0)
`display 72/80` (timer digits, tabular-nums) · `h1 32/40` · `h2 24/32` · `h3 20/28` · `body 18/26` (larger than usual default) · `label 16/22` · `caption 14/20`. Font: system (Roboto) or Nunito via expo-font for softness; digits use `fontVariant: ['tabular-nums']`.

### Shape, spacing, motion
- Spacing 4-pt grid; screen gutter 20dp. Radius: cards 20, chips 999.
- **Timer button ≥ 120dp minimum, default 220dp, hit slop +24dp**; Kick button 180dp. All other targets ≥ 48dp.
- Haptics (`expo-haptics`): start = `ImpactFeedbackStyle.Heavy`, stop = `Medium` ×2, kick tap = `Light`, pattern banner = `NotificationFeedbackType.Warning` (optional). Haptics toggle in settings.
- Motion: breathing ring 4 s ease-in-out while contracting (doubles as a breathing guide); respects `AccessibilityInfo.isReduceMotionEnabled`.

### Accessibility
- TalkBack labels: button announces "Start contraction" / "Stop contraction, 42 seconds"; live region announces stats every contraction stop (not every second).
- Dynamic type supported; layouts tested at 200% font scale.
- Color is never the only signal (button label text + icon change).
- One-handed: primary actions in bottom 60% of screen.

---

## 8. Core logic

All pure functions in `src/logic/` with unit tests (Jest).

### 8.1 Contraction stats
```ts
duration(c)  = c.endedAt - c.startedAt                    // ms
interval(c_i) = c_i.startedAt - c_{i-1}.startedAt          // start-to-start (clinical convention)
window = contractions where startedAt >= now - 60 min and endedAt != null
avgDuration = mean(duration) over window
avgInterval = mean(interval) over consecutive pairs inside window
```
Outlier hygiene: ignore contractions < 10 s (likely mis-tap; shown greyed, user can restore) and intervals > 30 min when computing averages.

### 8.2 Pattern detection (configurable rule)
```ts
type PatternRule = { intervalMaxMin: number; durationMinSec: number; sustainMin: number };
// presets: 5-1-1 {5,60,60}  4-1-1 {4,60,60}  3-1-1 {3,60,60}; custom ranges 2–10 / 30–90 / 30–120
matches(rule, contractions, now):
  W = completed contractions with startedAt >= now - rule.sustainMin
  require span(W) >= 0.9 * rule.sustainMin   // first start ≥ ~54 min ago for 60
  require |W| >= ceil(rule.sustainMin / rule.intervalMaxMin) - 1   // e.g. ≥ 11 for 5-1-1
  require avgInterval(W) <= rule.intervalMaxMin*60s  AND ≥ 80% of intervals <= max+30s
  require avgDuration(W) >= rule.durationMinSec AND ≥ 80% durations >= min-10s
```
Episode logic: when `matches` flips false→true, set `session.patternMatchedAt` and show banner once; re-arm after 30 min of no-match. Copy never says "you are in labor".

### 8.3 Kick session rules
- Target default 10 (configurable 5–20). Count tap debounce 1 s (multiple flutters = 1 movement guidance in tips).
- `timeToTarget = targetReachedAt - startedAt`. Session soft limit 2 h → calm provider message; hard auto-close at 3 h.
- Persist each tap timestamp (supports undo and history detail).

### 8.4 Due-date math
- **LMP (Naegele's rule, adjusted):** `EDD = LMP + 280 days + (cycleLength - 28) days` (cycle 21–45, default 28).
- **Conception date:** `EDD = conception + 266 days`.
- **IVF transfer:** `EDD = transfer + 266 - embryoAgeDays` (day 3 → +263, day 5 → +261).
- **Known due date:** used as-is; derived `LMP_equiv = EDD - 280`.
- **Gestational age:** `days = floor((today - LMP_equiv) / 1 day)` in local calendar days (use date-only math with `date-fns` `differenceInCalendarDays` to avoid DST bugs); `week = floor(days/7)`, `day = days % 7`; trimester: 1 (<14w), 2 (14w–27w6d), 3 (≥28w). Clamp display 0–44 weeks; > 42w shows "Past your due date — your provider will guide next steps."
- Validation: LMP not in future and not > 44 weeks ago; EDD within −4…+42 weeks from today.

---

## 9. Local data model

Storage via `@shared/storage` (MMKV wrapper: `createStore(namespace)`, `getJSON/setJSON`, `useStoredState`). Namespace `ct`. Schema version key for migrations.

| Key | Type | Notes |
|---|---|---|
| `ct.schemaVersion` | `number` | starts at 1 |
| `ct.profile` | `Profile` | due date, mode, first-time, needs |
| `ct.settings` | `Settings` | rule, theme, partner, haptics, reminders |
| `ct.activeSession` | `ContractionSession \| null` | written on every tap (sync) |
| `ct.sessions.index` | `string[]` | ids, newest first |
| `ct.session.<id>` | `ContractionSession` | archived sessions |
| `ct.activeKick` | `KickSession \| null` | |
| `ct.kicks` | `KickSession[]` | capped 365 |
| `ct.checklists` | `Record<ChecklistId, Checklist>` | hospital bag, birth plan, unlocked templates |
| `ct.unlocks` | `Unlocks` | rewarded grants |
| `ct.adState` | `AdState` | last interstitial/app-open ts |
| `ct.meta` | `Meta` | onboarding, disclaimer ack, rating prompts |

```ts
type ID = string; // nanoid
type Intensity = 'mild' | 'moderate' | 'strong';

interface Contraction { id: ID; startedAt: number; endedAt: number | null; intensity?: Intensity; note?: string; ignored?: boolean }
interface ContractionSession {
  id: ID; startedAt: number; endedAt: number | null;
  contractions: Contraction[];
  ruleAtStart: PatternRule; patternMatchedAt?: number; lastActivityAt: number;
}
interface PatternRule { preset: '511' | '411' | '311' | 'custom'; intervalMaxMin: number; durationMinSec: number; sustainMin: number }

interface KickSession { id: ID; startedAt: number; endedAt: number | null; taps: number[]; target: number; targetReachedAt?: number }

type DateMode = 'edd' | 'lmp' | 'conception' | 'ivf';
interface Profile {
  dateMode?: DateMode; inputDate?: string /* YYYY-MM-DD */; cycleLength?: number; ivfEmbryoDay?: 3 | 5;
  edd?: string; firstBaby?: 'yes' | 'no' | 'partner'; needs: ('timer' | 'kicks' | 'tracking')[];
}
interface Settings {
  rule: PatternRule; patternAlerts: boolean; theme: 'system' | 'light' | 'dark' | 'night';
  partnerMode: boolean; haptics: boolean; clock24h: boolean;
  kickTarget: number; kickReminder: { enabled: boolean; hour: number; minute: number; notificationId?: string };
  weeklyCardNotif: boolean; ongoingNotif: boolean /* v1.1 */;
}
interface ChecklistItem { id: ID; label: string; checked: boolean; group: string; custom?: boolean }
interface Checklist { id: 'hospitalBag' | 'birthPlan' | string; items: ChecklistItem[]; updatedAt: number }
interface Unlocks { pdfThemes: string[]; checklistTemplates: string[] }
interface AdState { lastInterstitialAt?: number; lastAppOpenAt?: number; interstitialsToday: number; day: string }
interface Meta { onboardingCompletedAt?: number; disclaimerAckAt?: number; ratingPromptedAt?: number; positiveMoments: number; installAt: number }
```
Derived selector `isSessionActiveOrRecent(now)` = `activeSession != null || (lastSessionEndedAt && now - lastSessionEndedAt < 30 min)` — consumed by ad gating.

Content (not in storage): `assets/content/weeks.<locale>.json` (`{ week, sizeEn, emoji?, lengthCm, weightG, bullets[], askProvider }`), `checklists.<locale>.json`.

---

## 10. Notifications (`expo-notifications`, local only)

| Notification | Default | Trigger | Copy |
|---|---|---|---|
| Kick-count reminder | Off; enabled in onboarding/Kicks | Daily at chosen time (`DailyTriggerInput`) | "Time for your kick count? Find a comfy spot and tap Start." |
| Weekly size card | On after due date set (opt-out in More) | Weekly, start of each pregnancy week at 10:00 local | "Week 35: baby is about the size of a honeydew melon 🍈" |
| Ongoing timing (v1.1) | Off (setting) | While session active | Title "Contraction session · 7 timed" · chronometer · actions [Start] [Stop] |
| Session left open | — | Session idle 2 h (scheduled on each stop, cancelled on next tap) | "Still timing? Your session is open. Tap to review or end it." |

Rules: permission requested **only** when the user turns on a reminder (Android 13+). Channel ids: `kick-reminder` (default importance), `weekly` (low), `timing` (low, ongoing, no sound). Notifications stop automatically after EDD + 21 days (postpartum handoff card instead). No notification ever says "labor" in a predictive way.

---

## 11. Export / share summary format

Text (default; generated by `buildTextSummary(session, profile)`):
```
Contraction summary — Tue 4 Nov 2026
Pregnancy: 39 weeks + 2 days (due 9 Nov)
Session: 01:12 – 03:05 (1 h 53 min) · 18 contractions

Last 60 min: 12 contractions
  Avg duration: 1 min 02 s   Avg interval: every 4 min 48 s
  Intensity: mostly strong
Pattern rule set in app: 5-1-1 → matched at 02:51

Recent contractions (start · duration · interval · intensity)
  02:58 · 1:05 · 4:40 · strong
  02:53 · 0:58 · 4:55 · strong
  ...
Notes: waters not broken (user note)

Recorded with Contraction Timer. This is a personal log, not a medical assessment.
```
PDF: same data rendered as HTML template → `Print.printToFileAsync({ html })` → `Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share with your provider' })`. Includes a mini bar chart (inline SVG), table of all contractions, profile header, disclaimer footer. Themes: "Clean" (free), "Soft Floral", "High-contrast print", "Compact one-page" (rewarded unlock, permanent). Files written to cache dir and deleted after 24 h. Nothing is uploaded. Kick history and birth plan have analogous text exports.

---

## 12. AdMob placement map

All ad calls go through `@shared/ads` and are wrapped by an app-level guard `canShowFullScreenAd(now)`:
```ts
const blocked = isSessionActiveOrRecent(now, 30 * MIN)   // app-open gate
  || activeContraction || activeKickSession
  || (lastSessionEndedAt && now - lastSessionEndedAt < 2 * MIN)       // interstitial gate (stricter one wins)
  || !consent.canRequestAds;
```

| Format | Placement id | Where / trigger | Frequency cap | Never show when |
|---|---|---|---|---|
| Banner (adaptive anchored) | `history_banner` | Bottom of Contraction History & Kick History lists (`<AdBanner placement="history_banner" />`) | n/a (refresh 60 s) | On Timer screen, Kick counting screen, session detail while session active, onboarding |
| Banner | `week_banner` | Bottom of week article & week list | n/a | — |
| Banner | `checklist_banner` | Bottom of Hospital bag & Birth plan | n/a | Keyboard open (hide) |
| Native | `week_native` | `<NativeAdCard placement="week_native" />` after 3rd card in week list, then every 8 | 1 per screen view | Never styled like content without "Ad" label; never in Timer/Kicks |
| Rewarded | `pdf_theme_reward` | User taps a locked PDF theme → "Watch a short video to unlock this theme forever" → `showRewarded('pdf_theme_reward')` | User-initiated only | During active session (button shows "Available after your session"); default PDF always free |
| Rewarded | `checklist_template_reward` | Unlock extra checklist templates (C-section bag, NICU bag, twins, birth-center plan) | User-initiated only | — |
| Interstitial | `week_close_interstitial` | **Only** on closing a week-by-week article (back) after ≥ 20 s read | ≥ 3 min between, max 4/day, none in first session/day 0 | Contraction session active or ended < 2 min; kick session active; app in Partner mode |
| App-open | `app_open` | Cold start/resume from background > 4 h | max 1 / 4 h; not before day 2 | Session active **or ended < 30 min ago**; launch via notification/deep link to timer; first 3 launches |

Critical UX rules: no ad ever overlaps or sits adjacent (< 48dp) to the timer button; the Timer tab is ad-free; never call `showInterstitial` from timer code paths (lint rule: `no-restricted-imports` of `@shared/ads` full-screen APIs inside `src/features/timer/**`). Test ids in dev; `__DEV__` guard.

**Mediation:** AdMob as primary with bidding: Meta Audience Network, AppLovin, Unity Ads, Mintegral (Liftoff later). Enable after ~1k DAU; A/B via AdMob mediation groups for US vs. RoW. Native/banners via bidding only; keep waterfall minimal to protect latency.

**Ad content filtering (AdMob → Blocking controls):** maternity audience is sensitive.
- Sensitive categories blocked: Dating, Gambling & betting, Alcohol, Sexual & reproductive health (avoid fertility/contraception ads to people in late pregnancy or after loss), Weight loss, Cosmetic procedures & body modification, Get-rich-quick, Politics, Religion, Drugs & supplements, Astrology & esoteric, References to sex/sexual content, Shocking content, Personal loans.
- Max ad content rating **G**; disable personalized ads where consent not given (UMP handles); block known-bad advertiser URLs reported by users via "Report ad" feedback mail.
- Treat for child-directed: **No** (audience 18+), but `tagForUnderAgeOfConsent: false`, `maxAdContentRating: 'G'` set in `@shared/ads` request config for this app.

---

## 13. Retention loops
1. **Weekly "baby is the size of a…" card** — notification + My Pregnancy header updates each week; shareable image card (Partner/family share = organic).
2. **Daily kick count** (opt-in) — habit loop weeks 28–40 with history reassurance.
3. **Checklist progress** — "Hospital bag 70% packed" nudges at weeks 34/36/37 (in-app card, not push).
4. **Labor day** — the emotional peak; share summary; afterwards "Congratulations!" screen.
5. **Postpartum handoff** — on "Baby is here" (or EDD + 14 days): celebration card, birth stats export, CTA to v2 newborn log / sister app via Play link; ask for rating only if they had a positive session (see ASO.md).
6. **Second pregnancy** — data archived locally; "Starting a new pregnancy?" in More.

---

## 14. Tech stack
- Expo SDK (latest stable), Expo Router (typed routes), TypeScript strict, React 19 / RN New Architecture.
- State: Zustand + `@shared/storage` (react-native-mmkv) persistence; sync writes for timer taps.
- `expo-keep-awake`, `expo-haptics`, `expo-notifications`, `expo-print`, `expo-sharing`, `expo-localization`, `expo-font`, `expo-splash-screen`, `expo-quick-actions` (v1.1 shortcut).
- Ads: `react-native-google-mobile-ads` via `@shared/ads`; consent via `@shared/consent` (UMP). EAS dev build required (no Expo Go).
- Dates: `date-fns`. i18n: `i18next` + `react-i18next`. IDs: `nanoid/non-secure`.
- Testing: Jest + `@testing-library/react-native`; Maestro flows for E2E (kill/resume test).
- Crash reporting: Sentry (`@sentry/react-native`) with PII scrubbing; no health payloads in breadcrumbs. Analytics optional: Firebase Analytics with event names only (no health values) — disclosed in Data safety.

---

## 15. Folder structure
```
apps/contraction-timer/
├── app/                         # Expo Router
│   ├── _layout.tsx              # theme, consent bootstrap, ad gating provider
│   ├── (onboarding)/{welcome,disclaimer,how-far,first-time,needs}.tsx
│   ├── (tabs)/_layout.tsx
│   ├── (tabs)/timer/{index,history,session/[id]}.tsx
│   ├── (tabs)/kicks/{index,history}.tsx
│   ├── (tabs)/pregnancy/{index,due-date,hospital-bag,birth-plan,week/[n]}.tsx
│   ├── (tabs)/more/{index,settings,privacy,disclaimer,about}.tsx
│   └── modals/{share-summary,pdf-theme,alert-rule}.tsx
├── src/
│   ├── features/timer/          # components, hooks (useActiveSession), NO full-screen ad imports
│   ├── features/kicks/
│   ├── features/pregnancy/
│   ├── features/checklists/
│   ├── logic/{stats,pattern,kicks,dueDate,summary}.ts (+ __tests__)
│   ├── store/{sessionStore,kickStore,profileStore,settingsStore}.ts
│   ├── ads/{gating.ts,placements.ts}
│   ├── notifications/
│   ├── export/{textSummary.ts,pdfTemplate.ts,themes/}
│   ├── i18n/{en,es,pt-BR,de,fr,id,hi}.json
│   └── theme/tokens.ts
├── assets/{content/weeks.en.json,content/checklists.en.json,images,fonts}
├── app.config.ts  eas.json  package.json  tsconfig.json
├── DEVELOPMENT_PLAN.md  ASO.md
```

---

## 16. KPIs

| Metric | Target | Notes |
|---|---|---|
| Install → onboarding complete | ≥ 75% | Skip counts as complete |
| Time to first value (first Start tap or due date set) | < 60 s median | |
| D1 retention | ≥ 35% | high-intent users near term |
| D7 retention | ≥ 20% | weekly card + kicks drive it |
| D30 retention | ≥ 10% | many give birth within window — natural churn, not failure |
| Lifetime | ~3–4 months avg for week-28 installers | Measure "active through birth" proxy: session with pattern match or EDD passed while active |
| Sessions with share/export | ≥ 25% of contraction sessions ≥ 6 contractions | core differentiator |
| Rating | ≥ 4.6★, crash-free users ≥ 99.5% | |
| ARPDAU | $0.015–0.03 (US), $0.006 blended global | low ad density by design; US tier-1 traffic matters |
| Rewarded opt-in | ≥ 6% of PDF exporters | |
| Ad-complaint reviews | 0 mentioning "ad during labor" | hard guardrail |

---

## 17. Milestones (MVP ≈ 9 working days)

| Day | Deliverable |
|---|---|
| 1 | Scaffold app in monorepo, wire `@shared/theme/storage/ads/consent/onboarding`, Expo Router tabs, tokens incl. night mode, EAS dev build profile. |
| 2 | Timer core: session store with sync MMKV writes, wall-clock elapsed, giant button, haptics, keep-awake, kill/resume test. |
| 3 | Stats + pattern detection logic with unit tests; pattern banner; intensity chips; long-contraction & idle guards. |
| 4 | History list/detail, edit/delete/add, text summary + `expo-print` PDF + sharing; free theme. |
| 5 | Kick counter + history + reminder notification (permission on enable). |
| 6 | Due-date calculator (all modes, tests), week-by-week content JSON (weeks 4–42), My Pregnancy tab, checklists. |
| 7 | Onboarding (exact copy), partner mode, disclaimer screens, More/settings, delete-all-data. |
| 8 | Ads: placements, gating guard + lint rule, rewarded unlocks, UMP, content-filter config in AdMob console; a11y pass (TalkBack, 200% font). |
| 9 | QA matrix, Maestro E2E, store assets (ASO.md), privacy policy, Data safety, Health declaration, internal testing track → closed testing (12 testers × 14 days for new personal accounts). |

---

## 18. QA & Play release checklist

**Functional QA**
- [ ] Kill app mid-contraction (swipe away + `adb shell am kill`) → reopen shows correct elapsed.
- [ ] Reboot during session → session restored; idle-guard prompts.
- [ ] Time-zone change & DST crossing during session; manual clock change warning.
- [ ] Pattern detection: fixtures for 5-1-1 match, near-miss, irregular, mis-taps.
- [ ] Due-date math: LMP with cycles 21/28/35, IVF day 3/5, leap year, DST.
- [ ] Night mode contrast; TalkBack full flow; 200% font; one-handed reach on 6.7" device.
- [ ] Ads: none on Timer/Kicks screens; no interstitial/app-open during or < 2/30 min after session (automated test on gating fn + manual); test ads only in dev.
- [ ] Airplane mode: every feature works (ads absent gracefully, no layout jump over the button).
- [ ] PDF renders on Android 8–15; share to Gmail/WhatsApp/Messages.

**Google Play compliance**
- [ ] **Health apps declaration** (Play Console → App content → Health apps): category "Pregnancy & reproductive health / fitness & wellness tracking"; state not a medical device, no diagnostic features, no regulated medical functionality.
- [ ] No diagnostic or predictive claims in app or listing ("detects labor", "tells you when to go" are forbidden). Pattern alert copy reviewed.
- [ ] Medical disclaimer: in onboarding, More, every export footer, and in full description.
- [ ] **Data safety:** "No data collected" for health data (stored on device only, not transmitted). Disclose AdMob: device/advertising ID, approximate location (IP), app interactions, diagnostics — shared with Google for advertising/analytics; Sentry crash logs (diagnostics). Encryption in transit: yes. Deletion: in-app "Delete all data".
- [ ] Privacy policy URL (hosted static page, shared portfolio domain) covering local health data, AdMob, UMP, Sentry, contact email.
- [ ] Target audience & content: **18+ only**; not designed for children; Families policy N/A.
- [ ] Content rating questionnaire (IARC): reference/health tool, no user-generated content → expect Everyone/PEGI 3 equivalent; note "sensitive topics" honestly (pregnancy/birth info).
- [ ] Ads declaration: "Contains ads" = Yes.
- [ ] `app-ads.txt` on developer website with AdMob publisher line; developer website set in Play listing.
- [ ] Permissions minimal: `POST_NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`, `AD_ID` (declared), `SCHEDULE_EXACT_ALARM` **not** used (inexact daily is fine).
- [ ] Sensitive-events: no ads near content about loss; week content reviewed by a qualified midwife (credit in About) before launch.
- [ ] Store listing disclaimer line; no "free/#1/best/top/new" in title; screenshots show real UI.
- [ ] Release: internal → closed (≥ 12 testers, 14 days if required) → production staged rollout 20% → 100% after crash-free ≥ 99.5%.

---

## 19. Build status (one line per milestone of §17; ticked only for what was built and checked in the repo)

Everything below was checked with `tsc`, Jest, `expo-doctor` and `expo export` in a Linux container. **Nothing has run on a device**: anything marked "device" or "account" still needs a phone or a Play/AdMob account. See `RELEASE.md`.

- [x] **Day 1** — Scaffold, theme with night mode, storage, Expo Router tabs, EAS dev profile. Not done: installing an EAS dev build on a phone (needs an Expo account and a device); the ads SDK is wired but the guard refuses every ad until Day 8.
- [x] **Day 2** — Timer core: one store that writes `activeSession` to MMKV on every tap, wall-clock elapsed, 220dp button with breathing ring, haptics, keep-awake, kill/resume tested in Jest (the store is rebuilt from the fake disk). Device still needed: a real kill (`adb shell am kill`) and reboot, haptic feel, keep-awake, the 600 ms long press, scroll lock under a real thumb.
- [x] **Day 3** — Stats and the configurable pattern rule as pure functions (fixtures for a 5-1-1 match, near misses, an irregular run, mis-taps, 4-1-1, 3-1-1, custom), live stats strip and last-contraction card, strength chips for 8 s, the once-per-episode banner (re-arms after 30 min), long-contraction line, idle prompt/auto-end, "session left open" note (only when notification permission already exists). Differs from the plan: the pattern also needs the newest contraction to be recent (see RELEASE.md). Device still needed: how the banner, chips and strip look and feel on a phone; the left-open note arriving.
- [ ] **Day 4** — History, summary, PDF, sharing.
- [ ] **Day 5** — Kick counter, history, reminder.
- [ ] **Day 6** — Due date, week-by-week content, My Pregnancy, checklists.
- [ ] **Day 7** — Onboarding, partner mode, disclaimer, More, delete all data.
- [ ] **Day 8** — Ads placements and guard, rewarded unlocks, consent, accessibility pass.
- [ ] **Day 9** — QA matrix, Maestro, store assets, privacy policy, Data safety, Health declaration, testing tracks. **Not built (release prep, out of scope for this build).**
