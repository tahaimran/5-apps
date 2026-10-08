# Sipling: Drink Water Reminder — Development Plan

> App 2 of the 5-app AdMob portfolio. Google Play only. Expo (latest SDK) + Expo Router + TypeScript.
> No backend, no auth, no server DB. Everything lives on-device (react-native-mmkv).
> Store listing and keyword strategy: see [`ASO.md`](./ASO.md).

| Field | Value |
|---|---|
| Store name | **Sipling: Drink Water Reminder** (29 chars) |
| Brand | Sipling (sip + sapling) |
| Package | `com.<portfolio>.sipling` (placeholder, decide at EAS project creation) |
| Category | Health & Fitness |
| Monetization | AdMob only (`react-native-google-mobile-ads`) + UMP consent, via `@shared/ads` / `@shared/consent` |
| Min SDK / Target SDK | Android 7.0 (API 24) / latest required by Play (API 35+) |

---

## 1. Concept & positioning

**One-liner:** A private, offline water reminder that grows a cute plant every time you drink.

**Positioning statement:** For people who keep forgetting to drink water (office workers, wellness and weight-loss
routines, pregnancy, seniors), Sipling is a drink water reminder and tracker that turns hydration into a small daily
ritual of caring for a plant. Unlike Plant Nanny, the gamification is never paywalled; unlike Leap Fitness /
"Remind Drink" style apps, it schedules intelligently around your real day and skips reminders you no longer need.

**Pillars**
1. **Gentle, not naggy** — reminders only between wake and bed time, auto-skip after you drink, snooze in one tap.
2. **Delight** — the plant companion reacts to every glass; growth stages tied to goal completion and streaks.
3. **Private & offline** — no account, no network needed (except ads), data never leaves the device.
4. **Fits your body and situation** — manual goal calculator (weight, activity, climate) plus optional modes
   (pregnancy, senior-friendly, fasting) using generic wellness wording, never medical claims.

**Gaps we attack (from ASO research):** smart schedule, non-paywalled plant gamification, offline/privacy,
condition-specific goals.

**Non-goals (v1):** cloud sync, wearables, Health Connect, weather API, social features, iOS.

---

## 2. Personas

### Maya, 29 — "the desk-bound forgetter"
- Marketing coordinator in Chicago, 9–6 at a laptop, drinks 3 coffees and maybe 2 glasses of water.
- Goal: fewer afternoon headaches, clearer skin; read that hydration helps her weight-loss routine.
- Behavior: dismisses most notifications; loves cute aesthetics (Finch, Forest).
- Needs: reminders that do not fire in meetings repeatedly, one-tap logging from the notification, a pretty plant.
- Quote: *"I don't need a lecture, I need a nudge at 2 pm."*

### Priya, 33 — "second trimester, doing everything right"
- Teacher in Houston, 22 weeks pregnant, her OB told her to drink more water.
- Needs: a slightly higher, adjustable goal, a clear "talk to your doctor" stance, gentle reminders, charts to show at
  her checkup. Privacy matters (no account).
- Quote: *"I want to see that I actually hit it this week."*

### Linda, 67 — "the daughter installed it for her"
- Retired, lives alone in Florida, mild tendency to under-drink in summer; daughter set up the app.
- Needs: large text, high contrast, 4–6 reminders a day max, big "+ glass" button, no complicated menus.
- Quote: *"Just tell me when, and let me press one button."*

---

## 3. Features by release

### MVP v1.0 (launch, ~7 days)
| # | Feature | Acceptance criteria |
|---|---|---|
| F1 | Onboarding + goal calculator | Completes in ≤ 60 s; produces goal in ml rounded to 50; user can edit goal before finishing; all steps skippable with sane defaults (2,000 ml, 07:00–23:00). |
| F2 | Quick-add logging | Home shows 4 cup chips (defaults 150/250/350/500 ml) + custom; one tap logs, haptic + plant reaction ≤ 150 ms; undo snackbar for 5 s. |
| F3 | Progress ring | Ring fills to `intake / goal`; shows ml and %; ≥ 100% shows "Goal reached" state and confetti once per day. |
| F4 | Smart reminder schedule | Reminders spread between wake+30 min and bed−30 min; count derived from goal/cup (bounded 4–16); none outside window. |
| F5 | Auto-skip | If a log happens within `skipWindowMin` (default 30) before a reminder, that reminder is cancelled. |
| F6 | Actionable notification | Reminder has "+250 ml" (uses preferred cup) and "Snooze 15 min" buttons; tapping logs without opening app UI where supported. |
| F7 | Plant companion | 5 growth stages driven by cumulative goal-days; daily mood (thirsty / ok / happy / blooming) from today's %. |
| F8 | Streaks | Streak increments when daily goal reached; shown on home + history; 1 "streak freeze" earnable via rewarded ad. |
| F9 | History & charts | Day list with entries (edit/delete), week bar chart, month bar chart; native ad card in list. |
| F10 | Beverage types | Water, coffee, tea, juice, milk, sparkling; each with hydration factor (editable in settings). |
| F11 | Settings | Goal, units (ml/fl oz), wake/bed, reminder frequency & style, cups, beverage factors, theme, privacy options (UMP), battery guide. |
| F12 | Ads + consent | UMP before any ad request; banner on Home; native in History; rewarded for skins; interstitial capped; app-open on warm start only. |

### v1.1 (week 2–3)
| Feature | Acceptance criteria |
|---|---|
| Home-screen widget (2×2 + 4×1) | Shows today ml/%, plant stage; "+cup" button logs without opening app; updates ≤ 1 s after in-app log. |
| Pregnancy / senior / fasting modes | Mode adds a guidance-based adjustment (see §8) with disclaimer; senior mode enables large text + fewer reminders; fasting mode mutes reminders in an eating-window-inverse schedule the user sets. |
| Plant skins & cup themes shop | 6 skins + 6 cup themes; 2 free, rest unlocked via rewarded ad or streak milestones. |
| In-app review prompt | Fired per rules in §13. |
| Reminder message variety | 30+ rotating friendly lines, localized. |

### v2.0 (month 2)
| Feature | Acceptance criteria |
|---|---|
| Schedule learning | After 7 days of data, suggest moving reminder slots to times the user historically drinks least; user confirms. |
| Achievements | 15 badges (first glass, 7-day streak, 30 days, 100 L lifetime…). |
| Export / backup | Export JSON/CSV to device storage via share sheet; import restores. |
| Localization wave 1 | es, pt-BR, de, fr, hi, id (see ASO.md). |
| Wear OS tile (stretch) | Quick-add from watch. |

---

## 4. Information architecture & navigation

```
app/
├─ (onboarding)/        Stack, shown when !onboarding.completed
│   welcome → about-you → weight → schedule → activity → climate → goal-reveal
│   → cups → reminders → notif-permission → first-glass
└─ (tabs)/              Bottom tabs (3)
    ├─ index            Today (Home): plant, ring, quick-add, banner
    ├─ history          Day list + Week/Month charts, native ad
    └─ garden           Plant, streak, skins & cup themes shop (rewarded)
   modals: /log-custom, /edit-entry/[id], /settings (stack), /settings/reminders,
           /settings/goal, /settings/beverages, /settings/battery-guide, /settings/privacy
```

- Settings is reached from a gear icon on Today (not a tab) to keep 3 tabs simple for seniors.
- Deep links: `sipling://log?ml=250` (widget/notification), `sipling://today`.
- Notification tap → Today (no app-open ad, see §12).

---

## 5. Screen-by-screen UI spec

### 5.1 Today (Home)
- **Header:** date ("Thu, Oct 8"), streak flame chip ("🔥 6"), gear icon.
- **Plant hero (40% height):** current stage illustration; idle sway animation; mood face.
- **Progress ring** around/under plant: `1,250 / 2,300 ml · 54%`. Next reminder line: "Next reminder 2:30 PM".
- **Adaptive banner** (`<AdBanner placement="home_under_ring" />`) directly under ring, above quick-add.
- **Quick-add row:** 4 cup chips + "Other" (opens /log-custom with beverage picker & slider).
- **Today's log (collapsed):** last 3 entries, "See all" → History.

| State | Behavior |
|---|---|
| Empty (0 ml) | Plant "thirsty" droop; copy "Your plant is waiting for its first sip." |
| In progress | Ring animates on each add; plant perks up at 25/50/75%. |
| Goal reached | Ring turns success color, confetti once, copy "Goal reached! Your plant is blooming." |
| Over 150% | Soft note "Great job! No need to overdo it." (no warning tone). |
| Notifications off | Yellow inline card "Reminders are off — Turn on" (opens permission flow/settings). |
| Ad failed / no consent | Banner slot collapses to 0 height (no layout jump: reserve only after load). |

### 5.2 History
- Segmented control: **Day · Week · Month**.
- Day: date pager, entries list (time, beverage icon, ml, effective ml), swipe to delete, tap to edit.
- Week/Month: bar chart (victory-native or react-native-gifted-charts), goal line, average and best-day stats.
- `<NativeAdCard placement="history_list" />` after the 3rd row (Day) or under the chart (Week/Month).
- States: no data ("No drinks logged this day"), loading skeleton (only on first month render), future dates disabled.
- Leaving History after ≥ 20 s on charts is an interstitial candidate (§12).

### 5.3 Garden
- Big plant, stage name ("Sprout — 4 / 7 goal days to next stage"), streak + best streak, streak freezes owned.
- Grid: plant skins & cup themes. Locked items show "Watch ad to unlock" (rewarded) or "Reach 14-day streak".
- States: rewarded not loaded → button disabled with "Ad not available, try later"; offline → same.

### 5.4 Log custom (modal sheet)
Beverage picker (6 icons), amount slider (50–1,000 ml, step 10) + numeric input, time picker (defaults now),
"Add" button. Shows effective hydration: "Coffee 250 ml → counts as 200 ml".

### 5.5 Settings
Sections: Goal (value, recalc wizard), Units, Schedule (wake/bed), Reminders (frequency, style, sound, vibration,
quiet days), Cups, Beverages (factors), Appearance (system/light/dark, large text), Mode (standard/pregnancy/senior/
fasting — v1.1), Privacy (ad consent form via `@shared/consent`, privacy policy link), Battery guide, About, Rate us.

### 5.6 Battery guide
Detects manufacturer (`expo-device` `manufacturer`) and shows 3-step instructions (Samsung "Never sleeping apps",
Xiaomi "Autostart + No restrictions", Huawei, OnePlus, Oppo/Vivo, Pixel). Button "Open battery settings"
(`IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS')`). Link to dontkillmyapp.com.

---

## 6. Onboarding (exact copy)

Built on `@shared/onboarding` (`<OnboardingFlow steps={[...]} onDone={...} />`: progress dots, Back, Skip, custom input steps; persists `onboarding.completedAt`).
Progress dots on all steps; "Skip" top-right on every step uses the listed default. Target: ≤ 60 s.

| # | Screen | Copy & controls | Default if skipped |
|---|---|---|---|
| 0 | Welcome | Plant seed illustration. **"Meet your new plant."** / "Drink water, and watch it grow. Let's set a goal that fits you — it takes 30 seconds." / Button **"Let's start"** / small link "I already know my goal" (jumps to cups with manual goal input). | — |
| 1 | About you (optional) | **"How should we calculate your goal?"** / chips: "Female", "Male", "Prefer not to say" / helper: "Optional. Used only for the calculation, stored on your phone." | Prefer not to say |
| 2 | Weight | **"What's your weight?"** / wheel picker / unit toggle **kg | lb** (default from locale: lb for US) / helper "Used only to estimate your daily goal." | 65 kg / 145 lb |
| 3 | Schedule | **"When does your day start and end?"** / "Wake up" time picker (07:00), "Bedtime" (23:00) / helper "We'll only remind you in between. Your day resets when you wake up." | 07:00–23:00 |
| 4 | Activity | **"How active are you on a typical day?"** / cards: "Mostly sitting" · "Lightly active (walks, standing)" · "Active (workouts 3–5×/week)" · "Very active (daily training or physical job)" | Lightly active |
| 5 | Climate | **"What's the weather usually like where you are?"** / cards: "Cool" · "Mild" · "Warm" · "Hot or humid" / helper "No location needed — just pick what feels right." | Mild |
| 6 | Goal reveal | Animated calculation: rows tick in one by one (300 ms each) — "Body weight 62 kg → 2,050 ml", "Lightly active → +250 ml", "Mild climate → +0 ml", then counter rolls up to **"Your daily goal: 2,300 ml"** (≈ 8 glasses). Water fills the plant pot. Buttons: **"Sounds good"** / "Adjust" (stepper ±50 ml). Footnote: "A general wellness estimate, not medical advice. Ask a professional if you have a health condition." | calculated value |
| 7 | Cup size | **"What do you usually drink from?"** / 4 cups: "Small glass 150 ml", "Glass 250 ml", "Mug 350 ml", "Bottle 500 ml" + "Custom" | 250 ml |
| 8 | Reminder style | **"How often should we nudge you?"** / "Every hour" · "Every 2 hours" · "Smart (we'll space them for your goal)" (recommended badge) / style: "Gentle (silent banner)" · "Normal (sound)" | Smart, Normal |
| 9 | Notification permission (in context) | Mock notification preview showing "💧 Time for a sip! [+250 ml] [Snooze]". **"Want a gentle nudge when it's time?"** / "We'll send about 9 reminders between 7:00 and 23:00. You can log right from the notification." / **"Turn on reminders"** → system `POST_NOTIFICATIONS` dialog (Android 13+) / "Not now". On deny: "No problem — you can turn them on anytime in Settings." | Not now |
| 10 | Consent (UMP) | Not a custom screen. `@shared/consent` `initConsent()` runs **after step 9 and before step 11**, so the first ad request can happen on Home. Only shows the Google form where required (EEA/UK/CH, US states). | — |
| 11 | First glass (first-value moment) | Plant seed in pot. **"Let's water your plant for the first time."** / big 250 ml cup button pulsing / on tap: water pour animation, success haptic, seed sprouts, copy **"Your first sip! 250 ml down, 2,050 ml to go."** / Button **"Go to my plant"** → Today. | If skipped: lands on Today empty state |

**Skip behaviour:** "Skip" on any step applies defaults for that step and remaining steps, still shows the permission
(step 9) and consent (step 10), then lands on Today. `onDone` fires on reaching Today and `@shared/onboarding` persists `onboarding.completedAt`.
Back button preserves selections. If app is killed mid-flow, resume at last step.

**Analytics-free:** we track funnel only via local counters (no analytics SDK in v1; Firebase Analytics optional v1.1
behind consent, see §16).

---

## 7. Design system

Use `@shared/theme` (`ThemeProvider` with light / dark / high-contrast modes, tokens `colors/spacing/radius/type/motion`, `useHaptics()`); the app supplies the palette and font scale below.

### 7.1 Palette
| Token | Light | Dark | Use |
|---|---|---|---|
| `primary` | `#2B9FE6` | `#5BB8F5` | Ring, primary buttons |
| `primaryDeep` | `#1572B6` | `#2B9FE6` | Pressed, headings accent |
| `water` | `#7FD1F7` | `#3A8FC4` | Ring track fill gradient end |
| `leaf` | `#4CBF7A` | `#6BD494` | Plant, success, streak |
| `bloom` | `#FF8FB1` | `#FF9FBE` | Flowers, celebration |
| `sun` | `#FFC94D` | `#FFD36E` | Streak flame, warnings (soft) |
| `bg` | `#F4FAFE` | `#0E1A24` | Screen background |
| `surface` | `#FFFFFF` | `#16242F` | Cards |
| `surfaceAlt` | `#E6F3FC` | `#1E3140` | Chips, ring track |
| `text` | `#11263A` | `#E8F2F9` | Body (contrast ≥ 12:1) |
| `textMuted` | `#5A7184` | `#9DB3C4` | Secondary (≥ 4.5:1) |
| `danger` | `#E05A5A` | `#FF7B7B` | Delete only |

### 7.2 Typography (Nunito via expo-font; rounded, friendly)
| Style | Size/Line | Weight |
|---|---|---|
| display (goal number) | 40/48 | 800 |
| h1 | 28/34 | 800 |
| h2 | 22/28 | 700 |
| body | 16/24 | 500 |
| label | 14/20 | 600 |
| caption | 12/16 | 500 |
All sizes respect system font scale (cap at 1.6× on ring numbers); "Large text" setting adds 1.2× multiplier.

### 7.3 Plant growth stages (illustrations, Lottie or Rive)
| Stage | Unlock (cumulative goal-days) | Visual |
|---|---|---|
| 0 Seed | start | Seed in pot, soil only |
| 1 Sprout | 1 | Two tiny leaves |
| 2 Seedling | 4 | 4 leaves, small stem |
| 3 Young plant | 10 | Bushy, first bud |
| 4 Blooming | 21 | Full flowers in `bloom` color |
| 5 Tree of Life (v2) | 60 | Small bonsai with fruit |
Daily mood overlay: thirsty (<25%, slight droop), ok (25–74%), happy (75–99%), sparkle (≥100%).
Missing days never kill the plant (no punishment); it only droops for that day.

### 7.4 Motion & haptics
- Water add: ring sweep 600 ms `withSpring({damping:18})`; plant bounce 250 ms; droplet particles.
- Goal reached: confetti 1.2 s once/day; `Haptics.notificationAsync(Success)`.
- Chip tap: `Haptics.impactAsync(Light)`. Delete: `Warning`.
- Respect `AccessibilityInfo.isReduceMotionEnabled()` → crossfade only, no confetti/particles.

### 7.5 Accessibility
- Touch targets ≥ 48 dp; quick-add chips 56 dp tall.
- Ring has `accessibilityRole="progressbar"` with value text "1,250 of 2,300 millilitres, 54 percent".
- Plant has descriptive label ("Your plant is a sprout and looks happy").
- All colors meet WCAG AA; never color-only status (icons + text).
- TalkBack: notification actions labeled ("Add 250 millilitres").

---

## 8. Core logic

### 8.1 Goal formula (guidance, not medical)
Reference points used only to keep defaults sensible: EFSA (2010) adequate total water intake 2.0 L/day women,
2.5 L/day men; US NASEM (2004) ~2.7 L / 3.7 L total water incl. food; common practitioner heuristic ~30–35 ml/kg.
Copy always says "general wellness estimate".

```ts
function calcGoalMl(p: Profile): number {
  const base = p.weightKg * 33;                                   // ml per kg
  const activity = { sedentary: 0, light: 250, active: 500, very_active: 750 }[p.activity];
  const climate  = { cool: -100, mild: 0, warm: 250, hot: 500 }[p.climate];
  const sex      = p.sex === 'male' ? 150 : 0;                    // optional, small
  const mode     = { standard: 0, pregnancy: 300, breastfeeding: 700, senior: 0, fasting: 0 }[p.mode]; // EFSA increments
  const raw = base + activity + climate + sex + mode;
  return clamp(roundTo(raw, 50), 1200, 4500);
}
// 62 kg, light, mild, female → 2046 + 250 → 2,300 ml
```
Pregnancy/breastfeeding modes show "Talk to your healthcare provider" banner; senior mode does not reduce the goal
but defaults to fewer, larger-text reminders. Users can always override the goal manually (`goalSource: 'manual'`).

### 8.2 Schedule spacing algorithm
```ts
function buildSlots(s: ReminderSettings, goalMl: number, cupMl: number): MinuteOfDay[] {
  const start = s.wakeMin + 30;                        // first reminder 30 min after waking
  let end = s.bedMin - 30;                              // last reminder 30 min before bed
  if (end <= start) end += 1440;                        // bedtime after midnight (night shift)
  const span = end - start;
  const n = s.frequency === 'smart'
    ? clamp(Math.ceil(goalMl / cupMl), 4, 16)
    : clamp(Math.floor(span / s.intervalMin) + 1, 2, 16);
  const step = n > 1 ? span / (n - 1) : 0;
  return Array.from({ length: n }, (_, i) => roundTo(start + i * step, 5) % 1440)
              .filter(m => !inQuietBlock(m, s.quietBlocks));   // e.g. lunch meeting block
}
```
Example: 07:00–23:00, 2,300 / 250 → 10 slots, every ~98 min (07:30, 09:10, 10:45 … 22:30).

### 8.3 Snooze
"Snooze 15 min" action schedules a one-off notification at now+15 (id `snooze`), replacing any existing snooze.
Never snooze past `bed − 0`; if it would, drop it. Snooze duration configurable 10/15/30.

### 8.4 "Already drank" auto-skip
On every log: find the next scheduled reminder today; if `nextAt − now ≤ skipWindowMin` (default 30) **or** the log
was within the last 30 min before it, cancel that reminder instance (rolling one-shot triggers make this possible,
see §10). If daily goal reached → cancel all remaining reminders today and schedule nothing until next wake.

### 8.5 Day rollover at wake time
"Logical day" = from `wakeMin − 120` (2 h grace) on date D to the same time on D+1. `dayKey(ts)` returns `YYYY-MM-DD`
of the logical day. Logging at 01:30 when wake is 07:00 counts for yesterday. Recomputed from settings at read time,
so changing wake time re-buckets future logs only (past day summaries are stored, see §9).

### 8.6 Streaks
- `streak` increments at rollover if previous logical day `effectiveMl ≥ goalMl` (goal snapshot of that day).
- Missing a day: if `streakFreezes > 0`, consume one automatically and keep streak (toast next open).
- `bestStreak = max(bestStreak, streak)`. Goal-days counter (never decreases) drives plant stage.

### 8.7 Beverage hydration factors (defaults, editable 0.5–1.0)
| Beverage | Factor | Note |
|---|---|---|
| Water / sparkling | 1.0 | |
| Tea | 0.9 | |
| Milk | 0.9 | |
| Juice | 0.85 | |
| Coffee | 0.8 | Moderate coffee still hydrates; conservative default |
| Soda (v1.1) | 0.8 | |
Effective ml = `round(volume × factor)`. Charts show effective; entry rows show both.

---

## 9. Local data model

Storage via `@shared/storage`: `createStore<WaterStore>('water', 1, migrations)` (MMKV), typed `store.get/set`,
`useStored(key, fallback)` hook, `exportBackup()/importBackup()` (used by v2.0 export). Schema versioned for migrations.

| Key | Type | Notes |
|---|---|---|
| `water.schemaVersion` | `number` | starts at 1 |
| `water.profile` | `Profile` | onboarding answers |
| `water.goal` | `GoalSettings` | |
| `water.reminders` | `ReminderSettings` | |
| `water.cups` | `Cup[]` | ordered |
| `water.beverages` | `BeverageFactor[]` | |
| `water.logs.<YYYY-MM>` | `LogEntry[]` | month-sharded to keep reads small |
| `water.daySummaries` | `Record<DayKey, DaySummary>` | for charts & streaks |
| `water.progress` | `PlantProgress` | streak, goal-days, unlocked items |
| `water.scheduled` | `ScheduledReminder[]` | ids of pending notifications |
| `water.meta` | `AppMeta` | review prompt, ad counters, launches |
| `onboarding.completedAt` | `number` | owned by `@shared/onboarding` |

```ts
type Unit = 'ml' | 'floz';
type DayKey = string; // 'YYYY-MM-DD' logical day
interface Profile {
  sex?: 'female' | 'male' | 'unspecified';
  weightKg: number; weightUnit: 'kg' | 'lb';
  activity: 'sedentary' | 'light' | 'active' | 'very_active';
  climate: 'cool' | 'mild' | 'warm' | 'hot';
  mode: 'standard' | 'pregnancy' | 'breastfeeding' | 'senior' | 'fasting';
}
interface GoalSettings { goalMl: number; source: 'calculated' | 'manual'; unit: Unit; updatedAt: number; }
interface ReminderSettings {
  enabled: boolean; wakeMin: number; bedMin: number;           // minutes from 00:00
  frequency: 'smart' | 'interval'; intervalMin: 60 | 90 | 120 | 180;
  style: 'gentle' | 'normal'; snoozeMin: 10 | 15 | 30; skipWindowMin: number;
  quietBlocks: { startMin: number; endMin: number }[];
  activeWeekdays: number[];                                     // 0–6
}
interface Cup { id: string; ml: number; label: string; icon: string; }
interface BeverageFactor { id: 'water'|'sparkling'|'tea'|'coffee'|'juice'|'milk'|'soda'; factor: number; }
interface LogEntry {
  id: string; ts: number; dayKey: DayKey; beverage: BeverageFactor['id'];
  volumeMl: number; effectiveMl: number; source: 'app' | 'notification' | 'widget';
}
interface DaySummary { dayKey: DayKey; effectiveMl: number; goalMl: number; count: number; reached: boolean; }
interface PlantProgress {
  goalDays: number; stage: 0|1|2|3|4|5; streak: number; bestStreak: number;
  streakFreezes: number; lastEvaluatedDay: DayKey;
  activeSkin: string; activeCupTheme: string; unlocked: string[];
}
interface ScheduledReminder { notificationId: string; fireAt: number; kind: 'slot' | 'snooze'; }
interface AppMeta {
  installAt: number; launches: number; lastReviewPromptAt?: number; reviewPrompted: number;
  lastInterstitialAt?: number; lastAppOpenAdAt?: number; sessionsSinceInterstitial: number;
}
```
Writes: logging appends to the month shard, updates `daySummaries[dayKey]`, then calls `rescheduleAfterLog()` and
`WidgetBridge.refresh()`.

---

## 10. Notifications in depth

**Library:** `@shared/notify` (`ensureNotificationPermission(reasonCopy)`, `scheduleSeries(...)`, `cancel(id)`, channels on init) on top of `expo-notifications`, plus direct `expo-notifications` calls only for categories/actions and `expo-task-manager` for background action handling (extend `@shared/notify` if a generic helper emerges).

### 10.1 Channel & categories
```ts
await Notifications.setNotificationChannelAsync('reminders', {
  name: 'Water reminders', importance: AndroidImportance.HIGH, sound: 'drop.wav',
  vibrationPattern: [0, 120, 80, 120], lockscreenVisibility: PUBLIC,
});
await Notifications.setNotificationChannelAsync('reminders_gentle', { name: 'Gentle reminders', importance: AndroidImportance.LOW, sound: null });
await Notifications.setNotificationCategoryAsync('WATER_REMINDER', [
  { identifier: 'ADD_CUP', buttonTitle: '+250 ml', options: { opensAppToForeground: false } }, // title uses preferred cup
  { identifier: 'SNOOZE',  buttonTitle: 'Snooze 15 min', options: { opensAppToForeground: false } },
]);
```
Category is re-registered when preferred cup changes so the button label stays correct.

### 10.2 Scheduling strategy (no exact alarms)
- **Rolling horizon:** schedule one-off `DATE` triggers for the remaining slots today + next 2 days (≤ 48 pending,
  well under Android's 500-alarm cap). One-shots (not `DAILY` repeats) are what make per-instance auto-skip possible.
- **Top-up:** recompute on app foreground, on every log, on settings change, and in an `expo-background-task` job
  (~every 12 h, best effort). If the user never opens the app for 3 days, the last scheduled item is a soft
  "Your plant misses you 🌱" message instead of silence.
- **Reschedule on change:** `cancelAllScheduledNotificationsAsync()` for our ids → `buildSlots()` → schedule; store ids
  in `water.scheduled`. Debounce 500 ms.
- **No `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`.** Triggers are inexact (may arrive a few minutes late in Doze),
  acceptable for hydration. Remove exact-alarm permissions in `app.config.ts` via `android.blockedPermissions`.
- **Reboot:** expo-notifications re-registers scheduled triggers after `BOOT_COMPLETED`; we still re-verify on next
  foreground.
- **Goal reached:** cancel the rest of today's reminders; optional single "Goal reached 🎉" is local in-app only.

### 10.3 Permission (Android 13+)
- Request `POST_NOTIFICATIONS` only in onboarding step 9 (in context) or from the Today "Reminders are off" card.
- If permanently denied: open app notification settings via `Linking.openSettings()`.
- On each foreground, `getPermissionsAsync()`; if revoked, show the inline card and stop scheduling.

### 10.4 Action handling
- Foreground/background: `addNotificationResponseReceivedListener` → `ADD_CUP` → `logDrink({ml, source:'notification'})`
  → dismiss notification → reschedule → refresh widget.
- Killed app: register a background notification task (`Notifications.registerTaskAsync(TASK)`) that performs the same
  log against MMKV (MMKV is synchronous & safe in headless JS). **Device-verify on Android 13/14/15; fallback** is
  `opensAppToForeground: true` that opens a transparent "Logged +250 ml" toast route and closes.
- Default tap → Today, flagged `launchedFromNotification=true` (suppresses app-open ad).

### 10.5 Reliability tips (shown in Battery guide + first missed-reminder detection)
- Detect "missed" by comparing expected slot times with `lastForegroundAt`/log gaps; after 2 suspected misses show the
  guide once.
- Prompt `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` is **not** requested (Play policy restricts it); we deep-link to
  settings with user-driven instructions instead.
- Copy variety: 30 rotating messages ("Sip o'clock 💧", "Your plant is a little thirsty", "Quick glass before your
  next task?"), no guilt, no health claims.

---

## 11. Home-screen widget (v1.1)

- Library: `react-native-android-widget` (Expo config plugin, JSX widget, headless task handler).
- **Small 2×2:** plant stage thumbnail, "1,250 / 2,300 ml", mini progress bar, "+250" button.
- **Wide 4×1:** progress bar, %, 3 cup buttons (preferred cups), streak.
- Click actions: `ADD_<ml>` handled in widget task handler → `logDrink()` (shared core) → `requestWidgetUpdate()`;
  body tap → `sipling://today`.
- Updates: on every log in-app (`WidgetBridge.refresh()`), at logical-day rollover (via background task), and
  `updatePeriodMillis` 30 min fallback.
- Theming: follows system dark mode; no ads in widget (policy).
- Acceptance: tap-to-log reflects in app within 1 s; works after reboot; no crash when onboarding incomplete
  (shows "Open Sipling to set your goal").

---

## 12. AdMob placement map

All via `@shared/ads` (`initAds(policy, units)` after `initConsent()`); caps configured in `apps/water-reminder/src/ads.config.ts`. No ad request before `initConsent()` resolves `canRequestAds`. Unit IDs from `EXPO_PUBLIC_ADMOB_<PLACEMENT>`, `TestIds` in `__DEV__`.
App-open uses `useAppOpenAd(canShow)`, where `canShow` returns false for cold start, first 3 launches, notification/widget/deep-link launches. `setAdGuard(p => !celebrationPlaying && !onboardingActive)` vetoes full-screen ads during the goal-reached animation and onboarding.
If the native ad does not fill, `<HouseAdCard />` from `@shared/crosspromo` takes the slot.

| Format | Placement id | Screen / trigger | Frequency cap | Never show |
|---|---|---|---|---|
| Adaptive banner | `home_under_ring` | Today, under progress ring (`<AdBanner placement="home_under_ring" />`, anchored adaptive) | always while Today visible; refresh by AdMob (60 s) | during onboarding; in first session before first glass logged; over the plant |
| Native | `history_list` | History, after 3rd entry / under chart (`<NativeAdCard placement="history_list" />`) | 1 per screen view | in empty state; in Settings |
| Rewarded | `garden_unlock_skin` | Garden → "Watch ad to unlock" skin/cup theme (`showRewarded('garden_unlock_skin')` → unlock only if `{ rewarded: true }`) | user-initiated; max 10/day | never auto-triggered |
| Rewarded | `streak_freeze` | Garden / streak-broken sheet "Keep your streak" | user-initiated; max 1 freeze earned/day | — |
| Interstitial | `history_exit` | Leaving History/stats after ≥ 20 s of viewing (`showInterstitial('history_exit')`) | ≥ 3 min since last full-screen ad; ≤ 1 per session; ≤ 4/day | right after a log; after notification launch; first 2 sessions; mid-onboarding; when goal-reached celebration is playing |
| App open | `app_open_warm` | Warm start (background → foreground after ≥ 4 h away) | ≤ 1 per 4 h; shares 3-min full-screen cooldown | cold start; first 3 launches; **when opened from a reminder notification tap or widget/deep link**; when returning from rewarded ad / system permission dialog |

**Rules:** full-screen ads share one global cooldown (`meta.lastInterstitialAt`). If a rewarded fails to load, show
"Ad not available" and never block logging. Logging water is never gated by ads.

**Mediation (AdMob mediation, bidding first):** AppLovin, Meta Audience Network, Liftoff (Vungle), Unity Ads, Mintegral,
Pangle. Add adapters via config plugin only after ~1k DAU; start AdMob-only at launch. Waterfall eCPM floors tuned at
week 4. `app-ads.txt` on portfolio domain lists `google.com, pub-XXXX, DIRECT, f08c47fec0942fa0` plus partner lines.

---

## 13. Retention loops & in-app review

**Loops**
1. **Reminder → one-tap log → plant reacts** (daily, core loop).
2. **Streak + plant stage** (weekly): "3 more goal days until your plant blooms."
3. **Collection** (rewarded skins/themes) gives a reason to open Garden.
4. **Weekly recap** (local notification Sunday 18:00): "This week: 5/7 goal days, 14.2 L 💧" → opens History.
5. **Comeback**: after 2 missed days, one friendly reminder; never more than one re-engagement push per 3 days.

**In-app review (`@shared/review` `maybeAskForReview('goal_reached')`, wraps `expo-store-review`)**
- Trigger after the goal-reached celebration finishes, when: ≥ 3 goal days total, install ≥ 3 days ago, no crash this
  session, not launched from notification, and `reviewPrompted < 3` with ≥ 60 days between prompts.
- Pre-prompt sheet (optional): "Is Sipling helping you drink more?" 👍 → native review; 👎 → feedback email.
  (Native API may not show; never promise a reward for reviews.)

---

## 14. Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK (latest), React Native New Architecture, TypeScript strict |
| Routing | Expo Router (typed routes) |
| Storage | react-native-mmkv via `@shared/storage` |
| i18n | `@shared/i18n` (`t()`, `useLocale()`), strings in `src/i18n/en.json` |
| State | Zustand store hydrated from MMKV (small) |
| Notifications | expo-notifications, expo-task-manager, expo-background-task |
| Animations | react-native-reanimated, lottie-react-native (plant), expo-haptics |
| Charts | react-native-gifted-charts (or victory-native + Skia) |
| Widget | react-native-android-widget |
| Ads/consent | react-native-google-mobile-ads (EAS dev build) via `@shared/ads`, UMP via `@shared/consent` |
| Misc | expo-localization, expo-store-review, expo-device, expo-intent-launcher, expo-font |
| Build | EAS Build (development / preview / production), EAS Submit to Play internal track |
| Quality | ESLint, Prettier, Jest + @testing-library/react-native for logic, Maestro for E2E flows |

---

## 15. Folder structure

```
apps/water-reminder/
├─ app.config.ts                # name, package, plugins (ads, notifications, widget), blockedPermissions
├─ eas.json
├─ app/
│  ├─ _layout.tsx               # providers: theme, consent gate, notification listeners, app-open ad hook
│  ├─ (onboarding)/_layout.tsx  # + 11 step screens
│  ├─ (tabs)/_layout.tsx, index.tsx, history.tsx, garden.tsx
│  ├─ log-custom.tsx, edit-entry/[id].tsx
│  └─ settings/index.tsx, reminders.tsx, goal.tsx, beverages.tsx, battery-guide.tsx, privacy.tsx
├─ src/
│  ├─ ads.config.ts             # placement caps/never-show rules for @shared/ads
│  ├─ core/                     # pure TS, 100% unit-tested
│  │  ├─ goal.ts  schedule.ts  dayKey.ts  streak.ts  hydration.ts  units.ts
│  ├─ data/                     # store.ts (keys, migrations), logs.ts, summaries.ts
│  ├─ notifications/            # channels.ts, categories.ts, scheduler.ts, handlers.ts, backgroundTask.ts
│  ├─ widget/                   # WaterWidget.tsx, taskHandler.ts, bridge.ts
│  ├─ components/               # ProgressRing, Plant, CupChip, BarChart, StreakChip, EmptyState
│  ├─ i18n/en.json …
│  └─ theme/tokens.ts
├─ assets/ (lottie/, images/, sounds/drop.wav, fonts/)
└─ __tests__/ + .maestro/
```

---

## 16. KPIs

| Metric | Target (launch month) | Source |
|---|---|---|
| Onboarding completion | ≥ 75% | local funnel counters / Firebase (opt-in) |
| First glass logged in session 1 | ≥ 85% | |
| Notification permission grant | ≥ 65% | |
| D1 / D7 / D30 retention | 35% / 15% / 6% | Play Console |
| Logs per DAU | ≥ 4 | |
| % logs from notification/widget | ≥ 30% | |
| ARPDAU | $0.010–0.020 (US-heavy mix) | AdMob |
| Banner fill / native fill | ≥ 90% / ≥ 80% | AdMob |
| Full-screen impressions / DAU | ≤ 1.2 | AdMob |
| Crash-free users | ≥ 99.5% | Play vitals |
| Store listing conversion | ≥ 30% | Play Console |
| Rating | ≥ 4.5 | Play |

---

## 17. Milestones (MVP ~7 days)

- [x] **Day 1** — App scaffold in monorepo, `app.config.ts`, EAS dev build with ads + notifications plugins *(plugins configured and `expo prebuild` verified; no EAS build was made)*, theme tokens, MMKV store + migrations, `core/` (goal, schedule, dayKey, hydration) with unit tests.
- [x] **Day 2** — Onboarding flow (11 steps, copy, animations for goal reveal), consent wiring, permission step, first-glass moment.
- [x] **Day 3** — Today screen: ring, plant (static stages + mood), quick-add, custom log sheet, undo, haptics. Banner placement.
- [x] **Day 4** — Notification scheduler (rolling horizon), categories/actions, auto-skip, snooze, background task, killed-app action test on 3 devices *(handlers and tests written; the 3-device test has NOT been run, see `RELEASE.md` §4)*.
- [x] **Day 5** — History (day list, edit/delete, week/month charts), native ad card, interstitial w/ caps, app-open warm-start logic.
- [x] **Day 6** — Garden (stages, streak, freezes, rewarded unlocks), settings screens, battery guide, dark mode, a11y pass *(automated audit; the TalkBack pass is a device check)*.
- [x] **Day 7** — QA (checklist §18), Maestro flows, store assets (ASO.md), privacy policy, Data safety, production AAB → internal testing → closed test *(QA is automated only, Maestro flows are written but not run, store drafts are in `store/`; no AAB was built and nothing was uploaded, see `RELEASE.md`)*.
- [ ] **+1 week** — v1.1: widget, modes, skins shop, review prompt; Play production rollout 20% → 100%.

---

## 18. QA & Play release checklist

**Functional QA**
- [ ] Goal calc matches table for 10 sample profiles (kg & lb); manual override persists.
- [ ] Reminders: none before wake or after bed; overnight bedtime (02:00) works; DST change day; timezone change.
- [ ] Auto-skip cancels the right instance; goal reached cancels rest of day.
- [ ] "+250 ml" action works foreground, background, killed (Pixel 8 A15, Samsung A-series A14, Xiaomi A13).
- [ ] Doze test: `adb shell dumpsys deviceidle force-idle` → reminders arrive (late acceptable).
- [ ] Reboot → reminders still fire. Permission revoked → inline card shows.
- [ ] Rollover at wake time; logs after midnight count to previous day.
- [ ] Streak + freeze; plant stages progress; no stage regression.
- [ ] Widget logs and updates; dark mode; font scale 1.3×/2.0×; TalkBack full pass.
- [ ] Ads: no ad before consent; app-open not shown on notification launch/cold start; interstitial cooldown 3 min;
      rewarded grants only on `EARNED_REWARD`; banner collapses on no-fill; test device IDs removed in prod.

**Play Console**
- [ ] **Privacy policy** URL (portfolio site) — states on-device data, AdMob data use, no account.
- [ ] **Data safety:** Data collected = Device or other IDs (advertising ID), App interactions, Diagnostics
      (crash logs) — collected by AdMob for advertising/analytics, encrypted in transit, not user-deletable in-app (link
      Google's policy); Health info **not collected** (water logs never leave device). Declare `AD_ID` permission use.
- [ ] **Health apps declaration** (App content → Health): select wellness/"hydration tracking" type, confirm not a
      medical device, no Health Connect access.
- [ ] **Ads declaration:** Yes, contains ads.
- [ ] **Content rating** (IARC questionnaire): no violence/UGC → expected Everyone / PEGI 3.
- [ ] **Target audience:** 13+ (13–15, 16–17, 18+), not designed for children; no Families program. Ads use
      `tagForUnderAgeOfConsent` false; UMP handles EEA. If reviewers flag appeal to kids (cute plant), reaffirm adult wellness audience in listing copy.
- [ ] **app-ads.txt** published on developer website domain listed in Play Console; verified in AdMob.
- [ ] Permissions review: `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `AD_ID`, `INTERNET`; **no**
      `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`.
- [ ] Target API level current; 16 KB page-size compatible native libs; AAB < 40 MB.
- [ ] Store listing from ASO.md; 8 screenshots; feature graphic; listing has no medical claims.
- [ ] Closed testing: 12+ testers for 14 days if the developer account is new personal account (Play requirement).
- [ ] Staged rollout 20% → monitor ANR/crash 48 h → 100%.
