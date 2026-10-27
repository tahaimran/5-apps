# Play Console paste sheet: Contraction Timer & Kick Count

This is the sheet for filling in Play Console for Contraction Timer & Kick Count, from top to bottom, in the order Play
Console shows the fields. Written 2026-10-27 from `ASO.md`, `store/DATA_SAFETY.md`, `store/CONTENT_RATING.md`,
`store/HEALTH_DECLARATION.md`, `store/SCREENSHOTS.md`, `WHATS_LEFT.md` §4, `RELEASE.md`, `app.config.ts`, `eas.json` and
`docs/PLAY_UPLOAD.md`. Those files stay the source of truth. If one changes, update this sheet too.

> **Release gate (WHATS_LEFT.md top, HEALTH_DECLARATION.md, PLAY_UPLOAD.md §F).** This is a pregnancy and health app.
> You can create the listing and use **Internal testing** now. Do **not** start closed testing or release to the public
> until (1) a qualified midwife or doctor has reviewed the week cards, checklists, the 5-1-1 alert wording and the
> kick-counter messages, (2) the Health apps declaration (3.10) is filed and signed off by a person, and (3) the audience
> is 18+ only (3.5) and a lawyer has checked the disclaimer.

---

## 0. Before you start

| Field | Answer |
|---|---|
| Package name (from `app.config.ts`) | `com.fiveapps.contractiontimer` |
| App name | `Contraction Timer & Kick Count` |
| Default language | English (United States) – en-US |
| App or game | App |
| Free or paid | Free |
| Declarations: Developer Program Policies | Tick |
| Declarations: US export laws | Tick |

- The package name is a **placeholder**. It is **permanent after the first upload**. If you change it, change
  `app.config.ts` and `packages/shared/src/crosspromo/catalog.ts` together (a test keeps them equal), and the AdMob app too.
- The app's launcher name in `app.config.ts` is `Contraction Timer` (shorter). That is fine: Play shows the listing title.
- The first AAB is uploaded by hand (Internal testing → Create release). After that, `eas submit --platform android`
  uploads to the internal track.

## 1. Store settings

**App category**

| Field | Choice |
|---|---|
| App or game | App |
| Category | **Parenting** |

**Tags** (pick up to 5 from Play's list; use the closest Play offers if a label differs):
1. Pregnancy
2. Parenting
3. Baby care
4. Health tracker
5. Timer

**Store listing contact details**

| Field | Value |
|---|---|
| Email address | `tahaimran.24@gmail.com` |
| Phone number | leave empty (optional) |
| Website | `https://www.tahaimran.com/` |

The website must be the developer site, because `app-ads.txt` is checked at its root
(`https://www.tahaimran.com/app-ads.txt`). The developer name on the account is **Taha Imran**.

## 2. Main store listing

### App name (30 / 30)
```
Contraction Timer & Kick Count
```

### Short description (75 / 80)
```
Time contractions & spot 5-1-1 patterns. Kick counter & due date calculator
```

### Full description (3,331 / 4,000, as Play counts it)
Copied verbatim from `ASO.md` §1.1, including the emoji. Play counts 3,331 (UTF-16) while the text shows 3,326
visible characters, because emoji count double. Applyra `check_metadata` (2026-10-26): valid, 0 errors.
```
A calm, one-tap contraction timer and kick counter for the last weeks of pregnancy. Big buttons, a dark night mode for 3am, and a clear summary you can send to your midwife or doctor. Everything stays on your phone.

When contractions start, you don't need a cluttered app. You need one giant button, honest numbers and a gentle nudge to call your care team when your pattern matches the plan they gave you. This contraction tracker and contraction counter is built for exactly that moment, for you and your birth partner.

⏱ CONTRACTION TIMER
• One giant button: tap when a contraction starts, tap again when it ends
• Duration, frequency and interval calculated for you, live
• Average duration and interval over the last hour, at a glance
• Tag each contraction as mild, moderate or strong
• Works one-handed and in the dark, with haptic feedback on every tap
• Screen stays awake while you are timing
• Your session is saved: lock the phone or close the app and the timer picks up where it left off

🔔 PATTERN ALERT (5-1-1, 4-1-1, 3-1-1)
• Choose the rule your provider recommended, or set your own
• A gentle message appears when your last hour matches it: "Your last hour matches the 5-1-1 pattern your provider mentioned. It may be time to call them."
• No diagnosis, no guessing: the app shows your numbers, your provider decides

📄 SHARE WITH YOUR MIDWIFE OR DOCTOR
• Session history with every contraction listed
• Send a clean text summary by message or email in a few taps
• Create a PDF summary on your phone and share it with your hospital or birth center
• Nothing is uploaded: no account, no cloud, no tracking of your health data

👣 KICK COUNTER
• Count to 10 movements and see how long it took
• History of every kick session, ready to show your provider
• Optional daily reminder at the time you choose
• Talk to your provider if movements feel different from usual

📅 DUE DATE CALCULATOR & PREGNANCY WEEK BY WEEK
• Due date from your last period (LMP), conception date or IVF transfer date
• See how many weeks and days pregnant you are
• Pregnancy week by week cards with your baby's size compared to fruit and everyday things
• Short, friendly notes on what many people experience each week

✅ HOSPITAL BAG & BIRTH PLAN CHECKLISTS
• Hospital bag checklist for you, your partner and baby
• Birth plan checklist to think through your preferences before labor
• Add, remove and reorder items

🤝 PARTNER MODE
• Hand the phone to your partner: extra-large text and buttons so they can time contractions for you
• Same phone, same data, no sign-up

WHY PARENTS CHOOSE IT
• Fast: opens straight to the timer
• Private: your pregnancy data never leaves your device
• Calm: soft colors, no clutter and no ads ever covering the timer button
• Works offline, in the car or in the hospital

The app is supported by ads that we keep respectful: no full-screen ads while you are timing contractions or shortly after.

IMPORTANT: Contraction Timer & Kick Count is not a medical device and does not give medical advice, diagnosis or treatment. Always follow the guidance of your midwife, doctor or hospital. If you think you are in labor, your waters break, you notice bleeding, reduced baby movements or anything that worries you, contact your provider or emergency services right away.

Wishing you a calm, safe birth.
```

### Graphics

| Field | File | Notes |
|---|---|---|
| App icon | `store/icon-512.png` | 512×512 PNG, 32-bit with alpha, OK |
| Feature graphic | `store/feature-graphic-1024x500.png` | 1024×500, 24-bit PNG, no alpha, OK |
| Video | none | No promo video exists yet (ASO.md §5 has a storyboard only). Leave empty. |

### Phone screenshots (upload in this order; shots 1–3 show in search results)
All are 1080×1920 PNG, real UI.

| # | File | Caption on the image | Sub-line |
|---|---|---|---|
| 1 | `store/screenshots/01-one-button.png` | One big button. That's it. | Time contractions with a single tap |
| 2 | `store/screenshots/02-pattern-511.png` | Know when your 5-1-1 pattern is reached | A calm heads-up from your last hour |
| 3 | `store/screenshots/03-share-summary.png` | Send a clear summary to your midwife | As text or a PDF, made on your phone |
| 4 | `store/screenshots/04-night-mode.png` | Night mode made for 3 a.m. | Red on black, easy on tired eyes |
| 5 | `store/screenshots/05-partner-mode.png` | Partner mode: big text, zero setup | Easy to read and tap at arm's length |
| 6 | `store/screenshots/06-kick-counter.png` | Count kicks to 10 | Every session saved in your history |
| 7 | `store/screenshots/07-pregnancy-weeks.png` | Due date & week-by-week sizes | Your pregnancy at a glance |
| 8 | `store/screenshots/08-hospital-bag.png` | Hospital bag & birth plan checklists | Private and offline. No account. |

### Tablet screenshots (7-inch, 10-inch) and Chromebook
Not needed: the app is phone-only and portrait. Optional, leave empty.

## 3. App content (Policy → App content)

### 3.1 Privacy policy
```
https://www.tahaimran.com/apps/contraction-timer/privacy/
```
This is the same URL set in EAS as `EXPO_PUBLIC_PRIVACY_POLICY_URL` (More → Privacy and ads → Privacy policy).

### 3.2 App access
Choose: **All functionality is available without special access.** (No account, no login.)

### 3.3 Ads
Does your app contain ads? **Yes, my app contains ads.** (Google AdMob only, no mediation.)

### 3.4 Content rating (IARC questionnaire)

| Step | Answer |
|---|---|
| Email address | `tahaimran.24@gmail.com` |
| Category | **Utility, Productivity, Communication or Other** (if the questionnaire steers you to "Reference, News or Educational", that is also fine; the answers stay the same) |

Answer every question like this (from `store/CONTENT_RATING.md`):

| Question | Answer |
|---|---|
| Violence | No |
| Blood | No |
| Fear | No |
| Sexual content | No |
| Nudity | No |
| Profanity / crude language | No |
| Gambling / simulated gambling | No |
| References to alcohol, tobacco or drugs | No (the only related text is the birth-plan items "Pain relief I would like to try first / would rather not be offered", no drug is named) |
| User-generated content / users can interact or communicate | No (notes and checklists are private and local; Share hands a summary to an app the user picks) |
| Shares the user's location with other users | No |
| Purchases of digital goods | No (no IAP, no paywall; extra PDF looks and checklist templates unlock by watching an ad) |
| Unrestricted internet access / web browser | No (links open in the system browser or email app) |
| Health or medical claims | No (tracking tool with a "Not a medical device. Not medical advice." disclaimer) |
| If a question asks about medical or health information | Yes: general pregnancy information, no diagnosis or treatment advice |
| Contains ads (if asked) | Yes |

Topics to state honestly if asked: the app is about pregnancy, labour and birth. Text mentions bleeding, waters
breaking, pain, maternity pads, breast pumps, sore breasts, C-sections and "reduced baby movements" in a factual,
care-oriented way. None of this is sexual content or nudity, and there are no images of bodies (the week pictures are
hand-drawn fruit and everyday objects). Do not answer differently to get a lower rating.

**Expected rating:** Everyone / PEGI 3. Record the final answers and ratings in `store/CONTENT_RATING.md` after you submit.

### 3.5 Target audience and content

| Question | Answer |
|---|---|
| Target age groups | Tick **18 and over** only. Leave every younger group unticked. |
| Appeal to children (if asked) | **No.** Not designed for children. |
| Store presence | The listing is not designed for children and does not target them. |
| Families program | Do **not** opt in. Families policy does not apply. |

The content rating (Everyone) and the target audience (18+) are separate forms; that combination is normal.

### 3.6 News app
Is your app a news app? **No.**

### 3.7 Data safety

**Screen 1: Data collection and security**

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** (only through the Google Mobile Ads SDK and the Google UMP consent SDK) |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (ads SDK traffic uses HTTPS) |
| Account creation (if asked) | My app does not allow users to create an account |
| Do you provide a way for users to request that their data is deleted? | **No** (no account; the developer holds no data) |
| Committed to the Play Families policy | **No** (not designed for children) |
| Independent security review | **No** |

If Play gives a box to describe deletion, paste:
```
More → Delete all data erases everything the app holds on the phone, as does uninstalling. Ad data is managed through Google.
```

**Screen 2: Data types.** Tick only these:

| Category → Data type | Collected | Shared | Ephemeral? | Required or optional | Purposes (collection and sharing) |
|---|---|---|---|---|---|
| Device or other IDs → Device or other IDs (advertising ID) | Yes | Yes (Google) | No | Required (needed for ads; the user can reset or opt out in Android settings and in Privacy and ads) | Advertising or marketing; Fraud prevention, security, and compliance |
| App activity → App interactions (ad impressions and clicks) | Yes | Yes (Google) | No | Required (same) | Advertising or marketing; Analytics |
| App info and performance → Crash logs | Yes | Yes (Google) | No | Required (same) | Analytics; Fraud prevention, security, and compliance |
| App info and performance → Diagnostics | Yes | Yes (Google) | No | Required (same) | Analytics; Fraud prevention, security, and compliance |
| Location → Approximate location (from IP) | Yes | Yes (Google) | No | Required (same) | Advertising or marketing; Fraud prevention, security, and compliance |

"Processed ephemerally" is **No** for every row: the ads SDK sends this data to Google's servers, so it is not only held in memory.

Google's AdMob disclosure guide (re-check it on submission day, it changes): https://support.google.com/admob/answer/10106796

**Do not tick** any of these: name, email, user IDs, address, phone, precise location, contacts, photos, audio, files,
**health and fitness (contractions, kick counts, due date, pregnancy dates)**, financial info, messages, web history,
calendar. Pregnancy and labour entries stay on the phone (Android backup is off), so under Play's definition they are
not "collected". Text and PDF summaries leave only when the user taps Share and picks an app; the app does not send them.

**Owner decision (Send feedback button).** More → Send feedback opens the user's own email app (`mailto:`); the app
sends nothing itself.

| | Recommended: do not declare | Alternative: declare it |
|---|---|---|
| Answer | Add nothing for feedback | Tick **Personal info → Email address** and **App activity → Other user-generated content**: Collected Yes, Shared No, Optional, purpose **Developer communications** |
| Reason | The app does not transmit anything; the user's own email app does, and this is how it is commonly answered | More cautious, but declares data the app itself never handles |

Whichever you pick, answer the same way in word-search and trivia-quiz (PLAY_UPLOAD.md §E).

### 3.8 Government apps
Is your app developed by or for a government? **No.**

### 3.9 Financial features
Pick: **My app doesn't provide any financial features.**

### 3.10 Health apps
From `store/HEALTH_DECLARATION.md`. A person must sign this off (RELEASE.md §7 item 1).

| Question | Answer |
|---|---|
| Does the app have health features? | **Yes**: contraction timing with a pattern alert the user configures (5-1-1, 4-1-1, 3-1-1 or custom), a fetal movement (kick) counter, a due-date calculator and week-by-week pregnancy information |
| Feature type | "Pregnancy & reproductive health" / "fitness & wellness tracking". Pick the closest options Play lists at submission (the labels change). Do **not** pick anything under medical devices, clinical decision support or disease management |
| Is it a medical device, or does it diagnose, treat or prevent a condition? | **No.** It records times the user taps and shows them back. The pattern alert only says the user's own numbers match the rule their provider gave them; it never says "you are in labour" |
| Does it use Health Connect or health sensors? | **No** |
| Is health data sent off the device? | **No.** No account, no server, Android backup off. Summaries leave only when the user shares them |
| Does it claim clinical or regulated outcomes? | **No.** Disclaimer: "Not a medical device. Not medical advice. Always follow your provider's guidance." (onboarding screen 2, More → "Not medical advice", the Skip sheet, every export footer, the full description) |
| Regulatory check | A person confirms the pattern alert is not "regulated medical functionality" in the markets you ship to (FDA general wellness policy, EU MDR, UK MHRA) |

If Play asks for a disclaimer text, paste:
```
Not a medical device. Not medical advice. Always follow your provider's guidance.
```

### 3.11 Advertising ID
- Does your app use advertising ID? **Yes** (the app declares `com.google.android.gms.permission.AD_ID` in `app.config.ts`).
- Uses: tick **Advertising or marketing** and **Fraud prevention, security, and compliance**, the same purposes as the
  "Device or other IDs" row in Data safety (§3.7).

### 3.12 Other declarations
- **Families:** not in the program (see 3.5).
- **Sensitive permissions:** none expected. `app.config.ts` declares `POST_NOTIFICATIONS`, `VIBRATE` and `AD_ID`;
  libraries add `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK` and `RECEIVE_BOOT_COMPLETED`. Exact alarms,
  foreground services, `RECORD_AUDIO`, storage and `SYSTEM_ALERT_WINDOW` are blocked, so Play should not ask for the
  exact-alarm, foreground-service or photo/video declarations. The final list is only in the built AAB (RELEASE.md
  §5): if Play asks for one of these forms, check the merged manifest before answering.

## 4. First release

| Field | Answer |
|---|---|
| Track | **Internal testing** first (Testing → Internal testing → Create new release) |
| App bundle | the production AAB from `eas build --profile production --platform android` |
| Release name | Leave Play's default: `<versionCode> (1.0.0)`. versionCode comes from EAS (`appVersionSource: remote`, `autoIncrement` on) |

**Release notes (en-US).** Not in the docs: there is no release-notes text in ASO.md, RELEASE.md or the plan. Drafted
for this sheet from the full description's wording (415 characters); edit freely.
```
<en-US>
First release of Contraction Timer & Kick Count.
• One-tap contraction timer with live duration and interval
• Pattern alert for the 5-1-1, 4-1-1 or 3-1-1 rule your provider gave you, or your own
• Send a text or PDF summary to your midwife or doctor
• Kick counter, due date calculator and pregnancy week by week
• Hospital bag and birth plan checklists, Night mode and Partner mode
Everything stays on your phone.
</en-US>
```

**Closed testing rule (new personal accounts):** production access needs a closed test with **at least 12 testers opted
in for 14 days in a row**. For this app, **do not start the closed test until the midwife/doctor and legal reviews are
done** (release gate at the top). Then: closed → production at 20% → 100% once crash-free users are 99.5% or more.

## 5. Owner decisions in this sheet
- **Data safety, Send feedback button** (3.7): recommended "do not declare"; alternative "declare Email address and
  other messages for Developer communications, optional, not shared". Use the same answer in all apps that have it.
- **Health apps feature type** (3.10): pick the closest current Play labels to "Pregnancy & reproductive health /
  fitness & wellness tracking", never a medical-device option. A person signs the declaration.
- **Package name** (0): `com.fiveapps.contractiontimer` is a placeholder; final before the first upload.
- **Release notes** (4): drafted here, not from the docs.
