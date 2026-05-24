// lib/modals/XpChartModal.js
//
// XP history bar chart. Granularity toggle (day/week/month),
// comparison stats (this vs prev period vs all-time avg), per-bar
// breakdown panel, and achievements summary footer.
//
// Wave 4.1.5. Originally inline at index.html L19527-L19923 (IIFE,
// ~397 LOC).
//
// References from shared classic-script global lexical environment:
//   dk() (utils.js), ACHIEVEMENTS, Glyph

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const CHART_H = 180;

  function XpChartModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const xpChartGrain = s.xpChartGrain || "day";
    const selectedXpBar = s.selectedXpBar || null;
    const achievementStats = s.achievementStats || {};
    const settingsMode = s.settingsMode;
    const themeLocked = !!s.themeLocked;
    const accentColor = s.accentColor;
    const onClose = cb.onClose || (() => {});
    const setXpChartGrain = cb.setXpChartGrain || (() => {});
    const setSelectedXpBar = cb.setSelectedXpBar || (() => {});
    const onOpenAchievements = cb.onOpenAchievements || (() => {});

    const xpByDay = {};
    (data.habits || []).forEach(h => {
      const unit = h.importance === "Non-Negotiable" ? 30 : h.importance === "Important" ? 20 : 10;
      const comps = h.completions || {};
      for (const d in comps) {
        if (comps[d] === "done") xpByDay[d] = (xpByDay[d] || 0) + unit;
      }
    });

    const today = new Date(); today.setHours(12, 0, 0, 0);
    const bars = [];
    if (xpChartGrain === "day") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        bars.push({ label: String(d.getDate()), value: xpByDay[dk(d)] || 0, key: dk(d) });
      }
    } else if (xpChartGrain === "week") {
      for (let wk = 11; wk >= 0; wk--) {
        const end = new Date(today); end.setDate(today.getDate() - wk * 7);
        let sum = 0;
        for (let d = 0; d < 7; d++) {
          const dt = new Date(end); dt.setDate(end.getDate() - d);
          sum += xpByDay[dk(dt)] || 0;
        }
        bars.push({ label: (end.getMonth() + 1) + "/" + end.getDate(), value: sum, key: "w-" + dk(end) });
      }
    } else {
      for (let m = 11; m >= 0; m--) {
        const first = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const last = new Date(today.getFullYear(), today.getMonth() - m + 1, 0);
        let sum = 0;
        for (let d = 1; d <= last.getDate(); d++) {
          sum += xpByDay[dk(new Date(first.getFullYear(), first.getMonth(), d))] || 0;
        }
        bars.push({ label: first.toLocaleDateString(undefined, { month: "short" }), value: sum, key: "m-" + first.getFullYear() + "-" + first.getMonth() });
      }
    }

    const maxVal = Math.max(1, ...bars.map(b => b.value));
    const totalInRange = bars.reduce((sum, b) => sum + b.value, 0);
    const avg = Math.round(totalInRange / bars.length);
    const chartAccent = (settingsMode === "custom" && !themeLocked && accentColor) ? accentColor : "#2d5a2d";

    const sumWindow = (startAgo, endAgo) => {
      let sum = 0;
      for (let i = startAgo; i <= endAgo; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        sum += xpByDay[dk(d)] || 0;
      }
      return sum;
    };
    let curLabel, curVal, prevLabel, prevVal, avgLabel, avgVal;
    if (xpChartGrain === "day") {
      curLabel = "Today"; curVal = xpByDay[dk(today)] || 0;
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      prevLabel = "Yesterday"; prevVal = xpByDay[dk(yesterday)] || 0;
      avgLabel = "30-day avg"; avgVal = avg;
    } else if (xpChartGrain === "week") {
      curLabel = "This week"; curVal = sumWindow(0, 6);
      prevLabel = "Last week"; prevVal = sumWindow(7, 13);
      avgLabel = "12-wk avg"; avgVal = Math.round(totalInRange / 12);
    } else {
      curLabel = "This month"; curVal = bars[bars.length - 1].value;
      prevLabel = "Last month"; prevVal = bars.length >= 2 ? bars[bars.length - 2].value : 0;
      avgLabel = "12-mo avg"; avgVal = Math.round(totalInRange / 12);
    }
    const pctDelta = prevVal > 0 ? Math.round(((curVal - prevVal) / prevVal) * 100) : null;
    const deltaArrow = pctDelta == null ? "" : pctDelta > 0 ? "↑" : pctDelta < 0 ? "↓" : "→";
    const deltaColor = pctDelta == null ? "#9ca3af" : pctDelta > 0 ? "#16a34a" : pctDelta < 0 ? "#dc2626" : "#9ca3af";

    const grainBtn = (id, label) => React.createElement("button", {
      key: id, type: "button",
      onClick: () => setXpChartGrain(id),
      style: {
        flex: 1, padding: "7px 10px",
        border: "1px solid " + (xpChartGrain === id ? chartAccent : "var(--c-border)"),
        borderRadius: 8,
        background: xpChartGrain === id ? chartAccent : "var(--c-surface, #fff)",
        color: xpChartGrain === id ? "#fff" : "var(--c-text)",
        fontSize: 12, fontWeight: xpChartGrain === id ? 700 : 500,
        cursor: "pointer"
      }
    }, label);

    let breakdownPanel = null;
    if (selectedXpBar) {
      const dates = [];
      if (xpChartGrain === "day") {
        dates.push(selectedXpBar.key);
      } else if (xpChartGrain === "week") {
        const endK = selectedXpBar.key.replace(/^w-/, "");
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endK);
        if (m) {
          const end = new Date(+m[1], +m[2] - 1, +m[3]);
          for (let i = 0; i < 7; i++) {
            const dt = new Date(end); dt.setDate(end.getDate() - i);
            dates.push(dk(dt));
          }
        }
      } else {
        const m = /^m-(\d{4})-(\d+)$/.exec(selectedXpBar.key);
        if (m) {
          const yr = +m[1], mo = +m[2];
          const last = new Date(yr, mo + 1, 0).getDate();
          for (let d = 1; d <= last; d++) dates.push(dk(new Date(yr, mo, d)));
        }
      }
      const dateSet = new Set(dates);
      const rows = [];
      (data.habits || []).forEach(h => {
        const unit = h.importance === "Non-Negotiable" ? 30 : h.importance === "Important" ? 20 : 10;
        const comps = h.completions || {};
        let count = 0;
        for (const d in comps) {
          if (!dateSet.has(d)) continue;
          if (comps[d] === "done") count++;
        }
        if (count > 0) {
          rows.push({ id: h.id, text: h.text, importance: h.importance || "Additive", unit, count, xp: count * unit });
        }
      });
      rows.sort((a, b) => b.xp - a.xp);
      const sectionLabel = xpChartGrain === "day"
        ? selectedXpBar.key
        : xpChartGrain === "week"
          ? "Week ending " + (selectedXpBar.label || "")
          : selectedXpBar.label;
      breakdownPanel = React.createElement("div", { style: { padding: "0 18px 16px" } },
        React.createElement("div", {
          style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingTop: 12, borderTop: "1px solid #f3f4f6" }
        },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--c-text-strong)" } }, "Breakdown · " + sectionLabel),
          React.createElement("button", {
            type: "button",
            onClick: () => setSelectedXpBar(null),
            style: { background: "transparent", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer", padding: 0 }
          }, "Close ×")
        ),
        rows.length === 0
          ? React.createElement("div", { style: { fontSize: 12, color: "#9ca3af", padding: "8px 0", textAlign: "center" } }, "No habits logged in this window.")
          : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
            rows.map(r => {
              const impColor = r.importance === "Non-Negotiable" ? "#dc2626" : r.importance === "Important" ? "#eab308" : "#16a34a";
              return React.createElement("div", {
                key: r.id,
                style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 8 }
              },
                React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: impColor, flexShrink: 0 } }),
                React.createElement("span", { style: { flex: 1, fontSize: 13, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, r.text),
                r.count > 1 && React.createElement("span", { style: { fontSize: 10, color: "#9ca3af" } }, r.count + "× " + r.unit + " XP"),
                React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: chartAccent, whiteSpace: "nowrap" } }, "+" + r.xp + " XP")
              );
            })
          )
      );
    }

    const earnedTotal = ACHIEVEMENTS.filter(a => (achievementStats[a.stat] || 0) >= a.threshold).length;
    const cats = Array.from(new Set(ACHIEVEMENTS.map(a => a.cat)));
    const recent = ACHIEVEMENTS
      .filter(a => (achievementStats[a.stat] || 0) >= a.threshold)
      .map(a => ({ a, ts: (data && data.achievementsUnlocked && data.achievementsUnlocked[a.id]) || 0 }))
      .filter(x => x.ts > 0)
      .sort((x, y) => y.ts - x.ts)
      .slice(0, 3);
    const achievementsFooter = React.createElement("div", {
      style: { borderTop: "1px solid var(--c-border)", padding: "12px 18px 6px", background: "var(--c-surface-raised)" }
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--c-text-strong)", textTransform: "uppercase", letterSpacing: 0.4 } }, "🏆 Achievements"),
          React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-soft)", marginTop: 2 } }, earnedTotal + " of " + ACHIEVEMENTS.length + " unlocked · " + cats.length + " categories")
        ),
        React.createElement("button", {
          type: "button",
          onClick: onOpenAchievements,
          style: { background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#2d5a2d", cursor: "pointer" }
        }, "Open shelf →")
      ),
      recent.length > 0 && React.createElement("div", { style: { fontSize: 10, color: "var(--c-text-soft)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 } }, "Recently earned"),
      recent.length > 0 && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 } },
        recent.map(({ a }) => React.createElement("div", {
          key: "ach-r-" + a.id,
          style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 }
        },
          React.createElement("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, color: "#2d5a2d", flexShrink: 0 } }, Glyph(a.icon || "🏆", { size: 14, color: "currentColor" })),
          React.createElement("span", { style: { flex: 1, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, a.name),
          React.createElement("span", { style: { fontSize: 9, fontWeight: 700, color: "#2d5a2d", background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: 0.3 } }, a.tier || "")
        ))
      )
    );

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "xp-history-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", zIndex: 320 },
      cardStyle: { background: "#fff", borderRadius: "20px 20px 0 0", maxWidth: 720, maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(0,0,0,.2)", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #f3f4f6" } },
        React.createElement("div", null,
          React.createElement("div", { id: "xp-history-title", className: "card-title", style: { fontSize: 18, color: "var(--c-text-strong)" } }, "XP history"),
          React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 2 } }, totalInRange.toLocaleString() + " XP in range · avg " + avg.toLocaleString() + "/" + xpChartGrain)
        ),
        React.createElement("button", {
          type: "button", "data-a11y-dialog-hide": true, "aria-label": "Close",
          style: { background: "transparent", border: "none", fontSize: 22, color: "#6b7280", cursor: "pointer", padding: 4, lineHeight: 1 }
        }, "×")
      ),
      React.createElement("div", { style: { display: "flex", gap: 6, padding: "12px 18px 0" } },
        grainBtn("day", "Day"), grainBtn("week", "Week"), grainBtn("month", "Month")
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: "10px 18px 0" } },
        [
          { label: curLabel, val: curVal, color: chartAccent },
          { label: prevLabel, val: prevVal, color: "#6b7280" },
          { label: avgLabel, val: avgVal, color: "#6b7280" }
        ].map((stat, i) => React.createElement("div", {
          key: "stat-" + i,
          style: { padding: "8px 10px", borderRadius: 8, background: "var(--c-surface-raised)", border: "1px solid var(--c-border)" }
        },
          React.createElement("div", { style: { fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 } }, stat.label),
          React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: stat.color } }, stat.val.toLocaleString() + " XP")
        ))
      ),
      pctDelta != null && React.createElement("div", {
        style: { padding: "8px 18px 0", fontSize: 11, color: deltaColor, fontWeight: 600 }
      }, deltaArrow + " " + Math.abs(pctDelta) + "% vs " + prevLabel.toLowerCase()),
      React.createElement("div", { style: { display: "flex", padding: "18px 18px 8px", gap: 10 } },
        React.createElement("div", {
          style: {
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            height: CHART_H + 18, paddingBottom: 18,
            fontSize: 9, color: "#9ca3af", textAlign: "right", minWidth: 28
          }
        },
          React.createElement("div", null, maxVal.toLocaleString()),
          React.createElement("div", null, Math.round(maxVal / 2).toLocaleString()),
          React.createElement("div", null, "0")
        ),
        React.createElement("div", { style: { flex: 1, overflowX: "auto" } },
          React.createElement("div", {
            style: { display: "flex", alignItems: "flex-end", gap: 4, height: CHART_H, minWidth: "100%" }
          }, bars.map(b => React.createElement("div", {
            key: b.key,
            title: b.value + " XP — tap for breakdown",
            onClick: () => setSelectedXpBar(prev => prev && prev.key === b.key ? null : b),
            style: {
              flex: 1, minWidth: xpChartGrain === "day" ? 10 : 22,
              display: "flex", flexDirection: "column", alignItems: "stretch",
              justifyContent: "flex-end", position: "relative",
              cursor: "pointer", userSelect: "none",
              outline: selectedXpBar && selectedXpBar.key === b.key ? "2px solid " + chartAccent : "none",
              outlineOffset: 2,
              borderRadius: "4px 4px 0 0"
            }
          },
            b.value > 0 && React.createElement("div", {
              style: {
                fontSize: xpChartGrain === "day" ? 8 : 10,
                fontWeight: 700, color: chartAccent,
                textAlign: "center", marginBottom: 2, whiteSpace: "nowrap", lineHeight: 1
              }
            }, b.value),
            React.createElement("div", {
              style: {
                height: Math.max(2, Math.round((b.value / maxVal) * CHART_H)) + "px",
                background: b.value > 0 ? "linear-gradient(180deg," + chartAccent + "," + chartAccent + "cc)" : "var(--c-border)",
                borderRadius: "4px 4px 0 0",
                transition: "height 0.35s ease"
              }
            })
          ))),
          React.createElement("div", { style: { display: "flex", gap: 4, marginTop: 6 } },
            bars.map((b, i) => React.createElement("div", {
              key: b.key + "-lbl",
              style: {
                flex: 1, minWidth: xpChartGrain === "day" ? 10 : 22, textAlign: "center",
                fontSize: 9, color: "#9ca3af",
                visibility: xpChartGrain === "day" && i % 5 !== 0 ? "hidden" : "visible"
              }
            }, b.label))
          ),
          React.createElement("div", {
            style: { display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f3f4f6", fontSize: 10, color: "#9ca3af" }
          },
            React.createElement("span", null, xpChartGrain === "day" ? "Date" : xpChartGrain === "week" ? "Week ending" : "Month"),
            React.createElement("span", null, "XP earned")
          )
        )
      ),
      breakdownPanel,
      achievementsFooter,
      React.createElement("div", {
        style: { fontSize: 11, color: "var(--c-text-soft)", textAlign: "center", padding: "10px 18px 16px" }
      }, "Tap a bar to see which habits earned that XP. Hold the XP bar in the header to open achievements.")
    );
  }

  window.XpChartModal = XpChartModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { XpChartModal };
  }
})();
