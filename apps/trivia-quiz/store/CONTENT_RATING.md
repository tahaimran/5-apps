# Content rating (IARC questionnaire)

Category: **Game** (Trivia). Answer honestly; the table is what the app does today. Content was scanned on
2026-10-26 across all 3,600 shipped questions (`assets/questions/en/*.json`: question, answers and explanation).

| Question | Answer |
|---|---|
| Violence (depicted), blood, gore, fear/horror imagery | No (text only, no images; see the history note below) |
| Sexual content, nudity | No |
| Gambling, simulated gambling, real-money rewards | No (no betting, no casino play; XP and stars have no cash value) |
| User-generated content or user-to-user interaction, location sharing | No (single player; Share sends a score picture through the share sheet) |
| Purchases of digital goods | No (no IAP; lifelines, extra hearts, Double XP and streak restores come from optional rewarded ads) |
| Ads | Yes (AdMob; max ad content rating T; gambling and dating categories blocked in the AdMob console) |
| Unrestricted internet access / web browser | No |
| Language (profanity, crude humor) | **No** (flag 1 edited out on 2026-10-27) |
| References to alcohol, tobacco or drugs | **No** (flag 2 items edited on 2026-10-27) |

## Resolved (2026-10-27): flags 1 and 2 edited out for an Everyone / PEGI 3 rating
Both flags from the 2026-10-26 scan were edited in `content/raw/` and the bank rebuilt (`node scripts/build-bank.mjs`,
still 3,600 questions, 1,200 per difficulty):
- **Language:** `mov-000191` no longer quotes "I don't give a damn". The "Anarchy in the U.K." question (answer
  "Sex Pistols", was `mus-000128`) became a Buzzcocks question (`mus-000301`).
- **Alcohol:** Champagne → Lemonade (`spo-000200`), Cider → Lemonade (tea question), duck confit "Red wine" →
  Vinegar, Pasteur explanation no longer mentions wine, "drunken doctor" → "Doc Boone" (`mov-000292`), Beer Hall
  Putsch question reworded to "a failed coup" (now `his-000302`), Whiskey Rebellion → The Gaspee Affair
  (`his-000077`), "champagne of teas" removed, Don Quixote "Wine skins" → Haystacks.
- **Tobacco:** Jamestown explanation no longer mentions tobacco farming (`his-000058`).
- **Drugs:** "The Opium War" option → "The Seven Years' War" (`his-000121`); the Hong Kong question now names the
  1842 Treaty of Nanking instead of the Opium War (now `his-000301`).
A re-scan of the shipped bank finds no alcohol, tobacco, drug or profanity words. The only hit is "most widely
drunk beverage" for tea, which is not an alcohol reference. Amy Winehouse appears by name only. Caffeine and
penicillin appear as plain science facts, not drug use.

So both answers are **No**.

## Also present, for the record (factual, text only, no depiction)
History and literature questions mention wars, assassinations (Lincoln, Kennedy, Franz Ferdinand), executions
(Mary Queen of Scots, Louis XVI, Lavoisier), the atomic bombs on Hiroshima and Nagasaki, Nazi Germany and Hitler,
murder mysteries (Agatha Christie, Crime and Punishment), horror titles (Frankenstein, Dracula, The Shining) and
gambling-related names (the Monaco casino, "Poker Face", the film *Casino* as a wrong option). Violence questions in
IARC are about depicted violence, so these do not make the violence answers "yes", but mention "historical
references in text, no depiction" if a free-text field allows it.

Expected result: **Everyone / PEGI 3**. Record the final questionnaire answers and the resulting ratings here after submission.

Target audience and content: **13+** (13–15, 16–17, 18+), not designed for children, not in Families.
