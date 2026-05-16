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

## 2026-05-15 — Today's session

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
