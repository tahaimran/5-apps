# Play Console paste sheet: Word Search: Large Print Easy

Fill Play Console from top to bottom with this sheet: each field gives the text to paste (in a code block) or the
option to click. Written 2026-10-27, copied from `ASO.md`, `store/DATA_SAFETY.md`, `store/CONTENT_RATING.md`,
`store/SCREENSHOTS.md`, `WHATS_LEFT.md` §4, `RELEASE.md`, `app.config.ts`, `eas.json` and `docs/PLAY_UPLOAD.md`.
Those files are still the source of truth. If one of them changes, update this sheet to match.

---

## 0. Before you start

| Field | Answer |
|---|---|
| Package name | `com.tahaimran.wordsearch` (final, 2026-10-27; set in `app.config.ts`). **It can never change after the first upload.** |
| App name (Create app dialog) | `Word Search: Large Print Easy` |
| Default language | English (United States) – en-US |
| App or game | **Game** |
| Free or paid | **Free** |
| Declarations | Tick **Developer Program Policies** and **US export laws** |

The first AAB goes up by hand (Internal testing → Create release). After that use `eas submit --platform android`, which
sends to the internal track (`eas.json`). Turn on Play App Signing, which is the default.

---

## 1. Store settings (Grow → Store presence → Store settings)

| Field | Answer |
|---|---|
| App or game | Game |
| Category | **Word** (under Games) |
| Tags (max 5) | Word, Word search, Puzzle, Casual, Offline. Pick the closest matches from Play's list. If "Word search" and "Offline" are offered, take them (ASO §12) |
| Email address | `tahaimran.24@gmail.com` |
| Phone number | leave empty (optional) |
| Website | `https://www.tahaimran.com/` |

App page (handy for the listing or support): `https://www.tahaimran.com/apps/word-search/`.
app-ads.txt is live at `https://www.tahaimran.com/app-ads.txt`. Verify it in AdMob once the app is live.

---

## 2. Main store listing (Grow → Store presence → Main store listing)

### App name (29 / 30)
```
Word Search: Large Print Easy
```

### Short description (78 / 80)
```
Easy word search for seniors: big letters, offline puzzles, no timer pressure.
```

### Full description (2,537 / 4,000)
```
A calm, easy word search made for comfortable reading. Big letters, strong contrast and no timer pressure, so you can relax and enjoy every puzzle at your own pace.

Word Search: Large Print Easy was designed with adults and seniors in mind. Many word puzzle games use tiny letters, busy screens and countdown clocks. This one does the opposite. You choose the text size, the grid size and the difficulty, and the game remembers your choices.

BIG, CLEAR LETTERS
• Four text sizes, up to extra large print
• High-contrast mode and a soft dark mode for evening play
• Thick highlight lines so found words are easy to see
• Works with TalkBack and your phone's font settings

RELAXING, NO PRESSURE
• No timers, no lives, no penalties
• Take a break any time; your puzzle is saved automatically
• Gentle sounds and light vibration you can turn off
• Helpful hints when you get stuck

PLAYS OFFLINE, ANYWHERE
• Every puzzle is created on your phone, so you can play offline without Wi-Fi
• Perfect for waiting rooms, trips and quiet evenings at home
• Unlimited puzzles, so you never run out of words

THEMED WORD PACKS
Find words from 12 friendly, familiar topics:
• Animals, Birds and Nature
• Food and Baking
• Travel and Cities
• Holidays and Seasons
• Music and Hobbies
• Home & Family

DAILY WORD CHALLENGE
A fresh daily puzzle is waiting each morning. Keep your streak going, collect stars and watch your word collection grow. An optional reminder can let you know when today's puzzle is ready.

CHOOSE YOUR LEVEL
• Easy: smaller grids, words read left to right and top to bottom
• Medium: adds diagonal words
• Hard: larger grids with backwards words for experienced players
Start easy and move up when you feel ready. Many players enjoy this as a daily brain exercise and a little stress relief with their morning coffee.

SIMPLE TO PLAY
Slide your finger across the letters to circle a word. Prefer tapping? Tap the first letter, then the last letter. The word list shows clearly what is left to find.

HOW THE APP IS SUPPORTED
The game is supported by ads. We keep them calm: no ads while you are in the middle of a puzzle, and no ads covering the letter grid. You can watch an optional short video to earn extra hints.

PRIVACY FIRST
No account and no sign-up. Your progress is stored on your device.

If you enjoy crosswords, word finds, letter grid puzzles or other word puzzle games for adults, give this large print word search a try. We read every review and use your feedback to make the game more comfortable for everyone.
```

### Graphics
| Field | File | Note |
|---|---|---|
| App icon | `store/icon-512.png` | 512×512 PNG, 32-bit (alpha OK) |
| Feature graphic | `store/feature-graphic-1024x500.png` | 1024×500, 24-bit RGB PNG with no alpha (checked) |
| Video | none | No promo video exists yet. ASO §8 is only an idea, so leave the field empty |

### Phone screenshots (upload in this order; shots 1–3 show in search results)
All are 1080×1920, 24-bit RGB PNG, in `store/screenshots/`.

1. `01-big-letters.png`: Big Letters. Easy to Read.
2. `02-letter-size.png`: Pick Your Letter Size
3. `03-no-timers.png`: No Timers. No Pressure.
4. `04-offline.png`: Play Offline, Anywhere
5. `05-packs.png`: 12 Themed Word Packs
6. `06-daily.png`: A New Puzzle Every Day
7. `07-contrast-dark.png`: High Contrast & Dark Mode
8. `08-easy-to-hard.png`: Easy to Hard. You Choose.

### Tablet screenshots (7-inch, 10-inch) and Chromebook
Optional and not needed. None have been made. Without them the app may show less prominently on tablets.

---

## 3. App content (Policy → App content), in Play's order

### 3.1 Privacy policy
```
https://www.tahaimran.com/apps/word-search/privacy/
```

### 3.2 App access
Choose **All functionality in my app is available without any access restrictions**. There is no account or login.

### 3.3 Ads
Choose **Yes, my app contains ads**. The only ad network is Google AdMob, with no mediation.

### 3.4 Content rating (IARC questionnaire)
| Step | Answer |
|---|---|
| Email address | `tahaimran.24@gmail.com` |
| Category | **Game** (Word / puzzle) |

| Question | Answer |
|---|---|
| Violence | No |
| Blood | No |
| Fear | No |
| Sexual content / nudity | No |
| Profanity / crude language | No |
| Crude humor | No |
| Gambling or simulated gambling | No. There is no betting or casino play. POKER and BINGO appear only as words in the Hobbies pack |
| References to alcohol, tobacco or drugs | No (see the note below) |
| User-generated content / users can interact or communicate | No. Single player, no chat, no sharing |
| Shares the user's location with other users | No |
| Purchases of digital goods | No. There are no in-app purchases; extra hints come from an optional rewarded ad |
| Unrestricted internet access / web browser | No |
| Contains ads (if asked) | Yes (AdMob, max ad content rating PG) |

Note on substances: EGGNOG and CIDER were swapped out of the word lists on 2026-10-27, so "No" is a clear answer.
TOAST and CHEERS stay; they are everyday celebration words (`store/CONTENT_RATING.md`).

**Expected rating:** Everyone / PEGI 3. After you submit, record the ratings you get in `store/CONTENT_RATING.md`.

### 3.5 Target audience and content
| Question | Answer |
|---|---|
| Target age groups | Tick **18 and over** only |
| Appeals to children / "Could your store listing unintentionally appeal to children?" (if asked) | **No**. The listing is written for adults and seniors and does not target "easy word search for kids" |
| Families program / Designed for Families | **Not** in the program. Do not opt in |
| Store presence / Teacher Approved (if shown) | Do not opt in |

### 3.6 News apps
**No**, my app is not a news app.

### 3.7 Data safety
Re-check Google's AdMob data disclosure guidance on the day you submit, because it changes:
https://support.google.com/admob/answer/10106796

**Screen 1: Data collection and security**
| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes**. This happens only through the Google Mobile Ads SDK and the Google UMP consent SDK |
| Is all of the user data collected by your app encrypted in transit? | **Yes**. The ads SDK uses HTTPS |
| Account creation methods | **My app does not allow users to create an account** |
| Do you provide a way for users to request that their data is deleted? | **No**. There is no account and the developer holds no data. Uninstalling the app removes everything it stored, and Settings → Reset progress erases puzzle progress. Google manages ad data |
| Independent security review (if shown) | No |
| Committed to Play Families policy (if shown) | No |

**Screen 2: Data types to tick**
- Location → **Approximate location**
- App activity → **App interactions**
- App info and performance → **Crash logs** and **Diagnostics**
- Device or other IDs → **Device or other IDs**

Leave everything else unticked: name, email, user IDs, address, phone, precise location, contacts, photos, audio, files,
health and fitness, financial info, messages, web history and calendar.

**Screen 3: Usage and handling for each data type**
| Data type | Collected | Shared | Processed ephemerally | Required or optional | Purposes (same for collected and shared) |
|---|---|---|---|---|---|
| Device or other IDs (advertising ID) | Yes | Yes (Google) | No | **Required** ("required for ads"; users can reset or opt out in Android settings and in Privacy choices) | Advertising or marketing; Fraud prevention, security, and compliance |
| App interactions (ad impressions and clicks) | Yes | Yes (Google) | No | **Required** | Advertising or marketing; Analytics |
| Crash logs | Yes | Yes (Google) | No | **Required** | Analytics; Fraud prevention, security, and compliance |
| Diagnostics | Yes | Yes (Google) | No | **Required** | Analytics; Fraud prevention, security, and compliance |
| Approximate location (derived from IP) | Yes | Yes (Google) | No | **Required** | Advertising or marketing; Fraud prevention, security, and compliance |

"Processed ephemerally" is **No** for every row: the ads SDK sends this data to Google's servers, so it is not only held in memory.

Puzzle progress, stars, streak, hints and settings stay on the phone and are not declared.

**Feedback email (decided 2026-10-27): not declared.** Settings → "Send feedback" opens the user's own email app
(`mailto:`); the user writes and sends the email, and the app itself transmits nothing, so it is not "collected" data
in Play's sense. Same answer in Quizora and Contraction Timer (`store/DATA_SAFETY.md`).

### 3.8 Government apps
**No**.

### 3.9 Financial features
**My app doesn't provide any financial features**.

### 3.10 Health apps
**My app does not have any health features** (`docs/PLAY_UPLOAD.md` §D3). The app makes no health or medical claims.
The full description's phrases "brain exercise" and "stress relief" are casual wording, not health features.

### 3.11 Advertising ID
- Does your app use advertising ID? **Yes** (the app declares `com.google.android.gms.permission.AD_ID` in `app.config.ts`).
- Uses: tick **Advertising or marketing** and **Fraud prevention, security, and compliance**, the same purposes as the
  "Device or other IDs" row in Data safety (§3.7).

### 3.12 Other declarations
- **Families**: not in the program (see 3.5).
- **Permissions**: the app declares `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE` and `AD_ID`, and the ads
  SDK adds `INTERNET`, `ACCESS_NETWORK_STATE` and `WAKE_LOCK`. Exact alarms, foreground service, microphone, storage
  and overlay are all blocked in `app.config.ts`, so Play should not ask for an exact-alarm, foreground-service or
  photo/video declaration. If it asks for one anyway, read the merged manifest in the AAB before you answer.
- **In-app purchases / price**: Free, no in-app purchases.

---

## 4. First release (Test and release → Testing → Internal testing → Create new release)

| Field | Answer |
|---|---|
| Track | **Internal testing** first, then Closed testing, then Production |
| App bundle | the AAB from `eas build --profile production --platform android` |
| Release name | Keep the name Play fills in from the bundle (version `1.0.0`; EAS manages the version code because `appVersionSource` is `remote` with `autoIncrement`) |

Release notes (en-US, final, 238 / 500 without the tags; Play does not use them for search ranking, so they are written
for people):
```
<en-US>
First release of Word Search: Large Print Easy.
• Four text sizes, high contrast and dark mode
• No timers, no lives, no penalties
• 12 themed word packs and a daily puzzle
• Easy, Medium and Hard levels
• Plays offline, no account needed
</en-US>
```

**Closed-test rule (new personal accounts):** before Play grants production access, at least **12 testers must stay
opted in for 14 days in a row**. The clock starts only once a build is on the closed track, so move the app to Closed
testing as soon as it has a working build, and invite the same 12 testers you use for the other 4 apps. Then roll out
production at 20% → 50% → 100% and watch that crash-free users stay at 99.5% or higher.

---

## 5. Decisions (all made 2026-10-27)

- **Package name:** `com.tahaimran.wordsearch` (section 0).
- **Content rating:** EGGNOG and CIDER swapped out, all answers No, expected Everyone / PEGI 3 (section 3.4).
- **Data safety feedback email:** not declared (section 3.7).
- **Release notes:** final (section 4).
