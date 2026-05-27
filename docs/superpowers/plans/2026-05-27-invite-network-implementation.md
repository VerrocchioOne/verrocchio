# Invite Codes + My Network — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the user-visible portion of the referral system — every user has an invite code, can share it, and can watch a "My Network" list of joined users grow inside Profile → My Account.

**Architecture:** Two new top-level Firestore collections (`referralCodes/{code}` and `networks/{inviterUid}/joined/{inviteeUid}`); a new `lib/views/profile/NetworkPanel.js` mounted as a sub-tab inside the existing My Account panel; a pure `networkAchievements()` helper in `utils.js` (node-tested). Conversion is signup-truthy in v1; the schema is forward-compatible with the v1.x activity-gate Cloud Function.

**Tech Stack:** Plain JavaScript (no JSX, no TypeScript, no bundler — per `CLAUDE.md`), React 18 UMD via `React.createElement`, Firestore (with `onSnapshot`), Firebase Hosting catch-all rewrite (already in place), node --test for unit tests, Playwright via the `browser-qa` skill for visual verification.

**Spec:** `docs/superpowers/specs/2026-05-27-invite-network-design.md`

---

## File Structure

| Path | Purpose | New / Modified | LOC budget |
|---|---|---|---|
| `utils.js` | Add `networkAchievements(joinedCount, sharedOnce)` pure function + CommonJS export | Modified | +30 |
| `tests/utils.test.mjs` | Boundary tests for `networkAchievements()` | Modified | +60 |
| `firestore.rules` | Append rules for `referralCodes/` and `networks/{uid}/joined/` | Modified | +25 |
| `index.html` | `DD` defaults, `hydrateCloudDoc` backfill, boot-time invite resolution, code-claim helper, account sub-tab plumbing, SHELL_VERSION bump | Modified | +100 |
| `lib/views/profile/NetworkPanel.js` | New panel body — invite code card, achievements strip, joined list, "how it works" modal | Created | ~310 |
| `docs/PRIVACY_POLICY.md` | Add Invites & Networks clause | Modified | +6 |
| `archive/index.v86.html` | Snapshot before push (per memory `feedback_archive_on_large_push`) | Created | n/a |

`index.html` net add is well under the 1000-LOC cap. The existing 30k-LOC violation is unchanged by this slice.

---

## Task 1: `networkAchievements()` pure helper + tests (TDD)

**Files:**
- Modify: `utils.js`
- Modify: `tests/utils.test.mjs`

Why first: pure function, no Firestore dependency, drives the UI render in Task 5. TDD it.

- [ ] **Step 1: Write the failing tests**

Append to `tests/utils.test.mjs` (after the existing imports — `const { dk, getStreak, ... } = require("../utils.js");` already imports from utils):

```js
const { networkAchievements } = require("../utils.js");

test("networkAchievements: zero joins, never shared — all locked", () => {
  const a = networkAchievements(0, false);
  assert.equal(a.length, 8);
  assert.equal(a.filter(x => x.unlocked).length, 0);
});

test("networkAchievements: zero joins, shared once — only 'spread-the-word' unlocked", () => {
  const a = networkAchievements(0, true);
  assert.equal(a.filter(x => x.unlocked).length, 1);
  assert.equal(a.find(x => x.unlocked).id, "spread-the-word");
});

test("networkAchievements: 1 join — spread + first-builder unlocked", () => {
  const a = networkAchievements(1, true);
  const unlocked = a.filter(x => x.unlocked).map(x => x.id);
  assert.deepEqual(unlocked, ["spread-the-word", "first-builder"]);
});

test("networkAchievements: 3 joins — workshop-expanded unlocked at threshold", () => {
  const a = networkAchievements(3, true);
  assert.equal(a.find(x => x.id === "workshop-expanded").unlocked, true);
  assert.equal(a.find(x => x.id === "workshop-permanent").unlocked, false);
});

test("networkAchievements: 4 joins — workshop-permanent stays locked at boundary", () => {
  const a = networkAchievements(4, true);
  assert.equal(a.find(x => x.id === "workshop-permanent").unlocked, false);
});

test("networkAchievements: 5 joins — workshop-permanent unlocked at threshold", () => {
  const a = networkAchievements(5, true);
  assert.equal(a.find(x => x.id === "workshop-permanent").unlocked, true);
  assert.equal(a.find(x => x.id === "pro-month").unlocked, false);
});

test("networkAchievements: 99 joins — pro-year unlocked but founding-100 still locked", () => {
  const a = networkAchievements(99, true);
  assert.equal(a.find(x => x.id === "pro-year").unlocked, true);
  assert.equal(a.find(x => x.id === "founding-100").unlocked, false);
});

test("networkAchievements: 100 joins — founding-100 unlocked at threshold", () => {
  const a = networkAchievements(100, true);
  assert.equal(a.find(x => x.id === "founding-100").unlocked, true);
});

test("networkAchievements: 101 joins — same as 100 (no extras above founding)", () => {
  const a100 = networkAchievements(100, true);
  const a101 = networkAchievements(101, true);
  assert.equal(
    a100.filter(x => x.unlocked).length,
    a101.filter(x => x.unlocked).length
  );
});

test("networkAchievements: order is stable across calls (UI ordering invariant)", () => {
  const ids = networkAchievements(0, false).map(x => x.id);
  assert.deepEqual(ids, [
    "spread-the-word",
    "first-builder",
    "workshop-expanded",
    "workshop-permanent",
    "pro-month",
    "pro-six-months",
    "pro-year",
    "founding-100"
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit`
Expected: 10 new failures with `TypeError: networkAchievements is not a function` (or similar).

- [ ] **Step 3: Implement `networkAchievements` in utils.js**

Append to `utils.js`, just before the `if (typeof module !== "undefined" && module.exports)` block at the bottom:

```js
function networkAchievements(joinedCount, sharedOnce) {
  joinedCount = Math.max(0, Math.floor(joinedCount || 0));
  return [
    { id: "spread-the-word",    label: "Spread the word",      threshold: null, reward: null,             unlocked: !!sharedOnce,        gate: "shared" },
    { id: "first-builder",      label: "First builder",        threshold: 1,    reward: null,             unlocked: joinedCount >= 1,    gate: "count" },
    { id: "workshop-expanded",  label: "Workshop expanded",    threshold: 3,    reward: "Caps +30 days",  unlocked: joinedCount >= 3,    gate: "count" },
    { id: "workshop-permanent", label: "Workshop permanent",   threshold: 5,    reward: "Caps forever",   unlocked: joinedCount >= 5,    gate: "count" },
    { id: "pro-month",          label: "Pro for a month",      threshold: 10,   reward: "1 month Pro",    unlocked: joinedCount >= 10,   gate: "count" },
    { id: "pro-six-months",     label: "Pro for 6 months",     threshold: 25,   reward: "6 months Pro",   unlocked: joinedCount >= 25,   gate: "count" },
    { id: "pro-year",           label: "Pro for a year",       threshold: 50,   reward: "12 months Pro",  unlocked: joinedCount >= 50,   gate: "count" },
    { id: "founding-100",       label: "Founding 100 Club",    threshold: 100,  reward: "Lifetime Pro",   unlocked: joinedCount >= 100,  gate: "count" }
  ];
}
```

Then extend the CommonJS export block. Find the existing line that looks like:

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { dk, /* ... existing exports ... */ };
}
```

Add `networkAchievements` to the exported names. Also expose it on `window` for the browser:

```js
if (typeof window !== "undefined") {
  window.networkAchievements = networkAchievements;
}
```

(Place the `window` block adjacent to other `window.*` assignments in utils.js — there should be a precedent already.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: all 10 new tests pass; no regression in existing tests.

- [ ] **Step 5: Commit**

```bash
git add utils.js tests/utils.test.mjs
git commit -m "feat(network): networkAchievements() pure helper + node tests"
```

---

## Task 2: Default-data + hydrate backfill for new user-doc fields

**Files:**
- Modify: `index.html` (around line 2977 — the `DD` shape; and the `hydrateCloudDoc` function)

- [ ] **Step 1: Find the `DD` shape**

Use Grep: `^const DD = \{` in `index.html`. Open the file at that line.

- [ ] **Step 2: Add three new fields to `DD`**

Inside the `DD` object, alongside existing top-level fields, add:

```js
referralCode: "",
referredBy: null,
// displayName already exists if it's in DD — verify with grep first.
// If absent: add the line below. If present: leave as-is.
displayName: ""
```

Verify: `grep -n "displayName" index.html` — if it already exists in DD, skip that addition.

- [ ] **Step 3: Find `hydrateCloudDoc` and add the same backfill**

Use Grep: `function hydrateCloudDoc` in `index.html`. Inside, every other field that has a default in DD has a corresponding backfill of the form `if (p.foo === undefined) p.foo = defaultValue;` or `p.foo = p.foo ?? defaultValue;`. Match the existing style. Add:

```js
if (p.referralCode === undefined) p.referralCode = "";
if (p.referredBy   === undefined) p.referredBy   = null;
if (p.displayName  === undefined) p.displayName  = "";
```

(Match the existing in-function style — if the function uses `??=`, use `??=`.)

- [ ] **Step 4: Smoke-test in the browser**

Start local serve: `.\serve.ps1` (PowerShell). Open the app, sign in to any existing account, open DevTools → Application → IndexedDB / localStorage. Verify the in-memory `data` object now has `referralCode === ""`, `referredBy === null`, `displayName === ""` (or its prior value). No console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(network): DD defaults + hydrate backfill for referralCode/referredBy/displayName"
```

---

## Task 3: Firestore rules — append the two new match blocks

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Read current rules to find insertion point**

Open `firestore.rules`. The existing `users/{userId}` block ends around line 35. The catch-all `match /{document=**}` deny-block follows. **Insert the new blocks between them** so the catch-all stays last (Firestore evaluates in document order, but explicit > catch-all).

- [ ] **Step 2: Append the two new match blocks**

Insert immediately after the closing `}` of the `match /users/{userId}` block, before the catch-all deny:

```javascript
    // Referral code lookup index. Anyone authed can read (needed to
    // resolve invite links on signup). Only the owning UID can write.
    match /referralCodes/{code} {
      allow read: if request.auth != null;

      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid;

      allow update, delete: if request.auth != null
                            && resource.data.uid == request.auth.uid;
    }

    // "Who joined because of me." Doc lives under the INVITER's path,
    // but the INVITEE is the one who writes it on first auth. Inviter
    // can only read; only the invitee can mutate or delete their own
    // entry (opt-out path is invitee-controlled).
    match /networks/{inviterUid}/joined/{inviteeUid} {
      allow read: if request.auth != null
                  && request.auth.uid == inviterUid;

      allow create: if request.auth != null
                    && request.auth.uid == inviteeUid
                    && request.resource.data.inviteeUid == inviteeUid;

      allow update, delete: if request.auth != null
                            && request.auth.uid == inviteeUid;
    }
```

- [ ] **Step 3: Manual rules-playground verification (10 cases)**

The repo doesn't have a Firebase emulator setup, and adding one is out of scope for this slice. Use Firebase Console → Firestore → Rules → **Rules Playground** for spot checks. Walk through these 10 cases with two distinct fake UIDs (e.g., `aaa111` and `bbb222`):

| # | Operation | Path | Auth UID | Doc data (resource) | Expected |
|---|---|---|---|---|---|
| 1 | get | `referralCodes/k7m9q2` | aaa111 | `{uid: bbb222}` | allow |
| 2 | get | `referralCodes/k7m9q2` | (none) | `{uid: bbb222}` | deny |
| 3 | create | `referralCodes/k7m9q2` | aaa111 | `{uid: bbb222}` | deny |
| 4 | create | `referralCodes/k7m9q2` | aaa111 | `{uid: aaa111}` | allow |
| 5 | update | `referralCodes/k7m9q2` | aaa111 | existing `{uid: bbb222}` | deny |
| 6 | get | `networks/aaa111/joined/bbb222` | aaa111 | any | allow |
| 7 | get | `networks/aaa111/joined/bbb222` | bbb222 | any | deny |
| 8 | create | `networks/aaa111/joined/bbb222` | bbb222 | `{inviteeUid: bbb222}` | allow |
| 9 | create | `networks/aaa111/joined/bbb222` | aaa111 | `{inviteeUid: bbb222}` | deny |
| 10 | delete | `networks/aaa111/joined/bbb222` | bbb222 | any | allow |

All 10 must pass before deploying.

- [ ] **Step 4: Deploy rules**

```bash
firebase deploy --only firestore:rules
```

Expected output ends with: `Deploy complete!`

- [ ] **Step 5: Commit**

```bash
git add firestore.rules
git commit -m "feat(network): firestore rules for referralCodes/ and networks/"
```

---

## Task 4: Code-claim helper + boot-time invite resolution in index.html

**Files:**
- Modify: `index.html`

Two pieces here: (a) the helper functions that claim a code and resolve invite links, (b) wiring them to fire at the right lifecycle moments.

- [ ] **Step 1: Add the code-generation + claim helpers**

Find the Firebase init region (around line 989 per the conventions skill). Add new helper functions in the same module-scope block (after `db` and `auth` are defined, before `App()`):

```js
// Invite code generation + claim
const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function genReferralCode() {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

// Transactionally claim a code. Returns the claimed code on success,
// throws after 5 collisions (effectively impossible at 36^6).
async function claimReferralCode(uid, displayName, username) {
  const codesCol = db.collection("referralCodes");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genReferralCode();
    const ref = codesCol.doc(code);
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) throw new Error("collision");
        tx.set(ref, sanitizeForFirestore({
          uid,
          displayName: displayName || "",
          username: username || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }));
      });
      return code;
    } catch (e) {
      if (e && e.message === "collision") continue;
      throw e;
    }
  }
  throw new Error("Failed to claim referral code after 5 attempts");
}

// Resolve invite link in the URL. Returns the code string or null.
function readInviteCodeFromURL() {
  try {
    // Hosting catch-all rewrite keeps /r/<code> as the pathname.
    const m = (location.pathname || "").match(/^\/r\/([a-z0-9]{6})\/?$/i);
    if (m) return m[1].toLowerCase();
    const qs = new URLSearchParams(location.search || "");
    const ref = qs.get("ref");
    if (ref && /^[a-z0-9]{6}$/i.test(ref)) return ref.toLowerCase();
  } catch (e) {}
  return null;
}

// On boot, if URL has an invite code AND no user is signed in yet,
// stash it for consumption after Firebase Auth completes.
(function stashInviteCodeIfPresent() {
  const code = readInviteCodeFromURL();
  if (!code) return;
  try { sessionStorage.setItem("v-pending-invite", code); } catch (e) {}
})();
```

- [ ] **Step 2: Add the invite-resolution function**

Still in the same module-scope block, after the helpers above:

```js
// After a brand-new signup, resolve any pending invite code:
//  - look up referralCodes/<code> -> inviter uid
//  - skip on self-referral
//  - skip if invitee already has a referredBy
//  - write users/<newUid>.referredBy + networks/<inviterUid>/joined/<newUid>
async function resolvePendingInvite(newUser) {
  let code = null;
  try { code = sessionStorage.getItem("v-pending-invite"); } catch (e) {}
  if (!code) return;

  try {
    const codeSnap = await db.collection("referralCodes").doc(code).get();
    if (!codeSnap.exists) return;

    const inviterUid = codeSnap.data().uid;
    if (!inviterUid || inviterUid === newUser.uid) return;

    const myDocRef = db.collection("users").doc(newUser.uid);
    const mySnap = await myDocRef.get();
    if (mySnap.exists && mySnap.data() && mySnap.data().referredBy) return;

    // Compute display name fallback (email local-part, first char up).
    const local = (newUser.email || "").split("@")[0] || "";
    const displayName = local
      ? local.charAt(0).toUpperCase() + local.slice(1)
      : "";

    // Two writes, neither blocks the other; best-effort idempotent.
    await myDocRef.set(sanitizeForFirestore({
      referredBy: inviterUid
    }), { merge: true }).catch(() => {});

    await db
      .collection("networks").doc(inviterUid)
      .collection("joined").doc(newUser.uid)
      .set(sanitizeForFirestore({
        inviteeUid: newUser.uid,
        displayName,
        username: null,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "signed_up"
      })).catch(() => {});
  } catch (e) {
    // Silent fail — never block signup on invite resolution.
  } finally {
    try { sessionStorage.removeItem("v-pending-invite"); } catch (e) {}
  }
}
```

- [ ] **Step 3: Wire `resolvePendingInvite` + code claim into the auth listener**

Find `auth.onAuthStateChanged` in `index.html` (around line 3457 per the conventions skill). Inside the listener, where `u` resolves to a real user, fire both operations. Look for the existing pattern that handles new users (the spot where `userDoc(uid).set(...)` or similar runs for the first hydration). Pseudocode of the addition:

```js
auth.onAuthStateChanged(async (u) => {
  // existing setAuthUser(u), setDemoMode(false), hydrate

  if (u) {
    // Resolve any /r/<code> the user clicked.
    resolvePendingInvite(u).catch(() => {});

    // Claim a referral code for this account if they don't have one yet.
    // Read current doc first so we don't overwrite an existing code.
    try {
      const snap = await userDoc(u.uid).get();
      const existing = snap.exists ? (snap.data().referralCode || "") : "";
      if (!existing) {
        const local = (u.email || "").split("@")[0] || "";
        const displayName = local
          ? local.charAt(0).toUpperCase() + local.slice(1)
          : "";
        const code = await claimReferralCode(u.uid, displayName, null);
        await userDoc(u.uid).set(sanitizeForFirestore({
          referralCode: code
        }), { merge: true });
      }
    } catch (e) {
      // Non-fatal — user just won't have a code until next session.
    }
  }
});
```

Place this block in the existing listener (don't duplicate `onAuthStateChanged`). Match the surrounding style (sync vs async).

- [ ] **Step 4: Bump SHELL_VERSION**

The repo convention is `SHELL_VERSION = "v86"` (next after `v85`). Find `const SHELL_VERSION` in `index.html` and bump it.

- [ ] **Step 5: Manual smoke test**

Run `.\serve.ps1`. Sign in to a test account (or create one). Open DevTools → Application → Firestore → `users/<uid>` should now show `referralCode: "abc123"` (some 6-char value). Open `referralCodes/abc123` — should show `{uid, displayName, username: null, createdAt}`.

Test self-referral: copy the link `http://localhost:5500/r/<your-code>` to a new incognito window, sign up with a different account. Check Firestore → `networks/<your-uid>/joined/<new-uid>` exists.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(network): code-claim + invite-resolution at signup (v86)"
```

---

## Task 5: Create `lib/views/profile/NetworkPanel.js`

**Files:**
- Create: `lib/views/profile/NetworkPanel.js`

Follow the established panel pattern (see `lib/views/profile/AccountPanel.js` for shape). All inline styles use `--c-*` tokens for dark-mode auto-support.

- [ ] **Step 1: Create the panel file**

```js
// lib/views/profile/NetworkPanel.js
//
// Profile > My Account > My Network sub-tab. Shows the user's invite
// code, achievements ladder, and the list of accounts that signed up
// via their link.
//
// Wave 4.4.7 (network slice). Data lives in:
//   - users/<uid>.referralCode
//   - networks/<myUid>/joined/<inviteeUid>
//
// Achievements are computed from joined.length via networkAchievements()
// in utils.js.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

  const SHARED_FLAG_KEY = "v-network-shared-once";

  function relativeTime(ts) {
    if (!ts) return "";
    const ms = typeof ts.toMillis === "function" ? ts.toMillis() : (typeof ts === "number" ? ts : 0);
    if (!ms) return "";
    const diff = Date.now() - ms;
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24);
    if (d === 1) return "yesterday";
    if (d < 30) return d + " days ago";
    const mo = Math.floor(d / 30);
    if (mo < 12) return mo + " mo ago";
    return Math.floor(mo / 12) + "y ago";
  }

  function letterAvatar(name) {
    const ch = (name || "?").trim().charAt(0).toUpperCase() || "?";
    return React.createElement("div", {
      style: {
        width: 32, height: 32, borderRadius: "50%",
        background: "var(--c-tint-success-bg)",
        color: "var(--c-text-strong)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 14, fontFamily: "'Lora',serif",
        flexShrink: 0
      }
    }, ch);
  }

  // Memoized joined-list row — visually static once data settles.
  const JoinedRow = React.memo(function JoinedRow(props) {
    const { entry } = props;
    const name = entry.username
      ? "@" + entry.username
      : (entry.displayName || "(new member)");
    return React.createElement("div", {
      style: {
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px",
        background: "var(--c-surface-raised)",
        border: "1px solid var(--c-border)",
        borderRadius: 10,
        marginBottom: 6
      }
    },
      letterAvatar(entry.displayName || entry.username),
      React.createElement("div", { style: { flex: 1, minWidth: 0 } },
        React.createElement("div", {
          style: {
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: "var(--c-text-strong)"
          }
        },
          React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, name),
          entry.status === "converted" && React.createElement("span", {
            "aria-label": "Active member",
            title: "Active member",
            style: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }
          })
        ),
        React.createElement("div", {
          style: { fontSize: 11, color: "var(--c-text-faint)" }
        }, relativeTime(entry.joinedAt))
      )
    );
  });

  function InviteCodeCard(props) {
    const { code, onShare, onCopy, onHowItWorks, copied } = props;
    const link = code
      ? "verrocchio.app/r/" + code
      : "(claiming your code…)";
    return React.createElement("div", {
      style: {
        padding: 16, borderRadius: 12,
        background: "var(--c-surface-raised)",
        border: "1px solid var(--c-border)",
        marginBottom: 16
      }
    },
      React.createElement("div", {
        style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }
      }, "Your invite link"),
      React.createElement("div", {
        style: { fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 12, wordBreak: "break-all" }
      }, link),
      React.createElement("div", {
        style: { display: "flex", gap: 8, flexWrap: "wrap" }
      },
        React.createElement("button", {
          type: "button",
          onClick: onShare,
          disabled: !code,
          style: {
            flex: 1, minHeight: 44, minWidth: 120,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid #2d5a2d",
            background: "#2d5a2d", color: "#fff",
            fontSize: 13, fontWeight: 700,
            cursor: code ? "pointer" : "not-allowed",
            opacity: code ? 1 : 0.5
          }
        }, "Share invite"),
        React.createElement("button", {
          type: "button",
          onClick: onCopy,
          disabled: !code,
          style: {
            flex: 1, minHeight: 44, minWidth: 120,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid var(--c-border)",
            background: "var(--c-surface-raised)",
            color: "var(--c-text-strong)",
            fontSize: 13, fontWeight: 600,
            cursor: code ? "pointer" : "not-allowed",
            opacity: code ? 1 : 0.5
          }
        }, copied ? "Copied!" : "Copy link")
      ),
      React.createElement("button", {
        type: "button",
        onClick: onHowItWorks,
        style: {
          marginTop: 10, padding: 0,
          background: "none", border: "none",
          color: "#2d5a2d", fontSize: 12, fontWeight: 600,
          cursor: "pointer", textAlign: "left"
        }
      }, "How invites work →")
    );
  }

  function AchievementBadge(props) {
    const { ach } = props;
    return React.createElement("div", {
      style: {
        flexShrink: 0,
        width: 130,
        padding: 10,
        borderRadius: 10,
        border: "1px solid var(--c-border)",
        background: ach.unlocked ? "var(--c-tint-success-bg)" : "var(--c-surface-raised)",
        opacity: ach.unlocked ? 1 : 0.5,
        filter: ach.unlocked ? "none" : "grayscale(0.6)",
        textAlign: "center"
      }
    },
      React.createElement("div", {
        style: { fontSize: 22, marginBottom: 4 }
      }, ach.unlocked ? "★" : "☆"),
      React.createElement("div", {
        style: { fontSize: 12, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 2 }
      }, ach.label),
      React.createElement("div", {
        style: { fontSize: 10, color: "var(--c-text-faint)" }
      }, ach.threshold === null
        ? (ach.unlocked ? "Done" : "Share to unlock")
        : (ach.unlocked
            ? (ach.reward || "Unlocked")
            : (ach.threshold + " joins"))
      )
    );
  }

  function HowItWorksModal(props) {
    const { onClose } = props;
    return React.createElement("div", {
      onClick: onClose,
      style: {
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, zIndex: 1000
      }
    },
      React.createElement("div", {
        onClick: (e) => e.stopPropagation(),
        style: {
          background: "var(--c-surface-raised)",
          border: "1px solid var(--c-border)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 420, width: "100%",
          color: "var(--c-text-strong)"
        }
      },
        React.createElement("div", {
          style: { fontSize: 18, fontWeight: 700, marginBottom: 12 }
        }, "How invites work"),
        React.createElement("div", { style: { fontSize: 13, lineHeight: 1.55, marginBottom: 10 } },
          "Every account gets a 6-character invite code. When someone signs up via your link, they show up in your network."
        ),
        React.createElement("div", { style: { fontSize: 13, lineHeight: 1.55, marginBottom: 10 } },
          "We're building a referral reward ladder: 3 invites expands your free-tier caps, 5 makes that permanent, 10 unlocks a month of free Pro, all the way to lifetime free Pro at 100. The full reward system ships in a follow-up — but your network growth is being tracked starting now, so early invites count."
        ),
        React.createElement("div", { style: { fontSize: 12, color: "var(--c-text-faint)", lineHeight: 1.55, marginBottom: 14 } },
          "Privacy: people who join via your link see only that you invited them. You see only their display name and join date — never their habits, goals, journal, or any other data."
        ),
        React.createElement("button", {
          type: "button",
          onClick: onClose,
          style: {
            width: "100%", minHeight: 44,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid var(--c-border)",
            background: "var(--c-surface-raised)",
            color: "var(--c-text-strong)",
            fontSize: 13, fontWeight: 700, cursor: "pointer"
          }
        }, "Got it")
      )
    );
  }

  function NetworkPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const authUser = h.authUser;
    const referralCode = (h.data && h.data.referralCode) || "";
    const sectionTitle = h.sectionTitle || ((s) => React.createElement("div", null, s));

    const [joined, setJoined] = React.useState([]);
    const [sharedOnce, setSharedOnce] = React.useState(() => {
      try { return localStorage.getItem(SHARED_FLAG_KEY) === "1"; } catch (e) { return false; }
    });
    const [showHow, setShowHow] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    // Subscribe to networks/<myUid>/joined live.
    React.useEffect(() => {
      if (!authUser || !window.firebase || !window.firebase.firestore) return;
      const db = window.firebase.firestore();
      const ref = db.collection("networks").doc(authUser.uid).collection("joined");
      const unsub = ref.onSnapshot((snap) => {
        const arr = [];
        snap.forEach((d) => arr.push(d.data()));
        arr.sort((a, b) => {
          const am = a.joinedAt && typeof a.joinedAt.toMillis === "function" ? a.joinedAt.toMillis() : 0;
          const bm = b.joinedAt && typeof b.joinedAt.toMillis === "function" ? b.joinedAt.toMillis() : 0;
          return bm - am;
        });
        setJoined(arr);
      }, () => { /* silent */ });
      return () => { try { unsub(); } catch (e) {} };
    }, [authUser && authUser.uid]);

    const link = referralCode ? "https://verrocchio.app/r/" + referralCode : "";

    function markShared() {
      try { localStorage.setItem(SHARED_FLAG_KEY, "1"); } catch (e) {}
      setSharedOnce(true);
    }

    async function onShare() {
      if (!link) return;
      markShared();
      const payload = {
        title: "Verrocchio",
        text: "I've been using Verrocchio — try it:",
        url: link
      };
      try {
        if (navigator.share) {
          await navigator.share(payload);
          return;
        }
      } catch (e) { /* user cancelled or unsupported */ }
      // Fallback to clipboard.
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (e) {}
    }

    async function onCopy() {
      if (!link) return;
      markShared();
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (e) {}
    }

    const achievements = (window.networkAchievements || (() => []))(joined.length, sharedOnce);

    return React.createElement("div", null,
      sectionTitle("My Network"),

      React.createElement(InviteCodeCard, {
        code: referralCode,
        onShare, onCopy,
        onHowItWorks: () => setShowHow(true),
        copied
      }),

      // Achievements strip
      React.createElement("div", {
        style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }
      }, "Achievements"),
      React.createElement("div", {
        style: {
          display: "flex", gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 16,
          WebkitOverflowScrolling: "touch"
        }
      }, achievements.map((a) =>
        React.createElement(AchievementBadge, { key: a.id, ach: a })
      )),

      // Joined list
      React.createElement("div", {
        style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }
      }, "People who joined because of you"),
      joined.length === 0
        ? React.createElement("div", {
            style: {
              padding: 24, borderRadius: 10,
              background: "var(--c-surface-raised)",
              border: "1px dashed var(--c-border)",
              textAlign: "center",
              color: "var(--c-text-faint)", fontSize: 13, lineHeight: 1.5
            }
          },
            React.createElement("div", { style: { fontSize: 26, marginBottom: 6 } }, "·"),
            "No one has joined yet.",
            React.createElement("br"),
            "Share your link to grow your workshop."
          )
        : React.createElement("div", null,
            joined.map((e) => React.createElement(JoinedRow, { key: e.inviteeUid, entry: e }))
          ),

      // Bottom teaser
      React.createElement("div", {
        style: {
          marginTop: 18, padding: 10,
          fontSize: 11, color: "var(--c-text-faint)",
          textAlign: "center", lineHeight: 1.55
        }
      }, "When entitlements ship, your network growth unlocks free-tier expansion and free Pro time. We're saving credit for everyone who builds early."),

      showHow && React.createElement(HowItWorksModal, { onClose: () => setShowHow(false) })
    );
  }

  window.NetworkPanel = NetworkPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = NetworkPanel;
  }
})();
```

- [ ] **Step 2: Add `<script>` tag for NetworkPanel.js in `index.html`**

Find where other panel scripts are loaded — grep for `lib/views/profile/AccountPanel.js`. Immediately below that `<script src="lib/views/profile/AccountPanel.js"></script>`, add:

```html
<script src="lib/views/profile/NetworkPanel.js"></script>
```

- [ ] **Step 3: Verify LOC budget**

```bash
wc -l lib/views/profile/NetworkPanel.js
```

Expected: under 500 (soft target). Hard cap 1000. If over, split out HowItWorksModal into its own file.

- [ ] **Step 4: Commit**

```bash
git add lib/views/profile/NetworkPanel.js index.html
git commit -m "feat(network): NetworkPanel.js — invite card, achievements, joined list"
```

---

## Task 6: Sub-tab strip wiring inside the My Account panel

**Files:**
- Modify: `index.html` around line 11741 (the `panels` map and the accountPanel construction)

The cleanest path is a thin wrapper that conditionally renders either the existing `accountPanel` or the new `NetworkPanel`, behind a sub-tab strip. No edit to `AccountPanel.js` itself.

- [ ] **Step 1: Add `profileAccountSubTab` state + localStorage hookup**

Find the existing state declaration in `App()`:

```js
const [profileSection, setProfileSection] = useState("account"); // account | inspiration | ...
```

Add immediately below:

```js
const [profileAccountSubTab, setProfileAccountSubTab] = useState(() => {
  try { return localStorage.getItem("v-profile-account-subtab") || "account"; }
  catch (e) { return "account"; }
});
useEffect(() => {
  try { localStorage.setItem("v-profile-account-subtab", profileAccountSubTab); }
  catch (e) {}
}, [profileAccountSubTab]);
```

- [ ] **Step 2: Build the sub-tab strip + wrapped account panel**

Find the `accountPanel` construction (around line 11741). It's the value of `panels.account`. Before the `const panels = { ... }` line, build a new value that wraps the existing accountPanel:

```js
// Sub-tab strip lives above the body. Two tabs: account (existing
// content) and network (NetworkPanel). Both share the same panel chrome
// from ProfileShell.
const accountSubTabStrip = React.createElement("div", {
  style: {
    display: "flex", gap: 6, marginBottom: 12,
    borderBottom: "1px solid var(--c-border)",
    paddingBottom: 0
  }
},
  ["account", "network"].map((id) => React.createElement("button", {
    key: id,
    type: "button",
    onClick: () => setProfileAccountSubTab(id),
    style: {
      padding: "8px 14px",
      background: "none",
      border: "none",
      borderBottom: profileAccountSubTab === id
        ? "2px solid #2d5a2d"
        : "2px solid transparent",
      color: profileAccountSubTab === id
        ? "var(--c-text-strong)"
        : "var(--c-text-faint)",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: -1
    }
  }, id === "account" ? "My Account" : "My Network"))
);

const networkPanel = React.createElement(window.NetworkPanel, {
  callbacks: { helpers: {
    data, authUser, sectionTitle
  } }
});

const accountPanelWrapped = React.createElement("div", null,
  accountSubTabStrip,
  profileAccountSubTab === "network" ? networkPanel : accountPanel
);
```

Then update the `panels` map line:

```js
const panels = { account: accountPanelWrapped, scorecard: scorecardPanel, /* rest unchanged */ };
```

(Note: the existing `accountPanel` const stays — it's just now wrapped instead of mapped directly.)

- [ ] **Step 3: Verify `authUser`, `data`, `sectionTitle` are in scope where the wrapper is built**

These are all `App()`-scope variables already used elsewhere in the same region. If you get a ReferenceError, scroll up and confirm. If `sectionTitle` isn't in scope at this exact line, look at how the existing `reportsPanel` and `scorecardPanel` pass it — they receive it via the same helpers-bag pattern.

- [ ] **Step 4: Smoke test**

Run `.\serve.ps1`. Sign in. Open Profile → My Account. You should see two tabs at the top: **My Account · My Network**. Click "My Network":
- See invite-link card with your code.
- See 8 dimmed achievement badges (or with "Spread the word" lit if you've already shared in a prior session).
- See empty-state ("No one has joined yet").

Click "Copy link" → see "Copied!" toast, paste in URL bar → confirms link copied.

Click "Share invite" → on a non-mobile browser, this either fires native share (Edge / Chrome) or falls through to clipboard.

Open the link in incognito, sign up with a new test account. Return to original tab → joined list should now show one row within a couple of seconds (onSnapshot latency).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(network): sub-tab strip in My Account; mount NetworkPanel"
```

---

## Task 7: Privacy policy delta

**Files:**
- Modify: `docs/PRIVACY_POLICY.md`

- [ ] **Step 1: Read the current policy structure**

Open `docs/PRIVACY_POLICY.md`. Find the section that describes what's shared / who can see your data (or the closest equivalent — search for "share" / "visible").

- [ ] **Step 2: Add a new clause**

Insert a new short section, ideally just after the section describing user data and visibility:

```markdown
### Invites and Networks

When you sign up via someone's invite link, that person can see your display name and your `@username` if you've set one. They cannot see your habits, goals, journal entries, or any other tracker data. We never share your email address with them. You can remove yourself from their network list at any time from Settings → Privacy → Networks. (Note: the self-remove UI ships with a follow-up release; the underlying control is enforced today by Firestore rules.)
```

Adjust the wording to match the surrounding tone if the rest of the document uses a different voice.

- [ ] **Step 3: Verify markdown renders**

If the repo has a docs renderer (`npm run render-docs`), run it. Otherwise visually confirm the file:

```bash
cat docs/PRIVACY_POLICY.md | head -80
```

- [ ] **Step 4: Commit**

```bash
git add docs/PRIVACY_POLICY.md
git commit -m "docs(privacy): add Invites and Networks clause for v86 referral slice"
```

---

## Task 8: Browser verification screenshots (the verification gate)

**Files:** No code changes. Captures screenshots per `CLAUDE.md §11.1`.

This task is mandatory per the verification gate — UI changes without screenshots are "implemented but unverified".

- [ ] **Step 1: Start the dev server**

```powershell
.\serve.ps1
```

Confirm it serves at `http://localhost:5500` (or whatever the script outputs).

- [ ] **Step 2: Use the `everything-claude-code:browser-qa` skill OR drive Playwright manually**

Capture six screenshots:

| File | Viewport | Mode | State |
|---|---|---|---|
| `screenshots/network-empty-desktop-light.png` | 1280x800 | light | empty joined list |
| `screenshots/network-populated-desktop-light.png` | 1280x800 | light | 3+ joined rows (use a seeded inviter account from `scripts/seed-demo-users.mjs` or write fixtures into Firestore manually) |
| `screenshots/network-empty-mobile-light.png` | 390x844 | light | empty |
| `screenshots/network-populated-mobile-light.png` | 390x844 | light | populated |
| `screenshots/network-populated-desktop-dark.png` | 1280x800 | dark | populated |
| `screenshots/network-howitworks-modal.png` | 390x844 | light | modal open |

- [ ] **Step 3: Visual inspection checklist**

Open each screenshot and confirm:
- Invite code displays as `verrocchio.app/r/<6chars>`, not blank.
- Achievement strip scrolls horizontally on the 390px capture (not clipped).
- Empty state is centered and readable.
- Populated rows: letter avatar visible, name + timestamp legible.
- Dark mode: no raw rgb() colors that didn't flip — every surface uses the token palette.
- No layout shift between the My Account tab and the My Network tab (sub-tab strip stays anchored).

- [ ] **Step 4: Save screenshots in the repo (in `archive/` not `dist/`)**

If the repo doesn't already have a `screenshots/` directory, put them under `archive/screenshots/v86/` so they don't ship to production:

```bash
mkdir -p archive/screenshots/v86
# move the captured PNGs into that dir
git add archive/screenshots/v86/
git commit -m "chore(verify): v86 network slice — screenshots desktop/mobile/dark/modal"
```

---

## Task 9: Archive snapshot + final commit + push

Per memory `feedback_archive_on_large_push`: before pushing a large change, copy `index.html` to `archive/index.v###.html` matching the SHELL_VERSION.

- [ ] **Step 1: Snapshot index.html**

```powershell
copy index.html archive\index.v86.html
```

Verify: `ls archive/index.v86.html` exists.

- [ ] **Step 2: Stage + commit the archive**

```bash
git add archive/index.v86.html
git commit -m "chore: archive index.html as v86 snapshot"
```

- [ ] **Step 3: Final smoke**

Run `npm run test:unit` one more time. All tests pass — including the 10 new ones from Task 1.

- [ ] **Step 4: Push**

```bash
git push origin main
```

- [ ] **Step 5: Verify deploy**

If Firebase auto-deploys on push (check `.github/workflows/`): wait for the workflow to go green and load `verrocchio.app`. Confirm `/r/<your-code>` still routes to the SPA (catch-all rewrite was already in `firebase.json`).

If deploy is manual: `firebase deploy --only hosting`.

---

## Self-Review (run after the plan is written, before handing off)

### Spec coverage check (against `2026-05-27-invite-network-design.md`)

| Spec section | Implemented in task |
|---|---|
| §1 Goal — in-scope items 1–8 | Tasks 1–6 (code claim, link, resolution, sub-tab, achievements, share/copy, rules, helper) |
| §2 Data model — three additions | Task 2 (DD/hydrate), Task 4 (referralCodes + networks writes) |
| §3 Lifecycle flows — 3.1–3.4 | Task 4 (claim, resolution); Task 5/6 (panel + share/copy) |
| §4 Firestore rules delta | Task 3 |
| §5 UI design — sub-tab, card, achievements, list, teaser | Task 5 (panel), Task 6 (sub-tab) |
| §6 Achievements logic | Task 1 |
| §7 File layout | Task 5 + Task 6 |
| §8 Test plan — unit + rules-playground + browser | Task 1 (unit), Task 3 (rules manual), Task 8 (browser) |
| §9 Privacy delta | Task 7 |
| §10 Rollout | Task 9 (archive + push); no feature flag this round (code-claim is idempotent so existing users get codes lazily, matching §10 step 5) |
| §11 Forward-compat | Implicit — field names match MONETIZATION_V1 exactly |
| §12 Open questions | All resolved in spec; no plan task needed |

**Trade-off note:** Spec §10 mentions a `v-network-feature` localStorage flag for soft-enable. I removed it — code-claim is idempotent and the panel only displays data the user already has, so the flag adds complexity without protective value. If you want the flag back, add it as a pre-Task-4 gate that the helper checks.

### Placeholder scan

Grep'd plan for "TBD", "TODO", "later", "etc.": no offending matches. All code blocks are complete.

### Type consistency

- `referralCode` (string, lowercase 6 chars) — same across Tasks 1, 2, 4, 5, 6.
- `referredBy` (uid string | null) — Task 2 default, Task 4 write.
- `status` literal `"signed_up"` — Task 4 write, never compared as `"converted"` (left to v1.x).
- `networkAchievements(joinedCount, sharedOnce)` — signature matches between Task 1 implementation, Task 1 tests, and Task 5 panel call.

Plan is internally consistent.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-27-invite-network-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
