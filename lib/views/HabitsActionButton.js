// lib/views/HabitsActionButton.js
//
// Action-button renderer extracted from HabitsHabitCard. Renders the
// circular button on the left of every habit row, which is one of:
//
//   * Parent (has sub-habits) -> proportional progress ring around a
//     "kDone / kTotal" label, fully green check when all children done.
//     Non-interactive (parent completion auto-derives from children).
//
//   * Sub-unit habit (habit.target is numeric) -> increment chip
//     showing the live count (or min(count, target) for >= goals).
//     Tap increments by habit.increment toward the target.
//
//   * Plain habit -> binary green check / red X / empty donut. Tap
//     marks done when fresh (the "mark missed" path goes through the
//     hover-X handle, not this button).
//
// See CLAUDE.md "File-size rule" — this extraction brings
// HabitsHabitCard.js under the 1000-LOC hard cap.

(function () {
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

  function renderActionButton(args) {
    const habit            = args.habit;
    const selDate          = args.selDate;
    const d                = args.d;
    const missed           = args.missed;
    const compact          = args.compact;
    const habitChildren    = args.habitChildren;
    const isDone           = args.isDone;
    const togHabitForRow   = args.togHabitForRow;

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
  }

  function renderTargetChip(args) {
    const habit   = args.habit;
    const selDate = args.selDate;
    const d       = args.d;
    const ht      = args.ht;

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
  }

  window.HabitsActionButton = { renderActionButton, renderTargetChip };
})();
