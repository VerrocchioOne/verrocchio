# Systematic Debug Log

Append one entry per investigation. Newest first. Every bug fix in the codebase MUST have an entry here. No entry → no commit.

## Entry template

### YYYY-MM-DD — <one-line bug summary>

- **Phase 1 — Root cause:** what error, where reproduced, what changed recently, evidence gathered
- **Phase 2 — Pattern:** the working example I compared against, the differences
- **Phase 3 — Hypothesis:** "I think X is the cause because Y." Confirmed/refuted by minimal test.
- **Phase 4 — Fix:** test name in `tests/...` that captures the regression. Single change. Commit SHA.

---

### 2026-05-23 — §13.4b (v76) HabitsView full extraction — closes the v75 PARTIAL gap

- **Phase 1 — Root cause:** Not a bug — completion of the v75 §13.4a work. Habits was deferred from §13.4a because tree-for-tree extraction of the ~2900-line inline render would have required moving ~40 App-scope useState hooks AND the v72-v74 select-then-act reorder UX in one shot. v76 closes the gap by adopting a different strategy: leave App owning the state, copy the body verbatim, and re-bind via a destructuring prelude.
- **Phase 2 — Pattern:** The Phase B view extractions (BriefView/GoalsView/etc.) succeeded because they had clean READ derivations that could be hoisted to `lib/domains/*.js`. Habits' v72-v74 reorder system is deeply intertwined with App-scope refs and state — pure-function extraction is a much bigger refactor. The new pattern: keep App as the state owner, pass everything via a single fat `callbacks` bag with a nested `helpers` sub-bag.
- **Phase 3 — Hypothesis:** "Verbatim body copy + re-bind prelude preserves render output bit-identically AND keeps v72-v74 reorder behavior intact." **Confirmed.** 259/259 unit + 19/19 desktop E2E green, including the 4 `habit-reorder-layered-drop` specs that pin the v72-v74 semantics.
- **Phase 4 — Fix:** `lib/views/HabitsView.js` 270 → 3,104 lines. `index.html` Habits-tab call site replaced inline IIFE with `React.createElement(window.HabitsView, ...)` + comprehensive callbacks bag. SHELL_VERSION v75 → v76. `archive/index.v76.html` snapshot. Background subagent `ad391f89b8641eaa4` did the extraction during the prior session but hit the user's account session limit before verifying / committing; this session picked up the uncommitted work, ran verification, bumped, snapshotted, and shipped. WIP commit `055fa9b`; final ship commit lands this entry. **NOTE:** The 3,104-line HabitsView.js violates the new 2026-05-23 1000-line file-size rule (see §13.5). A follow-up split into HabitCard / HabitRow / ReorderToolbar / NewHabitForm / FilterPills sub-modules is queued.

---

### 2026-05-23 — §13.5 1000-line file-size rule

- **Phase 1 — Root cause:** Not a bug — user-imposed architectural rule. Verbatim: "Make a master rule for this app: no individual file should exceed 1000 lines of code and every file should aim to be under 500 lines."
- **Phase 2 — Pattern:** None yet. The rule is the pattern.
- **Phase 3 — Hypothesis:** "Hard cap 1000 LOC + soft target 500 LOC forces meaningful decomposition AND keeps any single file holdable in a subagent's context window without truncation. The cap is a forcing function for the same architectural goal the view-extraction work was pursuing."
- **Phase 4 — Fix:** Added to `CLAUDE.md` (project guidance) and to project memory (`feedback_file_size_cap.md`). Current violations to address in follow-up plans:
  - `index.html` ~30,000 LOC (massive; split by extracting App() sub-systems)
  - `lib/views/HabitsView.js` 3,104 LOC (v76 extraction; split into HabitCard/HabitRow/ReorderToolbar/NewHabitForm/FilterPills)
  - `lib/views/BriefView.js` 1,072 LOC
  - `lib/views/GoalsView.js` 955 LOC (over the 500 soft target; under the 1000 hard cap, but worth splitting)
  - `lib/views/CalendarView.js` 772 LOC (same as GoalsView)
  - `lib/views/TodosView.js` 521 LOC (just over the 500 soft target)
  Each gets its own decomposition plan in a follow-up session.

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

### 2026-05-25 — habitsDueOnDay startDate gate matches §audit-P1 semantics — confirmed correct

- **Phase 1 — Root cause:** Review item: does `habitsDueOnDay` in `lib/domains/calendar.js` respect the same startDate cutoff that `allYesterdayHabitsReviewed` had fixed in §audit-P1? If it didn't, newly created habits could appear in the calendar timeline before their start date.
- **Phase 2 — Pattern:** The §audit-P1 fix for `allYesterdayHabitsReviewed` (2026-05-18) used `h.startDate > yKey` to exclude habits not yet active on the queried date. Calendar's `habitsDueOnDay` uses an equivalent lexicographic check at line 151: `if (h.startDate && dateKey < h.startDate) return false;`. Both are YYYY-MM-DD string comparisons, which are lexicographically equivalent to date arithmetic.
- **Phase 3 — Hypothesis:** "I think the check is correct." Confirmed — `"2026-05-25" < "2026-06-01"` evaluates true in JS string comparison, matching the expected behavior.
- **Phase 4 — Fix:** No code change. Implementation at `lib/domains/calendar.js:151` is correct. Verified by the existing `tests/domains/calendar.test.mjs` suite (all green).

---

### 2026-05-25 — Weekly Review hour gate in BriefView — confirmed fixed since 2026-05-13

- **Phase 1 — Root cause:** Review item from TODO: weekly review prompt was showing at wrong times (before the user-configured start hour). The gate at `lib/views/BriefView.js:897-898` was suspected of not enforcing the hour check.
- **Phase 2 — Pattern:** The fix note in the codebase says "Weekly Review hour gate fixed 2026-05-13". Code at `BriefView.js:897-898` reads:
  ```js
  if (now.getDay() !== wr.day) return null;
  if (now.getHours() < (wr.hour == null ? 0 : wr.hour)) return null;
  ```
  The second check correctly defaults to 0 (midnight) when `wr.hour` is null, blocking the prompt until the configured hour on the correct day of week.
- **Phase 3 — Hypothesis:** "I think this is already fixed." Confirmed — both day AND hour gates are in place. No regression since 2026-05-13.
- **Phase 4 — Fix:** No code change. Implementation confirmed correct. TODO annotation is accurate.

---

### 2026-05-25 — §5.2 same-section multi-slot reorder — prior SortableJS entry is stale (SortableJS removed v71)

- **Phase 1 — Root cause:** The 2026-05-18 debug entry for §5.2 was written against the SortableJS implementation (v57). Code audit this session found a comment at `index.html:43` confirming SortableJS was removed in v71 (the v72-v74 rewrite introduced button-based ▲/▼/⇶ reorder via `moveRowWithinSection` / `gatherSectionRowsSorted` / `slotOrders`). The SortableJS `onEnd` early-return bug (`if (oldSlots[slotArrayIdx] === newSection) return`) no longer exists.
- **Phase 2 — Pattern:** Current same-section slot ordering uses `h.slotOrders[i]` (per-slot integer) read by `sectionRowsForRender` in `lib/domains/habits.js:162`. `moveRowWithinSection` updates `slotOrders` for the specific slot being moved. Button-based UI avoids the DOM-snap-back issue that plagued SortableJS — clicking ▲/▼ triggers an immediate data write + React re-render, no pointer capture needed.
- **Phase 3 — Hypothesis:** "I think the §5.2 bug no longer exists under the v72-v74 implementation." Plausible — the code path is structurally different. Not confirmed with a live device test (no browser available in this environment), but the SortableJS-specific failure mode (early return, no data write) is eliminated by design.
- **Phase 4 — Fix:** No code change. Prior §5.2 triage entry is superseded by v71/v72/v74 work. Updated TODO accordingly in this session's USER_REQUESTS.md summary.

---

### 2026-05-25 — getFreq/isHabitDueOn duplication: extracted to lib/constants.js, 20 regression tests added

- **Phase 1 — Root cause:** `getFreq` and `isHabitDueOn` were defined three times: inline in `index.html` (~L1640-L1713), in `lib/domains/calendar.js` (`_getFreq` / `_isHabitDueOn` inside the IIFE), and in `lib/domains/habits.js` (`_getFreq` / `isDueOn`). The canonical versions were the inline ones, but they lived inside a non-exported `<script>` block — untestable from Node. The `lib/constants.js` file (where `FREQ` lives) had no exported version, so test files had no access to the authoritative implementation.
- **Phase 2 — Pattern:** `lib/merge.js` established the pattern for extracting a pure function from `index.html` scope to a dual-load file (browser script-scope global + `module.exports`). `lib/constants.js` already exports `IMP`, `HT`, `SECTIONS`, `DURS`, `FREQ`, and the form style objects. Adding `getFreq` + `isHabitDueOn` there (after the `FREQ` array, their natural home) keeps them co-located with the data they interpret and makes them testable.
- **Phase 3 — Hypothesis:** "I think adding getFreq + isHabitDueOn to lib/constants.js with matching exports, removing the inline definitions from index.html (leaving tombstone comments), and writing 20 regression tests that cover all 6 cadences + the §audit-P1 gate guards will (a) eliminate the duplication risk, (b) give the canonical implementation a regression harness, and (c) verify the §audit-P1 fixes that were previously triaged as 'confirmed by code review but untested'." **Confirmed** — 20/20 tests green, including all 6 §audit-P1 gate scenarios.
- **Phase 4 — Fix:** `lib/constants.js` (added `getFreq` + `isHabitDueOn` + updated `module.exports`). `index.html` (replaced ~20 lines of inline definitions with 2-line tombstone comments; script-scope availability preserved because `lib/constants.js` loads before the inline `<script>`). `tests/constants.test.mjs` (new file, 20 tests). Stale "Mirrors index.html" comments in `lib/domains/habits.js` (3 lines) and `lib/domains/calendar.js` (2 lines) updated to "Mirrors lib/constants.js". **Commit: `8f4cf6a`**.

---

### 2026-05-25 — icalendar MODULE_NOT_FOUND (recurring) — permanent session-start hook blocked

- **Phase 1 — Root cause:** Same as 2026-05-18: `node --test tests/icalendar.test.mjs` fails immediately with `MODULE_NOT_FOUND` for `ical.js`. Cloud container starts fresh with empty `node_modules/`; the `session-start.sh` hook that would run `npm install` automatically was never created (the 2026-05-18 investigation recommended it but the hook creation was blocked by the auto-mode classifier, which flagged `.claude/hooks/` writes as a Self-Modification path outside the scoped debug request).
- **Phase 2 — Pattern:** The `/session-start-hook` skill exists to install this hook permanently. The blocker was authorization scope, not technical difficulty.
- **Phase 3 — Hypothesis:** "I think the user needs to explicitly invoke `/session-start-hook` once to install the `npm install` hook so every future cloud session starts with devDependencies present." Workaround for this session: `npm install` (confirmed — all 24 icalendar tests green afterward).
- **Phase 4 — Fix:** No code change this session. `npm install` as one-shot workaround. Permanent fix: user invokes `/session-start-hook` skill in a dedicated session. Recommend to user in this session's summary.

---

### 2026-05-18 — §7.1 Reflect tab "past entries not surfaced" — already fixed 2026-05-15

- **Phase 1 — Root cause:** TODO §7.1 listed "previously written entries not surfaced" as a bug. Code audit found the fix was applied 2026-05-15: "Past Entries · N total" header added at `index.html:19303`, filter-aware empty state added ("No entries today. Tap 'All' to see your full history (N).").
- **Phase 2 — Pattern:** TODO had a `> 🟢 Addressed 2026-05-15` annotation but was not separately marked SHIPPED in USER_REQUESTS.md.
- **Phase 3 — Hypothesis:** "I think this is already fixed." Confirmed — `grep "Past Entries" index.html` → hit at line 19303.
- **Phase 4 — Fix:** No code change. TODO annotation is accurate. No commit needed.
