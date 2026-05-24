// lib/views/HabitsView.js — §13.4b (v76) full extraction.
//
// Supersedes the v75 PARTIAL baseline. The full render block (originally
// at index.html L15685-L18584, ~2900 lines) is now mounted here via a
// faithful tree-for-tree copy of the inline source. The Habits tab in
// index.html no longer renders inline — it renders this view via
// `React.createElement(window.HabitsView, ...)` and the previous inline
// IIFE is gated behind `false && (...)` for a follow-up dead-code sweep.
//
// What this view OWNS (view-local, per spec §3 Habits row):
//   – nothing yet. Every UI flag stayed in App for v76 so the v72–v74
//     reorder semantics, swipe gestures, filter-pill state, and inline
//     new-habit form all keep their existing closure references. Lifting
//     them into the view is a follow-up plan (the spec's "Phase 2"
//     mention under §9 covers it).
//
// What this view RECEIVES (via the frozen prop signature):
//   data           — full data object (read-only).
//   dispatch       — App's dispatch helper. Unused today (the WRITE-side
//                    helpers are App-scope closures threaded through
//                    callbacks). Kept on the contract so the integration
//                    pattern matches BriefView/GoalsView/etc.
//   deviceProfile  — current device profile snapshot.
//   callbacks      — see the destructuring prelude below. Single flat
//                    bag of write helpers + filter-state slices.
//   callbacks.helpers — App-scope read helpers (predicates, memos),
//                       components (HabitCardShell, Glyph), constants
//                       (HT, IMP, SECTIONS, DURS, …), and refs (swipeRef,
//                       habitClickTimerRef, …) that the body references
//                       by their original names.
//
// The body below is a VERBATIM copy of the IIFE that used to live at
// L15685-L18584. The destructuring prelude in `HabitsView` re-binds
// every App-scope name the body reads, so no edits to the body itself
// were necessary. This minimizes regression risk for the v72–v74 reorder
// UX and the existing swipe / cohort / multi-slot rendering paths.
//
// FOLLOW-UP work (out of scope here, tracked separately):
//   – Lift `reorderMode` / `reorderSelectedId` / filter-pills open state
//     / `showFutureHabits` / etc. into view-local useState so App can
//     stop owning them.
//   – Inline the App-scope read predicates (isDone, isMissed, getStreak,
//     getCR, getLast14) by calling `habitsDomain` derivations directly
//     from `data`.
//   – Migrate the inline new-habit form state (nHabit, nHType, nHSec,
//     nHImp, nHDur, nHFreq, nHGoal, nHNotes, nHStart) into view-local
//     state. Currently App owns them because `addHabit()` closes over
//     them and `setShowAddHabit(false)` lives in App.

function HabitsView(props) {
  const React = (typeof window !== "undefined" && window.React) || null;
  if (!React) return null;

  const data = (props && props.data) || {};
  const dispatch = (props && props.dispatch) || (() => {});
  const deviceProfile = (props && props.deviceProfile) || (typeof window !== "undefined" ? window.__deviceProfile : "desktop");
  const cb = (props && props.callbacks) || {};
  const h = cb.helpers || {};

  // ─── Constants ─────────────────────────────────────────────────────
  const HT         = h.HT;
  const IMP        = h.IMP;
  const SECTIONS   = h.SECTIONS;
  const FREQ       = h.FREQ;
  const DURS       = h.DURS;
  const DUR_MIN    = h.DUR_MIN;
  const DUR_MAX    = h.DUR_MAX;
  const DUR_STEP   = h.DUR_STEP;
  const IS         = h.IS;
  const S          = h.S;
  const AB         = h.AB;

  // ─── Pure helpers (App-scope read-only) ────────────────────────────
  const pastDays              = h.pastDays;
  const dk                    = h.dk;
  const tk                    = h.tk;
  const Glyph                 = h.Glyph;
  const getStreak             = h.getStreak;
  const getCR                 = h.getCR;
  const getLast14             = h.getLast14;
  const getFreq               = h.getFreq;
  const isDone                = h.isDone;
  const isMissed              = h.isMissed;
  const isFutureHabit         = h.isFutureHabit;
  const isHabitIncomplete     = h.isHabitIncomplete;
  const isLinkedGoalIncomplete = h.isLinkedGoalIncomplete;
  const cohortDurationSum     = h.cohortDurationSum;
  const daysSinceLast         = h.daysSinceLast;
  const effDur                = h.effDur;
  const fmtDur                = h.fmtDur;
  const habitChildren         = h.habitChildren;
  const habitGoalIds          = h.habitGoalIds;
  const rowPositionInSection  = h.rowPositionInSection;
  const habitPositionInSection = h.habitPositionInSection;
  const resolveReorderDrop    = h.resolveReorderDrop;
  const startReorderAutoScroll = h.startReorderAutoScroll;
  const stopReorderAutoScroll = h.stopReorderAutoScroll;
  const renderFreqPicker      = h.renderFreqPicker;
  const renderSortButton      = h.renderSortButton;
  const linkedContentForEntity = h.linkedContentForEntity;
  const firstLinkedAudioFor   = h.firstLinkedAudioFor;
  const filterPressProps      = h.filterPressProps;
  const slotIdForIndex        = h.slotIdForIndex;
  const HabitCardShell        = h.HabitCardShell;

  // ─── App-scope derived data (memoed by App, passed through) ────────
  const dH                          = h.dH;
  const filtH                       = h.filtH;
  const groupedH                    = h.groupedH;
  const reorderEntryBlockedByFilter = h.reorderEntryBlockedByFilter;

  // ─── App-owned refs (threaded through callbacks.helpers) ───────────
  const habitClickTimerRef     = h.habitClickTimerRef;
  const swipeRef               = h.swipeRef;
  const reorderDragRef         = h.reorderDragRef;
  const reorderDropPreviewRef  = h.reorderDropPreviewRef;
  const impLpRef               = h.impLpRef;
  const habGoalLpRef           = h.habGoalLpRef;
  const habFreqLpRef           = h.habFreqLpRef;

  // ─── App-owned state slices (current value + setter) ───────────────
  const selDate                = cb.selDate;
  const setSelDate             = cb.setSelDate;
  const eHId                   = cb.eHId;
  const reorderMode            = cb.reorderMode;
  const setReorderMode         = cb.setReorderMode;
  const reorderSelectedId      = cb.reorderSelectedId;
  const setReorderSelectedId   = cb.setReorderSelectedId;
  const showFutureHabits       = cb.showFutureHabits;
  const setShowFutureHabits    = cb.setShowFutureHabits;
  const openTotalBreakdown     = cb.openTotalBreakdown;
  const setOpenTotalBreakdown  = cb.setOpenTotalBreakdown;
  const expHabitGoals          = cb.expHabitGoals;
  const setExpHabitGoals       = cb.setExpHabitGoals;
  const expChildren            = cb.expChildren;
  const setExpChildren         = cb.setExpChildren;
  const swipeAnim              = cb.swipeAnim;
  const setSwipeAnim           = cb.setSwipeAnim;
  const setSwipeFeedback       = cb.setSwipeFeedback;
  const setLinkedMediaPlayer   = cb.setLinkedMediaPlayer;
  const showAddHabit           = cb.showAddHabit;
  const setShowAddHabit        = cb.setShowAddHabit;
  const setReorderDragTick     = cb.setReorderDragTick || (() => {});
  // Filter state slices (shared with Brief tab — App owns them).
  const secFilter              = cb.secFilter;
  const impFilter              = cb.impFilter;
  const setImpFilter           = cb.setImpFilter;
  const habGoalFilter          = cb.habGoalFilter;
  const setHabGoalFilter       = cb.setHabGoalFilter;
  const habFreqFilter          = cb.habFreqFilter;
  const setHabFreqFilter       = cb.setHabFreqFilter;
  const dueFilter              = cb.dueFilter;
  const setDueFilter           = cb.setDueFilter;
  const durRange               = cb.durRange;
  const setDurRange            = cb.setDurRange;
  const filterMenuOpen         = cb.filterMenuOpen;
  const setFilterMenuOpen      = cb.setFilterMenuOpen;
  const impPillsOpen           = cb.impPillsOpen;
  const setImpPillsOpen        = cb.setImpPillsOpen;
  const habGoalPillsOpen       = cb.habGoalPillsOpen;
  const setHabGoalPillsOpen    = cb.setHabGoalPillsOpen;
  const habFreqPillsOpen       = cb.habFreqPillsOpen;
  const setHabFreqPillsOpen    = cb.setHabFreqPillsOpen;
  const durPillsOpen           = cb.durPillsOpen;
  const setDurPillsOpen        = cb.setDurPillsOpen;
  const collapsedSections      = cb.collapsedSections;
  const setCollapsedSections   = cb.setCollapsedSections;
  // New-habit form state (inline form — opened via `showAddHabit`).
  const nHabit   = cb.nHabit;   const sNHabit   = cb.sNHabit;
  const nHType   = cb.nHType;   const sNHType   = cb.sNHType;
  const nHSec    = cb.nHSec;    const sNHSec    = cb.sNHSec;
  const nHImp    = cb.nHImp;    const sNHImp    = cb.sNHImp;
  const nHDur    = cb.nHDur;    const sNHDur    = cb.sNHDur;
  const nHFreq   = cb.nHFreq;   const sNHFreq   = cb.sNHFreq;
  const nHGoal   = cb.nHGoal;   const sNHGoal   = cb.sNHGoal;
  const nHNotes  = cb.nHNotes;  const sNHNotes  = cb.sNHNotes;
  const nHStart  = cb.nHStart;  const sNHStart  = cb.sNHStart;

  // ─── Write-side helpers (App-scope, closure over data + save) ──────
  const togHabit                  = cb.onTogHabit                 || (() => {});
  const moveRowWithinSection      = cb.onMoveRowWithinSection     || (() => {});
  const commitHabitReorderDrop    = cb.onCommitHabitReorderDrop   || (() => {});
  const commitSlotReorderDrop     = cb.onCommitSlotReorderDrop    || (() => {});
  const toggleConcurrentForHabit  = cb.onToggleConcurrent         || (() => {});
  const sEHabit                   = cb.onOpenEditHabit            || (() => {});
  const openNewHabitModal         = cb.onOpenAddHabit             || (() => {});
  const addHabit                  = cb.onAddHabit                 || (() => {});
  const setTab                    = cb.setTab                     || (() => {});
  const exitReorderMode           = cb.exitReorderMode            || (() => setReorderMode && setReorderMode(false));
  const reorderCrowdingPair       = cb.onReorderCrowdingPair      || (() => {});
  const dismissCrowdingPair       = cb.onDismissCrowdingPair      || (() => {});
  const detectAdditiveCrowding    = h.detectAdditiveCrowding      || (() => null);

  // ─── BEGIN VERBATIM BODY (was index.html L15685-L18584) ────────────
  // The block below was copy-pasted unchanged. Every identifier it
  // references is bound above. Do NOT edit this region without an
  // accompanying inline-source diff — see commit log for §13.4b.

    const hmap = pastDays(30).reverse().map(day => {
      const total = dH.length;
      const done = dH.filter(h => h.completions?.[day]).length;
      return {
        day,
        p: total ? done / total : 0
      };
    });
    // "Return to home" banner — pinned to the top of the Habits
    // tab whenever the user is viewing yesterday's date. Common
    // entry points: the home Review Yesterday card AND the
    // dashboard's Yesterday stat tile. Tap the banner to jump
    // back to today's home view.
    const yestKey = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return dk(d); })();
    const todayKey = tk();
    const ritToday = (data.dailyRitual && data.dailyRitual[todayKey]) || {};
    const homeReviewPending = !ritToday.yesterdayReviewed;
    const showReturnBanner = selDate === yestKey;
    const bannerHeadline = homeReviewPending ? "Reviewing yesterday" : "Viewing yesterday";
    const bannerBody = homeReviewPending
      ? "Mark each habit done or missed, then tap here to return to the home page review."
      : "Adjust any habits as needed, then tap here to return to the home page.";
    const returnBanner = showReturnBanner ? /*#__PURE__*/React.createElement("div", {
      onClick: () => { setSelDate(todayKey); setTab("brief"); },
      style: {
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--c-tint-info-bg)",
        border: "1px solid var(--c-tint-info-border)",
        borderLeft: "4px solid var(--c-tint-info-fg)",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 10,
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(29,78,216,.08)"
      }
    },
      /*#__PURE__*/React.createElement("span", {
        "aria-hidden": true,
        style: { fontSize: 16, color: "#1d4ed8", flexShrink: 0 }
      }, "←"),
      /*#__PURE__*/React.createElement("div", {
        style: { flex: 1, minWidth: 0 }
      },
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.4 }
        }, bannerHeadline),
        /*#__PURE__*/React.createElement("div", {
          style: { fontSize: 12, color: "#1e3a8a", lineHeight: 1.4 }
        }, bannerBody)
      ),
      // Single left arrow only — Home is the leftmost destination,
      // a trailing "Return →" felt like a second nav target.
      /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 11, fontWeight: 700, color: "#1d4ed8", flexShrink: 0 }
      }, "Home")
    ) : null;
    return /*#__PURE__*/React.createElement("div", {
      className: "fade-in"
    },
      returnBanner,
      // §13.3i (v72) — Reorder-mode top bar. Two-row sticky toolbar
      // pinned to the viewport top so action buttons stay in a STABLE
      // position while cards animate underneath. Row 1: selection
      // label + Done. Row 2: ▲ Up, ▼ Down, ⇶ Layer — each disabled
      // when no card is selected OR the action wouldn't move
      // anything (▲ at first, ▼ at last, ⇶ at first).
      reorderMode && window.HabitsReorderToolbar
        ? /*#__PURE__*/React.createElement(window.HabitsReorderToolbar, {
            reorderSelectedId,
            habits: data.habits || [],
            rowPositionInSection,
            habitPositionInSection,
            onExitReorder: exitReorderMode,
            onMoveRow: moveRowWithinSection,
            onToggleConcurrent: toggleConcurrentForHabit,
            onCommitSlotDrop: commitSlotReorderDrop,
            setReorderSelectedId
          })
        : null,
      // Spacer to push content below the fixed reorder toolbar so the
      // first habit section header isn't visually clipped by the bar.
      // Bar is 2 rows (~108px) baseline; with a multi-slot slot
      // selected, a 3rd row (section picker) appears (+44px). Detect
      // the slot-row case here so the spacer matches actual bar height.
      reorderMode && /*#__PURE__*/React.createElement("div", {
        style: { height: (() => {
          if (!reorderSelectedId || !String(reorderSelectedId).includes("@")) return 112;
          // Slot selected → 3-row toolbar (~156px).
          return 156;
        })(), flexShrink: 0 }
      }),
      // §13.3g (v71) — Drop-preview indicator was deleted alongside
      // SortableJS. Button-based reorder has no drag preview to render.
      // W3-T10: framing sentence for new users. The add-habit affordance
      // (the [+] button + the inline "No habits yet — add one above"
      // empty state below) is already prominent on this tab, so we just
      // add a single line of context above it rather than a second CTA.
      (data.habits || []).length === 0 && /*#__PURE__*/React.createElement("div", {
        style: { padding: "32px 20px 20px", textAlign: "center", maxWidth: 480, margin: "0 auto" }
      },
        /*#__PURE__*/React.createElement("p", {
          style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: "var(--c-text-strong)", marginBottom: 0, lineHeight: 1.4 }
        }, "Habits are the small daily actions that compound into who you become.")
      ),
      window.HabitsFilterPills && /*#__PURE__*/React.createElement(window.HabitsFilterPills, {
        data,
        openNewHabitModal,
        filtH,
        cohortDurationSum,
        renderSortButton,
        filterPressProps,
        reorderEntryBlockedByFilter,
        impLpRef, habGoalLpRef, habFreqLpRef,
        setReorderMode,
        dueFilter, setDueFilter,
        impFilter, setImpFilter,
        habGoalFilter, setHabGoalFilter,
        habFreqFilter, setHabFreqFilter,
        durRange, setDurRange,
        filterMenuOpen, setFilterMenuOpen,
        impPillsOpen, setImpPillsOpen,
        habGoalPillsOpen, setHabGoalPillsOpen,
        habFreqPillsOpen, setHabFreqPillsOpen,
        durPillsOpen, setDurPillsOpen
      }),
    /*#__PURE__*/React.createElement("div", {style:{height:1,background:"#f0f0ee",margin:"4px 0 14px"}}), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, showAddHabit && window.HabitsNewHabitForm && /*#__PURE__*/React.createElement(window.HabitsNewHabitForm, {
      data,
      nHabit, nHGoal, nHType, nHSec, nHDur, nHImp, nHFreq, nHStart, nHNotes,
      sNHabit, sNHGoal, sNHType, sNHSec, sNHDur, sNHImp, sNHFreq, sNHStart, sNHNotes,
      setTab, setShowAddHabit, addHabit, renderFreqPicker
    })),
    /*#__PURE__*/React.createElement("div", {
      className: "habit-sections-grid",
      // §13.3 — In reorder mode, shift the entire section grid LEFT by
      // reserving right padding on the wrapper. This frees up space on
      // the right edge of the viewport so the page scrollbar (and the
      // user's thumb on iOS while scrolling along that edge) doesn't
      // sit on top of, or visually crowd, the habit cards. Mirrors the
      // existing `paddingBottom: reorderMode ? 60 : 0` pattern on each
      // section column below. Animated for smooth in/out on toggle.
      style: {
        paddingRight: reorderMode ? 28 : 0,
        transition: "padding 0.18s ease"
      }
    }, groupedH.map(group => {
      const isAvoid = group.value === "avoid";
      const doneCount = group.habits.filter(h => isDone(h, selDate)).length;
      // Layered habits collapse to MAX, sub-habits roll up under their
      // parent's effective duration, so the section header time matches
      // the actual block on the calendar.
      const totalMins = cohortDurationSum(group.habits);
      const fmtTotal = totalMins >= 60 ? `${Math.floor(totalMins / 60)}h${totalMins % 60 > 0 ? ` ${totalMins % 60}m` : ""}` : totalMins > 0 ? `${totalMins}m` : "";
      // Persistent-resistance lookup: count how many of the most
      // recent resistance-log entries flagged this habit. ≥ 2 hits
      // in the last 14 days earns the card a dotted-red border
      // treatment, calling out a habit the user keeps avoiding so
      // it doesn't blend in with the others.
      const resistanceCountFor = (() => {
        const log = data.resistanceLog || {};
        const days = pastDays(14);
        const tally = {};
        for (const day of days) {
          const entry = log[day];
          if (!entry || !Array.isArray(entry.ranked)) continue;
          for (const id of entry.ranked) {
            tally[id] = (tally[id] || 0) + 1;
          }
        }
        return tally;
      })();
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
        // §13.3 — Identify the "parent" habit id used for reorder
        // grouping: for a sub-habit (parentId set) we'd reorder the
        // PARENT (all children move together), for a multi-slot row
        // we use the un-suffixed habit.id. For top-level habits this
        // resolves to habit.id directly. The card is "draggable" in
        // reorder mode only when it represents a top-level habit
        // (parentId is falsy) — sub-habit rows render inside their
        // parent's expanded block and aren't reorderable individually.
        const reorderHabitId = habit.parentId || habit.id;
        const isTopLevelForReorder = !habit.parentId;
        // §13.3g (v71) — Drag-only locals (isBeingDragged, dragOffsetY)
        // were removed alongside SortableJS. The reorder buttons live
        // inside the card render below; they call helper functions that
        // mutate `data` directly, so no transform / translateY / "is
        // dragging" state needs to flow into the card's CSS.
        const isBeingDragged = false;
        const dragOffsetY = 0;
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
            paddingRight: compact ? 8 : (ht ? "30px" : "12px"),
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
            WebkitTapHighlightColor: "transparent"
          }
        },
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
        // §13.3 — Visual-only ≡ indicator on the right edge of the
        // card when in reorder mode. SortableJS makes the WHOLE .hrow
        // draggable (see the useEffect that creates Sortable instances
        // on each .habit-grid), so no pointer handlers are needed
        // here. The old hand-rolled drag handle that lived here had
        // onPointerDown with stopPropagation/preventDefault covering
        // the entire card — which intercepted touch events before
        // Sortable could see them, leaving Sortable inert. Stripped
        // to a pure visual cue. pointerEvents: none so taps fall
        // through to Sortable's automatic .hrow draggable detection.
        // §13.3i (v72) — Per-card reorder buttons removed. Selection
        // happens via tap on the card body (see card-level onClick
        // which routes to setReorderSelectedId when reorderMode is on);
        // the ▲/▼/⇶ action buttons live in the sticky top toolbar so
        // their tap targets stay stable while cards animate underneath.
        false && (reorderMode && isTopLevelForReorder) && /*#__PURE__*/React.createElement("div", {
          className: "hrow-drag-handle-LEGACY-DEAD",
          "aria-label": "Drag to reorder",
          role: "button",
          onPointerDown: (e) => {
            e.stopPropagation();
            e.preventDefault();
            let cardEl = e.currentTarget;
            while (cardEl && !(cardEl.classList && cardEl.classList.contains("hrow"))) {
              cardEl = cardEl.parentElement;
            }
            if (!cardEl) return;
            const _pointerId = e.pointerId;
            const _slotMeta = habit._renderSlotMeta || null;
            const _slotId = habit._renderSlot || null;
            const _origSection = _slotMeta && _slotMeta.section
              ? _slotMeta.section
              : (habit.section || "morning");
            // §13.3f — Window-level pointermove/pointerup listeners
            // replace setPointerCapture + element-level handlers. iOS
            // Safari/Capacitor silently drop pointer capture when a
            // captured element's ancestor receives a CSS transform
            // mid-gesture (our card gets translateY + scale on the
            // first pointermove). Capture-dropped → element handlers
            // stop firing → drag freezes. Window listeners receive
            // every pointer event regardless of where the pointer is
            // over the page, with no capture primitive needed.
            const _onWinMove = (ev) => {
              if (ev.pointerId !== _pointerId) return;
              const r = reorderDragRef.current;
              if (!r || r.pointerId !== _pointerId) return;
              r.currentY = ev.clientY;
              r.currentX = ev.clientX;
              r.currentScrollY = window.scrollY || window.pageYOffset || 0;
              if (!r._rafScheduled) {
                r._rafScheduled = true;
                requestAnimationFrame(() => {
                  r._rafScheduled = false;
                  const cur = reorderDragRef.current;
                  if (cur) {
                    reorderDropPreviewRef.current = resolveReorderDrop(cur, cur.currentX, cur.currentY);
                  } else {
                    reorderDropPreviewRef.current = null;
                  }
                  setReorderDragTick(t => t + 1);
                });
              }
            };
            const _onWinEnd = (ev, isCancel) => {
              if (ev.pointerId !== _pointerId) return;
              const r = reorderDragRef.current;
              _cleanupWin();
              if (!r || r.pointerId !== _pointerId) {
                reorderDragRef.current = null;
                reorderDropPreviewRef.current = null;
                stopReorderAutoScroll();
                setReorderDragTick(t => t + 1);
                return;
              }
              const resolved = isCancel ? null : resolveReorderDrop(r, ev.clientX, ev.clientY);
              reorderDragRef.current = null;
              reorderDropPreviewRef.current = null;
              stopReorderAutoScroll();
              setReorderDragTick(t => t + 1);
              if (resolved && resolved.targetIndexInSection >= 0) {
                // §5.8c — Slot drags rewrite slotSections only on
                // cross-section moves; same-section slot drops are
                // no-ops (renumbering "(Part N/M)" labels mid-drag is
                // confusing). Layered drops on multi-slot drags fall
                // through to cross-section moves — "concurrent cohort"
                // is a whole-habit-level concept, not a per-slot one.
                if (r.slotId != null && r.slotArrayIdx >= 0) {
                  if (resolved.targetSection && resolved.targetSection !== r.originalSection) {
                    commitSlotReorderDrop(r.habitId, r.slotArrayIdx, resolved.targetSection);
                  }
                } else {
                  commitHabitReorderDrop(r.habitId, resolved.targetSection, resolved.targetIndexInSection, {
                    targetConcurrent: resolved.targetConcurrent,
                    layeredPeerId: resolved.layeredPeerId,
                    layeredSide: resolved.layeredSide
                  });
                }
              }
            };
            const _onWinUp = (ev) => _onWinEnd(ev, false);
            const _onWinCancel = (ev) => _onWinEnd(ev, true);
            const _cleanupWin = () => {
              try { window.removeEventListener("pointermove", _onWinMove); } catch (_) {}
              try { window.removeEventListener("pointerup", _onWinUp); } catch (_) {}
              try { window.removeEventListener("pointercancel", _onWinCancel); } catch (_) {}
            };
            window.addEventListener("pointermove", _onWinMove, { passive: true });
            window.addEventListener("pointerup", _onWinUp, { passive: true });
            window.addEventListener("pointercancel", _onWinCancel, { passive: true });
            reorderDragRef.current = {
              habitId: reorderHabitId,
              slotId: _slotId,
              slotArrayIdx: _slotMeta ? _slotMeta.arrayIdx : -1,
              pointerId: _pointerId,
              startY: e.clientY,
              currentY: e.clientY,
              currentX: e.clientX,
              startScrollY: window.scrollY || window.pageYOffset || 0,
              currentScrollY: window.scrollY || window.pageYOffset || 0,
              originalSection: _origSection,
              cardEl,
              // §13.3f — Cleanup callable stored on the ref so
              // exitReorderMode can also remove the window listeners
              // if the user exits mode mid-drag via some other path.
              _cleanupWin
            };
            startReorderAutoScroll();
            setReorderDragTick(t => t + 1);
          },
          // §13.3f — Pointer events handled via window-level listeners,
          // not element-level handlers. iOS Safari + Capacitor are
          // known to silently drop setPointerCapture when a captured
          // element's ancestor receives a CSS transform mid-gesture
          // (the dragged card gets translateY + scale(1.02) on the
          // first pointermove, immediately invalidating capture).
          // Symptom seen on production: card lags far behind finger,
          // drop preview decouples from card position. Window-level
          // listeners receive pointermove/pointerup regardless of
          // where the pointer is over the page, with no capture
          // primitive needed. The listener references live on the
          // dragRef so exitReorderMode can clean them up too.
          // onPointerMove / onPointerUp / onPointerCancel handlers
          // intentionally OMITTED here — see onPointerDown above which
          // installs window listeners for those events.
          // Block tap/double-tap propagation while in reorder mode so
          // touching the handle doesn't bubble up to the card-level
          // gated handlers.
          onClick: (e) => { e.stopPropagation(); e.preventDefault(); },
          onDoubleClick: (e) => { e.stopPropagation(); e.preventDefault(); },
          // §13.3 — In reorder mode the handle covers the ENTIRE card,
          // not just a 32px right-edge sliver. Per user feedback the
          // card body has no other functionality in reorder mode, so
          // the whole surface is a grab target. The ≡ glyph keeps its
          // visual position on the right edge via justifyContent +
          // paddingRight; alignItems: center keeps it vertically
          // centered regardless of card height (multi-row habits, etc.).
          style: {
            position: "absolute",
            top: 0, right: 0, bottom: 0, left: 0,
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            paddingRight: 12,
            cursor: "grab",
            color: "var(--c-text-faint)",
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1,
            background: "transparent",
            touchAction: "none",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            zIndex: 3
          }
        }, "≡"),
        (() => {
          // Sub-unit habits (target > 0, e.g. "8 cups of water"): the
          // button becomes an increment tap — each tap adds `increment`
          // units to today's count. When count >= target, the habit
          // auto-marks done. Tapping when done clears the whole day
          // (rolls back to 0 and un-marks). Non-subunit habits fall
          // back to the original behavior: tap only toggles off an
          // already-done/missed habit.
          // hasTarget: the habit owns a numeric target — including
          // 0 (e.g. "≤ 0 drinks"). The old `> 0` gate was excluding
          // ≤ 0 avoid habits and forcing them through the binary
          // done/missed path with no way to log unit counts.
          const hasTarget = typeof habit.target === "number";
          const isUnderOp = habit.targetOp === "<=";
          const units = (habit.completionUnits && Number(habit.completionUnits[selDate])) || 0;
          const bg = d ? "#22c55e" : missed ? "#ef4444" : (hasTarget && units > 0 ? "#3d7a3d" : "var(--c-border)");
          // Parent habits (have sub-habits) render a proportional
          // progress ring instead of the binary done/empty donut.
          // The ring fills as children are completed and only goes
          // fully green + check when every child is done. The
          // donut is non-tappable for parents — completion is
          // auto-derived, so the user can't directly mark a parent
          // done without finishing its children.
          const parentKids = habitChildren(habit);
          // In compact mode the donut shrinks to ~22px so the chip
          // can sit next to it inside a 3-up row (~120 px wide each
          // at iPhone 17 Pro width). Default keeps the original 28.
          const dSize = compact ? 22 : 28;
          if (parentKids.length > 0) {
            const kDone = parentKids.filter(c => isDone(c, selDate)).length;
            const kTotal = parentKids.length;
            const ratio = kTotal > 0 ? kDone / kTotal : 0;
            const allDone = kDone === kTotal;
            const r = compact ? 9 : 11;
            const C = 2 * Math.PI * r;
            const ringColor = allDone ? "#22c55e" : "#3d7a3d";
            return /*#__PURE__*/React.createElement("div", {
              "aria-label": kDone + " of " + kTotal + " sub-habits done",
              title: kDone + " / " + kTotal + " sub-habits done — completion auto-derives from children",
              onClick: e => e.stopPropagation(),
              onDoubleClick: e => e.stopPropagation(),
              style: {
                width: dSize, height: dSize, borderRadius: "50%",
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: allDone ? "#22c55e" : "transparent",
                boxShadow: allDone ? "0 2px 8px rgba(34,197,94,.4)" : "none",
                position: "relative",
                transition: "background .2s, box-shadow .2s"
              }
            },
              /*#__PURE__*/React.createElement("svg", {
                width: dSize, height: dSize, viewBox: "0 0 " + dSize + " " + dSize,
                style: { position: "absolute", inset: 0, transform: "rotate(-90deg)" }
              },
                /*#__PURE__*/React.createElement("circle", {
                  cx: dSize / 2, cy: dSize / 2, r,
                  fill: "none", stroke: "#e5e7eb", strokeWidth: compact ? 2.5 : 3
                }),
                /*#__PURE__*/React.createElement("circle", {
                  cx: dSize / 2, cy: dSize / 2, r,
                  fill: "none",
                  stroke: ringColor,
                  strokeWidth: compact ? 2.5 : 3,
                  strokeDasharray: (ratio * C) + " " + (C - ratio * C),
                  strokeLinecap: "round"
                })
              ),
              allDone
                ? /*#__PURE__*/React.createElement("svg", {
                    width: 14, height: 14, viewBox: "0 0 18 18", fill: "none",
                    style: { position: "relative", zIndex: 1 }
                  }, /*#__PURE__*/React.createElement("path", {
                    d: "M3.5 9L7.5 13L14.5 5",
                    stroke: "#fff",
                    strokeWidth: 2.2,
                    strokeLinecap: "round",
                    strokeLinejoin: "round"
                  }))
                : /*#__PURE__*/React.createElement("span", {
                    style: {
                      position: "relative", zIndex: 1,
                      fontSize: 9, fontWeight: 700,
                      color: ringColor,
                      fontVariantNumeric: "tabular-nums"
                    }
                  }, kDone + "/" + kTotal)
            );
          }
          return /*#__PURE__*/React.createElement("div", {
          "aria-label": hasTarget
            ? "Log " + (habit.increment || 1) + " " + (habit.unitLabel || "unit")
            : (d ? "Mark not done" : "Mark done"),
          // Stop dblclick from bubbling so a rapid double-tap on
          // the action circle stays as "increment twice" / "log
          // twice" instead of also firing the row's
          // onDoubleClick handler (which opens the edit modal).
          onDoubleClick: e => e.stopPropagation(),
          onClick: e => {
            e.stopPropagation();
            // Sub-unit habits: each tap adds habit.increment past
            // target if needed (60 → 75 → 90 …).
            // Plain habits (no target / no unit): tap toggles
            // Yes ⇄ No. Resetting a done plain habit BACK to None
            // is still done via swipe-left ("Cleared for today");
            // tap on the action circle just flips the binary.
            if (hasTarget) {
              togHabitForRow(habit.id, selDate, "increment");
            } else if (!d) {
              togHabitForRow(habit.id, selDate, "done");
            }
          },
          style: {
            width: dSize,
            height: dSize,
            borderRadius: "50%",
            border: "none",
            background: bg,
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all .2s",
            alignSelf: "center",
            boxShadow: d ? "0 2px 8px rgba(34,197,94,.4)" : missed ? "0 2px 8px rgba(239,68,68,.3)" : "none",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700
          }
        }, d ? /*#__PURE__*/React.createElement("svg", {
          width: "14",
          height: "14",
          viewBox: "0 0 18 18",
          fill: "none"
        }, /*#__PURE__*/React.createElement("path", {
          d: "M3.5 9L7.5 13L14.5 5",
          stroke: "white",
          strokeWidth: "2.2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        })) : missed ? /*#__PURE__*/React.createElement("svg", {
          width: "13",
          height: "13",
          viewBox: "0 0 16 16",
          fill: "none"
        }, /*#__PURE__*/React.createElement("path", {
          d: "M4 4L12 12M12 4L4 12",
          stroke: "white",
          strokeWidth: "2",
          strokeLinecap: "round"
        })) : hasTarget
          ? /*#__PURE__*/React.createElement("span", null,
              // Show the live count for ≤ habits (even if it's 0 of
              // 0); show min(count, target) for ≥ habits so the
              // button doesn't read past the goal mid-day.
              habit.targetOp === "<="
                ? ((habit.completionUnits && Number(habit.completionUnits[selDate])) || 0)
                : Math.min(habit.target, (habit.completionUnits && Number(habit.completionUnits[selDate])) || 0)
            )
          // Plain habit, fresh: a plain empty donut. Tap marks
          // Yes (done) — that flips the donut to a green check.
          // The "Yes" status is also surfaced on the right-side
          // chip when done (see chip render below) so the row's
          // completion state matches how sub-unit habits read.
          : /*#__PURE__*/React.createElement("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 16 16",
              fill: "none"
            }, /*#__PURE__*/React.createElement("circle", {
              cx: "8", cy: "8", r: "7", stroke: "#d1d5db", strokeWidth: "1.5"
            })));
        })(), /*#__PURE__*/React.createElement("div", {
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
            const partNum = meta.arrayIdx + 1;
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
        !isE && !reorderMode && (typeof habit.target === "number") && (() => {
          const op = habit.targetOp === "<=" ? "≤" : "≥";
          const units = (habit.completionUnits && Number(habit.completionUnits[selDate])) || 0;
          const shown = op === "≤" ? units : Math.min(habit.target, units);
          const overLimit = op === "≤" && units > habit.target;
          return /*#__PURE__*/React.createElement("span", {
            style: {
              // Fixed width + height + flexShrink:0 so the chip's
              // footprint never depends on content. The slot it
              // occupies in the row layout is locked, which means
              // the habit name to its left always reserves the
              // same horizontal space — no jitter when the count
              // grows from 1 to 12 or the unit changes from "min"
              // to "Calories". boxSizing:border-box keeps the
              // padding inside the box.
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              color: d ? "#15803d" : overLimit ? "#991b1b" : "#4b5563",
              background: d ? "#dcfce7" : overLimit ? "#fee2e2" : "var(--c-surface-muted)",
              border: "1px solid " + (d || overLimit ? "transparent" : "var(--c-border)"),
              borderRadius: 8,
              padding: "2px 3px",
              boxSizing: "border-box",
              width: 48,
              height: 32,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              marginRight: ht ? 4 : 0,
              // Keep the badge above any metadata-row pill that may
              // share the right edge in expanded state (see §5.1).
              position: "relative",
              zIndex: 2
            }
          },
            /*#__PURE__*/React.createElement("span", {
              style: { fontSize: 9, fontWeight: 600, letterSpacing: 0.1, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }
            }, op + " " + shown + "/" + habit.target),
            habit.unitLabel && /*#__PURE__*/React.createElement("span", {
              style: { fontSize: 8, fontWeight: 500, fontStyle: "italic", opacity: 0.85, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }
            }, habit.unitLabel)
          );
        })()
        );
      };
      // All four sections (morning/afternoon/evening/avoid) collapse
      // when their map value is true. Tapping the header toggles
      // collapse. Avoid defaults to expanded from the init effect.
      const collapsed = !!collapsedSections[group.value];
      return /*#__PURE__*/React.createElement("div", {
        key: group.value,
        "data-sec": group.value,
        // data-collapsed drives the desktop right-to-left collapse
        // animation (see .habit-sections-grid CSS). The body is
        // always rendered now so CSS has a target to animate; on
        // phone we still hide the body via the !collapsed gate
        // below, where the section is stacked vertically and a
        // horizontal slide makes no sense.
        "data-collapsed": collapsed ? "1" : "0",
        style: {
          marginBottom: 22,
          // §13.3 — In reorder mode, pad each section column with
          // generous bottom space so dropping a card below the last
          // habit (= "place last in this section") is easy. The
          // padding is part of the [data-sec] bounding rect used by
          // the drop resolver, so this directly expands the drop
          // target. Visible-via-position only; the column shifts
          // down by ~60px in reorder mode and snaps back on exit.
          paddingBottom: reorderMode ? 60 : 0,
          paddingTop: reorderMode ? 8 : 0,
          transition: "padding 0.18s ease",
          // Subtle hint: in reorder mode the section column gets a
          // dashed bottom edge so users see WHERE the droppable area
          // ends. Faint enough not to compete with the cards.
          borderBottom: reorderMode ? "1px dashed var(--c-border)" : "none"
        }
      }, /*#__PURE__*/React.createElement("div", {
        // Short tap = toggle collapse (same as before). Long press
        // (~600ms) opens the section-reorder modal. The pointer-based
        // handlers replace the old onClick so we can distinguish the
        // two gestures; the long-press timer fires open-reorder and
        // sets a ref flag so the subsequent pointerup doesn't ALSO
        // toggle collapse.
        // Section header is now a simple collapse toggle. The historical
        // long-press / right-click that opened the per-section organize
        // modal was retired in favor of the single global Organize
        // button in the toolbar (§13.3).
        onClick: () => setCollapsedSections(p => ({ ...p, [group.value]: !p[group.value] })),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation"
        },
        title: (collapsed ? "Expand " : "Collapse ") + group.label + " — hold to reorder"
      }, /*#__PURE__*/React.createElement("span", null, group.icon), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          color: group.color
        }
      }, group.label), fmtTotal && /*#__PURE__*/React.createElement("button", {
        type: "button",
        // Tap toggles a breakdown panel that explains how this
        // section's total was computed. stopPropagation prevents
        // the surrounding header tap (which collapses / expands
        // the section) from also firing, so the chip is its own
        // affordance and the rest of the header still toggles.
        onClick: e => {
          e.stopPropagation();
          setOpenTotalBreakdown(p => p === group.value ? null : group.value);
        },
        onPointerDown: e => e.stopPropagation(),
        onPointerUp: e => e.stopPropagation(),
        title: "Tap to see how this total is calculated",
        style: {
          fontSize: 10,
          fontWeight: 600,
          color: group.color,
          background: group.bg,
          border: `1px solid ${group.border}`,
          borderRadius: 10,
          padding: "2px 9px",
          opacity: .85,
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, fmtTotal), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          height: 1,
          background: group.border
        }
      }), !isAvoid && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#9ca3af"
        }
      }, doneCount, "/", group.habits.length),
      // Per-section ⇅ Organize button has been removed — the
      // global Organize entry point lives in the toolbar at the
      // top of the Habits page (next to the [+] add button) and
      // routes through a section picker. Long-press on the
      // section header still works as a backdoor for power users.
      // Chevron indicator — rotates 180° when the section is collapsed
      // (down arrow = "tap to expand", up arrow = "tap to collapse").
      /*#__PURE__*/React.createElement("span", {
        "aria-hidden": true,
        style: {
          display: "inline-block",
          fontSize: 10,
          lineHeight: 1,
          color: group.color,
          opacity: .7,
          transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
          transition: "transform .15s"
        }
      }, "\u25BE")),
      // Total-time breakdown panel \u2014 shown when the user tapped
      // the green chip on this section's header. Walks through
      // each cohort (concurrent habits roll up to MAX, sub-habits
      // sum into the parent) so the user sees WHY '15m' instead
      // of '25m' or '30m'.
      openTotalBreakdown === group.value && (() => {
        const cohorts = [];
        for (const h of group.habits) {
          if (h.concurrent && cohorts.length > 0) cohorts[cohorts.length - 1].push(h);
          else cohorts.push([h]);
        }
        const effDur = (h) => {
          const kids = habitChildren(h);
          if (kids.length > 0) {
            const sum = kids.reduce((s, c) => s + (parseInt(c.duration, 10) || 0), 0);
            if (sum > 0) return sum;
          }
          return parseInt(h.duration, 10) || 0;
        };
        let runningTotal = 0;
        return /*#__PURE__*/React.createElement("div", {
          style: {
            background: "var(--c-surface-raised)",
            border: "1px solid var(--c-border)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 10,
            fontSize: 11,
            color: "var(--c-text-soft)",
            lineHeight: 1.5
          }
        },
          /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--c-text-strong)", marginBottom: 6 }
          }, "How this total adds up"),
          cohorts.length === 0
            ? /*#__PURE__*/React.createElement("div", null, "No habits scheduled in this section.")
            : /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 5 }
              }, cohorts.map((cohort, ci) => {
                const isLayered = cohort.length > 1;
                const memberDurs = cohort.map(h => effDur(h));
                const cohortContribution = isLayered ? Math.max(...memberDurs) : memberDurs[0];
                runningTotal += cohortContribution;
                return /*#__PURE__*/React.createElement("div", {
                  key: "ck-" + ci,
                  style: {
                    background: isLayered ? "#dbeafe" : "var(--c-surface-muted)",
                    border: "1px solid " + (isLayered ? "#93c5fd" : "var(--c-border)"),
                    borderRadius: 6,
                    padding: "6px 8px"
                  }
                },
                  /*#__PURE__*/React.createElement("div", {
                    style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: cohort.length > 1 ? 4 : 0 }
                  },
                    /*#__PURE__*/React.createElement("span", {
                      style: { fontSize: 10, fontWeight: 700, color: isLayered ? "#1d4ed8" : "var(--c-text-soft)", textTransform: "uppercase", letterSpacing: 0.3 }
                    }, isLayered ? "\u21F6 Layered (max of " + cohort.length + ")" : "Sequential"),
                    /*#__PURE__*/React.createElement("span", {
                      style: { fontSize: 11, fontWeight: 700, color: "var(--c-text)", fontVariantNumeric: "tabular-nums" }
                    }, "+" + cohortContribution + " min")
                  ),
                  /*#__PURE__*/React.createElement("div", {
                    style: { display: "flex", flexDirection: "column", gap: 2 }
                  }, cohort.map((h, hi) => {
                    const kids = habitChildren(h);
                    const own = parseInt(h.duration, 10) || 0;
                    const kidSum = kids.reduce((s, c) => s + (parseInt(c.duration, 10) || 0), 0);
                    const eff = effDur(h);
                    const isMax = isLayered && eff === cohortContribution;
                    return /*#__PURE__*/React.createElement("div", {
                      key: "h-" + h.id,
                      style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 }
                    },
                      /*#__PURE__*/React.createElement("span", {
                        style: { color: isMax ? "#1d4ed8" : "var(--c-text-soft)", fontWeight: isMax ? 700 : 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                      }, (h.concurrent && hi > 0 ? "\u21B3 " : "") + (h.text || "(unnamed)")),
                      kids.length > 0 && kidSum > 0 && /*#__PURE__*/React.createElement("span", {
                        style: { fontSize: 10, color: "var(--c-text-soft)", fontStyle: "italic" }
                      }, kids.length + " sub \u00D7 " + (kidSum / kids.length).toFixed(0) + "m avg"),
                      /*#__PURE__*/React.createElement("span", {
                        style: { fontSize: 10, fontWeight: 600, color: isMax ? "#1d4ed8" : "var(--c-text-soft)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }
                      }, eff + "m" + (isMax ? " \u2190" : ""))
                    );
                  }))
                );
              })),
          /*#__PURE__*/React.createElement("div", {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: "1px solid var(--c-border)" }
          },
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "var(--c-text-strong)", textTransform: "uppercase", letterSpacing: 0.4 } }, "Section total"),
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: group.color, fontVariantNumeric: "tabular-nums" } }, runningTotal + " min" + (runningTotal >= 60 ? " \u00B7 " + fmtTotal : ""))
          )
        );
      })(),
      // Body: hidden when the section is collapsed. For each
      // top-level habit we render its card and (when expChildren
      // is on for that habit) its children indented underneath.
      // Consecutive habits flagged `concurrent` are grouped into a
      // flex-row so simultaneous habits sit side-by-side instead
      // of stacking vertically (mirrors the calendar day view).
      // Always render the body on desktop so CSS can animate the
      // right-to-left collapse via [data-collapsed="1"]. On phone,
      // gate on !collapsed (vertical stack — no horizontal slide).
      (deviceProfile === "phone" ? !collapsed : true) && /*#__PURE__*/React.createElement("div", { className: "habit-grid" }, (() => {
        // Walk the (already _order-sorted) section list and
        // bucket consecutive items where current.concurrent ===
        // true into one cohort. The first habit in a section
        // never starts a layered cohort on its own.
        const cohorts = [];
        for (const h of group.habits) {
          if (h.concurrent && cohorts.length > 0) {
            cohorts[cohorts.length - 1].push(h);
          } else {
            cohorts.push([h]);
          }
        }
        return cohorts.flatMap((cohort, ci) => {
          const towers = cohort.map(h => {
        // Signature: every piece of state that affects how this
        // specific card renders but isn't carried on the habit
        // object itself. If sig matches last render AND the habit
        // reference is unchanged, the shell's React.memo skips
        // re-execution of the render body.
        //
        // Target / unit / op and the running unit count for selDate
        // are stamped into the sig too so a tap-to-log or an edit
        // that bumps these values forces an immediate re-render
        // even if some upstream path failed to swap the habit
        // reference (defensive — saves should always swap, but if
        // they don't, the chip would otherwise look stale).
        const goalText = habitGoalIds(h)
          .map(gid => (data.goals || []).find(g => String(g.id) === String(gid))?.text)
          .filter(Boolean)
          .join(" ");
        const todayUnits = (h.completionUnits && h.completionUnits[selDate]) || 0;
        const targetSig = (h.target == null ? "" : h.target) + "/" + (h.targetOp || "") + "/" + (h.unitLabel || "") + "/" + todayUnits;
        const kids = habitChildren(h);
        const kidsDone = kids.filter(c => isDone(c, selDate)).length;
        // Stamp child completion + expand state into the parent's
        // sig so toggling a sub-habit (or expanding the group) bumps
        // the memo and re-renders the parent's "3/5" chip.
        const childSig = kids.length > 0 ? (kids.length + "|" + kidsDone + "|" + (expChildren[h.id] ? 1 : 0)) : "";
        // Multi-slot rollup: per-slot done states + the day-level
        // rollup, both relevant to whether THIS slot's row should
        // paint green. Without these in the sig, a toggle on one
        // slot's donut/swipe wouldn't invalidate the memo for the
        // OTHER sibling slot rows (they'd still see the old per-slot
        // state in slotCompletions and miss the "all slots done"
        // visual fallback added in renderCard). Per-row sig already
        // changes on its own slot (via the habit ref swap from
        // groupedH) — but stamping the full per-day slot map +
        // day-level rollup guarantees every sibling row also bumps,
        // covering both the desync defense and any future
        // stabilization of filtH/groupedH (today they recompute every
        // render, but if either ever gets memoized this is the
        // backstop).
        const slotSig = (() => {
          const ss = Array.isArray(h.slotSections) ? h.slotSections : null;
          if (!ss || ss.length === 0) return "";
          const sc = (h.slotCompletions && h.slotCompletions[selDate]) || {};
          const dayRollup = (h.completions && h.completions[selDate]) || "";
          // §5.8b — Stamp slot-ID-keyed state, not bare section names,
          // so a 2x-morning habit's two slots produce distinct entries
          // in the sig string (and memo invalidation fires when either
          // one toggles).
          const slotIds = ss.map((_, i) => slotIdForIndex(ss, i));
          return "s:" + slotIds.map(sid => (sc[sid] || "")).join(",") + "|d:" + dayRollup;
        })();
        // Concurrent cohorts (h.concurrent === true) share one slot
        // and split it evenly: a cohort of 2 renders as two
        // half-width cards side-by-side, a cohort of 3 as three
        // third-width cards. Compact styling tightens the inner
        // chrome (donut size, padding, chip layout) so the smaller
        // cards still read cleanly.
        const isCompact = cohort.length > 1;
        const resistSig = (resistanceCountFor[h.id] || 0);
        // Per-slot key for swipeAnim — see the matching animKey in
        // renderCard. Sig must include the slot so a swipe on one
        // multi-slot row only re-renders THAT row, not every row of
        // the same habit.
        const sigAnimKey = h._renderSlot ? h.id + ":" + h._renderSlot : h.id;
        // §6 — `parked` MUST be part of the sig. When the user taps
        // "Move to Future" the habit's parked flag flips, but if
        // parked isn't in the sig the memoized card holds its prior
        // render — leaving a ghost card on screen in the active list
        // until something else forces a sig change. That ghost was
        // the user-reported "glitchy" symptom after yesterday's bundle.
        // §13.3 — Stamp reorder mode + per-card drag state into the
        // sig so toggling reorderMode (and ticking reorderDragTick
        // while dragging) invalidates the memo for every card. The
        // dragged card's per-tick position update is included via
        // reorderDragTick, but ONLY for the card actually being
        // dragged — every other card just needs to re-render on the
        // mode toggle (not on every mousemove).
        // §5.8c — Slot-aware drag-tick stamping. Sibling slot cards of
        // the same habit should NOT re-render on every drag-tick of an
        // unrelated slot; we match on (habitId, slotId) so only the
        // actually-dragged row picks up the per-tick offset.
        const _dRef = reorderDragRef.current;
        const draggedId = _dRef ? String(_dRef.habitId) : "";
        const draggedSlotId = _dRef ? _dRef.slotId : null;
        const isThisDragged = draggedId
          && draggedId === String(h.parentId || h.id)
          && (draggedSlotId == null || draggedSlotId === (h._renderSlot || null));
        // §13.3j (v73) — Include this card's unique selection id in
        // the sig so the memoized HabitCardShell re-renders when this
        // specific slot card is selected or deselected. Multi-slot
        // cards now select INDEPENDENTLY (each card has its own slot
        // id appended after "@"); single-slot habits use bare habit.id.
        const _selCardId = h._renderSlot ? h.id + "@" + h._renderSlot : String(h.id);
        const isSelectedSig = (reorderMode && reorderSelectedId
          && String(reorderSelectedId) === _selCardId) ? 1 : 0;
        const reorderSig = (reorderMode ? "r1" : "r0")
          + "|sel" + isSelectedSig
          + "|s" + (h.section || "");
        const sig = selDate + "|" + (eHId === h.id ? 1 : 0) + "|" + (swipeAnim[sigAnimKey] || "") + "|" + (expHabitGoals[h.id] ? 1 : 0) + "|" + targetSig + "|" + goalText + "|" + childSig + "|" + slotSig + "|" + (isCompact ? "c" : "") + "|r" + resistSig + "|p" + (h.parked ? 1 : 0) + "|" + reorderSig;
        const out = [
          // §13.3h (v72) — Multi-slot fix: include _renderSlot in the
          // React key so each slot card of a multi-slot habit gets its
          // own reconciliation identity. Previously all N slot cards
          // shared `key: h.id`, which React reported as duplicate keys
          // and could coalesce in ways that looked like "cards multiply
          // on interaction" (a state-change re-render would shuffle
          // DOM nodes between the duplicate-keyed siblings).
          /*#__PURE__*/React.createElement(HabitCardShell, {
            key: h._renderSlot ? h.id + ":" + h._renderSlot : h.id,
            habit: h, sig, renderImpl: renderCard, compact: isCompact
          })
        ];
        // Sub-habit chevron + count chip — shown only when the
        // parent has children. Tapping it toggles the children's
        // visibility. Rendered as a slim row under the parent so
        // it doesn't break the parent card layout.
        if (kids.length > 0) {
          const open = !!expChildren[h.id];
          out.push(/*#__PURE__*/React.createElement("button", {
            key: h.id + ":expander",
            type: "button",
            onClick: () => setExpChildren(p => ({ ...p, [h.id]: !p[h.id] })),
            "aria-expanded": open,
            style: {
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%",
              background: "var(--c-surface-muted)",
              border: "1px solid var(--c-border)",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              padding: "5px 12px",
              marginTop: -8,
              marginBottom: 8,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7280",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent"
            }
          },
            /*#__PURE__*/React.createElement("span", null, kidsDone + " / " + kids.length + " sub-habit" + (kids.length === 1 ? "" : "s")),
            /*#__PURE__*/React.createElement("span", {
              style: { transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s", display: "inline-block" }
            }, "▸")
          ));
          // Children — each one indented inside a left-bar gutter
          // matching the parent's area-of-life color so the visual
          // grouping is obvious. The container marks the whole
          // sub-list as a unit; each child card sits at the same
          // indent level (multi-row flat hierarchy, not a tree).
          if (open) {
            const parentArea = HT.find(t => t.value === h.type);
            const parentBar = (parentArea && parentArea.color) || "#9ca3af";
            out.push(/*#__PURE__*/React.createElement("div", {
              key: h.id + ":kids",
              style: {
                marginLeft: 18,
                marginBottom: 10,
                paddingLeft: 12,
                borderLeft: "3px solid " + parentBar,
                display: "flex",
                flexDirection: "column",
                gap: 4
              }
            }, (() => {
              // Group children the same way as the top-level
              // cohort logic — consecutive concurrent children
              // sit side-by-side under the parent.
              const childCohorts = [];
              for (const c of kids) {
                if (c.concurrent && childCohorts.length > 0) {
                  childCohorts[childCohorts.length - 1].push(c);
                } else {
                  childCohorts.push([c]);
                }
              }
              const renderChild = (child, isCompact) => {
                const cGoalText = habitGoalIds(child)
                  .map(gid => (data.goals || []).find(g => String(g.id) === String(gid))?.text)
                  .filter(Boolean)
                  .join(" ");
                const cTodayUnits = (child.completionUnits && child.completionUnits[selDate]) || 0;
                const cTargetSig = (child.target == null ? "" : child.target) + "/" + (child.targetOp || "") + "/" + (child.unitLabel || "") + "/" + cTodayUnits;
                // Per-slot swipeAnim key — mirrors the parent's
                // sigAnimKey treatment so a child habit that ever
                // appears in multi-slot rendering doesn't flash
                // every row green together. Latent bug fix (sub-habits
                // inheriting parent multi-slot config).
                const cSigAnimKey = child._renderSlot ? child.id + ":" + child._renderSlot : child.id;
                // Mirror the parent slotSig logic so a child habit
                // that ever inherits a multi-slot config picks up
                // sibling-slot state changes too. No-op for the
                // overwhelming majority of children (which aren't
                // multi-slot) — returns an empty string when
                // slotSections isn't set.
                const cSlotSig = (() => {
                  const ss = Array.isArray(child.slotSections) ? child.slotSections : null;
                  if (!ss || ss.length === 0) return "";
                  const sc = (child.slotCompletions && child.slotCompletions[selDate]) || {};
                  const dayRollup = (child.completions && child.completions[selDate]) || "";
                  // §5.8b — Slot-ID-keyed sig (see parent slotSig).
                  const slotIds = ss.map((_, i) => slotIdForIndex(ss, i));
                  return "s:" + slotIds.map(sid => (sc[sid] || "")).join(",") + "|d:" + dayRollup;
                })();
                // §6 — same `parked` rule as the parent sig above.
                // §13.3 — Same reorder sig stamping as the parent
                // card. Sub-habits aren't independently draggable (the
                // PARENT carries them as a group), but they still need
                // to re-render on reorderMode toggle so their gated
                // tap/swipe handlers pick up the mode change, and so
                // their visual cue (cursor, shadow) is consistent
                // with the parent's appearance.
                const cReorderSig = (reorderMode ? "r1" : "r0") + "|d0";
                const cSig = selDate + "|" + (eHId === child.id ? 1 : 0) + "|" + (swipeAnim[cSigAnimKey] || "") + "|" + (expHabitGoals[child.id] ? 1 : 0) + "|" + cTargetSig + "|" + cGoalText + "|" + cSlotSig + "|" + (isCompact ? "c" : "") + "|p" + (child.parked ? 1 : 0) + "|" + cReorderSig;
                return /*#__PURE__*/React.createElement(HabitCardShell, { key: child.id, habit: child, sig: cSig, renderImpl: renderCard, compact: !!isCompact });
              };
              return childCohorts.map((cohort, ki) => {
                if (cohort.length === 1) return renderChild(cohort[0], false);
                return /*#__PURE__*/React.createElement("div", {
                  key: "ckg-" + h.id + "-" + ki,
                  style: { display: "flex", gap: 4 }
                }, cohort.map(child => /*#__PURE__*/React.createElement("div", {
                  key: child.id,
                  style: { flex: 1, minWidth: 0 }
                }, renderChild(child, true))));
              });
            })()));
          }
        }
          return out;
          });
          if (cohort.length === 1) return towers[0];
          // align-items:stretch (the flex default) + each tower
          // wrapper as a flex-column with the card inside set to
          // flex-grow:1 makes every card in the cohort match the
          // tallest sibling's height. A 'Read' card next to a
          // 'Read 25 pages of biography' card both render at the
          // longer card's height instead of looking ragged.
          return [/*#__PURE__*/React.createElement("div", {
            key: "rg-" + ci,
            className: "cohort-row",
            style: { display: "flex", gap: 6, marginBottom: 0, alignItems: "stretch" }
          }, towers.map((tower, ti) => /*#__PURE__*/React.createElement("div", {
            key: "rg-" + ci + "-" + ti,
            className: "cohort-tower",
            style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }
          }, tower)))];
        });
      })()));
    })), filtH.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        color: "#d1d5db",
        fontSize: 13,
        padding: "40px 0"
      }
    }, "No habits yet \u2014 add one above"),
    // \u00a76 Future Habits drawer \u2014 collapsed by default. Tap any row to
    // open the Edit Habit modal and use the "Activate" button there to
    // pull the habit back into the active list.
    (() => {
      // Includes both manually-parked habits AND habits whose
      // startDate is in the future. The drawer surfaces everything
      // that isFutureHabit() considers inactive, so users can find
      // and activate any not-yet-active habit from one place.
      const parkedHabits = (data.habits || []).filter(h => isFutureHabit(h));
      if (parkedHabits.length === 0) return null;
      // \u00a713.3 \u2014 Lock the Future Habits drawer closed while the user
      // is in reorder mode. Future-habits cards aren't part of the
      // section _order grid (they live in a separate drawer below
      // the active sections), so making them reorderable would
      // demand a parallel drop-target spec. Simpler: hide them.
      const futureDrawerOpen = showFutureHabits && !reorderMode;
      return /*#__PURE__*/React.createElement("div", {
        className: "future-habits-drawer",
        style: { marginTop: 18, marginBottom: 18, gridColumn: "1 / -1" }
      },
        /*#__PURE__*/React.createElement("div", {
          onClick: () => { if (reorderMode) return; setShowFutureHabits(p => !p); },
          title: reorderMode ? "Locked during reorder" : (showFutureHabits ? "Hide future habits" : "Show future habits"),
          style: { display: "flex", alignItems: "center", gap: 8, cursor: reorderMode ? "default" : "pointer", marginBottom: futureDrawerOpen ? 8 : 0, userSelect: "none", WebkitTapHighlightColor: "transparent", opacity: reorderMode ? 0.55 : 1 }
        },
          /*#__PURE__*/React.createElement("span", {
            style: { fontSize: 11, color: "#6b7280", transform: futureDrawerOpen ? "rotate(90deg)" : "none", transition: "transform .15s", display: "inline-block", width: 10 }
          }, "\u25b6"),
          /*#__PURE__*/React.createElement("span", {
            style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", letterSpacing: .5 }
          }, "Future Habits"),
          /*#__PURE__*/React.createElement("span", {
            style: { fontSize: 11, fontWeight: 600, color: "#9ca3af" }
          }, "(" + parkedHabits.length + ")"),
          /*#__PURE__*/React.createElement("div", { style: { flex: 1, height: 1, background: "var(--c-border)" } })
        ),
        futureDrawerOpen && /*#__PURE__*/React.createElement("div", {
          style: { display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }
        }, parkedHabits.map(h => {
          const ht = HT.find(t => t.value === h.type);
          const imp = IMP.find(i => i.value === h.importance);
          return /*#__PURE__*/React.createElement("div", {
            key: h.id,
            style: { background: "#fff", border: "1px solid " + (ht ? ht.border : "var(--c-border)"), borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.04)" },
            onClick: () => sEHabit(h),
            title: "Open habit \u2014 tap 'Activate' to move it back to the active list"
          },
            ht && /*#__PURE__*/React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: ht.color, flexShrink: 0 } }),
            /*#__PURE__*/React.createElement("div", { style: { flex: 1, fontSize: 13, color: "var(--c-text)", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" } }, h.text),
            imp && /*#__PURE__*/React.createElement("span", { style: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: imp.color, padding: "2px 7px", borderRadius: 6, background: imp.bg, border: "1px solid " + imp.border, letterSpacing: .4, whiteSpace: "nowrap" } }, h.importance)
          );
        }))
      );
    })());

  // ─── END VERBATIM BODY ────────────────────────────────────────────
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HabitsView };
} else if (typeof window !== "undefined") {
  window.HabitsView = HabitsView;
}
