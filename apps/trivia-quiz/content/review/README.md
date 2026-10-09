# Content review notes

The 3,600 questions were written by model agents in one pass (see `RELEASE.md`). **No independent fact-check pass
(plan §10 step 5) and no human spot check were done.** `node scripts/build-bank.mjs` only checks format, duplicates
and wording rules; it cannot tell whether a fact is true.

`flagged-by-writers.md` lists the questions the writers themselves said they were least sure of. Treat it as the
first place to look, not as a complete list: a question can be wrong without being listed.
