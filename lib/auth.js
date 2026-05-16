// Firebase auth helpers. Originally inlined in index.html; extracted to
// this module as Phase 2 OSS-port Port #2 — EXTRACTION rather than a
// library swap. Research (docs/oss-port/research/batch-D-infrastructure.md)
// found no qualifying UMD library: react-firebase-hooks is bundled-ESM
// only (fails the no-build constraint) and reactfire targets the v9
// modular SDK while this app uses compat. So the win is the same as
// Port #3 hydration: isolate the helpers, pin them with Node tests, and
// shrink index.html.
//
// This module is loaded from index.html as a classic <script>, putting
// every helper in Script scope so the inline app script below can call
// them by name. The CommonJS export at the bottom is for the Node test
// suite (tests/auth.test.mjs). Same dual-load pattern as lib/hydration.js
// and lib/icalendar.js.
//
// The helpers fall into two groups:
//   PURE — no Firebase SDK, no React state. Trivially testable.
//     • mapAuthErrorToMessage  (Firebase code -> user-facing string)
//     • stripFirebasePrefix    (regex-strip the "Firebase: ..." envelope)
//     • isDemoPersonaEmail     (allowlist guard against arbitrary email login)
//     • isInvalidCredentialError (collapsed-code regex for sign-in retry path)
//
//   SEMI-PURE — calls Firebase APIs, but takes them via dependency injection
//   so Node tests can stub them. No React state at all.
//     • flushPendingWritesAndSignOut  (the data-loss-safe sign-out sequence)
//     • deleteAccountData             (storage + doc + auth user delete)
//
// What deliberately STAYS in index.html: the React state plumbing
// (onAuthStateChanged subscription, useState hooks, sign-in/up form
// callbacks, doChangeEmail / doChangePassword / doDeleteAccount with
// their setAcctFeedback/setAcctBusy side effects). Extracting those
// would require passing 4-6 setState callbacks per function, which is
// worse than the inline version.

// ─────────────────────────────────────────────────────────────────────────
// PURE helpers
// ─────────────────────────────────────────────────────────────────────────

// Maps a Firebase auth error to a user-facing string. Order matters: the
// "invalid-credential" / "wrong-password" / "user-not-found" branch
// collapses to the SAME message deliberately (anti-enumeration —
// Firebase v10+ already does this server-side; we mirror the policy on
// any legacy paths we still receive).
function mapAuthErrorToMessage(e) {
  const code = (e && e.code) || "";
  if (code === "auth/weak-password") return "Password must be at least 8 characters.";
  if (code === "auth/email-already-in-use") return "An account with that email already exists.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/invalid-credential") return "Email or password is incorrect.";
  if (code === "auth/wrong-password") return "Email or password is incorrect.";
  if (code === "auth/user-not-found") return "Email or password is incorrect.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait a minute and try again.";
  if (code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
  return "Authentication failed. Please try again.";
}

// Strips the "Firebase: " prefix and trailing "(auth/code)." suffix that
// Firebase SDK errors carry. Used for the Account modal feedback strings
// where the raw message is more informative than the collapsed mapping
// above (the user just reauthenticated — they know they're signed in).
function stripFirebasePrefix(e) {
  const raw = (e && (e.message || String(e))) || "Something went wrong.";
  return raw.replace(/^Firebase:\s*/, "").replace(/\s*\(auth\/[^)]+\)\.?\s*$/, ".");
}

// Allowlist guard for the seeded-persona sign-in path. Without this, a
// caller with knowledge of DEMO_PASSWORD could pivot to any email-based
// account. Uses Object.prototype.hasOwnProperty.call to reject prototype
// keys like "toString" / "__proto__" / "hasOwnProperty" itself.
function isDemoPersonaEmail(email, personasMap) {
  if (!email || !personasMap || typeof personasMap !== "object") return false;
  return Object.prototype.hasOwnProperty.call(personasMap, email);
}

// Detects the cluster of error codes that mean "credential didn't match
// any existing account". Firebase Auth v10+ collapsed "user-not-found"
// and "wrong-password" into "auth/invalid-credential" for enumeration
// hardening; older paths may still return the legacy codes or the
// upper-case INVALID_LOGIN_CREDENTIALS message string. The demo-sign-in
// path uses this to decide: "create the account on the fly" vs "surface
// the error to the user".
function isInvalidCredentialError(e) {
  const msg = String((e && e.message) || "");
  const code = String((e && e.code) || "");
  return (
    /user-not-found|invalid-login-credentials|INVALID_LOGIN_CREDENTIALS|invalid-credential/i.test(msg) ||
    /user-not-found|invalid-login-credentials|invalid-credential/i.test(code)
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SEMI-PURE — call Firebase APIs via injected dependencies
// ─────────────────────────────────────────────────────────────────────────

// Sign-out data-preservation flow (data-loss bug fix history).
//
// Old order: auth.signOut() -> db.terminate() -> db.clearPersistence()
// killed every in-flight save. save() is fire-and-forget: localStorage
// commits synchronously, then userDoc(uid).set() queues a network write
// via Firestore's offline mutation queue and returns immediately. If the
// user signed out within that ack window (typical: hundreds of ms on a
// phone connection), the auth token would be invalidated, the mutation
// frozen in IndexedDB, and clearPersistence() would DELETE IndexedDB —
// including the pending mutation. Result: today's morning ritual flip,
// "tips reviewed" dismissal, app streak day-visit append, and habit-card
// completions made shortly before sign-out were silently dropped from
// the cloud.
//
// New order: flush pending writes WHILE auth is still valid, then
// signOut. clearPersistence() / terminate() are dropped — the full page
// reload after this resolves creates a fresh Firestore SDK with its own
// cache anyway, and the user's own doc isn't a privacy leak to themselves.
//
// Caller is expected to navigate the page after this resolves (the
// inline doSignOut wrapper handles the location.replace).
async function flushPendingWritesAndSignOut(opts) {
  const {
    auth,
    db,
    userDoc,
    uid,
    latestData,
    sanitizeForFirestore,
    waitTimeoutMs
  } = opts;
  const timeout = typeof waitTimeoutMs === "number" ? waitTimeoutMs : 4000;
  try {
    // Step 1: explicitly re-push the latest in-memory snapshot. This is
    // a belt to the suspenders of waitForPendingWrites — if a save()
    // call was in-flight, its set() is already in the mutation queue
    // and waitForPendingWrites will catch it; if no save() was in
    // flight but `latestData` is somehow ahead of what reached cloud
    // (e.g. a save() that failed and parked on lastSaveRef), this
    // explicit set() catches that case.
    if (uid && latestData) {
      try {
        await userDoc(uid).set(sanitizeForFirestore(latestData));
      } catch (e) {
        try { console.warn("[verrocchio signOut] final flush set() failed:", e && e.code, e && e.message); } catch (_) {}
      }
    }
    // Step 2: wait for Firestore to ack every queued mutation. Capped
    // by `timeout` so a flaky network at sign-out time doesn't trap
    // the user on a half-disabled UI. If the cap fires, localStorage
    // still has the latest snapshot — sign-in's conflict resolution
    // (localTs > remoteTs branch in the load useEffect) will push the
    // missing writes up on next session.
    try {
      if (db && typeof db.waitForPendingWrites === "function") {
        await Promise.race([
          db.waitForPendingWrites(),
          new Promise(resolve => setTimeout(resolve, timeout))
        ]);
      }
    } catch (e) {
      try { console.warn("[verrocchio signOut] waitForPendingWrites failed:", e && e.code, e && e.message); } catch (_) {}
    }
    // Step 3: drop the auth token. Any further Firestore reads/writes
    // from this page lifetime would now fail rules, but the caller
    // navigates away below before that matters.
    await auth.signOut();
  } catch (e) { /* non-fatal */ }
}

// Account deletion data flow. Each step is best-effort except the
// final auth.currentUser.delete() — that one must succeed AND its
// failure must surface to the caller (which shows an inline error
// message and lets the user retry). The earlier steps run BEFORE the
// auth user is nuked because Firestore rules reject any post-delete
// writes for that uid.
//
// localStorage cleanup is deliberately NOT in here — that's a callsite
// concern (the SK-keyed localStorage entry name is an inline constant
// in index.html that we don't want to thread through DI).
async function deleteAccountData(opts) {
  const { auth, storage, userDoc, uid } = opts;
  // Storage cleanup — runs while user is still authenticated
  try {
    const listResult = await storage.ref("users/" + uid + "/content").listAll();
    await Promise.all(listResult.items.map(r => r.delete().catch(() => {})));
  } catch (e) {
    try { console.warn("[verrocchio delete] storage cleanup failed:", e && e.code); } catch (_) {}
  }
  // Best-effort Firestore doc delete BEFORE the auth user is nuked —
  // once the user is deleted, the security rules will reject any
  // further writes to their doc. Log on failure: orphaned Firestore
  // docs are unrecoverable once the auth user is gone.
  try { await userDoc(uid).delete(); }
  catch (e) { try { console.warn("[verrocchio delete] Firestore doc delete failed:", e && e.code, e && e.message); } catch (_) {} }
  // Auth user delete — the only step whose failure MUST propagate, so
  // the caller can surface it to the user. (The caller has already
  // reauthenticated immediately above, so a failure here is unusual:
  // network drop or a stale token are the realistic causes.)
  await auth.currentUser.delete();
}

// Dual-load shim. The browser path (no CommonJS) sees `window.verrocchioAuth`
// AND each helper is exposed by name in Script scope (because the inline
// `function` declarations above leak into the global scope when this is
// loaded as a classic <script>). The Node test path picks up the
// CommonJS export.
if (typeof window !== "undefined") {
  window.verrocchioAuth = {
    mapAuthErrorToMessage,
    stripFirebasePrefix,
    isDemoPersonaEmail,
    isInvalidCredentialError,
    flushPendingWritesAndSignOut,
    deleteAccountData
  };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    mapAuthErrorToMessage,
    stripFirebasePrefix,
    isDemoPersonaEmail,
    isInvalidCredentialError,
    flushPendingWritesAndSignOut,
    deleteAccountData
  };
}
