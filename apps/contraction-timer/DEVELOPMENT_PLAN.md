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
Redesigned (Oct 2026) after the reference screens, top to bottom:
- **Pregnancy dial:** 40 week ticks around the face (every 4th numbered), an arc filled to today with a knob on this week, "Week 34 + 2" in the middle, then chips for the days to go, the trimester and the due date. Screen readers hear one sentence ("Week 34 and 2 days. 40 days to go. Baby is about the size of a cantaloupe").
- Hospital-bag nudge at weeks 34/36/37 (soft amber row), unchanged.
- **Week strip:** the trimester and "Week 34 of 40", five weeks at a time with this week as a tall pill, arrows to page through weeks 4–42; any week opens its card.
- **This week card:** a mint-to-blush card with a drawn cradle illustration, "About the size of a cantaloupe", length and weight chips and a round arrow; the whole card opens the week.
- **Getting ready:** hospital bag, birth plan and due date as cards to swipe sideways, each with its progress.
- **Week by week:** the list, this week pinned first, with the **native ad card after the 3rd item** (§12).
- No due date set: the dial shows "?" with "Add your due date to see your week" and the CTA; the strip, cards and list stay.
- In Night the highlights (current week pill and badge, the arrow) use the dim dark red of the Start button, never a bright red fill.
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

## 7. Design system ("Dawn": `@shared/theme` + `@shared/ui`)

Direction (redesign, Oct 2026): soft and airy like a modern pregnancy app, but quiet enough for 3am. A cream page
with a faint mint-to-blush wash at the top, white cards with soft warm shadows, round pill controls and one loud
thing per screen: the giant Timer button (and on Kicks, the counter). Colors keep their meaning everywhere:
**teal = Start**, **coral = Stop / contracting**, **soft amber = the pattern banner and every other "heads up"**.
Nothing outside Night mode is ever red; warnings are amber and worded calmly. The app registers its palette with
`ThemeProvider` (`src/theme/tokens.ts`); Night lives in the shared theme's `high-contrast` slot (`src/theme/mode.ts`,
`NIGHT_SLOT`, `toggleNight`), and the Theme setting offers it as its own choice, never folded into "system".

### Palette
Every pair below is checked in `src/theme/__tests__/contrast.test.ts`, including text on each gradient stop and on
the frosted overlays; `night.test.ts` walks every Night token (gradients and overlays too) and fails on any blue or
green channel above 30% (`0x4D`). The first plan's Night text `#FF6B5A` had 42% green, so it became `#FF4A3A` (6.3:1 on black).

| Token | Light | Dark | Night (red-shifted, OLED) |
|---|---|---|---|
| `background` | `#FBF6F2` cream | `#121419` | `#000000` |
| `surface` (cards) | `#FFFFFF` | `#1C1F26` | `#140403` |
| `surfaceAlt` (insets, raised chips in dark) | `#F3ECE7` | `#272B34` | `#220806` |
| `text` | `#2A2B3D` ink | `#EEEDF3` | `#FF4A3A` |
| `textMuted` | `#5D6073` | `#A9ABBA` | `#E04A39` |
| `primary` (teal, links, active tab) | `#25756F` | `#5EC4BA` | `#E5402F` |
| `primarySoft` | `#E0F2EF` mint | `#18332F` | `#220604` |
| `accent` (lavender, Kicks) | `#6E5DAA` | `#B5AAE0` | `#B3301F` |
| `success` | `#2F7A4A` | `#86C590` | `#FF4A3A` |
| `danger` (destructive only; warm terracotta, not alarm red) | `#9C4A3C` | `#F0A08C` | `#FF4A3A` |
| `border` (toggle tracks, outlines; 3:1) | `#857C76` | `#707588` | `#B3301F` |

App tokens (`extraColors`):

| Token | Light | Dark | Night |
|---|---|---|---|
| Start button (gradient) / label | `#2A8079 → #1B5C57` / `#FFFFFF` | same / `#FFFFFF` | `#4A0E07 → #2E0603` / `#FF4A3A` |
| Stop button (gradient) / label | `#DB6E53 → #BF5641` / `#FFFFFF` | `#C9624A → #A64A37` / `#FFFFFF` | `#6E140A → #4A0E07` / `#FF4A3A` |
| Breathing ring | coral `#C9654B` (3:1 on the peach wash) | `#F09A82` | `#FF4A3A` |
| Screen wash, resting (top → bottom) | mint `#DDF1ED` → cream → blush `#F9E9EC` | `#14302E` → bg | `#120302` → black |
| Screen wash, contracting | peach `#FBE3D9` → cream → blush | `#3A221E` → bg | `#2A0703` → black |
| Pattern banner bg / text / icon | `#FBE7B8` / `#6B4A00` / `#8A5E00` | `#3D3112` / `#F5D88C` / `#F5D88C` | `#2A0703` / `#FF4A3A` / `#FF4A3A` |
| Kicks stage (gradient) / text | lavender `#65559F → #4C3F86` / white (white counter disc, `#4A3D85` digits) | `#5B4C96 → #3F336F` / white (disc `#6E5FAE`, raised) | `#2E0603 → #1A0302` / `#FF4A3A` |
| Pregnancy hero (gradient) | `#CDEDE7 → #F8E2E9` | `#1B3A37 → #3A2430` | `#1A0402 → #0D0201` |
| Coral as text / its soft tint | `#A9503B` / `#FCE9E3` | `#F09A82` / `#3A221E` | `#FF4A3A` / `#2A0805` |
| Frosted overlay on a stage | white 14% | white 14% | `#FF4A3A` 14% |
| Sheet scrim | `#1E1512` 55% | black 62% | black 70% |
| Divider (hairlines) | `#ECE4DE` | `#2C2F38` | `#2A0804` |

Dark mode has depth: each layer is lighter than the one under it (background < surface < surfaceAlt, and the raised
part of a segmented control or stepper is lighter than its track, via `insetTones`); a test checks the order.
Shadows are warm (`#6B5040`) in light mode and deep black in dark and Night. Switch thumbs stay visible (`Toggle`).

### Type
Figtree (body, 400–700) and Bricolage Grotesque (titles and big numbers, 600/800), embedded with the expo-font
plugin from `packages/shared/assets/fonts`. Scale in sp: `display 72/80` (timer digits) · `h1 30/36` · `h2 22/28`
· `h3 19/26` · `body 18/26` (larger than usual) · `label 16/22` · `caption 14/20`. Partner mode multiplies the Timer
screen's type by 1.4, capped so Partner × system font scale never passes 2.0. Big numbers (timer, kick count,
elapsed) use `fontVariant: ['tabular-nums']` (both fonts ship `tnum`) **and** sit in fixed-width digit boxes, so
nothing shifts as they tick. Every screen is checked at system font scale 1.3 and 2.0, with Partner mode on.

### Shape, spacing, touch
- 4-pt grid, 20dp screen gutter. Radius: cards 20, hero cards 28, chips and buttons 999.
- **Every touch target ≥ 56dp** (maternity app). **Timer button ≥ 120dp, default 220dp (280 in Partner mode),
  hit slop +24dp**; Kick counter 180dp.
- Icons: Lucide, one import per icon (`src/ui/icons.tsx`), 2.25 stroke. No emoji as icons or in copy.
- Tab bar: compact (56dp + gesture inset), Lucide icons in a soft pill for the active tab, no ripple, no sliding.

### The hero: Timer screen
The page carries a soft wash (mint at the top while resting, warming to peach while a contraction runs; a 280 ms
crossfade). Top row: title, Night toggle (when on, a dim red ring rather than a filled disc, so it never glares at 3am), Partner toggle, History. A status pill says what is happening ("Tap when
a contraction begins" / "Contraction in progress" / "Resting · 3:12 since last started"). Above the button, the
running time in big tabular digits. The 220dp button sits in the lower-middle third: a teal gradient disc with a
timer icon and **Start**, or a coral disc with a square icon and **Stop**; a thin track ring circles it, and while a
contraction runs a coral ring breathes around it (4 s in, 4 s out, labelled "Breathe with the ring"). Under it:
three stat tiles (count, average length, every …), the last-contraction card with Mild / Moderate / Strong chips for
8 s, and the pattern banner (soft amber, non-modal, slides in once). No ads on this screen, ever (§12).

### Haptics and sound
Haptics are the main feedback, through `useHaptics()` and the Settings toggle (`setHapticsEnabled`): start = Heavy,
stop = Medium ×2, kick tap = Light, pattern banner = Warning. Sounds (`@shared/sound`) are **off by default** (the
app is used next to someone sleeping) and only from the shared set: start `tap`, stop `check`, kick `tap`, kick
target `complete`, undo `undo`, checklist tick `check`.

### Motion (expo-animation; tokens in `src/ui/motion.ts`)
Reanimated only. Everything the user causes finishes in under 300 ms: press scale (PressableScale), CSS transitions
for state changes (button fill teal ↔ coral, wash crossfade, segmented pill, chip and checklist ticks), CSS
keyframes for one-shot effects (kick-count pop, banner entrance). The one exception is the **breathing ring**: a
looping 8 s keyframe (4 s each way, ease-in-out) that doubles as a breathing guide. Reduce Motion: the ring is drawn
still, the pop and slide-in are dropped, colors still change. Shared values only where something is continuous
(the shared ProgressRing on Kicks).

### Accessibility
- TalkBack: the button says "Start contraction" / "Stop contraction, 42 seconds"; stats are announced when a
  contraction stops (not every second).
- Color is never the only signal: label, icon and the status pill change too.
- One-handed: primary actions in the bottom 60% of the screen.
- Night mode: pure black, red only, "Lower your screen brightness too".

### Native pieces (one dev build)
expo-dev-client, expo-audio (no microphone, no background playback), expo-linear-gradient, expo-navigation-bar
(`enforceContrast: false`), lucide-react-native, the expo-font families, the expo-notifications plugin with a white
notification icon, the brand color and the shared `reminder.wav`. Icon, adaptive layers, monochrome, notification
icon, splash and the 1024×500 feature graphic come from `scripts/generate-icons.cjs`. expo-keep-awake and expo-print
load through `src/native/optional.ts`, so a build without them still runs (the screen may sleep; the PDF falls back
to the text summary).

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
| Kick-count reminder | Off; enabled in onboarding/Kicks | Daily at chosen time (`DailyTriggerInput`), shown in the 12/24-hour style chosen in Settings | "Time for your kick count? Find a comfy spot and tap Start." Plays the shared chime (`reminder.wav`) with a gentle double vibration. |
| Weekly size card | On after due date set (opt-out in More) | Weekly, start of each pregnancy week at 10:00 local | "Week 35: your baby is about the size of a honeydew melon." (no emoji) |
| Ongoing timing (v1.1) | Off (setting) | While session active | Title "Contraction session · 7 timed" · chronometer · actions [Start] [Stop] |
| Session left open | — | Session idle 2 h (scheduled on each stop, cancelled on next tap) | "Still timing? Your session is open. Tap to review or end it." |

Rules: permission requested **only** when the user turns on a reminder (Android 13+). Channel ids: `kick-chime` (default importance, the shared chime, gentle vibration; Android fixes a channel's sound at creation, so it replaced the first version's `kick-reminder` channel, which the app deletes), `weekly` (low, silent), `timing` (low, ongoing, silent). Small icon: a white cut-out of the app mark; color: the Start teal `#2A8079`. Notifications stop automatically after EDD + 21 days (postpartum handoff card instead). No notification ever says "labor" in a predictive way.

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
- [x] **Day 4** — History list and session detail (edit start and length with plus/minus buttons, tag, note, leave out or count again, join with the next, delete a row with a 5-second undo, add a missed one, delete the session), the text summary of §11, the PDF made with `expo-print` and shared with `expo-sharing`, PDFs removed from the cache after 24 hours, four PDF looks in the template (only "Clean" is selectable until Day 8). Tested in Jest and with the time-zone script (`npm run test:tz`). Device still needed: the real share sheet, the PDF on Android 8–15 and in Gmail/WhatsApp/Messages, the look of the pages. **Not built:** the history banner ad (Day 8).
- [x] **Day 5** — Kick counter (target 5–20, one-second flutter guard, undo, 2-hour provider message word for word, automatic close at 3 hours), history with a time-to-target line, and the daily reminder (asks for the phone's permission only when the person turns it on; stops 21 days after the due date). Tested in Jest with the notification module faked. Device still needed: the Android 13+ permission prompt, a reminder really arriving (and after a reboot, Doze, Samsung/Xiaomi battery managers), the channel settings, a tap opening the Kicks tab.
- [x] **Day 6** — Due-date calculator (known date, last period with cycle length, conception, IVF day 3/5) with the plan's validation and a live sentence, week cards for weeks 4–42 (`assets/content/weeks.en.json`), the My Pregnancy tab with the current week pinned, hospital bag and birth plan (tick, add, delete, reorder, progress; birth plan can be added to the shared text), the weekly size notification (only when the phone's permission already exists). Tested in Jest. **The week cards and checklists were written for this build and have NOT been reviewed by a midwife or doctor: that review is required before release (see RELEASE.md).** Not built: the native ad card in the week list (Day 8).
- [x] **Day 7** — Onboarding (five screens, the plan's exact copy, Skip, resume after a kill, consent after the last screen and deferred after Skip), Partner mode (×1.4 type, fewer controls, tab bar hidden while a contraction runs, "Exit partner mode" chip), disclaimer on screen 2 and as a sheet after Skip, the one-time coach mark, More (settings, privacy and ads, "Not medical advice", rate, feedback, about), Settings (pattern rule editor, colors incl. Night, vibration, 12/24 h, units, kick target, reminders), Delete all data with a double confirm, the rating rules of ASO.md §7. Tested in Jest. Device still needed: how Partner mode reads at arm's length, the Skip and resume paths on a real phone, the Play review dialog. Deviations: one onboarding route; the last screen's Skip sits under the button.
- [x] **Day 8** — Placements of §12 behind `@shared/ads` with an app-level guard (`src/domain/adRules.ts`): banners on the two history lists, the week list and article and the checklists; a native card in the week list after the 3rd card then every 8; the one interstitial when a week article is closed after a 20-second read; the app-open ad on warm starts; rewarded unlocks for PDF looks and extra checklist lists. **Stricter than the plan:** nothing at all is shown while a contraction session or kick count is open (not only full-screen ads), and the rewarded buttons say "Available after your session". Consent starts after the last onboarding screen, or on the first navigation away from the Timer after Skip, never mid-session and never before the disclaimer. A static test replaces the plan's lint rule. Accessibility: every screen is audited in Jest at font scale 1.3 and 2.0 in light, dark and night. **Needs an account or a device and was not done:** the AdMob console content filters and G rating blocks, real unit ids, a UMP form on a phone, TalkBack, a real 200% font-scale look, real ad fill.
- [ ] **Day 9** — QA matrix, Maestro, store assets, privacy policy, Data safety, Health declaration, testing tracks. **Not built (release prep, out of scope for this build).**
- [x] **UI redesign (Oct 2026, branch `feat/ui-polish`)**: the "Dawn" look of §7 on the shared kit (Figtree and Bricolage, Lucide, PressableScale, Card, Button, Toggle, Segmented, Stepper, TimeField, toasts), the Timer hero (wash, fixed-width digits, gradient button, breathing ring), the Kicks stage, the My Pregnancy hero ring, sounds (off by default), the 12/24-hour setting following the phone, the chime channel for the kick reminder, a new icon set and feature graphic (`scripts/generate-icons.cjs`). Checked with `tsc`, Jest (light, dark and Night, font scale 1.3 and 2.0) and `expo-doctor`. **Not yet seen on a phone:** it needs a new dev build (expo-dev-client, expo-audio, expo-linear-gradient, expo-navigation-bar, the font families, the notification icon and chime).
