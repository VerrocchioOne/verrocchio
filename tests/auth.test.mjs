// Pinned-behavior tests for the Firebase auth helpers. Originally inlined
// in index.html (publicAuthErr, firebaseErrMsg, demo-persona allowlist,
// invalid-credential-code detection, the sign-out pending-writes flush
// sequence, and the delete-account-data sequence). Extracted to
// lib/auth.js as Phase 2 OSS-port Port #2 (EXTRACTION — no qualifying
// UMD library existed; see docs/oss-port/research/batch-D-infrastructure.md).
//
// These tests lock in the EXISTING behavior so the extraction can't
// silently regress error-code mappings, persona allowlist semantics, or
// the carefully-ordered Firestore-flush-before-signOut data-loss fix.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  mapAuthErrorToMessage,
  stripFirebasePrefix,
  isDemoPersonaEmail,
  isInvalidCredentialError,
  flushPendingWritesAndSignOut,
  deleteAccountData
} = require("../lib/auth.js");

// ─────────────────────────────────────────────────────────────────────────
// mapAuthErrorToMessage — pure mapping from Firebase auth/* codes
// ─────────────────────────────────────────────────────────────────────────

test("mapAuthErrorToMessage handles weak-password", () => {
  assert.equal(
    mapAuthErrorToMessage({ code: "auth/weak-password" }),
    "Password must be at least 8 characters."
  );
});

test("mapAuthErrorToMessage handles email-already-in-use", () => {
  assert.equal(
    mapAuthErrorToMessage({ code: "auth/email-already-in-use" }),
    "An account with that email already exists."
  );
});

test("mapAuthErrorToMessage handles invalid-email", () => {
  assert.equal(
    mapAuthErrorToMessage({ code: "auth/invalid-email" }),
    "Enter a valid email address."
  );
});

test("mapAuthErrorToMessage collapses invalid-credential, wrong-password, and user-not-found to the same anti-enumeration message", () => {
  const expected = "Email or password is incorrect.";
  assert.equal(mapAuthErrorToMessage({ code: "auth/invalid-credential" }), expected);
  assert.equal(mapAuthErrorToMessage({ code: "auth/wrong-password" }), expected);
  assert.equal(mapAuthErrorToMessage({ code: "auth/user-not-found" }), expected);
});

test("mapAuthErrorToMessage handles too-many-requests", () => {
  assert.equal(
    mapAuthErrorToMessage({ code: "auth/too-many-requests" }),
    "Too many attempts. Please wait a minute and try again."
  );
});

test("mapAuthErrorToMessage handles network-request-failed", () => {
  assert.equal(
    mapAuthErrorToMessage({ code: "auth/network-request-failed" }),
    "Network error. Check your connection and try again."
  );
});

test("mapAuthErrorToMessage falls back to generic message for unknown codes", () => {
  assert.equal(
    mapAuthErrorToMessage({ code: "auth/somecode-we-have-never-seen" }),
    "Authentication failed. Please try again."
  );
});

test("mapAuthErrorToMessage tolerates missing or empty error objects", () => {
  assert.equal(mapAuthErrorToMessage(null), "Authentication failed. Please try again.");
  assert.equal(mapAuthErrorToMessage(undefined), "Authentication failed. Please try again.");
  assert.equal(mapAuthErrorToMessage({}), "Authentication failed. Please try again.");
});

// ─────────────────────────────────────────────────────────────────────────
// stripFirebasePrefix — pure regex-strip of "Firebase: " prefix + code suffix
// ─────────────────────────────────────────────────────────────────────────

test("stripFirebasePrefix removes the 'Firebase:' prefix", () => {
  const out = stripFirebasePrefix({ message: "Firebase: Something went wrong." });
  assert.equal(out, "Something went wrong.");
});

test("stripFirebasePrefix removes the trailing (auth/code) suffix", () => {
  // The replacement appends a "." after stripping the code envelope, so
  // a message that already ended in a "." picks up a doubled period.
  // We pin the EXISTING behavior verbatim — not the idealized version —
  // because the user-facing strings in production have always rendered
  // this way and the doubled period is invisible in most contexts.
  const out = stripFirebasePrefix({
    message: "Firebase: The password is invalid. (auth/wrong-password)."
  });
  assert.equal(out, "The password is invalid..");
});

test("stripFirebasePrefix on a message with no trailing period after the body produces a single period", () => {
  const out = stripFirebasePrefix({
    message: "Firebase: The password is invalid (auth/wrong-password)."
  });
  assert.equal(out, "The password is invalid.");
});

test("stripFirebasePrefix returns the default for null/undefined errors", () => {
  // null/undefined fall through to the default. An empty object has no
  // .message but is truthy and String({}) === "[object Object]", which
  // is the historical fallback path; we pin it for safety even though
  // we don't expect it in practice (Firebase always populates either
  // .code or .message).
  assert.equal(stripFirebasePrefix(null), "Something went wrong.");
  assert.equal(stripFirebasePrefix(undefined), "Something went wrong.");
  assert.equal(stripFirebasePrefix({}), "[object Object]");
});

test("stripFirebasePrefix handles plain Error instances", () => {
  const err = new Error("Firebase: Something specific happened (auth/internal-error).");
  assert.equal(stripFirebasePrefix(err), "Something specific happened.");
});

// ─────────────────────────────────────────────────────────────────────────
// isDemoPersonaEmail — allowlist guard
// ─────────────────────────────────────────────────────────────────────────

test("isDemoPersonaEmail returns true for an exact match", () => {
  const personas = { "alex.morning@demo.verrocchio.app": { recipe: "morning-consistent" } };
  assert.equal(isDemoPersonaEmail("alex.morning@demo.verrocchio.app", personas), true);
});

test("isDemoPersonaEmail returns false for unknown emails", () => {
  const personas = { "alex.morning@demo.verrocchio.app": { recipe: "morning-consistent" } };
  assert.equal(isDemoPersonaEmail("attacker@example.com", personas), false);
});

test("isDemoPersonaEmail returns false for prototype keys (toString, __proto__) to block prototype-pollution lookups", () => {
  const personas = { "alex.morning@demo.verrocchio.app": { recipe: "morning-consistent" } };
  assert.equal(isDemoPersonaEmail("toString", personas), false);
  assert.equal(isDemoPersonaEmail("__proto__", personas), false);
  assert.equal(isDemoPersonaEmail("hasOwnProperty", personas), false);
});

test("isDemoPersonaEmail tolerates empty/missing inputs", () => {
  assert.equal(isDemoPersonaEmail("", {}), false);
  assert.equal(isDemoPersonaEmail(null, {}), false);
  assert.equal(isDemoPersonaEmail("anything", null), false);
});

// ─────────────────────────────────────────────────────────────────────────
// isInvalidCredentialError — detects the Firebase v10+ collapsed-code paths
// ─────────────────────────────────────────────────────────────────────────

test("isInvalidCredentialError matches the unified invalid-credential code", () => {
  assert.equal(isInvalidCredentialError({ code: "auth/invalid-credential" }), true);
});

test("isInvalidCredentialError matches legacy user-not-found", () => {
  assert.equal(isInvalidCredentialError({ code: "auth/user-not-found" }), true);
});

test("isInvalidCredentialError matches the upper-case INVALID_LOGIN_CREDENTIALS message", () => {
  assert.equal(
    isInvalidCredentialError({ code: "auth/internal-error", message: "Firebase: INVALID_LOGIN_CREDENTIALS" }),
    true
  );
});

test("isInvalidCredentialError returns false for unrelated codes", () => {
  assert.equal(isInvalidCredentialError({ code: "auth/network-request-failed" }), false);
  assert.equal(isInvalidCredentialError({ code: "auth/too-many-requests" }), false);
});

test("isInvalidCredentialError tolerates missing inputs", () => {
  assert.equal(isInvalidCredentialError(null), false);
  assert.equal(isInvalidCredentialError({}), false);
});

// ─────────────────────────────────────────────────────────────────────────
// flushPendingWritesAndSignOut — orchestrates the data-loss-safe sign-out
// ─────────────────────────────────────────────────────────────────────────

function makeFakeAuth() {
  const calls = [];
  return {
    calls,
    signOut: async () => { calls.push("signOut"); }
  };
}

test("flushPendingWritesAndSignOut performs the final set -> waitForPendingWrites -> signOut sequence in order", async () => {
  const callOrder = [];
  const auth = {
    signOut: async () => { callOrder.push("signOut"); }
  };
  const db = {
    waitForPendingWrites: async () => { callOrder.push("waitForPendingWrites"); }
  };
  const userDoc = (uid) => ({
    set: async (payload) => {
      callOrder.push("set");
      // sanitize was called and uid is correct
      assert.equal(uid, "u1");
      assert.equal(payload.sanitized, true);
      assert.equal(payload.foo, 1);
    }
  });

  await flushPendingWritesAndSignOut({
    auth,
    db,
    userDoc,
    uid: "u1",
    latestData: { foo: 1 },
    sanitizeForFirestore: obj => ({ sanitized: true, ...obj })
  });

  assert.deepEqual(callOrder, ["set", "waitForPendingWrites", "signOut"]);
});

test("flushPendingWritesAndSignOut still calls signOut when the final set() throws", async () => {
  const auth = makeFakeAuth();
  const db = { waitForPendingWrites: async () => {} };
  const userDoc = () => ({ set: async () => { throw new Error("set failed"); } });

  await flushPendingWritesAndSignOut({
    auth,
    db,
    userDoc,
    uid: "u1",
    latestData: { foo: 1 },
    sanitizeForFirestore: x => x
  });

  assert.deepEqual(auth.calls, ["signOut"]);
});

test("flushPendingWritesAndSignOut skips the final set() when uid or latestData is missing", async () => {
  const auth = makeFakeAuth();
  const dbCalls = [];
  const db = {
    waitForPendingWrites: async () => { dbCalls.push("waitForPendingWrites"); }
  };
  const udCalls = [];
  const userDoc = (uid) => ({
    set: async () => { udCalls.push(uid); }
  });

  await flushPendingWritesAndSignOut({
    auth,
    db,
    userDoc,
    uid: null,
    latestData: null,
    sanitizeForFirestore: x => x
  });

  assert.equal(udCalls.length, 0);
  assert.deepEqual(dbCalls, ["waitForPendingWrites"]);
  assert.deepEqual(auth.calls, ["signOut"]);
});

test("flushPendingWritesAndSignOut tolerates a db without waitForPendingWrites", async () => {
  const auth = makeFakeAuth();
  const userDoc = () => ({ set: async () => {} });
  await flushPendingWritesAndSignOut({
    auth,
    db: {},
    userDoc,
    uid: "u1",
    latestData: { foo: 1 },
    sanitizeForFirestore: x => x
  });
  assert.deepEqual(auth.calls, ["signOut"]);
});

test("flushPendingWritesAndSignOut caps waitForPendingWrites at the supplied timeout", async () => {
  const auth = makeFakeAuth();
  // wait forever — must be capped by the 50ms timeout we pass in
  const db = {
    waitForPendingWrites: () => new Promise(() => {})
  };
  const userDoc = () => ({ set: async () => {} });

  const t0 = Date.now();
  await flushPendingWritesAndSignOut({
    auth,
    db,
    userDoc,
    uid: "u1",
    latestData: { foo: 1 },
    sanitizeForFirestore: x => x,
    waitTimeoutMs: 50
  });
  const elapsed = Date.now() - t0;
  // Should NOT be anywhere near the default 4000ms — should resolve at the
  // 50ms cap. Allow a generous ceiling for CI jitter.
  assert.ok(elapsed < 1000, `expected wait to be capped, got ${elapsed}ms`);
  assert.deepEqual(auth.calls, ["signOut"]);
});

// ─────────────────────────────────────────────────────────────────────────
// deleteAccountData — orchestrates storage + Firestore doc + auth user delete
// ─────────────────────────────────────────────────────────────────────────

test("deleteAccountData deletes storage items, then Firestore doc, then auth user", async () => {
  const callOrder = [];
  const storage = {
    ref: () => ({
      listAll: async () => ({
        items: [
          { delete: async () => { callOrder.push("storage:a"); } },
          { delete: async () => { callOrder.push("storage:b"); } }
        ]
      })
    })
  };
  const userDoc = (uid) => ({
    delete: async () => { callOrder.push("doc:" + uid); }
  });
  const auth = {
    currentUser: {
      uid: "u1",
      delete: async () => { callOrder.push("authUser"); }
    }
  };

  await deleteAccountData({ auth, storage, userDoc, uid: "u1" });

  // storage deletes happen in parallel via Promise.all — both must be in the
  // log before doc:u1, and doc:u1 must precede authUser.
  assert.ok(callOrder.indexOf("storage:a") < callOrder.indexOf("doc:u1"));
  assert.ok(callOrder.indexOf("storage:b") < callOrder.indexOf("doc:u1"));
  assert.ok(callOrder.indexOf("doc:u1") < callOrder.indexOf("authUser"));
});

test("deleteAccountData proceeds when storage listAll fails (best-effort cleanup)", async () => {
  const callOrder = [];
  const storage = {
    ref: () => ({
      listAll: async () => { throw new Error("list failed"); }
    })
  };
  const userDoc = (uid) => ({
    delete: async () => { callOrder.push("doc:" + uid); }
  });
  const auth = {
    currentUser: {
      uid: "u1",
      delete: async () => { callOrder.push("authUser"); }
    }
  };

  await deleteAccountData({ auth, storage, userDoc, uid: "u1" });

  assert.deepEqual(callOrder, ["doc:u1", "authUser"]);
});

test("deleteAccountData proceeds to auth.currentUser.delete even when Firestore doc delete fails", async () => {
  const callOrder = [];
  const storage = {
    ref: () => ({ listAll: async () => ({ items: [] }) })
  };
  const userDoc = () => ({
    delete: async () => { throw new Error("doc delete failed"); }
  });
  const auth = {
    currentUser: {
      uid: "u1",
      delete: async () => { callOrder.push("authUser"); }
    }
  };

  await deleteAccountData({ auth, storage, userDoc, uid: "u1" });
  assert.deepEqual(callOrder, ["authUser"]);
});

test("deleteAccountData propagates auth.currentUser.delete errors so the caller can show a feedback message", async () => {
  const storage = {
    ref: () => ({ listAll: async () => ({ items: [] }) })
  };
  const userDoc = () => ({ delete: async () => {} });
  const auth = {
    currentUser: {
      uid: "u1",
      delete: async () => { throw new Error("auth delete failed"); }
    }
  };

  await assert.rejects(
    () => deleteAccountData({ auth, storage, userDoc, uid: "u1" }),
    /auth delete failed/
  );
});
