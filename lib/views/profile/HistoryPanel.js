// lib/views/profile/HistoryPanel.js
//
// Profile > Goal History panel: completed goals + every habit/goal
// edit, with an expandable per-habit version timeline drill-down.
//
// Wave 4.4.4. Originally inline at index.html L16150-L16461 inside the
// showProfile IIFE. Bundles three pieces that travel together:
//   - fmtEventWhen (compact "Today / Yesterday / Nd ago / date" helper)
//   - renderHabitVersionTimeline (clickable drill-down for habit-edited
//     rows that walks h.history and diffs against the next snapshot)
//   - the historyPanel render itself
//
// VERBATIM body extraction with helpers-bag pattern.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function HistoryPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const data = h.data || {};
    const sectionTitle = h.sectionTitle;
    const HT = h.HT || (typeof window !== "undefined" && window.HT) || [];
    const historyEvents = h.historyEvents || [];
    const historyDrillHabitId = h.historyDrillHabitId;
    const setHistoryDrillHabitId = h.setHistoryDrillHabitId || (() => {});

    const fmtEventWhen = (ms) => {
      if (!ms) return "—";
      const days = Math.floor((Date.now() - ms) / 86400000);
      // Future-ts (clock skew or bad data) renders as a literal
      // "Future" rather than silently collapsing into "Today" — both
      // labels are honest and the row still sorts correctly.
      if (days < 0) return "Future";
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return days + "d ago";
      return new Date(ms).toLocaleDateString();
    };
    // §VersionTimeline — build the per-habit version timeline for the
    // currently-expanded habit (historyDrillHabitId). Walks h.history
    // chronologically, diffing each entry against the NEXT entry so
    // each node shows what changed FROM the previous version. The
    // oldest snapshot is the "Initial state" node. Returns null when
    // no habit is selected or the habit can't be found.
    const renderHabitVersionTimeline = () => {
      if (!historyDrillHabitId) return null;
      const habit = (data.habits || []).find(h => String(h.id) === String(historyDrillHabitId));
      if (!habit) return null;
      // Each `h.history[i]` is the OLD state at the time snapshot ts.
      // Sort ascending so the oldest snapshot lives at the bottom and
      // newer snapshots accumulate upward (most-recent edit at top).
      const snaps = Array.isArray(habit.history)
        ? habit.history.filter(s => s && typeof s.ts === "number").slice().sort((a, b) => a.ts - b.ts)
        : [];
      // Compose the full version sequence:
      //   snaps[0] (oldest old-state) ← snaps[1] ← … ← snaps[last] ← currentLiveState
      // Each version's `nextStateAfterThis` is the version that came
      // AFTER it (i.e. either the next snapshot's OLD-state, or the
      // current live state for the latest snapshot). We diff each
      // version against its successor to show "what changed here".
      const liveState = {
        text: habit.text,
        duration: habit.duration || null,
        type: habit.type || null,
        importance: habit.importance || "Important",
        section: habit.section || "morning",
        slotSections: Array.isArray(habit.slotSections) ? habit.slotSections : [],
        notes: habit.notes || null,
        frequency: habit.frequency || null,
        target: typeof habit.target === "number" ? habit.target : null,
        targetOp: habit.targetOp || ">=",
        unitLabel: habit.unitLabel || null,
        increment: typeof habit.increment === "number" ? habit.increment : null
      };
      // versions[] reverse-chrono: current live first, then snapshots
      // newest→oldest. The "Initial state" label attaches to the LAST
      // (oldest) item in the array.
      const versions = [];
      versions.push({ ts: snaps.length > 0 ? snaps[snaps.length - 1].ts : (habit.id || 0), state: liveState, isCurrent: true, isInitial: snaps.length === 0 });
      for (let i = snaps.length - 1; i >= 0; i--) {
        versions.push({ ts: snaps[i].ts, state: snaps[i], isCurrent: false, isInitial: i === 0 });
      }
      // Diff helper — fields the user would recognize as "what changed".
      const labelOf = (key, val) => {
        if (val == null || val === "") return "—";
        if (key === "frequency") {
          const t = val && val.type;
          if (!t) return "—";
          if (t === "daily") return "Daily";
          if (t === "weekdays") return "Weekdays" + (Array.isArray(val.days) && val.days.length ? " (" + val.days.length + " days)" : "");
          if (t === "weekly") return "Weekly";
          if (t === "monthly") return "Monthly";
          if (t === "quarterly") return "Quarterly";
          if (t === "annual") return "Annual";
          return String(t);
        }
        if (key === "slotSections") {
          if (!Array.isArray(val) || val.length === 0) return "single slot";
          return val.length + " slots (" + val.join(", ") + ")";
        }
        return String(val);
      };
      const diffVersion = (cur, nextVer) => {
        // Comparison target: the version AFTER this one (chronologically).
        // versions is reverse-chrono so `nextVer` is the index-1 item
        // toward the front, which is chronologically NEWER. We want to
        // know what changed AT THIS edit, so we compare this version's
        // OLD state with the state it transitioned INTO — which is the
        // version above it in reverse-chrono (nextVer).
        if (!nextVer) return [];
        const a = cur.state;
        const b = nextVer.state;
        const fields = [
          ["text",        "Name"],
          ["section",     "Section"],
          ["slotSections","Slots"],
          ["importance",  "Importance"],
          ["duration",    "Duration"],
          ["target",      "Target"],
          ["targetOp",    "Target op"],
          ["unitLabel",   "Unit"],
          ["frequency",   "Frequency"]
        ];
        const out = [];
        for (const [k, lbl] of fields) {
          const av = a ? a[k] : null;
          const bv = b ? b[k] : null;
          const aKey = JSON.stringify(av == null ? null : av);
          const bKey = JSON.stringify(bv == null ? null : bv);
          if (aKey !== bKey) {
            out.push({ label: lbl, before: labelOf(k, av), after: labelOf(k, bv) });
          }
        }
        return out;
      };
      const headerName = habit.text || "Untitled habit";
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: "var(--c-surface-muted)",
          border: "1px solid var(--c-border)",
          borderRadius: 12,
          padding: "12px 14px",
          marginTop: 10,
          marginBottom: 4
        }
      },
        /*#__PURE__*/React.createElement("div", {
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }
        },
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {
              style: { fontSize: 10, fontWeight: 700, color: "var(--c-text-faint)", letterSpacing: 0.3, textTransform: "uppercase" }
            }, "Edits to"),
            /*#__PURE__*/React.createElement("div", {
              style: { fontSize: 14, fontWeight: 700, color: "var(--c-text-strong)", wordBreak: "break-word" }
            }, "“", headerName, "”"),
            habit.archived ? /*#__PURE__*/React.createElement("div", {
              style: { fontSize: 10, color: "var(--c-text-faint)", fontStyle: "italic", marginTop: 2 }
            }, "Archived — superseded by a newer habit") : null
          ),
          /*#__PURE__*/React.createElement("button", {
            type: "button",
            onClick: () => setHistoryDrillHabitId(null),
            style: {
              background: "var(--c-surface-raised)",
              border: "1px solid var(--c-border)",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 11, fontWeight: 600, color: "var(--c-text-soft)",
              cursor: "pointer"
            }
          }, "Close")
        ),
        /*#__PURE__*/React.createElement("div", {
          style: { display: "flex", flexDirection: "column", gap: 8 }
        }, versions.map((v, idx) => {
          // For current-live (idx=0) there is no "after" — render the
          // live state as-is. For older snapshots, diff against the
          // version above this one in reverse-chrono order, which is
          // the chronologically NEWER state this version transitioned
          // into.
          const changes = v.isCurrent ? [] : diffVersion(v, versions[idx - 1] || null);
          const isOldest = v.isInitial;
          const tsLabel = v.isCurrent ? "Current" : fmtEventWhen(v.ts);
          return /*#__PURE__*/React.createElement("div", {
            key: "ver-" + idx + "-" + v.ts,
            style: {
              display: "flex", gap: 10, alignItems: "stretch",
              padding: "8px 10px",
              background: "var(--c-surface-raised)",
              border: "1px solid var(--c-border)",
              borderRadius: 10
            }
          },
            // Left rail: dot + dashed connector down to the next node.
            /*#__PURE__*/React.createElement("div", {
              style: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }
            },
              /*#__PURE__*/React.createElement("div", {
                style: {
                  width: 10, height: 10, borderRadius: "50%",
                  background: v.isCurrent ? "var(--c-tint-success-fg)" : (isOldest ? "var(--c-text-faint)" : "var(--c-tint-purple-fg)"),
                  flexShrink: 0
                }
              }),
              idx < versions.length - 1 ? /*#__PURE__*/React.createElement("div", {
                style: { flex: 1, width: 2, background: "var(--c-border)", marginTop: 2, minHeight: 14 }
              }) : null
            ),
            /*#__PURE__*/React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }
              },
                /*#__PURE__*/React.createElement("span", {
                  style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: v.isCurrent ? "var(--c-tint-success-fg)" : "var(--c-text-soft)" }
                }, v.isCurrent ? "Current state" : (isOldest ? "Initial state" : "Version")),
                /*#__PURE__*/React.createElement("span", {
                  style: { fontSize: 10, color: "var(--c-text-faint)", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }
                }, tsLabel)
              ),
              /*#__PURE__*/React.createElement("div", {
                style: { fontSize: 13, fontWeight: 600, color: "var(--c-text)", wordBreak: "break-word", lineHeight: 1.3 }
              }, v.state.text || "Untitled"),
              // Show changed fields when this version transitioned into
              // the next. For current-live (no successor) and the
              // initial state with no successor, render a compact
              // summary of the absolute fields instead.
              v.isCurrent || changes.length === 0
                ? /*#__PURE__*/React.createElement("div", {
                    style: { fontSize: 11, color: "var(--c-text-soft)", marginTop: 4, lineHeight: 1.5 }
                  },
                    "Section: ", labelOf("section", v.state.section), " · ",
                    "Importance: ", labelOf("importance", v.state.importance),
                    v.state.target != null ? " · Target: " + labelOf("targetOp", v.state.targetOp) + " " + labelOf("target", v.state.target) + (v.state.unitLabel ? " " + v.state.unitLabel : "") : "",
                    Array.isArray(v.state.slotSections) && v.state.slotSections.length >= 2 ? " · " + labelOf("slotSections", v.state.slotSections) : ""
                  )
                : /*#__PURE__*/React.createElement("div", {
                    style: { marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }
                  },
                    changes.map((c, ci) => /*#__PURE__*/React.createElement("div", {
                      key: "ch-" + ci,
                      style: { fontSize: 11, color: "var(--c-text-soft)", lineHeight: 1.4 }
                    },
                      /*#__PURE__*/React.createElement("span", { style: { fontWeight: 600 } }, c.label, ": "),
                      /*#__PURE__*/React.createElement("span", { style: { fontStyle: "italic" } }, c.before),
                      " → ",
                      /*#__PURE__*/React.createElement("span", { style: { fontWeight: 600 } }, c.after)
                    ))
                  )
            )
          );
        }))
      );
    };
    const historyPanel = /*#__PURE__*/React.createElement("div", null,
      sectionTitle("History"),
      /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: "#6b7280", marginBottom: 12 } }, "Completed goals, plus every edit you've made to a goal or habit. Tap any “Habit edited” row to see the full version timeline. Newest first."),
      historyEvents.length === 0 ? /*#__PURE__*/React.createElement("div", {
        style: { textAlign: "center", color: "#d1d5db", fontSize: 13, padding: "40px 0" }
      }, "No history yet — keep using the app and edits will land here.") : /*#__PURE__*/React.createElement("div", {
        style: { display: "flex", flexDirection: "column", gap: 8 }
      }, historyEvents.map(ev => {
        const ht = HT.find(t => t.value === ev.type);
        const isCompleted = ev.kind === "goal-completed";
        const isGoalEdit = ev.kind === "goal-edited";
        const isHabitEdit = ev.kind === "habit-edited";
        // §dark-mode — bare hex codes for dot/label render harshly on
        // the dark surface. Pipe through CSS vars so light + dark
        // themes both get a readable accent. #2d5a2d is the verrocchio
        // brand green; we keep it for goal-edit because it's a
        // brand-stable mark, but route through --c-tint-brand-fg so
        // dark mode lightens it to the legible green token.
        const dotColor = isCompleted ? "var(--c-tint-success-fg)" : isGoalEdit ? "var(--c-tint-brand-fg)" : "var(--c-tint-purple-fg)";
        const kindLabel = isCompleted ? "Goal completed" : isGoalEdit ? "Goal edited" : "Habit edited";
        // §VersionTimeline — habit-edited rows are clickable and toggle
        // an inline per-habit timeline. Goal-edited / goal-completed
        // rows remain passive.
        const isExpanded = isHabitEdit && historyDrillHabitId != null && String(historyDrillHabitId) === String(ev.habitId);
        const rowEl = /*#__PURE__*/React.createElement("div", {
          key: ev.id,
          onClick: isHabitEdit ? () => setHistoryDrillHabitId(isExpanded ? null : ev.habitId) : undefined,
          role: isHabitEdit ? "button" : undefined,
          tabIndex: isHabitEdit ? 0 : undefined,
          onKeyDown: isHabitEdit ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setHistoryDrillHabitId(isExpanded ? null : ev.habitId);
            }
          } : undefined,
          style: {
            background: "var(--c-surface-raised)",
            border: "1px solid " + (isExpanded ? "var(--c-tint-purple-fg)" : "#e5e7eb"),
            borderRadius: 10,
            padding: "10px 12px",
            cursor: isHabitEdit ? "pointer" : "default"
          }
        },
          /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: ev.prevText || ev.nextGoal ? 6 : 0 } },
            /*#__PURE__*/React.createElement("div", {
              style: { width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }
            }),
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: dotColor, letterSpacing: 0.3, textTransform: "uppercase" } }, kindLabel),
            ht && /*#__PURE__*/React.createElement("span", {
              style: { fontSize: 9, fontWeight: 700, color: ht.color, background: ht.bg, border: "1px solid " + ht.border, borderRadius: 8, padding: "1px 6px" }
            }, ht.value),
            isHabitEdit && ev.archived ? /*#__PURE__*/React.createElement("span", {
              style: { fontSize: 9, fontWeight: 700, color: "var(--c-text-soft)", background: "var(--c-surface-muted)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "1px 6px" }
            }, "ARCHIVED") : null,
            /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, color: "#9ca3af", marginLeft: "auto", fontVariantNumeric: "tabular-nums" } }, fmtEventWhen(ev.ts)),
            isHabitEdit ? /*#__PURE__*/React.createElement("span", {
              "aria-hidden": true,
              style: { fontSize: 12, color: "var(--c-text-faint)", marginLeft: 4 }
            }, isExpanded ? "▴" : "▾") : null
          ),
          /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 13, fontWeight: 600, color: "var(--c-text)", wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.3 }
          }, ev.name),
          ev.prevText && ev.prevText !== ev.name ? /*#__PURE__*/React.createElement("div", {
            style: { fontSize: 11, color: "var(--c-text-soft)", fontStyle: "italic", marginTop: 4, lineHeight: 1.4 }
          }, "Previously: “", ev.prevText, "”") : null,
          ev.nextGoal ? /*#__PURE__*/React.createElement("div", {
            style: { display: "flex", alignItems: "center", gap: 6, background: "var(--c-tint-success-bg)", borderRadius: 8, padding: "8px 10px", marginTop: 8 }
          }, /*#__PURE__*/React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "#2d5a2d", strokeWidth: "2" }, /*#__PURE__*/React.createElement("polyline", { points: "9 18 15 12 9 6" })),
             /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, color: "#2d5a2d", fontWeight: 500 } }, "Next: ", ev.nextGoal.text)) : null
        );
        // When this row is expanded, append the version-timeline panel
        // immediately below. Wrapping in a fragment with a unique key
        // keeps React reconciliation stable.
        if (isExpanded) {
          return /*#__PURE__*/React.createElement(React.Fragment, { key: ev.id + "-frag" }, rowEl, renderHabitVersionTimeline());
        }
        return rowEl;
      }))
    );
    return historyPanel;
  }

  window.HistoryPanel = HistoryPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = HistoryPanel;
  }
})();
