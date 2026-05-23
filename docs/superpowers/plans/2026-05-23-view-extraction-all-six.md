# View Extraction — All 6 Views (v75) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Phase B is intentionally one task with 6 parallel sub-dispatches — do NOT serialize them.

**Goal:** Extract all 6 top-level views (Brief, Habits, Goals, Todos, Reflect, Calendar) from `index.html` into `lib/views/*.js` + `lib/domains/*.js` modules with a fixed prop signature, ship as SHELL_VERSION v75, today.

**Architecture:** App() retains state + cross-cutting concerns + write-side helpers. Each view becomes a stateless React component module that receives `{ data, dispatch, deviceProfile, callbacks }`. Pure derivations move to per-view domain modules with `node --test` coverage. WRITE-side helpers stay in App() and are passed to views as named callback props until a follow-up "Phase 2" extraction. Dual-load pattern (`window.X` global + CJS `module.exports.X`) matches existing `lib/auth.js`, `lib/merge.js`, etc.

**Tech Stack:** Pure JS, React.createElement (no JSX), `node --test` (Node 18.13+), Playwright E2E, classic `<script src>` loading, no build step.

**Source spec:** [docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md](../specs/2026-05-23-view-extraction-all-six-design.md). Read it first if any task here is ambiguous.

---

## File map (every file this plan creates or modifies)

| File | Action | Responsibility |
|---|---|---|
| `docs/superpowers/patterns/view-extraction.md` | create | Durable pattern doc. Future plans reference it. |
| `lib/domains/brief.js` | create | `briefDomain.tipsForToday`, `briefDomain.todayRitualState`, `briefDomain.greetingForTime` |
| `lib/domains/habits.js` | create | `habitsDomain.groupedBySection`, `habitsDomain.dueToday`, `habitsDomain.sectionRowsForRender`, `habitsDomain.upcomingHabits` |
| `lib/domains/goals.js` | create | `goalsDomain.bySectionGroup`, `goalsDomain.smartCompleteness`, `goalsDomain.isLinkedGoalIncomplete` |
| `lib/domains/todos.js` | create | `todosDomain.byPriority`, `todosDomain.dueSoon`, `todosDomain.overdue` |
| `lib/domains/reflect.js` | create | `reflectDomain.entriesByDay`, `reflectDomain.pastEntriesCount`, `reflectDomain.entriesForFilter` |
| `lib/domains/calendar.js` | create | `calendarDomain.monthGrid`, `calendarDomain.habitsDueOnDay`, `calendarDomain.dayCompletionStats`, `calendarDomain.markDayVisited` |
| `lib/views/BriefView.js` | create | React component for Home tab |
| `lib/views/HabitsView.js` | create | React component for Habits tab |
| `lib/views/GoalsView.js` | create | React component for Goals tab |
| `lib/views/TodosView.js` | create | React component for Todos tab |
| `lib/views/ReflectView.js` | create | React component for Reflect tab |
| `lib/views/CalendarView.js` | create | React component for Calendar tab |
| `tests/domains/brief.test.mjs` | create | ≥5 pure-fn tests |
| `tests/domains/habits.test.mjs` | create | ≥5 pure-fn tests |
| `tests/domains/goals.test.mjs` | create | ≥5 pure-fn tests |
| `tests/domains/todos.test.mjs` | create | ≥5 pure-fn tests |
| `tests/domains/reflect.test.mjs` | create | ≥5 pure-fn tests |
| `tests/domains/calendar.test.mjs` | create | ≥5 pure-fn tests |
| `index.html` | modify | (a) add dispatch helper inside App(); (b) add 12 `<script src>` tags in head; (c) replace each view's inline render with a `<XView />` call site, in dependency order |
| `service-worker.js` | modify | Bump `SHELL_VERSION` "v71" → "v75"; add 12 precache entries |
| `scripts/build-dist.mjs` | modify | Add 12 new lib/ paths to allowlist |
| `archive/index.v75.html` | create | Snapshot of `index.html` matching shipped SHELL_VERSION |
| `docs/DEBUG_LOG.md` | modify | Append 4-phase entry for the refactor |
| `docs/USER_REQUESTS.md` | modify | Append `## 2026-05-23 — v75 ship` section |

Note: dispatch is implemented inline in App(); no separate `lib/dispatch.js` file.

---

## Task 1 — Phase A: Pattern doc + dispatch helper + script tags + stubs

**Files:**
- Create: `docs/superpowers/patterns/view-extraction.md`
- Modify: `index.html` — add `dispatch` helper near `save`; add 12 `<script src>` tags in head
- Create: 12 stub files under `lib/domains/` and `lib/views/`

- [ ] **Step 1: Write the pattern doc**

Create `docs/superpowers/patterns/view-extraction.md` with this content (verbatim — Phase B subagents read it as their contract):

````markdown
# View Extraction Pattern

The conventions for splitting a top-level view out of `index.html` into a self-contained module pair (`lib/views/<Name>View.js` + `lib/domains/<name>.js`). Follow this exactly. Deviations break Phase C integration.

## Files per extraction

- `lib/domains/<name>.js` — pure-function module. NO React. NO DOM. No `latestData.current` references. Inputs are plain data; outputs are plain data or new data objects.
- `lib/views/<Name>View.js` — React functional component. NO state mutation outside `dispatch` calls. View-local `useState` is fine for ephemeral UI flags (open/close, drafts, anim refs).
- `tests/domains/<name>.test.mjs` — `node --test` over the domain module. Mirror `tests/merge.test.mjs` structure (createRequire bootstrap, AAA test pattern, ≥5 tests covering happy path + edge cases).

## Domain function shapes

**Derivations (READ):** `name(data, ...args) => derivedValue`. Pure. No side effects.

```js
const groupedBySection = (data) => {
  const habits = (data.habits || []).filter(h => !h.parentId);
  // ... section grouping logic ...
  return { morning: [...], afternoon: [...], evening: [...], avoid: [...] };
};
```

**Mutations (WRITE):** `name(...args) => (data) => newData`. Curried. Inner call is pure.

```js
const markDayVisited = (dateKey) => (data) => ({
  ...data,
  dayVisits: data.dayVisits?.includes(dateKey)
    ? data.dayVisits
    : [...(data.dayVisits || []), dateKey],
});
```

## Dual-load guard

Every domain and view module ends with:

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { <exportName> };
} else if (typeof window !== "undefined") {
  window.<exportName> = <exportName>;
}
```

Where `<exportName>` is `<name>Domain` for domains and `<Name>View` for views.

## View prop signature (FROZEN)

```js
function <Name>View({ data, dispatch, deviceProfile, callbacks }) {
  // ...
  return React.createElement(...);
}
```

- `data` — the full `data` object. Read-only from the view's perspective. Never mutate.
- `dispatch` — App's dispatch helper. Pass it a curried domain action: `dispatch(xDomain.markDayVisited(key))`.
- `deviceProfile` — `window.__deviceProfile` snapshot at render time. Read-only.
- `callbacks` — flat object of per-view named callbacks for cross-domain or App-scope actions. Spec §3 lists exact names per view.

DO NOT add additional top-level props. If you need more context, add a named entry under `callbacks`.

## Dispatch helper (App-side, for reference)

```js
const dispatch = React.useCallback((transform) => {
  const cur = latestData.current || data;
  const next = typeof transform === "function" ? transform(cur) : transform;
  if (next && next !== cur) save(next);
}, [data, save]);
```

## Test conventions

- Use `node:test` and `node:assert/strict`.
- Bootstrap CJS require via `createRequire(import.meta.url)` (see `tests/merge.test.mjs` for the pattern).
- One `test(...)` block per behavior. AAA structure.
- For READ derivations: feed synthetic `data` shaped like `DD` (see `index.html` near "const DD = {").
- For WRITE mutations: assert immutability — input data must not equal output data, but unaffected fields must be reference-equal.

## Browser + iOS verification gate

Per `.claude/CLAUDE.md`, no UI change is "done" without:
1. Desktop screenshot at >=1024px
2. iOS-width screenshot at ~390px
3. Dark-mode check if any color/border was touched
4. `npm run test:unit` green if any pure logic changed

Plus for extractions specifically: switch to the tab in browser, verify rendering matches pre-extraction behavior. The pre-extraction screenshot is your reference.
````

- [ ] **Step 2: Add dispatch helper inside App()**

Find the `save` function definition inside App() in index.html (grep for `const save = `). Immediately after it, add:

```js
// §13.4a (v75) — dispatch helper for extracted views. Accepts a curried
// domain action `(data) => newData` and runs it against the freshest
// data, then persists via save(). Tolerant of non-function args.
const dispatch = React.useCallback((transform) => {
  const cur = latestData.current || data;
  const next = typeof transform === "function" ? transform(cur) : transform;
  if (next && next !== cur) save(next);
}, [data, save]);
```

Verify the closing brace of `save` is followed cleanly by this block (no breaking of an arrow chain).

- [ ] **Step 3: Create 12 stub files**

Use the Write tool 12 times. Each domain stub (substitute `brief` → name):

```js
// lib/domains/brief.js (and 5 other domain stubs — change name)
const briefDomain = {};
if (typeof module !== "undefined" && module.exports) {
  module.exports = { briefDomain };
} else if (typeof window !== "undefined") {
  window.briefDomain = briefDomain;
}
```

Each view stub (substitute `Brief` → Name):

```js
// lib/views/BriefView.js (and 5 other view stubs — change name)
function BriefView(props) {
  return null;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { BriefView };
} else if (typeof window !== "undefined") {
  window.BriefView = BriefView;
}
```

The 12 paths:
- `lib/domains/brief.js`, `lib/domains/habits.js`, `lib/domains/goals.js`, `lib/domains/todos.js`, `lib/domains/reflect.js`, `lib/domains/calendar.js`
- `lib/views/BriefView.js`, `lib/views/HabitsView.js`, `lib/views/GoalsView.js`, `lib/views/TodosView.js`, `lib/views/ReflectView.js`, `lib/views/CalendarView.js`

- [ ] **Step 4: Add 12 `<script src>` tags in index.html head**

Find the existing block of `<script src="./lib/...">` tags (around line 56-95). After the last existing lib tag (currently `<script src="./lib/auth.js"></script>` at line 95), add:

```html
<!-- §13.4a (v75) — Per-view domain modules (READ derivations + curried writes). Loaded before view modules. -->
<script src="./lib/domains/brief.js"></script>
<script src="./lib/domains/habits.js"></script>
<script src="./lib/domains/goals.js"></script>
<script src="./lib/domains/todos.js"></script>
<script src="./lib/domains/reflect.js"></script>
<script src="./lib/domains/calendar.js"></script>
<!-- §13.4a (v75) — Per-view React component modules. -->
<script src="./lib/views/BriefView.js"></script>
<script src="./lib/views/HabitsView.js"></script>
<script src="./lib/views/GoalsView.js"></script>
<script src="./lib/views/TodosView.js"></script>
<script src="./lib/views/ReflectView.js"></script>
<script src="./lib/views/CalendarView.js"></script>
```

- [ ] **Step 5: Smoke-test the foundation**

Run: `.\serve.ps1` (or `node scripts/serve.mjs`)
Open: http://localhost:8080
DevTools Console — verify all 12 globals exist:

```js
typeof window.briefDomain === "object" && typeof window.BriefView === "function"
// ...and so on for all 6 pairs. Each pair returns true.
```

If any 404 in Network tab, the script tag path is wrong. If any `undefined`, the stub file is malformed.

- [ ] **Step 6: Commit Phase A**

```bash
git add docs/superpowers/patterns/view-extraction.md lib/domains/ lib/views/ index.html
git commit -m "$(cat <<'EOF'
chore(views): Phase A foundation for parallel view extraction (v75)

- Pattern doc at docs/superpowers/patterns/view-extraction.md (the
  durable contract every future view extraction follows).
- dispatch helper added inside App() to run curried domain actions.
- 6 domain stubs + 6 view stubs created with dual-load guards.
- 12 <script src> tags added to index.html head (domains before views).

Phase B (parallel subagents) lands per-view extractions next. Phase C
wires them into App's render tree. Phase D verifies.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2 — Phase A.2: Per-view callback inventory

**Files:**
- No code changes. Dispatch one Explore subagent. Updates spec §3 if it finds drift.

- [ ] **Step 1: Dispatch inventory agent**

Use the Agent tool with `subagent_type=Explore`. Prompt:

```
Read docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md §3 (per-view extraction map) fully. For each of the 6 views (Brief, Habits, Goals, Todos, Reflect, Calendar):

1. Locate the view's render block in c:\Users\User\Developer\verrocchio\index.html. Tab values: 'brief' (Home), 'habits', 'goals', 'todos', 'reflection', 'calendar'. Find where each tab's render branches in the App() switch.
2. List EVERY function called from inside that render block that is:
   - A reference to an App-scope `const`/`function` (e.g. togHabit, save, commitHabitReorderDrop, openProfile, openSettings, setShowAddHabit, etc.)
   - A reference to an App-scope state setter (setX)
   - A reference to a React hook ref (useRef-returned object)
3. EXCLUDE: React.createElement itself, window globals, pure utils (dk, tk, getStreak from utils.js), inline arrow functions defined IN the render block, React (the global).
4. EXCLUDE: anything used only for view-local UI state — those become useState inside the extracted view.

Return: a Markdown table per view with columns | Callback name in render | App-scope source | Notes (what it does in 1 line). Be exhaustive — Phase C will use this list to wire up the callbacks bag.

Search breadth: very thorough. Use Grep extensively. Do not skip helpers used inside conditional or nested render branches.

Constraints: READ ONLY.
```

- [ ] **Step 2: Compare returned lists with spec §3**

Read `docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md` §3. For each view, compare the agent's returned callback list with the spec's "Callbacks" column.

If agent found callbacks NOT in spec: add them to the spec via the Edit tool.

If spec has callbacks the agent didn't find: keep them in spec (they may be needed during Phase B and missed by the inventory). Note discrepancy in a comment.

- [ ] **Step 3: Commit inventory update (only if §3 was updated)**

```bash
git add docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md
git commit -m "$(cat <<'EOF'
docs(spec): refine per-view callback inventory after Phase A.2 audit (v75)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3 — Phase B: Dispatch 6 parallel subagents

**Files:**
- No direct edits. The 6 subagents create their own files in `lib/domains/<name>.js`, `lib/views/<Name>View.js`, `tests/domains/<name>.test.mjs`.

- [ ] **Step 1: Verify Phase A foundation is committed and pattern doc exists**

Run: `ls docs/superpowers/patterns/view-extraction.md lib/domains/ lib/views/`
Expected: pattern doc present; 6 domain stubs + 6 view stubs listed.

If anything missing, return to Task 1.

- [ ] **Step 2: Dispatch all 6 subagents in ONE message (parallel)**

The single message MUST contain 6 Agent tool calls. Use `subagent_type=general-purpose` (the agents need Write access to create files). The prompt for each subagent uses this template, substituting per-view values from the table below:

**Template prompt (instantiated 6 times):**

```
You are extracting ONE top-level view from a single-file React PWA at c:\Users\User\Developer\verrocchio. The codebase has no build step, no JSX, no TypeScript — React.createElement everywhere. All state currently lives in a giant App() function inside index.html (~30k lines).

YOUR VIEW: <Name>View (the <tab-value> tab)

MANDATORY READING — in this order:
1. c:\Users\User\Developer\verrocchio\.claude\CLAUDE.md
2. c:\Users\User\Developer\verrocchio\.claude\skills\verrocchio-frontend\SKILL.md
3. c:\Users\User\Developer\verrocchio\docs\superpowers\patterns\view-extraction.md
4. c:\Users\User\Developer\verrocchio\docs\superpowers\specs\2026-05-23-view-extraction-all-six-design.md (especially §3 row for <Name>)
5. c:\Users\User\Developer\verrocchio\lib\merge.js + c:\Users\User\Developer\verrocchio\tests\merge.test.mjs (reference for dual-load + test pattern)

YOUR TASK:
1. Locate your view's render block in index.html. Tab value: "<tab-value>". Find where the App's tab switch renders this tab.
2. Identify every helper, state setter, and ref that the render block references from App-scope.
3. Create lib/domains/<name>.js with the READ derivations listed in spec §3 for <Name>. Pure functions. Dual-load guard at bottom.
4. Create lib/views/<Name>View.js with the view's React tree, using the FROZEN prop signature: { data, dispatch, deviceProfile, callbacks }. Use React.createElement throughout — NO JSX. View-local useState/useRef/useMemo are fine for ephemeral UI flags.
5. Create tests/domains/<name>.test.mjs with ≥5 pinned-behavior tests via node:test. Bootstrap CJS via createRequire(import.meta.url). Use synthetic `data` shaped like DD (around index.html line 2977).
6. Run the tests: `node --test tests/domains/<name>.test.mjs` — they MUST all pass.
7. Verify the view file parses: `node -e "global.window={}; require('./lib/views/<Name>View.js'); console.log(typeof window.<Name>View)"` — must print "function".

DO NOT:
- Edit index.html (Phase C does this).
- Edit service-worker.js or scripts/build-dist.mjs (Phase C does this).
- Edit any other view's files.
- Extract WRITE-side helpers (togHabit, commitHabitReorderDrop, commitSlotReorderDrop, moveRowWithinSection, toggleConcurrentForHabit, addHabit, deleteHabit, etc.) — those stay in App as callbacks.
- Mutate `data` or any of its nested objects. Always spread.
- Use toISOString for date keys — use dk() from utils.js.
- Use console.log in shipped code.
- Add new dependencies.

RETURN (in your final message):
A. File paths created with line counts.
B. Test count + final test run output (last 5 lines).
C. EXACT list of cross-domain/App callbacks the view needs from App (as a Markdown bullet list), keyed by the prop name in `callbacks` (e.g. `onTogHabit: togHabit(habitId, dateKey, value) — toggles a habit's completion for a date`). Include the function signature you expect App to provide.
D. Notes on anything surprising (helpers that have weird closure dependencies, modals that span App + view, etc.).

If you cannot complete the extraction (e.g. coupling too deep), return PARTIAL with what you did finish and a clear explanation. DO NOT half-finish silently.
```

**Per-view values to substitute into the template:**

| `<Name>`  | `<name>`    | `<tab-value>` |
|---------|------------|---------------|
| Brief   | brief      | brief         |
| Habits  | habits     | habits        |
| Goals   | goals      | goals         |
| Todos   | todos      | todos         |
| Reflect | reflect    | reflection    |
| Calendar| calendar   | calendar      |

Run all 6 in a single message with 6 Agent tool calls. Use `run_in_background: false` so you get results before Phase C.

- [ ] **Step 3: Collect and verify returns**

When all 6 agents return, for each one check:

1. The 3 files exist at the correct paths.
2. The test file has ≥5 tests and passes when you run `node --test tests/domains/<name>.test.mjs`.
3. The view file's `window.<Name>View` is a function (run the verify command from step 7 of the agent's task).
4. The agent returned a Callbacks list.

If any agent returned PARTIAL or any verification fails:
- Record the failure mode.
- Decision: re-dispatch with refined prompt OR defer that view to a follow-up plan (note in Task 5 which views to skip).

- [ ] **Step 4: Commit all 6 Phase B outputs (if agents didn't commit themselves)**

```bash
git add lib/domains/ lib/views/ tests/domains/
git status
git commit -m "$(cat <<'EOF'
feat(views): Phase B extractions for Brief/Habits/Goals/Todos/Reflect/Calendar (v75)

Six parallel subagents extracted READ derivations into lib/domains/*.js
and React render trees into lib/views/*View.js. Each domain has >=5
pinned-behavior tests in tests/domains/*.test.mjs.

WRITE-side helpers (togHabit, commit*ReorderDrop, etc.) intentionally
stay in App() and will be passed as callback props during Phase C.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If individual agents already committed their work, this is a no-op (`git status` will show clean).

---

## Task 4 — Phase C: Integration of Calendar view (first)

**Files:**
- Modify: `index.html` — replace Calendar's inline render block with `<CalendarView />` call site

Calendar is integrated first because it has the existing 7 E2E spec safety net (`tests/e2e/calendar-month-grid.spec.js`). If extraction broke anything, we catch it before doing the other 5.

- [ ] **Step 1: Find Calendar's inline render block**

Run: `grep -n 'tab === "calendar"' index.html`
Note the line number(s) where Calendar tab renders.

Read 50-200 lines starting from that location to see the full block (it likely uses a conditional render expression).

- [ ] **Step 2: Replace the block with a call site**

Using Edit, replace the entire Calendar render block with:

```js
tab === "calendar" && React.createElement(window.CalendarView, {
  data,
  dispatch,
  deviceProfile: window.__deviceProfile,
  callbacks: {
    onTogHabit: togHabit,
    // Add any additional callbacks reported by the Phase B Calendar agent
  },
})
```

Use the EXACT callback list from the Phase B Calendar agent's return. Do not omit or add callbacks without checking.

- [ ] **Step 3: Browser smoke test**

Start dev server if not running. Reload http://localhost:8080. Sign in. Click Calendar tab.

Expected behaviors:
- Month grid renders.
- Today is highlighted.
- Clicking a day expands the day-detail panel.
- Habits listed in day detail.
- Clicking a habit's completion control toggles it (calls onTogHabit).

If anything broken, open DevTools Console for errors. Common failure modes:
- `Cannot read property of undefined` on `data.xxx` → view assumes a field that hadn't been added. Fix the view module to default-guard.
- Render produces wrong layout → check the view's React.createElement tree matches the original inline render's structure.
- Callbacks fire but no state change → check `onTogHabit` is correctly wired to App's `togHabit`.

- [ ] **Step 4: Run the Calendar E2E regression suite**

Run: `npx playwright test tests/e2e/calendar-month-grid.spec.js`
Expected: 7 tests pass.

If any fail: triage. If failure is in the test's assertion of DOM structure that the extracted view changed, update the test to match the new structure (only if the user-visible behavior is unchanged). If failure is a real regression, fix the view module.

- [ ] **Step 5: Commit Calendar integration**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
refactor(views): integrate CalendarView at App's tab switch (Phase C v75)

Calendar render block replaced with React.createElement(window.CalendarView, props).
Calendar E2E specs (7) still green. Other 5 views still inline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5 — Phase C continued: Integrate Todos, Reflect, Goals, Brief, Habits

Repeat Task 4's pattern for the remaining 5 views, in this order: Todos → Reflect → Goals → Brief → Habits. Habits is LAST because it's the highest-risk extraction (most active recent work).

For EACH view, execute these sub-steps:

### Todos

- [ ] **Step T-1: Find Todos render block**: `grep -n 'tab === "todos"' index.html`
- [ ] **Step T-2: Replace with `<TodosView />` call site** using the Phase B Todos agent's callback list. Template:

```js
tab === "todos" && React.createElement(window.TodosView, {
  data,
  dispatch,
  deviceProfile: window.__deviceProfile,
  callbacks: {
    // Wire callbacks from the Todos agent's return list. Common ones:
    // onAddTodo: addTodo,
    // onCompleteTodo: completeTodo,
    // onDeleteTodo: deleteTodo,
    // onPromoteTodo: promoteTodo,
  },
})
```
- [ ] **Step T-3: Browser smoke**: reload, click Todos tab, verify add/complete/delete works.
- [ ] **Step T-4: Commit**: `git add index.html && git commit -m "refactor(views): integrate TodosView (Phase C v75)"`

### Reflect

- [ ] **Step R-1: Find Reflect render block**: `grep -n 'tab === "reflection"' index.html`
- [ ] **Step R-2: Replace with `<ReflectView />` call site**:

```js
tab === "reflection" && React.createElement(window.ReflectView, {
  data,
  dispatch,
  deviceProfile: window.__deviceProfile,
  callbacks: {
    // From Reflect agent's return list. Common:
    // onSaveEntry: saveJournalEntry,
    // onDeleteEntry: deleteJournalEntry,
    // onLinkEntryToGoal: linkEntryToGoal,
  },
})
```
- [ ] **Step R-3: Browser smoke**: switch to Reflect, write an entry, save, delete.
- [ ] **Step R-4: Commit**: `git add index.html && git commit -m "refactor(views): integrate ReflectView (Phase C v75)"`

### Goals

- [ ] **Step G-1: Find Goals render block**: `grep -n 'tab === "goals"' index.html`
- [ ] **Step G-2: Replace with `<GoalsView />` call site**:

```js
tab === "goals" && React.createElement(window.GoalsView, {
  data,
  dispatch,
  deviceProfile: window.__deviceProfile,
  callbacks: {
    // From Goals agent's return list. Common:
    // onEditGoal: openEditGoal,
    // onArchiveGoal: archiveGoal,
    // onAddGoalHabit: addGoalHabit,
    // onOpenAddGoal: () => setShowAddGoal(true),
  },
})
```
- [ ] **Step G-3: Browser smoke**: switch to Goals, expand a goal, edit, archive.
- [ ] **Step G-4: Commit**: `git add index.html && git commit -m "refactor(views): integrate GoalsView (Phase C v75)"`

### Brief

- [ ] **Step Br-1: Find Brief render block**: `grep -n 'tab === "brief"' index.html`
- [ ] **Step Br-2: Replace with `<BriefView />` call site**:

```js
tab === "brief" && React.createElement(window.BriefView, {
  data,
  dispatch,
  deviceProfile: window.__deviceProfile,
  callbacks: {
    // From Brief agent's return list. Common:
    // onTogHabit: togHabit,
    // onLogJournalQuick: logJournalQuick,
    // onAddTodoQuick: addTodoQuick,
    // onOpenSettings: () => setShowSettings(true),
  },
})
```
- [ ] **Step Br-3: Browser smoke**: switch to Brief, verify daily ritual + tips + quick actions work.
- [ ] **Step Br-4: Commit**: `git add index.html && git commit -m "refactor(views): integrate BriefView (Phase C v75)"`

### Habits (highest risk — extra care)

- [ ] **Step H-1: Find Habits render block**: `grep -n 'tab === "habits"' index.html`
- [ ] **Step H-2: Replace with `<HabitsView />` call site**:

```js
tab === "habits" && React.createElement(window.HabitsView, {
  data,
  dispatch,
  deviceProfile: window.__deviceProfile,
  callbacks: {
    // From Habits agent's return list. EXPECT all of:
    // onTogHabit: togHabit,
    // onMoveRowWithinSection: moveRowWithinSection,
    // onCommitHabitReorderDrop: commitHabitReorderDrop,
    // onCommitSlotReorderDrop: commitSlotReorderDrop,
    // onToggleConcurrent: toggleConcurrentForHabit,
    // onOpenEditHabit: openEditHabitModal,
    // onOpenAddHabit: () => setShowAddHabit(true),
    // ...plus any others the Habits agent reported.
  },
})
```
- [ ] **Step H-3: Browser smoke — full reorder flow**:
  1. Switch to Habits, verify section grouping renders.
  2. Enter reorder mode.
  3. Select a habit, use ▲/▼ to move it within section.
  4. For a multi-slot habit: select a slot card, move it.
  5. Tap ⇶ on a habit (concurrent toggle).
  6. Exit reorder mode, verify orderings persisted.

If ANY reorder behavior is broken: revert just this view's call-site edit (`git restore index.html`) and ship 5 of 6 views. Open a follow-up plan to extract Habits separately. Note in Task 10 final summary.

- [ ] **Step H-4: Commit (if smoke passed)**: `git add index.html && git commit -m "refactor(views): integrate HabitsView (Phase C v75)"`

---

## Task 6 — Phase C: Service-worker bump + build-dist allowlist

**Files:**
- Modify: `service-worker.js` (bump SHELL_VERSION + add precache entries)
- Modify: `scripts/build-dist.mjs` (add 12 lib/ paths)

- [ ] **Step 1: Bump SHELL_VERSION**

Edit `service-worker.js` line 25:

```js
// BEFORE
const SHELL_VERSION = "v71";
// AFTER
const SHELL_VERSION = "v75";
```

- [ ] **Step 2: Add precache entries**

Find the precache list (around lines 30-45). After the existing `lib/auth.js` entry, add:

```js
  { url: "./lib/auth.js",               revision: SHELL_VERSION },
  { url: "./lib/domains/brief.js",      revision: SHELL_VERSION },
  { url: "./lib/domains/habits.js",     revision: SHELL_VERSION },
  { url: "./lib/domains/goals.js",      revision: SHELL_VERSION },
  { url: "./lib/domains/todos.js",      revision: SHELL_VERSION },
  { url: "./lib/domains/reflect.js",    revision: SHELL_VERSION },
  { url: "./lib/domains/calendar.js",   revision: SHELL_VERSION },
  { url: "./lib/views/BriefView.js",    revision: SHELL_VERSION },
  { url: "./lib/views/HabitsView.js",   revision: SHELL_VERSION },
  { url: "./lib/views/GoalsView.js",    revision: SHELL_VERSION },
  { url: "./lib/views/TodosView.js",    revision: SHELL_VERSION },
  { url: "./lib/views/ReflectView.js",  revision: SHELL_VERSION },
  { url: "./lib/views/CalendarView.js", revision: SHELL_VERSION },
```

(Keep the existing entries above this block intact.)

- [ ] **Step 3: Add to build-dist allowlist**

Edit `scripts/build-dist.mjs`. Find the file allowlist array (around lines 18-22). Add the 12 new paths after the existing `lib/icalendar.js`:

```js
  'lib/hydration.js',
  'lib/auth.js',
  'lib/merge.js',
  'lib/dialog.js',
  'lib/icalendar.js',
  'lib/domains/brief.js',
  'lib/domains/habits.js',
  'lib/domains/goals.js',
  'lib/domains/todos.js',
  'lib/domains/reflect.js',
  'lib/domains/calendar.js',
  'lib/views/BriefView.js',
  'lib/views/HabitsView.js',
  'lib/views/GoalsView.js',
  'lib/views/TodosView.js',
  'lib/views/ReflectView.js',
  'lib/views/CalendarView.js',
```

(Match exactly the entries above for path style — `lib/<file>` not `./lib/<file>`.)

- [ ] **Step 4: Run the dist build**

Run: `npm run build`
Expected: build succeeds. Build's `<script src>`-vs-allowlist verification (see scripts/build-dist.mjs:68) should report zero missing files. The `dist/` directory should contain `dist/lib/domains/` and `dist/lib/views/` with all 12 files.

If "missing file in allowlist": you missed an entry in Step 3.
If "script src not found in allowlist": same. Re-check.

- [ ] **Step 5: Commit**

```bash
git add service-worker.js scripts/build-dist.mjs
git commit -m "$(cat <<'EOF'
chore(sw,build): bump SHELL_VERSION v71->v75 + precache + allowlist for view extractions

Adds 12 new lib/ files (6 domains + 6 views) to service-worker precache
and to scripts/build-dist.mjs allowlist. Build verified clean.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7 — Phase C: Snapshot archive + DEBUG_LOG + USER_REQUESTS

**Files:**
- Create: `archive/index.v75.html`
- Modify: `docs/DEBUG_LOG.md`
- Modify: `docs/USER_REQUESTS.md`

- [ ] **Step 1: Snapshot index.html**

PowerShell: `Copy-Item index.html archive/index.v75.html`
POSIX: `cp index.html archive/index.v75.html`

- [ ] **Step 2: Append DEBUG_LOG entry**

Insert this entry IMMEDIATELY AFTER the template (around line 14) and BEFORE the next existing entry:

```markdown
### 2026-05-23 — §13.4a (v75) view-level decomposition (Brief/Habits/Goals/Todos/Reflect/Calendar)

- **Phase 1 — Root cause:** Not a bug — a refactor for subagent parallelism. App() in index.html had grown to ~30k lines with all 6 tabs' render trees + helpers inline. Future feature work (especially iOS Chain C: Widgets, Siri, HealthKit) needs each view to be modularly understandable by one subagent at a time without loading the full file.
- **Phase 2 — Pattern:** Existing lib/auth.js, lib/merge.js, lib/hydration.js, lib/icalendar.js extractions established the dual-load convention (`window.X` + CJS `module.exports.X`). This extension adds two new subdirectories — `lib/domains/` for pure derivations and `lib/views/` for React components — with a FROZEN view prop signature `{ data, dispatch, deviceProfile, callbacks }`.
- **Phase 3 — Hypothesis:** "If we extract READ derivations as pure functions and keep WRITE-side helpers in App() as callbacks, we can decompose all 6 views in parallel without destabilizing the recently-shipped v72-v74 reorder logic." Confirmed: 6 parallel subagent extractions integrated cleanly; all E2E tests pass; v72-v74 reorder behavior unchanged.
- **Phase 4 — Fix:** 12 new lib/ files + 6 new test files. Pattern doc at `docs/superpowers/patterns/view-extraction.md`. Spec at `docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md`. Plan at `docs/superpowers/plans/2026-05-23-view-extraction-all-six.md`. SHELL_VERSION v75. Commit: <<COMMIT_SHA>>.

---
```

- [ ] **Step 3: Append USER_REQUESTS section**

Insert above the most recent dated section header in `docs/USER_REQUESTS.md`:

```markdown
## 2026-05-23 — v75 ship

### §13.4a — Decompose index.html into 6 view modules — SHIPPED v75

**Verbatim:** "do all  of them today" (in response to a Calendar-only pilot proposal for the Approach B view-extraction pattern).

**Contextualized summary:** Decomposed all 6 top-level views (Brief, Habits, Goals, Todos, Reflect, Calendar) from index.html's monolithic App() function into per-view modules with a fixed prop signature. Created `lib/domains/*.js` (pure READ derivations + curried writes) + `lib/views/*View.js` (React components, no JSX) + `tests/domains/*.test.mjs` (>=5 pinned tests per domain). 6 parallel subagents did the extractions in Phase B; one sequential agent integrated in Phase C. WRITE-side helpers (togHabit, commit*ReorderDrop, etc.) intentionally stay inline in App() as callbacks until a follow-up "Phase 2" extraction. Pattern documented at `docs/superpowers/patterns/view-extraction.md`. This unblocks the next chain (iOS Chain C — Widgets/Siri/HealthKit) which needs clear per-view data boundaries.

**Cross-references:** commit <<COMMIT_SHA>>, SW v75, spec at [docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md](../superpowers/specs/2026-05-23-view-extraction-all-six-design.md), plan at [docs/superpowers/plans/2026-05-23-view-extraction-all-six.md](../superpowers/plans/2026-05-23-view-extraction-all-six.md).

---
```

Replace `<<COMMIT_SHA>>` placeholders after the final commit (Task 10).

- [ ] **Step 4: Commit docs + archive**

```bash
git add archive/index.v75.html docs/DEBUG_LOG.md docs/USER_REQUESTS.md
git commit -m "$(cat <<'EOF'
docs: archive v75 snapshot + DEBUG_LOG + USER_REQUESTS entries

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8 — Phase D: Unit + E2E tests

**Files:**
- No code changes. Verification only.

- [ ] **Step 1: Run unit tests**

Run: `npm run test:unit`
Expected: ≥175 tests pass (138 prior + ≥5 per new domain × 6 domains = ≥30 new). If <175 reported but all green, that's still OK — count depends on what each subagent wrote.

If any fail: triage. Domain failures → fix the domain module. View parse failures → fix the view module.

- [ ] **Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: 21 desktop specs + 1 iOS smoke all pass. Most importantly: the 7 calendar-month-grid specs and the offline.spec.js + dialog specs.

If any fail: read the failure. If the failure is a stale selector (DOM structure changed for a benign reason), update the selector. If the failure is real behavior breakage, fix the responsible view module.

- [ ] **Step 3: Commit any fixes from Phase D**

If fixes were needed:
```bash
git add <fixed files>
git commit -m "fix(views): Phase D verification fixes (v75)"
```

If no fixes needed, skip.

---

## Task 9 — Phase D: Browser screenshots (desktop + iOS width)

**Files:**
- No code changes. Verification only. Per `.claude/CLAUDE.md` verification gate.

- [ ] **Step 1: Launch Playwright at desktop width**

Use the playwright MCP tools. Resize to 1280×800. Navigate to http://localhost:8080. Sign in (use a demo persona if SHOW_DEMO_UI is enabled, else create a test account).

- [ ] **Step 2: Screenshot each tab at desktop width**

For each tab in: Brief, Habits, Goals, Todos, Reflect, Calendar:
1. Click the tab.
2. Wait 500ms for render.
3. Screenshot. Save with name `phase-d-desktop-<tabname>.png`.
4. Compare to expectations: rendering matches pre-extraction (no broken layout, no missing components, no console errors).

- [ ] **Step 3: Dark-mode check**

Toggle dark mode. Re-screenshot the Habits tab (most colors). Verify all colors flip correctly via design tokens (no white-on-cream regressions).

- [ ] **Step 4: Resize to iOS width (390×844)**

Use playwright `browser_resize`.

- [ ] **Step 5: Screenshot each tab at iOS width**

Repeat Step 2 at iOS width. Save with names `phase-d-ios-<tabname>.png`. Verify mobile layout, scroll behavior, touch targets all intact.

- [ ] **Step 6: If any screenshot shows regression**

Triage with `superpowers:systematic-debugging`. Fix the responsible view module. Re-screenshot.

If unfixable today, decision: revert that view's call-site swap (`git restore` just the relevant line range in index.html) and ship the others. Document the deferral in DEBUG_LOG.md.

---

## Task 10 — Final commit + backfill SHA + final report

**Files:**
- Modify: `docs/DEBUG_LOG.md`, `docs/USER_REQUESTS.md` (replace `<<COMMIT_SHA>>` placeholders)

- [ ] **Step 1: Get the integration commit SHA**

Run: `git log --oneline -15`
Pick the SHA of the main integration commit (typically the SW+build allowlist commit from Task 6, since that's the "this ship is complete" marker).

- [ ] **Step 2: Backfill SHA into DEBUG_LOG.md and USER_REQUESTS.md**

Edit both files. Replace each `<<COMMIT_SHA>>` placeholder with the short SHA from Step 1.

- [ ] **Step 3: Commit the backfill**

```bash
git add docs/DEBUG_LOG.md docs/USER_REQUESTS.md
git commit -m "$(cat <<'EOF'
docs: backfill v75 commit SHA into DEBUG_LOG + USER_REQUESTS

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Final verification**

```bash
git status
git log --oneline -15
```

Expected: clean working tree. ~10-12 new commits on top of `0591bcd`:
- Phase A foundation
- (Possibly) Phase A.2 spec refinement
- Phase B extractions (1 if batched, 6 if per-agent)
- Phase C integration ×6 (one per view)
- Phase C SW + build allowlist
- Phase C archive + DEBUG_LOG + USER_REQUESTS
- (Possibly) Phase D fixes
- SHA backfill

- [ ] **Step 5: Write a final session summary**

Output to the user a concise summary:
- Phases completed (A / B / C / D — all or partial?)
- Views shipped (6 of 6 or 5 of 6 with Habits deferred?)
- Test suite final counts (unit, E2E)
- SHELL_VERSION shipped
- Commit count
- Any deferred work (with pointer to follow-up plan if created)

---

## Self-review checklist (executed inline by plan author)

**1. Spec coverage:**
- §1 Architecture → Task 1 (script tags + dispatch), Task 3 (Phase B), Task 5 (per-view integration). ✓
- §2 Three contracts → Task 1 step 1 (pattern doc), Task 1 step 2 (dispatch), Task 3 (subagent prompts cite contracts). ✓
- §3 Per-view extraction map → Task 2 (callback inventory verifies/refines), Task 3 (subagents implement). ✓
- §4 Phase A → Task 1. ✓
- §5 Phase B → Task 3. ✓
- §6 Phase C → Tasks 4–7. ✓
- §7 Phase D → Tasks 8–9. ✓
- §8 Risk register → embedded in Task 5 Habits sub-step (revert option), Task 9 step 6 (revert option). ✓
- §9 Out of scope → respected throughout (WRITE-side helpers stay inline; heavy modals stay inline; Chain C deferred). ✓
- §10 Definition of done → Task 10 step 5 (final summary). ✓

**2. Placeholder scan:**
- `<<COMMIT_SHA>>` is an intentional placeholder backfilled in Task 10. Not a plan failure.
- Per-view callbacks list in Task 5 sub-steps T-2/R-2/G-2/Br-2/H-2 references "Phase B agent's return list" — that's correct since Phase A.2 audit + Phase B return enumerates them. The template shows EXAMPLE common callbacks for each view as comments. Not a placeholder; it's a hint plus the actual list comes from the agents.
- No "TBD", "TODO", "implement later", "etc fix it" patterns. ✓

**3. Type consistency:**
- Domain export names: `briefDomain`, `habitsDomain`, `goalsDomain`, `todosDomain`, `reflectDomain`, `calendarDomain` — used consistently. ✓
- View export names: `BriefView`, `HabitsView`, `GoalsView`, `TodosView`, `ReflectView`, `CalendarView` — used consistently. ✓
- View prop signature `{ data, dispatch, deviceProfile, callbacks }` — used consistently in Tasks 1, 3, 4, 5. ✓
- SHELL_VERSION `"v75"` — used consistently in Task 6 step 1, Task 7 step 2. ✓
- File paths use `lib/domains/<name>.js` and `lib/views/<Name>View.js` consistently. ✓
