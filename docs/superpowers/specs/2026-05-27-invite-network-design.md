# Invite Codes + My Network — v1 user-visible slice

**Date:** 2026-05-27
**Status:** Design approved, ready for implementation plan
**Companion docs:**
- [docs/MONETIZATION_V1.md](../../MONETIZATION_V1.md) — overarching entitlement + referral spec; §4–§5 are the upstream of this slice
- [docs/TODO.md §1.6](../../TODO.md#16-the-referral-mechanic-1-week-trial--invite-to-extend--invite-to-lifetime) — referral ladder
- [docs/TODO.md §1.13](../../TODO.md#113-ios-contacts-integration--fast-invite-flow) — contacts integration (deferred from this slice)
- [docs/SOCIAL_LAYER_V1.md](../../SOCIAL_LAYER_V1.md) — `usernames/{handle}` index (shared dependency)
- [firestore.rules](../../../firestore.rules) — rules to extend (§4 below)

---

## 1. Goal

Ship the **user-facing portion** of the referral system: every user can see their invite code, share it, and watch a "My Network" list grow as people join through their link. Achievements are visible from day one; the actual entitlement flips ride in with the v1.x Cloud Functions infra defined in `MONETIZATION_V1.md`.

This slice is the **first acquisition-loop surface in the app**. Without it the referral ladder is theoretical; with it the network effect can start compounding even before paid Pro exists.

**In scope:**
1. Auto-generated 6-char invite code per user, claimed via a top-level `referralCodes/` index.
2. Public link format `https://verrocchio.app/r/<code>` with Firebase Hosting rewrite.
3. Invitee-side resolution at signup: stamp `users/{newUid}.referredBy` and write a `networks/{inviterUid}/joined/{inviteeUid}` entry.
4. New **My Network** sub-tab inside the Profile → My Account panel.
5. Achievement ladder display (Spread the word, First builder, Workshop expanded, Workshop permanent, Pro for a month, Pro for 6 months, Pro for a year, Founding 100 Club).
6. Native share + copy-link affordances.
7. Firestore rules covering the two new collections, plus emulator unit tests.
8. `networkAchievements()` pure helper in `utils.js` with node tests.

**Explicitly out of scope (deferred to v1.x):**
- 3-day activity conversion gate (Cloud Function).
- Actual entitlement flips when achievement thresholds are crossed.
- iOS Contacts multi-select picker (`docs/TODO.md §1.13`).
- 24h conversion cap, disposable-email block, phone gate at 50+ tier.
- StoreKit / Pro purchase path.
- QR code rendering for in-person sharing.

---

## 2. Data model

### 2.1 Additions to the existing per-user doc

```js
users/{uid} = {
  // ...existing fields,
  referralCode: "k7m9q2",       // 6-char lowercase alphanum, stamped at signup, immutable thereafter
  referredBy:   "abc123" | null, // uid of the inviter; immutable after first write
  displayName:  "Zach T."       // optional pretty name; falls back to email local-part for display
}
```

Both fields get backfilled in `hydrateCloudDoc(p)` so legacy cloud docs don't return `undefined`. Both get a default in the `DD` shape in `index.html` (around line 2977 per the conventions skill).

### 2.2 New top-level `referralCodes/{code}` index

```js
referralCodes/{code} = {
  uid:         "abc123",
  displayName: "Zach T.",
  username:    "zthomas" | null,  // future @handle, from SOCIAL_LAYER_V1
  createdAt:   <Timestamp>
}
```

- Document ID **is** the code, so uniqueness is structural.
- Readable by any authed user (needed to resolve invite links on signup).
- Writable only by the owning UID.

### 2.3 New `networks/{inviterUid}/joined/{inviteeUid}` collection

```js
networks/{inviterUid}/joined/{inviteeUid} = {
  inviteeUid:  "def456",
  displayName: "Sam K.",
  username:    "samk" | null,
  joinedAt:    <Timestamp>,
  status:      "signed_up"   // → "converted" set by v1.x Cloud Function
}
```

- One doc per (inviter, invitee) pair.
- Written **once by the invitee** on first auth when a referrer is resolved.
- The status field is set to `"signed_up"` today; the v1.x conversion Cloud Function flips it to `"converted"` after the 3-day activity gate is met. UI in this slice treats `"signed_up"` count as the joined count (a known temporary signal — see §6).
- The invitee can delete this doc at any time → removes themselves from the inviter's visible network. (Future UI for this is a v1.x line item; rule allows it from day one.)

### 2.4 Display-name policy

The `displayName` stored on `referralCodes/{code}` and copied into `networks/.../joined/{inviteeUid}` is the user's *self-chosen* display name. If they have not set one, the SPA computes a fallback: email local-part before the `@`, with the first character uppercased. This avoids exposing the full email to invitees/inviters.

---

## 3. Lifecycle flows

### 3.1 At signup (every new user)

1. Generate a 6-char candidate code: `Array.from({length:6}, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*36)]).join("")`.
2. Transactionally claim `referralCodes/{code}`. On collision (extremely rare at our scale; ~36⁶ ≈ 2.2B), retry with a new code. Cap retries at 5; surface a generic error on cap.
3. Stamp `users/{uid}.referralCode = code` once claim succeeds.

### 3.2 At signup, when arriving via an invite link

1. Page boot reads `?ref=<code>` from the URL (after the Hosting rewrite). If present and no user is signed in, write `sessionStorage.referrer = code`.
2. After successful Firebase Auth signup:
   - Read `referralCodes/{code}` to resolve `inviterUid`. If missing → silent fail; normal signup continues.
   - If `inviterUid === newUid` → silent fail (self-referral guard).
   - If the new user's doc already has a `referredBy` set → silent fail (immutable).
   - Otherwise:
     - Write `users/{newUid}.referredBy = inviterUid` (immutable after this).
     - Write `networks/{inviterUid}/joined/{newUid} = { inviteeUid: newUid, displayName, username: null, joinedAt: now, status: "signed_up" }`.

### 3.3 Inviter viewing their network

1. Profile → My Account → **My Network** sub-tab.
2. Live `onSnapshot` over `networks/{myUid}/joined` → list of entries, newest-first.
3. Achievements computed from `joined.length` via `networkAchievements()`.

### 3.4 Sharing the link

1. **Native share button** → `navigator.share({ title, text, url })`. Capacitor on iOS surfaces the native share sheet (iMessage, WhatsApp, mail, copy, etc.).
2. **Copy link button** → `navigator.clipboard.writeText(...)` with a toast confirmation.
3. **First-share local marker** → `localStorage.setItem("v-network-shared-once", "1")` powers the "Spread the word" achievement. Pure local; not Firestore.

---

## 4. Firestore rules delta

Appended to `firestore.rules`. Existing `users/{uid}` block is unchanged.

```javascript
// Referral code lookup index. Anyone authed can read (needed to resolve
// invite links); only the owning UID can write.
match /referralCodes/{code} {
  allow read: if request.auth != null;

  allow create: if request.auth != null
                && request.resource.data.uid == request.auth.uid;

  allow update, delete: if request.auth != null
                       && resource.data.uid == request.auth.uid;
}

// "Who joined because of me." The INVITEE writes their own join entry
// into the INVITER's subcollection. Only the inviter can read it.
match /networks/{inviterUid}/joined/{inviteeUid} {
  allow read: if request.auth != null
              && request.auth.uid == inviterUid;

  allow create: if request.auth != null
                && request.auth.uid == inviteeUid
                && request.resource.data.inviteeUid == inviteeUid;

  // Invitee can update (e.g. displayName change) or delete (opt-out) their
  // own entry. Inviter cannot mutate it.
  allow update, delete: if request.auth != null
                       && request.auth.uid == inviteeUid;
}
```

**Cross-resource invariants enforced:**
- Inviter cannot fabricate a join entry — only the invitee can create the doc, and only with their own UID.
- Inviter cannot edit display info — only the invitee can update their own entry.
- Inviter cannot delete entries to hide opt-outs — delete is invitee-only.

---

## 5. UI design

### 5.1 Sub-tab strip inside Profile → My Account

The current Profile shell has top-level panels: `account · scorecard · inspiration · content · history · reports · settings` (see `index.html` line 11741). The reportsPanel already nests an internal sub-tab strip (`reportsSubTab`), so there's precedent.

Inside the **account** panel, add a sub-tab strip at the top:
```
[ My Account ]  [ My Network ]
```

`profileAccountSubTab` state (default `"account"`) toggles between the existing content and the new network panel. Persisted to localStorage as `v-profile-account-subtab`.

### 5.2 My Network panel layout (top to bottom)

1. **Invite Code Card** (raised surface, large)
   - Big monospace text: `verrocchio.app/r/k7m9q2`
   - Two buttons side by side: `Copy link` (secondary) · `Share invite` (primary; calls `navigator.share`).
   - "How invites work" link → small modal explaining trial, ladder, privacy posture.

2. **Achievements Strip** (horizontal scroll on phone, wraps on desktop)
   - 8 badges total. Each badge: emoji/icon, label, threshold, reward subtext.
   - Locked badges: dimmed via opacity 0.4 and grayscale filter.
   - Unlocked badges: full color, with a small checkmark and unlocked-on date.

3. **People Who Joined Because of You** (the heart of the feature)
   - Empty state: a centered illustration + "No one has joined yet. Share your link to grow your workshop."
   - Populated: list of rows, newest-first. Each row:
     - Letter avatar (first char of displayName) on accent-color background, 32x32 circle.
     - Display name (or `@username` if set) on first line.
     - Relative timestamp ("3 days ago", "yesterday", "just now") on second line, muted text.
   - When status === "converted" (v1.x), append a tiny green dot next to the name. (Field exists today; visual treatment lands when the gate is wired.)

4. **Bottom Teaser** (small muted text)
   > "When entitlements ship, your network growth unlocks free-tier expansion and free Pro time. We're saving credit for everyone who builds early."

### 5.3 Visual conventions

- All colors via existing `--c-*` tokens. Dark mode is automatic.
- Inline `React.createElement` calls — no JSX (per `CLAUDE.md`).
- `React.memo` wrapper on the joined-list row component.
- Letter avatar is a `<div>` with `border-radius: 50%` and accent-tinted background; no library.

---

## 6. Achievements logic

Lives in `utils.js` as a pure function so node tests cover boundaries.

```js
function networkAchievements(joinedCount, sharedOnce) {
  return [
    { id: "spread-the-word",    label: "Spread the word",      threshold: null, reward: null,             unlocked: !!sharedOnce, gate: "shared" },
    { id: "first-builder",      label: "First builder",        threshold: 1,    reward: null,             unlocked: joinedCount >= 1,   gate: "count" },
    { id: "workshop-expanded",  label: "Workshop expanded",    threshold: 3,    reward: "Caps +30 days",  unlocked: joinedCount >= 3,   gate: "count" },
    { id: "workshop-permanent", label: "Workshop permanent",   threshold: 5,    reward: "Caps forever",   unlocked: joinedCount >= 5,   gate: "count" },
    { id: "pro-month",          label: "Pro for a month",      threshold: 10,   reward: "1 month Pro",    unlocked: joinedCount >= 10,  gate: "count" },
    { id: "pro-six-months",     label: "Pro for 6 months",     threshold: 25,   reward: "6 months Pro",   unlocked: joinedCount >= 25,  gate: "count" },
    { id: "pro-year",           label: "Pro for a year",       threshold: 50,   reward: "12 months Pro",  unlocked: joinedCount >= 50,  gate: "count" },
    { id: "founding-100",       label: "Founding 100 Club",    threshold: 100,  reward: "Lifetime Pro",   unlocked: joinedCount >= 100, gate: "count" }
  ];
}

// CommonJS export at bottom of utils.js (matches existing pattern)
if (typeof module !== "undefined" && module.exports) {
  module.exports.networkAchievements = networkAchievements;
}
```

**Node tests** (`tests/utils.test.mjs`) cover:
- `(0, false)` → all locked
- `(0, true)` → only "Spread the word" unlocked
- `(1, true)` → "Spread" + "First builder" unlocked
- `(3, true)` → 3 unlocked
- `(4, true)` → boundary, still 3 unlocked (workshop-permanent locked)
- `(5, true)` → 4 unlocked
- `(99, true)` → 7 unlocked
- `(100, true)` → 8 unlocked
- `(101, true)` → 8 unlocked (no extras above 100)

Thresholds match `docs/TODO.md §1.6` exactly so the v1.x entitlement-flip layer can switch on the same `id` values without rework.

---

## 7. File layout

New code follows the established pattern (panel bodies in `lib/views/profile/`):

- `lib/views/profile/NetworkPanel.js` — new file, ~300 LOC budget. Exports `window.NetworkPanel`.
- `utils.js` — add `networkAchievements()` + CommonJS export. ~30 LOC added.
- `tests/utils.test.mjs` — add the boundary tests. ~40 LOC added.
- `index.html`:
  - `DD` shape gets `referralCode: ""`, `referredBy: null`, `displayName: ""` defaults (~3 lines).
  - `hydrateCloudDoc` gets the same backfill (~3 lines).
  - `App()` gains `profileAccountSubTab` state + localStorage hookup (~6 lines).
  - Boot-time invite resolution + code-claim helpers (~50 lines).
  - `accountPanel` wrapper gains the sub-tab strip and routes to either existing content or `NetworkPanel` (~15 lines).
  - **Total added to `index.html`: ~80 LOC.** Well under the 1000-LOC cap; the existing `index.html` is already known-violator (~30k LOC) but this slice does not contribute meaningfully.
- `firestore.rules` — append the new match blocks (~25 lines).
- `firebase.json` — add the `/r/:code` rewrite if not already present.

`NetworkPanel.js` budget breakdown:
- Invite Code Card sub-component: ~60 LOC
- Achievement Strip sub-component: ~70 LOC
- Joined List + row sub-component: ~80 LOC
- Empty state + bottom teaser: ~30 LOC
- "How invites work" modal: ~50 LOC
- Total: ~290 LOC — under the 500 soft target.

---

## 8. Test plan

### 8.1 Unit tests (`tests/utils.test.mjs`)

- `networkAchievements()` boundary tests per §6.
- All 8 achievements present in returned array.
- Achievement order is stable (drives UI order).

### 8.2 Firestore rules emulator tests (new file: `tests/firestore-rules-network.test.mjs`)

- Authed user can read `referralCodes/{anyCode}`.
- Unauthed user cannot read `referralCodes/{anyCode}`.
- User A cannot create `referralCodes/foo` with `uid: B`.
- User A can create `referralCodes/foo` with their own uid.
- User A cannot mutate `referralCodes/foo` once created by User B.
- User A can read their own `networks/A/joined/*`.
- User A cannot read someone else's `networks/B/joined/*`.
- User B can write `networks/A/joined/B` with `inviteeUid: B`.
- User B cannot write `networks/A/joined/C` (wrong invitee uid).
- User B can update/delete their own `networks/A/joined/B` entry.
- User A cannot mutate `networks/A/joined/B` (only the invitee can).

### 8.3 Browser verification (Playwright via `browser-qa` skill)

- Desktop width (≥1024px) screenshot of My Network empty state, light mode.
- Desktop width screenshot of My Network with 3+ entries, light mode.
- iOS width (~390px) screenshot of empty + populated, light mode.
- Dark mode screenshot of populated state.
- Click-flow: open Profile → My Account → My Network → Copy link → toast appears.

### 8.4 Manual smoke

- Create two accounts (one inviter, one invitee).
- Invite link round-trip: inviter shares → invitee opens link → completes signup → inviter's My Network shows the new join within snapshot latency.
- Self-referral attempt: signed-in user opens their own link in incognito and signs up → no `referredBy` stamped; silent fail.
- Code collision retry: mock `Math.random` to a fixed seed, simulate a collision; second attempt succeeds.

---

## 9. Privacy delta

### 9.1 What's actually shared

When a user signs up via an invite link, the inviter can see:
- Display name (or email local-part fallback if no display name set).
- `@username` if claimed (a public handle by SOCIAL_LAYER_V1 design).
- Sign-up timestamp.

The inviter **cannot** see:
- Email address.
- Habits, goals, journal entries, completions, or any other tracker data.
- Whether the invitee is currently active (until v1.x's `"converted"` flip).

### 9.2 Privacy policy update

Add a clause to `docs/PRIVACY_POLICY.md` (verbatim suggested copy):

> **Invites and networks.** When you sign up via someone's invite link, that person can see your display name and your `@username` if you've set one. They cannot see your habits, goals, journal, or any other data. You can remove yourself from their network list at any time from Settings → Privacy → Networks. (Coming with v1.x.)

The "coming with v1.x" caveat is fine for the initial ship — the rule already allows the delete operation, only the UI is deferred.

### 9.3 No PII in `referralCodes/`

Only `displayName`, `username`, `uid`, `createdAt`. No email, no phone, no completion data. The doc is publicly readable to authed users *by design* (anyone with an invite code can look up who's inviting them, which is correct).

---

## 10. Rollout sequence

1. **Local dev + emulator** — implement the data model, rules, panel, and tests against the Firebase emulator. Verify all rules-test cases pass.
2. **Deploy rules** — push to staging Firestore, run emulator tests against staging. (No production user impact until SPA reads/writes the new collections.)
3. **Ship the SPA with code-generation gated by a localStorage flag** — `v-network-feature` defaults to `false` for the first day. Internal accounts flip it manually.
4. **Internal alpha (founder + a couple of test accounts)** — claim codes, invite each other, verify the My Network list populates correctly across devices.
5. **Soft enable** — flip the default to `true`. Existing accounts without a `referralCode` get one claimed lazily on next save.
6. **Verification screenshots** — capture the four screenshots from §8.3 before declaring the slice done.

---

## 11. Forward-compat with v1.x

Every shape in this design matches what `MONETIZATION_V1.md` §4–§5 already locks in:

- `referralCode` field name — matches MONETIZATION_V1.md §4.1.
- `referredBy` field name — matches MONETIZATION_V1.md §4.3.
- `status: "signed_up" | "converted"` — matches the gate language in MONETIZATION_V1.md §4.4.
- Achievement IDs and thresholds (3, 5, 10, 25, 50, 100) — match TODO.md §1.6 unlock ladder.

The v1.x Cloud Function will:
- Run on a daily schedule, scan `users/*.referredBy`.
- For each invitee passing the 3-day activity gate, flip `networks/{inviterUid}/joined/{inviteeUid}.status` to `"converted"`.
- Call `applyConversionMilestone(inviterUid, convertedCount)` (per MONETIZATION_V1.md §5) to flip entitlements when count crosses 3, 5, 10, 25, 50, 100.

The SPA in this slice does not need to change when v1.x lands — the existing rendering of the joined list will start showing the green-dot "converted" indicator automatically once status fields update.

---

## 12. Open questions resolved by this design

| Question | Decision |
|---|---|
| Sub-tab inside My Account vs sibling panel | **Inner sub-tab** — matches user request, has precedent in reportsPanel |
| Signup-truthy vs activity-truthy joined count for v1 | **Signup-truthy** with a `status` field, server-truthy comes v1.x |
| Show achievement rewards or hide until claimable | **Show** — the ladder is itself motivating |
| Vanity codes vs auto-generated codes | **Auto-generated** — eliminates moderation surface; vanity claims can come later if there's demand |
| QR code rendering for in-person sharing | **Deferred** — `navigator.share` covers the iOS case; QR is a v1.x polish item |
| Where to surface "Spread the word" achievement | **localStorage flag** — purely local, no Firestore round-trip needed |

---

## 13. Estimated effort

- Data model + DD/hydrate updates + code-claim helper: **0.5 day**
- Firestore rules + emulator tests: **0.5 day**
- `NetworkPanel.js` + sub-tab plumbing in `index.html`: **1.5 days**
- `networkAchievements()` + node tests: **0.25 day**
- Hosting rewrite + boot-time invite resolution: **0.5 day**
- Playwright verification screenshots + dark mode pass: **0.5 day**
- Privacy policy delta: **0.25 day**

**Total: ~4 days active work.** Saves an estimated 2 days of v1.x rework via forward-compat discipline.
