# Verrocchio — App Store Connect Submission Values

Founder pastes these into App Store Connect → My Apps → Verrocchio → 1.0 Prepare for Submission (per FOUNDER_HANDOFF.md Phase E3).

## App Information

| Field | Value |
|---|---|
| Name | Verrocchio |
| Subtitle | Daily reflection, gentle habits |
| Privacy Policy URL | https://verrocchio.app/privacy |
| Support URL | https://verrocchio.app/support |
| Marketing URL (optional) | https://verrocchio.app |
| Primary Category | Health & Fitness |
| Secondary Category | Lifestyle |
| Content Rights | Does not contain, show, or access third-party content |
| Age Rating | 4+ (no objectionable content) |

## Version Information (1.0)

### Promotional Text (170 char max)
Build habits that fit your real life. Track streaks, journal, and review goals — quietly, in one calm space. No ads, no tracking.

### Description (4000 char max)

Verrocchio is a calm habit tracker for people who want to live deliberately without the gamified noise.

Tap habits as you do them. Write a short daily reflection. Set goals that span weeks or years. Review where you've been, where you're going, and what you've quietly built.

WHY VERROCCHIO

- Phone-first design. Verrocchio fits the way you actually use your phone: quick taps, friction-free entry, calm visual language.
- No ads, no tracking, no analytics. We don't sell your data. We don't share it. We don't profile you. The whole stack is built around your account being yours.
- Multi-device sync via your private Firebase account. Sign in on web and iOS and your habits, goals, and journal entries follow.
- Offline-first. Your data syncs when you're online; the app keeps working when you're not.
- Dark mode that respects your OS theme automatically.

WHAT'S INSIDE

- Habits with flexible scheduling: daily, weekday, weekly, monthly, quarterly, or annual. Track binary completions or counts (cups, minutes, pages). Streaks and 30-day completion rates surface automatically.
- Goals with SMART decomposition. Break a year's aspiration into the habits that actually compound toward it.
- Journal entries with optional mood tags. Track what you noticed, not just what you did.
- Daily ritual: a calm, one-screen view of today's habits, today's goals, today's reflection.
- A gentle quote engine to ground each session.

WHO IT'S FOR

Verrocchio is for people treating a daily practice as art, not as a leaderboard. If you've tried other habit trackers and walked away because the gamification felt cynical, we built this for you.

PRIVACY

Verrocchio collects only what you give us: an email address, a password (handled by Firebase Authentication), and the content you create. We never run advertising SDKs, analytics, or cross-app trackers. We don't authorize any third party (including the AI provider we'll integrate in a future release) to train models on your content.

You can delete your account and all stored content from inside the app at any time — Profile → Account → Delete account.

See our full privacy policy at https://verrocchio.app/privacy and support resources at https://verrocchio.app/support.

A NOTE ON SCOPE

Verrocchio v1.0 is private-to-self. There's no social feed, no following, no public profiles. We may add optional sharing in a future version. We will never make sharing the default.

— Verrocchio LLC

### Keywords (100 char max)
habit,tracker,goal,journal,reflection,routine,daily,wellness,mindful,streak,planner,growth

### What's New in This Version
(Blank for 1.0 — only used for updates.)

### Support URL
https://verrocchio.app/support

### Marketing URL
https://verrocchio.app

### Copyright
© 2026 Verrocchio LLC

### Trade Representative Contact Information
(Optional — leave blank unless required for the founder's region.)

## Build

### Bundle Identifier
com.verrocchio.app

### Version
1.0.0

### Build
1

### Sign-in Information (for App Reviewer)
- Reviewers can create a new account on the sign-up screen with any email + any 8+ char password.
- For a populated demo, append `?demo=1` to the URL on the auth screen (or use these credentials in production builds where demo UI is hidden by default):
  - Email: alex.morning@demo.verrocchio.app
  - Password: (set via the build's DEMO_PASSWORD env at deploy time — provide the live value to App Review in the Notes field; rotate after the review is complete)
- Demo persona pool was trimmed to a single account during v1.0 prep; only `alex.morning@demo.verrocchio.app` exists in Firebase Auth.

### Notes for Reviewer
Verrocchio is a private habit / goal / journaling app. Sign-in is via Firebase Authentication (email + password). The app uses a deterministic non-AI "daily briefing" computed from the user's habit history — the AI insights feature flag is OFF in v1.0 and will ship in v1.1.

Account deletion: Profile → Account → Delete account. The flow re-authenticates, deletes the user's Firebase Storage files and Firestore document, then deletes the Authentication record.

Contact: support@verrocchio.app

## Export Compliance

| Question | Answer |
|---|---|
| Does your app use encryption? | Yes (HTTPS only) |
| Does your app qualify for any of the exemptions? | Yes — only standard HTTPS via Firebase / Cloudflare. No custom cryptography. |
| Have you submitted an annual self-classification report? | No (not required for HTTPS-only apps) |

## App Privacy

See `docs/APP_STORE_PRIVACY_LABEL.md` — paste step-by-step into ASC App Privacy questionnaire.
