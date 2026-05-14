# Social Layer — v1 Implementation Spec

Status: implementation-ready blueprint. Strategy + rationale live in [TODO.md §2](TODO.md#2-social--community-layer--anchor-pillar-of-the-app); this doc translates that into the smallest shippable slice with concrete schemas, rules, and flows.

Companion docs:
- [TODO.md §2.5](TODO.md#25-data-model) — strategic data-model rationale
- [TODO.md §2.10](TODO.md#210-app-store-review-implications) — App Store requirements
- [firestore.rules](../firestore.rules) — current security rules (will be extended per §6 of this spec)
- [docs/PRIVACY_POLICY.md](PRIVACY_POLICY.md) — must be updated before launch (see §10)

---

## 1. Goal of v1 minimum slice

Ship the smallest possible social slice that proves out the **invite → connect → share → react** loop, satisfies Apple's user-to-user content review bar, and seeds the network effect from launch day. Anything beyond that ships in v1.x or v2.

**In scope for v1:**

1. Per-user **public username** (`@handle`) — claimed at signup or later, unique across the app. See [TODO.md §11.9](TODO.md#119-public-profile--username--profile-picture).
2. **Connection request** flow by username — sender invokes, recipient accepts/declines.
3. Owner can **share one habit or one goal** with one or more active connections at **viewer** permission only.
4. Partner sees: the shared item's name, current streak (habit) or % progress (goal), and the last 14 days of completion dots (habit only).
5. **Emoji-only reactions** (👏 💪 🔥 🫶) on each completion the partner can see. No freeform text.
6. **Block + Report** flow on every connection.
7. **In-app notification surface** only (no push notifications — see §7). A small dot on the bottom nav when there's an unread interaction.
8. **Privacy policy update** disclosing all of the above.

**Explicitly out of scope (deferred to v1.x or v2):**

- Push notifications (v1.x — see §7 for architecture-ready stubs)
- Accountability-partner / cheerleader permission tiers (v1.x)
- Groups / multi-party shares (v2)
- Customizable check-in cadence (v2)
- Auto-nudge on missed days (v1.x)
- Public profiles, discovery, leaderboards, global feed (never per §2.9)
- Freeform DMs (never per §2.9)

---

## 2. Data model

All collections are top-level. Documents are addressed by deterministic compound IDs where possible to make uniqueness queryable and security rules tractable.

### 2.1 `usernames/{username}` — uniqueness index

Already specified in [TODO.md §11.9](TODO.md#119-public-profile--username--profile-picture). One doc per claimed username:

```js
{
  uid: "abc123",           // owner UID
  createdAt: <Timestamp>,
  reservedUntil: null      // set when a username is released; another user can claim after this date
}
```

Rules: authenticated read by exact key (lookup by username); write only by the owning UID; uniqueness enforced by the fact that document IDs are unique. The `usernames_reserved` blocklist is also a top-level collection with read-only-by-server access.

### 2.2 `connections/{connId}` — bidirectional accountability link

`connId` = sorted-pair: `${min(uidA, uidB)}__${max(uidA, uidB)}`. Deterministic from the two UIDs so duplicate connections are structurally impossible.

```js
{
  uidA:        "abc123",       // lower lexicographic UID
  uidB:        "def456",       // higher lexicographic UID
  requestedBy: "abc123",        // uidA or uidB — initiator
  status:      "pending" | "active" | "blocked",
  blockedBy:   null | "abc123", // who initiated the block (if status === "blocked")
  createdAt:   <Timestamp>,
  acceptedAt:  <Timestamp | null>,
  blockedAt:   <Timestamp | null>
}
```

Lifecycle:
- **`pending`** — created on invite. Recipient sees the request in their inbox.
- **`active`** — recipient accepted. Both sides can now create shares pointing at this connection.
- **`blocked`** — either side blocked. ALL existing shares for this connection are auto-deleted (see §3.2). Connection doc is retained (not deleted) so the same pair can't immediately re-request — the blocked party must unblock first.

### 2.3 `shares/{shareId}` — per-item share grant

`shareId` is auto-generated. One doc per (owner, item, partner) triple.

```js
{
  ownerUid:     "abc123",
  partnerUid:   "def456",       // the recipient; must have an active connection with ownerUid
  itemKind:     "habit" | "goal",
  itemId:       "1234567890",   // habit or goal ID from owner's data.habits / data.goals
  permission:   "viewer",        // v1: viewer only. v1.x adds "cheerleader" and "accountability".
  createdAt:    <Timestamp>,
  revokedAt:    <Timestamp | null>  // soft-delete; partner stops seeing the item immediately
}
```

Owner can revoke any time → sets `revokedAt`. Partner can also leave a share they don't want → server rule clears their reaction history but the share doc lives until owner revokes (so the partner can be re-added without dataloss).

### 2.4 `interactions/{interactionId}` — reactions, check-ins

v1 stores **reactions only** but the schema is forward-compatible:

```js
{
  shareId:   "...",            // FK to shares
  fromUid:   "def456",          // partner (sender)
  toUid:     "abc123",          // owner (receiver)
  kind:      "reaction",        // v1.x adds "cheer" (canned phrase), v2 adds "check-in"
  payload:   "👏",              // the emoji (v1). v1.x: short canned-phrase ID. NEVER freeform text in v1.
  targetKind: "habit" | "goal",
  targetId:   "1234567890",     // the habit/goal being reacted to (mirrors share's itemId)
  targetDateKey: "2026-05-13",  // optional — which day's completion is being reacted to (null for goal reactions)
  createdAt: <Timestamp>,
  seenAt:    <Timestamp | null> // owner saw it; clears the unread badge
}
```

Throttling: enforced at write time via rule + server function. Max 10 reactions per `fromUid → toUid` pair per UTC day (covers the anti-harassment requirement).

### 2.5 Per-user blob is unchanged in v1

`data.habits[].history`, `data.goals[].history`, and the existing per-user doc shape remain as-is. Sharing is layered on top via the new top-level collections — no migration required for v1.

**Important:** [TODO.md §20.2](TODO.md#202-firestore--keep-reads-cheap) flags a per-user-blob → per-resource-subcollections migration as a prerequisite for the social layer at scale. That migration is **not required to ship v1** of social, but it's required before social reads grow beyond ~5 connections/user. Schedule it for v1.x, before push notifications.

---

## 3. Lifecycle flows

### 3.1 Invite → connect

1. Owner enters their partner's `@handle` in Profile → Connections → Add. Optional: a quick "Find from contacts" picker (see [TODO.md §1.13](TODO.md#113-ios-contacts-integration--fast-invite-flow)) — out of v1 scope but the UI affordance ships disabled with a "Coming soon" label.
2. Client reads `usernames/{handle}` to resolve the partner UID. Empty result → "No user with that username. They'll need to claim @handle inside Verrocchio first."
3. Client computes `connId = sortedPair(myUid, partnerUid)` and reads it.
   - If exists and `status === "blocked"` and `blockedBy === partnerUid` → silent fail, identical UI to "user not found." (Don't leak that you've been blocked.)
   - If exists and `status === "blocked"` and `blockedBy === myUid` → "You blocked this user. Unblock from your block list first."
   - If exists and `status === "pending"` and `requestedBy === myUid` → "Already invited."
   - If exists and `status === "pending"` and `requestedBy === partnerUid` → "They invited you. Tap to accept."
   - If exists and `status === "active"` → "Already connected. Open partner."
4. Otherwise, create the connection doc: `{ uidA, uidB, requestedBy: myUid, status: "pending", createdAt: now }`.
5. Partner sees the request in their Profile → Connections → Inbox. Tap **Accept** flips status to `"active"` and stamps `acceptedAt`. Tap **Decline** deletes the connection doc.

### 3.2 Share a habit/goal

1. From the Edit Habit (or Edit Goal) modal, add a **Share** section. Lists active connections; each row has a per-connection toggle.
2. Flip the toggle on → write `shares/{shareId} = { ownerUid, partnerUid, itemKind, itemId, permission: "viewer", createdAt }`.
3. Flip off → set `revokedAt` on the existing share doc. (Don't delete; preserves audit + lets owner un-revoke without recreating.)
4. Block (§3.4) → server-side fan-out deletes all shares for the affected connection.

### 3.3 Partner-side view

1. Profile → Connections → tap an active connection → Partner detail screen.
2. Lists all `shares` where `partnerUid === myUid` AND `ownerUid === selectedConn.otherUid` AND `revokedAt === null`.
3. For each shared habit: fetch that habit from `users/{ownerUid}` (subject to rules — see §6) and render: name, current streak, last-14-days dots.
4. Below each item: a row of 4 reaction emoji (👏 💪 🔥 🫶). Tap → write to `interactions` (subject to throttle).

### 3.4 Block + report

1. Profile → Connections → tap a connection → "More" menu → "Block user."
2. Confirm modal — explains that all shares with this user will be deleted and they won't be able to re-invite you.
3. On confirm:
   - Set `connections/{connId}.status = "blocked"`, `blockedBy = myUid`, `blockedAt = now`.
   - Server function (Cloud Function or rule-triggered batch) deletes all `shares` where `(ownerUid, partnerUid)` matches the connection pair in either direction.
   - Delete all `interactions` where `(fromUid, toUid)` matches the pair in either direction.
4. **Report user** — same modal offers an optional "Report" action. Writes to `reports/{autoId} = { reporterUid, reportedUid, reason, createdAt }`. No automated action in v1; manually reviewed.

---

## 4. Client API surface

Minimal JS surface added to `index.html` (or a new `social.js` if we want to keep the SPA single-file rule honest — see [.claude/CLAUDE.md](../.claude/CLAUDE.md) for stack reality check).

```js
// Username
async function claimUsername(handle)              // throws on duplicate / reserved
async function lookupUsername(handle)              // returns UID or null

// Connections
async function inviteConnection(handle)            // creates pending connection
async function acceptConnection(connId)
async function declineConnection(connId)
async function listConnections()                   // active + pending inbox + outgoing
async function blockConnection(connId, opts?)     // hard severance + share/interaction cleanup
async function unblockConnection(connId)
async function reportUser(uid, reason)             // writes to reports/

// Shares
async function shareItem(itemKind, itemId, partnerUid)
async function revokeShare(shareId)
async function listSharesByOwner(ownerUid)         // partner-side view of "what's been shared with me"
async function listSharesByItem(itemKind, itemId)  // owner-side view of "who can see this"

// Interactions
async function sendReaction(shareId, emoji, targetDateKey?)
async function listInteractionsForOwner()          // unread + recent
async function markInteractionsSeen(ids)
```

Throttling for `sendReaction` is server-enforced via Firestore security rule + a counter doc per (fromUid → toUid → day). Client also enforces locally to avoid showing optimistic UI then bouncing.

---

## 5. UI surfaces

### 5.1 Profile → Connections (new sub-tab)

Sibling of the existing `account / scorecard / inspiration / content / history / reports / settings` panels. Default landing state: list of active connections with their @handle + most recent interaction timestamp. Top tabs within: **Active · Pending · Blocked**.

### 5.2 Edit Habit / Edit Goal modal

Add a **Share** section below the existing Delete / Move to Future / Save buttons. Header: "Shared with" + count chip. Body: list of active connections with a toggle per row. Empty connections list → "Add a connection in Profile to share habits."

### 5.3 Partner detail screen

Full-screen sheet opened from Connections. Shows:
- Header: partner's @handle, profile picture (default letter avatar per [TODO.md §11.9](TODO.md#119-public-profile--username--profile-picture)).
- Body: cards per shared item (habit or goal). Each card shows current state + 4-emoji reaction row.
- Footer: "More" menu with Block / Report.

### 5.4 Inbox surface (subtle)

A small dot on the bottom-nav profile icon when there are pending connection requests OR unread reactions. Tapping navigates to Connections.

### 5.5 Reaction toast (owner side)

When a partner reacts to one of the owner's completions, a small toast appears the next time the owner opens the app: *"@handle reacted 👏 to your morning run."* Tapping opens the connection detail.

---

## 6. Firestore security rules

The biggest single change since the rules were last touched. Rules pseudocode (real rules in `firestore.rules` would be more verbose but follow this structure):

```javascript
match /usernames/{username} {
  allow read:   if request.auth != null;
  allow create: if request.auth != null
                && request.resource.data.uid == request.auth.uid
                && !exists(/databases/$(database)/documents/usernames_reserved/$(username));
  allow update, delete: if request.auth != null
                && resource.data.uid == request.auth.uid;
}

match /connections/{connId} {
  // Only the two parties named in the doc can read or write it.
  function isParty() {
    return request.auth != null
        && (request.auth.uid == resource.data.uidA
            || request.auth.uid == resource.data.uidB);
  }
  allow read: if isParty();
  // Create: deterministic ID must match sortedPair(initiator, target)
  allow create: if request.auth != null
                && request.resource.data.requestedBy == request.auth.uid
                && (request.auth.uid == request.resource.data.uidA
                    || request.auth.uid == request.resource.data.uidB)
                && request.resource.data.status == "pending";
  // Accept: only the *other* party can flip pending → active
  allow update: if isParty()
                && (
                  // accept
                  (resource.data.status == "pending"
                    && request.resource.data.status == "active"
                    && resource.data.requestedBy != request.auth.uid)
                  // block
                  || (request.resource.data.status == "blocked"
                    && request.resource.data.blockedBy == request.auth.uid)
                );
  allow delete: if isParty() && resource.data.status == "pending"
                && resource.data.requestedBy == request.auth.uid;
}

match /shares/{shareId} {
  // Owner can CRUD their own shares.
  allow read:   if request.auth != null
                && (request.auth.uid == resource.data.ownerUid
                    || request.auth.uid == resource.data.partnerUid);
  allow create: if request.auth != null
                && request.resource.data.ownerUid == request.auth.uid
                && /* connection between owner and partner must be active */;
  allow update: if request.auth != null
                && resource.data.ownerUid == request.auth.uid;
  allow delete: if request.auth != null
                && resource.data.ownerUid == request.auth.uid;
}

match /interactions/{id} {
  allow read: if request.auth != null
              && (request.auth.uid == resource.data.fromUid
                  || request.auth.uid == resource.data.toUid);
  // Create requires an active share between from and to.
  allow create: if request.auth != null
                && request.resource.data.fromUid == request.auth.uid
                && /* share with from === partnerUid + to === ownerUid exists and not revoked */
                /* + daily throttle check */;
  allow update: if request.auth != null
                && resource.data.toUid == request.auth.uid
                /* only the seenAt field can be flipped */;
  // No deletes by users; admin only.
}

// Allowing the partner to read the OWNER's habit/goal item — the key
// new privacy surface. Add a "shared-resource" sub-rule on
// users/{uid}/{itemKind}/{itemId}:
match /users/{ownerUid}/habits/{habitId} {
  allow read: if request.auth.uid == ownerUid
              || /* a share doc exists where partnerUid == request.auth.uid && itemId == habitId && revokedAt == null */;
}
```

**Mandatory before any social write goes live:** dedicated security review pass via `everything-claude-code:security-reviewer` and a Firestore Rules unit-test suite (Firebase emulator). See §8 test plan.

---

## 7. Push notifications — out of v1, but stub the interface

v1 ships **in-app inbox only**. No APNs, no FCM. But design the interaction model so push wiring is additive:

- All notifications resolve from `interactions` reads. The in-app inbox component reads unread interactions where `toUid === myUid && seenAt === null`.
- For v1.x: when a new `interaction` is created where `kind === "reaction"`, a Cloud Function fan-out sends an FCM push to the owner. Payload is generic ("You have a new reaction in Verrocchio") — never includes habit/goal text per [TODO.md §2.4](TODO.md#24-privacy--safety--non-trivial-surface).
- iOS APNs entitlement gets added to the Capacitor shell at v1.x ship time, not now.

---

## 8. Test plan

### 8.1 Security rules — Firebase emulator unit tests

Required before any rule deploy:

- `usernames`: cannot claim a username someone else owns; cannot claim a reserved name.
- `connections`: cannot create a connection on someone else's behalf; cannot accept your own pending invite; cannot read connections you're not party to.
- `shares`: cannot create a share for a connection that isn't active; cannot read shares you're not party to; partner cannot create/delete shares.
- `interactions`: cannot send reactions without an active share; daily throttle is enforced; cannot edit anything but `seenAt`.
- **Cross-resource: shared-habit-read.** A partner with an active share can read exactly the habit doc the share names — not other habits in the same owner's collection.

### 8.2 Block + revoke fan-out

After a block:
- All `shares` where `(ownerUid, partnerUid)` matches in either direction are deleted within 5 seconds (Cloud Function-driven).
- All `interactions` for those shares are deleted.
- Partner can no longer read the owner's habits/goals (rule-level enforcement, not just UI).
- The blocked party sees an identical UI to "user doesn't exist" if they try to re-invite — no information leak that they've been blocked.

### 8.3 UX flows (Playwright)

Critical paths:
1. Sign up → claim @handle → invite → accept on partner side → share a habit → react → owner sees toast.
2. Block from owner side → partner's view immediately loses the shared habit.
3. Revoke a share without blocking → partner loses just that one item; connection stays.
4. Daily reaction throttle: send 10 reactions, the 11th is rejected.

### 8.4 Apple App Review readiness

Before submitting v1 with social on:
- Block + report flow live and reachable from every connection.
- Privacy policy updated.
- Terms include user-conduct rules.
- App Review notes mention the social model and the absence of user-generated freeform text in v1.
- Age gate at 13+.

---

## 9. Rollout sequence

v1 social ships **after** the Apple Developer Program enrollment is complete (currently blocked on DUNS — see [docs/FOUNDER_HANDOFF.md Phase A](FOUNDER_HANDOFF.md#phase-a--apple-developer-setup-one-time-1-hour-active--24-48h-wait)). Suggested order once unblocked:

1. **Behind feature flag** — `data.socialEnabled = false` by default. Build all surfaces; gate visibility on the flag. Lets us merge code without exposing the network surface.
2. **Internal alpha** (founder + ≤3 invited testers) — flip the flag for those accounts via Firebase Console; iterate on the UX for a week. Security review happens here.
3. **Closed TestFlight beta** — 25 testers, flag-on. Watch for: (a) any rules violation in Firebase logs, (b) reaction throttle false positives, (c) accept/decline race conditions.
4. **Public launch** — flip the flag default to true. New users see social from day one; existing users see a one-time onboarding card pointing at Profile → Connections.

Per [TODO.md §2.11](TODO.md#211-priority--anchor-pillar-v1-minimum-slice-required), this is launch-required, not nice-to-have. **No private-only v1 launch.**

---

## 10. Privacy policy delta

[docs/PRIVACY_POLICY.md](PRIVACY_POLICY.md) must be updated before launch with:

- What data is shared: habit/goal name, current streak/progress, last 14 days of completions. Journal entries are **never** shared in v1.
- Who can see it: only specific connections the user has actively shared each item with.
- How to revoke: the per-share toggle, the block-user path, the block list management.
- That partners may see when the user marks a habit done (per-completion reactions imply visibility).
- Username retention: usernames are reserved for 90 days after release before reissue, to prevent impersonation.
- Reports inbox: the LLC reviews reports manually; report content is retained for 12 months.

---

## 11. Open questions deferred to build start

From [TODO.md §2.12](TODO.md#212-open-questions-to-resolve-before-building), some are now answered by this spec; others remain:

- ✅ Invite method: **invite-by-username**. (Phone contacts deferred to v1.x via §1.13.)
- ✅ Journal entries: **never sharable in v1.** Per-entry sharing can come later if a use case emerges.
- ⏳ Streak vs binary-today on partner view: **streak shown** by default. Owner can toggle to "show only whether I did it today" in Profile → Connections → Per-share settings — but that toggle is v1.x scope; v1 ships streak-always.
- ⏳ Push notification frequency cap: hard upper bound is **3 pushes per user per day**, plus a per-app-day cap of 1 reaction-push per `(fromUid → toUid)` pair (multiple same-day reactions consolidate into one push). v1.x.
- ⏳ Partner-saw-miss transparency: owner sees in their Inbox when a partner reacted to a missed day (i.e., partners can react to missed completions). Owner does *not* see passive "your partner viewed your data" reads — too privacy-invasive. Lock in pre-v1.x.

---

## 12. Estimated effort

- Data model + rules: **2 days** (with security review)
- Username claim flow: **1 day** (UI + uniqueness handling)
- Connection invite/accept: **2 days**
- Share + partner view + reactions: **3 days**
- Block + report: **1 day**
- Privacy policy + Terms update: **0.5 day**
- Internal alpha + iteration: **1 week**
- Closed TestFlight beta: **2 weeks**

**Total to public launch:** roughly 4–5 weeks active work + 2–3 weeks of paced testing. Critical-path is Apple Developer enrollment (DUNS), which is parallel and currently the longer pole.
