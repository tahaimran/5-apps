# Play Console paste sheet: Sipling: Drink Water Reminder

Fill Play Console from top to bottom using this sheet. Every field has the exact text to paste (in a code block) or
the exact option to click. Written 2026-10-27 from `ASO.md` §1 and §12, `store/DATA_SAFETY.md`,
`store/CONTENT_RATING.md`, `store/HEALTH_DECLARATION.md`, `store/SCREENSHOTS.md`, `WHATS_LEFT.md` §4, `RELEASE.md`,
`app.config.ts`, `eas.json` and `docs/PLAY_UPLOAD.md` §A, §C, §D2 and §E. This sheet is a copy. If any of them changes,
`ASO.md` and the `store/` docs are the source of truth, so update this sheet to match.

## 0. Before you start

| Field | Value |
|---|---|
| Package name | `com.fiveapps.sipling` (placeholder in `app.config.ts`. **It can never change after the first upload.** If you change it, change `packages/shared/src/crosspromo/catalog.ts` and the AdMob app too) |
| App name | `Sipling: Drink Water Reminder` |
| Default language | English (United States) – en-US |
| App or game | **App** |
| Free or paid | **Free** |
| Declarations | Tick **Developer Program Policies** and tick **US export laws** |

Version: `version` is `1.0.0` in `app.config.ts`. `eas.json` uses `appVersionSource: "remote"` with `autoIncrement`, so
EAS sets the versionCode and the `versionCode: 1` in `app.config.ts` is not used.

First upload: do it by hand (Internal testing → Create release → upload the AAB). `eas submit` only works after the
app has had one release.

## 1. Store settings

**App category**
- Application type: **App**
- Category: **Health & Fitness**

**Tags** (max 5, from ASO.md §12. Pick the closest tag Play offers for each one):
1. Health & fitness tracker
2. Habit tracker
3. Water tracker / Hydration
4. Wellness
5. Reminders

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

**App name** (29 / 30)
```
Sipling: Drink Water Reminder
```

**Short description** (78 / 80)
```
Water tracker & daily hydration reminder that grows a cute plant as you drink.
```

**Full description** (2,096 / 4,000, Applyra `check_metadata` 2026-10-26: valid, 0 warnings)
```
Forget to drink water? Sipling is a drink water reminder that grows a cute plant every time you drink. Set a daily water goal, get a gentle nudge only while you are awake, and log a glass with one tap. No account, no sign-up, and your data stays on your phone.

★ REMINDERS THAT FIT YOUR DAY
Tell Sipling when you wake up and go to bed and it spaces your reminders in between. Drank a glass already? The next reminder is skipped. Tap "Add 250 ml" right on the notification, or snooze it for a few minutes. Quiet times, days off and gentle silent reminders are one tap away.

★ A GOAL THAT FITS YOU
A short questionnaire about your weight, activity and climate gives you a personal daily water goal in about 30 seconds. It is a general wellness estimate, not medical advice. You can set your own goal any time and switch between ml and fl oz.

★ WATCH YOUR PLANT GROW
Every glass makes your plant happier. Reach your goal on more days to grow it from a seed to a blooming plant. Missed a day? Your plant only droops a little, it never dies.

★ QUICK AND SIMPLE LOGGING
Four cup sizes on the home screen, a custom amount with a slider, and drinks like water, sparkling water, tea, coffee, juice and milk. Each drink counts the way you set it. Made a mistake? Undo it within five seconds, or edit it later in your history.

★ STREAKS WITHOUT STRESS
Build a daily streak and earn streak freezes that protect it on a busy day. Unlock new plant skins and cup themes with your streak or by watching a short ad. There is no paywall.

★ HISTORY AND CHARTS
See each day's drinks, plus weekly and monthly charts with your goal line, averages and best day.

★ PRIVATE AND OFFLINE
Your water log never leaves your phone. Sipling works without internet, has dark mode and large text, and works with TalkBack. Back up your data to a file and restore it on a new phone.

★ ABOUT ADS
Sipling is supported by ads, shown in a few quiet places. Logging a drink is never blocked by an ad. You can review your ad privacy choices any time in Settings.

Download Sipling, pick your cup and give your plant its first sip.
```

**App icon:** upload `store/icon-512.png` (512×512 PNG, alpha OK).

**Feature graphic:** upload `store/feature-graphic-1024x500.png` (1024×500, 24-bit PNG, no alpha).

**Phone screenshots:** upload all 8 from `store/screenshots/` in this order (1080×1920). Shots 1–3 appear in search results.

| # | File | Caption on the image |
|---|---|---|
| 1 | `01-grow-your-plant.png` | Drink water, grow your plant. Every glass helps it bloom |
| 2 | `02-reminder.png` | Log right from the reminder. One tap adds a glass. No need to open the app. |
| 3 | `03-daily-goal.png` | Your personal daily goal. Based on weight, activity & climate |
| 4 | `04-smart-reminders.png` | Smart reminders, only when awake. Spread from wake-up to bedtime |
| 5 | `05-garden.png` | Build a streak, watch it bloom. Your plant grows with every goal day |
| 6 | `06-weekly-progress.png` | See your weekly progress. Daily, weekly & monthly charts |
| 7 | `07-drinks.png` | Water, coffee, tea & more. Quick-add cups in one tap |
| 8 | `08-private.png` | Private, offline, no sign-up. Your data stays on your phone |

**Tablet screenshots (7-inch, 10-inch) and Chromebook:** not needed. They are optional for a phone app, so leave them empty.

**Video (YouTube URL):** none. Leave it empty. ASO.md §8 only has an idea for a promo video, not a finished video.

## 3. App content (Policy → App content)

### 3.1 Privacy policy
```
https://www.tahaimran.com/apps/sipling/privacy/
```

### 3.2 App access
Choose **All functionality is available without special access**. There is no login or account.

### 3.3 Ads
Choose **Yes, my app contains ads**. Ads come from Google AdMob only, with no mediation.

### 3.4 Content rating (IARC questionnaire)

Email address:
```
tahaimran.24@gmail.com
```
Category: **Utility, Productivity, Communication or Other** (a health and fitness tool). If Play's label is worded
differently, pick the closest "all other apps" option. Do not pick Game, Social or Reference.

Answers, from `store/CONTENT_RATING.md`:

| Question | Answer |
|---|---|
| Violence or blood | No |
| Fear | No |
| Sexual content or nudity | No |
| Profanity / crude language | No |
| Gambling or simulated gambling | No |
| Alcohol, tobacco or drugs (references or use) | No (the drinks are water, sparkling water, tea, coffee, juice and milk) |
| Users can interact or exchange content (user-generated content, chat) | No (everything is private and on the device) |
| Shares the user's location with other users | No |
| Purchases of digital goods | No (no in-app purchases, no paywall. Plant skins unlock with streaks or by watching an ad) |
| Ads (if asked) | Yes (AdMob. Max ad content rating T, sensitive categories blocked in the AdMob console) |
| Unrestricted internet access / web browser | No (links open in the system browser) |
| Health or medical claims (if asked) | No (the goal is a general wellness estimate and the app says so) |

Not in the docs: Play may ask questions that are not in this table. Answer them truthfully from what the app does, and
add each one to `store/CONTENT_RATING.md`. Do not choose answers to get a lower rating.

Expected rating: **Everyone / PEGI 3**. After you submit, record the final answers and ratings in `store/CONTENT_RATING.md`.

### 3.5 Target audience and content
- Target age groups: tick **13–15**, **16–17** and **18 and over**. Leave every group under 13 unticked.
- Could the app or listing appeal to children? **No**. The app is not designed for children. The plant is cute, so
  the listing copy stays about adult wellness. If a reviewer says it appeals to kids, explain that the audience is
  adults building a wellness habit.
- Store presence / Families: **do not opt in** to the Families program or Teacher Approved.

### 3.6 News app
**No**.

### 3.7 Data safety

**Screen 1: Overview.** Read it and continue.

**Screen 2: Data collection and security**

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** (only through the Google Mobile Ads SDK and the Google UMP consent SDK) |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (the ads SDK uses HTTPS) |
| Account creation methods | **My app does not allow users to create an account** |
| Do you provide a way for users to request that their data is deleted? | **No** (there is no account, and the developer holds no data) |

If Play asks you to explain the deletion answer, paste:
```
Uninstalling the app removes all data held by the app. Ad data is managed through Google.
```
Optional badges, if Play shows them: committed to the Play Families policy = **No**. Independent security review = **No**.

**Screen 3: Data types.** Tick only these:
- Location → **Approximate location**
- App activity → **App interactions**
- App info and performance → **Crash logs** and **Diagnostics**
- Device or other IDs → **Device or other IDs**

Leave every other type unticked: name, email, user IDs, address, phone, precise location, contacts, photos, audio,
files, **health and fitness (water intake, weight)**, financial info, messages, web history, calendar. The water log
and body weight never leave the phone, so under Play's definition they are not "collected". The backup file is made
only when the user taps Export, and it goes wherever the user sends it.

**Screen 4: Data usage and handling** (answer this for each ticked type)

| Data type | Collected | Shared | Processed ephemerally? | Required or optional | Purposes to tick |
|---|---|---|---|---|---|
| Approximate location (derived from IP) | Yes | Yes (Google) | No | Required | Advertising or marketing; Fraud prevention, security, and compliance |
| App interactions (ad impressions and clicks) | Yes | Yes (Google) | No | Required | Advertising or marketing; Analytics |
| Crash logs | Yes | Yes (Google) | No | Required | Analytics; Fraud prevention, security, and compliance |
| Diagnostics | Yes | Yes (Google) | No | Required | Analytics; Fraud prevention, security, and compliance |
| Device or other IDs (advertising ID) | Yes | Yes (Google) | No | Required | Advertising or marketing; Fraud prevention, security, and compliance |

"Processed ephemerally" is **No** for every row: the ads SDK sends this data to Google's servers, so it is not only held in memory.

"Required" here means "required for ads". Users can still reset or opt out of the advertising ID in Android
settings, and can change ad consent under "Privacy choices" in the app's Settings.

**Screen 5: Preview.** Check that the summary lists only the 5 data types above (all shared with Google),
encrypted in transit, and no way to request deletion. Then submit.

### 3.8 Government apps
**No**.

### 3.9 Financial features
Choose **My app doesn't provide any financial features**.

### 3.10 Health apps
From `store/HEALTH_DECLARATION.md`:

| Question | Answer |
|---|---|
| Does the app have health features? | **Yes**: water intake (hydration) tracking and reminders |
| Feature type | **Activity and fitness** or **Nutrition and weight management**, whichever is closer to "hydration tracking" in Play's list |
| Is it a medical device, or does it diagnose, treat or prevent a condition? | **No** |
| Does it use Health Connect or health sensors? | **No** |
| Does it claim clinical or regulated outcomes? | **No** (the goal is described as a "general wellness estimate, not medical advice") |

The pregnancy, breastfeeding and senior modes are not in this release. When they ship, check this declaration again.

### 3.11 Advertising ID
- Does your app use advertising ID? **Yes** (the app declares `com.google.android.gms.permission.AD_ID` in `app.config.ts`).
- Uses: tick **Advertising or marketing** and **Fraud prevention, security, and compliance**, the same purposes as the
  "Device or other IDs" row in Data safety (§3.7).

### 3.12 Other declarations
- **Families:** not in the program. Do not opt in.
- No other declarations are expected. `app.config.ts` asks only for `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`,
  `VIBRATE` and `AD_ID`. The libraries add `INTERNET`, `ACCESS_NETWORK_STATE` and `WAKE_LOCK`. Exact alarms,
  battery-optimization requests, storage, overlay, microphone and media-playback services are all blocked. If Play
  asks for an exact-alarm, foreground-service or photo/storage declaration, the build contains a permission it should
  not have. Check the merged manifest before you answer.

## 4. First release

- Track: **Internal testing** first. The first AAB is uploaded by hand. After that, `eas submit --platform android`
  sends builds to the internal track.
- Release name: Play fills this in from the AAB (versionCode with `1.0.0`). Keep that name, or type:
```
1.0.0
```
- Release notes (en-US). Not in the docs: there are no release notes in `ASO.md` or `RELEASE.md`. The suggested text
  below uses only claims from the full description (269 / 500 characters). Edit it if you like:
```
<en-US>
First release of Sipling. Set a personal daily water goal, get gentle reminders only while you are awake, log a glass with one tap (even from the notification), and watch your plant grow as you drink. Works offline, no account needed, and your data stays on your phone.
</en-US>
```
- Then move to **Closed testing**: at least **12 testers opted in for 14 days in a row** before you can apply for
  production (new personal developer accounts must do this). The 14 days start only once a build is on the track.
  Invite the same 12 testers to all 5 apps. After closed testing, release to 20% of production, then to 100% once
  crash-free users are at 99.5% or more.

## 5. Owner decisions in this sheet

- **docs/PLAY_UPLOAD.md §E decisions: none for this app.** Sipling has no `mailto:` feedback or report button, so the
  feedback email question (a) does not apply. Its content-rating answers are all clean, so question (b) does not apply.
- Checks for you (not §E decisions):
  - §0: the package name `com.fiveapps.sipling` is final before the first upload.
  - §4: the release notes are a suggestion, not from the docs.
