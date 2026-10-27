# Play Console → App content → Health apps declaration

> **Release gate (WHATS_LEFT.md, top):** do not release to the public until (1) a qualified midwife or doctor has
> reviewed the week cards, checklists, the 5-1-1 alert wording and the kick-counter messages, (2) this declaration is
> filled in, and (3) the audience is 18+ only and the disclaimer has been checked by a lawyer. This declaration has to be
> signed off by a person; RELEASE.md §7 item 1 lists what to check.

| Question | Answer |
|---|---|
| Does the app have health features? | Yes: contraction timing with a pattern alert the user configures (5-1-1, 4-1-1, 3-1-1 or custom), a fetal movement (kick) counter, a due-date calculator and week-by-week pregnancy information |
| Feature type | "Pregnancy & reproductive health" / "fitness & wellness tracking" (WHATS_LEFT §4). Pick the closest options Play lists at submission; the labels change. Do **not** pick anything under medical devices, clinical decision support or disease management |
| Is it a medical device, or does it diagnose, treat or prevent a condition? | **No.** It records times the user taps and shows them back. The pattern alert only says the user's own numbers match the rule *their provider* gave them; it never says "you are in labour" |
| Does it use Health Connect or health sensors? | **No** |
| Is health data sent off the device? | **No.** No account, no server, Android backup off. Summaries leave only when the user shares them |
| Does it claim clinical or regulated outcomes? | **No.** Disclaimer: "Not a medical device. Not medical advice. Always follow your provider's guidance." (onboarding screen 2, More → "Not medical advice", the Skip sheet, every export footer, the full description) |
| Regulatory check | Confirm the pattern alert is not "regulated medical functionality" in the markets you ship to (FDA general wellness policy, EU MDR, UK MHRA). A person must do this; see RELEASE.md §7 |

## Wording rules for the listing and the app
- Say "matches the pattern your provider asked you to watch for". Never "detects labour", "predicts labour", "know
  when you're in labour", "safe", "diagnose", "monitor your baby".
- The kick counter is a record for the user to share; never claim it detects problems. Keep "Talk to your provider
  if movements feel different from usual".
- Fix the full-description claims listed in WHATS_LEFT §3 before pasting the listing: "Consider calling them now"
  (use the app's own wording), the "LABOR PATTERN ALERT" heading and "When labor might be starting", "your baby's
  usual rhythm", "in two taps" (it is three), and check "keeps timing even if the app is closed".
- The About screen may name the reviewing midwife or doctor only after the review is done.
- Health content credit and sources: week-by-week sizes and notes are general information, unreviewed until the
  clinical review above. Record the reviewer's name, credentials and date here once done: [reviewer], [date].
- v1.1 features (hydration and weight logs, ongoing notification, "Baby is here" flow) re-open this declaration
  and the Data safety form when they ship.
