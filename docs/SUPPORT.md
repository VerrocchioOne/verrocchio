# Verrocchio — Support

For questions, bug reports, or feedback, email **support@verrocchio.app**.

## Common questions

### How does sign-up work?
Verrocchio uses email + password via Firebase Authentication. You'll need a working email address — Firebase sends a password-reset link there if you forget your password.

### Will my data sync across devices?
Yes. Sign in with the same account on any device (web at https://verrocchio.app or the iOS app). Habits, goals, journal entries, and uploaded files sync via Firebase Cloud Firestore + Storage.

### How do I delete my account?
Profile → Account → Delete account. The flow re-authenticates you (we don't want anyone deleting your account from your unlocked phone), then:
1. Deletes any files you uploaded to your private folder in Firebase Storage.
2. Deletes your Firestore document (habits, goals, journal entries, etc.).
3. Deletes the Firebase Authentication record.

Once deleted, the data is unrecoverable. Backups in Firebase may persist for up to 30 days before final purge.

### What if I forget my password?
On the sign-in screen, tap "Forgot password?". Firebase sends a reset link to your email.

### Can I export my data?
Yes. Profile → Account → Export summary. Currently this produces a textual summary of your habits and streaks. Full granular export is not currently supported by design — Verrocchio is built as a journaling space, not a data-sync utility.

### How does dark mode work?
Verrocchio follows your device's system preference. On iOS, change in Settings → Display & Brightness. On desktop browsers, change in your OS theme settings.

### Why don't I see the AI insights button?
AI insights are not part of the v1.0 release. They're planned for v1.1 once we've validated the inference pipeline at scale.

## Bug reports

When emailing **support@verrocchio.app**, please include:
- Platform: iOS app version (Settings → About) OR web browser + OS.
- A short description of what you expected vs what happened.
- Steps to reproduce, if you can isolate them.
- Screenshot or screen recording if visual.

For account-specific issues (sync failures, missing data), please include the email address you signed up with so we can look up your account state.

## Privacy & data

See the full privacy policy at https://verrocchio.app/privacy.

Short version: we collect email + the content you create. No tracking, no analytics, no ads. Your data is stored in Firebase under a path keyed to your user ID; only you (signed in) can read or write it.

## Contact

Email: **support@verrocchio.app**

We typically respond within 1-2 business days.
