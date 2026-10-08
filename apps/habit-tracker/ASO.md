# Habit Tracker — ASO Plan (Google Play)

> Market: Google Play US, en-US first. Data: Applyra (traffic / difficulty, 0–100). Validated with Applyra `check_metadata` (GPLAY) and `run_autocomplete` on 2026-10-08.
> Category: **Productivity** · Contains ads: Yes · Price: Free (no IAP)

---

## 1. Final metadata

| Field | Text | Length / limit |
|---|---|---|
| **Title** | `Habit Tracker: Streak & Widget` | 30 / 30 |
| **Short description** | `Habit tracker app for daily routines, streaks, reminders & a home screen widget` | 79 / 80 |
| **Full description** | See §1.1 | 2,571 / 4,000 |
| Launcher label | `Habits` | — |
| Developer name | Portfolio studio name (same across all 5 apps) | — |

**Why this title:** exact-match "Habit Tracker" at the start (head term for "habit tracker free" 39/18, "habit tracker app" 25/20, "habit tracker free app" 25/18 — Play matches the "free"/"app" modifiers from the description and short description), plus "Streak" and "Widget", which cover "habit tracker widget" (8/18, top autocomplete suggestion) and "habit tracker streak" / "daily habit streak". "Free" is not allowed in the title or short description, so it appears only in the full description.

### 1.1 Full description

```
Build better habits one tiny check-in at a time. Habit Tracker is a simple, beautiful daily routine planner that helps you start good habits, break bad ones and keep your streak alive, right from your home screen.

No account. No subscription. No paywall. Every feature is free to use, and your data stays on your phone.

BUILT FOR BEGINNERS
Not sure where to start? Pick a goal (get fit, sleep better, be productive, mental wellbeing or break a bad habit) and choose from a library of ready-made habit templates. You will check off your first habit in under a minute.

TRACK ANY KIND OF HABIT
• Yes/no habits: meditate, read, make your bed
• Count habits: drink 8 glasses of water, do 50 push-ups
• Timed habits: study for 25 minutes, stretch for 10
• Flexible schedules: every day, 3 times a week or specific weekdays
• Categories, colors and icons to keep your routine organized
• Archive habits you have finished and reorder the rest with a drag

STREAKS THAT MOTIVATE
Watch your daily streak grow and beat your best streak. Missed a day for a good reason? Earn a streak freeze and protect your progress. Celebrate every check-in with satisfying animations and haptics.

HOME SCREEN WIDGET
Check off habits without opening the app. Our Android widget shows today's habits and your streak at a glance, in light or dark mode. It is the fastest habit checklist you will ever use.

PROGRESS CHARTS AND CALENDAR
• A GitHub-style heatmap calendar for every habit
• Weekly and monthly completion rates
• Current streak, best streak and total check-ins
• Habit progress charts that show how far you have come

SMART REMINDERS
Set a reminder time for each habit, get a gentle daily summary, and an optional evening nudge so you never break your streak by accident. You decide how many notifications you get.

DAILY JOURNAL
Add a short note to any day. Write how you felt, what worked and what did not. Your habit journal turns into a record of your self improvement journey.

PRIVATE AND OFFLINE
Habit Tracker works fully offline. There is no sign-up and no cloud. Back up your habits to a file and restore them on a new phone whenever you like.

GREAT FOR
• Students building a study routine
• Anyone starting a fitness or weight loss journey
• Morning and evening routines
• Mental health and mindfulness habits
• Productivity, goal setting and focus
• Quitting a bad habit like late-night scrolling

Habit Tracker is supported by ads, which is how we keep every feature free for everyone. Ads never interrupt a check-in.

Start small today. Your future self will thank you.
```

Keyword density (approx.): "habit" 23x / 432 words (~5%, includes "habits"), "habit tracker" 3x, "streak" 9x, "routine" 5x, "widget" 2x, "free" 3x (natural, description only), "reminder" 2x. Long tails woven in naturally: beginners, checklist, progress chart(s), calendar, journal, goal setting, self improvement, mental health, weight loss, productivity, routine planner.

### 1.2 Applyra validation log

| Check | Input | Result |
|---|---|---|
| `check_metadata` #1 (GPLAY) | Title + short desc `Free habit tracker: daily routine, streaks, reminders & home screen widget` + full desc | **valid: false** — short description ERROR (rule `price`): "free" is promotional; Play's metadata policy bans price/promo terms in the short description. Title 30/30 OK, full description 2,571/4,000 with **no warnings**. |
| `check_metadata` #2 (GPLAY) | Title + final short description | **valid: true**, 0 warnings. Title 30/30, short 79/80. |
| `run_autocomplete` "habit tracker" (US, en-US) | — | habit tracker · habit tracker free · habit tracker widget · habit tracker app · habit tracker free app |
| `run_autocomplete` "habit tracker w" (US, en-US) | — | habit tracker widget · habit tracker with widget · habit tracker with graph · habit tracker widget free · habit tracker wallpaper |

Takeaway: "widget" is the #3 completion after the bare head term and has its own sub-tree (with widget, widget free) — justifies "Widget" in the title. "habit tracker with graph" supports the heatmap/progress chart screenshots.

---

## 2. Keyword research

| Keyword | Traffic | Difficulty | Priority | Placement |
|---|---|---|---|---|
| habit tracker free | 39 | 18 | P0 (best opportunity, cluster score 47) | Title (habit tracker) + description ("free") |
| habit tracker app | 25 | 20 | P0 | Title + short |
| habit tracker free app | 25 | 18 | P0 | Title + short + description |
| habit tracker widget | 8 | 18 | P0 (differentiator, autocomplete #3) | Title + short + desc |
| habit tracker streak | 8 | 35 | P1 (hardest long tail) | Title (streak) + desc |
| daily habit streak | 8 | 24 | P1 | Desc ("daily streak") |
| habit tracker routine | 8 | 28 | P1 | Short + desc |
| habit tracker reminder | 8 | 20 | P1 | Short + desc |
| habit tracker for beginners | 8 | 18 | P1 | Desc ("built for beginners") |
| habit tracker checklist | 8 | 18 | P1 | Desc |
| habit tracker calendar | 8 | 21 | P1 | Desc |
| habit progress chart | 8 | 20 | P1 | Desc |
| habit tracker progress | 8 | 15 | P1 (easiest) | Desc |
| habit tracker goal setting | 8 | 17 | P2 | Desc |
| habit tracker journal | 8 | 24 | P2 | Desc |
| habit tracker planner | 8 | 24 | P2 | Desc ("routine planner") |
| habit tracker timer | 8 | 18 | P2 | Desc ("timed habits") |
| habit tracker self improvement | 8 | 21 | P2 | Desc |
| habit tracker productivity | 8 | 20 | P2 | Desc |
| habit tracker mental health | 8 | 24 | P2 | Desc |
| habit tracker weight loss | 8 | 22 | P2 | Desc |
| habit building checklist | 8 | 19 | P2 | Desc |
| habit tracker for kids | 8 | 18 | Skip | Target audience is 13+; not designed for children (Families policy risk) |

---

## 3. Competitors

| App | Package | Rating | Model | Strengths | Our angle |
|---|---|---|---|---|---|
| Loop Habit Tracker | org.isoron.uhabits | 4.7 | Free, open source, no ads | Trusted, private, widgets, strength score | Prettier UI, guided onboarding, templates, celebrations |
| HabitKit | com.roehl.habitkit | ~4.7 | Freemium, subscription | Beautiful heatmap grids | Same grid aesthetic, no habit limit, widget free |
| HabitNow Daily Routine Planner | com.habitnow | ~4.6 | Freemium, premium unlock | Tasks + habits, many options | Simpler, beginner-first, no paywall |
| Habit Pixel | (pixel-art tracker) | ~4.6 | Freemium | Cute aesthetic | Cleaner, broader audience, widget-first |
| Habitica | com.habitrpg.android.habitica | ~4.3 | Freemium, gems/subscription | Gamification, social | No account, offline, calm motivation |
| HabitGrid | (grid tracker) | ~4.5 | Freemium | Minimal grid | Count/timer habits, reminders, journal |
| Habit Tracker – Habit Diary | (diary tracker) | ~4.5 | Ads + premium | Exact-match name | Better design, widget interactivity, freezes |

Gaps we own: beginner guided onboarding with templates, gorgeous interactive widget, offline privacy, motivation without subscriptions ("Every feature is free").

---

## 4. Keyword placement strategy

1. **Title (strongest weight):** "Habit Tracker" exact match first → wins the habit tracker cluster; "Streak" + "Widget" target two intent long tails.
2. **Short description:** repeats "habit tracker app" (exact P0 phrase), adds "daily routines", "streaks", "reminders", "home screen widget".
3. **Full description:** first 2 lines restate core value with "habit", "daily routine planner", "streak", "home screen"; section headers mirror long tails (beginners, widget, progress charts and calendar, reminders, journal); "free" used 3x naturally (no stuffing; Play penalises repetition >~3% for one word phrase).
4. **Developer name / other apps:** cross-portfolio name builds brand; Water Reminder listing can link users conceptually ("habit" not used there to avoid cannibalisation).
5. **Do not use:** "free", "#1", "best", "top", "new" in title/short; competitor names anywhere; "for kids".

---

## 5. Icon concept

- Rounded square, brand violet `#6C4CF1` → `#8B73FF` vertical gradient background.
- Foreground: a white bold checkmark whose tail curves up into a small orange flame (`#FF7A1A`) — "check + streak" in one glyph.
- Variant B for A/B (Store listing experiment): 3x3 mini heatmap grid with the last cell as a check.
- Adaptive icon: foreground in 66dp safe zone, monochrome layer for Android 13 themed icons.
- Avoid text in icon; test at 48px for legibility.

---

## 6. Screenshot storyboard (8, 1080x1920, portrait)

Style: device-less framed UI on a soft violet gradient, caption at top in Inter Bold 64px, max 5 words, one accent word in orange.

| # | Screen shown | Caption |
|---|---|---|
| 1 | Today screen, 4 habits, 2 checked, flame streak 12, confetti burst | **Build habits that stick** |
| 2 | Home screen with the Today widget (light + dark side by side) | **Check off from your home screen** |
| 3 | Habit detail: GitHub-style heatmap + current/best streak | **See your progress grow** |
| 4 | Count + timer habits (water 5/8 ring, study 18/25 min) | **Track water, workouts, study time** |
| 5 | Onboarding goal + template picker | **Start in seconds with templates** |
| 6 | Streak freeze card ("Freeze saved your 21-day streak") | **Missed a day? Keep your streak** |
| 7 | Reminder settings + notification preview | **Gentle reminders, your way** |
| 8 | Privacy/backup screen with "No account · Offline · All features free" | **Private. Offline. No paywall.** |

---

## 7. Feature graphic (1024x500)

Left: title "Habit Tracker" + tagline "Streaks & widget, no paywall". Right: phone home screen showing the widget with three checked habits and a 30-day streak flame; background violet gradient with a faint heatmap pattern. No small text, no "free" badge, no ranking claims.

## 8. Promo video idea (YouTube, 20–25s, vertical-friendly cut)

1. 0–3s: Thumb taps a check on the home-screen widget → streak flips 6 → 7 🔥 (hook).
2. 3–8s: Onboarding: "Sleep better" → pick 2 templates → first check-in + confetti.
3. 8–14s: Count ring fills (water), timer completes (study), haptic pulse visual.
4. 14–19s: Heatmap scrolls through 3 months filling with color.
5. 19–25s: End card: icon, "Habit Tracker: Streak & Widget", "Every feature free. No account."

---

## 9. Localization priorities

Top 10 (by Play habit-category install volume and ad eCPM mix): **en-US** (+en-GB, en-IN copy), **es-419/es-ES**, **pt-BR**, **de-DE**, **fr-FR**, **id-ID**, **hi-IN**, **ja-JP**, **ru-RU**, **it-IT**. Turkish and Korean are next candidates.

| Locale | Localized title (≤30) | Length | Notes |
|---|---|---|---|
| es (es-419, es-ES) | `Rastreador de hábitos y rutina` | 30 | Local term "hábitos"; also test "Habit Tracker: …" variant (English search share is high in LATAM) |
| pt-BR | `Rastreador de Hábitos e Rotina` | 30 | Alt: "Hábitos Diários: Rotina e Meta" (30) |
| de | `Habit Tracker: Gewohnheiten` | 27 | Germans search the English "habit tracker" heavily |
| fr | `Suivi d'habitudes : Routine` | 27 | French typographic space before colon |
| id | `Habit Tracker: Rutin Harian` | 27 | English term dominant; "rutin harian" = daily routine |

Short descriptions and screenshots captions translated by a native reviewer (not machine only); run `check_metadata` per locale before upload (character counts differ in UTF-16 for accented text).

---

## 10. Rating strategy

- In-app review via `expo-store-review` when a habit first reaches a **3-day streak**, right after the celebration (peak positive emotion), never in a session with an ad just shown; second chance at 14-day streak after ≥30 days.
- No gating pre-prompt; no rewards for reviews (policy).
- Settings → "Rate us" link always available.
- Feedback: Settings → "Send feedback" opens email with app version/device (no data collection).
- Reply to every review ≤3★ within 48h in week 1–4; ship fixes and reply "Fixed in 1.0.x".
- Target ≥4.5 average by 200 ratings.

---

## 11. ASO iteration plan

| When | Actions (Applyra) | Decision rule |
|---|---|---|
| **Launch (week 0)** | `add_application` for our package; `track_keywords` for all P0/P1 rows above (US en-US); `add_competitor` Loop, HabitKit, HabitNow, Habit Pixel, Habitica | Baseline ranks recorded |
| **Week 2** | `get_keyword_rank_history` + `get_aso_health`; check Play Console search terms report; `run_autocomplete` on "habit tracker w", "daily habit", "routine" | If not top-30 for "habit tracker free" → strengthen description first paragraph; add new long tails from autocomplete |
| **Week 4** | `simulate_metadata` for title alternatives: "Habit Tracker: Streaks & Widget" vs "Habit Tracker – Daily Routine" vs current; Store listing experiment on icon A vs B and screenshot 1 caption | Ship variant with ≥+5% install conversion at 90% confidence; keep title stable unless simulation shows clear rank gain |
| **Week 8** | Rollout localized listings (es, pt-BR, de, fr, id) with `check_metadata` per locale; `track_keywords` in those locales; `run_niche_analysis` on "routine planner" and "streak" | Expand to next 5 locales if localized CVR ≥ US CVR −5pts |

Ongoing: update screenshots each major release (v1.1 widget themes, v2.0 quit habits), seasonal promo text in January ("New year, new habits" — description only, not title).

---

## 12. Category & tags

- **Category:** Productivity (primary). Health & Fitness considered but more competitive; revisit week 8.
- **Store tags (choose up to 5 in Play Console):** Habit tracker, Productivity, Planner, Self-improvement, Reminders/To-do (closest available tags).
- **Contact details:** support email + website (hosts privacy policy and app-ads.txt).
- **Content rating:** Everyone (IARC) · Target audience 13+ · Contains ads.
