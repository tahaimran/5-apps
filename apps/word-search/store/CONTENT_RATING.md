# Content rating (IARC questionnaire)

Category: **Game** (Word / puzzle). Answer honestly; the table is what the app does today. All 12 packs
(1,643 words, `assets/wordlists/*.json`) were scanned on 2026-10-26.

| Question | Answer |
|---|---|
| Violence, blood, fear, sexual content, nudity, profanity, crude humor | No |
| Gambling, simulated gambling | No (no betting or casino play; see the note on POKER and BINGO) |
| User-generated content or user-to-user interaction, location sharing | No (single player, no chat, no sharing) |
| Purchases of digital goods | No (no IAP; extra hints come from an optional rewarded ad) |
| Ads | Yes (AdMob; max ad content rating PG; gambling and dating categories blocked in the AdMob console) |
| Unrestricted internet access / web browser | No |
| References to alcohol, tobacco or drugs | No in practice — see the borderline words below |

## Borderline words (low risk, listed so the answer is a conscious one)
- **EGGNOG** and **CIDER** were swapped out on 2026-10-27 (holidays: COCOA and CANDLES; seasons: MAPLE), so no
  drink that can be alcoholic remains. **TOAST** (bread, and holidays) and **CHEERS** (holidays) are everyday words. Nothing else alcohol-, tobacco- or drug-related
  (no WINE, BEER, RUM, CIGAR, etc.).
- **POKER** and **BINGO** (hobbies) are game names, not gambling mechanics.
- **KNIFE** (home), **HUNT** (holidays, as in egg hunt), **POPPY** (nature): everyday words.
- Holiday words include CHRISTMAS, EASTER, HALLOWEEN, ANGEL, SANTA; plan feature F5 says no religion-specific pack, and
  these are mainstream holiday vocabulary.
So the substance question is a clear **No**. Expected rating: **Everyone / PEGI 3**.

## Random filler letters
The grid generator scans filler letters against a profanity blocklist and re-fills offending cells
(plan §8 "Game logic", fill step 5; `src/domain/generator.ts`), so accidental rude words should not appear. Spot-check a few
Hard grids on the phone anyway.

Expected result: **Everyone / PEGI 3** (ASO §12). Record the final questionnaire answers and the resulting ratings
here after submission. Do not answer differently to get a lower rating.

Target audience and content: **18+ only**, not designed for children, not in Families. The content rating and the
target audience are separate forms; an Everyone rating with an 18+ audience is normal.
