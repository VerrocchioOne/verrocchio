# OSS-Port Execution Outcomes — Actual vs Projected

**Date:** 2026-05-16 (session began 2026-05-15)
**Branch:** `feat/oss-port-tdd-rebuild`
**Reference projection:** `SYNTHESIS.md`

This document records what actually happened during Phase 2 execution, with honest comparison against the SYNTHESIS.md projections. Some ports landed exactly as projected; some pivoted; some flipped to KEEP after honest attempts that would have grown the code.

## Per-port outcomes

| Port | Library | Commit(s) | Projected Δ | Actual Δ | Outcome |
|---|---|---|---|---|---|
| #1 | simple-statistics | — | −50 LOC | **0** | **KEEP**. Implementer attempted refactor; ~50 of 100 lines in `findCorrelations` are documentation, ~30 are domain-specific Set iteration that simple-statistics doesn't help with, ~10 are trivial Set-intersection math. Library is array-oriented; converting to bitmaps would grow code. Reverted cleanly. |
| #3 | superstruct | `a2cf799` | −190 LOC | **−238 LOC on index.html** | **EXTRACTION ONLY**. Superstruct rewrite attempted but ~22 of ~40 hydration concerns (cross-field defaults, multi-step migrations, falsy filters, slot-key migrations) don't compose with `defaulted()`. Rewrite grew code by ~27 lines; reverted. Extraction-to-`lib/hydration.js` + 36 pinned-behavior tests SHIPPED — the bigger win. |
| #14 | jose | `21ead1b`, `bbba095` | −45 LOC | **−30 LOC on `ai-proxy/worker.js`** | **SHIPPED**. Hand-rolled JWT verifier replaced with `jose.jwtVerify` + `createRemoteJWKSet`. 7 security tests added (rejects wrong-audience, expired, wrong-issuer, malformed, wrong-key signature, alg:none, accepts valid). All 3 critical pins (algorithm/audience/issuer) explicit. |
| #5 | workbox-sw | `82e77ba`, `acdde7e` | −102 LOC | **−74 LOC on `service-worker.js`** | **SHIPPED + follow-up**. Initial port APPROVED after two HIGH-issue fixes: (1) extracted `SHELL_VERSION` constant as single point of truth, (2) added custom activate handler to purge legacy `verrocchio-shell-vNN` caches (Workbox's `cleanupOutdatedCaches()` only sweeps its own metadata, not hand-rolled caches). New `sw-migration.spec.js` E2E test proves legacy cache purge works. |
| #6 + #9 | a11y-dialog | `67fe575`, `562176a` | −950 LOC | **+278 net** (pilot +230, batch 1 +48) | **PARTIAL / PAUSED**. Projection assumed each modal had 60-100 LOC of hand-rolled focus-trap/keydown logic to delete. Reality: confirmation modals have only ~10 LOC of overlay/backdrop-click, saving only ~2 LOC per migration. Heavy modals (debriefStep, voiceCapture, reorderCtx) likely DO match the projection. Paused after 4 modals (completeGoalModal + 3 confirmations) migrated. **Real wins delivered:** library-quality focus-trap + role/aria-modal/aria-labelledby on every migrated modal (most previously had none). |
| #11 | vanilla-calendar-pro | — | −70 LOC | TBD | Not yet attempted. |
| #7 | emoji-picker-element | — | −110 LOC | **DROPPED** | **DROPPED — no port target**. Pilot Port #6+#9 discovered `showIconPicker` is dead state in `index.html:6972`: declared but no `createElement` block consumes it. No modal currently renders an icon picker. To execute this port we'd have to BUILD the missing feature, which is outside the rebuild's scope. Cleanup todo: remove the dead `useState` declaration. |
| #4 | ical.js via esm.sh | `f23013c` | −200 LOC | **−135 LOC on index.html** | **SHIPPED**. Gross deletions 164, additions 29. 24 new pinned-behavior tests cover every RRULE branch, PRIORITY mapping, VALARM, DESCRIPTION format, CATEGORIES, DTSTART/DTEND with TZID, CRLF wire format. ical.js v2 ESM via esm.sh works cleanly; `window.ICAL` lookup is lazy so export still works during ESM bootstrap. |
| #2 | custom `lib/auth.js` | `d07f046` | −180 LOC | **−59 LOC on index.html + 31 tests** | **EXTRACTION (same pattern as Port #3)**. Honest analysis: SYNTHESIS projected 300+ LOC out, but realistic inspection found only ~80 lines of auth code extractable as pure/semi-pure helpers — `doAuth`, `doForgotPassword`, `signInAsDemoUser`, `doChangeEmail`, `doChangePassword`, `doDeleteAccount`, `onAuthStateChanged` callback, and `reauthenticate` all have 3+ React `setState` calls woven in, so extracting them would grow the code. Six helpers shipped: `mapAuthErrorToMessage`, `stripFirebasePrefix`, `isDemoPersonaEmail`, `isInvalidCredentialError` (pure), `flushPendingWritesAndSignOut`, `deleteAccountData` (semi-pure via DI). 31 pinned-behavior tests on previously-untested auth boilerplate. |
| #10 | toastify-js | — | −65 LOC | **0** | **KEEP**. Honest analysis: `undoToast` has custom interactive Undo button (toastify-js doesn't cleanly support interactive children inside React render); `xpToast` has three styled children with per-call gradient — net-zero replication; `swipeFeedback` is center-of-viewport overlay (no center gravity in toastify). Project dark-mode uses inline-`rgb()` substring matching that doesn't apply to class-based library styles. Net result of migration: **+18 LOC and +8.3 KB transferred** for zero functional gain. Reverted before commit. |
| #8 | (long-press) | — | KEEP | KEEP | As projected — no qualifying library. |
| #12 | (sparkline) | — | KEEP | KEEP | As projected — hand-rolled is smaller than glue. |
| #13 | (year heatmap) | — | KEEP | KEEP | As projected — cal-heatmap brings 200KB of d3+popper transitively. |

## Cumulative production code delta (so far)

- `ai-proxy/worker.js`: **−30** (Port #14)
- `service-worker.js`: **−74** (Port #5)
- `index.html`: **−238 (#3) + 278 (#6+#9 partial) − 135 (#4) − 59 (#2)** = **−154 net**
- **Total production reduction: −258 LOC**

This includes the +278 from the dialog port's infrastructure investment; that figure will invert as heavier modals migrate.

## Test coverage delta (so far)

Tests on previously-untested production code paths:

- `tests/hydration.test.mjs` — **36 tests** (Port #3)
- `ai-proxy/tests/jwt.test.mjs` — **7 tests** (Port #14)
- `tests/e2e/offline.spec.js` — **1 test** (Port #5)
- `tests/e2e/sw-migration.spec.js` — **1 test** (Port #5 follow-up)
- `tests/e2e/dialog.spec.js` — **2 tests** (Port #6+#9 pilot, fixture-based)
- `tests/e2e/dialog-real-app.spec.js` — **3 tests** (Port #6+#9 batch 1, real app)
- `tests/icalendar.test.mjs` — **24 tests** (Port #4)
- `tests/auth.test.mjs` — **31 tests** (Port #2)

**Total: 105 new tests** on production code that previously had zero test coverage.

## Discipline outcomes

- **TDD enforced** on every port — each implementer wrote failing tests before implementation. Two ports (#1, #3-superstruct-rewrite) honestly reported "this refactor would grow code" and reverted to KEEP rather than ship a worse version.
- **Systematic debugging** used to root-cause the Port #5 HIGH issues during code review (cache version DRY + legacy cache purge); both fixes verified by new tests going red → green.
- **Two-stage review** (spec compliance + code quality) ran after every implementer except the mechanical Port #6+#9 batch 1 (3 modals × ~2 LOC each, verified inline).

## What's left

**Active ports remaining:**
- Port #11 vanilla-calendar-pro — projected ~−70 LOC (highest risk; based on UI-primitive pattern may flip to KEEP)
- Port #6+#9 scale-out — remaining 11+ heavier modal candidates (debriefStep, voiceCapture, reorderCtx — these likely DO have complex hand-rolled focus logic to delete)

**Cleanup todos:**
- Remove dead `showIconPicker` state (`index.html:6972`)
- Mutation in `hydrateCloudDoc` (pre-existing tech debt, per CLAUDE.md immutability rule)
- Consider `A11yDialogCentered` variant for centered confirmation modals (~3 LOC savings per migration)

## Strategic pattern (after 9 attempted ports)

A clear pattern has emerged from the execution data. Ports fall into four categories:

**Big wins — replacement of complex/standardized work:**
- Port #14 jose — JWT verification is a standardized spec that handles many edge cases. Library worth its weight.
- Port #5 Workbox — service worker caching has well-understood strategy patterns. Library is exactly the right abstraction.
- Port #4 ical.js — iCalendar RFC 5545 is a standard with many RRULE edge cases. Library worth its weight.

**Big wins — extraction without library swap:**
- Port #3 hydration — moving 240 lines out of `index.html` into a testable `lib/` module + 36 pinned-behavior tests was the win. The library (`superstruct`) didn't fit the imperative multi-step migration semantics, but the EXTRACTION delivered the value alone.

**Net-neutral or worse — UI primitive ports:**
- Port #1 simple-statistics — array-oriented library, but the code is Set-oriented domain logic.
- Port #10 toastify-js — library doesn't support custom interactive children inside React render.
- Port #6+#9 a11y-dialog confirmation modals — saved ~2 LOC per migration (not the projected 60-100); only heavier modals will pay back the infrastructure investment.

**Targets that turned out to be vapor:**
- Port #7 emoji picker — `showIconPicker` state hook exists but no modal renders it. Nothing to replace.

**Generalization:** The rebuild's biggest wins came from (a) replacing standardized spec implementations with battle-tested libraries (JWT, iCal, SW caching), and (b) extracting inline modules into testable `lib/` files. The smallest wins came from trying to replace small, idiomatic React-createElement UI surfaces with libraries — those surfaces are already at minimum complexity for the project's strict no-build/no-JSX style.

## Honest takeaways

1. **Projections were optimistic on every UI-primitive port.** The −950 LOC for #6+#9 and −65 LOC for #10 both assumed structural complexity in hand-rolled UI that didn't actually exist. Real numbers: #6+#9 confirmations save ~2 LOC each; #10 would have ADDED 18 LOC.
2. **Three ports flipped to KEEP after honest attempts.** The discipline is working — implementers refuse to ship code that's worse than what they replace.
3. **The extraction pattern is the underused win.** Port #3 extracted hydration into `lib/hydration.js` and added 36 tests on previously-untested code. Port #2 (auth wrapper extraction, ~−180 LOC projected) is likely to follow the same pattern.
4. **Test coverage delta is the underrated win.** 74 new tests on previously-untested production code is real bug-prevention infrastructure. The auth boundary and hydration logic in particular now have rigorous coverage they lacked.
5. **Remaining work prioritization:** Port #2 (auth extraction) is highest-confidence remaining. Port #11 (calendar grid) is the highest-risk — based on the UI-primitive pattern, may flip to KEEP. Port #6+#9 scale-out to heavier modals (debriefStep, voiceCapture, reorderCtx) should deliver the projected savings.
