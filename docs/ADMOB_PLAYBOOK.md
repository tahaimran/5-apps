# AdMob Playbook (applies to all 5 apps)

The aim is the most revenue per user **without** hurting retention or ratings, since retention and ratings are what drive ASO rank. Ads that make people uninstall cost more than they earn.

## 1. Setup checklist
- [ ] AdMob account → add each app (link it to its Play listing once published) → create ad units per placement. Use a separate unit per placement so eCPM can be compared.
- [ ] `react-native-google-mobile-ads` config plugin in `app.json`, with `androidAppId` set from env.
- [ ] **Privacy & messaging → GDPR message (UMP)** and **US state regulations message** created in AdMob. Show them on first launch through `@shared/consent` before any ad request.
- [ ] `app-ads.txt` hosted at the root of the developer website listed in Play Console. Missing app-ads.txt can cut fill and eCPM substantially.
- [ ] Play Console **Data safety** form: declare the data collected by the Ads SDK (Device or other IDs, App interactions, Diagnostics), shared for advertising, encrypted in transit.
- [ ] Target audience **13+** (or 18+ for Contraction Timer). Do **not** opt into the Families program. Child-directed apps can only use certified ad networks and lose personalized ads.
- [ ] Turn on **blocking controls**: block sensitive categories (gambling, dating, get-rich-quick). Block more for the maternity app.
- [ ] Test with test unit IDs and register your device as a test device. **Never click your own live ads.** AdMob bans for invalid traffic quickly.

## 2. Formats & where they belong
| Format | Typical eCPM (Tier-1) | Use for | Rules |
|--------|----------------------|---------|-------|
| **Rewarded** | Highest | Hints, extra lives, streak freeze, theme unlocks, "double XP" | Always opt-in, with a clear value shown on the button (`▶ Watch ad: +1 hint`). Grant the reward only on the `EARNED_REWARD` event. |
| **Interstitial** | High | Natural breaks: level complete, after leaving stats | At least 90 s apart in games and 180 s in utilities. Never on app launch, never right after a tap the user expects to do something else, none in the first session's first 2 levels. Preload ahead of time. |
| **App open** | Medium–high | Warm start (returning from background after 30 s or more) | Not on cold start in the first session. Not when the app was opened from a notification action. Not during an active task (e.g. a timing session). |
| **Adaptive anchored banner** | Low but steady | Menus, home, history | Never directly next to primary buttons (avoids accidental clicks). Don't place over game boards. One banner per screen at most. |
| **Native advanced** | Medium | Inside lists (history, stats, week-by-week) | Must look like an ad: "Ad" badge, distinct background. At most 1 per screen. |

## 3. Frequency-cap defaults (`packages/shared/ads` config)
```ts
export const defaultAdPolicy = {
  firstSessionGraceMs: 120_000,     // no interstitial/app-open in first 2 min of first-ever session
  interstitialMinIntervalMs: 90_000,// games; utilities override to 180_000
  interstitialEveryNActions: 2,     // e.g. every 2 levels
  appOpenMinBackgroundMs: 30_000,
  maxInterstitialsPerSession: 6,
  rewardedAlwaysAvailable: true,
};
```
Each app overrides these values in `src/ads.config.ts` and can veto any ad with `canShow(placement, appState)`. For example, the Contraction Timer returns `false` while a session is active.

## 4. Mediation (do it once you reach ~1k DAU)
AdMob mediation lets several ad networks compete for each impression, which typically raises eCPM by 20–40%.
- Use **bidding** partners first (no waterfall maintenance): **AppLovin, Meta Audience Network, Liftoff (Vungle), Unity Ads, ironSource (LevelPlay), Mintegral, Pangle, InMobi**.
- Install the matching adapters via a config plugin and rebuild with EAS. Only adapters for networks you've signed up for.
- Re-check the mediation report every month and drop networks with under 1% share.

## 5. Revenue optimization loop (monthly)
1. In AdMob, check ARPDAU (**Estimated earnings ÷ DAU**), split by app and country.
2. If D7 retention drops after an ad change, roll it back. Retention is worth more than one month's eCPM.
3. A/B test caps (e.g. interstitial every 2 vs 3 levels) by shipping the cap values in a remote-free way: a JSON file delivered via **EAS Update**. No backend is needed.
4. Add rewarded placements wherever users get stuck. That makes money and improves the experience at the same time.
5. Cross-promote between the 5 apps with free **house ads** (a native-styled card linking to the other apps' Play pages).

## 6. Policy guardrails (account safety)
- No ads that appear without user action in the middle of a task, no ads that look like app content, no "click the ad" incentives.
- No interstitial before the app's content has loaded, and none when the user is trying to exit.
- Rewarded ads must state the reward before the ad plays.
- The privacy policy must mention the AdMob/Google advertising ID and must be linked both in the app (Settings → Privacy) and on the listing.
