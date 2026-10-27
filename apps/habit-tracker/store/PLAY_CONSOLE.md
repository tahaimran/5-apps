# Play Console paste sheet: Habit Tracker: Streak & Widget

Work through Play Console from top to bottom with this sheet open, copying each field from here. Written 2026-10-27
from `ASO.md` (§1, §1.1, §12), `store/DATA_SAFETY.md`, `store/CONTENT_RATING.md`, `store/SCREENSHOTS.md`,
`WHATS_LEFT.md` §4, `RELEASE.md`, `app.config.ts`, `eas.json` and `docs/PLAY_UPLOAD.md` (§A, §C, §D1, §E). This sheet
is a copy for convenience. If anything differs, `ASO.md` and the files in `store/` are the source of truth, so fix it
there first and then here.

## 0. Before you start

| Field | Value |
|---|---|
| Package name | `com.fiveapps.habittracker` (from `app.config.ts`). **This is a placeholder and becomes permanent after the first upload.** If you change it, also change `packages/shared/src/crosspromo/catalog.ts` and the AdMob app. |
| App name (Create app) | `Habit Tracker: Streak & Widget` (the launcher label on the phone is `Habits`) |
| Default language | English (United States) – en-US |
| App or game | **App** |
| Free or paid | **Free** |
| Declarations | Tick **Developer Program Policies** and tick **US export laws** |
| Version | `1.0.0`, versionCode `1` (`app.config.ts`; EAS manages versionCode remotely and auto-increments it for production builds) |

Developer account name (set once for all 5 apps): **Taha Imran**.

## 1. Store settings

**App category:** App → **Productivity**

**Tags (max 5).** Pick these or the closest match in Play's list (ASO.md §12):
1. Habit tracker
2. Productivity
3. Planner
4. Self-improvement
5. Reminders / To-do (whichever is the closest available tag)

**Store listing contact details**

Email:
```
tahaimran.24@gmail.com
```
Website:
```
https://www.tahaimran.com/
```
Phone: leave empty (optional).

## 2. Main store listing

**App name** (30 / 30)
```
Habit Tracker: Streak & Widget
```

**Short description** (79 / 80)
```
Habit tracker app for daily routines, streaks, reminders & a home screen widget
```

**Full description** (2,571 / 4,000)
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

**App icon:** `store/icon-512.png` (512×512 PNG)

**Feature graphic:** `store/feature-graphic-1024x500.png` (1024×500, 24-bit PNG, no alpha)

**Phone screenshots.** Upload these 8 files from `store/screenshots/`, all 1080×1920, in this order. Shots 1 to 3 show in search results.

| # | File | Caption (sub-line) |
|---|---|---|
| 1 | `01-build-habits.png` | Build habits that stick (Daily streaks, reminders & a widget) |
| 2 | `02-widget.png` | Check off from your home screen (Tick habits without opening the app) |
| 3 | `03-progress.png` | See your progress grow (Heatmap, best streak & completion rates) |
| 4 | `04-count-timer.png` | Track water, workouts & study time (Yes/no, counts and timers) |
| 5 | `05-stats.png` | Weekly stats that motivate (Every check-in adds up) |
| 6 | `06-streak-freeze.png` | Missed a day? Keep your streak (Streak freezes protect your progress) |
| 7 | `07-reminders.png` | Gentle reminders, your way (Pick the time for each habit) |
| 8 | `08-private.png` | Private. Offline. No sign-up. (Your habits stay on your phone) |

**Tablet screenshots (7-inch and 10-inch):** optional. Skip them, because the app is phone-only and portrait-only.

**Video (YouTube URL):** leave empty. ASO.md §8 has only an idea for a promo video, and no video exists yet.

## 3. App content (Policy → App content)

### 3.1 Privacy policy
```
https://www.tahaimran.com/apps/habits/privacy/
```

### 3.2 App access
Pick **All functionality is available without special access**. The app has no login and no account.

### 3.3 Ads
Pick **Yes, my app contains ads** (Google AdMob only, no mediation).

### 3.4 Content rating (IARC questionnaire)

- Email address:
  ```
  tahaimran.24@gmail.com
  ```
- Category: pick the **utility / productivity / tool** category. CONTENT_RATING.md describes it as "Productivity (utility, reference, or tool app)". This is not a game.

| Question (group) | Answer |
|---|---|
| Violence, blood | No |
| Fear | No |
| Sexual content, nudity | No |
| Profanity / crude language | No |
| Gambling, simulated gambling | No |
| **References to alcohol, tobacco or drugs** | **Owner decision, see below** |
| User-generated content or user-to-user interaction | No (notes are private and stay on the device) |
| Shares the user's location with other users | No |
| Purchases of digital goods | No (no IAP, no paywall) |
| Ads | Yes (AdMob; max ad content rating T; sensitive categories blocked in AdMob) |
| Unrestricted internet access / web browser | No |

**Owner decision: the substance-reference question.** The template library (category "Quit") ships "No smoking" and
"No alcohol", and onboarding offers the goal "🚭 Break a bad habit".

| | Option A (recommended) | Option B |
|---|---|---|
| What you do | Keep the templates and answer **Yes**: the app references tobacco and alcohol, in a context of quitting them | Remove the "No smoking" and "No alcohol" templates in code, ship that build, then answer **No** |
| Expected rating | It may come out above Everyone (for example PEGI 7 or a Teen-style result in some regions). IARC shows the real result. | Everyone / PEGI 3 (the plan's expectation) |
| Reason | It is the truthful answer for the app as built, and the impact is small because the target audience is already 13+ | It is only valid once the templates are gone. Renaming them, for example to "Stay smoke-free", still mentions tobacco. |

Do not answer No while the templates ship, because a mismatch can get the listing rejected. When you get the rating,
write the final answers and the rating into `store/CONTENT_RATING.md`.

### 3.5 Target audience and content
- Target age groups: tick **13–15**, **16–17**, **18 and over**. Leave every age group under 13 unticked.
- Appeals to children: **No**. The app is not designed for children, and the listing does not target kids (ASO.md §2 skips "for kids").
- Store presence / Families: **do not** opt into the Designed for Families program.

### 3.6 News app
**No**

### 3.7 Data safety

Developer-collected data: **none**. The app has no account, no backend and no analytics SDK. Habit names, check-ins,
notes and backup files stay on the device, or go wherever the user sends them, so do not declare them. Only the
Google Mobile Ads SDK and the Google UMP consent SDK collect data. Re-check Google's current AdMob guidance before
submitting: https://support.google.com/admob/answer/10106796

**Screen 1: Data collection and security**

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (the ads SDK uses HTTPS) |
| Account creation | **My app does not allow users to create an account** |
| Do you provide a way for users to request that their data is deleted? | **No**. The developer holds no data. If Play asks for a description, paste the text below. |

```
Uninstalling the app removes all data held by the app. Ad data is managed through Google.
```

Committed to the Play Families policy: **No**. Independent security review: **No**.

**Screen 2: Data types.** Tick only these:
- Location → **Approximate location**
- App activity → **App interactions**
- App info and performance → **Crash logs**, **Diagnostics**
- Device or other IDs → **Device or other IDs**

Leave everything else unticked: name, email, user IDs, address, phone, precise location, contacts, photos, audio,
files, health and fitness, financial info, messages, web history, calendar.

**Screen 3: Usage for each data type**

| Data type | Collected | Shared | Processed ephemerally? | Required or optional | Purposes (collected and shared) |
|---|---|---|---|---|---|
| Approximate location (from IP) | Yes | Yes (Google) | No | Required (users can't turn it off; they can reset or opt out of the ad ID and use Privacy choices) | Advertising or marketing; Fraud prevention, security, and compliance |
| App interactions (ad impressions/clicks) | Yes | Yes (Google) | No | Required | Advertising or marketing; Analytics |
| Crash logs | Yes | Yes (Google) | No | Required | Analytics; Fraud prevention, security, and compliance |
| Diagnostics | Yes | Yes (Google) | No | Required | Analytics; Fraud prevention, security, and compliance |
| Device or other IDs (advertising ID) | Yes | Yes (Google) | No | Required | Advertising or marketing; Fraud prevention, security, and compliance |

"Processed ephemerally" is **No** for every row: the ads SDK sends this data to Google's servers, so it is not only held in memory.

No Data safety owner decision applies here, because this app has no "Send feedback" or "Report" mailto button.

### 3.8 Government apps
**No**

### 3.9 Financial features
Pick **My app doesn't provide any financial features**.

### 3.10 Health apps
Pick **My app does not have any health features**. Both `store/DATA_SAFETY.md` and `docs/PLAY_UPLOAD.md` §D1 say no
health features and no medical claims. There is no `store/HEALTH_DECLARATION.md` for this app.
Not in the docs: WHATS_LEFT §4 says to check what Play asks. The app has Health / Fitness / Mind template categories
and goals such as "Sleep better" and "Mental wellbeing", but it measures no health data. Read Play's list of health
features before you submit, and if one fits a general habit tracker, pick it honestly.

### 3.11 Advertising ID
- Does your app use advertising ID? **Yes** (the app declares `com.google.android.gms.permission.AD_ID` in `app.config.ts`).
- Uses: tick **Advertising or marketing** and **Fraud prevention, security, and compliance**, the same purposes as the
  "Device or other IDs" row in Data safety (§3.7).

### 3.12 Other declarations
- Families: not in the Designed for Families program.
- No permission declarations are expected. The app asks only for `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`,
  `VIBRATE` and `AD_ID`. `app.config.ts` blocks exact alarms, storage, overlay, microphone and the media-playback
  foreground service. If Play still asks for a declaration, check the merged manifest of the AAB.

## 4. First release

- **Track:** **Internal testing** first. The first upload is manual: Internal testing → Create release → upload the AAB
  from `eas build --profile production --platform android`. After that, `eas submit --platform android` sends builds to
  the internal track.
- **Release name:** keep Play's default, which comes from the AAB (for example `1 (1.0.0)`).
- **Release notes** (en-US, under 500 characters). The docs have no release-notes text, so this one was drafted from
  the ASO.md §1.1 feature list. Edit it if you like.

```
<en-US>
First release of Habit Tracker.
• Yes/no, count and timed habits with flexible schedules
• Ready-made templates to start in under a minute
• Daily streaks, best streak and streak freezes
• Home screen widget to check off habits
• Heatmap calendar and weekly and monthly stats
• Reminders for each habit and a daily journal
• Works offline, no account, backup to a file
</en-US>
```

- **Closed test before production:** a personal developer account needs **at least 12 testers opted in for 14 days in a row**
  on Closed testing. The 14 days start only once a build is on the track, so move to Closed testing as soon as the
  internal build works. Invite the same 12 testers to all 5 apps.
- Before you build: the real AdMob IDs must be in EAS for production (`EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`, `_TODAY_BOTTOM`,
  `_STATS_LIST`, `_LEAVE_STATS`, `_AFTER_EDIT`, `_STREAK_FREEZE`, `_APP_OPEN_WARM`), and the AAB should pass the 16 KB
  page check (`RELEASE.md`).

## 5. Owner decisions in this sheet

- **Content rating, substance references:** keep the "No smoking" / "No alcohol" templates and answer Yes
  (recommended), or remove them and answer No. This is in §3.4.
- **Health apps (to check, not a docs decision):** the docs say no health features. Confirm against Play's current
  list before you submit. This is in §3.10.
