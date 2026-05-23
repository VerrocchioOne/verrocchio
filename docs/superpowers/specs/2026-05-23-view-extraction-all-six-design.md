# View Extraction — All 6 Views Today (Design Spec)

**Status:** Approved 2026-05-23. Source for `docs/superpowers/plans/2026-05-23-view-extraction-all-six.md`.

**Goal:** Decompose [index.html](../../../index.html)'s 6 top-level views (Brief, Habits, Goals, Todos, Reflect, Calendar) into per-view modules so future feature work — especially iOS Chain C (Widgets, Siri, HealthKit) — can be done by parallel subagents without each one needing the full 30k-line file in context.

**Constraint envelope** (from [`.claude/CLAUDE.md`](../../../.claude/CLAUDE.md), unchanged):
- No build step. No JSX. No TypeScript. No UI framework.
- React.createElement(...) calls only. Classic `<script>` loading.
- Dual-load pattern: `window.X` global for browser + `module.exports.X` for Node tests.
- Inline styles + `var(--c-*)` tokens. Dark-mode tokens unchanged.
- `dk(date)` for all date keys. Never `toISOString()` for day boundaries.
- Immutability — always spread, never mutate `data.habits[i].completions` in place.

---

## 1. Architecture

```
index.html
└── App() function (stays large, but ~30-40% slimmer after this plan)
    ├── data + save() + dispatch()   ← state ownership
    ├── auth + onboarding + splash   ← cross-cutting; not extracted
    ├── tab routing + modal state    ← stays; tab switch renders <XView />
    └── Heavy modals (EditHabit, debriefStep, ...)  ← stay inline, deferred
        │
        └── Per-view render call sites:
            React.createElement(window.BriefView,    briefProps)
            React.createElement(window.HabitsView,   habitsProps)
            React.createElement(window.GoalsView,    goalsProps)
            React.createElement(window.TodosView,    todosProps)
            React.createElement(window.ReflectView,  reflectProps)
            React.createElement(window.CalendarView, calendarProps)

lib/
├── domains/      ← pure-function modules; CJS + window dual-load
│   ├── brief.js
│   ├── habits.js     (READ-side only this plan: groupedBySection, dueToday, etc. WRITE-side stays inline.)
│   ├── goals.js
│   ├── todos.js
│   ├── reflect.js
│   └── calendar.js
└── views/        ← React components; window dual-load (no Node-side React tests)
    ├── BriefView.js
    ├── HabitsView.js
    ├── GoalsView.js
    ├── TodosView.js
    ├── ReflectView.js
    └── CalendarView.js

tests/
└── domains/
    ├── brief.test.mjs
    ├── habits.test.mjs   (read-side derivations only)
    ├── goals.test.mjs
    ├── todos.test.mjs
    ├── reflect.test.mjs
    └── calendar.test.mjs

docs/superpowers/patterns/
└── view-extraction.md   ← THE durable artifact. Future extractions reference this.
```

---

## 2. Three contracts

### 2.1 Domain function shape — curried, pure

Two function categories:

**Derivations** (READ): `name(data, ...args) → derivedValue`. No currying.
```js
// lib/domains/calendar.js
const monthGrid = (data, year, month) => {
  // ... compute 6×7 grid of { dateKey, isCurrentMonth, dots, ... }
  return cells;
};
```

**Mutations** (WRITE): `name(...args) → (data) => newData`. Curried so views can construct an action and hand it to `dispatch` without seeing `data`.
```js
// lib/domains/calendar.js
const markDayVisited = (dateKey) => (data) => ({
  ...data,
  dayVisits: data.dayVisits?.includes(dateKey)
    ? data.dayVisits
    : [...(data.dayVisits || []), dateKey],
});
```

Both export via the dual-load guard:
```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calendarDomain: { monthGrid, markDayVisited, /* ... */ } };
} else {
  window.calendarDomain = { monthGrid, markDayVisited, /* ... */ };
}
```

### 2.2 App's `dispatch` helper

Lives inline in App(). Single source of truth for state mutation by extracted views.

```js
// inside App() — added in Phase A
const dispatch = React.useCallback((transform) => {
  const cur = latestData.current || data;
  const next = typeof transform === "function" ? transform(cur) : transform;
  if (next && next !== cur) save(next);
}, [data, save]);
```

Views call `dispatch(calendarDomain.markDayVisited("2026-05-23"))`. The curried action is invoked once with current data, the result is saved.

`dispatch` is also tolerant of non-function arguments (`if next` short-circuit) so a domain function that returns data directly still works.

### 2.3 View prop signature — fixed contract

Every view receives EXACTLY this signature:

```js
function BriefView({
  data,            // the full data object (read-only from view's perspective)
  dispatch,        // App's dispatch helper
  deviceProfile,   // window.__deviceProfile snapshot at render
  callbacks,       // { onTogHabit, onCommitReorder, ... } — see §3 per-view list
}) { ... }
```

The `callbacks` bag is per-view (different views need different cross-domain actions). It's a flat object of functions. App owns the implementation; views just call them.

This signature is FROZEN — Phase B subagents adhere to it. Phase C integration verifies.

---

## 3. Per-view extraction map

For each view: (A) READ derivations to extract to domain module, (B) view-local UI state (`useState` stays inside the view), (C) cross-domain callbacks (stay in App, passed via `callbacks` prop).

### Brief (Home / Daily Ritual)

| Domain pure fns | View-local state | Callbacks |
|---|---|---|
| `briefDomain.tipsForToday(data, deviceProfile)` — derives the tips list shown on Home | step-walkthrough open/close, tip-dismissal anim flags | `onTogHabit`, `onLogJournalQuick`, `onAddTodoQuick`, `onOpenSettings` |
| `briefDomain.todayRitualState(data)` — derives current step + completion summary | | |
| `briefDomain.greetingForTime(timeOfDay)` — pure | | |

### Habits

| Domain pure fns | View-local state | Callbacks |
|---|---|---|
| `habitsDomain.groupedBySection(data)` — current grouping logic | reorderMode toggle, reorderSelectedId, future-habits drawer open | `onTogHabit`, `onMoveRowWithinSection`, `onCommitHabitReorderDrop`, `onCommitSlotReorderDrop`, `onToggleConcurrent`, `onOpenEditHabit`, `onOpenAddHabit` |
| `habitsDomain.dueToday(data, todayKey)` | swipeAnim refs per row | |
| `habitsDomain.sectionRowsForRender(data, section)` — wraps the existing `gatherSectionRowsSorted` logic as a pure function | | |
| `habitsDomain.upcomingHabits(data, todayKey)` — for the future-habits drawer | | |

**WRITE-side functions** (`togHabit`, `commitHabitReorderDrop`, `commitSlotReorderDrop`, `moveRowWithinSection`, `toggleConcurrentForHabit`, `addHabit`, `deleteHabit`) stay in App() as callbacks. They reference `latestData.current` + `save` + multiple App-scope helpers; extracting them is a separate plan. The recently-shipped v72–v74 select-then-act reorder logic is NOT refactored.

### Goals

| Domain pure fns | View-local state | Callbacks |
|---|---|---|
| `goalsDomain.bySectionGroup(data)` | expanded-goal id, quick-add draft per goal | `onEditGoal`, `onArchiveGoal`, `onAddGoalHabit`, `onOpenAddGoal` |
| `goalsDomain.smartCompleteness(goal)` — returns which SMART fields are present | | |
| `goalsDomain.isLinkedGoalIncomplete(habit, goals)` — used for the ⚠️ warning emoji | | |

### Todos

| Domain pure fns | View-local state | Callbacks |
|---|---|---|
| `todosDomain.byPriority(data)` | new-todo draft, expand/collapse per group | `onAddTodo`, `onCompleteTodo`, `onDeleteTodo`, `onPromoteTodo` |
| `todosDomain.dueSoon(data, days)` | | |
| `todosDomain.overdue(data, todayKey)` | | |

### Reflect

| Domain pure fns | View-local state | Callbacks |
|---|---|---|
| `reflectDomain.entriesByDay(data)` | currently-editing-entry id, draft text, filter | `onSaveEntry`, `onDeleteEntry`, `onLinkEntryToGoal` |
| `reflectDomain.pastEntriesCount(data)` | | |
| `reflectDomain.entriesForFilter(data, filter)` | | |

### Calendar

| Domain pure fns | View-local state | Callbacks |
|---|---|---|
| `calendarDomain.monthGrid(data, year, month)` | viewed-month, selected-day | `onTogHabit` |
| `calendarDomain.habitsDueOnDay(data, dateKey)` | day-detail open/close | |
| `calendarDomain.dayCompletionStats(data, dateKey)` | | |
| `calendarDomain.markDayVisited(dateKey)` ⤴ curried write | | |

---

## 4. Phase A — Foundation (sequential, ~30 min)

One agent executes:

1. Write [`docs/superpowers/patterns/view-extraction.md`](../patterns/view-extraction.md) — the durable pattern doc. Covers domain function shapes, dual-load guard, view prop signature, callback-prop contract, file naming, test conventions, dispatch helper, browser+iOS verification gate.
2. Add `dispatch` helper to App() in index.html (~5 lines, near existing `save`).
3. Add 6 `<script src="./lib/views/XView.js">` tags + 6 `<script src="./lib/domains/x.js">` tags in index.html head. ORDER: domains BEFORE views (a view module reads `window.xDomain` at evaluate time, though defensively it should not — views should read it at render time inside the component body).
4. Create 12 stub files (`lib/domains/*.js` and `lib/views/*.js`), each exporting `null` or an empty object so the script tags don't 404 before Phase B fills them.
5. Identify and finalize the per-view `callbacks` lists by grepping index.html for each view's render block, recording every cross-domain function call. Update §3 in this spec if discoveries change the list.

Commit Phase A as: `chore(views): foundation for parallel view extraction (Phase A of v75)`.

## 5. Phase B — Parallel extraction (6 subagents concurrent, ~2-3 h)

Six independent subagents, dispatched in one message. Each agent's brief:

- Read [`docs/superpowers/patterns/view-extraction.md`](../patterns/view-extraction.md) IN FULL. It's their contract.
- Read this spec (§3 row for their view).
- Locate their view's render block in index.html. Locate every helper called from inside it.
- Author `lib/domains/<name>.js` with the READ derivations from §3.
- Author `lib/views/<Name>View.js` with the view's React.createElement tree, using the fixed prop signature.
- Author `tests/domains/<name>.test.mjs` with pinned-behavior tests for each domain function (target: ≥5 tests per domain).
- DO NOT touch index.html. DO NOT touch service-worker.js. DO NOT touch any other view.
- Return: file paths + test count + EXACT list of callbacks the view needs from App (the App-scope helper names).

Phase B agents work in true isolation — they share NO files except read-only ones (index.html, utils.js, the pattern doc).

Each agent's commit (done locally by the agent): `feat(views): extract <Name>View + <name>Domain (Phase B of v75)`.

## 6. Phase C — Integration (sequential, 1 careful agent, ~1-2 h)

One agent executes:

1. For each view, in dependency order (Calendar → Todos → Reflect → Goals → Brief → Habits):
   - Edit index.html: replace the view's inline render block with `React.createElement(window.<Name>View, { data, dispatch, deviceProfile: window.__deviceProfile, callbacks: { ... } })`.
   - Construct the callbacks object from the agent's reported list. Wire each callback to the existing App-scope helper.
   - Browser smoke test: load the app, switch to that tab, confirm it renders + basic interaction works.
   - If anything breaks, revert JUST this view's wiring (other 5 stay shipped). Note the breakage. Move on.
2. Update [service-worker.js](../../../service-worker.js):
   - Bump `SHELL_VERSION` from "v71" to "v75" (consistent with the project's ship-bump pattern; v72-v74 commit logical versions never bumped SW).
   - Add precache entries for all 12 new lib/ files.
3. Update [scripts/build-dist.mjs](../../../scripts/build-dist.mjs):
   - Add all 12 new lib/ paths to the allowlist.
4. Run `npm run build` — must succeed; the build's `<script src>` validator confirms all 12 entries resolve.
5. Snapshot `index.html` → `archive/index.v75.html`.
6. Append entry to [docs/DEBUG_LOG.md](../../DEBUG_LOG.md) using the 4-phase template (treat extraction as a refactor, document why each view was extracted).
7. Append entry to [docs/USER_REQUESTS.md](../../USER_REQUESTS.md) under a new `## 2026-05-23 — v75 ship` heading.
8. Commit: `refactor(views): integrate 6 view extractions + bump v75 (Phase C of v75)`.

## 7. Phase D — Verification (parallel where possible, ~30-45 min)

1. `npm run test:unit` — target ≥143 + per-domain test counts (each domain ~5-10 tests, so total ~170-200). All green.
2. `npm run test:e2e` — all 21 desktop E2E + 1 iOS smoke. All green. Specifically verify the 7 calendar-month-grid specs still pass (they're the pre-existing safety net for the Calendar extraction).
3. Launch dev server (`.\serve.ps1` or `node scripts/serve.mjs`).
4. Browser checks at desktop width (1280px):
   - Sign in. For each of 6 tabs: switch to tab, screenshot, verify rendering matches pre-extraction behavior.
   - Dark mode toggle, re-screenshot one tab.
5. Browser checks at iOS width (390px): repeat tab-by-tab screenshot loop.
6. If any check fails: triage with `superpowers:systematic-debugging`, fix the wiring (not the extraction), re-verify.

Final commit (if Phase D found fixes): `fix(views): wiring corrections after Phase D verification`.

---

## 8. Risk register + fallback positions

| Risk | Trigger | Fallback |
|---|---|---|
| Subagent invents a different prop signature | Phase B return shows non-conforming view module | Phase C agent rewrites that view's call site to the conforming signature. Tedious but bounded. |
| Cross-domain helper turns out to need state Phase A didn't predict | Phase B agent reports a callback that App doesn't have | App's Phase C agent extracts the helper from inline code AS-IS (no refactor), exposes it, wires it. |
| Habits extraction blows up due to v72-v74 reorder complexity | Phase B Habits agent returns error / partial | Ship the other 5 view extractions. Habits view stays inline. Open a follow-up plan for Habits specifically. |
| index.html character-count integrity gets corrupted (very subtle edit collisions) | Phase C verification fails to render anywhere | Revert Phase C wholesale via `git restore index.html`. Re-snapshot. Phase B work in lib/ is preserved; only the integration is rolled back. Re-attempt integration view-by-view rather than all at once. |
| Per-domain tests reveal an extraction got the derivation logic wrong | Phase D test failure | Fix in the domain module; re-run; commit a follow-up fix. Don't roll back the extraction. |
| Browser screenshot reveals subtle layout regression in a view | Phase D | Fix in the view module; re-run. If unfixable today, revert just that view's call-site swap. |
| The full plan takes longer than today | Phase D not started by EOD | Ship whatever Phases A-C have committed. Open follow-up issue for remaining work. The pattern doc remains the durable artifact. |

---

## 9. Out of scope (explicitly deferred)

- **WRITE-side helpers** (`togHabit`, `commitHabitReorderDrop`, `commitSlotReorderDrop`, `moveRowWithinSection`, `toggleConcurrentForHabit`, `addHabit`, `deleteHabit`, the AI proxy callers, etc.). All stay in App() as callbacks. Follow-up "Phase 2" plan handles them.
- **Heavy modals** (EditHabit, debriefStep, eveningDebriefStep, streakChoicePending). Stay inline. Already deferred by OSS-port plan.
- **App-level cross-cutting state** (auth, onboarding, splash, tab routing, modal flags, theme toggle, demo mode, settings sheet). Stays in App.
- **iOS Chain C** (Widgets, Siri, HealthKit, App Group infra) — separate roadmap after this and the Phase 2 extraction land.
- **Fix for the v74 known limitation** (rebalanceSlotOrders for ⇶ on custom slotOrders) — separate plan; today's extraction does NOT change that logic.
- **Live bug §20.0** (verrocchio.app NXDOMAIN) — debug-class fix; handled separately, not part of this plan.
- **The OSS-port plan's deferred items** (3 heavy modals migration). Stay deferred.

---

## 10. Definition of done

By end of today, on `main` branch:

- 12 new `lib/` files + 6 new `tests/domains/` files.
- 1 new `docs/superpowers/patterns/view-extraction.md`.
- `index.html` 6 inline view render blocks replaced with `<XView ... />` call sites.
- `service-worker.js` SHELL_VERSION bumped to v75; precache extended.
- `scripts/build-dist.mjs` allowlist extended.
- `archive/index.v75.html` snapshot present.
- `npm run test:unit` green.
- `npm run test:e2e` green.
- Screenshots at desktop + iOS width for all 6 tabs, dark mode confirmed for at least 1 tab.
- DEBUG_LOG.md + USER_REQUESTS.md entries added.

Acceptable degraded outcome: 5 of 6 views shipped, Habits deferred to follow-up. The pattern doc + 5 working extractions still represent a major win.
