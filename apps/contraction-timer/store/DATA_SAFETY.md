# Play Console → App content → Data safety (answers)

Source of truth for the form. Re-check Google's current "AdMob data disclosure" guidance at submission
time, because it changes: https://support.google.com/admob/answer/10106796

**Data collected by the developer:** none. No account, no developer backend, no analytics SDK and no crash
reporter (Sentry is in the plan but **not built**). Contractions, kick counts, due date, checklists and settings
stay on the device. Android auto-backup is off (`allowBackup: false`), so they are not copied to Google Drive either.

## Does the app collect or share any of the required user data types?
**Yes**, only through the Google Mobile Ads SDK (and the Google UMP consent SDK).

| Data type | Collected | Shared | Purposes | Optional? |
|---|---|---|---|---|
| Device or other IDs (advertising ID) | Yes | Yes (Google) | Advertising or marketing; Fraud prevention, security, compliance | Required for ads; the user can reset or opt out in Android and Privacy choices |
| App activity → App interactions (ad impressions/clicks) | Yes | Yes (Google) | Advertising or marketing; Analytics | Same |
| App info and performance → Crash logs, Diagnostics | Yes | Yes (Google) | Analytics; Fraud prevention, security, compliance | Same |
| Location → Approximate location (derived from IP) | Yes | Yes (Google) | Advertising or marketing; Fraud prevention, security, compliance | Same |

Not collected: name, email, user IDs, address, phone, precise location, contacts, photos, audio, files,
**health and fitness data (contractions, kick counts, due date, pregnancy dates)**, financial info, messages,
web history, calendar.

> Pregnancy and labour entries are processed on the device only. Data that never leaves the device is not
> "collected" under Play's definition, so health info is **not** declared. The text and PDF summaries leave the
> phone only when the user taps Share and picks an app; the app does not transmit them, so they are not declared
> either. If a later version adds Sentry, analytics, cloud backup or Health Connect, this answer changes
> (and so does the privacy policy).
>
> **Send feedback** opens the user's own email app (`mailto:`); the app does not send anything itself. The
> developer then receives the email address and message the user chose to send. Commonly this is not declared
> because the app does not transmit it; if you want to be conservative, declare "Email address" and "Other
> user-generated content" as collected for "Developer communications", not shared, optional. Decide once and
> answer the same way in all five apps.

## Security practices
- Data is encrypted in transit: **Yes** (ads SDK traffic uses HTTPS).
- Users can request data deletion: **No** (no account; the developer holds no data). Describe: "More → Delete all
  data erases everything the app holds on the phone, as does uninstalling. Ad data is managed through Google."
- Committed to the Play Families policy: **No** (not designed for children).
- Independent security review: No.

## Other declarations that go with it
- **Ads:** Contains ads = **Yes**.
- **Advertising ID:** declared = **Yes**, used for advertising (manifest has `com.google.android.gms.permission.AD_ID`).
- **Target audience:** **18+ only**. Not designed for children; do **not** opt into Families.
- **App access:** all functionality available without login.
- **Health apps declaration:** see `HEALTH_DECLARATION.md`.
- **Financial features / government / news:** No.

**Processed ephemerally:** No, for every data type above. The Google Mobile Ads SDK sends this data to Google's servers, so it is not only held in memory (answer added 2026-10-27).
