# Closed testing: 12 testers × 14 days (all 5 apps)

New personal Play developer accounts must run a **closed test with at least 12 testers who stay opted in for
14 days in a row** before they can apply for production. This is the plan and the messages to send.

Tester page on the website: **https://www.tahaimran.com/testing/** (source: `../tahaimran-website/src/pages/testing.astro`).
It explains the steps and has a "Join the test" button per app that stays "Link coming soon" until you fill it in.

## 1. Set up once (Play Console)
1. Create one **Google Group** for all apps, e.g. `tahaimran-testers@googlegroups.com`
   (groups.google.com → Create group; "Who can join": Anyone on the web can ask; "Who can view members": Group managers).
   One list for all 5 apps means each person is counted for every app they install.
2. For each app: Testing → Closed testing → Create track (or use "Alpha") → Testers → **Google Groups** → add the group.
   Countries: same as production. Save.
3. Upload the AAB to that track (`eas submit` goes to internal; promote the release to the closed track, or upload there).
4. Copy the track's **opt-in URL** (`https://play.google.com/apps/testing/<package>`) and put it in
   `../tahaimran-website/src/data/apps.ts` as that app's `testUrl`, then push the website. The page shows the
   "Join the test" button as soon as Vercel redeploys.
5. Add each tester's Gmail to the Google Group (Members → Add members, or approve their join request).

## 2. Keep the 14 days honest
- Count starts per tester when they opt in. Aim for **15–20 testers**, since some will drop out.
- Testers must stay opted in for the whole 14 days. Ask them not to leave the test or uninstall.
- Ask them to open each app a few times; Google's production application asks how testers engaged and what you
  changed from their feedback, so keep a simple log (date, who, what they said, what you fixed).
- After 14 days with 12+ testers: Dashboard → **Apply for production** and answer the questions about the test.

## 3. Messages to send

### WhatsApp / text (short)
```
Hi! I've built some small Android apps and Google needs 12 people to test them for 14 days before I can publish.
Could you help? It's free and takes 2 minutes: https://www.tahaimran.com/testing/
Just send me the Gmail you use on the Play Store. Thank you!
```

### Email
```
Subject: Could you test my Android apps for 2 weeks?

Hi <name>,

I've built five small Android apps (a habit tracker, a water reminder, a large-print word search, a trivia quiz
and a contraction timer). Before Google lets me publish them, I need at least 12 people to test them for 14 days.

Would you be one of them? All you need is an Android phone:
1. Reply with the Google account (Gmail) you use on the Play Store.
2. I'll add you, then open the "Join the test" link for each app at https://www.tahaimran.com/testing/
3. Install the apps from Google Play and keep them for two weeks. Open them now and then.

None of the apps has an account, and what you enter stays on your phone. If anything looks wrong, just reply to
this email.

Thank you!
Taha
```

### Day-7 reminder
```
Thanks for testing! We're halfway through the 14 days. Please keep the apps installed until <date>,
and if anything felt confusing or broken, tell me. That's exactly what I need to fix before launch.
```

### Day-14 thank you
```
That's the 14 days done. Thank you! You can keep the apps (they'll update to the public version),
or leave the test from the "Join the test" link. I'll let you know when they're live on Google Play.
```

## 4. Release gate
Contraction Timer's closed test waits until the midwife/doctor and legal reviews are done (`docs/PLAY_UPLOAD.md` §F).
