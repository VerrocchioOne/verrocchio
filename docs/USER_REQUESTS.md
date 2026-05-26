# Verrocchio — User Requests Log

> Running log of every user request the user has typed in chat, with a contextualized reworded summary for fast reference when debugging or building new features.
> **Newest first.** "Status" reflects current state.

---

## How to use this file

1. **Before debugging a feature**: search this file for the original user intent + any related supersedes.
2. **Before shipping a new feature**: scan recent requests for context; the user often layers multiple asks on the same surface.
3. **When a new request comes in**: append it to the top with a contextualized summary, then check whether it supersedes or refines any prior request.
4. **Recent requests supersede older requests** on the same topic — flag the older one as SUPERSEDED with a pointer to the newer.

## Status legend

- SHIPPED — code is live on verrocchio.app (cite commit / SW version)
- IN-PROGRESS — currently being worked on
- OPEN — acknowledged but not yet started
- DEFERRED — explicitly delayed by user
- SUPERSEDED — replaced by a later request
- DROPPED — withdrawn by user

## Durable operating rules (user-declared)

These are not feature requests — they are process directives that govern HOW work is done.

- **Bugs before features**: When the user reports a bug AND a feature in the same message (or has both in backlog), fix the bug first. Memory: `feedback-debug-first`.
- **Out-of-batch ideas go to todo list**: When the user sends a message that doesn't pertain to the current ongoing batch of edits, ADD IT TO THE TODO LIST rather than acting on it immediately.
- **Maintain this file**: Every user request typed in chat gets appended here with a contextualized rewording.

---

## 2026-05-26 — Multi-slot card labels must follow visual order

### Verbatim
"for the multi-slot habits, make sure the naming convention is correct. i.e., the first card should be 1/y, the 2nd card 2/y, so on and so forth. ANd the cards should rename based on their order. That way you cant have a 3/4 card infront of a 1/4 card."

### Contextualized summary
The `(Part N/M)` badge on multi-slot habit cards was reading N from `meta.arrayIdx + 1` — the index in the stored `slotSections` array. Drag-reorder uses `slotOrders[arrayIdx]` to change visual position without touching `arrayIdx`, so a card with arrayIdx=2 could be dragged to the top of the section and still display "(Part 3/4)" sitting above "(Part 1/4)". Fix: after `groupedH` sorts each section's rows visually, walk all groups in SECTIONS display order and stamp a per-habit `displayPartNum` (1, 2, 3, ...) on each slot row's `_renderSlotMeta`. The renderer in `lib/views/HabitsHabitCard.js` now reads `meta.displayPartNum` (with `arrayIdx + 1` fallback). Total `M` stays `slots.length`. Slot identity (`slotId = "<section>:<localIdx>"`), persisted slotCompletions keys, and the storage-order semantics of `slotIdForIndex`/`slotRowsFor` are unchanged — this is render-only renumbering. Unit tests: 45/45 pass. E2E: 21/21 desktop pass. **Status:** IMPLEMENTED — visual verification pending (drag a slot in a multi-slot habit and confirm the badge re-numbers).

---

### Weekly debug pass — 2026-05-25

5 investigations completed. (1) icalendar MODULE_NOT_FOUND (recurring) — **environment workaround** (npm install); permanent fix requires user to invoke `/session-start-hook` once to install the auto-install hook. (2) getFreq/isHabitDueOn three-way duplication — **fixed** (extracted to `lib/constants.js`, inline definitions in `index.html` replaced with tombstone comments, 20 regression tests added including all §audit-P1 gate scenarios; commit `8f4cf6a`). (3) §5.2 same-section multi-slot reorder — **triage updated**: prior entry was written against SortableJS (removed v71); v72-v74 button-based reorder (`moveRowWithinSection`/`slotOrders`) eliminates the original failure mode by design. (4) Weekly Review hour gate in BriefView — **triaged** (confirmed fixed since 2026-05-13 at `BriefView.js:897-898`; no regression). (5) `habitsDueOnDay` startDate gate — **triaged** (confirmed correct at `calendar.js:151`; lexicographic YYYY-MM-DD comparison matches §audit-P1 semantics).

---

## 2026-05-23 — 1000-line hard cap rule

### Verbatim
"Make a master rule for this app: no individual file should exceed 1000 lines of code and every file should aim to be under 500 lines."

### Contextualized summary
Establishes a project-wide file-size rule: hard cap 1000 LOC, soft target 500 LOC. Added to `CLAUDE.md` and saved to project memory. Forces follow-up splits on every file currently over the cap, including the just-shipped v76 `lib/views/HabitsView.js` (3,104 lines), `lib/views/BriefView.js` (1,072), and most critically `index.html` (~30k lines). Each violator gets its own decomposition plan (see DEBUG_LOG §13.5).

---

## 2026-05-23 — v76 ship (HabitsView full extraction)

### §13.4b — HabitsView full extraction — SHIPPED v76

**Verbatim:** "extract it all. continue it all" (after the v75 ship landed HabitsView as a PARTIAL stub).

**Contextualized summary:** Closed the §13.4a gap. The Habits render block (originally inline at index.html L15685-L18584, ~2900 lines) now lives in `lib/views/HabitsView.js` (3,104 lines — a 1000-line-rule violation; documented as a follow-up split). Strategy was tree-for-tree extraction: the body was copied verbatim and a destructuring prelude re-binds every App-scope identifier the body references (constants HT/IMP/SECTIONS, pure helpers like `getStreak`/`isDone`/`dk`, refs, derived memos, components like `HabitCardShell`) so render output is bit-identical. App still owns the ~40 useState hooks driving the filter pills, reorder UX, swipe gestures, and inline new-habit form — they're passed through via `callbacks` with a single `helpers` sub-bag.

Background subagent `ad391f89b8641eaa4` did the extraction in the prior session but hit the user's account session limit before it could verify or commit; this session picked up its uncommitted work, ran 259/259 unit + 19/19 desktop E2E (including the 4 habit-reorder-layered-drop tests that pin v72-v74 semantics), bumped SHELL_VERSION v75 → v76, snapshotted `archive/index.v76.html`, and shipped.

**Follow-up plans needed (now elevated by the 1000-line rule):**
- Split `lib/views/HabitsView.js` (3104 LOC) into sub-components: HabitCard, HabitRow, ReorderToolbar, NewHabitForm, FilterPills.
- Split `lib/views/BriefView.js` (1072 LOC) and `lib/views/GoalsView.js` (955 LOC).
- Dead-code cleanup of the 6 `false && (() => {...})()` neutralized inline view bodies in index.html (~5000 lines deletable; brings index.html closer to manageable).
- Long-term: split index.html itself by extracting App() sub-systems (settings, AI sidebar, modals, onboarding) into their own modules.
- Lift Habits view-local state (reorderMode, filter pills, new-habit form) out of App and into the view module.

**Cross-references:** SW v76, snapshot `archive/index.v76.html`, handoff at [docs/handoffs/HANDOFF_view-extraction-v75-shipped_2026-05-23.md](../handoffs/HANDOFF_view-extraction-v75-shipped_2026-05-23.md). Commits: `055fa9b` (WIP HabitsView extraction landed by background agent) → finalized by the v76 ship commit (this one) replacing the WIP marker.

---

## 2026-05-23 — Session-limit resume automation

### Verbatim
"create a automatic script such that when i hit my session limit that you check in an hour later to resume the work. That way I don't have to come back to my computer or wake up in the middle of the night if my limit is hit"

### Contextualized summary
Built a paired automation: (a) in-session CronCreate cron that fires hourly while Claude is open, reads the latest handoff, runs the verify→cleanup→ship sequence, self-deletes when the work is done; (b) `scripts/schedule-resume.ps1` cross-session helper that uses Windows Task Scheduler to fire a toast notification after a configurable delay (default 1h) pointing at the latest `HANDOFF_*.md`. The script handles the case where Claude is fully closed (the cron only fires while the REPL is alive). Pattern saved to project memory at `~/.claude/projects/c--Users-User-Developer-verrocchio/memory/workflow_session_resume_automation.md` so future sessions discover and reuse it.

---

## 2026-05-23 — v75 ship

### §13.4a — Decompose index.html into 5 view modules + 6 domain modules — SHIPPED v75 (Habits view deferred)

**Verbatim:** "do all  of them today" (in response to a Calendar-only pilot proposal for the Approach B view-extraction pattern).

**Contextualized summary:** Decomposed 5 of 6 top-level views (Brief / Goals / Todos / Reflect / Calendar) from index.html's monolithic App() function into per-view modules with a fixed `{ data, dispatch, deviceProfile, callbacks }` prop signature. Created `lib/domains/*.js` (pure READ derivations + curried writes) + `lib/views/*View.js` (React components, no JSX) + `tests/domains/*.test.mjs` (121 new pinned tests; 259/259 total pass). HabitsView came back PARTIAL — the ~40 App-scope useState hooks driving the recently-shipped v72-v74 select-then-act reorder UX could not be cleanly extracted in one pass; Habits tab keeps rendering inline. All 6 domain modules ship regardless (Brief + Calendar use habits domain for `dueToday`/`groupedBySection`). Two integration bugs surfaced + fixed in Phase D: top-level `_dk`/`_todayKey` collision between brief.js and calendar.js (classic scripts share top scope) wrapped both in IIFEs; CalendarView initial state had to read from `callbacks.initialView`/`initialFocus` so App's `openCalendarMonthForTest` hook could prime it.

Pattern doc at `docs/superpowers/patterns/view-extraction.md` — every future view extraction (including the deferred Habits view) follows it. Unblocks Chain C (Widgets / Siri / HealthKit) which needs clear per-view data boundaries; also unblocks any other TODO §5/6/7/9 work since each view's render tree is now hold-able in one agent's context.

**Follow-up plans needed:**
- Habits view extraction (dedicated plan; ~40 useState migration)
- Dead-code cleanup of `false && (() => {...})()` neutralized inline view bodies in index.html (currently kept for atomic-ship safety; ~5000 lines deletable)
- BriefView omits "Review Goals" card + bottom calendarCard peek (intentional trims; reinstate if user surfaces a regression)

**Cross-references:** SW v75, snapshot `archive/index.v75.html`, spec at [docs/superpowers/specs/2026-05-23-view-extraction-all-six-design.md](../superpowers/specs/2026-05-23-view-extraction-all-six-design.md), plan at [docs/superpowers/plans/2026-05-23-view-extraction-all-six.md](../superpowers/plans/2026-05-23-view-extraction-all-six.md), DEBUG_LOG entry 2026-05-23 §13.4a. Commits: `9f9c585` (foundation), `f3007ca` (spec+plan), `0d36f10` (Phase B), `2280a02`/`1dbbc1a`/`2dc500e`/`2cd4536`/`61f4bd2` (Phase C per-view integrations), `2414de1` (SW+build allowlist), `ccd42eb` (Phase D fixes).

---

## 2026-05-18 — Weekly debug pass

### Weekly debug pass — 2026-05-18

5 investigations completed. Investigated: (1) icalendar.test.mjs MODULE_NOT_FOUND — **fixed** (npm install; ical.js was in devDependencies but node_modules missing; 24 tests now green); (2) mergeRemoteWithLocalToday §audit-P1 slot-loss fix — **fixed** + regression tests added (extracted to lib/merge.js, 14 pinned-behaviour tests, commit `48b156e`); (3) allYesterdayHabitsReviewed gate §audit-P1 fixes — **triaged** (code fix confirmed, regression test blocked by App() closure coupling, defer to OSS-port extraction); (4) §5.2 same-section multi-slot reorder no-op — **triaged** (active bug confirmed, same-section slot drag snaps back on re-render, fix requires superpowers:writing-plans session); (5) §7.1 Reflect past entries not surfaced — **triaged** (already fixed 2026-05-15, code confirmed at index.html:19303).

---

## 2026-05-15 — Today's session

### #62 — Hide target/unit badges in reorder mode — SHIPPED v59

**Verbatim:** "when in sortable / organizer mode there shouldn't be badges showing unit and target counts"

**Contextualized summary:** The Yes/No completion pill (e.g. "Yes") and the target+count chip (e.g. "≥ 0/30 min", "≥ 0/8 cups") cluttered habit cards during reorder. Added `!reorderMode &&` gates to both render conditions at `index.html:17866` and `:17894`. Cleaner drag surface.

**Cross-references:** commit `f65881d`, SW v59.

---

### #61 — Strip dead drag handle blocking Sortable — SHIPPED v58

**Verbatim:** "its still fucked up"

**Contextualized summary:** Root cause of post-Sortable-swap drag still failing: the subagent that did the swap added the library + useEffect but **left the entire 158-line `hrow-drag-handle` element intact** — `position: absolute; inset: 0` covering the whole card with `onPointerDown` calling `stopPropagation()` + `preventDefault()`. Sortable was instantiated and listening, but never received a single touch event because the dead hand-rolled handle ate them all first. Two drag systems fighting; the broken one won. Fix: stripped the handle's event handlers + handler body; kept a tiny visual-only ≡ glyph (32px wide, right edge, `pointerEvents: none`).

**Cross-references:** commit `70537ce`, SW v58.

---

### #60 — Diagnostic clarifying question (drag refresh + symptom + screenshot) — RESOLVED

**Verbatim:** (Asked the user via AskUserQuestion after multiple iterative fixes failed; user replied: refreshed to v57, drag still lags/jumps, layered habits broken.)

**Contextualized summary:** Used AskUserQuestion to get specific symptom info instead of guessing. Result: led to discovering #61 (dead handle).

---

### #59 — Use SortableJS for drag-and-drop — SHIPPED v57

**Verbatim:** "https://github.com/sortablejs/Sortable use this"

**Contextualized summary:** After 4 iterative hand-rolled drag fixes still failed on iOS Safari, user directed to use SortableJS (battle-tested library with proven iOS touch handling). Refactor: loaded `sortablejs@1.15.6` from unpkg CDN (already in service worker's `RUNTIME_CACHEABLE_HOSTS`); deleted the entire hand-rolled drag pipeline (~322 lines: `reorderDragRef`, `reorderDropPreviewRef`, `reorderDragTick`, `startReorderAutoScroll`, `resolveReorderDrop`, the window-level pointer listener installation, the drop-preview indicator overlay); replaced with a single `useEffect` keyed on `[reorderMode, data.habits]` that instantiates `new Sortable(gridEl, { group: "habits", forceFallback: true, scroll: true, ... })` on each `[data-sec] .habit-grid` container. `onEnd` callback reads `evt.item.data-habit-id`, `evt.item.data-slot-id`, walks up to find `data-sec` for the target section, and calls the existing `commitHabitReorderDrop` / `commitSlotReorderDrop` helpers. The data-model side is unchanged — only the gesture pipeline swapped. Inert `useRef(null)` declarations kept for `reorderDragRef` + `reorderDropPreviewRef` + `reorderDragTick` because the render code still references them in short-circuit-protected positions; cleanup is a follow-up.

**Trade-off accepted:** Layered/concurrent cohorts via drag-edge detection is GONE. Drop = sequential insertion only. If user wants layering back, we'll add a modal/button-based path.

**Cross-references:** commit `a236d66`, SW v57. Supersedes the v54/v55/v56 hand-rolled-drag fix attempts.

---

### #58 — Window pointer listeners replace setPointerCapture — SHIPPED v56 then SUPERSEDED by #59

**Verbatim:** "still doesn't work"

**Contextualized summary:** Replaced `setPointerCapture` with window-level `pointermove`/`pointerup`/`pointercancel` listeners installed at pointerdown. Theory: iOS Safari silently drops pointer capture when captured element's ancestor receives a CSS transform mid-gesture. Fix shipped as v56 but didn't fully resolve the issue — superseded by the SortableJS swap (#59).

**Cross-references:** commit `066fa71`, SW v56.

---

### #57 — Shift habit cards left in reorder mode for scrollbar space — SHIPPED v55

**Verbatim:** "when organizing the habit cards, they should shift to the left that way the scroll bar has more space on the right"

**Contextualized summary:** Added `paddingRight: reorderMode ? 28 : 0` (+ 0.18s transition) to the `.habit-sections-grid` wrapper. All section columns slide left as a unit when entering reorder mode, leaving a 28px gutter on the right for the scrollbar / thumb scroll on iOS.

**Cross-references:** commit `fcff142`.

---

### #56 — Deploy 3 bots to fix the issues — RESOLVED (3 bots dispatched)

**Verbatim:** "deploye 3 bot to fix this issues"

**Contextualized summary:** Dispatch 3 parallel subagents to fix the drag-doesn't-work bug + shift-cards-left feature. Split: Bot 1 (diagnose + fix drag bug), Bot 2 (implement shift-left), Bot 3 (independent second-opinion audit on Bot 1's fix).

**Action:** All 3 returned. Bot 1 found H1 root cause (render storm). Bot 2 shipped shift-left. Bot 3 confused Bot 1 vs Bot 2 attribution but flagged useful edge cases (filter-disabled-Organize-button, indicator pointerEvents, iOS pointer capture flakiness).

---

### #55 — Drag-and-drop still doesn't work for organize feature — SHIPPED v55

**Verbatim:** "drag and drop still doesn't work for the organize feature."

**Contextualized summary:** After v54's dragOffsetY auto-scroll fix, the drag completely stopped working on iOS. **Root cause (Bot 1's diagnosis):** the v54 fix added `setReorderDragTick(t => t + 1)` inside the auto-scroll rAF loop, which forced a full App re-reconciliation every 16ms during auto-scroll. On iOS the App component is ~25k lines and exceeds 16ms render budget, so the main thread saturated and queued pointermove/pointerup events never reached the drag handle — drag appeared frozen. Secondary issue: the scroll-to-top exit listener fired during auto-scroll-induced scrolls, killing reorderDragRef mid-drag.

**Fix:** (1) replace direct `setReorderDragTick` with the same `_rafScheduled` coalescing pattern pointermove already uses (at most one App re-render per animation frame regardless of how many rAF sources fire); (2) skip scroll-to-top exit when `reorderDragRef.current` is truthy.

**Cross-references:** commit `fcff142`, SW v55. Supersedes the v54 dragOffsetY-only fix.

---

### #54 — Maintain a running requests log (this file) — IN-PROGRESS

**Verbatim:** "when i make a request / type a message - create a running file of all requests and layered into it your contextualized reworded summary of my request, that way you will have one location to efficient reference when debugging and for developing new features in the context of other requests"

**Contextualized summary:** Create `docs/USER_REQUESTS.md` (this file). Every user message becomes an entry: verbatim quote + my rewording + status + cross-references.

---

### #53 — Audit + test all new code shipped over the past week — IN-PROGRESS

**Verbatim:** "compile a list of a every edit I have requested over the past week. recent requests supersede older requests. Related to these requests, deploy subagents to audit and text every aspect of new code shipped"

**Contextualized summary:** Two deliverables: (1) this requests log; (2) parallel audit subagents covering each shipped feature area. 5 audits dispatched: A (reorder drag), B (multi-slot lifecycle), C (Edit Habit modal), D (persistence + filters), E (AI briefing + history).

**Status:** Audits returned partial findings before 600s stream watchdog stalled them. Key findings captured below.

---

### #52 — Drag-and-drop is still very glitchy — IN-PROGRESS (Audit A pinpointed root cause)

**Verbatim:** "the drag and drop is still very glitchy"

**Contextualized summary:** On iOS Safari / Capacitor, dragging multi-slot slot cards has flickering preview line, wrong drop landings, card lag.

**Audit A finding (P1):** `dragOffsetY = currentY - startY` uses `clientY` for both. During auto-scroll, the pointer's `clientY` stays the same but the page scrolls underneath, so the card's translateY value should compensate for `window.scrollY` delta to keep the card glued to the pointer's DOCUMENT position. Currently it sticks to viewport position, which makes the card "lag" visually as the page scrolls. Fix: store `startScrollY = window.scrollY` on pointerdown, then compute `dragOffsetY = (currentY - startY) + (window.scrollY - startScrollY)`.

---

### #51 — Multi-slot cards should work independently — SHIPPED v52

**Verbatim:** "each mult-slot habit's card should work independently of the others."

**Contextualized summary:** Marking one slot done should turn only that slot's card green. Fix narrowed the rollup fallback to fire only when slotCompletions[date] is entirely empty (migration case).

**Cross-references:** commit `61d6c4d`.

---

### #50 — Multi-slot cards should say "(Part N/M)" — SHIPPED v52

**Verbatim:** "for a multi-part habit it should say '(Part x/y)' the first one should say 1/2, then next one 2/2"

**Contextualized summary:** Replace "(x/y)" progress badge with per-card slot identifier. `partNum = arrayIdx+1`, `partTotal = slotSections.length`.

**Cross-references:** commit `61d6c4d`.

---

### #49 — "Part 1/4 #1" is redundant — SHIPPED v53

**Verbatim:** "It doesn't needs ot say Part 1/4 #1; that's redundant"

**Contextualized summary:** Remove the older "#N" suffix; (Part N/M) badge already disambiguates.

**Cross-references:** commit `6eb8d66`.

---

### #48 — Multi-slot habits move together when organizing — SHIPPED v53

**Verbatim:** "but for organizing multislot habits, they still move together"

**Contextualized summary:** Slot-aware drag: dragRef carries `slotId`, `isBeingDragged` matches habitId AND slotId, `commitSlotReorderDrop` rewrites `slotSections[arrayIdx]` for cross-section moves with completion-history rekey.

**Cross-references:** commit `6eb8d66`. User re-reported as glitchy in #52 (likely root cause was auto-scroll dragOffsetY).

---

### #47 — Drop preview line during drag — SHIPPED v52

**Verbatim:** "while dragging a habit a line should appear that shows you precisely where that habit card will land, so you aren't suprised it is oging to be layered ot next or first, etc."

**Contextualized summary:** Live indicator showing exact landing position. Horizontal pill between rows; vertical bar on layered edge. CSS transition for smooth morphing.

**Cross-references:** commit `61d6c4d`.

---

### #46 — Per-user subdomain (my.verrocchio.app/<username>) — DEFERRED to LAST

**Verbatim:** "instead of verrocchio.app/account each user should have a domain that says 'my.verrocchio.app/[username]'" + "the per-user subdomain should be one of the last to-dos on the app"

**Contextualized summary:** Replace `/account` URL pattern with per-user subdomain. Substantial infra (DNS, auth, routing). Explicitly deferred.

**Cross-references:** Memory `project-subdomain-deferred`.

---

### #45 — Operating rule: debug current features before adding new — RECORDED

**Verbatim:** "Make a note for all future tasks that the priority should always be to debug current features in the current app ahead of adding new functionality unless it is explicitly told to do so."

**Cross-references:** Memory `feedback-debug-first`.

---

### #44 — Fix the multi-slot +/− stepper — SHIPPED v50

**Verbatim:** "the plus minus button for multislot habits doesn't wor"

**Contextualized summary:** Stepper +/− didn't respond. Root cause: rendered in Target & Unit mode where + was disabled. Fix: Timing toggle gates stepper behind explicit Multi mode.

**Cross-references:** commit `0a19517`.

---

### #43 — Add Time-of-day vs Multiple-times-a-day toggle in Edit Habit — SHIPPED v50

**Verbatim:** "In the edit habit card modal, after the habit is determined whether or not it is yes, no, or a target and unit habit, and the units are created and the goal is linked, there should be an option to pick either time of day habit or multiple time a day. It's time of day you simply assign it to morning, afternoon, evening, daily completion, or a void. But if if you click the multi time option, then you have the option to add multiple slots in the morning, afternoon, or evening."

**Contextualized summary:** Timing section with "Time of day" / "Multiple times a day" pill toggle. Single mode shows section dropdown; multi mode shows stepper.

**Cross-references:** commit `0a19517`.

---

### #42 — Operating rule: out-of-batch ideas go to todo list — RECORDED

**Verbatim:** "For future work, not that I will provide ideas and thoughts that do that pertain to on ongoing batch of edits. Take these other ideas and tasks and add them to the todo list"

---

### #41 — Refresh AI briefing button + gate until yesterday reviewed — SHIPPED v48

**Verbatim:** "there shoud be a refresh AI briefing button. The AI briefing shouldnt be generated until each habit from the day before was marked either complete or missed"

**Cross-references:** commit `13d0662`. Helper `allYesterdayHabitsReviewed()`.

**Audit E partial findings:** (1) Gate doesn't filter child habits (parentId set) — could double-count parent + children if a parent has sub-habits. (2) `isHabitDueOn` is purely frequency-based, doesn't check startDate — a habit with `startDate = today` gets checked against yesterday's empty completions → gate stays closed indefinitely.

---

### #40 — Urgent to-dos on Home are stale vs To-Dos tab — SHIPPED v48

**Verbatim:** "what shows up as urgent to-dos on the home screen is stale compared to what is in the to-do page"

**Cross-references:** commit `13d0662`.

---

### #39 — Per-habit version timeline + streak prompt + completion editor — SHIPPED v48

**Verbatim:** "Within the my profile page, with my history, there should be a way to look at a detailed timeline of a goal or habit. For example, I set a goal called run a marathon in under 4 hourshours. The original habit card upgrade that is linked to that goal is called run for one hour in the morning. But later on, I move it to run one hour in the afternoon. And then after that, I make it run forty five minutes in the afternoon. That goal card should have a history that shows that natural progression. So I can look at the version history of a goal or habit over time. And when you're checking off whether or not a habit has been done, or not - just because the parameters of what defined a complete versus a miss changed over time. The streak should still remain intact."

**Contextualized summary:** (1) Per-habit version timeline drill-in in My Profile → History. (2) "Streak?" prompt on Edit Habit save (Keep/Reset/Archive-and-create). (3) Past-completions editor in Edit Habit modal.

**Cross-references:** commit `13d0662`.

**Audit C partial finding:** `commitStreakArchiveAndCreate` doesn't call `touchFeature("habit.subunits")` or `touchFeature("habit.create")` — telemetry inconsistency for the archive-and-new path.

---

### #38 — Per-completion timestamps + editable later — SHIPPED v48 (bundled with #39)

**Verbatim:** "The swipe to complete should have a time stamp associate with each habit completion, then later on in another place within the app one should be able to see what the time stamps were and adjust them so that the AI can better learn how to optimize your routine."

---

### #37 — "1 then 2" — pick order — RESOLVED

**Verbatim:** "1 then 2"

**Contextualized summary:** Pick version-history first, then reorder-mode.

---

### #36 — Ship — SHIPPED v45+

**Verbatim:** "ship" (multiple times)

---

### #35 — Don't auto-sort habits in reorder mode — RESOLVED

**Verbatim:** "I don't want auto sort for organizing habits"

---

### #34 — Tips & Reminders must exclude future habits/goals — SHIPPED v45

**Verbatim:** "Tips and reminders should have nothing to do with future goals / habits --> should only be current goals and habits. future goals should only appear on the goals tab, and future habits on the habits tab and neither on the to-do tab"

**Contextualized summary:** isFutureHabit/Goal helpers filter Tips & Reminders, daily widgets, Home aggregations.

---

### #33 — Update organization tool: drag-drop vs ordinal — RESOLVED via #31/#32

**Verbatim:** "Also the organization tool needs to be updated. what can we do instead of up and down arrows? Drag and drop, ordinal entry?"

---

### #32 — Two organization paths are broken — SHIPPED v46 (single path)

**Verbatim:** "Right now there are two ways to organize habits and neither work flawlessly"

---

### #31 — Single org method: 3-line button → drag — SHIPPED v46

**Verbatim:** "I want one organizational method which involved pressing the three line organization button, which then allows you do drag and drop habit cards"

**Cross-references:** commit `205f771`.

---

### #30 — In reorder mode, cards do nothing but move + easy first/last — SHIPPED v46

**Verbatim:** "with the inline reorder, one the three line button is pressed, the habit cards should have not functionality, and can only be moved. It should alwo be easy to move a card to be the first habit or the last habit. Currently there isn't enough space to do so easily"

**Cross-references:** commit `205f771`.

---

### #29 — Auto-scroll during drag near viewport edges — SHIPPED v50

**Verbatim:** "if I hold an habit card at the top or bottom of the screen, the screen should scroll so I can find where Im trying to put that habit card"

**Cross-references:** commit `0a19517`. Helpers `startReorderAutoScroll`, `stopReorderAutoScroll`.

**Audit A finding:** Auto-scroll DURING drag breaks dragOffsetY because clientY stays constant while page scrolls. See #52.

---

### #28 — Drop-to-unlayer + swap left/right within cohort — SHIPPED v50

**Verbatim:** "when a habit card is already layered with other habit cards, it is very difficult to make it unlayered using the drag and drop feature. Also if a habit is paired with another habit, and it is on the right side, i should be able to move it to the left side"

**Cross-references:** commit `0a19517`. Edge ratio 0.25.

---

### #27 — Multi-slot to 12 slots/day with multiple instances per section — SHIPPED v44/v50

**Verbatim:** "I should be able to make a multi slot habit up to 12 individual cards per day. The purpose of the multi-slot habit it to break a large goal e.g., study for 6 hours per day, into more reasonable sized chunks that fit within the context of a daily routine. so I would want to be able to make 4 1.5 study slots (2x morning; 2x afternoon) for example)"

**Contextualized summary:** Expand multi-slot from 3 max to 12. Allow duplicate slotSections entries. Slot ID = "<section>:<localIdx>".

**Cross-references:** commit `8553986` (initial), `0a19517` (Timing redesign).

---

### #26 — Run visual check on all UI fixes — RESOLVED

**Verbatim:** "run a visual check on all UI fixes" + "run the visual check"

**Contextualized summary:** Playwright at desktop + mobile widths. Caught TDZ crash + drag-handle-hidden-by-section-stripe.

---

### #25 — Audit subagents on data-loss + multi-slot bugs — SHIPPED v45

**Verbatim:** "Can you deploy subagents to ensure that all of the changes were made properly? the saving doesn't work propertly, if I sign out and sign in my app usage streak changes, it doesn't remember that I already did morning ritual or that I reviewed tip and reminders alreatdy, or which habit cards I completed. the multi part habit cards don't check off green when completed, the priority stamp overlaps critical parts of the habit cards"

**Contextualized summary:** Three P0 fixes: sign-out flush (data loss), multi-slot green rollup, priority stamp inline.

**Audit D partial finding (P1):** `mergeRemoteWithLocalToday` replaces ENTIRE `[todayK]` slot map with local's. Cross-device updates mid-day to non-overlapping slots get LOST. Should merge per-slot key, not whole map.

---

## Audit Findings Summary (from 2026-05-15 audit pass)

**P1 bugs to fix next:**

1. **Drag auto-scroll vs translateY** (#52): When auto-scrolling during drag, `dragOffsetY = currentY - startY` uses viewport-relative `clientY`, but the page is scrolling under the pointer. The dragged card appears to lag because its visual position is glued to viewport, not document. Fix: capture `startScrollY = window.scrollY` on pointerdown; `dragOffsetY = (currentY - startY) + (window.scrollY - startScrollY)`.

2. **mergeRemoteWithLocalToday slot loss** (#25): Today's volatile-field merge does whole-map replacement on `slotCompletions[todayK]`. If local has `{morning:0: done}` and cloud has `{morning:0: missed, evening:0: done}` from another device, merged = `{morning:0: done}` — cloud's `evening:0: done` is LOST. Fix: per-key merge within `[todayK]` instead of whole-map replace.

3. **AI briefing gate ignores child habits** (#41): Children (`parentId !== null`) are counted in `dueYesterday` even though parent rollup handles them. Could keep gate closed even when parent is reviewed. Fix: exclude `h.parentId != null` from `dueYesterday`.

4. **AI briefing gate ignores startDate** (#41): A habit created today gets checked against yesterday's empty completions → gate stays closed permanently. Fix: also exclude habits where `h.startDate > yesterdayKey` from `dueYesterday`.

**P3 (minor) telemetry inconsistencies:**

- `commitStreakArchiveAndCreate` doesn't fire `touchFeature("habit.create")` for the new habit.

---

## Older / pre-session (from git log)

Highlights from earlier work in the past week (not full verbatim, but contextualized):

- §5.8b multi-slot data model (allow duplicates, slot IDs, migration shim)
- §7.1 Reflect tab Past Entries header + filter-aware empty state
- §11.4 Habit Reports Overview sub-tab
- §10 Version History — initial unified timeline in My Profile → History
- §14.4 AI-personalized tip for Brief tab
- §6 Future Habits drawer (parked flag, no schema rewrite)
- App Store readiness research + Wave 3 ship
- Marketing landing page at /home + apex 302 routing
- Demo accounts trimmed to alex only
- AI proxy deployed to ai.verrocchio.app

---

## Editing rules for this file

- Append new entries at the TOP of "Today's session" (or open a new dated section for new days).
- When a request is shipped, change status to SHIPPED + add the commit hash.
- When a newer request supersedes an older one, mark the older SUPERSEDED with a forward pointer.
- Keep verbatim quotes EXACTLY as the user typed them (typos and all).
- Cross-reference commits, memories, and other request numbers freely.
