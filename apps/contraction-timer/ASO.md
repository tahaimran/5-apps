# Contraction Timer & Kick Count — ASO Plan (Google Play)

> Store: Google Play only · Primary market: US (en-US) · Data source: Applyra (traffic / difficulty, 0–100).
> Companion doc: [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md).

---

## 1. Final metadata

| Field | Value | Length (Play count) |
|---|---|---|
| **Title** | `Contraction Timer & Kick Count` | 30 / 30 |
| **Short description** | `Time contractions & spot 5-1-1 patterns. Kick counter & due date calculator` | 75 / 80 |
| **Full description** | see §1.1 | 3,320 / 4,000 (UTF-16, as Play counts) |

Title rationale:
- Starts with the exact-match head term **"contraction timer"** (54/63) — the single highest-value keyword we can realistically rank for.
- "Kick Count" is itself a Play autocomplete suggestion (see §3) and token-matches "baby kick counter" (25/51) / "kick count"; the full phrase "kick counter" goes in the short description so both forms are indexed. ("Contraction Timer & Kick Counter" = 32 chars, over the limit.)
- No forbidden title words ("free", "#1", "best", "top", "new"), no emoji, no ALL CAPS.
- Alternative for A/B (store listing experiment, week 4): `Contraction Timer: Labor & Kicks` (32 — too long) → `Contraction Timer + Kick Count` (30).

Short description rationale: verb-first benefit ("Time contractions"), the differentiator ("spot 5-1-1 patterns" — users search "5-1-1 rule"), then two secondary keywords with exact phrases "kick counter" and "due date calculator". No claims like "detect labor".

### 1.1 Full description (final, paste-ready)

```
A calm, one-tap contraction timer and kick counter for the last weeks of pregnancy. Big buttons, a dark night mode for 3am, and a clear summary you can send to your midwife or doctor. Everything stays on your phone.

When labor might be starting, you don't need a cluttered app. You need one giant button, honest numbers and a gentle nudge to call your care team when your pattern matches the plan they gave you. This contraction tracker and contraction counter is built for exactly that moment, for you and your birth partner.

⏱ CONTRACTION TIMER
• One giant button: tap when a contraction starts, tap again when it ends
• Duration, frequency and interval calculated for you, live
• Average duration and interval over the last hour, at a glance
• Tag each contraction as mild, moderate or strong
• Works one-handed and in the dark, with haptic feedback on every tap
• Screen stays awake while you are timing
• Keeps timing even if your phone locks or the app is closed

🔔 LABOR PATTERN ALERT (5-1-1, 4-1-1, 3-1-1)
• Choose the rule your provider recommended, or set your own
• A gentle message appears when your recent contractions match it: "This matches the pattern your provider asked you to watch for. Consider calling them now."
• No diagnosis, no guessing: the app shows your numbers, your provider decides

📄 SHARE WITH YOUR MIDWIFE OR DOCTOR
• Session history with every contraction listed
• Send a clean text summary by message or email in two taps
• Create a PDF summary on your phone and share it with your hospital or birth center
• Nothing is uploaded: no account, no cloud, no tracking of your health data

👣 KICK COUNTER
• Count to 10 movements and see how long it took
• History of every kick session so you can notice your baby's usual rhythm
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

Keyword density (natural, no stuffing): "contraction timer" ×2 (+ title), "contraction(s)" ~10, "kick counter" ×2, "due date calculator" ×1, "pregnancy week by week" ×1, "hospital bag" ×2, "birth plan" ×2, "5-1-1" ×1, "midwife" ×3, "partner" ×4, "labor" ×4. Emoji only as section markers (allowed in Play descriptions, banned in title).

### 1.2 Applyra `check_metadata` (GPLAY) results

| Run | Input | Result |
|---|---|---|
| 1 | Title + short + full description v1 (without the "contraction tracker / counter" sentence) | `valid: true`. Title 30/30, short 75/80, description 3,205/4,000 (Play counts UTF-16; emoji cost >1 char). **0 errors.** 1 *warning* (informational: visible 3,200 vs store-counted 3,205 because of emoji) + 1 *info* (emoji allowed in description, banned in app name). No policy rules fired (price / ranking / call-to-action / play-program / kids / rival-platform all clear). |
| 2 (final) | Final title + short + description (§1.1, adds "contraction tracker and contraction counter" sentence after autocomplete) | `valid: true`. Title 30/30, short 75/80, description **3,320/4,000** (680 left). **0 errors**, no policy rules fired. Same 1 non-policy warning (visible 3,315 vs store-counted 3,320 due to emoji) + 1 info (emoji OK in description). |

Action on warnings: the emoji length warning is not a policy problem; we keep ~650 chars of headroom so it can never push us over 4,000. No title emoji.

---

## 2. Keyword research (Applyra, Google Play US en-US)

| Keyword | Traffic | Difficulty | Priority | Placement |
|---|---|---|---|---|
| contraction timer | 54 | 63 | **P0** head | Title (exact, first), description ×2 |
| pregnancy tracker contraction timer | 8 | 27 | P1 long-tail | Description (pregnancy + contraction timer tokens) |
| pregnancy labor signs | 8 | 27 | P2 | Description ("labor", pattern); avoid symptom claims |
| baby kick counter | 25 | 51 | **P0** | Title ("Kick Count"), short desc ("Kick counter"), description |
| pregnancy tracker kick counter | 9 | 32 | P1 | Short + description |
| due date calculator | 25 | 40 | **P0** | Short desc (exact), description heading |
| pregnancy tracker due date | 10 | 43 | P1 | Description |
| pregnancy week by week | 9 | 34 | P1 | Description (exact phrase ×1) |
| pregnancy tracker weekly | 9 | 30 | P2 | Description |
| pregnancy tracker | 48 | 63 | P3 (aspirational) | Tokens only; dominated by big brands |
| pregnancy tracker free | 8 | 32 | P3 | Never use "free" in title or short description (Play price rule = error in both); skip |
| pregnancy tracker app | 9 | 41 | P3 | Tokens |
| pregnancy birth plan template | 8 | 23 | **P1 easy win** | Description "Birth plan checklist"; v1.1 add "template" wording |
| baby size comparison | 9 | 30 | P1 | Description ("baby's size compared to fruit") → v1.1 exact phrase |
| pregnancy weight tracker | 9 | 30 | v1.1 | Only after feature ships |
| pregnancy hydration reminder | 10 | 32 | v1.1 | Only after feature ships |
| baby tracker | 47 | 72 | v2 | Out of reach now; newborn-log spin-off |

### Autocomplete (Applyra `run_autocomplete`, GPLAY US en-US, 2026-10-08)
| Prefix | Suggestions |
|---|---|
| `contraction` | contraction timer · contraction tracker · contraction counter · contractions · contraction timer free |
| `kick count` | kick counter · kick counter app · kick count · kick counting baby app · kick counter baby |

Findings: "contraction tracker" and "contraction counter" are real queries not in the original set → added one natural sentence to the description. "kick count" is a standalone query, validating "Kick Count" in the title. "…free" variants exist but we never put "free" in the title or short description (Applyra flags it as a price-rule ERROR in both on Google Play).

---

## 3. Competitor landscape

| App | Package / publisher | Strength | Weakness we exploit |
|---|---|---|---|
| Contraction Timer & Counter | wachanga | Leader on "contraction timer" (top-3 share 67% with peers), strong brand family, cross-promo to Pregnancy app | Upsells, account/content push; numbers without provider-rule framing |
| Contraction Timer & Counter 9m | com.neiman.contractions | 4.8★, simple | Dated UI, no night mode emphasis, minimal sharing |
| Full Term – Contraction Timer | Full Term | Clean, trusted by doulas | Few extras (no kicks/due date in one place), sparse localization |
| Pregnancy+ | Philips | Massive brand, 3D visuals | Heavy, content-first; timer buried |
| What to Expect | com.wte.view | Content authority, community | Account, bloat, not a labor tool |
| BabyCenter | BabyCenter | Content/community | Same as above |
| Pregnancy App | easymobs | Ranking breadth | Ad-heavy reviews |
| Pregnancy & Due Date | wachanga | Due-date long-tail | Cross-sell funnel |
| Pregnancy Tracker & Day by Day | various | Daily content | Not a labor tool |

Market gap (from research): timers are functional but don't interpret patterns or make sharing easy; all-in-ones are bloated; users want fast, calm, offline. Our listing must say **calm · one button · share with midwife · private/offline** in the first 2 lines and first 3 screenshots.

---

## 4. Keyword placement strategy
1. **Title** (highest weight): `Contraction Timer` exact + `Kick Count`.
2. **Short description** (high weight): `5-1-1`, `Kick counter`, `due date calculator` — three exact phrases.
3. **Full description**: first 250 chars repeat "contraction timer", "kick counter", "midwife", "night mode"; each section heading is a keyword (CONTRACTION TIMER, KICK COUNTER, DUE DATE CALCULATOR & PREGNANCY WEEK BY WEEK, HOSPITAL BAG & BIRTH PLAN CHECKLISTS); long-tails woven naturally. Target 2–3 mentions for P0 terms; no lists of keywords.
4. **Developer name / package**: no keyword stuffing; package `contractiontimer` is harmless.
5. **In-app events / promotional content** (Play Console): "New: pattern alert presets" — not counted for search but boosts conversion.
6. **Localized listings** carry localized keywords (not translated literally — run autocomplete per locale).

---

## 5. Creative assets

### Icon concept
Rounded square, soft cream `#FBF7F4` background; centered large teal `#3E9C95` circle (the "giant button") with a thin coral `#E07A5F` arc around it forming a stopwatch ring; inside, a minimalist crescent/belly curve in white. No text, no medical cross, no emoji. Must read at 48px; test against wachanga's pink and Full Term's purple icons for distinctiveness.

### Feature graphic (1024×500)
Left: phone mockup showing the Timer in night mode (black/red) with "Stop 0:47" glowing. Right on cream: "One tap. Calm numbers. Ready for your midwife." Small "Contraction Timer & Kick Count" lockup. No ratings/badges/"#1" claims.

### Screenshot storyboard (8, portrait 1080×1920, caption band top)
| # | Screen | Caption |
|---|---|---|
| 1 | Timer resting, big teal button, stats strip | **One big button. That's it.** |
| 2 | Pattern banner "Your last hour matches the 5-1-1 pattern…" | **Know when your 5-1-1 pattern is reached** |
| 3 | Share sheet with text summary + PDF preview | **Send a clear summary to your midwife** |
| 4 | Night mode red-shifted timer | **Night mode made for 3am** |
| 5 | Partner mode giant digits, partner's hand holding phone | **Partner mode: big text, zero setup** |
| 6 | Kick counter 10/10 "in 14 min" + history | **Count kicks to 10 and see your baby's rhythm** |
| 7 | My Pregnancy: week 34, cantaloupe size card + due date | **Due date calculator & week-by-week sizes** |
| 8 | Hospital bag checklist 70% | **Hospital bag & birth plan checklists. Private, offline** |

Rules: real UI only, disclaimer-safe wording ("know when the pattern is reached", never "know when you're in labor"); localize captions for wave-1 locales.

### Promo video (30 s, YouTube unlisted)
0–5 s: dark bedroom, phone glow, tap → "Start" haptic ripple. 5–12 s: contractions accumulate, stats update. 12–18 s: calm amber banner "matches 5-1-1 — consider calling your provider". 18–24 s: partner taps Share → PDF in messages to "Midwife Sarah". 24–30 s: kick counter & week card montage, end card "Calm. Private. On your phone." + disclaimer line "Not a medical device."

---

## 6. Localization priorities (top 10)
Ordered by maternity-app volume × eCPM × competition gap:
1. en-US (also en-GB "Contraction Timer & Kick Count", midwife wording)
2. es-ES / es-419
3. pt-BR
4. de-DE
5. fr-FR
6. id-ID
7. hi-IN
8. it-IT
9. ru-RU
10. tr-TR (then ja-JP, ko-KR, pl-PL)

Localized titles (≤30 chars; lengths below verified with a Python UTF-16 count script — `check_metadata` was run on en-US only, so re-run it per locale before upload; validate head terms via `run_autocomplete` in each locale):
| Locale | Title | Chars |
|---|---|---|
| es | `Contracciones y Pataditas` | 25 |
| pt-BR | `Contrações e Chutes do Bebê` | 27 |
| de | `Wehen-Timer & Kindsbewegungen` | 29 |
| fr | `Contractions & Mouvements Bébé` | 30 |
| id | `Timer Kontraksi & Tendangan` | 27 |
| hi | `संकुचन टाइमर और किक काउंटर` | 26 (UTF-16; verified by script) |

Short descriptions localized by native speakers (not MT-only); week-by-week content needs medical review per locale (units: cm/kg default outside US).

---

## 7. Rating strategy
- Use Play In-App Review API (`expo-store-review`), max once per 90 days, ≤ 2 lifetime.
- **Trigger only after a positive moment:** kick session completed to target (e.g., "10 movements in 14 min") **and** ≥ 2 positive moments recorded **and** app age ≥ 3 days; or after checklist reaches 100%; or postpartum "Baby is here!" celebration.
- **Never** during an active contraction session, within 24 h after a contraction session, after a kick session that hit the 2-hour provider message, or on any screen with health warnings.
- Pre-prompt (soft): "Is Contraction Timer helping you feel prepared?" [Yes] → system review; [Not really] → in-app feedback mailto. 
- Reply to every review < 48 h; template for "ads" complaints explains the no-ads-during-labor policy.

---

## 8. ASO iteration plan
| When | Action (Applyra) |
|---|---|
| Launch (week 0) | `add_application` (Play listing), `add_competitor` × 5 (wachanga timer, com.neiman.contractions, Full Term, wachanga Pregnancy, easymobs), `track_keywords` for all §2 keywords + "contraction tracker", "contraction counter", "kick count", "5-1-1 contractions". |
| Week 2 | Read `get_keyword_rank_history`: if "contraction timer" not in top 30 but long-tails top 10 → keep title, strengthen description first 2 lines. `run_autocomplete` for "due date", "birth plan", "labor". Check conversion in Play Console (store listing acquisition). |
| Week 4 | `simulate_metadata` with variants: (A) current; (B) short desc `Contraction timer with 5-1-1 alert, kick counter & due date calculator`; (C) title `Contraction Timer + Kick Count`. Run Play Store Listing Experiment on short description + screenshots 1–3 (calm vs. partner-led). Ship wave-1 localizations. |
| Week 8 | `get_aso_health` + `get_app_score_history`; if "baby kick counter" ≥ top 10 and "contraction timer" stalled, test title `Contraction Timer: Kick Counter` (if ≤30 via wording tweak) or emphasize "Labor"; add v1.1 keywords ("pregnancy hydration reminder", "pregnancy weight tracker", "birth plan template") once features ship. Re-run `check_metadata` on every change. |
| Ongoing | Monthly competitor metadata diff; seasonal: none strong (births steady), but Jan/Sep slight peaks — refresh screenshots then. |

---

## 9. Category & tags
**Recommended category: Parenting.**
- **Medical** invites stricter reviewer scrutiny, implies clinical use (we are explicitly *not* a medical device), and its user intent skews to professionals/drug references.
- **Health & Fitness** is crowded with workout/diet apps; pregnancy users browse less there and our 3-feature labor tool looks out of place next to calorie trackers.
- **Parenting** is where the direct competitors (wachanga, Full Term, What to Expect, BabyCenter) sit, matching user browse behavior and category-chart opportunity (smaller chart = easier top-100 visibility). Health apps declaration is still completed regardless of category.

Tags (Play Console, up to 5): Pregnancy · Parenting · Baby care · Health tracker · Timer.

Content rating: expect "Everyone"/PEGI 3 per IARC; target audience set to **18+**. Listing contact: support email + privacy policy URL; developer website hosts `app-ads.txt`.

Listing-level disclaimer (also in description): "Not a medical device. Not medical advice. Always follow your provider's guidance."
