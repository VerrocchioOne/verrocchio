# Onboarding — v1 Implementation Spec

Status: implementation-ready blueprint. Strategy + rationale live in [TODO.md §3](TODO.md#3-onboarding--new-user-experience); this doc translates that into the smallest shippable slice with concrete state shapes, lifecycle flows, UI surfaces, and a rollout sequence.

Companion docs:
- [TODO.md §3.1](TODO.md#31-animated-genesis-sequence-before-onboarding) — genesis animation strategy + audio direction
- [TODO.md §3.2](TODO.md#32-surface-the-socialaccountability-concept-in-onboarding) — social-concept surfacing requirement
- [TODO.md §3.3](TODO.md#33-audio-pronunciation-of-verrocchio) — pronunciation cue
- [TODO.md §3.4](TODO.md#34-quick-onboarding-for-users-converting-from-another-habit--productivity-tracker) — converter import flow
- [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science) — focused goal-setting + behavioral science
- [docs/SOCIAL_LAYER_V1.md](SOCIAL_LAYER_V1.md) — social-layer slice this spec invites users into
- [docs/MONETIZATION_V1.md](MONETIZATION_V1.md) — trial start happens at the end of onboarding (§3 there)

---

## 1. Goal of v1 minimum slice

Ship a five-act onboarding that drops a brand-new user from "first launch" to "first completed habit" in under three minutes, while seeding the three retention loops the rest of the app depends on: **identity** (they know what Verrocchio is and how to say it), **commitment** (they've made one SMART goal + one non-negotiable habit), and **social intent** (they've at least seen the invite-a-partner concept and chosen whether to claim a `@handle` now or later).

The existing guided tour ([index.html `TOUR_STEPS`](../index.html#L10720)) stays — it's the *interactive* core. v1 wraps it in two new pre-steps (genesis animation + pronunciation cue) and one new post-step (social-concept card + optional `@handle` claim), and forks the very first decision into two parallel tracks: **new-to-habit-trackers** vs **switching-from-another-app**.

**In scope for v1:**

1. **Genesis pre-step** — single-screen animated intro per [TODO.md §3.1](TODO.md#31-animated-genesis-sequence-before-onboarding). Skippable; not gated. SessionStorage-only "seen" flag so cross-device second-logins don't replay it.
2. **Pronunciation cue** — pairs with the genesis step and the existing welcome modal per [TODO.md §3.3](TODO.md#33-audio-pronunciation-of-verrocchio). Reuses existing `speakVerrocchio()` ([index.html:4346](../index.html#L4346)).
3. **Two-path fork** — "I'm new to habit trackers" vs "I'm switching from another app." Both lead into the existing tour; the switcher path inserts a paste/suggested-set step before goal-setting.
4. **Focused goal-setting** — caps initial setup at **1 goal + 2 habits** during the onboarding flow per [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science). One habit gets marked non-negotiable. Each habit captures a `when` + `where` implementation intention.
5. **Quick converter import (lite)** — for the switcher path: a single paste-textarea ("one habit per line") + a curated "Add 5 starter habits" suggested-set. **No OCR, no API integrations, no CSV parser in v1** — those are §3.4 Paths A/B/C deferred to v1.x.
6. **Social-concept surfacing** — one card frames Verrocchio as a tool for accountability with others and invites the user to claim an `@handle`. Claiming is **optional**; the user can skip and revisit from Profile → Connections later.
7. **Existing guided tour, unchanged in structure** — same 17-step `TOUR_STEPS` walkthrough; we only adjust step 1 copy + step ordering so the social card slots in cleanly.
8. **Day-7 trial start** — onboarding completion stamps `data.trial.startedAt = now`, kicking off the entitlement state machine from [MONETIZATION_V1.md §3](MONETIZATION_V1.md#3-trial-state-machine).

**Explicitly out of scope (deferred to v1.x or v2):**

- Screenshot OCR import (Path A in [TODO.md §3.4](TODO.md#34-quick-onboarding-for-users-converting-from-another-habit--productivity-tracker)) — v1.x once AI proxy quota is settled.
- OAuth-based imports — Habitica, Notion, Apple Health, Reminders, Strava (Path B) — v1.x, one provider at a time.
- CSV / native-export parsing (Path C) — v1.x.
- The +7-day "consider adding more" soft prompt — v1.x; nice-to-have, not blocking.
- Per-step analytics on the genesis animation (drop-off curves) — v1.x.
- Identity-framing UI ("I am the kind of person who…") as a *required* field — v1 surfaces it as an optional caption on the non-negotiable habit; full integration into the [home page intention step](TODO.md#43-home-page-daily-sequence--optimize-for-routine-consistency-evidence-based) is part of §4.3, not this spec.
- Genesis animation **assets** themselves (the lyre/harp underscore, the visual choreography). This spec defines the *slot*; asset commissioning is a parallel design task — see §10.
- Native iOS share-sheet "Open in Verrocchio" registration — v1.x, depends on Capacitor 8.x iOS plugin work.

---

## 2. State model

Onboarding state is a small additive layer on the existing per-user blob. No new top-level collections. Three new fields plus a sessionStorage-only marker for the genesis animation.

### 2.1 Per-user persistent state (Firestore-synced)

```js
data.onboarding = {
  version:           "v1",
  startedAt:         1715587200000,    // ms, first launch
  completedAt:       null | 1715587260000,
  path:              "new" | "switcher" | null,  // null until step 2 fork
  steps: {
    welcomeSeen:        true | false,   // existing welcomeModalSeen (renamed/aliased)
    pronunciationHeard: true | false,   // user tapped 🔊 OR auto-played
    forkChosen:         true | false,
    importApplied:      true | false,   // only for path === "switcher"
    socialIntroSeen:    true | false,
    handleClaimed:      true | false,   // optional; null if skipped
    goalCreated:        true | false,
    habitsCreated:      0..2,           // count
    nonNegotiableMarked:true | false,
    tourCompleted:      true | false    // mirrors existing data.tourDone
  }
}
```

`data.welcomeModalSeen`, `data.onboardingComplete`, `data.tourDone` ([index.html:3071-3078](../index.html#L3071)) all continue to exist for back-compat. `data.onboarding.steps.welcomeSeen` aliases `data.welcomeModalSeen`; we don't migrate the legacy flags, we keep both in sync via `save()`. `hydrateCloudDoc` ([index.html:3094](../index.html#L3094)) seeds the `data.onboarding` block with sensible defaults derived from the legacy flags so anyone signed up before v1 lands never re-enters onboarding.

### 2.2 SessionStorage-only state (intentionally non-synced)

Per the user requirement that the genesis animation **must not** replay when a returning user signs in on a new device, the "seen the animation" flag lives in `sessionStorage` per browser session, NOT in `data.*`:

```js
sessionStorage.setItem("v-genesis-seen", "1");
```

Rationale: `data.*` syncs across devices via Firestore. Putting this in `data` would mean a user who watched the animation on iPhone never sees it on iPad — but the animation is identity-priming brand content; we'd rather show it on every new device than withhold it. SessionStorage is per-tab per-browser, so the same user opening the app on a second device gets the animation once on that device's first session, then never again that session. If they kill the tab and reopen, **it does** play again — that's intentional. Use the `🔊 Replay pronunciation` button + the existing "Replay Welcome Tour" entry point ([index.html:23691](../index.html#L23691)) as the deliberate-replay paths.

For users on a fast-second-launch path who'd find this annoying (refresh the page mid-onboarding, animation replays), the genesis pre-step has a **2-second skip affordance** visible from the first frame.

### 2.3 SessionStorage marker for the new-device guard

```js
// On signed-in mount, BEFORE rendering the genesis step:
const isReturningUser = data.onboarding && data.onboarding.completedAt;
const seenThisSession = sessionStorage.getItem("v-genesis-seen") === "1";
if (isReturningUser || seenThisSession) {
  // Skip genesis. Returning users go straight to the app shell.
  // First-session returning users (cross-device sign-in) get the animation
  // exactly once on this device, then never again in this tab.
}
```

`isReturningUser` is the canonical "you've onboarded before" check. `seenThisSession` is the redundant guard against page refreshes mid-onboarding.

---

## 3. Lifecycle flows

The full onboarding is **5 acts**. Each is skippable individually; only the goal-setting + habit-setting steps gate the entitlement-trial start.

### 3.1 Act 1 — Genesis pre-step (~12s, skippable from t+0)

**Trigger:** signed-in render, `!data.onboarding.completedAt && !sessionStorage["v-genesis-seen"]`.

**Behavior:**

1. Full-screen modal (no nav bar, no scroll), `position: fixed; inset: 0; z-index: 1100`. Sits above the welcome modal layer (which is z-1000).
2. Animation plays. Per [TODO.md §3.1](TODO.md#31-animated-genesis-sequence-before-onboarding) the animation is ~12s, Renaissance-themed, ends on the Verrocchio wordmark. **v1 ships with a placeholder static-image fallback** (the existing wordmark + a soft fade-in) if the animation asset isn't ready by code-freeze. The fallback is acceptable; the audio + wordmark do enough alone. The animated version drops in via a single image/video swap, no logic change.
3. Underscore audio: lyre/harp clip per [TODO.md §3.1](TODO.md#31-animated-genesis-sequence-before-onboarding). Respects iOS silent-mode (use HTMLAudioElement; iOS auto-mutes when silent switch is on, which is the correct accessibility behavior). User has explicitly accepted any auto-play by tapping into the app, but mute on `prefers-reduced-motion: reduce` or if the page's audio context isn't user-activated (some iOS WebViews block auto-play even with a tap — degrade silently).
4. Pronunciation: the existing `speakVerrocchio()` ([index.html:4346](../index.html#L4346)) fires once at ~t+6s when the wordmark appears. Phonetic text `ver-ROCK-kee-oh` displays below the wordmark per [TODO.md §3.3](TODO.md#33-audio-pronunciation-of-verrocchio).
5. **Skip affordance from t+0:** a small "Skip ▸" link in the top-right. Auto-advances at animation end. On either path: set `sessionStorage["v-genesis-seen"] = "1"`, fade out, render Act 2.

**Accessibility:**
- `prefers-reduced-motion: reduce` → static image instead of motion. Pronunciation audio still plays (unless silent mode). Phonetic text stays.
- Skip link is keyboard-reachable from the first frame (focus on mount).
- Audio has a visible play/pause toggle in the bottom-right.

### 3.2 Act 2 — Welcome modal (existing, lightly extended)

**Trigger:** Act 1 ended OR returning user without `welcomeModalSeen`.

The existing welcome modal ([index.html:24665](../index.html#L24665)) stays. v1 changes:

1. CTA below the existing "Add my first habit" button: **a second primary button labeled "I'm switching from another app."**
2. Both buttons set `data.onboarding.path` — `"new"` for first, `"switcher"` for second.
3. Both then flip `welcomeModalSeen: true` and route into Act 3 OR Act 4 accordingly.
4. The existing `🔊` button to replay pronunciation stays. Tapping it sets `data.onboarding.steps.pronunciationHeard = true` (already implicitly captured via the `touchFeature("brand.pronounce")` call inside `speakVerrocchio`).

**No tour starts yet.** The tour kicks off after Act 3 (for new users) or Act 3.5 (for switcher users).

### 3.3 Act 3 — Social-concept card (~8s, skippable)

**Trigger:** `forkChosen === true && !socialIntroSeen`.

Per [TODO.md §3.2](TODO.md#32-surface-the-socialaccountability-concept-in-onboarding), this is the **single non-negotiable copy beat**: Verrocchio is not a private tracker; it's a tool for accountability with others. The social slice itself isn't shipped yet (see [SOCIAL_LAYER_V1.md](SOCIAL_LAYER_V1.md) for the v1 minimum), so this card describes the model and invites — without forcing — the user to claim a `@handle`.

**Layout** (full-screen card, dismissible):

```
┌──────────────────────────────────────────────┐
│                                              │
│  Verrocchio is built for accountability      │
│  with people you trust.                      │
│                                              │
│  Share habits with a partner. They see your  │
│  streak; they react with 👏 💪 🔥 🫶 — no    │
│  feeds, no leaderboards. Just one or two     │
│  people in your corner.                      │
│                                              │
│  Claim your @handle so they can find you     │
│  when you're ready:                          │
│                                              │
│  [   @____________________   ]               │
│  [ Check availability ]                      │
│                                              │
│  [ Claim @handle ]   [ I'll do this later ]  │
│                                              │
└──────────────────────────────────────────────┘
```

**Behavior:**
- The handle input is **optional**. Both CTAs are dismissive — "I'll do this later" sets `socialIntroSeen: true, handleClaimed: false` and proceeds. "Claim @handle" attempts to write `usernames/{handle}` per [SOCIAL_LAYER_V1.md §2.1](SOCIAL_LAYER_V1.md#21-usernamesusername--uniqueness-index); on success, `handleClaimed: true` + the username is written to `data.username`.
- If [SOCIAL_LAYER_V1.md](SOCIAL_LAYER_V1.md) hasn't shipped yet (it's on the same v1 track), the "Claim @handle" button can be wired to write directly to a reserved `usernames/{handle}` collection with a `pending: true` flag — the user reserves their handle now; the social feature activates when the social-layer slice deploys. Document this in [TODO.md §3.2](TODO.md#32-surface-the-socialaccountability-concept-in-onboarding) and [SOCIAL_LAYER_V1.md §9](SOCIAL_LAYER_V1.md#9-rollout-sequence).
- The card is also reachable later from **Profile → Connections** ([SOCIAL_LAYER_V1.md §5.1](SOCIAL_LAYER_V1.md#51-profile--connections-new-sub-tab)). The "later" path is not a dead-end.

**Validation rules** (handle):
- 3–20 chars, `^[a-z0-9_]+$`, case-folded to lowercase.
- Reserved blocklist per [SOCIAL_LAYER_V1.md §2.1](SOCIAL_LAYER_V1.md#21-usernamesusername--uniqueness-index) (admin, support, verrocchio, etc.).
- Real-time availability check on input blur or "Check availability" tap.

### 3.4 Act 4a — New-user path: focused goal-setting (existing tour)

**Trigger:** `path === "new" && socialIntroSeen === true && !tourCompleted`.

This is where the existing guided tour ([index.html `TOUR_STEPS`](../index.html#L10720)) takes over **unchanged in structure**. v1 layers four small refinements on top per [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science):

#### 3.4.1 The cap

The user is told up front (in TOUR_STEPS step 1 body, edited): *"We'll set 1 goal and 1–2 habits together. That's the cap during this walkthrough — research shows starting small is the difference between sticking with it and burning out. You can add more once these are humming."*

Cap enforcement: once the user has 1 goal + 2 habits, the tour's "save habit" gate ([TOUR_STEPS step 15](../index.html#L10720)) advances to the wrap-up step. No additional "add habit" prompt fires from the tour. The user *can* still add more habits/goals manually from the [+] button — the cap is a *behavioral guardrail* in the tour, not a hard block on the data layer.

#### 3.4.2 Implementation intentions (when + where)

Per Gollwitzer 1999 (cited in [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science)). Each habit creation step in the tour gets two new optional fields:

```js
// Added to habit record:
{
  // ...existing fields,
  intentionWhen:  "After my morning coffee",       // string, freeform, optional
  intentionWhere: "Kitchen table"                  // string, freeform, optional
}
```

These render in the Edit Habit modal under a collapsible "When + where" section. They DO show on the home page intention step ([TODO.md §4.3](TODO.md#43-home-page-daily-sequence--optimize-for-routine-consistency-evidence-based)) as a suggested phrasing for the day's intention. v1 just captures + displays them; the auto-suggest into the home page is part of §4.3, not this spec.

#### 3.4.3 The non-negotiable marker

After habit #1 is created, the tour adds **one new step**: *"Mark this as a non-negotiable. The one habit you protect even when everything else slips."* A star toggle on the habit card. Sets `habit.nonNegotiable: true`. Wires into the [§14.3 crowding detection](TODO.md#143-detect-additive-habits-crowding-out-non-negotiables) signal — the AI uses this flag to know which habit is the user's anchor.

The flag is already supported in the data model (verify via grep — if not, add it in this spec's implementation). One non-negotiable per onboarding; further non-negotiables can be marked later from any habit card.

#### 3.4.4 SMART framing on the goal step

The existing tour step 5 ("Add SMART details") already presents SMART. v1 makes a small copy refinement per [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science): change the body from *"Specific, Measurable, Achievable, Relevant, Time-bound. Fill them in now or tap Add Goal when you're ready — SMART is optional."* to:

> *"Make it Specific, Measurable, Achievable, Relevant, Time-bound. Vague goals collapse; concrete ones stick. You can fill these now or refine later."*

Same fields, sharper framing. The optional-ness stays — making them required tanks completion rate.

### 3.5 Act 4b — Switcher path: paste-or-pick import

**Trigger:** `path === "switcher" && socialIntroSeen === true && !importApplied`.

v1 ships the **lightest possible** converter path. No OCR (Path A — deferred per scope), no OAuth (Path B — deferred), no CSV parser (Path C — deferred). Just two affordances:

#### 3.5.1 "Paste your existing habits, one per line"

A single full-width textarea. Placeholder text:

```
Run 20 minutes
Read 10 pages
Drink 8 glasses of water
10 pushups
Floss
```

**Behavior:**
- On "Import these," the SPA splits on `\n`, trims, filters empty lines and any line >120 chars, dedupes by lowercase.
- The result is shown in a **preview list** per [TODO.md §3.4](TODO.md#34-quick-onboarding-for-users-converting-from-another-habit--productivity-tracker): *"We found N habits. Here they are. Edit or remove any before continuing."* Each item is an editable input with a remove ✗.
- All habits default to `frequency: { type: "daily", days: [], day: null }`, `nonNegotiable: false`, `parked: false`, no linked goal, no when/where.
- The focused-onboarding cap from §3.4.1 applies: if the user pasted 12 habits, the importer **auto-activates the first 2** and parks the remaining 10 in the Future Habits staging area ([TODO.md §6](TODO.md#6-future-goals--future-habits--brainstorm-staging-area)) by stamping `parked: true` + `parkedReason: "imported-overflow"`. UI explains: *"You pasted 12 habits. We've activated 2 to start (research-backed cap) and moved the rest to Future Habits — you can promote them anytime."*

#### 3.5.2 "Add 5 starter habits" suggested-set

For users who arrive blank (no list ready, no other app to switch from but tapped "switcher" by accident), offer a curated starter set right below the paste box:

```
□ Run 20 minutes        — Health
□ Read 10 pages         — Learning
□ Drink 8 glasses water — Health
□ 10 pushups            — Health
□ Floss                 — Health
```

Multi-select checkboxes. Tapping "Add selected" creates the chosen habits with `source: "starter-set"`. Same cap rules apply.

#### 3.5.3 Then drop into the tour

After import, the user falls through to **Act 4a's tour starting at the goal-setting step** (the habits step is auto-skipped via the existing `skipIf` pattern ([index.html:10872](../index.html#L10872))). The tour still walks them through creating their first **goal**, linking imported habits to it, and marking a non-negotiable.

The OCR / OAuth / CSV paths from [TODO.md §3.4](TODO.md#34-quick-onboarding-for-users-converting-from-another-habit--productivity-tracker) ship in v1.x as additional buttons stacked above the textarea. The architecture leaves room for them.

### 3.6 Act 5 — Completion + trial start

**Trigger:** `tourCompleted === true && !data.onboarding.completedAt`.

1. Stamp `data.onboarding.completedAt = now`, `data.onboardingComplete = true`, `data.tourDone = true` (legacy flags).
2. Stamp `data.trial = { startedAt: now, expiresAt: now + 7*86400000, extensionGrants: [] }` per [MONETIZATION_V1.md §3.1](MONETIZATION_V1.md#31-trial-timestamps). **This is the only place the trial starts.** If the user signs up and never finishes onboarding, the trial doesn't begin — they're in an indeterminate "pre-trial" state. Document this; it's intentional.
3. Confetti / brief celebration moment (existing `🎉` overlay if present, otherwise a 2-second "You're set" toast).
4. Drop into the Home tab. The home page daily sequence ([TODO.md §4.3](TODO.md#43-home-page-daily-sequence--optimize-for-routine-consistency-evidence-based)) runs as normal — they'll find their non-negotiable auto-suggested in the intention step.

---

## 4. Client API surface

Minimal additions to `index.html`. No new files unless we crack the 25k-line ceiling — defer that to a separate refactor.

```js
// Onboarding state
async function startOnboarding()                        // sets data.onboarding.startedAt
async function setOnboardingPath(path)                  // "new" | "switcher"
async function markStep(stepName, value = true)         // generic step-flag setter
async function completeOnboarding()                     // Act 5 transitions

// Genesis pre-step
function shouldShowGenesis()                            // returns boolean from §2.3 logic
function markGenesisSeen()                              // sets sessionStorage flag

// Social-concept card
async function checkHandleAvailable(handle)             // proxy to usernames/{handle} read
async function claimHandle(handle)                      // proxy to SOCIAL_LAYER_V1.md §2.1 write

// Switcher path
function parseHabitPaste(text)                          // pure; returns string[] after trim/dedupe/cap
async function importPastedHabits(names)                // creates habit records; parks overflow
async function applyStarterSet(selectedIds)             // creates from curated list

// Focused goal-setting
async function markHabitNonNegotiable(habitId)          // toggles habit.nonNegotiable
async function setImplementationIntention(habitId, when, where)
```

`startOnboarding` is called on first signed-in render after auth completes. `completeOnboarding` is the bridge into [MONETIZATION_V1.md §3](MONETIZATION_V1.md#3-trial-state-machine). Everything else is called from the React components rendering each Act.

---

## 5. UI surfaces

### 5.1 Genesis modal — new

Full-screen, z-1100, animated entry/exit. Renders only when `shouldShowGenesis()` returns true. Owns its own `<audio>` element + its own skip button.

### 5.2 Welcome modal — modified

The existing modal at [index.html:24665](../index.html#L24665) gains a second primary CTA ("I'm switching from another app"). Tiny diff; ~30 lines.

### 5.3 Social-concept card — new

Full-screen card. Renders after welcome modal dismissal when `path !== null && !socialIntroSeen`. Owns the `@handle` input + availability check + "Claim" / "Later" buttons.

### 5.4 Switcher import card — new

Full-screen card. Renders for `path === "switcher" && !importApplied`. Two affordances per §3.5: paste textarea + suggested-set checklist.

### 5.5 Guided tour — existing, lightly edited

`TOUR_STEPS` ([index.html:10720](../index.html#L10720)) gets:
- One copy edit on step 1 (the cap framing).
- One new step inserted after habit #1 creation (the non-negotiable marker).
- Per-habit step gains two new optional inputs (`intentionWhen` / `intentionWhere`).
- Step 5 SMART body copy refinement.

No new step counts beyond +1; the cascade-renumbering downstream in `TOUR_STEPS` is minimal.

### 5.6 Profile → Replay entry point — existing, no change

The "Replay Welcome Tour" button ([index.html:23683](../index.html#L23683)) keeps its current behavior — clears `v-tour-done`, sets `tourStep = 1`, opens the guided tour from the existing TOUR_STEPS array. **It does NOT replay the genesis animation or the social-concept card.** Those are first-time-only by design. If we need a "Replay genesis" affordance later (e.g., a small button in Profile → About), add it then — but the brand-onboarding sequence isn't something users typically want to repeat, and the pronunciation `🔊` button stays on the brand name everywhere.

---

## 6. Security / rules

Onboarding state writes to the per-user blob; no new top-level collections are required by this spec.

The `@handle` claim in Act 3 writes to `usernames/{handle}` per [SOCIAL_LAYER_V1.md §2.1](SOCIAL_LAYER_V1.md#21-usernamesusername--uniqueness-index). Rules already specified there. **One additional rule beyond what's in SOCIAL_LAYER_V1.md §6:** if the social layer ships *after* onboarding v1, the `usernames` collection still needs to exist with the same rules so handle reservation from onboarding works. If shipping social-after-onboarding, deploy the `usernames` rules first as a prerequisite.

No other new rules needed.

---

## 7. Test plan

### 7.1 Genesis pre-step

- New user, first session → genesis plays. Skip button visible from t+0.
- Skip → animation halts immediately, sessionStorage flag set, Act 2 renders.
- Auto-advance at animation end → sessionStorage flag set, Act 2 renders.
- Same session, refresh page → genesis does NOT replay (sessionStorage hit).
- New device same user, first session → genesis DOES play (sessionStorage empty + completedAt set means we still skip; this is the correct cross-device behavior).
- Wait — confirm: cross-device returning user should NOT see genesis. Test: sign in on a fresh browser as a user with `data.onboarding.completedAt` set → genesis skipped. ✓
- `prefers-reduced-motion: reduce` → static-image fallback renders; audio still plays (unless silent).
- iOS silent-mode → animation plays, audio is silent (system override, correct).

### 7.2 Path fork

- Welcome modal "Add my first habit" → `data.onboarding.path === "new"`, no switcher card shown.
- "I'm switching from another app" → `data.onboarding.path === "switcher"`, switcher card shown.
- Switcher card "skip" → falls through to Act 4a goal-setting (no habits pre-created).

### 7.3 Social-concept card

- Claim valid handle → `usernames/{handle}` written, `data.username` written, `data.onboarding.steps.handleClaimed === true`.
- Claim taken handle → error message; user can try another or skip.
- Claim reserved handle (blocklist) → error message; same recovery.
- "I'll do this later" → no write to usernames/, `socialIntroSeen: true`, `handleClaimed: false`.
- After skip, claim later from Profile → Connections works.

### 7.4 Focused goal-setting cap

- Complete the tour with 1 goal + 2 habits → tour ends naturally at the cap.
- Try to add a 3rd habit during the tour → tour ends naturally, but the [+] button still works from the main app shell (the cap is tour-internal only, not a data-layer block).
- Mark a habit non-negotiable during the tour → `habit.nonNegotiable === true` persists.
- Capture `intentionWhen` + `intentionWhere` → persists on habit; displays in Edit Habit modal.

### 7.5 Switcher paste-import

- Paste 5 lines → 5 habits created, 0 parked.
- Paste 12 lines → first 2 activated, 10 parked with `parkedReason: "imported-overflow"`.
- Paste blank → no habits created, preview shows "0 found, add some above."
- Paste with duplicates ("Run\nrun\nRUN") → deduped to 1 habit.
- Paste with >120-char line → that line dropped, others kept.
- "Add 5 starter habits" all checked → 2 activated, 3 parked (cap applies).

### 7.6 Completion bridge to trial

- Finish onboarding → `data.trial.startedAt = now`, `expiresAt = now + 7d`.
- Quit mid-onboarding → `data.trial` undefined (no trial started yet).
- Restart app mid-onboarding → resumes at the last completed step (don't reset to genesis if `data.onboarding.startedAt` is set + sessionStorage clean — replay genesis but skip to the next pending step).

### 7.7 Returning-user guards

- Account with `data.onboarding.completedAt` set → onboarding entirely skipped on every device.
- Account with `data.welcomeModalSeen === true` and no `data.onboarding` block (legacy v1 alpha tester) → `hydrateCloudDoc` seeds `data.onboarding.completedAt = now`, skips onboarding silently.
- Account with `data.tourDone === true` and no `data.onboarding` → same hydration; skips.

### 7.8 Visual / accessibility

Per the [.claude/CLAUDE.md verification gate](../.claude/CLAUDE.md), every UI change in this spec needs:
1. Desktop screenshot at ≥1024px width.
2. iOS-width screenshot at ~390px.
3. Dark-mode check on the genesis modal, social-concept card, and switcher card (all three are new surfaces).
4. Keyboard-only walkthrough — every step reachable without touch.
5. VoiceOver smoke test on the iOS shell — at least the genesis skip button + welcome modal CTAs announce correctly.

---

## 8. Rollout sequence

Onboarding v1 ships **before** [SOCIAL_LAYER_V1.md](SOCIAL_LAYER_V1.md) and **before** [MONETIZATION_V1.md](MONETIZATION_V1.md) can launch — both depend on entry-point hooks this spec installs (handle claim, trial start). Order:

1. **Prereq — onboarding state seeding.** Add `data.onboarding` to defaults + `hydrateCloudDoc` ([index.html:3071](../index.html#L3071), [index.html:3094](../index.html#L3094)). Existing accounts get `completedAt = now` so they skip onboarding entirely. Zero user-facing change at this step.
2. **Behind feature flag** — `data.onboardingV1Enabled = false`. Build all five Acts; keep the old single-path flow live for new accounts. Lets the new code merge without flipping the funnel.
3. **Genesis animation slot lands with placeholder.** The placeholder (static wordmark + pronunciation audio + phonetic text) ships first. The animated underscore is a parallel design-and-asset task — slot in via a single `<img>` → `<video>` swap with no logic change.
4. **Internal alpha** — flip the flag for the founder + ≤3 testers via Firebase Console. Watch for: (a) genesis skip-rate, (b) switcher-path uptake, (c) handle-claim rate, (d) cap-hit before trial-start.
5. **Closed TestFlight beta** — 25 testers, flag on. Validate against the [MONETIZATION_V1.md §13](MONETIZATION_V1.md#13-rollout-sequence) day-7 funnel signal: do users who finish onboarding actually return on day 2? Day 3?
6. **Public launch** — flag default to true. New signups get the full sequence. Existing users untouched.
7. **v1.x: animation asset.** Commission lyre/harp + animation per [TODO.md §3.1](TODO.md#31-animated-genesis-sequence-before-onboarding). Drops in via asset-only deploy.
8. **v1.x: converter paths.** Layer OCR (Path A) → OAuth (Path B) → CSV (Path C) per [TODO.md §3.4](TODO.md#34-quick-onboarding-for-users-converting-from-another-habit--productivity-tracker). Each is an additive button above the paste-textarea; no flow rewrite.

Per [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science): onboarding is the single highest-leverage UX surface for long-term retention. Treat alpha → beta → launch as a real funnel-validation gate, not a checklist. If conversion to day-2 retention is <40% at the end of beta, retune §3.5 cap numbers (1+2 vs 2+3) and Act 3 social-card copy before public launch.

---

## 9. Open questions

From [TODO.md §3](TODO.md#3-onboarding--new-user-experience), some are now answered by this spec; others remain:

- ✅ Genesis animation skippable: **yes, from t+0.** Resolved.
- ✅ Genesis flag location: **sessionStorage, not `data.*`.** Resolved.
- ✅ Social concept introduced where: **dedicated Act 3 card.** Resolved.
- ✅ Handle claim mandatory: **no, optional, defer-friendly.** Resolved.
- ✅ Converter paths in v1: **paste + suggested-set only; OCR/OAuth/CSV in v1.x.** Resolved.
- ✅ Focused goal-setting cap: **1 goal + 2 habits.** Resolved (matches [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science) baseline).
- ⏳ +7-day "consider adding more" prompt: **out of v1.** Recommend wiring in v1.x once we have base-rate retention data — without it, the prompt timing is a guess.
- ⏳ Identity-framing prompt placement: this spec puts it as an optional caption on the non-negotiable habit. Open: should the daily home-page intention step ([TODO.md §4.3](TODO.md#43-home-page-daily-sequence--optimize-for-routine-consistency-evidence-based)) be the *primary* identity surface instead, with onboarding just naming the habit? Lock before §4.3 redesign lands.
- ⏳ Genesis audio licensing: stock-audio vs custom commission. Per [TODO.md §3.1](TODO.md#31-animated-genesis-sequence-before-onboarding), budget <$200. Decide before commissioning.
- ⏳ Phonetic spelling rendering: this spec assumes `ver-ROCK-kee-oh` per [TODO.md §3.3](TODO.md#33-audio-pronunciation-of-verrocchio). Confirm with a native Italian speaker before locking — small risk the rendering reads wrong to English speakers (e.g., `ver-ROK-kee-oh` might be clearer).
- ⏳ Returning-user re-onboarding: if we ship a major UI redesign post-v1, do we re-run onboarding for existing users? Recommend: no automatic re-run; surface a "What's new" card instead. Decide each major release.

---

## 10. Estimated effort

- `data.onboarding` state model + `hydrateCloudDoc` seeding: **0.5 day**
- Genesis modal (with placeholder fallback): **1.5 days** (motion + audio + a11y + skip)
- Welcome modal extension (second CTA): **0.5 day**
- Social-concept card + handle claim integration: **1.5 days** (depends on whether [SOCIAL_LAYER_V1.md §2.1](SOCIAL_LAYER_V1.md#21-usernamesusername--uniqueness-index) usernames are deployed first)
- Switcher import card (paste + suggested-set + preview + cap routing): **2 days**
- Focused goal-setting refinements to existing tour (cap copy, non-negotiable step, when/where fields, SMART copy): **1.5 days**
- Completion bridge → trial start: **0.5 day**
- Test plan execution (manual + Playwright for paste-import flow + screenshot regression on three new surfaces): **2 days**

**v1 onboarding total: ~10 days active work.**

Asset-side tasks (animation + lyre/harp audio + final iOS launch screen polish) run in parallel — they're not on the critical path because the placeholder is acceptable for launch. Lock asset delivery for the v1.x patch release ~2 weeks after public launch.

Per [TODO.md §3.5](TODO.md#35-focused-goal-setting-onboarding-apply-behavioral-science): the onboarding funnel is the single highest-leverage UX surface for long-term retention. The 10 days here probably pays back more retention per engineering-day than any other v1 surface. Prioritize accordingly.
