# Prompt for the Claude in Chrome session: set up AdMob for the 5 apps

Paste everything below the line into a Claude session that has the **Claude in Chrome** extension connected, with
Chrome already signed in to the owner's AdMob account (https://admob.google.com). The session needs this repo checked
out (or `docs/admob/ADMOB_UNITS.md` pasted in) because that file is the spec.

---

## Role and goal

You are setting up Google AdMob for five Android apps owned by the user. Use the Claude in Chrome tools
(`mcp__claude-in-chrome__*`) to work in the user's real, already signed-in Chrome. Create the five apps, all their ad
units, the account settings and the consent messages, then record every ID you create. Do it completely and exactly as
specified, and report honestly what was and was not done.

## Read first

1. `docs/admob/ADMOB_UNITS.md`: the exact apps, ad unit names, formats, env var names, content ratings and block lists.
   **It is the only spec. Do not invent units or rename anything.** 34 units across 5 apps.
2. `docs/ADMOB_PLAYBOOK.md` §1 (setup checklist) and §6 (policy guardrails).
3. `docs/admob/ADMOB_IDS.template.json`: the shape of the results file you will fill in.
4. Do not read other docs or app code. This task changes nothing in app source.

## Hard rules

- **Sign-in:** the user is already signed in. If Chrome shows a Google sign-in, password, 2-step or CAPTCHA screen,
  stop and ask the user to complete it. Never type credentials, never ask for them in chat.
- **Site permission:** if Claude in Chrome reports the site is not allowed, tell the user and wait.
- **Tabs:** start with `tabs_context_mcp`, open your own new tab with `tabs_create_mcp`, work only there, close it at the end.
- **No dialogs:** avoid clicking things that raise browser confirm/alert dialogs; they freeze the extension.
- **Stop conditions:** if a tool call fails 2-3 times, the page does not respond, or the UI differs from this prompt in a
  way that changes meaning, stop and tell the user what you tried. Do not loop.
- **Never click ads, never enable test-mode on live units, never change payment, tax, address or account-owner settings.**
  If AdMob asks for payment/profile/terms acceptance, tell the user and wait; do not fill in billing details.
- **Never** create units outside the spec, delete anything, or edit an app/unit that already exists without telling the
  user first.
- **Real IDs are not committed.** Write them only to `docs/admob/ADMOB_IDS.local.json` (git-ignored) and show them to the
  user. Do not `git add` that file. Do not paste IDs into any other file, issue, PR or commit message.
- **Copy IDs by reading the page text**, not from screenshots. After each unit, read the unit ID back from the page and
  validate its shape: unit IDs `ca-app-pub-<16 digits>/<10 digits>`, app IDs `ca-app-pub-<16 digits>~<10 digits>`.
  The 16-digit part must be identical for every ID (it is the publisher ID `pub-<16 digits>`). If any ID fails
  validation, re-read it; if it still fails, stop and report.

## Procedure

### Step 0. Inspect before changing anything

1. Open https://admob.google.com/home/ and go to **Apps > View all apps**. List which of the five already exist
   (match by app name from `ADMOB_UNITS.md`). Record the publisher ID from **Settings > Account information**.
2. For each app that already exists, do not create a second one. Open it, list its existing ad units, and only create
   the missing ones (match on the exact unit name). Tell the user what you found.
3. Print the plan: apps to create, units to create, units that already exist. Then continue.

### Step 1. Create each app (repeat for all 5, in the order of `ADMOB_UNITS.md`)

1. **Apps > Add app**. Platform: **Android**.
2. "Is the app listed on a supported app store?": **No**. Click **Continue**.
3. App name: exactly the "AdMob app name" from the app's header table. Ask: "Would you like to enable user metrics?": leave
   at AdMob's default and do not skip over any required fields.
4. Click **Add app**. When AdMob offers to create an ad unit now, choose **Done** or skip, so units are created in Step 2
   with the correct names.
5. Open the app's **App settings** and read the **App ID** (`ca-app-pub-...~...`). Save it as
   `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` for that app.
6. In **App settings**, set the **Maximum ad content rating** to the value in the app's table (T, PG or G).

### Step 2. Create the ad units (for each app, every row of its table)

For each row of the app's table: **Ad units > Add ad unit**, then:

| Format in spec | AdMob choice | Settings |
|---|---|---|
| Banner | **Banner** | Leave size as adaptive/default. Name it exactly. |
| Native | **Native advanced** | Leave the default template/settings. Name it exactly. |
| Interstitial | **Interstitial** | Leave defaults (video + image). Name it exactly. |
| Rewarded | **Rewarded** | Set reward item = the "Reward" text in the Notes column and amount = its number. Leave "Server-side verification" off. |
| App open | **App open** | Name it exactly. |

- **Ad unit name = the exact string in the table**, including the pipe separators, e.g. `Habits | today_bottom | Banner`.
  (In the markdown file the pipes are escaped as `\|`; type a plain `|`.)
- Leave eCPM floors, ad formats beyond the above, and mediation untouched.
- After saving, read the **Ad unit ID** from the confirmation screen (or Ad units list), validate it, store it under the
  env var name for that row.
- Spot check that the unit appears in the Ad units list under the right app with the right format.

### Step 3. Blocking controls (per app)

For each app: **Blocking controls > Sensitive categories** (and, if shown, the category list):
- All apps: block **Gambling & Betting** and **Dating**.
- Contraction Timer: block everything in its block list in `ADMOB_UNITS.md` that AdMob offers
  (Dating, Gambling & Betting, Alcohol, Sexual & Reproductive Health, Weight Loss, Cosmetic Procedures & Body Modification,
  Get Rich Quick, Politics, Religion, Drugs & Supplements, Astrology & Fortune Telling, Shocking Content, Personal Loans/Financial).
  If a category name is missing in the UI, pick the closest and list the mapping you chose in your report.
- Sipling: also block Weight Loss and Drugs & Supplements.
Block at the **app** level, not the account level, unless the user says otherwise.

### Step 4. Privacy & messaging (account level, then attach to the 5 apps)

1. **Privacy & messaging > GDPR**: create the message for **EEA and UK** users, using Google's default consent message
   and default layout. Apply it to all five apps. Do not publish a message that references a specific privacy-policy
   URL you do not have; the apps provide their own link in Settings.
2. **US state regulations**: create the US state regulations message for all five apps.
3. Publish both so the apps can show them through `@shared/consent`. If AdMob blocks publishing (for example, app not yet
   verified), save the message as a draft and tell the user exactly what is blocking.

### Step 5. Test device

Do **not** add a device automatically. Ask the user for the **Advertising ID / test device ID** they want registered
(from `adb logcat` or the in-app log), and only then add it under **Settings > Test devices**. If they don't have it
yet, list this as pending.

### Step 6. Results file and report

1. Copy `docs/admob/ADMOB_IDS.template.json` to `docs/admob/ADMOB_IDS.local.json` and fill in `publisherId` and every
   value you collected. Leave blank (do not guess) anything you could not create.
2. Confirm with `git check-ignore -v docs/admob/ADMOB_IDS.local.json` that it is ignored. If not, stop and report.
3. Verify counts: Habit Tracker 7, Sipling 6, Word Search 5, Quizora 8, Contraction Timer 8 (34 units, 5 app IDs).
4. Give the user a final report:
   - table per app: app name, app ID, each unit name + ID, and its env var name;
   - what already existed vs what you created;
   - blocking controls and content ratings set per app;
   - consent messages: created/published/draft, and any blocker;
   - anything skipped or failed, and why;
   - the `eas env:create` commands for each app (see below), **without running them**.
5. Close the tab you opened.

## EAS commands to hand back (do not run them)

For each app, from `apps/<folder>`, for each variable, give the user a line in this form (values from the results file):

```
eas env:create --name EXPO_PUBLIC_ADMOB_TODAY_BOTTOM --value "<id>" --environment production --environment preview --visibility sensitive
```

Use the same value for `preview` and `production`. The app ID (`EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`) is required in both
or the release build falls back to Google's test app ID.

## Left for the user (state this at the end)

- Host `app-ads.txt` with the publisher line `google.com, pub-<id>, DIRECT, f08c47fec0942fa0` at the root of the developer
  website (replace `pub-0000000000000000` in `apps/*/store/app-ads.txt`) and verify it in AdMob after the apps are live.
- Link each AdMob app to its Play listing once published.
- Confirm the final Sipling and Contraction Timer package names before the first Play upload.
- Play Console Data safety form and privacy policy hosting.
- Mediation: later, after ~1k DAU.
