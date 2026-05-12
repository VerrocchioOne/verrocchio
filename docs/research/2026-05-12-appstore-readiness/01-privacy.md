# Verrocchio — Privacy & Data Handling Audit

**Date:** 2026-05-12
**Source:** parallel review subagent (privacy + data)
**Status:** authoritative input for master-plan.md §2 (Wave 1) and §4 (Wave 3) privacy items.

## Executive summary

- App is **Data Linked to You** across the board (Firebase email auth ties every doc to a real user). No third-party tracking SDKs, no analytics, no ad networks.
- Primary categories: **Contact Info** (email), **User Content** (journal, goals, habits, todos, quotes, uploaded files), **Health & Fitness** (habits/streaks frequently encode health behaviors), **Other Data** (preferences, gamification state).
- Three current sub-processors: **Google/Firebase** (Auth, Firestore, Storage), **Cloudflare** (Worker proxy — currently disabled), **Anthropic** (future AI features — currently disabled). All must be named in the policy.
- No privacy policy in repo today and no in-app link; both are App Store submission blockers.
- Highest-leverage gaps: orphaned Storage blobs on account delete, demo accounts that never expire, sign-out leaving localStorage intact, missing journal/health disclaimer.

## ARTIFACT 1 — Data inventory

| field | where stored | Apple category | linked to user | used for tracking | purpose |
|---|---|---|---|---|---|
| email (Firebase Auth) | Firebase Auth | Contact Info | Yes | No | App Functionality (auth) |
| uid (Firebase Auth) | Firebase Auth | Identifiers (User ID) | Yes | No | App Functionality |
| password hash | Firebase Auth | Credentials (Other Data) | Yes | No | App Functionality |
| goals | localStorage + Firestore | User Content | Yes | No | App Functionality |
| todos | localStorage + Firestore | User Content | Yes | No | App Functionality |
| habits (completions, completionTimes, completionUnits, frequency, target, unitLabel) | localStorage + Firestore | Health & Fitness | Yes | No | App Functionality |
| journal (free-text entries) | localStorage + Firestore | User Content (Other) | Yes | No | App Functionality |
| quotes | localStorage + Firestore | User Content | Yes | No | App Functionality |
| archive | localStorage + Firestore | User Content | Yes | No | App Functionality |
| dailyRitual | localStorage + Firestore | User Content | Yes | No | App Functionality |
| upcomingDates ({text, date}) | localStorage + Firestore | User Content | Yes | No | App Functionality |
| customGoalTypes / customImportance / customSections | localStorage + Firestore | Other Data (preferences) | Yes | No | App Functionality |
| dayVisits | localStorage + Firestore | Usage Data (Product Interaction) | Yes | No | App Functionality |
| bestStreaks | localStorage + Firestore | Health & Fitness | Yes | No | App Functionality |
| achievementsUnlocked, xp | localStorage + Firestore | Other Data (gamification) | Yes | No | App Functionality |
| homeLocation (free text) | localStorage + Firestore | Coarse Location (Other Data) | Yes | No | App Functionality |
| travelDays ({date, location, tripId}) | localStorage + Firestore | Coarse Location (Other Data) | Yes | No | App Functionality |
| sortPrefs | localStorage + Firestore | Other Data (preferences) | Yes | No | App Functionality |
| aiTone | localStorage + Firestore | Other Data (preferences) | Yes | No | App Functionality |
| signupAt | localStorage + Firestore | Other Data | Yes | No | App Functionality |
| onboardingComplete, tourDone, feature-access log | localStorage + Firestore | Usage Data (Product Interaction) | Yes | No | App Functionality |
| uploaded files (`users/<uid>/content/<file>`) | Firebase Storage | User Content (Photos/Other) | Yes | No | App Functionality |
| journal/habit text forwarded to Anthropic (when AI enabled) | Cloudflare Worker → Anthropic (transient) | User Content | Yes | No | App Functionality |
| device profile (runtime client-side) | not persisted | n/a | n/a | No | n/a |

## ARTIFACT 2 — Apple privacy nutrition label

```
Data Linked to You:
  Contact Info:
    - Email Address — App Functionality
  Identifiers:
    - User ID — App Functionality
  User Content:
    - Other User Content — App Functionality   (journal, goals, todos, habits, quotes, archive, dailyRitual, upcomingDates, custom categories)
    - Photos or Videos — App Functionality     (only if user uploads media to Firebase Storage)
  Health & Fitness:
    - Fitness — App Functionality              (habit completions, streaks, durations/units like minutes, cups, pages)
  Usage Data:
    - Product Interaction — App Functionality  (dayVisits, feature-access log, onboarding/tour flags)
  Other Data:
    - Other Data — App Functionality           (gamification: xp, bestStreaks, achievementsUnlocked; preferences: sortPrefs, aiTone, customGoalTypes, customImportance, customSections; coarse self-reported homeLocation and travelDays free-text; signupAt timestamp)

Data Not Linked to You: None.
Data Used to Track You: None.
```

## ARTIFACT 3 — Privacy Policy

Saved separately at `docs/PRIVACY_POLICY.md`. Uses `{{ENTITY}}` and `{{CONTACT_EMAIL}}` placeholders the orchestrator/founder will fill before hosting.

## Findings

| ID | Sev | Issue | Subagent-executable fix |
|---|---|---|---|
| PRIV-01 | H | `doDeleteAccount` removes the Firestore doc and Auth record but does not list+delete `users/<uid>/content/*` in Firebase Storage. Orphaned blobs remain indefinitely. Violates "delete on request" (5.1.1(v), GDPR Art 17). | Add a Storage cleanup step before auth deletion: `storage.ref('users/'+uid+'/content').listAll()` then `Promise.all(items.map(r=>r.delete().catch(()=>{})))`, wrapped in try/catch so a partial failure still proceeds with Firestore/Auth deletion. |
| PRIV-02 | H | No in-app link to a privacy policy or terms. App Store review will reject. | After hosting `docs/PRIVACY_POLICY.md` at Firebase Hosting `/privacy`, add a Profile → "Privacy Policy" link plus a sign-up checkbox + link. |
| PRIV-03 | M | Sign-out (`auth.signOut`) does not clear `localStorage` key `verrocchio-v1-<uid>` or IndexedDB. Content remains readable on shared devices via DevTools. | In sign-out handler: `await auth.signOut(); localStorage.removeItem('verrocchio-v1-'+uid); await db.terminate(); await db.clearPersistence().catch(()=>{}); window.location.reload();` |
| PRIV-04 | M | Demo accounts (shared password `verrocchio-demo-1`) are real Firebase users that never expire. | Add a scheduled Cloudflare Worker (or Firebase Cron Function) that nightly deletes any account flagged `isDemo: true` older than 24h. Rotate the shared password monthly. |
| PRIV-05 | M | Journal entries can contain health/mental-health content. No in-app disclaimer. | Add a one-time first-journal modal: "Verrocchio is not a medical device. Your entries are stored in your private Firebase account." Persist `journalDisclaimerAcked: true` in `DD`. |
| PRIV-06 | M | AI proxy will eventually forward journal content to Anthropic — needs disclosure + consent gate. | Behind the toggle that enables AI, gate first-use on a consent sheet that names Anthropic and links to the policy. Persist `aiConsentAt: <ms>` on `DD`. |
| PRIV-07 | L | No App Tracking Transparency (ATT) prompt today is correct (no tracking SDK). Risk is silent: if Firebase Analytics or a crash SDK is added later, ATT becomes mandatory. | Add a CI grep check that fails if `firebase/analytics` or similar is ever imported. |
| PRIV-08 | L | Age rating: mark **4+**, "Unrestricted Web Access: No", "User Generated Content: No (private-only)". | Set in App Store Connect submission flow. |
