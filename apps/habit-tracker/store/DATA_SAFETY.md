# Play Console → App content → Data safety (answers)

Source of truth for the form. Re-check Google's current "AdMob data disclosure" guidance at submission
time, because it changes: https://support.google.com/admob/answer/10106796

**Data collected by the developer:** none. No account, no developer backend, no analytics SDK. Habit data
and backups stay on the device or in files the user shares themselves.

## Does the app collect or share any of the required user data types?
**Yes**, only through the Google Mobile Ads SDK (and the Google UMP consent SDK).

| Data type | Collected | Shared | Purposes | Optional? |
|---|---|---|---|---|
| Device or other IDs (advertising ID) | Yes | Yes (Google) | Advertising or marketing; Fraud prevention, security, compliance | Required for ads; the user can reset or opt out in Android and Privacy choices |
| App activity → App interactions (ad impressions/clicks) | Yes | Yes (Google) | Advertising or marketing; Analytics | Same |
| App info and performance → Crash logs, Diagnostics | Yes | Yes (Google) | Analytics; Fraud prevention, security, compliance | Same |
| Location → Approximate location (derived from IP) | Yes | Yes (Google) | Advertising or marketing; Fraud prevention, security, compliance | Same |

Not collected: name, email, user IDs, address, phone, precise location, contacts, photos, audio, files,
health and fitness data, financial info, messages, web history, calendar.

> Habit names, check-ins and notes are stored locally and are **not** collected or shared by the developer,
> so they are not declared. A backup file is created only when the user taps Export and goes wherever the
> user sends it.

## Security practices
- Data is encrypted in transit: **Yes** (ads SDK traffic uses HTTPS).
- Users can request data deletion: **No** (no account; the developer holds no data). Describe: "Uninstalling
  the app removes all data held by the app. Ad data is managed through Google."
- Committed to the Play Families policy: **No** (not designed for children).
- Independent security review: No.

## Other declarations that go with it
- **Ads:** Contains ads = **Yes**.
- **Advertising ID:** declared = **Yes**, used for advertising (manifest has `com.google.android.gms.permission.AD_ID`).
- **Target audience:** 13–15, 16–17, 18+. Not designed for children; do **not** opt into Families.
- **App access:** all functionality available without login.
- **Financial features / health apps / government / news:** No. (This is a habit tracker; it makes no medical claims.)
