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
      // Reorder mode no longer reserves a right-edge scroll lane
      // (per user feedback — it read as wasted whitespace).
      style: {
        paddingRight: 0,
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
      const renderCard = (window.HabitsHabitCard && window.HabitsHabitCard.makeRenderCard({
        data, cb, h, deviceProfile,
        HT, IMP, SECTIONS, FREQ, DURS, DUR_MIN, DUR_MAX, DUR_STEP, IS, S, AB,
        pastDays, dk, tk, Glyph, getStreak, getCR, getLast14, getFreq,
        isDone, isMissed, isFutureHabit, isHabitIncomplete, isLinkedGoalIncomplete,
        cohortDurationSum, daysSinceLast, effDur, fmtDur, habitChildren, habitGoalIds,
        rowPositionInSection, habitPositionInSection,
        linkedContentForEntity, firstLinkedAudioFor, slotIdForIndex, HabitCardShell,
        dH, filtH, groupedH, reorderEntryBlockedByFilter,
        habitClickTimerRef, swipeRef,
        selDate, setSelDate, eHId, reorderMode, setReorderMode,
        reorderSelectedId, setReorderSelectedId,
        showFutureHabits, setShowFutureHabits, openTotalBreakdown, setOpenTotalBreakdown,
        expHabitGoals, setExpHabitGoals, expChildren, setExpChildren,
        swipeAnim, setSwipeAnim, setSwipeFeedback, setLinkedMediaPlayer,
        collapsedSections, setCollapsedSections,
        togHabit, moveRowWithinSection,
        toggleConcurrentForHabit, sEHabit, openNewHabitModal, setTab, exitReorderMode,
        group, isAvoid, doneCount, totalMins, fmtTotal, resistanceCountFor
      })) || (() => null);
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
        // §13.3 — Stamp reorder mode into the sig so toggling
        // reorderMode invalidates the memo for every card. (The old
        // per-drag-tick path was removed alongside the drag handle in
        // v77; the toolbar ▲/▼/⇶ reorder UX commits via dispatch and
        // re-renders on the resulting data change.)
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
