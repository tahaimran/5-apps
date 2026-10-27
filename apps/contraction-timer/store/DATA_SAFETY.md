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
> **Send feedback** opens the user's own email app (`mailto:`, shown only when `EXPO_PUBLIC_CONTACT_EMAIL` is set,
> which it now is). **Decision (2026-10-27): not declared.** Play's Data safety form covers data the app itself sends
> off the device. Here the app only opens another app; the user writes and sends the email themselves, and the app
> transmits nothing. The privacy policy still says what we receive by email and that we use it only to reply.
> Answer the same way in every app that has the button.

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
