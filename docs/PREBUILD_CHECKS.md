# Pre-build verification (2026-10-08)

Everything below was checked before any app code was written.

## 1. Store listing text: Applyra `check_metadata` (Google Play rules)
**All 38 titles and short descriptions are valid. 0 errors, 0 policy warnings.**

| App | Locale titles checked | Result | Notes |
|-----|----------------------|--------|-------|
| Habit Tracker | en, es, pt-BR, de, fr, id | ✅ all valid | es and pt-BR use exactly 30/30 |
| Sipling (Water) | en, es, pt-BR, de, fr, hi, id, ja, ru, tr | ✅ all valid | hi counts 30 for store purposes (22 visible: Devanagari marks cost extra), exactly at the limit, so don't add anything |
| Word Search | en, es, pt-BR, de, fr, it, nl, pl, sv | ✅ all valid | |
| Quizora (Trivia) | en, es, pt-BR, de, fr, hi (title **and** short description) | ✅ all valid | fr and hi titles at 30/30 |
| Contraction Timer | en, es, pt-BR, de, fr, id, hi | ✅ all valid | fr at 30/30; hi counts 26 (20 visible) |

Rules confirmed:
- The word **"free" is a rejection error in the title AND the short description** on Google Play. It is allowed only in the full description.
- Emoji are allowed in the full description, but **banned in the title**.
- Non-Latin scripts (Hindi) use more of the length limit than they appear to, so always re-run the check after editing.

## 2. Competitor publishers (verified against Applyra `top_charts`, GAME_WORD, US)
Corrections made in `apps/word-search/ASO.md`:
- "Word Search - Word Puzzle Game" (`com.playvalve.wsjourney`) is published by **Bluetile**, not "playvalve".
- "Word Search" (`com.mobilegame.wordsearch`) is published by **Italic Games**.
- PlaySimple Games and PeopleFun confirmed.
- The Vita and tellmewow senior apps are now identified by package name. They don't appear in the top-50 chart, so their publisher names are still unverified. Not a blocker.

Market signal from the chart: the Word category top 50 is dominated by large studios (PlaySimple, PeopleFun, Fugo, Malpa, Easybrain). This confirms the plan to rank through the "large print / seniors / easy" long tail first, rather than competing head-on for "word search".

## 3. Tooling
- **Applyra MCP:** connected and working.
- **GitHub:** connected, and pushes to `claude/gallant-ptolemy-x6ghtx` succeed.
- **Expo MCP:** connected (docs search works). EAS build and submit tools are available for when the apps exist.

## 4. Still to verify (needs a real device or an account)
- [ ] Water Reminder: the "+250 ml" notification action button when the app is fully killed (test on a Pixel and a Samsung, since Samsung's battery optimisation is aggressive). A fallback is described in its plan.
- [ ] Habit Tracker: home-screen widget refresh after a check-in (react-native-android-widget, dev build).
- [ ] Contraction Timer: timer survives the app being killed (wall-clock timestamps) and screen-awake behaviour.
- [ ] Accounts: Google Play developer account type (personal accounts need a **12 testers × 14 days** closed test), AdMob account approved, privacy policy URL, app-ads.txt domain.
