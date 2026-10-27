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
| **Language (profanity, crude humor)** | **Decide before submitting — see flag 1** |
| **References to alcohol, tobacco or drugs** | **Decide before submitting — see flag 2** |

## Flag 1: one quoted mild swear word
`mov-000191` (Rhett Butler) explains: *"His line 'Frankly, my dear, I don't give a damn' is one of cinema's most
famous."* That is a mild profanity in quotation. Band name "Sex Pistols" (`mus-000128`) appears as an answer.
Options: answer the language question "mild/infrequent" truthfully, or edit the explanation (drop the quote) in
`content/raw/movies-*.json` and rebuild the bank (`node scripts/build-bank.mjs`), then answer No.

## Flag 2: incidental alcohol, tobacco and drug references (about a dozen items, all factual, none encourage use)
- Alcohol: Champagne as an answer option (`spo-000200`, the correct answer is Milk), duck confit "cooked in wine",
  Pasteur and wine, "drunken doctor" (`mov-000292`), the Beer Hall Putsch (`his-000216`), the Whiskey Rebellion as
  a wrong option (`his-000077`), "champagne of teas", Amy Winehouse (name only).
- Tobacco: Jamestown "survived thanks in part to tobacco farming" (`his-000058`).
- Drugs: the Opium Wars (`his-000121`, `his-000122`, historical); caffeine and penicillin as plain facts.
These are passing textual references, not depictions of use. The IARC questionnaire asks whether the app
*references* these substances; answering yes may move some regions off the lowest rating (for example an
"Alcohol Reference" style descriptor or PEGI 12 instead of 3). Options:
1. Answer truthfully ("references only, no depiction or encouragement") and accept the result; the audience is
   13+ anyway, so this is low-impact.
2. Edit the handful of items above and re-run the questionnaire.
Do not answer "no" to make the rating lower; a mismatch can get the listing rejected.

## Also present, for the record (factual, text only, no depiction)
History and literature questions mention wars, assassinations (Lincoln, Kennedy, Franz Ferdinand), executions
(Mary Queen of Scots, Louis XVI, Lavoisier), the atomic bombs on Hiroshima and Nagasaki, Nazi Germany and Hitler,
murder mysteries (Agatha Christie, Crime and Punishment), horror titles (Frankenstein, Dracula, The Shining) and
gambling-related names (the Monaco casino, "Poker Face", the film *Casino* as a wrong option). Violence questions in
IARC are about depicted violence, so these do not make the violence answers "yes", but mention "historical
references in text, no depiction" if a free-text field allows it.

Expected result: **Everyone / PEGI 3** if both flags are answered "no" after editing, otherwise possibly a step
higher in some regions. Record the final questionnaire answers and the resulting ratings here after submission.

Target audience and content: **13+** (13–15, 16–17, 18+), not designed for children, not in Families.
