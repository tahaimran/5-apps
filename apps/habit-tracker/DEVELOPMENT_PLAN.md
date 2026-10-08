# Habit Tracker: Streak & Widget — Development Plan

> App #1 of the 5-app AdMob portfolio (launches first: easiest head keyword, "habit tracker free" 39 traffic / 18 difficulty).
> Platform: Google Play only. Stack: Expo (latest SDK) + Expo Router + TypeScript. No backend, no auth, no server DB.
> Store title (final, see `ASO.md`): **Habit Tracker: Streak & Widget** · Launcher label: **Habits** · Package: `com.<studio>.habittracker`

---

## 1. Concept & positioning

**One-liner:** The beginner-friendly habit tracker with a gorgeous home-screen widget where every feature is free: no account, no paywall, fully offline.

**Problem:** The top habit apps (HabitKit, HabitNow, Habitica, Habit Pixel) either overwhelm beginners with empty screens and setup, or lock widgets, unlimited habits, stats and themes behind a subscription. Loop is free and private but looks utilitarian and has no guided start.

**Positioning pillars**
1. **Start in 45 seconds.** Goal-based onboarding with templates, so the user checks off their first habit before they ever see an empty state.
2. **Check off from the home screen.** The interactive Android widget is the hero feature (autocomplete confirms demand: "habit tracker widget", "habit tracker with widget", "habit tracker widget free").
3. **No paywall, ever.** Unlimited habits, all stats, the widget and backups are free. Ads pay for it, and they never interrupt a check-in.
4. **Private by design.** Everything stays on the device in MMKV. Backup is a JSON file the user owns.
5. **Motivation without guilt.** Streaks with earnable freezes, flexible schedules ("3x a week" counts as a streak), and kind copy.

**Non-goals (v1):** cloud sync, social/friends, iOS, a paid tier, AI coaching, Wear OS.

---

## 2. Personas

| | **Maya, 21, university student** | **Daniel, 29, self-improvement gym-goer** | **Priya, 34, working mum** |
|---|---|---|---|
| Context | Juggles lectures, part-time job; phone is her planner | Reads Atomic Habits, follows productivity YouTube | Building a morning routine around a toddler's schedule |
| Goals | Study 1h daily, drink water, sleep before 00:30 | Gym 4x/week, read 20 pages, no phone first hour | 10-min yoga, journal, take vitamins, 8 glasses of water |
| Frustrations | Apps that paywall the widget; setup takes too long | Rigid "daily" streaks punish rest days | Breaks streaks when kids are sick; too many notifications |
| What wins her/him | Templates + widget + pastel themes | X-times-per-week schedules, heatmap, best streak | Streak freeze, gentle evening nudge, journal notes |
| Ad tolerance | High (used to free apps), will watch rewarded for themes | Medium; hates interstitials mid-flow | Medium; will watch rewarded to save a streak |

---

## 3. Features & acceptance criteria

### MVP v1.0 (launch, ~7 days)

| # | Feature | Acceptance criteria |
|---|---|---|
| F1 | **Yes/no habits** | Tap the check circle on Today → state toggles done/undone in <100ms, haptic fires, persists after app kill. |
| F2 | **Count habits** (target N, unit) | e.g. "Drink water 0/8 glasses". Tap = +1, long-press = −1 / custom value sheet. Done when value ≥ target. Ring shows progress. |
| F3 | **Timed habits** (target minutes) | Start/pause timer on habit row; elapsed survives backgrounding (stored as `startedAt` timestamp, not interval tick). Manual "Add minutes" entry. Done when ≥ target. |
| F4 | **Flexible schedules** | Daily; specific weekdays (Mon–Sun chips); X times per week (1–6). Non-scheduled days are hidden from Today (weekday mode) or shown as "optional" (X/week mode). |
| F5 | **Streaks** | Current + best streak per habit, computed per §8 rules. Visible on habit row (flame + number) and detail. |
| F6 | **Streak freeze** | User holds 0–2 freezes. Earned by watching a rewarded ad (`showRewarded('streak_freeze')`) or 1 free freeze per 7-day perfect week. Auto-applied to a missed scheduled day per §8. Toast explains when one is used. |
| F7 | **Heatmap** | GitHub-style 7-row grid, last 20 weeks on detail screen, intensity = completion ratio, tap a cell shows date + value. Scrolls horizontally to habit start. |
| F8 | **Stats** | Per habit: current/best streak, 7/30-day completion %, total check-ins. Overall: today %, week bar chart, top habit. |
| F9 | **Day notes / journal** | One note per day (max 1000 chars) + optional mood emoji (5). Editable from Today header and calendar. |
| F10 | **Templates library** | ≥40 templates in 6 categories with preset icon, color, type, target, schedule, suggested reminder. Add in one tap, editable. |
| F11 | **Categories** | Built-in: Health, Fitness, Mind, Productivity, Learning, Quit, Other. Filter chips on Today. |
| F12 | **Archive** | Archive hides from Today/widget but keeps history; unarchive restores streak data. Delete requires confirm. |
| F13 | **Reorder** | Long-press-drag on Today list; order persists and is mirrored in the widget. |
| F14 | **Dark mode** | System / Light / Dark setting; all screens and widget pass AA contrast. |
| F15 | **Home-screen widget** | 4x2 "Today" widget with up to 5 habits, tap check toggles without opening app (§11). |
| F16 | **Reminders** | Per-habit reminder time(s) on scheduled days; daily summary; evening streak nudge (§10). |
| F17 | **Backup / restore** | Export JSON via `expo-file-system` + `expo-sharing`; import via `expo-document-picker`; schema validated; restore shows a preview ("12 habits, 340 check-ins") and confirms overwrite. |
| F18 | **Onboarding** | §6 flow; first check-in in ≤45s median. |
| F19 | **Ads + consent** | §12 placement map; UMP before any ad request. |

### v1.1 (week 2–3 after launch)
- 2x2 "Single habit" widget with streak + mini heatmap; widget themes.
- Premium themes (8 palettes) unlockable for 24h via rewarded ad; app icon variants are not in scope.
- Habit "skip day" (counts as neutral, not a miss; max 2/week).
- Multiple reminders per habit; reminder snooze action from notification.
- Monthly calendar view on Stats with day notes indicator.
- In-app review prompt tuning (§13), localization of 5 languages (es, pt-BR, de, fr, id).

### v2.0 (month 2–3)
- Negative/"quit" habits with "days clean" counter and relapse logging.
- Habit stacking ("after I brush teeth → floss") and morning/evening routine grouping with a routine player.
- Year-in-review share card (image via `react-native-view-shot`, local only).
- Challenges (30-day templates), achievements/badges.
- Optional encrypted auto-backup to a user-chosen folder (Storage Access Framework), still no server.

---

## 4. Information architecture & navigation

```
Root Stack (expo-router)
├── (onboarding)/            welcome → goals → templates → reminder → notif-permission → first-checkin
├── (tabs)/
│   ├── index        Today      (habit list for selected date, week strip, day note)
│   ├── stats        Stats      (overview + per-habit cards + native ad card)
│   └── settings     Settings   (theme, reminders, backup, freezes, archive, about)
├── habit/[id]       Habit detail (heatmap, streaks, history, notes)   [stack push]
├── habit/new        Create / template picker                           [modal]
├── habit/[id]/edit  Edit habit                                         [modal]
├── templates        Template library                                   [modal]
├── note/[date]      Day note editor                                    [form sheet]
├── archive          Archived habits                                    [stack push]
└── backup           Export / import                                    [stack push]
```

Bottom tabs: Today · Stats · Settings. FAB "+" on Today opens `habit/new`. Deep links: `habittracker://today`, `habittracker://habit/<id>` (used by widget and notifications).

---

## 5. Screen-by-screen UI spec

**Today (`(tabs)/index`)**
- Header: greeting ("Good morning, let's go"), date, overall ring (e.g. 3/5). Week strip (Mon–Sun) with mini completion dots; tapping a past day edits that day (max 7 days back; older days via detail).
- Category filter chips (hidden if all habits share one category).
- Habit rows: icon in color tile, name, schedule hint ("2/3 this week"), streak flame, action control (check / count ring / timer button).
- Day note card ("How was today?") below list.
- Adaptive banner (`<AdBanner placement="today_bottom" />`) pinned above tab bar, never overlapping the FAB.
- States: **loading** (skeleton rows, only on cold start >150ms); **empty** ("No habits yet. Pick one from templates →" + 3 template quick-adds); **all done** (confetti once/day + "Perfect day! 🔥" card); **rest day** ("Nothing scheduled today. Enjoy the rest."); **past day** (amber banner "Editing Tue, Oct 6").

**Habit create/edit (modal)**
- Fields: name (required, ≤40), icon picker (60 Material Symbols), color (12 swatches), type segmented (Yes/No · Count · Timer), target + unit (count/timer), schedule (Daily · Weekdays · X per week), reminder toggle + time(s), category, start date.
- Validation inline; Save disabled until valid. States: new, edit, discard-changes confirm.
- On close after save of an edit → eligible for interstitial (§12).

**Template library (modal)**: search field, category sections, cards with icon + suggested target; tap = preview sheet → "Add habit". Multi-select in onboarding mode.

**Habit detail**: header color band, current/best streak, completion % (7/30/all), heatmap, month list of entries with values, notes on days, actions: edit, archive, delete. States: new habit (<7 days: "Your heatmap fills in as you go"), archived (read-only banner + Unarchive).

**Stats**: overview card (today %, this week bar chart, total check-ins, freezes held), per-habit summary cards (sorted by streak), `<NativeAdCard placement="stats_list" />` after the 3rd card (only if ≥3 habits). Empty: "Stats appear after your first check-in."

**Settings**: Theme (System/Light/Dark + premium themes with rewarded unlock), Week starts on (Mon/Sun), Day ends at (00:00–04:00 rollover, §8), Notifications (daily summary time, evening nudge toggle/time), Streak freezes (count, "Watch an ad to earn one"), Archive, Backup & restore, Privacy options (UMP `showPrivacyOptionsForm()` from `@shared/consent`), Rate us, Privacy policy, Version.

**Backup**: Export button → shares `habits-backup-YYYY-MM-DD.json`; Import → picker → preview → confirm. Errors: invalid file, newer schema version ("Update the app to import this backup").

---

## 6. Onboarding flow (exact copy)

Built on `@shared/onboarding` (`<OnboardingFlow steps={...} onComplete />`, progress dots, persistent "Skip"). Target: first check-in at ≤45s median. Each screen ≤1 decision.

| Step | Screen | Copy | Behaviour |
|---|---|---|---|
| 0 | **Welcome** | Title: "Small habits. Big changes." Body: "Track your routine, build streaks and check off habits right from your home screen. Every feature is free." CTA: "Let's start" · link: "I'll set up later" | Lottie of a streak flame growing. "Set up later" → Today empty state with template quick-adds. |
| 1 | **Goal** | Title: "What do you want to work on?" Subtitle: "Pick one or more. You can change this anytime." Chips: 💪 Get fit · 😴 Sleep better · ⚡ Be productive · 🧘 Mental wellbeing · 🚭 Break a bad habit · 📚 Learn something new · 💧 Be healthier | Multi-select; CTA "Continue" enabled after 1. Stored as `profile.goals`. |
| 2 | **Starter habits** | Title: "Pick 1 to 3 habits to start" Subtitle: "Starting small is the secret. You can add more later." | Shows 6 templates ranked by chosen goals (e.g. Sleep better → "No screens after 23:00", "In bed by 23:30", "Read 10 pages"). Max 3 selectable; counter "2 of 3". CTA "Add habits". |
| 3 | **Reminder time** | Title: "When should we remind you?" Options: 🌅 Morning 08:00 · ☀️ Afternoon 13:00 · 🌙 Evening 20:00 · Custom… Subtitle: "One gentle reminder a day. No spam." | Default = template suggestion. "No reminders" link → skips step 4. |
| 4 | **Notification permission (in context)** | Pre-prompt card: "Allow reminders so we can nudge you at 20:00 and help protect your streak." CTA "Allow reminders" · secondary "Not now" | Only "Allow" triggers the Android 13+ `POST_NOTIFICATIONS` system dialog. Denied → set `notifPermission='denied'`, show a one-line hint in Settings later. Never re-ask more than once (on day 3, from Today banner). |
| 5 | **First check-in** (Today, coach-mark) | Coach-mark over first habit: "Done it already today? Tap to check it off." | Tapping → confetti burst + success haptic + toast "Day 1 🔥 Your streak starts now." Then sheet: "Add the widget to your home screen?" with GIF + "Show me how" (calls `requestWidgetPin`) / "Later". |

**Consent (UMP) placement:** `@shared/consent` `gatherConsent()` runs on the **first launch after onboarding step 5 completes** (i.e. after the first-value moment), before the first ad request. The Today banner is not mounted until `canRequestAds()` is true. Rationale: users who reach value first accept consent forms at higher rates and the form never blocks the first check-in. In EEA/UK the form shows; elsewhere it resolves silently. Privacy options entry lives in Settings.

**Skip behaviour:** "Skip" on any step jumps to Today with whatever was chosen so far; if no habits were selected, Today shows the template quick-add empty state. Onboarding is marked complete (`onboarding.v1.done=true`) once Today is reached; it never re-shows. Analytics: none (no data collected); measure via Play Console funnel + local debug logs only.

---

## 7. Design system (`@shared/theme` tokens, app overrides)

**Palette — light / dark**

| Token | Light | Dark |
|---|---|---|
| `bg` | `#FAF8F5` | `#0F1115` |
| `surface` | `#FFFFFF` | `#181B21` |
| `surfaceAlt` | `#F1EEE9` | `#21252D` |
| `textPrimary` | `#1B1D22` | `#F2F3F5` |
| `textSecondary` | `#5C6370` | `#A3A9B5` |
| `border` | `#E4E0DA` | `#2C313A` |
| `primary` (brand violet) | `#6C4CF1` | `#8B73FF` |
| `onPrimary` | `#FFFFFF` | `#0F1115` |
| `success` | `#1F9D61` | `#3DD68C` |
| `streak` (flame) | `#FF7A1A` | `#FF9A4D` |
| `warning` | `#C77700` | `#F2B84B` |
| `danger` | `#D23B3B` | `#FF6B6B` |
| `heat0..4` | `#EBE8E3 #C9BEFB #A08BF7 #7A5DF2 #5534D6` | `#22262E #3A2F73 #5340B0 #7058E6 #9C88FF` |

**Habit colors (12):** Violet `#7C5CFF`, Blue `#3B82F6`, Sky `#0EA5E9`, Teal `#14B8A6`, Green `#22C55E`, Lime `#84CC16`, Yellow `#EAB308`, Orange `#F97316`, Red `#EF4444`, Pink `#EC4899`, Rose `#F472B6`, Slate `#64748B`. Each has a 15%-alpha tint for row backgrounds; heatmap of a habit uses its own color at 20/45/70/100%.

**Type scale** (Inter via `expo-font`; numerals tabular): Display 32/38 bold (streak numbers) · H1 24/30 semibold · H2 20/26 semibold · Body 16/22 regular · Body-S 14/20 · Caption 12/16 medium · Overline 11/14 caps +0.5 tracking. Respect system font scale up to 1.6x; rows grow, no truncation of habit names below 2 lines.

**Iconography:** Material Symbols Rounded (via `@expo/vector-icons` MaterialCommunityIcons fallback), 24dp, 2dp stroke feel; habit icons in 40dp rounded-square tiles (radius 12).

**Shape & spacing:** 4pt grid; radius 12 (cards), 20 (sheets), full (chips, check circles). Elevation by surface tone in dark mode, soft shadow (y2 blur8 6%) in light.

**Motion:** Reanimated 3. Check: circle fill spring (damping 14, stiffness 220) + checkmark path draw 180ms. Count: ring sweep 250ms ease-out. Streak +1: number flip and flame scale 1→1.25→1. Confetti (`react-native-confetti-cannon` or Skia particles) on: first ever check-in, all-done day, streak milestones (3, 7, 14, 30, 50, 100, 365). Honour `AccessibilityInfo.isReduceMotionEnabled` → replace with fade.

**Haptics (`expo-haptics`):** check = `impactAsync(Light)`; complete count/timer target = `notificationAsync(Success)`; milestone = Success + confetti; undo = Selection; destructive confirm = Warning. Toggle in Settings.

**Accessibility:** WCAG AA contrast for text on all tokens (habit colors only used as fills with icons, never for body text); touch targets ≥48dp; each row has `accessibilityLabel` "Drink water, 3 of 8 glasses, streak 5 days" and `accessibilityActions` (increment/decrement); heatmap cells have date + value labels; TalkBack order verified; no info conveyed by color alone (check glyph + state text).

---

## 8. Core logic

All logic lives in `src/domain/` as pure functions with Jest unit tests (target 95% branch coverage on `streaks.ts`).

**Day key & rollover**
- A "day" is a local date string `YYYY-MM-DD` computed as `localDate(now − dayEndsAtOffset)`, where `settings.dayEndsAt` ∈ 0–4h (default 0). A check-in at 01:30 with `dayEndsAt=3` counts for the previous day (night owls).
- Entries store the day key, never a UTC timestamp, so travel across time zones never moves past check-ins. On timezone change (`AppState` resume compares `Intl.DateTimeFormat().resolvedOptions().timeZone`), recompute "today" and reschedule notifications.
- Midnight rollover while app is open: a timer fires at next boundary and refreshes the Today store and widget.

**Completion of a day for a habit**
- yes/no: `value === 1`. count: `value >= target`. timer: `seconds >= target*60`. Partial values give a ratio for heatmap (`min(value/target,1)`).

**Streaks by schedule type**
- *Daily:* consecutive completed days ending today (or yesterday if today not yet done; today being incomplete never breaks the streak until the day ends).
- *Specific weekdays:* iterate backwards over scheduled days only; non-scheduled days are transparent. Completing on a non-scheduled day counts as a bonus (total check-ins) but does not extend the streak.
- *X times per week:* streak unit is **weeks** (displayed "4 weeks"). A week (by `weekStartsOn`) is successful if completions ≥ X. The current week is "in progress" and never breaks the streak until it ends. Day-level streak display not shown for this type.
- *Best streak:* max run over full history, recomputed on any edit to past entries; cached in `habit.stats.best` and invalidated by edits.
- *Start date:* days before `habit.createdAt` (or user-set start) are ignored.

**Freeze rules**
- Inventory `freezes.count` 0–2 (cap 2). Sources: rewarded ad (max 1 per calendar day), perfect week bonus (all scheduled habits done Mon–Sun, max 1 per week).
- On day close (computed lazily at app open / widget refresh), for each daily/weekday habit with a missed scheduled day that would break a streak ≥2, consume 1 freeze and write `entries[day] = {frozen:true}`. One freeze protects **all habits** for that day (generous, simpler to explain). X/week habits: a freeze counts as one completion toward that week.
- Freezes are never applied retroactively more than 2 days back (user returns after 5 days → streak lost, kind copy: "Streaks end, habits don't. Start a new one today.").
- Frozen days render as ice-blue cells in heatmap and count neither as completion nor miss in %.

**Completion %**
- Habit 7/30-day %: completed scheduled days ÷ scheduled days in window (since createdAt). X/week: min(completions, X) summed ÷ X × weeks.
- Today %: completed habits ÷ habits scheduled today (X/week habits counted only if the weekly target is not yet met, or done today).

---

## 9. Local data model

Storage: `@shared/storage` (MMKV wrapper: `createStore(id)`, `get<T>(key)`, `set<T>(key, v)`, `subscribe(key, cb)`, `migrate(steps)`). Store id `habit-tracker`. State managed with Zustand stores persisted to MMKV keys. Widget reads a compact snapshot (see §11).

| Key | Type | Notes |
|---|---|---|
| `schemaVersion` | `number` | Currently `1`. |
| `habits` | `Record<HabitId, Habit>` | Includes archived. |
| `habitOrder` | `HabitId[]` | Active habits order. |
| `entries:<habitId>` | `Record<DayKey, Entry>` | Sharded per habit to keep writes small. |
| `notes` | `Record<DayKey, DayNote>` | |
| `freezes` | `FreezeState` | |
| `settings` | `Settings` | |
| `profile` | `Profile` | Goals, onboarding flags, review state. |
| `ads` | `AdState` | Frequency cap timestamps (owned by `@shared/ads` but namespaced here). |
| `widget:snapshot` | `WidgetSnapshot` | Written on every change. |

```ts
type HabitId = string;            // nanoid(10)
type DayKey = `${number}-${number}-${number}`; // YYYY-MM-DD local
type HabitType = 'boolean' | 'count' | 'timer';
type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: (0|1|2|3|4|5|6)[] }   // 0 = Sunday
  | { kind: 'perWeek'; times: 1|2|3|4|5|6 };

interface Habit {
  id: HabitId; name: string; icon: string; color: string; // hex from habit palette
  type: HabitType; target: number; unit?: string;         // boolean → target 1; timer → minutes
  schedule: Schedule; category: CategoryId;
  reminders: { time: string /* HH:mm */; notifIds: string[] }[];
  templateId?: string; createdAt: DayKey; archivedAt?: string;
  stats?: { best: number; bestComputedAt: string };       // cache
}
interface Entry { value: number; frozen?: boolean; timerStartedAt?: number; updatedAt: number }
interface DayNote { text: string; mood?: 1|2|3|4|5; updatedAt: number }
interface FreezeState { count: number; lastAdEarnDay?: DayKey; lastPerfectWeek?: DayKey; log: { day: DayKey; source: 'ad'|'perfectWeek'|'used' }[] }
interface Settings {
  theme: 'system'|'light'|'dark'; premiumTheme?: { id: string; unlockedUntil: number };
  weekStartsOn: 0|1; dayEndsAtHour: 0|1|2|3|4; haptics: boolean;
  dailySummary: { enabled: boolean; time: string }; eveningNudge: { enabled: boolean; time: string };
}
interface Profile {
  goals: GoalId[]; onboardingDone: boolean; firstOpenAt: number; openDays: DayKey[]; // capped 60
  notifPermission: 'unknown'|'granted'|'denied'; notifReasked: boolean;
  review: { prompted: boolean; promptedAt?: number };
}
interface BackupFile { app: 'habit-tracker'; schemaVersion: number; exportedAt: string;
  habits: Habit[]; habitOrder: HabitId[]; entries: Record<HabitId, Record<DayKey, Entry>>;
  notes: Record<DayKey, DayNote>; freezes: FreezeState; settings: Settings }
```

**Migrations:** `migrations.ts` exports ordered `{ to: number; up(store) }[]`; run synchronously at boot before render (`@shared/storage.migrate`). Each migration is idempotent and unit-tested with fixture snapshots. Backups carry `schemaVersion`; import runs the same migrations on the parsed object; a backup with a higher version than the app is rejected. Before any migration, a copy of raw values is written to `backup:pre-v<N>` (deleted after 2 successful launches).

---

## 10. Notifications (`expo-notifications`, local only)

- **Channels:** `reminders` (default importance), `summary` (low), `streak` (high). Users can mute per channel in system settings.
- **Per-habit reminders:** For daily/weekdays schedules use `WEEKLY` triggers per scheduled weekday (≤7 per reminder time). For X/week habits, a daily trigger that is cancelled for the rest of the week once the weekly target is met (re-planned on each check-in). Body: "💧 Drink water — 3 of 8 glasses so far". Action buttons: "Done ✓" (yes/no; handled in background task, updates MMKV + widget) and "Snooze 1h" (v1.1).
- **Daily summary** (default off; offered after day 3): at chosen time, "You have 3 habits left today. You've got this."
- **Evening streak nudge** (default on if permission granted, 20:30): scheduled per day only if at least one streak ≥2 is at risk; content computed at schedule time and re-planned on every check-in and app open, so it is cancelled once everything is done. Copy: "🔥 Your 6-day streak ends at midnight. One tap keeps it alive."
- **Budget:** Android caps scheduled alarms per app (~500); we keep ≤64 scheduled notifications by planning a rolling 7-day window and rescheduling on app open, widget refresh and `BOOT_COMPLETED` (expo-notifications restores on reboot).
- **Exact alarms:** We do **not** request `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` (Play policy restricts these to alarm/calendar apps). Reminders use inexact alarms (may drift a few minutes under Doze), which is acceptable and stated nowhere as "exact".
- **Permission:** Android 13+ runtime prompt only from onboarding step 4 or the day-3 banner; if denied, Settings shows "Reminders are off. Enable in system settings" with `Linking.openSettings()`.
- **Limits:** max 3 notifications/day total from summary + nudge + reminders beyond per-habit ones; no notification if the app was opened in the last 30 min (nudge only).

---

## 11. Widget spec (`react-native-android-widget` + config plugin)

- **Today widget (v1.0)** — sizes 4x2 (default, resizable to 4x3/4x4). Header: "Today · 3/5" + small ring; rows: icon tile, name, check button (yes/no) or "+1" (count) with "3/8". Timer habits show "Open" (deep link). Max 5 rows at 4x2, 8 at 4x4; "+2 more" footer link.
- **Interactions:** `clickAction` on row button → widget task handler updates MMKV entry (MMKV opened in the headless task with the same instance id), recalculates streak, writes `widget:snapshot`, re-renders the widget (<1s). Tap header → `habittracker://today`.
- **Data contract:** `WidgetSnapshot { day: DayKey; theme: 'light'|'dark'; items: { id, name, icon, color, type, value, target, done, streak }[]; doneCount; total; generatedAt }` — app writes it on every mutation and calls `requestWidgetUpdate()`.
- **Refresh:** on app change; `updatePeriodMillis` 30 min fallback; day rollover handled by comparing `snapshot.day` to current day key in the task handler and rebuilding.
- **Theming:** follows app theme setting; system dark mode when set to System. Rounded 24dp corners, dynamic-color friendly surfaces.
- **Discovery:** post-first-check-in sheet, Settings "Add widget" row, and Today tip on day 2 using `requestWidgetPin` where launcher supports pinning, else a 3-step GIF guide.
- **v1.1:** 2x2 Single-habit widget (big streak number + 5-week mini heatmap) with configuration activity to pick the habit.
- **Ads:** never in widgets (policy).

---

## 12. AdMob placement map (`@shared/ads`, `react-native-google-mobile-ads`)

All ad calls go through `@shared/ads`; frequency caps persisted in MMKV. Nothing is requested until `@shared/consent.canRequestAds()` is true. Test IDs in dev builds via `__DEV__`.

| Format | Placement id | Where / trigger | Frequency cap | Never show |
|---|---|---|---|---|
| Adaptive banner | `today_bottom` | `<AdBanner placement="today_bottom" />` anchored above tab bar on Today | Always loaded on Today; refresh 60s (AdMob managed) | During onboarding; on first session ever before first check-in; on modals/sheets |
| Native advanced | `stats_list` | `<NativeAdCard placement="stats_list" />` after 3rd habit card on Stats, styled as card with "Ad" label | 1 per screen view | When user has <3 habits; in habit detail; in widget |
| Interstitial | `leave_stats` / `after_edit` | `showInterstitial('leave_stats')` when navigating away from Stats tab; `showInterstitial('after_edit')` after saving an edited habit and modal closes | Global ≥3 min between interstitials, max 6/day, not in first session, not within 30s after app open | Right after a check-in tap; during onboarding; after creating the first 3 habits; when a rewarded ad was shown in last 3 min |
| Rewarded | `streak_freeze` | `showRewarded('streak_freeze')` from Settings/streak-at-risk card "Watch an ad to earn a freeze" | 1 freeze earned/day; inventory cap 2 | Never auto-played; never as only way out of a dialog |
| Rewarded | `theme_unlock` | `showRewarded('theme_unlock')` on premium theme tile → theme unlocked 24h | 1 per theme per 24h | — |
| App open | `app_open_warm` | Warm start (returning from background >4h) only | Only after day 2 (≥2 distinct open days), max 1 per 4h | Cold start; launches from widget tap or notification tap; during onboarding |

**Mediation:** AdMob as primary with bidding partners added at launch: Meta Audience Network (bidding), AppLovin (bidding), Unity Ads, Liftoff/Vungle, Mintegral; configured in AdMob console, adapters via config plugin. Start with AdMob-only for week 1 to baseline eCPM, then enable mediation in week 2. eCPM floors: interstitial tiered floors $1.50/$0.80/none (US); rewarded $4/$2/none.

**app-ads.txt** on the developer website root with the AdMob publisher line plus each mediation partner's lines.

---

## 13. Retention loops & in-app review

- **Daily loop:** reminder → widget check-off → streak +1 → evening nudge if at risk.
- **Weekly loop:** Monday "Last week: 82% · best day Thu" card on Today; perfect week → free freeze.
- **Milestones:** 3/7/14/30/50/100/365 streak celebrations with shareable card (v2.0 share).
- **Recovery:** after a broken streak, show best streak preserved + "Start again" and suggest a smaller target (e.g. 8 → 5 glasses).
- **Re-engagement:** if no open for 2 days and notifications granted, one "We saved your spot" reminder; never more than one.
- **In-app review** (`expo-store-review`): first time any habit reaches a **3-day streak**, prompted 2s after the celebration animation ends, only if no ad was shown in that session and the app hasn't crashed in the session. Fallback second attempt at a 14-day streak if the first was >30 days ago. Never ask on a missed-day screen. No pre-prompt gating ("Do you like us?") to stay within Play policy.

---

## 14. Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK latest (55+), React Native New Architecture, TypeScript strict |
| Routing | Expo Router (typed routes) |
| State | Zustand + MMKV persistence (`react-native-mmkv` via `@shared/storage`) |
| Animation | Reanimated 3, Gesture Handler, `react-native-draggable-flatlist` (reorder) |
| Lists | FlashList |
| Charts | `react-native-svg` custom heatmap + `victory-native` (Skia) bar charts |
| Widget | `react-native-android-widget` + its Expo config plugin |
| Notifications | `expo-notifications` |
| Backup | `expo-file-system`, `expo-sharing`, `expo-document-picker`, `zod` for schema validation |
| Ads / consent | `react-native-google-mobile-ads` (EAS dev build), UMP via `@shared/consent` |
| Other | `expo-haptics`, `expo-store-review`, `expo-localization` + `i18next`, `expo-font`, `date-fns` |
| Testing | Jest + `@testing-library/react-native`; Maestro flows for onboarding/check-in/widget |
| Build | EAS Build (development, preview, production AAB), EAS Submit to internal track |

---

## 15. Folder structure

```
apps/habit-tracker/
├── app.config.ts            # plugins: google-mobile-ads, android-widget, notifications, build-properties
├── eas.json
├── app/
│   ├── _layout.tsx          # providers: theme, consent gate, ads init, migrations
│   ├── (onboarding)/{_layout,welcome,goals,templates,reminder,notifications}.tsx
│   ├── (tabs)/{_layout,index,stats,settings}.tsx
│   ├── habit/new.tsx · habit/[id]/index.tsx · habit/[id]/edit.tsx
│   ├── templates.tsx · note/[date].tsx · archive.tsx · backup.tsx
├── src/
│   ├── domain/              # streaks.ts, schedule.ts, dayKey.ts, completion.ts, freezes.ts (+ __tests__)
│   ├── store/               # habits.ts, entries.ts, settings.ts, profile.ts, migrations.ts
│   ├── features/
│   │   ├── today/ habit-editor/ stats/ heatmap/ templates/ backup/ celebrations/
│   ├── notifications/       # scheduler.ts, channels.ts, handlers.ts
│   ├── widget/              # TodayWidget.tsx, widgetTaskHandler.ts, snapshot.ts
│   ├── ads/                 # placements.ts (ids + caps config passed to @shared/ads)
│   ├── data/templates.ts    # 40+ templates
│   ├── i18n/                # en.json, es.json, pt-BR.json, de.json, fr.json, id.json
│   └── ui/                  # HabitRow, CheckButton, CountRing, TimerButton, StreakBadge
├── assets/ (icon, adaptive-icon, splash, lottie/, fonts/)
├── DEVELOPMENT_PLAN.md
└── ASO.md
```

Shared imports: `@shared/ads`, `@shared/storage`, `@shared/onboarding`, `@shared/theme`, `@shared/consent` from `packages/shared`.

---

## 16. KPIs

| Metric | Target (first 60 days) | Source |
|---|---|---|
| Store listing conversion (US) | ≥30% | Play Console |
| Onboarding completion | ≥75% | local counter surfaced via Play pre-launch / Maestro, cohort proxy |
| Time to first check-in | median ≤45s | internal testing |
| D1 retention | ≥35% | Play Console retention |
| D7 retention | ≥15% | Play Console |
| D30 retention | ≥7% | Play Console |
| Widget adoption | ≥20% of DAU | AdMob/Play proxies; internal test cohorts |
| Rating | ≥4.5, crash-free ≥99.5%, ANR <0.3% | Play Console vitals |
| ARPDAU | $0.012 (all geos), $0.03 US | AdMob |
| Rewarded opt-in | ≥8% of DAU/day | AdMob impressions ÷ DAU |
| Impressions/DAU | banner 8–12, interstitial ≤1.2 | AdMob |

---

## 17. Milestones (7-day MVP)

| Day | Deliverables | Done when |
|---|---|---|
| 1 | Scaffold app in monorepo, Expo Router tabs, `@shared/theme` tokens, MMKV stores + migrations, domain types; EAS dev build with ads + widget plugins compiling | Dev build installs on device; unit test harness green |
| 2 | Domain logic: day keys, schedules, streaks, freezes, completion % with full tests; Today screen with yes/no + count habits | ≥40 streak/schedule tests pass; check-in persists across kill |
| 3 | Timer habits, habit editor, templates library (40), categories, reorder, archive | Create/edit/archive/reorder flows work end-to-end |
| 4 | Habit detail + heatmap, Stats screen, day notes, dark mode, celebrations + haptics | Heatmap renders 365 days at 60fps on mid-range device |
| 5 | Notifications (reminders, summary, nudge), Android widget with interactive check | Widget toggle reflects in app within 1s and vice-versa |
| 6 | Onboarding flow, UMP consent, all ad placements with caps, backup/restore, in-app review | Maestro: install → first check-in ≤45s; ads show only per map |
| 7 | QA pass, a11y pass, store assets, Play listing, internal → closed testing release | Checklist §18 complete; AAB uploaded |

Note: new personal Play developer accounts need a 12-tester / 14-day closed test before production. Start closed testing on day 7; production launch ≈ day 21.

---

## 18. QA & Play release checklist

**Functional QA**
- [ ] Streaks correct across daily / weekdays / per-week, DST change, timezone change, `dayEndsAt` 0–4, editing past days.
- [ ] Freeze consumed only per rules; cap 2; 1 ad-earned per day.
- [ ] Widget: add, toggle, resize, dark mode, after reboot, after app update, day rollover.
- [ ] Notifications: permission granted/denied, reboot, X/week cancellation, nudge cancelled after completion.
- [ ] Backup: export → uninstall → reinstall → import restores everything; corrupt/newer-version files rejected gracefully.
- [ ] Ads: test IDs in dev; no interstitial after check-in; caps honoured; consent form in EEA (use UMP debug geography); privacy options in Settings.
- [ ] Performance: cold start <1.5s on Pixel 4a class; no jank on Today with 30 habits.
- [ ] Accessibility: TalkBack full flow, font scale 1.6x, contrast audit.

**Play Console**
- [ ] **Data safety:** App collects no user data itself. Declare data collected/shared by the Google Mobile Ads SDK: Device or other IDs (advertising ID), App interactions, Diagnostics, approximate location (IP-derived) — purposes: Advertising/marketing, Analytics, Fraud prevention; encrypted in transit; users can't request deletion (no account). Note "Data is not collected by the developer; backups are user-initiated files."
- [ ] `AD_ID` permission declared (ads SDK) and "Contains ads" = Yes.
- [ ] **Content rating** (IARC questionnaire): no violence/user content/purchases → expected Everyone / PEGI 3.
- [ ] **Target audience:** 13+ (13–15, 16–17, 18+). Not designed for children; do not opt into Families. Set `tagForUnderAgeOfConsent` handling via UMP; ads content rating max **T**.
- [ ] **Privacy policy** URL (shared portfolio site page) covering local storage, AdMob, UMP, no developer collection.
- [ ] **app-ads.txt** live on developer website listed in Play Console; verified in AdMob.
- [ ] Permissions review: `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `AD_ID`; no exact-alarm, no storage permissions (SAF/share only).
- [ ] Target API level = Play's current requirement; 16 KB page size compatible build.
- [ ] Store listing per `ASO.md`; screenshots 1080x1920; feature graphic 1024x500.
- [ ] Pre-launch report clean; closed test (12 testers, 14 days) completed; staged rollout 20% → 50% → 100%.
