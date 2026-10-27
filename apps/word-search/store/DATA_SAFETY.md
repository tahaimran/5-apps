# Play Console → App content → Data safety (answers)

Source of truth for the form. Re-check Google's current "AdMob data disclosure" guidance at submission
time, because it changes: https://support.google.com/admob/answer/10106796

**Data collected by the developer:** none. No account, no developer backend, no analytics SDK and no crash
reporter. Puzzle progress, stars, streak, hints, settings and the puzzle in progress stay on the device.

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

> Puzzle progress is stored locally and is **not** collected or shared by the developer, so it is not declared.
> The app has no share feature.
>
> **Send feedback** opens the user's own email app (`mailto:`, shown only when `EXPO_PUBLIC_CONTACT_EMAIL` is set);
> the app sends nothing itself. Commonly this is not declared; if you want to be conservative, declare "Email
> address" and "Other user-generated content" as collected for "Developer communications", not shared, optional.
> Decide once and answer the same way in all five apps.
>
> When mediation (Meta, AppLovin, Unity) is added after ~1k daily users (WHATS_LEFT §2), list each partner here,
> in the privacy policy and in app-ads.txt.

## Security practices
- Data is encrypted in transit: **Yes** (ads SDK traffic uses HTTPS).
- Users can request data deletion: **No** (no account; the developer holds no data). Describe: "Uninstalling
  the app removes all data held by the app; Settings → Reset progress erases puzzle progress. Ad data is managed
  through Google."
- Committed to the Play Families policy: **No** (not designed for children).
- Independent security review: No.

## Other declarations that go with it
- **Ads:** Contains ads = **Yes**.
- **Advertising ID:** declared = **Yes**, used for advertising (manifest has `com.google.android.gms.permission.AD_ID`).
- **Target audience:** **18+ only** (WHATS_LEFT §4, ASO §12). Not designed for children; do **not** opt into
  Families. (Ads are requested at max content rating PG, `src/ads.config.ts`.) Word search is a genre kids play,
  so keep the listing about seniors and large print; "easy word search for kids" is a real autocomplete term, do not
  target it.
- **App access:** all functionality available without login.
- **In-app purchases:** none.
- **Financial features / health apps / government / news:** No.
