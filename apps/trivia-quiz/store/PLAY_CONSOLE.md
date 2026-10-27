# Play Console paste sheet: Quizora: Trivia Quiz Offline

A top-to-bottom sheet for creating the Quizora listing in Play Console. It is in the order Play Console shows the
fields, and it gives the exact text to paste (in code blocks) or the exact option to click. Written 2026-10-27,
copied from `ASO.md` §1 and §12, `store/DATA_SAFETY.md`, `store/CONTENT_RATING.md`, `store/SCREENSHOTS.md`,
`WHATS_LEFT.md` §4, `RELEASE.md` §5, `app.config.ts`, `eas.json` and `docs/PLAY_UPLOAD.md` (§A, §C, §D4, §E).
`ASO.md` and the `store/` docs remain the source of truth: if one of them changes, update this sheet too.

> **Release gate:** none of the 3,600 questions has been fact-checked (`docs/PLAY_UPLOAD.md` §F, `WHATS_LEFT.md` §3).
> Internal and closed testing are fine, but do not publish to production until the fact-check is done.

---

## 0. Before you start

**Create app** dialog (Play Console → All apps → Create app):

| Field | Enter / choose |
|---|---|
| App name | `Quizora: Trivia Quiz Offline` (same as the store title in §2) |
| Default language | **English (United States) – en-US** |
| App or game | **Game** |
| Free or paid | **Free** |
| Declarations | Tick **Developer Program Policies** and **US export laws** |

**Package name:** `com.fiveapps.quizora` (from `app.config.ts` → `android.package`). Play reads it from the first
AAB you upload. It is still a placeholder and **can never change after the first upload**. If you change it, change
`app.config.ts`, `packages/shared/src/crosspromo/catalog.ts` (`promoPackages['trivia-quiz']`) and the AdMob app
together first.

The launcher label on the phone is `Quizora` (`app.config.ts` → `name`). Only the store title is the longer one.

---

## 1. Store settings

Grow → Store presence → **Store settings**

| Field | Enter / choose |
|---|---|
| App or game | **Game** |
| Category | **Trivia** |
| Tags (max 5) | **Trivia**, **Quiz**, **Offline**, **Single player**, **Casual** (alternatives if one is missing: Brain games, Stylized). Not in the docs: whether each tag is in Play's current tag list; check when you pick them. |
| Email address | `tahaimran.24@gmail.com` |
| Website | `https://www.tahaimran.com/` |
| Phone number | leave empty (optional) |

Email to paste:
```
tahaimran.24@gmail.com
```
Website to paste:
```
https://www.tahaimran.com/
```

App page for reference (not a Play field): https://www.tahaimran.com/apps/quizora/

---

## 2. Main store listing

Grow → Store presence → Main store listing (en-US)

### App name (28 / 30)
```
Quizora: Trivia Quiz Offline
```

### Short description (79 / 80)
```
Offline general knowledge quiz games: daily trivia challenge, IQ & movie trivia
```

### Full description (2,518 / 4,000, Play's UTF-16 count)
```
Love trivia but hate sign-ups, spotty signal and ads that pop up mid-question? Quizora is an offline trivia quiz game with 3,000+ general knowledge questions, a fresh Daily Trivia Challenge and a short "Did you know?" explanation after every answer. No account, no internet needed, just you and a good question.

★ PLAY ANYWHERE, FULLY OFFLINE
Every question is stored on your phone. Play on the subway, on a flight or in a cabin with zero bars. Quizora never asks you to log in or connect to Facebook.

★ 12 CATEGORIES, 3,000+ QUESTIONS
• General knowledge quiz
• Geography quiz game: capitals, rivers and countries
• History trivia questions from ancient Rome to the space race
• Science, nature and animal facts quiz
• Movie trivia quiz and music trivia
• Sports, food, literature and logic puzzles
Every category runs from easy warm-ups to tough brain teasers.

★ DAILY TRIVIA CHALLENGE + STREAKS
Ten handpicked questions every day, the same set for every player. Keep your streak alive, earn streak freezes and watch your calendar fill up. Two minutes a day keeps your brain sharp.

★ GAME MODES FOR EVERY MOOD
• Classic levels: 30 levels per category, earn up to 3 stars and unlock the next level
• Category play: pick a topic and difficulty and practice as long as you like
• Timed Blitz: answer as many as you can in 60 seconds
• Logic & IQ category: number series, patterns and riddles that test your thinking

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

### Graphics

| Field | File | Notes |
|---|---|---|
| App icon | `store/icon-512.png` | 512×512 PNG, 32-bit with alpha (allowed) |
| Feature graphic | `store/feature-graphic-1024x500.png` | 1024×500, 24-bit RGB PNG, no alpha |

### Phone screenshots (upload in this order; shots 1–3 show in search results)
All 1080×1920, 24-bit RGB PNG, in `store/screenshots/`. Captions (from `store/SCREENSHOTS.md`) are already drawn on the
images; they are listed only so you can check the order.

1. `01-offline-questions.png` → 3,000+ trivia questions, offline / No internet. No sign-up.
2. `02-daily-challenge.png` → A new daily trivia challenge / Keep your streak alive
3. `03-learn-why.png` → Learn why with every answer / A fun fact after each question
4. `04-categories.png` → 12 categories to master / Movies, history, science & more
5. `05-levels.png` → 30 levels in every category / Earn 3 stars on every level
6. `06-blitz.png` → Beat the 60-second Blitz / How many can you answer?
7. `07-lifelines.png` → Use lifelines: 50/50, Skip, +Time / Never get stuck
8. `08-progress-dark.png` → Track your brain progress / Dark mode & big text

### Tablet screenshots (7-inch, 10-inch) and Chromebook
Not needed (optional). None were made. Leave empty.

### Video
None. Leave the YouTube URL empty. (`ASO.md` §8 plans a 25 s promo video, but it has not been made.)

---

## 3. App content (Policy → App content), in Play's order

### 3.1 Privacy policy
```
https://www.tahaimran.com/apps/quizora/privacy/
```
(Live since 2026-10-27; the same URL is set in EAS as `EXPO_PUBLIC_PRIVACY_POLICY_URL`.)

### 3.2 App access
Choose: **All functionality in my app is available without any access restrictions.**
(No account, no login, nothing locked behind a code.)

### 3.3 Ads
Choose: **Yes, my app contains ads.** (Google AdMob only, no mediation.)

### 3.4 Content rating (IARC questionnaire)

| Step | Enter / choose |
|---|---|
| Email address | `tahaimran.24@gmail.com` |
| Category | **Game** |

```
tahaimran.24@gmail.com
```

Answers (from `store/CONTENT_RATING.md`; content scanned 2026-10-26 across all 3,600 questions):

| Question | Answer |
|---|---|
| Violence (depicted), blood, gore | **No** (text only, no images; history questions mention wars and assassinations as facts, with no depiction) |
| Fear / horror imagery | **No** (horror titles such as Frankenstein or Dracula appear only as text) |
| Sexual content, nudity | **No** |
| Gambling, simulated gambling, real-money rewards | **No** (no betting or casino play; XP and stars have no cash value) |
| Language (profanity, crude humor) | **Owner decision: see below** |
| References to alcohol, tobacco or drugs | **Owner decision: see below** |
| User-generated content / users can interact or exchange content | **No** (single player; Share sends a score picture through the system share sheet) |
| Shares the user's location with other users | **No** |
| Purchases of digital goods | **No** (no IAP; lifelines, extra hearts, Double XP and streak restores come from optional rewarded ads) |
| Unrestricted internet access / web browser | **No** |
| Ads | **Yes** (AdMob; max ad content rating T; gambling and dating categories blocked in the AdMob console) |

If a free-text field allows it, add: "Historical and literary references in text only, no depiction."

**Owner decision (language).** Item `mov-000191` explains: "His line 'Frankly, my dear, I don't give a damn' is one of
cinema's most famous." The band name "Sex Pistols" (`mus-000128`) is an answer.

| | Option A (recommended) | Option B |
|---|---|---|
| Answer | **Yes: mild / infrequent** (one quoted swear word) | **No** |
| What you do first | Nothing | Drop the quote from the explanation in `content/raw/movies-*.json`, run `node scripts/build-bank.mjs`, ship that bank in the build |
| Why | True for the bank as it ships today, and the audience is 13+, so a mild-language note costs little | Keeps the lowest rating, but it needs a content edit and must be in the AAB you rate |

**Owner decision (alcohol, tobacco, drugs).** About a dozen passing factual references: Champagne as an answer option,
duck confit "cooked in wine", Pasteur and wine, "drunken doctor" (`mov-000292`), the Beer Hall Putsch, the Whiskey
Rebellion, "champagne of teas", Amy Winehouse (name only), Jamestown tobacco farming, the Opium Wars, caffeine and
penicillin. None show or encourage use.

| | Option A (recommended) | Option B |
|---|---|---|
| Answer | **Yes: references only, no depiction or encouragement of use** | **No** |
| What you do first | Nothing | Edit the items listed in `store/CONTENT_RATING.md` flag 2, rebuild the bank, then answer |
| Why | True, and `CONTENT_RATING.md` calls it low-impact for a 13+ audience | Keeps the lowest rating, but it means editing about 12 questions |

Never answer "No" without making the edit: a mismatch can get the listing rejected.

**Expected rating:** **Everyone / PEGI 3** if both answers are "No" after editing. Otherwise it may be one step higher
in some regions (for example an alcohol-reference descriptor or PEGI 12). Write the final answers and the ratings you
get into `store/CONTENT_RATING.md` after you submit.

### 3.5 Target audience and content

| Step | Choose |
|---|---|
| Target age groups | Tick **13–15**, **16–17**, **18 and over**. Leave 5 and under, 6–8 and 9–12 unticked. |
| Could the app or its listing unintentionally appeal to children? | **No** (no mascots or childish styling; `ASO.md` §5) |
| Families program / Teacher Approved | Do **not** opt in (not designed for children) |

Ads are requested with a max content rating of T (`src/ads.config.ts`), which fits a 13+ audience.

### 3.6 News app
Choose: **No**, my app is not a news app.

### 3.7 Data safety
Source: `store/DATA_SAFETY.md`. The developer collects nothing. Everything below is what the Google Mobile Ads SDK
(and the Google UMP consent SDK) collects. Before submitting, re-check Google's current AdMob guidance, because it
changes: https://support.google.com/admob/answer/10106796

**Screen 1: Data collection and security**

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (ads SDK traffic uses HTTPS) |
| Account creation | **My app does not allow users to create an account** (no account, no login) |
| Do you provide a way for users to request that their data is deleted? | **No** (no account; the developer holds no data) |
| Independent security review | **No** |

If a deletion description field is shown, paste:
```
Uninstalling the app removes all data held by the app; Settings → Reset progress erases game progress. Ad data is managed through Google.
```

**Screen 2: Data types** (tick only these)

- Location → **Approximate location**
- App activity → **App interactions**
- App info and performance → **Crash logs** and **Diagnostics**
- Device or other IDs → **Device or other IDs**

Leave everything else unticked: personal info (name, email, user IDs, address, phone), precise location, financial
info, health and fitness, messages, photos and videos, audio, files and docs, calendar, contacts, web browsing.

**Screen 3: Data usage and handling** (one page per data type)

| Data type | Collected | Shared | Processed ephemerally? | Required or optional | Purposes (tick for collection and for sharing) |
|---|---|---|---|---|---|
| Approximate location (derived from IP) | Yes | Yes (Google) | No | **Required** (needed for ads; the user can opt out through Privacy choices and Android settings) | Advertising or marketing; Fraud prevention, security, and compliance |
| App interactions (ad impressions and clicks) | Yes | Yes (Google) | No | **Required** | Advertising or marketing; Analytics |
| Crash logs | Yes | Yes (Google) | No | **Required** | Analytics; Fraud prevention, security, and compliance |
| Diagnostics | Yes | Yes (Google) | No | **Required** | Analytics; Fraud prevention, security, and compliance |
| Device or other IDs (advertising ID) | Yes | Yes (Google) | No | **Required** (the user can reset or opt out in Android settings and Privacy choices) | Advertising or marketing; Fraud prevention, security, and compliance |

"Processed ephemerally" is **No** for every row: the ads SDK sends this data to Google's servers, so it is not only held in memory.

Not declared, and why:
- Game progress, stars, XP, streak, stats, seen questions and settings stay on the phone (MMKV). The developer never
  receives them, so they are not "collected".
- **Share** on the Daily Challenge result makes a score picture on the phone and hands it to the share sheet the user
  picks. The app sends nothing itself.

**Owner decision (feedback email).** "Report this question" and Settings → "Send feedback" open the user's own email
app (`mailto:` to tahaimran.24@gmail.com). The app sends nothing itself. Pick one answer and use it in all five apps
(word-search and contraction-timer have the same buttons).

| | Option A (recommended) | Option B (cautious) |
|---|---|---|
| Answer | Do **not** declare anything for it | Also tick Personal info → **Email address** and **Other user-generated content**: collected, **not** shared, **optional**, purpose **Developer communications** |
| Why | The app transmits nothing; the user sends a normal email from their own mail app. This is what `DATA_SAFETY.md` uses now | Covers the emails you receive, at the cost of a longer data-safety label |

### 3.8 Government apps
Choose: **No**.

### 3.9 Financial features
Choose: **My app doesn't provide any financial features.**

### 3.10 Health apps
No `store/HEALTH_DECLARATION.md` exists for this app; `docs/PLAY_UPLOAD.md` §D4 says "No health features".
Choose: **My app does not have any health features** (leave every health feature unticked).

### 3.11 Advertising ID
- Does your app use advertising ID? **Yes** (the app declares `com.google.android.gms.permission.AD_ID` in `app.config.ts`).
- Uses: tick **Advertising or marketing** and **Fraud prevention, security, and compliance**, the same purposes as the
  "Device or other IDs" row in Data safety (§3.7).

### 3.12 Other declarations
- **Families:** not in the Families program; do not opt in (3.5).
- **In-app purchases:** none (nothing to set up under Monetize → Products).
- **Permissions that need a declaration:** none. Exact alarms, foreground services, storage, microphone and overlay
  permissions are all blocked in `app.config.ts`. The rest (`INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`,
  `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `MODIFY_AUDIO_SETTINGS`, `AD_ID`) are normal permissions.
  If Play Console asks about one anyway after the AAB upload, answer from `RELEASE.md` §5.
- **Price:** Free (Monetize → set nothing).

---

## 4. First release

Test and release → Testing → **Internal testing** → Create new release

| Field | Enter / choose |
|---|---|
| Track | **Internal testing** first. The first AAB must be uploaded by hand; after that, `eas submit --platform android` goes to the internal track (`eas.json` → `submit.production`). |
| App bundle | The AAB from `eas build --profile production --platform android` (run in `apps/trivia-quiz`) |
| Play App Signing | On (default). Keystores are EAS-managed. |
| Release name | Keep what Play fills in from the AAB: `<versionCode> (1.0.0)`. `version` is `1.0.0`; the versionCode is managed by EAS (`appVersionSource: remote`, `autoIncrement`), so it may not be 1. |

Release notes (en-US, 413 / 500 without the tags; Play pre-fills the `<en-US>` tags, paste the text between them). Not in the docs: no release-notes text exists in `ASO.md` or `RELEASE.md`. This is
a draft that uses only features the full description already names; edit it freely.
```
<en-US>
First release of Quizora: an offline trivia quiz with 3,000+ general knowledge questions in 12 categories.
• Daily Trivia Challenge with streaks and streak freezes
• Classic levels with 3 stars, Category play and a 60-second Blitz
• A short "Did you know?" fact after every answer
• 50/50, Skip and +Time lifelines
• Dark mode, adjustable text size and a relaxed mode with no timer
No account, no internet needed.
</en-US>
```

Before promoting:
- Check the AAB is 16 KB page-size compatible (`zipalign -c -P 16 -v 4 app.aab`) and read the pre-launch report.
- **Closed test rule (personal account):** production access needs a closed test with **at least 12 testers opted in
  for 14 days in a row**. The clock starts only when a build is on the closed track, so move Quizora to
  **Closed testing** as soon as the internal build works, and invite the same 12 testers to all 5 apps.
- Then production at 20%; go to 100% when crash-free users ≥ 99.5% (crash rate < 1.09%, freezes < 0.47%).
- Production also waits for the question fact-check (release gate at the top).

---

## 5. Owner decisions in this sheet

- **Content rating, language** (§3.4): answer "Yes, mild" (recommended) or edit the "damn" quote in `mov-000191` and
  answer "No".
- **Content rating, alcohol/tobacco/drugs** (§3.4): answer "Yes, references only" (recommended) or edit about 12
  items and answer "No".
- **Data safety, feedback email** (§3.7): leave the `mailto:` buttons undeclared (recommended) or declare Email
  address + Other user-generated content for Developer communications. Use the same answer in all five apps.
- **Package name** (§0): keep `com.fiveapps.quizora` or change it before the first upload; it is permanent after that.
