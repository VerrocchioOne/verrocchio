// lib/views/HabitsReorderToolbar.js
//
// Two-row (sometimes three-row) sticky toolbar pinned to the viewport
// top when habit reorder mode is active. Extracted from HabitsView.js
// to keep that file moving toward the 1000-LOC cap (see CLAUDE.md
// "File-size rule").
//
// Row 1: "Organize" label + selection text + Done button.
// Row 2: ▲ Up / ▼ Down / ⇶ Layer action buttons. Tap moves the
//        currently-SELECTED card; the buttons themselves stay put.
// Row 3 (only when a multi-slot slot is selected): per-slot section
//        picker (morning / afternoon / evening). Moves THIS slot
//        independently of the habit's other slots.
//
// All position math (rowPositionInSection, habitPositionInSection) and
// all mutating callbacks (exit, move, toggle-concurrent, slot-drop)
// flow in via props — this component is pure-render with no closure
// over HabitsView's state.
//
// Props bundle:
//   reorderSelectedId       — current selection id ("habitId" or "habitId@slotId")
//   habits                  — data.habits[] for selection lookup
//   rowPositionInSection    — (id) -> { isFirst, isLast } | null
//   habitPositionInSection  — (habitId) -> { isFirst, isLast } | null
//   onExitReorder           — () -> void
//   onMoveRow               — (id, dir) -> void  (dir is -1 / +1)
//   onToggleConcurrent      — (habitId) -> void
//   onCommitSlotDrop        — (habitId, slotArrayIdx, sec) -> void
//   setReorderSelectedId    — (id|null) -> void

(function () {
  if (typeof window === "undefined" || !window.React) return;
  const R = window.React;

  function HabitsReorderToolbar(props) {
    const reorderSelectedId      = props && props.reorderSelectedId;
    const habits                 = (props && props.habits) || [];
    const rowPositionInSection   = (props && props.rowPositionInSection)   || (() => null);
    const habitPositionInSection = (props && props.habitPositionInSection) || (() => null);
    const onExitReorder          = (props && props.onExitReorder)          || (() => {});
    const onMoveRow              = (props && props.onMoveRow)              || (() => {});
    const onToggleConcurrent     = (props && props.onToggleConcurrent)     || (() => {});
    const onCommitSlotDrop       = (props && props.onCommitSlotDrop)       || (() => {});
    const setReorderSelectedId   = (props && props.setReorderSelectedId)   || (() => {});

    // §13.3j (v73) — Parse the slot-aware selection id. Format:
    //   "habitId"            → single-slot habit selected
    //   "habitId@slotId"     → specific slot of multi-slot habit
    //                          selected (slotId looks like
    //                          "morning:0", "afternoon:1", etc.)
    const _selParts = reorderSelectedId
      ? String(reorderSelectedId).split("@")
      : [];
    const selHabitId = _selParts[0] || null;
    const selSlotId  = _selParts[1] || null;
    const selHabit = selHabitId
      ? habits.find(h => String(h.id) === String(selHabitId))
      : null;
    // For the slot picker row: find the arrayIdx of the selected
    // slot in the habit's slotSections so we can call
    // onCommitSlotDrop with the right index. slotId encodes
    // section + per-section local index (e.g., "morning:0"); we
    // need to map that back to the global arrayIdx in slotSections.
    const selIsSlot = !!(selSlotId && selHabit && Array.isArray(selHabit.slotSections) && selHabit.slotSections.length >= 2);
    const selSlotArrayIdx = (() => {
      if (!selIsSlot) return -1;
      // slotId = "section:localIdx" — find the Nth occurrence of
      // `section` in slotSections (where N = localIdx).
      const colon = selSlotId.lastIndexOf(":");
      if (colon < 0) return -1;
      const sec = selSlotId.slice(0, colon);
      const localIdx = parseInt(selSlotId.slice(colon + 1), 10);
      if (!Number.isFinite(localIdx)) return -1;
      let seen = 0;
      for (let i = 0; i < selHabit.slotSections.length; i++) {
        if (selHabit.slotSections[i] === sec) {
          if (seen === localIdx) return i;
          seen += 1;
        }
      }
      return -1;
    })();
    const selSlotCurrentSection = selIsSlot && selSlotArrayIdx >= 0
      ? selHabit.slotSections[selSlotArrayIdx]
      : null;
    // §13.3k (v74) — Position info now uses rowPositionInSection,
    // which is slot-aware. For a slot row, ▲/▼ moves that slot
    // INDEPENDENTLY of the habit's other slots (the slot card can
    // sit before/after any other habit's card in the same section).
    // For a single-slot habit, it works exactly like before.
    // ⇶ still operates whole-habit because cohort linkage is a
    // habit-level concept; we look up the habit-level position for
    // the ⇶ disabled state.
    const selRowPos = reorderSelectedId
      ? rowPositionInSection(reorderSelectedId)
      : null;
    const selHabitPos = selHabitId
      ? habitPositionInSection(selHabitId)
      : null;
    const selLabel = selHabit
      ? (selIsSlot
          ? selHabit.text + "  · slot in " + selSlotCurrentSection
          : selHabit.text)
      : "Tap a card to select";
    const selConcurrent = !!(selHabit && selHabit.concurrent);
    const canUp    = !!selRowPos && !selRowPos.isFirst;
    const canDown  = !!selRowPos && !selRowPos.isLast;
    const canLayer = !!selHabitPos && !selHabitPos.isFirst;
    const btnStyle = (enabled, isLayerActive) => ({
      flex: 1,
      minHeight: 44,
      padding: "8px 0",
      border: "1px solid " + (isLayerActive ? "#93c5fd" : "var(--c-border)"),
      borderRadius: 8,
      background: isLayerActive
        ? "#dbeafe"
        : (enabled ? "var(--c-surface, #fff)" : "var(--c-surface-muted)"),
      color: isLayerActive
        ? "#1d4ed8"
        : (enabled ? "var(--c-text)" : "var(--c-text-faint)"),
      fontSize: 14, fontWeight: 700,
      cursor: enabled ? "pointer" : "default",
      opacity: enabled ? 1 : 0.5,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6
    });
    return R.createElement("div", {
      style: {
        // Sticky (not fixed) to match the Verrocchio Header — fixed was
        // being captured by an ancestor's containing block (a
        // transform/filter somewhere in App), so the toolbar scrolled
        // away with the page. Sticky stays glued to top:0 of the
        // viewport as long as no ancestor has overflow:hidden.
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--c-surface-raised)",
        borderBottom: "1px solid var(--c-border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex", flexDirection: "column",
        padding: "8px 12px 10px"
      }
    },
      // Row 1: title (+ selection state) + Done
      R.createElement("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }
      },
        R.createElement("div", {
          style: { display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }
        },
          R.createElement("div", {
            style: { fontSize: 11, fontWeight: 700, color: "var(--c-text-soft)", textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1.2 }
          }, "Organize"),
          R.createElement("div", {
            style: {
              fontSize: 13, fontWeight: 600,
              color: selHabit ? "var(--c-text-strong)" : "var(--c-text-faint)",
              lineHeight: 1.2, marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }
          }, selLabel)
        ),
        R.createElement("button", {
          type: "button",
          onClick: () => onExitReorder(),
          style: {
            background: "#2d5a2d", color: "#fff", border: "none",
            borderRadius: 999, padding: "8px 18px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0
          }
        }, "Done")
      ),
      // Row 2: stable action buttons. Tapping these moves the
      // SELECTED card; the buttons themselves stay put. Disabled
      // until a card is selected.
      R.createElement("div", {
        style: { display: "flex", gap: 8 }
      },
        R.createElement("button", {
          type: "button",
          "aria-label": "Move selected card up",
          disabled: !canUp,
          onClick: () => { if (canUp) onMoveRow(reorderSelectedId, -1); },
          style: btnStyle(canUp, false)
        }, "▲ Up"),
        R.createElement("button", {
          type: "button",
          "aria-label": "Move selected card down",
          disabled: !canDown,
          onClick: () => { if (canDown) onMoveRow(reorderSelectedId, 1); },
          style: btnStyle(canDown, false)
        }, "▼ Down"),
        R.createElement("button", {
          type: "button",
          "aria-label": selConcurrent ? "Stop layering selected habit" : "Layer selected habit with the one above",
          disabled: !canLayer,
          onClick: () => { if (canLayer) onToggleConcurrent(selHabitId); },
          style: btnStyle(canLayer, selConcurrent && canLayer)
        }, "⇶ " + (selConcurrent ? "Unlayer" : "Layer"))
      ),
      // §13.3j (v73) — Row 3: per-slot section picker, only when a
      // multi-slot SLOT card is selected. Lets the user move THIS
      // slot to a different section without touching the others.
      // Calls onCommitSlotDrop which rewrites slotSections[i]
      // and rekeys slot completion history correctly. After the
      // move the slot's _renderSlot changes (slotId is derived
      // from section + per-section index), so the old selection id
      // is stale — we clear it.
      selIsSlot && R.createElement("div", {
        style: { display: "flex", gap: 6, marginTop: 8, alignItems: "center" }
      },
        R.createElement("span", {
          style: { fontSize: 11, color: "var(--c-text-soft)", marginRight: 4, flexShrink: 0 }
        }, "Move slot to:"),
        ...["morning", "afternoon", "evening"].map(sec => {
          const isCurrent = sec === selSlotCurrentSection;
          return R.createElement("button", {
            key: "slot-sec-" + sec,
            type: "button",
            "aria-label": "Move slot to " + sec,
            disabled: isCurrent || selSlotArrayIdx < 0,
            onClick: () => {
              if (isCurrent || selSlotArrayIdx < 0) return;
              onCommitSlotDrop(selHabitId, selSlotArrayIdx, sec);
              // The slot's _renderSlot id changes after the move
              // (it's section-relative), so clear selection.
              setReorderSelectedId(null);
            },
            style: {
              flex: 1, minHeight: 36, padding: "6px 8px",
              border: "1px solid " + (isCurrent ? "#2d5a2d" : "var(--c-border)"),
              borderRadius: 8,
              background: isCurrent ? "var(--c-tint-success-bg)" : "var(--c-surface, #fff)",
              color: isCurrent ? "#2d5a2d" : "var(--c-text)",
              fontSize: 12, fontWeight: 600,
              cursor: isCurrent ? "default" : "pointer",
              opacity: isCurrent ? 0.85 : 1,
              textTransform: "capitalize"
            }
          }, sec);
        })
      )
    );
  }

  window.HabitsReorderToolbar = HabitsReorderToolbar;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { HabitsReorderToolbar };
  }
})();
