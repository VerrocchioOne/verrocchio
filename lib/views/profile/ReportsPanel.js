// lib/views/profile/ReportsPanel.js
//
// Profile > Habit Reports panel: overview buckets (attention, strongest,
// falling behind) + per-habit heatmap list with shared range toggle.
//
// Wave 4.4.5. Originally inline at index.html L16164-L16349 inside the
// showProfile IIFE. Includes the cluster of closures the panel depends
// on (allHabitsForReport, heatmapRange, rangeBtn, activeReportHabits,
// last14ByHabit, needsAttention, strongest, fallingBehind, sparkline7,
// overviewRow, reportsTopStatRow, overviewBucket, overviewView,
// subTabBtn, perHabitView) so the panel render at the bottom can be
// evaluated in this scope.
//
// VERBATIM body extraction with helpers-bag pattern.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function ReportsPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const data = h.data || {};
    const sectionTitle = h.sectionTitle;
    const getStreak = h.getStreak || (() => 0);
    const getCR = h.getCR || (() => ({ pct: 0 }));
    const getLast14 = h.getLast14 || (() => []);
    const isDone = h.isDone || (() => false);
    const tk = h.tk || (() => "");
    const reportHeatmapRange = h.reportHeatmapRange || "month";
    const setReportHeatmapRange = h.setReportHeatmapRange || (() => {});
    const reportsSubTab = h.reportsSubTab || "overview";
    const setReportsSubTab = h.setReportsSubTab || (() => {});
    const YearHeatmap = h.YearHeatmap || (typeof window !== "undefined" && window.YearHeatmap) || (() => null);

    // §6 Future Habits — parked habits hide from the Reports panel.
    // They aren't being practiced; surfacing them in attention/strongest/
    // falling-behind buckets or the per-habit heatmap list would be noise.
    const allHabitsForReport = (data.habits || []).filter(h => !h.parked).slice().sort((a, b) => getStreak(b) - getStreak(a));
    // Shared range for every heatmap in the reports panel. Persisted
    // on the session via useState so flipping the toggle re-renders
    // every row in sync.
    const heatmapRange = reportHeatmapRange;
    const rangeBtn = (val, label) => /*#__PURE__*/React.createElement("button", {
      key: val,
      type: "button",
      onClick: () => setReportHeatmapRange(val),
      style: {
        flex: 1, minHeight: 32, padding: "6px 10px",
        border: "1px solid " + (heatmapRange === val ? "#2d5a2d" : "var(--c-border)"),
        borderRadius: 8,
        background: heatmapRange === val ? "var(--c-tint-success-bg)" : "var(--c-surface, #fff)",
        color: heatmapRange === val ? "#2d5a2d" : "#6b7280",
        fontSize: 12, fontWeight: heatmapRange === val ? 700 : 500,
        cursor: "pointer"
      }
    }, label);
    // Overview sub-view (§11.4): scannable at-a-glance buckets so the
    // user can answer "is anything broken?" in 5 seconds. The full
    // heatmap-per-habit list lives in the Per-habit sub-tab.
    const activeReportHabits = (data.habits || []).filter(h => h.section !== "avoid" && !h.parked);
    const impOrder = (v) => v === "Non-Negotiable" ? 0 : v === "Important" ? 1 : v === "Additive" ? 2 : 3;
    const needsAttention = activeReportHabits
      .filter(h => getCR(h).pct < 50)
      .sort((a, b) => {
        const ai = impOrder(a.importance);
        const bi = impOrder(b.importance);
        if (ai !== bi) return ai - bi;
        return getCR(a).pct - getCR(b).pct;
      });
    const strongest = activeReportHabits
      .filter(h => getStreak(h) > 0)
      .sort((a, b) => getStreak(b) - getStreak(a))
      .slice(0, 5);
    // §perf — Build last14 map once per habit and share between
    // fallingBehind compute and the sparkline7 render. Was N×14 array
    // allocations on every Overview tab render (audit HIGH).
    const last14ByHabit = new Map();
    for (const h of activeReportHabits) last14ByHabit.set(h.id, getLast14(h));
    const fallingBehind = activeReportHabits.map(h => {
      const l14 = last14ByHabit.get(h.id);
      const last7Pct  = l14.slice(7).filter(d => d.done).length / 7 * 100;
      const prior7Pct = l14.slice(0, 7).filter(d => d.done).length / 7 * 100;
      return { h, drop: prior7Pct - last7Pct, last7Pct };
    }).filter(r => r.drop > 20).sort((a, b) => b.drop - a.drop);
    const sparkline7 = (h) => /*#__PURE__*/React.createElement("div", {
      style: { display: "flex", gap: 2, flexShrink: 0 }
    }, (last14ByHabit.get(h.id) || getLast14(h)).slice(7).map((d, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      title: d.k + (d.done ? " — done" : " — not done"),
      style: { width: 6, height: 14, borderRadius: 1, background: d.done ? "#2d5a2d" : "#e5e7eb" }
    })));
    const overviewRow = (h, extra) => /*#__PURE__*/React.createElement("div", {
      key: h.id,
      style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 8 }
    },
      /*#__PURE__*/React.createElement("span", {
        style: { flex: 1, fontSize: 12, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }
      }, h.text),
      extra ? /*#__PURE__*/React.createElement("span", {
        style: { fontSize: 11, color: "var(--c-text-soft)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }
      }, extra) : null,
      sparkline7(h)
    );
    const reportsTopStatRow = /*#__PURE__*/React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }
    }, (() => {
      const hs = activeReportHabits;
      const bestStreak = hs.length ? Math.max(0, ...hs.map(h => getStreak(h))) : 0;
      const avgRate = hs.length ? Math.round(hs.reduce((s, h) => s + getCR(h).pct, 0) / hs.length) : 0;
      const doneToday = hs.filter(h => isDone(h, tk())).length;
      return [
        { label: "Best Streak", value: bestStreak + "d" },
        { label: "Avg Rate", value: avgRate + "%" },
        { label: "Done Today", value: doneToday + "/" + hs.length }
      ].map((s, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: { background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }
      },
        /*#__PURE__*/React.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 700, color: "#2d5a2d" } }, s.value),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .3 } }, s.label)
      ));
    })());
    const overviewBucket = (title, color, count, rows) => /*#__PURE__*/React.createElement("div", {
      style: { marginBottom: 18 }
    },
      /*#__PURE__*/React.createElement("div", {
        style: { fontSize: 11, fontWeight: 700, color, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }
      }, title, " · ", count),
      /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, rows)
    );
    const overviewView = /*#__PURE__*/React.createElement("div", null,
      reportsTopStatRow,
      needsAttention.length > 0 ? overviewBucket(
        "Attention needed", "#991b1b", needsAttention.length,
        needsAttention.map(h => overviewRow(h, getCR(h).pct + "% · " + getStreak(h) + "d"))
      ) : null,
      strongest.length > 0 ? overviewBucket(
        "Strongest performers", "#2d5a2d",
        strongest.length === 1 ? "1 habit" : "top " + Math.min(5, strongest.length),
        strongest.map(h => overviewRow(h, getStreak(h) + "d · " + getCR(h).pct + "%"))
      ) : null,
      fallingBehind.length > 0 ? overviewBucket(
        "Falling behind", "#c2410c", fallingBehind.length,
        fallingBehind.map(r => overviewRow(r.h, "−" + Math.round(r.drop) + "pp · " + Math.round(r.last7Pct) + "% now"))
      ) : null,
      (needsAttention.length === 0 && strongest.length === 0 && fallingBehind.length === 0) ? /*#__PURE__*/React.createElement("div", {
        style: { textAlign: "center", padding: "24px 16px", color: "var(--c-text-soft)", fontSize: 13 }
      }, "Nothing flagged. Tap Per-habit for the full list.") : null
    );
    const subTabBtn = (val, label) => /*#__PURE__*/React.createElement("button", {
      key: val,
      type: "button",
      onClick: () => setReportsSubTab(val),
      style: {
        flex: 1, minHeight: 36, padding: "8px 12px",
        border: "none",
        borderBottom: "2px solid " + (reportsSubTab === val ? "#2d5a2d" : "transparent"),
        background: "transparent",
        color: reportsSubTab === val ? "#2d5a2d" : "#6b7280",
        fontSize: 13, fontWeight: reportsSubTab === val ? 700 : 500,
        cursor: "pointer",
        fontFamily: "'Playfair Display',Georgia,serif",
        letterSpacing: ".005em"
      }
    }, label);
    const perHabitView = /*#__PURE__*/React.createElement("div", null,
      allHabitsForReport.length === 0 ? null : /*#__PURE__*/React.createElement("div", null,
        // Top stat row moved to overviewView. The per-habit view now
        // Range filter — applies to every habit heatmap below.
        /*#__PURE__*/React.createElement("div", {
          style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }
        },
          /*#__PURE__*/React.createElement("span", {
            style: { fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: 0.3, textTransform: "uppercase" }
          }, "Range"),
          /*#__PURE__*/React.createElement("div", {
            style: { display: "flex", gap: 4, flex: 1 }
          },
            rangeBtn("week",  "Week"),
            rangeBtn("month", "Month"),
            rangeBtn("year",  "Year")
          )
        ),
        /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          allHabitsForReport.map(h => {
            const streak = getStreak(h);
            const rate = getCR(h).pct;
            const isAvoid = h.section === "avoid";
            return /*#__PURE__*/React.createElement("div", {
              key: h.id,
              style: { background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }
            },
              /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } },
                /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--c-text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, h.text),
                isAvoid && /*#__PURE__*/React.createElement("span", { style: { fontSize: 9, fontWeight: 700, color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "1px 6px" } }, "AVOID")),
              /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 14, fontSize: 11, color: "#6b7280" } },
                /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD25 ", /*#__PURE__*/React.createElement("strong", { style: { color: "#c2410c" } }, streak), " day", streak !== 1 ? "s" : ""),
                /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC8 ", /*#__PURE__*/React.createElement("strong", { style: { color: "#2d5a2d" } }, rate, "%"), " rate"),
                h.importance && /*#__PURE__*/React.createElement("span", null, h.importance)),
              /*#__PURE__*/React.createElement("div", {
                style: { overflowX: "auto", WebkitOverflowScrolling: "touch", marginTop: 4 }
              }, /*#__PURE__*/React.createElement(YearHeatmap, { habit: h, range: heatmapRange }))
            );
          }))
      )
    );
    const reportsPanel = /*#__PURE__*/React.createElement("div", null,
      sectionTitle("Habit Reports"),
      allHabitsForReport.length === 0 ? /*#__PURE__*/React.createElement("div", {
        style: { textAlign: "center", color: "#d1d5db", fontSize: 13, padding: "40px 0" }
      }, "No habits yet") : /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("div", {
          style: { display: "flex", borderBottom: "1px solid var(--c-border)", marginBottom: 16, position: "sticky", top: 0, zIndex: 2, background: "var(--c-surface, #fff)" }
        },
          subTabBtn("overview",  "Overview"),
          subTabBtn("per-habit", "Per-habit")
        ),
        reportsSubTab === "overview" ? overviewView : perHabitView
      )
    );
    return reportsPanel;
  }

  window.ReportsPanel = ReportsPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ReportsPanel;
  }
})();
