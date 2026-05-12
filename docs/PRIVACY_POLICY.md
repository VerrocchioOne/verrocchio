# Privacy Policy — Verrocchio

**Effective date:** 2026-05-12
**Last updated:** 2026-05-12

This Privacy Policy explains how Verrocchio LLC ("we," "us," "our") collects, uses, stores, and shares information in connection with the Verrocchio habit, goal, and journaling app (the "App"), available on the web at https://verrocchio.app and on iOS via the App Store.

Questions or requests: **support@verrocchio.app**.

## 1. Who this policy applies to

This policy applies to anyone who creates an account in Verrocchio or uses the App on a device. Verrocchio is a general-audience productivity and self-tracking app and is **not directed to children under 13** (or under 16 where applicable). See Section 10.

## 2. What we collect

We collect only what you give us. We do not run analytics SDKs, ad networks, or third-party trackers.

**Account information**

- Email address and password (handled by Firebase Authentication; we never see your password in plaintext).
- A randomly generated user ID (UID) assigned at signup.

**Content you create in the App**

- Habits, including the name, schedule, target, units, and per-day completion timestamps.
- Goals, todos, journal entries, quotes, archived items, and daily ritual notes.
- Important dates you add (e.g., upcoming events).
- A free-text "home location" and self-described travel days, if you choose to add them.
- Custom categories you define (goal types, importance levels, sections).
- Files you upload (e.g., photos attached to journal entries).

**Product interaction**

- Day visits (which dates you opened the app), feature-access timestamps, onboarding and tour completion flags, gamification state (XP, best streaks, unlocked achievements), and personal preferences (sort order, AI tone, signup timestamp).

**We do NOT collect:**

- Your real-time GPS location.
- Contacts, calendar, microphone, or camera (the App only reads files you explicitly choose to attach).
- Advertising identifiers (IDFA), device fingerprints, or cross-app tracking signals.
- Health data from Apple Health or Google Fit.

## 3. Why we collect it (purpose)

All data is used for **App Functionality only** — to render your habits, goals, journal, and progress; to synchronize that content across your devices; to authenticate you; and to provide optional AI-assisted features when you opt into them. We do not sell your data, do not share it for advertising, and do not use it for cross-context behavioral profiling.

## 4. Where your data is stored

- **Firebase Authentication, Cloud Firestore, and Cloud Storage** (operated by Google LLC). Your content is stored under a path scoped to your UID (`users/<your-uid>`) and is access-controlled by security rules so that only you, while signed in, can read or write it.
- **Your device**, in `localStorage` and IndexedDB, as a local cache and offline mirror.
- **Cloudflare Workers** (only when AI features are enabled): a lightweight proxy located between the App and the AI provider. The proxy does not persist your content.
- **Anthropic, PBC** (only when AI features are enabled): the text you send to AI features (e.g., daily briefings) is transmitted to Anthropic's API for inference. Anthropic processes the request and returns a response. We do not authorize Anthropic to train models on your content. See Anthropic's privacy and data-use terms at https://www.anthropic.com/privacy.

Data is processed in the United States and other regions where Google, Cloudflare, and Anthropic operate infrastructure.

## 5. Third parties (sub-processors)

| Sub-processor | Purpose |
|---|---|
| Google LLC (Firebase) | Authentication, database, file storage |
| Cloudflare, Inc. | AI request proxy (optional, off by default) |
| Anthropic, PBC | AI inference for optional features |
| Apple, Inc. | App distribution and crash reporting at the OS level |

We do not share your content with anyone else. We do not sell your data.

## 6. AI-assisted features

The App can optionally generate daily briefings, reflections, or insights using a large language model. When you trigger an AI feature, the relevant text (e.g., recent habit completions, a journal entry you choose to summarize) is sent through our Cloudflare Worker proxy to Anthropic and the response is returned to your device. The proxy is stateless; we do not log the content of your prompts beyond what is required to debug transient errors. **AI features are off by default in the current build and will only run when you explicitly enable them.**

## 7. Retention

We retain your content for as long as your account exists. You can delete individual entries at any time within the App. When you delete your account (Profile → Delete Account), we delete your Firestore document, your Firebase Storage uploads, and your Firebase Authentication record. Files you uploaded may take up to 30 days to be fully purged from backups. Local copies on your device are removed by signing out and clearing app storage, or by uninstalling the App.

## 8. Your rights — export, deletion, correction

- **Access / export:** Use Profile → Export Data to download a summary of your content at any time.
- **Correction:** Edit or delete any item directly in the App.
- **Deletion:** Use Profile → Delete Account to remove your account and your stored content. You can also email **support@verrocchio.app** and we will action a deletion request within 30 days.

**If you are in the European Economic Area, the UK, or Switzerland (GDPR / UK GDPR):** You have the right to access, rectify, erase, restrict, and port your personal data, and to object to processing. Our legal basis for processing is the performance of our contract with you (providing the App) and your consent for optional features such as AI. You may lodge a complaint with your local supervisory authority.

**If you are a California resident (CCPA / CPRA):** You have the right to know, delete, correct, and limit the use of sensitive personal information, and the right not to be discriminated against for exercising those rights. We do **not** sell or share your personal information as those terms are defined under California law.

## 9. Demo mode

The App includes a "demo" sign-in path for evaluators. Demo accounts are real Firebase accounts that share a common password and store the same fields described above. We may periodically reset or delete demo accounts without notice. Do not store information in demo mode that you wish to keep.

## 10. Children

Verrocchio is not directed to children under 13 (or under 16 in jurisdictions that require parental consent at a higher age). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact **support@verrocchio.app** and we will delete it.

## 11. Security

We use Firebase Authentication for password handling, Firestore Security Rules to scope read/write access to your own UID, HTTPS for transport, and Cloudflare for proxy edge protection. No method of transmission or storage is 100% secure; we recommend using a strong, unique password.

## 12. Health, medical, and journal disclaimer

Verrocchio is a personal productivity tool and is **not a medical device**. Information you record about exercise, sleep, mood, medication, or other health behaviors is your own self-reported content and is not reviewed by a clinician. The App does not provide medical, psychological, or legal advice. If you are in crisis, contact a qualified professional or local emergency services.

## 13. Tracking

We do not track you across apps or websites owned by other companies. The App does not present an App Tracking Transparency prompt because no tracking occurs. If this changes in a future version, we will update this policy and present the iOS ATT prompt before tracking begins.

## 14. Changes to this policy

We will post any changes here and update the "Last updated" date above. Material changes will be surfaced in the App on next sign-in.

## 15. Contact

Verrocchio LLC
Email: **support@verrocchio.app**
