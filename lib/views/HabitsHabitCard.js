// lib/views/HabitsHabitCard.js
//
// Habit-card renderer extracted from HabitsView.js. Defines a factory
// makeRenderCard(deps) -> (habit, opts) => React element so HabitsView
// can keep calling  inside the
// per-section groupedH.map() loop unchanged.
//
// Why a factory rather than a component: the original // closure captured ~70 locals from HabitsView's body (plus per-section
// values like ). Passing those as React props
// to a component for every call would change React's reconciliation
// model. The factory pattern preserves the closure-per-section model
// the inline definition had.
//
// See CLAUDE.md "File-size rule" — this extraction brings
// HabitsView toward the 1000-LOC cap.

(function () {
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

  function makeRenderCard(deps) {
    const d = deps || {};
    // HabitsView body locals (mirrors the destructure block at the top
    // of HabitsView so the renderCard body resolves bare names exactly
    // as it did before extraction).
    const data                       = d.data;
    const cb                         = d.cb;
    const h                          = d.h;
    const deviceProfile              = d.deviceProfile;
    const HT                         = d.HT;
    const IMP                        = d.IMP;
    const SECTIONS                   = d.SECTIONS;
    const FREQ                       = d.FREQ;
    const DURS                       = d.DURS;
    const DUR_MIN                    = d.DUR_MIN;
    const DUR_MAX                    = d.DUR_MAX;
    const DUR_STEP                   = d.DUR_STEP;
    const IS                         = d.IS;
    const S                          = d.S;
    const AB                         = d.AB;
    const pastDays                   = d.pastDays;
    const dk                         = d.dk;
    const tk                         = d.tk;
    const Glyph                      = d.Glyph;
    const getStreak                  = d.getStreak;
    const getCR                      = d.getCR;
    const getLast14                  = d.getLast14;
    const getFreq                    = d.getFreq;
    const isDone                     = d.isDone;
    const isMissed                   = d.isMissed;
    const isFutureHabit              = d.isFutureHabit;
    const isHabitIncomplete          = d.isHabitIncomplete;
    const isLinkedGoalIncomplete     = d.isLinkedGoalIncomplete;
    const cohortDurationSum          = d.cohortDurationSum;
    const daysSinceLast              = d.daysSinceLast;
    const effDur                     = d.effDur;
    const fmtDur                     = d.fmtDur;
    const habitChildren              = d.habitChildren;
    const habitGoalIds               = d.habitGoalIds;
    const rowPositionInSection       = d.rowPositionInSection;
    const habitPositionInSection     = d.habitPositionInSection;
    const linkedContentForEntity     = d.linkedContentForEntity;
    const firstLinkedAudioFor        = d.firstLinkedAudioFor;
    const slotIdForIndex             = d.slotIdForIndex;
    const HabitCardShell             = d.HabitCardShell;
    const dH                         = d.dH;
    const filtH                      = d.filtH;
    const groupedH                   = d.groupedH;
    const habitClickTimerRef         = d.habitClickTimerRef;
    const swipeRef                   = d.swipeRef;
    const selDate                    = d.selDate;
    const setSelDate                 = d.setSelDate;
    const eHId                       = d.eHId;
    const reorderMode                = d.reorderMode;
    const setReorderMode             = d.setReorderMode;
    const reorderSelectedId          = d.reorderSelectedId;
    const setReorderSelectedId       = d.setReorderSelectedId;
    const showFutureHabits           = d.showFutureHabits;
    const setShowFutureHabits        = d.setShowFutureHabits;
    const openTotalBreakdown         = d.openTotalBreakdown;
    const setOpenTotalBreakdown      = d.setOpenTotalBreakdown;
    const expHabitGoals              = d.expHabitGoals;
    const setExpHabitGoals           = d.setExpHabitGoals;
    const expChildren                = d.expChildren;
    const setExpChildren             = d.setExpChildren;
    const swipeAnim                  = d.swipeAnim;
    const setSwipeAnim               = d.setSwipeAnim;
    const setSwipeFeedback           = d.setSwipeFeedback;
    const setLinkedMediaPlayer       = d.setLinkedMediaPlayer;
    const collapsedSections          = d.collapsedSections;
    const setCollapsedSections       = d.setCollapsedSections;
    const togHabit                   = d.togHabit;
    const moveRowWithinSection       = d.moveRowWithinSection;
    const toggleConcurrentForHabit   = d.toggleConcurrentForHabit;
    const sEHabit                    = d.sEHabit;
    const openNewHabitModal          = d.openNewHabitModal;
    const setTab                     = d.setTab;
    const exitReorderMode            = d.exitReorderMode;
    const reorderEntryBlockedByFilter = d.reorderEntryBlockedByFilter;
    // Per-section locals (captured per-call into makeRenderCard).
    const group                      = d.group;
    const isAvoid                    = d.isAvoid;
    const doneCount                  = d.doneCount;
    const totalMins                  = d.totalMins;
    const fmtTotal                   = d.fmtTotal;
    const resistanceCountFor         = d.resistanceCountFor;
    // Touch drag-and-drop (Phase 1, see HabitsDragController.js).
    const dragController             = d.dragController || null;
    const isTouchDevice              = !!d.isTouchDevice;
    const dragState                  = d.dragState || null;

    const renderCard = (habit, opts) => {
        // `compact` is set by the parent loop when this card is one
        // of two-or-more side-by-side concurrent habits. The card
        // re-flows into a taller two-row layout: action button +
        // target chip share the top row; habit name + meta sit
        // below. Wider readable text on a narrow column.
        const compact = !!(opts && opts.compact);
        // Multi-slot rendering: the habit was pushed into this section
        // by groupedH because its slotSections includes the section.
        // Wrap togHabit/isDone so they target this slot's state, not
        // the day-level rollup.
        const renderSlot = habit._renderSlot || null;
        const togHabitForRow = renderSlot
          ? (id, fd, mode, atTime) => togHabit(id, fd, mode, atTime, renderSlot)
          : togHabit;
        // Multi-slot habits appear as one row per slot (e.g. morning +
        // evening) under the same habit.id. Keying swipeAnim/swipeRef
        // by id alone caused every row of a multi-slot habit to flash
        // green together when the user swiped on one — looking like
        // "all slots marked done" even though togHabitForRow only
        // updated the tapped slot. Scope the key by slot too so each
        // row owns its own swipe animation + gesture tracking.
        const animKey = renderSlot ? habit.id + ":" + renderSlot : habit.id;
        // For multi-slot rows, "done" must be driven by THIS slot's
        // own state — otherwise marking slot 1 done flips every
        // sibling card green via the day-level rollup, which is
        // exactly the "ganged cards" bug the user reported.
        //
        // The day-level fallback survives only as a narrow migration
        // path: a legacy daily habit that was converted to multi-slot
        // can carry completions[date]="done" with NO slotCompletions
        // entries for that date. In that case (and only that case)
        // each row should render as done so the converted history
        // doesn't visually disappear. The moment ANY per-slot entry
        // exists for that date, the fallback is disabled and each
        // card reflects only its own slot.
        const d = (() => {
          if (!renderSlot) return isDone(habit, selDate, null);
          if (isDone(habit, selDate, renderSlot)) return true;
          const slotMap = (habit.slotCompletions && habit.slotCompletions[selDate]) || {};
          const hasAnyPerSlot = Object.keys(slotMap).length > 0;
          return !hasAnyPerSlot && isDone(habit, selDate, null);
        })();
        // §5.8 — pass renderSlot so multi-slot rows show their own
        // per-slot missed state, not the day-level rollup. The "all
        // slots missed" rollup is intentionally NOT folded back here:
        // a per-slot "missed" is a user action on that one slot, so
        // each row reads its own state honestly without a sibling
        // slot inadvertently flipping it red.
        //
        // Symmetric migration fallback (mirrors `d` above): a legacy
        // daily habit converted to multi-slot may carry
        // completions[date]="missed" with NO slotCompletions entries
        // for that date. Surface that as missed on every row, but
        // only when the per-slot map for the date is entirely empty —
        // the instant any per-slot status exists, fallback is off so
        // each card reflects strictly its own slot.
        const missed = (() => {
          if (!renderSlot) return isMissed(habit, selDate, null);
          if (isMissed(habit, selDate, renderSlot)) return true;
          const slotMap = (habit.slotCompletions && habit.slotCompletions[selDate]) || {};
          const hasAnyPerSlot = Object.keys(slotMap).length > 0;
          return !hasAnyPerSlot && isMissed(habit, selDate, null);
        })();
        const resistedCount = resistanceCountFor[habit.id] || 0;
        const isPersistentlyResisted = resistedCount >= 2;
        const isE = eHId === habit.id;
        const animState = swipeAnim[animKey];
        const ht = HT.find(t => t.value === habit.type);
        const imp = IMP.find(i => i.value === habit.importance);
        const streak = getStreak(habit);
        const rate = getCR(habit);
        const l14 = getLast14(habit);
        // §13.3 — Only top-level habits are reorderable; sub-habit rows
        // render inside their parent's expanded block and move with the
        // parent. Reorder UX is the toolbar ▲/▼/⇶ buttons in HabitsView.
        const isTopLevelForReorder = !habit.parentId;
        // §13.3j (v73) — Per-slot selection. Each slot card has its
        // own unique selection id: `habit.id + "@" + _renderSlot` for
        // multi-slot cards, just `habit.id` for single-slot. Selecting
        // one slot card of a multi-slot habit now highlights ONLY that
        // card (not all sibling slots). Lets the user move a specific
        // slot to a different section via the toolbar's section picker
        // (rendered when a multi-slot slot is selected).
        const cardSelectionId = habit._renderSlot
          ? habit.id + "@" + habit._renderSlot
          : String(habit.id);
        const isSelectedForReorder = reorderMode
          && isTopLevelForReorder
          && reorderSelectedId
          && String(reorderSelectedId) === cardSelectionId;
        return /*#__PURE__*/React.createElement("div", {
          key: habit.id,
          className: "hrow" + (reorderMode ? " hrow-reorder" : ""),
          "data-habit-id": habit.id,
          // Tap          = toggle expanded metadata row.
          // Double-tap   = open the edit-habit modal (where the user
          //                can change the habit's position via the
          //                "Order x / y" input next to the title).
          // Swipe right  = mark done / fill target.
          // Swipe left   = clear today.
          //
          // Drag-to-reorder was removed (then re-added as an opt-in
          // §13.3 "reorder mode" entered by long-press) — having an
          // Order input in the edit modal is more discoverable and
          // avoids the accidental-drag mishaps with mobile scroll.
          // While `reorderMode` is true the standard tap / double-tap
          // / swipe gestures early-return so the only interactions
          // are pointerdown-on-handle (drag) and tap-Done (exit mode).
          // Long-press to enter reorder mode was removed — the single
          // entry point is now the three-line Organize button in the
          // toolbar. The card-body pointer events stay clean (no timer,
          // no ref bookkeeping) so the only gestures are tap-to-expand,
          // double-tap-to-edit, and horizontal swipe-to-mark, all gated
          // off when `reorderMode` is true.
          onClick: e => {
            // §13.3j (v73) — In reorder mode, tap selects THIS slot
            // card uniquely (single-slot habits use habit.id; multi-
            // slot cards use habit.id + "@" + _renderSlot so each of a
            // habit's slot cards selects independently). Sub-habits
            // (parentId set) are not independently reorderable; tapping
            // them does nothing. Tapping the already-selected card
            // de-selects it.
            if (reorderMode) {
              if (!isTopLevelForReorder) return;
              setReorderSelectedId(prev =>
                String(prev) === cardSelectionId ? null : cardSelectionId
              );
              return;
            }
            // Defer the expand-toggle by ~250ms so a follow-up second
            // click cancels it and goes straight to the edit modal.
            // Without the delay, the row grew on click 1, shifted
            // every subsequent row down, and made click 2 land on the
            // wrong target — the user reports "it becomes hard to
            // double-click because it moves." Delay is short enough
            // that single-tap-to-expand still feels instantaneous.
            if (habitClickTimerRef.current) {
              clearTimeout(habitClickTimerRef.current);
              habitClickTimerRef.current = null;
            }
            const id = habit.id;
            habitClickTimerRef.current = setTimeout(() => {
              habitClickTimerRef.current = null;
              setExpHabitGoals(p => ({ ...p, [id]: !p[id] }));
            }, 250);
          },
          onDoubleClick: e => {
            if (reorderMode) { e.stopPropagation(); return; }
            e.stopPropagation();
            // Cancel any pending single-click expand so the row stays
            // put while the edit modal opens.
            if (habitClickTimerRef.current) {
              clearTimeout(habitClickTimerRef.current);
              habitClickTimerRef.current = null;
            }
            sEHabit(habit);
          },
          onTouchStart: e => {
            if (reorderMode) return;
            const t = e.touches[0];
            swipeRef.current[animKey] = {
              x: t.clientX,
              y: t.clientY,
              t: Date.now()
            };
          },
          onTouchMove: e => { return; },
          onTouchEnd: e => {
            if (reorderMode) {
              // Make sure no swipe state lingers if mode entered mid-touch.
              delete swipeRef.current[animKey];
              return;
            }
            const s = swipeRef.current[animKey];
            if (!s) return;
            const dx = e.changedTouches[0].clientX - s.x;
            const dy = e.changedTouches[0].clientY - s.y;
            const dt = Date.now() - (s.t || Date.now());
            delete swipeRef.current[animKey];
            if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
              if (dx > 0) {
                // Swipe right = mark done in one gesture.
                //   • Sub-unit habits: jump count to target via the
                //     "fill" sentinel — e.g. "Recruit prep · 60 min"
                //     instantly reads "60/60". Subsequent taps on
                //     the action circle keep adding habit.increment
                //     past the target.
                //   • Plain habits: flip the binary state to done.
                //
                // The slow-swipe time-entry modal that used to fire
                // on a ≥400ms dwell was removed — the user wanted
                // a single uniform "swipe right = complete" gesture.
                setSwipeAnim(p => ({
                  ...p,
                  [animKey]: "done"
                }));
                if (navigator.vibrate) navigator.vibrate(40);
                const msgs = ["Great work! Keep it up!", "Crushing it! ", "One more done! ", "Consistency is key! ", "You showed up today! "];
                setSwipeFeedback({
                  msg: msgs[Math.floor(Math.random() * msgs.length)],
                  type: "done"
                });
                setTimeout(() => setSwipeFeedback(null), 2500);
                setTimeout(() => {
                  if (typeof habit.target === "number") {
                    togHabitForRow(habit.id, selDate, "increment", "fill");
                  } else {
                    togHabitForRow(habit.id, selDate, "done");
                  }
                  setSwipeAnim(p => {
                    const n = {
                      ...p
                    };
                    delete n[animKey];
                    return n;
                  });
                }, 320);
              } else {
                // Right-to-left swipe is a two-stage toggle:
                //   1st swipe → mark MISSED (the opposite outcome)
                //   2nd swipe (already missed) → reset to neutral
                // For ≤ Avoid habits "missed" means "I went over the
                // cap"; for ≥ habits and plain habits it means "I
                // didn't do it." Sub-unit habits go through the
                // increment/"reset" sentinel so the day's count
                // also wipes back to 0 on the second swipe.
                // §5.8 — pass renderSlot so the second swipe on a
                // multi-slot row correctly detects "this slot was
                // already missed" and resets rather than re-marking.
                const wasMissed = isMissed(habit, selDate, renderSlot);
                const animTag = wasMissed ? "reset" : "missed";
                setSwipeAnim(p => ({ ...p, [animKey]: animTag }));
                if (navigator.vibrate) navigator.vibrate(wasMissed ? 20 : 30);
                setSwipeFeedback({
                  msg: wasMissed ? "Cleared for today" : "Marked missed",
                  type: animTag
                });
                setTimeout(() => setSwipeFeedback(null), 1800);
                setTimeout(() => {
                  if (wasMissed) {
                    if (typeof habit.target === "number") {
                      togHabitForRow(habit.id, selDate, "increment", "reset");
                    } else {
                      togHabitForRow(habit.id, selDate, "none");
                    }
                  } else {
                    togHabitForRow(habit.id, selDate, "missed");
                  }
                  setSwipeAnim(p => {
                    const n = { ...p };
                    delete n[animKey];
                    return n;
                  });
                }, 320);
              }
            }
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: compact ? 6 : 10,
            // Compact (side-by-side concurrent) cards wrap their
            // contents into two horizontal lines: action button +
            // target chip share the top line; habit name + meta
            // wrap to a full-width line below. Doubles the card
            // height so the narrower column has room for the title.
            // flex:1 (in compact only) is read by the cohort wrapper
            // (a flex column) so every card in a row stretches to
            // the tallest card's height — a 'Read' card next to a
            // longer 'Spanish practice 15 min' card no longer looks
            // ragged.
            flexWrap: compact ? "wrap" : "nowrap",
            rowGap: compact ? 4 : 0,
            flex: compact ? "1 0 auto" : undefined,
            alignContent: compact ? "flex-start" : undefined,
            // §13.3i (v72) — Selected-card highlight in reorder mode:
            // pale green background + 2px solid accent border so the
            // user always knows which card the toolbar is operating on.
            // Overrides done/missed coloring because in reorder mode
            // the only thing that matters is which card is staged.
            background: isSelectedForReorder
              ? "var(--c-tint-success-bg, #dcfce7)"
              : (animState === "done" ? "#f0fdf4" : animState === "missed" ? "#fff1f1" : animState === "reset" ? "var(--c-surface-muted)" : d ? "#f0fdf4" : missed ? "#fff1f1" : "#fff"),
            // Persistently-resisted habits wear a dotted red outline
            // so they pop out of the list — a quiet "you keep
            // avoiding this one" signal that survives day-to-day
            // until the user breaks the pattern. Done / missed /
            // animation states still win the border treatment so
            // the resistance flag never hides today's status.
            border: isSelectedForReorder
              ? "2px solid #2d5a2d"
              : (d || animState === "done")
                ? "1px solid #86efac"
                : (missed || animState === "missed")
                  ? "1px solid #fca5a5"
                  : (animState === "reset")
                    ? "1px solid var(--c-border)"
                    : isPersistentlyResisted
                      ? "1px dashed #b91c1c"
                      : "1px solid var(--c-border)",
            borderRadius: 12,
            // Compact height by default (matches goal-card density);
            // when the user taps to expand, vertical padding grows so
            // the metadata row has breathing room. Side-by-side
            // concurrent cards use tighter padding to claw back
            // horizontal space for the title.
            padding: compact
              ? (expHabitGoals[habit.id] ? "8px 8px" : "6px 8px")
              : (expHabitGoals[habit.id] ? "10px 12px" : "7px 12px"),
            // §13.3i (v72) — Reorder action buttons moved from per-card
            // to the sticky top toolbar (the buttons stay in a STABLE
            // position while cards animate underneath). Card itself no
            // longer needs to reserve right-edge space for buttons.
            //
            // Compact (layered/concurrent cohort) cards still have the
            // 22px area-color stripe rendered absolutely at right:0
            // (see the `ht && !reorderMode` block ~line 855). Without
            // matching paddingRight, the rightmost ~14px of every
            // wrapped title line sits underneath the stripe and reads
            // as "obstructed" on narrow cohort columns. Reserve 26px
            // (22 stripe + 4 buffer) when ht is present; the 4px buffer
            // is tighter than non-compact's 8px because compact mode is
            // already space-constrained.
            paddingRight: compact ? (ht ? 26 : 8) : (ht ? "30px" : "12px"),
            transform: animState === "done" ? "translateX(110%)" : (animState === "missed" || animState === "reset") ? "translateX(-110%)" : "translateX(0)",
            transition: "transform 0.32s ease, background 0.2s, border-color 0.2s, padding 0.15s, box-shadow 0.15s",
            boxShadow: reorderMode && isTopLevelForReorder
              ? "0 4px 14px rgba(0,0,0,0.10)"
              : (d || animState === "done"
                ? "0 1px 3px rgba(22,163,74,.1)"
                : missed || animState === "missed"
                  ? "0 1px 3px rgba(220,38,38,.08)"
                  : "0 1px 2px rgba(0,0,0,.04)"),
            position: "relative",
            overflow: "hidden",
            marginBottom: 8,
            cursor: "pointer",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            // Touch reorder mode: left padding reserves 32px for the
            // drag handle; dragged card dims to 0.4 opacity.
            paddingLeft: (reorderMode && isTouchDevice && dragController) ? 36 : undefined,
            opacity: (dragState && dragState.dragging && String(dragState.habitId) === String(habit.id)) ? 0.4 : undefined
          }
        },
        // Touch drag handle (iOS organize tool). touchAction:none so
        // finger-drag here doesn't trigger page scroll.
        (reorderMode && isTouchDevice && dragController) && /*#__PURE__*/React.createElement("div", {
          "aria-label": "Drag to reorder",
          role: "button",
          onPointerDown: (e) => dragController.beginDrag(e, habit.id, habit.section || (group && group.value) || null),
          style: {
            position: "absolute", left: 0, top: 0, bottom: 0, width: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--c-text-faint, #9ca3af)",
            fontSize: 18, fontWeight: 700, lineHeight: 1,
            touchAction: "none", cursor: "grab", zIndex: 3,
            background: "rgba(0,0,0,0.02)"
          }
        }, "☰"),
        // §5.4 — "Prioritize today" signal for persistently-resisted
        // habits now rendered INLINE as a habit-name prefix (see the
        // span next to the habit title below). The previous absolute-
        // positioned banner at top:3/left:10 overlapped the action
        // donut and the start of the habit name on every resisted card.
        // The dotted-red border at the card's `border:` style above
        // remains as the primary always-visible signal.
        // §13.1 Desktop hover-reveal mark-missed X. Invisible by
        // default (opacity:0, pointer-events:none); a CSS rule scoped
        // to body[data-device="desktop"/"desktop-wide"] .hrow:hover
        // fades it in on hover. Touch devices never see it because
        // the hover state never triggers and the data-device attr is
        // "phone"/"tablet" — preserving the existing swipe-left and
        // long-press flows verbatim. The button is rendered for
        // every habit row so the CSS doesn't need a device-profile
        // gate in JS; the gate is purely the CSS selector.
        /*#__PURE__*/React.createElement("button", {
          className: "habit-miss-x",
          // Toggle: if already missed today, clicking clears the
          // mark (symmetric with how the swipe-left two-stage
          // toggle works on touch — first swipe marks missed, second
          // clears). Use togHabitForRow so multi-slot habits still
          // target the correct slot.
          onClick: e => {
            e.stopPropagation();
            e.preventDefault();
            if (missed) {
              if (typeof habit.target === "number") {
                togHabitForRow(habit.id, selDate, "increment", "reset");
              } else {
                togHabitForRow(habit.id, selDate, "none");
              }
            } else {
              togHabitForRow(habit.id, selDate, "missed");
            }
          },
          onDoubleClick: e => e.stopPropagation(),
          title: missed ? "Un-mark missed" : "Mark missed today",
          "aria-label": missed ? "Un-mark missed today" : "Mark missed today",
          style: {
            position: "absolute",
            top: 4,
            right: 6,
            width: 22,
            height: 22,
            borderRadius: 11,
            border: "none",
            background: "rgba(0,0,0,0.06)",
            color: "var(--c-text-faint)",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            cursor: "pointer",
            opacity: 0,
            transition: "opacity 0.15s, background 0.15s, color 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 2
          }
        }, "✕"),
        // §13.3 / §13.3i (v72) — Reorder UX is the ▲/▼/⇶ button row in
        // the sticky toolbar (see HabitsView); selection happens via
        // tap on the card body when reorderMode is on. No pointer-drag
        // handler lives on the card itself. The earlier SortableJS
        // path and the hand-rolled drag-handle that replaced it were
        // both removed (SortableJS in v71, the drag stub in v77).
        // Action button (binary checkmark / sub-unit increment / parent
        // progress ring) lives in lib/views/HabitsActionButton.js.
        window.HabitsActionButton.renderActionButton({
          habit, selDate, d, missed, compact,
          habitChildren, isDone, togHabitForRow
        }), /*#__PURE__*/React.createElement("div", {
          style: {
            // CSS Grid (instead of flex column) is what unblocks
            // reliable text wrap inside narrow flex containers. A
            // single-track `minmax(0, 1fr)` track tells the browser
            // explicitly: this child gets 100% of the leftover row
            // space AND can shrink to zero. Plain flex columns
            // sometimes preserve a child's intrinsic min-content
            // width on iOS Safari, which is what was leaving the
            // tail of "Dream Journal" hanging past the card edge.
            flex: compact ? "1 0 100%" : "1 1 0",
            minWidth: 0,
            order: compact ? 3 : 0,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            rowGap: 4
          }
        },
        // Habit name row. The target chip used to sit here too as a
        // flex sibling, but on narrow cards it could push past the
        // row's right padding. Chip now lives as a direct child of
        // the row container (see below), so the column owns full
        // freedom to shrink and the chip's natural width is bounded
        // by the row's flex layout instead of overflowing it.
        /*#__PURE__*/React.createElement("div", {
          style: Object.assign({
            fontSize: 13,
            fontWeight: 500,
            color: d || missed ? "#6b7280" : "var(--c-text)",
            textDecoration: d || missed ? "line-through" : "none",
          }, compact ? {
            // Compact (3-up concurrent) mode: each card lives in a
            // ~120 px wide tower, so the title column is only ~100 px
            // wide. To guarantee that "Dream Journal Entry" wraps at
            // word boundaries (and never overflows the row's
            // overflow:hidden, clipping the trailing letters), the
            // title becomes a flex-wrap container. Each word is a
            // flex item rendered separately below; flex layout hard-
            // bounds children to the container's width — no
            // intrinsic-width / min-content escape hatch that plain
            // `whiteSpace: normal + width: 100%` leaves open on iOS
            // Safari. min-width:0 + max-width:100% pins the title's
            // outer box to the column's track width, never wider.
            display: "flex",
            flexWrap: "wrap",
            columnGap: 4,
            rowGap: 0,
            alignItems: "baseline",
            lineHeight: 1.25,
            minWidth: 0,
            maxWidth: "100%",
            width: "100%",
            wordBreak: "break-word",
            overflowWrap: "anywhere"
          } : {
            // Non-compact path is unchanged — the original single-row
            // layout (with optional natural wrap) keeps working for
            // standalone cards where the title has the full row width
            // to play with.
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            lineHeight: 1.25,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            display: "block"
          }),
          title: habit.text
        },
          // Incompleteness flag — voice-captured / fast-add habits
          // often miss area / section / freq. The 🚨 prompts the
          // user to double-tap the card and finish the form.
          isHabitIncomplete(habit) && /*#__PURE__*/React.createElement("span", {
            title: "Incomplete — double-tap to fill in area, section, or frequency.",
            style: { marginRight: 4, display: "inline-flex", alignItems: "center", verticalAlign: "middle" }
          }, Glyph("🚨", { size: 12, color: "#b91c1c" })),
          // §5.4 — "PRIORITIZE TODAY" tag for persistently-resisted
          // habits, rendered inline as a name-prefix so it flows in
          // the title's line instead of floating absolute over the
          // donut + first word of the name (which is the overlap the
          // user was reporting). Pairs with the dotted-red border at
          // the card level for redundancy.
          isPersistentlyResisted && /*#__PURE__*/React.createElement("span", {
            "aria-label": "Prioritize today — persistently resisted",
            title: "Persistently resisted — prioritize today.",
            style: {
              marginRight: 5,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "var(--c-tint-danger-fg, #b91c1c)",
              textTransform: "uppercase",
              lineHeight: 1,
              verticalAlign: "middle",
              whiteSpace: "nowrap"
            }
          }, "Prioritize today"),
          // Linked-goal-incomplete warning (§5.6). When the habit
          // points at one or more goals (canonical goalIds array, or
          // legacy goalId scalar) whose SMART set or text is not
          // fully populated, surface a ⚠️ with a tooltip listing
          // exactly which fields are missing on each linked goal.
          // Hidden when there are no linked goals or all linked
          // goals are complete.
          (function () {
            const linkedGoalIds = (habit.goalIds && habit.goalIds.length)
              ? habit.goalIds
              : (habit.goalId != null ? [habit.goalId] : []);
            if (!linkedGoalIds.length) return null;
            const incomplete = linkedGoalIds
              .map(gid => (data.goals || []).find(g => String(g.id) === String(gid)))
              .filter(g => g && isLinkedGoalIncomplete(g));
            if (!incomplete.length) return null;
            const missingByGoal = incomplete.map(g => {
              const s = g.smart || {};
              const miss = [];
              if (!g.text || !String(g.text).trim()) miss.push("Goal text");
              if (!s.specific || !String(s.specific).trim()) miss.push("Specific");
              if (!s.measurable || !String(s.measurable).trim()) miss.push("Measurable");
              if (!s.achievable || !String(s.achievable).trim()) miss.push("Achievable");
              if (!s.relevant || !String(s.relevant).trim()) miss.push("Relevant");
              if (!s.timebound || !String(s.timebound).trim()) miss.push("Time-bound");
              return (g.text || "(untitled)") + ": " + miss.join(", ");
            }).join(" | ");
            const tip = "Linked goal incomplete — " + missingByGoal;
            return /*#__PURE__*/React.createElement("span", {
              title: tip,
              "aria-label": tip,
              style: { fontSize: 14, marginRight: 4, marginLeft: 2, cursor: "help", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }
            }, "⚠️");
          })(),
          // Linked-audio play chip. If the habit has at least one
          // linked audio in My Content, surface a tiny ▶ button right
          // next to the habit name. Tapping opens the floating player
          // overlay; when audio finishes, the player auto-completes
          // the habit (e.g. "Breathwork" habit → linked breathwork mp3
          // → tap ▶ → audio plays → habit checks itself off).
          // stopPropagation so this doesn't also fire the row's tap-
          // to-complete / double-tap-to-edit handlers.
          (() => {
            const audio = firstLinkedAudioFor("habit", habit.id);
            if (!audio) return null;
            return /*#__PURE__*/React.createElement("button", {
              type: "button",
              "aria-label": "Play linked audio (auto-completes habit when done)",
              title: "Play " + (audio.title || audio.fileName || "linked audio"),
              onClick: (e) => { e.stopPropagation(); setLinkedMediaPlayer({ kind: "habit", entityId: habit.id, item: audio }); },
              onPointerDown: (e) => e.stopPropagation(),
              style: {
                marginRight: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                // 24x24 to clear WCAG 2.5.8 Target Size (Minimum). The
                // play glyph stays visually balanced because the circle
                // grows proportionally with the chip.
                width: 24, height: 24, borderRadius: "50%",
                background: "#2d5a2d", color: "#fff",
                border: "none", cursor: "pointer",
                fontSize: 12, lineHeight: 1, paddingLeft: 2,
                verticalAlign: "middle", flexShrink: 0
              }
            }, "▶");
          })(),
          // Compact: every word becomes its own flex-item span. Flex
          // wrap will move a word to the next line when it doesn't
          // fit — independent of any white-space / min-content /
          // grid-track width quirks that the previous non-flex
          // approaches couldn't fully bypass on iOS Safari. maxWidth
          // 100% on each span lets even a single oversize word
          // (rare, but e.g. "Pneumonoultramicroscopic…") shrink and
          // word-break inside its own line instead of overflowing.
          compact
            ? (habit.text || "").split(/\s+/).filter(Boolean).map((word, i) => (
                /*#__PURE__*/React.createElement("span", {
                  key: i,
                  style: {
                    display: "inline-block",
                    maxWidth: "100%",
                    minWidth: 0,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere"
                  }
                }, word)
              ))
            : (habit.text || ""),
          // §5.7 / user request: "(Part N/M)" identifier on each row
          // of a multi-slot habit — Card #1 reads "(Part 1/2)",
          // Card #2 reads "(Part 2/2)", regardless of completion
          // state. Replaces the earlier (x/y) progress badge, which
          // was misread as a per-card status (it changed identically
          // on every sibling card whenever one slot was completed,
          // making the cards look ganged-together). Each card now
          // shows ONLY its own slot identity; visual done/missed
          // state is driven by the per-slot `d` / `missed` check.
          // Hidden for single-slot habits.
          (() => {
            const slots = Array.isArray(habit.slotSections) ? habit.slotSections : null;
            if (!slots || slots.length < 2) return null;
            const meta = habit._renderSlotMeta;
            // Defensive: meta should always exist for a multi-slot
            // row because groupedH stamps it; skip rendering the
            // badge if for some reason it's missing rather than
            // showing a wrong number.
            if (!meta) return null;
            // Prefer `displayPartNum` (visual-order, stamped by
            // groupedH after sortItems) so a slot dragged to the top
            // reads "1/y" even if its underlying arrayIdx is higher.
            // Fall back to storage-order arrayIdx+1 for safety.
            const partNum = (meta.displayPartNum != null) ? meta.displayPartNum : (meta.arrayIdx + 1);
            const partTotal = slots.length;
            return /*#__PURE__*/React.createElement("span", {
              "aria-label": "Part " + partNum + " of " + partTotal,
              style: {
                marginLeft: 6,
                fontSize: 12, fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: "var(--c-text-soft)",
                whiteSpace: "nowrap"
              }
            }, "(Part " + partNum + "/" + partTotal + ")");
          })(),
          // The "#N" suffix that used to appear here for same-section
          // duplicate slots was retired — the "(Part N/M)" badge above
          // already disambiguates each slot card, so the suffix was
          // redundant ("Take meds (Part 1/4) #1" → "Take meds (Part 1/4)").
        ),
        habit.notes && !compact && /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 12,
            color: "var(--c-text-soft)",
            fontStyle: "italic",
            // Two-line clamp so user-authored notes (a recipe like
            // "Sit-ups · Planks · Leg raises") aren't truncated to the
            // first ~25 chars. maxHeight defensive against Safari iOS
            // clipping descenders ("g/p/y") on the 2nd line — the
            // -webkit-box clamp computes from box not line-box height.
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.45,
            maxHeight: "2.9em"
          }
        }, habit.notes), expHabitGoals[habit.id] && /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 4,
            // Compact mode: pills wrap to a new line instead of being
            // clipped, since the column is only ~120px wide at iPhone
            // 17 Pro width with 3 simultaneous habits. overflow:visible
            // so the wrapped 2nd row of chips isn't clipped by the
            // parent's grid track sizing.
            flexWrap: compact ? "wrap" : "nowrap",
            rowGap: compact ? 4 : 0,
            overflow: "visible",
            marginTop: 4
          }
        }, fmtDur(habit.duration) && /*#__PURE__*/React.createElement("div", {
          style: {
            height: 20,
            paddingLeft: 7,
            paddingRight: 7,
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 11,
            fontWeight: 700,
            color: "#0891b2",
            whiteSpace: "nowrap"
          }
        }, "\u23F1", fmtDur(habit.duration))), imp && /*#__PURE__*/React.createElement("div", {
          style: {
            height: 20,
            paddingLeft: 7,
            paddingRight: 7,
            background: imp.bg,
            border: `1px solid ${imp.border}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 11,
            fontWeight: 700,
            color: imp.color,
            textTransform: "uppercase",
            whiteSpace: "nowrap"
          }
        }, imp.value)),
        // Frequency pill — replaces the streak graphic (dots + % + day
        // count). Just the cadence bucket name, uppercase.
        (() => { const fqRow = FREQ.find(f => f.value === getFreq(habit).type); return fqRow ? /*#__PURE__*/React.createElement("div", {
          style: {height: 20, paddingLeft: 7, paddingRight: 7, background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}
        }, /*#__PURE__*/React.createElement("span", {style: {fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", whiteSpace: "nowrap"}}, fqRow.label)) : null; })(),
        // Fire/ice streak indicator: 🔥N for an active streak, 🧊N
        // for days since the habit went cold; nothing for brand-new.
        (() => {
          if (streak > 0) return /*#__PURE__*/React.createElement("div", {
            style: {height: 20, paddingLeft: 6, paddingRight: 7, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 4, display: "flex", alignItems: "center", gap: 2, flexShrink: 0}
          }, /*#__PURE__*/React.createElement("span", {style: {fontSize: 10, lineHeight: 1}}, "\uD83D\uDD25"), /*#__PURE__*/React.createElement("span", {style: {fontSize: 11, fontWeight: 700, color: "#c2410c"}}, streak));
          const cold = daysSinceLast(habit);
          if (cold != null) return /*#__PURE__*/React.createElement("div", {
            style: {height: 20, paddingLeft: 6, paddingRight: 7, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4, display: "flex", alignItems: "center", gap: 2, flexShrink: 0}
          }, /*#__PURE__*/React.createElement("span", {style: {fontSize: 10, lineHeight: 1}}, "\uD83E\uDDCA"), /*#__PURE__*/React.createElement("span", {style: {fontSize: 11, fontWeight: 700, color: "#1d4ed8"}}, cold));
          return null;
        })()), habit.goalId && expHabitGoals[habit.id] && /*#__PURE__*/React.createElement("div", {
          // Stacked layout: 'Goal:' label on its own line, then the
          // linked goal's name on the line below it. Long goal
          // titles ('Develop lucid dreaming capability') no longer
          // share a line with the label so they have the full card
          // width to wrap into.
          style: { display: "block", marginTop: 5, paddingTop: 5, borderTop: "1px dashed #e5e7eb", minWidth: 0 }
        },
          /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 10, color: "var(--c-text-faint)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1.4, marginBottom: 2, letterSpacing: 0.4 }
          }, "Goal:"),
          /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 13, fontWeight: 600, color: "#2d5a2d", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.4 }
          }, data.goals.find(g => String(g.id) === String(habit.goalId))?.text || "")
        ),
        // Linked content surfaced when the habit row is expanded. As
        // a child of the habit's grid column (single-column grid), it
        // stacks BELOW the goal-link block on its own row. The
        // ht-stripe sibling below uses position:absolute so it does
        // not occupy a grid track and never collides with this block.
        expHabitGoals[habit.id] && linkedContentForEntity("habit", habit.id),
        // §13.3 — Hide the area-color stripe (right edge, 22px wide) while
        // in reorder mode so the drag handle (also right-edge, 32px) has a
        // clean target. Stripe + handle compete for the same px column;
        // the stripe wins by paint order without this gate. Reorder mode
        // is a deliberate visual quiet anyway — colors return on exit.
        ht && !reorderMode && /*#__PURE__*/React.createElement("div", {
          style: {
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "22px",
            background: ht.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8
          }
        }, /*#__PURE__*/React.createElement("span", {
          // 7px rotated text fails contrast at most ht.color values
          // and is illegible on any phone. Hide from screen readers
          // (the parent stripe carries the area-of-life via title);
          // sighted users still get the color band as the cue.
          "aria-hidden": true,
          style: {
            fontSize: 7,
            fontWeight: 700,
            color: "#fff",
            textTransform: "uppercase",
            transform: "rotate(90deg)",
            whiteSpace: "nowrap",
            userSelect: "none"
          }
        }, ht.value))),
        // Sub-unit target chip — lives at the row-container level so
        // it sits between the column (which shrinks the name) and the
        // ht area-stripe (absolute, right edge). Mirrors the goal-card
        // date pill: stacked op+count on top, italic unit on bottom.
        // Tints green when done and red when the user has slipped past
        // a ≤ limit. flexShrink:0 keeps it from getting squeezed; the
        // column's flex:1 + minWidth:0 ensures the name truncates
        // first. maxWidth + overflow:hidden on the unit line ensures
        // even a long unit label ("Calories of soda") truncates with
        // ellipsis instead of pushing the chip past the card edge.
        // Plain (Yes/No) habit chip — shown only once the habit is
        // marked done so the right-side slot reads its completion
        // status instead of being empty. Same fixed 64×36 box as
        // the sub-unit chip below so the row layout is identical
        // regardless of habit flavor.
        //
        // Avoid-section habits flip the language: completion means
        // you DIDN'T do the negative thing, so the chip reads "No"
        // (i.e., "I had no drinks today") instead of "Yes". For
        // every other section, completion is a positive "Yes I did
        // it." Both states are still visually identical green
        // pills — only the word changes.
        // Yes/No pill and target chip stay visible in both collapsed
        // AND expanded states — users open the card to see details
        // and the target progress is the most-glanced badge, so it
        // can't disappear when they tap. (Previously hidden in expand
        // to avoid overlap with the metadata pill row; instead we
        // raise the chip via z-index so it sits above any pill that
        // would crowd the right edge — see §5.1 in docs/TODO.md.)
        //
        // EXCEPTION: when the card is in edit mode (isE), the inline
        // edit form overlays the right edge with its own controls
        // (name field, frequency picker, target inputs), which can
        // visually cover this badge even with z-index. Hiding the
        // badge while editing is the cleanest fix — the user already
        // sees the target value inside the edit form itself.
        !isE && !reorderMode && (typeof habit.target !== "number" && d) && /*#__PURE__*/React.createElement("span", {
          style: {
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            color: "#15803d",
            background: "#dcfce7",
            border: "1px solid transparent",
            borderRadius: 8,
            padding: "2px 4px",
            boxSizing: "border-box",
            width: 44,
            height: 32,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            marginRight: ht ? 4 : 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.3,
            // Keep the badge above any metadata-row pill that may
            // share the right edge in expanded state (see §5.1).
            position: "relative",
            zIndex: 2
          }
        }, habit.section === "avoid" ? "No" : "Yes"),
        // Target chip for sub-unit habits (right-side count vs target).
        // Renderer lives in lib/views/HabitsActionButton.js.
        !isE && !reorderMode && (typeof habit.target === "number") &&
          window.HabitsActionButton.renderTargetChip({ habit, selDate, d, ht })
        );
      };
    return renderCard;

  }

  window.HabitsHabitCard = { makeRenderCard };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { makeRenderCard };
  }
})();
