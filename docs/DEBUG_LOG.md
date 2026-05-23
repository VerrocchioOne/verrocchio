# Systematic Debug Log

Append one entry per investigation. Newest first. Every bug fix in the codebase MUST have an entry here. No entry → no commit.

## Entry template

### YYYY-MM-DD — <one-line bug summary>

- **Phase 1 — Root cause:** what error, where reproduced, what changed recently, evidence gathered
- **Phase 2 — Pattern:** the working example I compared against, the differences
- **Phase 3 — Hypothesis:** "I think X is the cause because Y." Confirmed/refuted by minimal test.
- **Phase 4 — Fix:** test name in `tests/...` that captures the regression. Single change. Commit SHA.

---

### 2026-05-23 — §13.4a (v75) view-level decomposition (Brief/Goals/Todos/Reflect/Calendar); Habits view DEFERRED

- **Phase 1 — Root cause:** Not a bug — a refactor for subagent parallelism. App() in index.html had grown to ~30k lines with all top-level tabs' render trees + helpers inline, making future feature work (especially iOS Chain C: Widgets / Siri / HealthKit) require loading the full file for any view edit.
- **Phase 2 — Pattern:** Existing `lib/auth.js`, `lib/merge.js`, `lib/hydration.js`, `lib/icalendar.js` extractions established the dual-load convention (`window.X` global + CJS `module.exports.X`). This extension adds `lib/domains/` (pure READ derivations + curried writes) and `lib/views/` (React components with a FROZEN prop signature `{ data, dispatch, deviceProfile, callbacks }`).
- **Phase 3 — Hypothesis:** "If we extract READ derivations as pure functions and keep WRITE-side helpers in App() as callbacks, six parallel subagents can decompose all 6 views without destabilizing the recently-shipped v72-v74 reorder logic." **Confirmed for 5 of 6 views.** HabitsView came back PARTIAL — its ~40 App-scope useState hooks + the load-bearing reorder UX could not be moved in one shot. Acceptable degraded outcome per spec §10: keep Habits tab rendering inline, ship the other 5 view modules + all 6 domain modules + the pattern doc.
- **Phase 4 — Fix:** 12 new lib/ files (6 domains + 6 views) + 6 new test files (`tests/domains/*.test.mjs`, 121 new pinned-behavior tests; 259/259 total now pass). Pattern at [`docs/superpowers/patterns/view-extraction.md`](superpowers/patterns/view-extraction.md). Spec at [`docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md`](superpowers/specs/2026-05-23-view-extraction-all-six-design.md). Plan at [`docs/superpowers/plans/2026-05-23-view-extraction-all-six.md`](superpowers/plans/2026-05-23-view-extraction-all-six.md). Snapshot at `archive/index.v75.html`. Two follow-up bugs during integration:
  - **Top-level `_dk` / `_todayKey` collision** across `lib/domains/brief.js` + `lib/domains/calendar.js` (classic browser scripts share top-level lexical scope; `let/const` dups → SyntaxError on the 2nd load). Fix: wrapped both files' bodies in IIFEs; renamed brief.js's helper to `_briefDk`. Commit `ccd42eb`.
  - **CalendarView initial state isolated from App's `openCalendarMonthForTest` hook** (which set App-scope `setCalendarView`/`setCalendarFocus` then opened modal — view owned its own local state and ignored those). Fix: added optional `callbacks.initialView` + `callbacks.initialFocus` props; view useState reads them as initial values. Commit `ccd42eb`.

SHELL_VERSION v75. Integration commits: `9f9c585` (Phase A), `0d36f10` (Phase B harvest), `2280a02` (Calendar), `1dbbc1a` (Todos), `2dc500e` (Reflect), `2cd4536` (Goals), `61f4bd2` (Brief), `2414de1` (SW+build), `ccd42eb` (Phase D fixes).

---

### 2026-05-18 — icalendar.test.mjs fails with MODULE_NOT_FOUND (ical.js not installed)

- **Phase 1 — Root cause:** `node --test tests/icalendar.test.mjs` crashes immediately at line 15 (`const ICAL = require("ical.js")`) with `MODULE_NOT_FOUND`. No `node_modules/` directory exists in the repo — `npm install` had never been run in this cloud container. `ical.js@^2.2.1` is correctly listed in `devDependencies`.
- **Phase 2 — Pattern:** `auth.test.mjs`, `hydration.test.mjs`, `utils.test.mjs` all pass because they only `require("../lib/*.js")` (relative local files) or Node built-ins. `icalendar.test.mjs` is the only test that also `require`s an external npm package, so it's uniquely broken in a bare environment.
- **Phase 3 — Hypothesis:** "I think running `npm install --include=dev` will fix this because `ical.js` is in devDependencies but node_modules doesn't exist." Confirmed — install succeeded, all 24 `icalendar.test.mjs` tests go green.
- **Phase 4 — Fix:** No code change needed. `npm install` restores the missing package. Existing test suite in `tests/icalendar.test.mjs` (24 tests) is the regression guard. No commit; the fix is environment setup.

---

### 2026-05-18 — mergeRemoteWithLocalToday slot loss: §audit-P1 fix confirmed but no regression test

- **Phase 1 — Root cause:** Audit (2026-05-15) flagged that `slotCompletions[todayK]` was being whole-map replaced instead of per-key merged, causing cross-device slot updates to be silently dropped (e.g. local device marks `morning:0 done`, cloud has `evening:0 done` from another device → merged result = `{morning:0: done}`, cloud's `evening:0` lost). Fix was applied to `index.html` with `§audit-P1` comment (per-key merge for `slotCompletions` and `slotCompletionTimes`), but no regression test was ever written — the function was untestable because it lived only in `index.html` Script scope.
- **Phase 2 — Pattern:** Other extracted lib functions (`lib/auth.js`, `lib/hydration.js`, `lib/icalendar.js`) follow a dual-load pattern (browser `<script>` + CJS export) and all have pinned-behaviour test suites in `tests/`. `mergeRemoteWithLocalToday` was the only significant pure function still inline.
- **Phase 3 — Hypothesis:** "I think extracting `mergeRemoteWithLocalToday` to `lib/merge.js` following the established dual-load pattern will allow writing regression tests that would have been RED under the old whole-map replace and are GREEN with the per-key merge fix." Confirmed — 14 tests written, all green; the key cross-device slot case (`slotCompletions today keys from cloud and local are both preserved`) directly pins the regression.
- **Phase 4 — Fix:** `lib/merge.js` (extraction, CJS export), `tests/merge.test.mjs` (14 regression tests covering slot merge, primitive overlay, dayVisits union, dailyRitual overlay, immutability), `index.html` (inline function replaced with stub comment + `<script src>` tag), `service-worker.js` (lib/merge.js added to precache list). Commit: `48b156e`.

---

### 2026-05-18 — allYesterdayHabitsReviewed gate: §audit-P1 fixes confirmed, regression test blocked by App() coupling

- **Phase 1 — Root cause:** Audit (2026-05-15) flagged two `allYesterdayHabitsReviewed` gate bugs: (1) child habits (`parentId != null`) were included in `dueYesterday`, potentially keeping the gate closed even when the parent habit was reviewed; (2) habits created today (`startDate >= today`) were checked against yesterday's empty completions, keeping the gate permanently closed. Both fixed in `index.html:10528-10538` with `§audit-P1` comments.
- **Phase 2 — Pattern:** `mergeRemoteWithLocalToday` was extractable (pure function, no closure deps) and now has tests. `allYesterdayHabitsReviewed` depends on two App() closure variables: `isFutureHabit` (uses `_todayKForFuture` React state) and `slotIdForIndex` (App-level helper). These closure dependencies block Node-side extraction without substantial App() refactoring.
- **Phase 3 — Hypothesis:** "I think the fixes are correct because the guard conditions (`h.parentId != null` → return false; `h.startDate > yKey` → return false) are simple pure checks that don't affect the rest of the function logic." Confirmed by code review — both guards are boolean short-circuits before the `isHabitDueOn` call, which itself is Script-scope and correct.
- **Phase 4 — Fix:** No new code. Triaged — fix already applied (`§audit-P1` comments), regression test requires extracting `isHabitDueOn` + `slotIdForIndex` from App() scope (future OSS-port work). Track under Port #13 candidate.

---

### 2026-05-18 — Same-section multi-slot reordering is a no-op (§5.2 active bug)

- **Phase 1 — Root cause:** When a user drags a multi-slot habit card to a different position within the SAME section (e.g. reordering two morning study slots), SortableJS moves the DOM element visually but the data never updates. On next React re-render the card snaps back to its original position. Code path: SortableJS `onEnd` → detects `targetSection === originalSection` → returns early (line 9228: `if (oldSlots[slotArrayIdx] === newSection) return; // no-op`). The SortableJS handler also skips `commitSlotReorderDrop` entirely for same-section drops (only calls it when `targetSection !== originalSection`).
- **Phase 2 — Pattern:** Cross-section slot drags work correctly — `commitSlotReorderDrop(habitId, arrayIdx, newSection)` rekeyes `slotCompletions` and `slotCompletionTimes` when the slot moves between sections. Single-slot habit reordering (via `commitHabitReorderDrop`) works correctly for both same-section and cross-section. The gap is specifically same-section multi-slot ordering.
- **Phase 3 — Hypothesis:** "I think same-section slot reordering requires: (a) extending `commitSlotReorderDrop` to accept a target array index and swap `slotSections` element positions, and (b) updating the SortableJS `onEnd` handler to pass `evt.newIndex` and call the function even on same-section drops." The hypothesis is plausible but unconfirmed — implementing the array swap + rekeying is non-trivial (needs care around `morning:0`/`morning:1` ID reassignment when two slots within the same section swap positions).
- **Phase 4 — Fix:** TRIAGED. 3+ step fix touching `commitSlotReorderDrop`, `onEnd` handler, and needing new tests. Requires `superpowers:writing-plans` before implementation. Escalated as open bug in USER_REQUESTS.md summary.

---

### 2026-05-18 — §7.1 Reflect tab "past entries not surfaced" — already fixed 2026-05-15

- **Phase 1 — Root cause:** TODO §7.1 listed "previously written entries not surfaced" as a bug. Code audit found the fix was applied 2026-05-15: "Past Entries · N total" header added at `index.html:19303`, filter-aware empty state added ("No entries today. Tap 'All' to see your full history (N).").
- **Phase 2 — Pattern:** TODO had a `> 🟢 Addressed 2026-05-15` annotation but was not separately marked SHIPPED in USER_REQUESTS.md.
- **Phase 3 — Hypothesis:** "I think this is already fixed." Confirmed — `grep "Past Entries" index.html` → hit at line 19303.
- **Phase 4 — Fix:** No code change. TODO annotation is accurate. No commit needed.
