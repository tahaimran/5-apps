# Content rating (IARC questionnaire)

Category: **Productivity** (utility, reference, or tool app). Answer honestly; the table is what the app does today.

| Question | Answer |
|---|---|
| Violence, blood, fear, sexual content, nudity, profanity, gambling, simulated gambling | No |
| User-generated content or user-to-user interaction, location sharing | No (notes are private and local) |
| Purchases of digital goods | No (no IAP, no paywall) |
| Ads | Yes (AdMob; max ad content rating T; sensitive categories blocked in the AdMob console) |
| Unrestricted internet access / web browser | No |
| References to alcohol, tobacco or drugs | **No** (the two templates that named them were replaced on 2026-10-27, see below) |

## Resolved (2026-10-27): the "No smoking" and "No alcohol" templates are gone
The *Quit* category used to ship "No smoking" and "No alcohol", which would have made the IARC answer to
"references alcohol, tobacco or drugs" a yes and could have lifted the rating above Everyone / PEGI 3 in some
regions. For the widest audience they were replaced with substance-free bad habits: **"No snooze button"** and
**"No phone at meals"** (`src/data/templates.ts`, `src/i18n/en.json`), and the cigarette and wine-glass icons
left the editor's icon picker (`src/data/icons.ts`). "No sugary snacks", "No coffee after 2pm", "No doomscrolling",
"No impulse buys" and "No junk food" stay. Users can still type any habit name they like; that is user content and
not shipped by the app.

So the questionnaire answers are all **No**, and the expected result is **Everyone / PEGI 3**. Record the actual
ratings here after submission.
