// lib/app-config.js
//
// Static app-wide configuration constants. Pulled out of index.html
// (was L1341-L1381) into one file so deploy-tunable values + owner-
// gated allowlists live together. All declared at top-level classic-
// script scope — the inline body App() picks them up by bare name.

/* AI proxy: the daily briefing and journal-insights features need an
   LLM. We cannot call api.anthropic.com directly from the browser — it
   would require shipping an API key to every user, and CORS blocks the
   request anyway. Set AI_BACKEND_URL to a server-side proxy (e.g. a
   Cloudflare Worker or Cloud Function) that accepts the same
   {model, max_tokens, messages} body and forwards it to Anthropic with
   a private key. When null, the app falls back to a deterministic,
   data-driven briefing and a clear "not configured" message for
   insights — no failed network calls. */
const AI_BACKEND_URL = "https://ai.verrocchio.app";
const AI_ENABLED = !!AI_BACKEND_URL;
// App version — shown in the Profile footer. Bump on every deploy.
// Keep it semver-ish so the user can tell at a glance if the version
// they're on matches the one support is asking about.
const APP_VERSION = "0.2.0";
// Support / feedback address — shown as a mailto: link in Profile.
// Replace with your real support alias when you have one; gmail
// placeholder is OK for dev but will route to nowhere in production.
const SUPPORT_EMAIL = "support@verrocchio.app";
// Owner allowlist for the My Content file-upload UI. Firebase Storage
// writes carry storage cost; right now only the owner's account uploads
// files. Everyone else sees the "Add a link" row but the file picker
// is hidden, so they can still attach YouTube / Drive / Dropbox URLs
// to habits and goals without burning the bucket. To add an account,
// drop the user's Firebase Auth email (case-insensitive match) here.
const FILE_UPLOAD_ALLOWLIST = new Set([
  "zgthomas@yahoo.com"
]);
const canUploadFiles = (email) => !!email && FILE_UPLOAD_ALLOWLIST.has(String(email).toLowerCase());
// Store review URLs. Placeholders until the app has an App Store /
// Play Store listing. When running inside Capacitor, the review
// button can swap these for the native in-app-review flow (see
// @capacitor-community/in-app-review); in the meantime a plain
// https:// link is the safest cross-platform fallback.
const APP_STORE_URL  = "https://apps.apple.com/app/verrocchio";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.verrocchio";
// Review-prompt milestones. Arrays of days-since-signup at which the
// app should surface a one-time "leave a review" banner on Home.
// Keeping this as a module-level const makes it trivial to A/B test
// cadences later without touching component code.
const REVIEW_PROMPT_DAYS = [7, 14, 30];
