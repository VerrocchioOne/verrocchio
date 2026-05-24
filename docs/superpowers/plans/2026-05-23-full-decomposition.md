# Full index.html decomposition — multi-session plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute waves one at a time. Each wave is independently verifiable and shippable.

**Goal:** Reduce `index.html` from ~24,181 lines (post Wave 1) to a thin ~500-line shell that loads `<script src>` tags and mounts React. All app logic lives in `lib/` files of ~200-500 LOC each, never exceeding the 1000-line hard cap (see CLAUDE.md "File-size rule (MASTER)").

**Architecture:** Continue the dual-load pattern (browser `<script>` global + Node CJS export). No build step. No JSX. No UI framework. The pattern doc at `docs/superpowers/patterns/view-extraction.md` is the contract; every new module follows it.

**Tech Stack:** Plain JS, React 18.3 UMD, hand-rolled `React.createElement` calls.

---

## Where we are (2026-05-23 end of session)

- **v75** shipped: 5 of 6 views extracted to `lib/views/*View.js` (BriefView, GoalsView, TodosView, ReflectView, CalendarView).
- **v76** shipped (`8ae2d07`): HabitsView extraction + the 1000-line file-size rule.
- **Wave 1** shipped (`47338d6`): dead-code cleanup removed 5 `false && (() => {...})()` neutralized IIFEs from index.html. Index 30,400 → 24,181 LOC.
- **Wave 2 (A11yDialog extraction)** attempted in this session, **REVERTED** because adding the script tag broke 12 of 20 E2E tests (including unrelated calendar-month-grid and habit-reorder specs). Root cause not yet identified — see the Debug Note below.

## Current violators of the 1000-line rule

| File | LOC | Wave |
|---|---:|---|
| index.html | 24,181 | Waves 3-5 (extract App() sub-systems) |
| lib/views/HabitsView.js | 3,104 | Wave 6 (split into sub-components) |
| lib/views/BriefView.js | 1,072 | Wave 6 |
| lib/views/GoalsView.js | 955 | Wave 7 (over soft target, under hard cap) |
| lib/views/CalendarView.js | 772 | Wave 7 |
| lib/views/TodosView.js | 521 | Wave 7 |

---

## Wave 2 (RE-ATTEMPT): Inline component extractions

Module-scope React components defined inline in index.html. Pull each to `lib/components/<Name>.js` and replace inline with `const Name = window.Name;` alias.

**Targets (line ranges relative to post-Wave-1 index.html):**
- `A11yDialog` (L2740-L2810, ~73 LOC) — modal wrapper
- `Sparkline14` (L2816-L2842, ~27 LOC) — habit completion mini-chart
- `HabitCardShell` (L3493-L3495, 3 LOC) — memo wrapper around `renderImpl`; small but heavily referenced
- `BackgroundAudio` (line TBD) — `<audio>` + MediaSession bridge
- `ErrorBoundary` (line TBD) — React error boundary used at the root render

**Debug Note for re-attempt:** The 2026-05-23 attempt at extracting `A11yDialog` alone passed unit tests but failed 12 of 20 E2E tests including non-dialog tests (calendar-month-grid x7, dialog-real-app x4, habit-reorder x1). All visible state looked correct: `window.A11yDialog` was a `function`, `window.verrocchioDialog` was an `object`, `React.createElement(window.A11yDialog, ...)` returned a valid element, no PAGEERROR or console error fired. The dialog DOM element simply didn't render when state was set. Investigation hypotheses for next session:
- **Service-worker stale-cache hypothesis** — re-test with a fresh browser context that bypasses SW caches.
- **Hook capture timing** — the IIFE captures `R = window.React` at script-load time; if the React UMD's `globalThis.React` assignment is somehow delayed, R is null. Verify with a `console.log("R loaded:", typeof R)` inside the IIFE.
- **Render race** — the body inline script's `const A11yDialog = window.A11yDialog;` ran before the React render. If the script ran during a partial-load state, the alias could capture undefined. Add a defensive `if (!window.A11yDialog) throw new Error("A11yDialog not loaded")` at the alias to catch this.
- **Wider test breakage** — calendar/habit-reorder failures suggest the regression touches App()'s render tree, not just A11yDialog. Possibly a side-effect of adding ANY new `<script src>` in head changes a load-order assumption deeper in the app. Bisect: try extracting `Sparkline14` (27 LOC, trivial) FIRST; if that also breaks tests, the script-tag addition itself is the regression vector, not the A11yDialog code.

**Per-component task pattern:**

- [ ] **Step 1: Bisect probe.** Add only `<script src="./lib/components/Sparkline14.js">` to head, no body edit. Run E2E. If 20/20 green → script tag addition is safe; proceed. If <20 → debug load-order.
- [ ] **Step 2: Write `lib/components/<Name>.js`** — IIFE wrapper, dual-load (window global + CJS export), comment header citing original line range.
- [ ] **Step 3: Add `<script src>` tag** in head BEFORE the domain modules (so views can use the component).
- [ ] **Step 4: Replace inline definition** with `const Name = window.Name;` alias at the SAME line range. Body comment cites the extraction.
- [ ] **Step 5: Verify** `npm run test:unit && npm run test:e2e --project=desktop`. Must be 20/20.
- [ ] **Step 6: Commit** with `refactor(components): extract <Name> to lib/components/<Name>.js (Wave 2)`.

---

## Wave 3: Extract App() constants & pure helpers

Constants and pure helpers currently inside `function App() { ... }`. These are App-scope closures but have no closure dependency — they only use other constants/helpers. Lifting them to module scope (or `lib/constants.js` / `lib/helpers.js`) is a mechanical move.

**Targets (likely at module scope or top of App()):**
- `HT` (habit types), `IMP` (importances), `SECTIONS`, `FREQ`, `DURS`, `DUR_MIN/MAX/STEP`, `IS`, `S`, `AB` → `lib/constants.js`
- `dk(d)`, `tk()`, `dkTime`, `tkTime`, `parseClock`, `pastDays(n)`, `fmtDur(min)`, `effDur(h)` → already in `utils.js`; verify nothing else has been added to App that should move there

**Per-target pattern:** identical to Wave 2 (extract → script tag → alias → verify → commit).

Estimated index.html reduction: ~200-400 LOC depending on what's actually inline.

---

## Wave 4: Extract App() sub-systems (the big leverage)

These are the chunks that actually shrink index.html. Each sub-system is hundreds to thousands of lines of inline App() body.

**Candidate sub-systems (need brainstorm to refine boundaries):**
- **Settings tab** (theme, dark mode, profile, preferences, demo mode toggle) → `lib/views/SettingsView.js`
- **Header / nav** (top bar, profile pill, tab switcher, scroll behavior) → `lib/views/Header.js`
- **AI sidebar** (coach context, AI proxy interactions, brief generation) → `lib/views/AISidebar.js` + `lib/domains/ai.js`
- **Modal stack** (confirmWipe, confirmDeleteAcct, voiceCapture, showJournalDisclaimer, showAchievements, addCatModal, completeGoalModal, etc.) → `lib/modals/<Name>.js` (one per modal)
- **Onboarding wizard** (welcome modal, tour, first-habit flow) → `lib/views/Onboarding.js`
- **Auth/login surface** (sign-in form, magic-link entry, demo personas) → `lib/views/AuthSurface.js`
- **Backup/restore** (export, import, account deletion) → `lib/domains/backup.js`
- **Social / partners** (sharing, accountability links) → `lib/views/Social.js`

**Per-sub-system process:**
1. **Brainstorm + spec** the sub-system boundary. What state does it own? What does it need from App? What does App need back?
2. **Plan** the extraction following the FROZEN prop signature `{ data, dispatch, deviceProfile, callbacks }` plus a `helpers` sub-bag for closure-bound predicates.
3. **Subagent-driven execution** — one agent per sub-system, in parallel where possible.
4. **Integration commit** — wire the view into App() with the standard call-site pattern. Use `false && (() => {...})()` neutralization for the old inline body; add a Wave 4.X cleanup commit per sub-system.
5. **Verify** unit + E2E + browser smoke.
6. **Ship** as `feat(views): extract <SubSystem> (Wave 4.<N>)`.

Estimated index.html reduction per sub-system: 500-3000 LOC. Cumulative across all sub-systems: 10,000-15,000 LOC.

---

## Wave 5: Re-split oversized lib/views modules

After Wave 4, some view modules may still be over the 1000-line cap. Per-view split plan:

**HabitsView (currently 3,104 LOC):**
- `lib/views/habits/HabitsShell.js` — top-level layout, section grid, banner, IIFE delegation (~500 LOC)
- `lib/views/habits/HabitRow.js` — per-habit row UI (~600 LOC)
- `lib/views/habits/ReorderToolbar.js` — select-then-act reorder UX (~400 LOC)
- `lib/views/habits/NewHabitForm.js` — inline add-habit form (~600 LOC)
- `lib/views/habits/FilterPills.js` — importance / goal / frequency / duration pill bar (~500 LOC)
- `lib/views/habits/FutureDrawer.js` — future-habits drawer (~300 LOC)

**BriefView (currently 1,072 LOC):**
- `lib/views/brief/BriefShell.js` (~500)
- `lib/views/brief/HomeCards.js` (~500)

**GoalsView (955), CalendarView (772), TodosView (521):**
- Single split each: shell + sub-component.

---

## Wave 6: Final pass — index.html slim

After Waves 2-5, index.html should be ~3,000-5,000 LOC. Final cleanup:
- Audit remaining inline App() code. Is there a small App() shell + a few helpers? Move helpers to `lib/app/<name>.js`.
- Extract the giant useState declaration block (~100 hooks) to a custom hook `useAppState()` in `lib/state/useAppState.js`.
- Extract the giant useEffect block to `lib/state/useAppEffects.js`.
- Target final index.html: ~500 LOC = HTML skeleton + ~50 script tags + tiny bootstrap script (`const root = ReactDOM.createRoot(...); root.render(React.createElement(App));`).

---

## Definition of done

- `wc -l index.html` ≤ 1000 (target: ~500).
- All `lib/*.js` and `lib/**/*.js` ≤ 1000 LOC each (target: 200-500).
- `npm run test:unit` 259+/259+ green.
- `npm run test:e2e --project=desktop` 20+/20+ green.
- Browser smoke for all 6 tabs (brief, habits, todos, reflection, goals, calendar) PLUS settings, onboarding, AI sidebar.
- iOS Capacitor smoke (`npm run cap:sync && npm run cap:open` → load on simulator).
- SHELL_VERSION bumped, archive snapshot created, DEBUG_LOG + USER_REQUESTS appended.

## Risks & blockers

- **Load-order regression** when adding new `<script src>` tags (the Wave 2 A11yDialog incident). Mitigation: bisect-probe each new tag with a trivial-content file first.
- **Hidden closure dependencies** when extracting App() sub-systems. Many hooks/refs/setters look standalone but are actually used by other inline render paths. Mitigation: grep the candidate identifiers before/after each move.
- **Test count drift** — adding extraction tests is good; losing existing tests is bad. After each commit run the full suite and verify count doesn't drop.
- **iOS Capacitor breakage** — `cap sync` copies `dist/`. If new files aren't in `scripts/build-dist.mjs` FILES allowlist, they don't make it to the iOS shell.
- **Session-limit hits during long waves** — the cron + `scripts/schedule-resume.ps1` automation (see `feedback-session-resume-automation` memory) handles this.

## Quick start for the next session

```bash
cd c:/Users/User/Developer/verrocchio
git log --oneline -5
# expect: HEAD = 47338d6 (Wave 1 dead-code cleanup) or later
git status -s
# expect: clean except for ?? karpathy-CLAUDE.md (user draft, leave alone)

# Read the master rule
sed -n '/^## File-size rule/,/^## Quick commands/p' CLAUDE.md

# Read this plan
cat docs/superpowers/plans/2026-05-23-full-decomposition.md

# Read the existing pattern
cat docs/superpowers/patterns/view-extraction.md

# Verify baseline
npm run test:unit && npx playwright test --project=desktop
# expect: 259/259 + 20/20 green

# First action: Wave 2 bisect probe (extract Sparkline14, 27 LOC, see if script-tag addition is the breakage vector)
```
