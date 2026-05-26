# Onboarding Path B dedupe — design

**Date:** 2026-05-26
**Status:** APPROVED (Option B selected during brainstorming)
**Scope:** Single-region `index.html` dead-code deletion + 1 callsite redirect + 1 smoke test
**Risk class:** Low (routes through an already-shipped, already-exercised module)

---

## Background

`HANDOFF_session-wrap-v77-to-v79_2026-05-26T0230.md` flagged the onboarding sub-tree (~320 LOC at `index.html` L7442-7761) as the next-session's highest-LOC extraction candidate. The handoff cited the v76 HabitsView crash (4 missing closures shipped silently for a session) as the reason to spend brainstorming time enumerating the closure surface before extracting.

The brainstorming pass surfaced a more valuable discovery: **Path B is not an un-extracted candidate — it's a byte-for-byte duplicate of `lib/views/Onboarding.js` that was created in Wave 4.5.2 but whose original inline copy was never deleted**.

## The two paths today

`index.html` has two render-paths for the same pre-app onboarding content:

| Path | Entry condition | Implementation |
|---|---|---|
| A | `!hasSeenWelcome` | `React.createElement(window.Onboarding, {...})` at L7426 |
| B | `hasSeenWelcome && !data.onboardingComplete` | Inline 320-LOC duplicate at L7442-7761 |

`hasSeenWelcome` is a per-device localStorage flag; `data.onboardingComplete` is a per-account Firestore flag. Path B fires for: returning users on the same device who bailed mid-onboarding, fresh accounts on a device that's seen welcome before, and similar cross-device edge cases.

The content rendered is identical: 3-step carousel (walkthrough / balanced-life / intent capture), the `finishOnboarding` save shape (`userIntent`, `dailyRitual` intention backfill, `timeRanges`, `onboardingComplete: true`), the same SVG illustration factories, the same nav buttons.

## The change

Replace the inline Path B block with a second `React.createElement(window.Onboarding, {...})` callsite mirroring Path A. `finishOnboarding` stays at the callsite (App() lexical scope) so the closure surface is unchanged from today — `data`, `tk`, `save`, `DEFAULT_TIME_RANGES` are already in scope at the App() function.

```
// Before (L7442-7761): 320-LOC inline duplicate
if (!data.onboardingComplete) {
  const finishOnboarding = () => { /* save logic */ };
  const onbStopSwipe = { ... };
  const onbShell = (children) => /* full shell */;
  const navButtons = /* ... */;
  // ... 5 illustration factories ...
  // ... 3 steps of inline carousel/primer/intent ...
  return /* steps 0, 1, 2 inline */;
}

// After: ~15 LOC
if (!data.onboardingComplete) {
  const finishOnboarding = () => { /* same save logic */ };
  return React.createElement(window.Onboarding, {
    data, dispatch, deviceProfile: window.__deviceProfile,
    state: { onboardStep, walkSlide, onbIntent },
    callbacks: { setOnboardStep, setWalkSlide, setOnbIntent, onFinish: finishOnboarding }
  });
}
```

## Why this beats extracting Path B to a new module

| Concern | Option A (extract to new module) | Option B (dedupe via existing module) |
|---|---|---|
| LOC cut | ~320 | ~320 (same) |
| Closure-surface risk | 11 identifiers to thread cleanly | 0 new identifiers; uses already-vetted `window.Onboarding` signature |
| Drift risk | Two parallel components with same content, must keep in sync | Single source of truth |
| v76-HabitsView crash class | Re-introduced (new module, new closures) | Eliminated |
| Verification effort | Re-test both paths against the new module | Smoke test the new entry condition only |

## State invariant

`onbIntent`, `onboardStep`, `walkSlide` are top-level `useState` hooks in `App()` ([index.html:471](../../index.html#L471) and adjacent). Both Path A and Path B read/write the same hook slots, so user state survives a path swap mid-onboarding.

## What this does NOT change

- Persisted slot data, Firestore rules, localStorage keys: untouched
- `lib/views/Onboarding.js`: untouched (already does what we need)
- `lib/views/Splash.js`: untouched
- Path A's behavior: byte-identical (we only modify Path B)
- The `finishOnboarding` save shape: identical to today's Path B `finishOnboarding`

## Verification plan

1. **Unit tests**: `npm test:unit` should stay at 404/404. No new pure logic was added.
2. **New smoke test**: Add a fixture-based test that constructs `{ hasSeenWelcome: true, data.onboardingComplete: false }` state and asserts the render output matches a Path-A fixture render. Lives in `tests/e2e/` or as a unit-level test using `react-dom/server` if available.
3. **E2E**: `npm run test:e2e -- --project=desktop` should stay at 20/20.
4. **Browser verification (per CLAUDE.md gate)**:
   - Desktop screenshot at ≥1024px in Path B entry condition
   - iOS-width screenshot at ~390px in Path B entry condition
   - Both should be visually indistinguishable from Path A at the same widths.
5. **SHELL_VERSION**: bump v79 → v80 (visible-to-user code path changes; SW cache flush mandated by `feedback_archive_on_large_push` memory).
6. **Archive snapshot**: `archive/index.v80.html`.

## Out of scope

- Re-architecting how `hasSeenWelcome` interacts with `onboardingComplete` (the two-flag entry-condition split is preserved as-is).
- Touching `lib/views/Onboarding.js` itself (it works; leave it alone).
- The guided-tour sub-tree (`L7763+`) — separate handoff candidate, separate spec.
- Adding tests for `lib/views/Onboarding.js`'s internals (the smoke test only pins the Path-B entry condition).

## Self-review check

- No placeholders / TBDs
- Internal consistency: the "what this does NOT change" matches the verification plan's "what stays at 404/404"
- Scope: single PR-sized change, no decomposition needed
- Ambiguity: "what tests should this add" is concrete (1 smoke test, fixture-based, asserts render parity)
- Cites the v76 HabitsView crash explicitly and explains why Option B sidesteps it
