# Verrocchio — Security Audit

**Date:** 2026-05-12
**Source:** parallel review subagent (security-reviewer)
**Status:** authoritative input for master-plan.md Wave 1 (foundation) and Wave 3 (interior) security items.

## Executive summary

1. **CRITICAL — Demo password committed to source control.** `DEMO_PASSWORD` in both `index.html:3548` and `scripts/seed-demo-users.mjs:29`. Any reader can sign into all four demo Firebase accounts.
2. **HIGH — AI proxy ships to production with `ALLOWED_ORIGIN = "*"`.** CORS wildcard in `ai-proxy/wrangler.toml`.
3. **HIGH — No password-reset flow on the login screen.** Comment claims it exists; no `sendPasswordResetEmail` call anywhere.
4. **HIGH — Account deletion leaves Firebase Storage orphaned.** `doDeleteAccount()` deletes Firestore + Auth but not `users/<uid>/content/*`.
5. **MEDIUM — No Firebase App Check; no SRI hashes on CDN scripts.**

## CRITICAL — SEC-C-01: Demo password hardcoded

**Files:** `index.html:3548`, `scripts/seed-demo-users.mjs:29`
**Fix:**
1. In `index.html`, replace the literal with `const DEMO_PASSWORD = "%%DEMO_PASSWORD%%";` and substitute at deploy time via the `dist/` build script.
2. In `seed-demo-users.mjs`, read from `process.env.DEMO_PASSWORD` with a required-env check.
3. Rotate demo passwords in Firebase Console (founder, CA-1).

## HIGH

### SEC-H-01 — AI proxy CORS wildcard
**Files:** `ai-proxy/wrangler.toml:18`, `ai-proxy/worker.js:87`
**Fix:** Uncomment `ALLOWED_ORIGIN = "https://verrocchio-1b116.web.app"`. Add multi-origin fallback in `cors()` if Capacitor `capacitor://localhost` traffic also calls the worker.

### SEC-H-02 — No "Forgot password" flow
**Files:** `index.html` login screen (~9520-9587)
**Fix handler:**
```js
const doForgotPassword = async () => {
  const email = authEmail.trim();
  if (!email) { setAuthErr("Enter your email address first."); return; }
  setAuthBusy(true);
  try { await auth.sendPasswordResetEmail(email); }
  catch (e) { /* swallow - anti-enumeration */ }
  setAuthInfo("If that email is registered, a reset link has been sent.");
  setAuthBusy(false);
};
```

### SEC-H-03 — Account deletion orphans Firebase Storage
**Files:** `index.html:4076-4099`
**Fix:** Before `auth.currentUser.delete()`:
```js
try {
  const listResult = await storage.ref("users/" + uidToNuke + "/content").listAll();
  await Promise.all(listResult.items.map(r => r.delete().catch(() => {})));
} catch (e) { try { console.warn("[verrocchio delete] storage cleanup failed:", e && e.code); } catch (_) {} }
```

### SEC-H-04 — No password complexity on signup
**Files:** `index.html:3519-3533`
**Fix in `doAuth()` signup path:**
```js
if (authMode === "signup" && authPass.length < 8) {
  setAuthErr("Password must be at least 8 characters.");
  return;
}
```
Server-side via Firebase Console password policy (founder, CA-3).

### SEC-H-05 — No SRI on CDN scripts
**Files:** `index.html:23-35`
**Fix:** Generate SHA-384 hashes and add `integrity=` + `crossorigin="anonymous"` to all six pinned CDN files (React, ReactDOM, firebase-app/firestore/auth/storage compat). Use:
```bash
curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

## MEDIUM

- **SEC-M-01 — No Firebase App Check.** Plan task W3-T11 wires SDK once founder enables in console.
- **SEC-M-02 — `limitsNavigationsToAppBoundDomains: false`** (`capacitor.config.json:10`). Leave for v1.0.
- **SEC-M-03 — Firestore IDB not cleared on sign-out** (`index.html:999, 4020`). Fix in `doSignOut`: `await auth.signOut(); await db.terminate(); await db.clearPersistence(); window.location.reload();`
- **SEC-M-04 — `console.log` in `wipeAllData`** (`index.html:6787, 6817, 6825`). Strip.
- **SEC-M-05 — Demo sign-in accepts arbitrary email** (`index.html:~3978`). Guard with `DEMO_PERSONAS` allowlist check.
- **SEC-M-06 — Storage 100 MB per-file cap too generous** (`storage.rules:32`). Reduce to 10 MB.

## LOW

- **SEC-L-01** — Firebase config duplicated in `seed-demo-users.mjs:27-28`. Centralize.
- **SEC-L-02** — No CSP on web path. Add via `firebase.json` headers.
- **SEC-L-03** — Raw Firebase error on sign-in (`index.html:3531`). Replace with mapping helper.
- **SEC-L-04** — `wipeAllData()` has no re-auth gate. Add type-to-confirm.

## Defense-in-Depth

- **DID-1** — Restrict Firebase API key by HTTP referrer + iOS bundle ID in GCP Console.
- **DID-2** — Enable Firebase Auth "Email enumeration protection."
- **DID-3** — Enable Firestore PITR.
- **DID-4** — Cloudflare Worker rate limiting on AI proxy.
- **DID-5** — `Vary: Origin` on Worker CORS responses.

## App Check setup plan (Wave 3)

**Step 1 (founder):** Console → App Check → create reCAPTCHA v3 key + enable DeviceCheck for iOS. Mode: Monitor → Enforce.

**Step 2 (subagent — `index.html`):** Load `firebase-app-check-compat.js`; initialize after `firebase.initializeApp`:
```js
const appCheck = firebase.appCheck();
appCheck.activate(new firebase.appCheck.ReCaptchaV3Provider("YOUR_RECAPTCHA_SITE_KEY"), true);
```

**Step 3 (subagent — Worker):** Optionally verify `X-Firebase-AppCheck` header.

**Step 4 (subagent — iOS):** Add `FirebaseAppCheck` via SPM; in AppDelegate use `DeviceCheckProviderFactory`.

## Cannot-automate list (founder)

| # | Action | Where |
|---|--------|-------|
| CA-1 | Rotate demo accounts password | Firebase Console → Auth |
| CA-2 | Enable email-enumeration protection | Firebase Console → Auth → Settings |
| CA-3 | Password policy (min 8) | Firebase Console → Auth → Settings → Password policy |
| CA-4 | Enable App Check + create reCAPTCHA v3 key | Firebase Console → App Check |
| CA-5 | Enable App Check enforcement | Firebase Console → App Check |
| CA-6 | Restrict Firebase API key by referrer | GCP Console |
| CA-7 | Enable Firestore PITR | Firebase Console |
| CA-8 | Cloudflare Worker rate limiting | Cloudflare Dashboard |
