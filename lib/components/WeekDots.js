// lib/components/WeekDots.js
//
// WeekDots React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const WeekDots = React.memo(function WeekDots({ habit, size = 7, gap = 3 }) {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  // Build the 7 calendar dates for this week starting Sunday.
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    const k = dk(d);
    const isFuture = i > dow;
    const isToday = i === dow;
    const state = habit.completions?.[k];
    days.push({ k, isFuture, isToday, state });
  }
  return React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap, flexShrink: 0 },
    "aria-hidden": true
  }, ...days.map((d, i) => {
    let bg = "transparent", border = "var(--c-border)";
    if (d.state === "done") { bg = "#22c55e"; border = "#22c55e"; }
    else if (d.state === "missed") { bg = "#ef4444"; border = "#ef4444"; }
    else if (d.isToday) { border = "#2d5a2d"; }
    else if (d.isFuture) { border = "var(--c-surface-muted)"; }
    return React.createElement("div", {
      key: i,
      style: {
        width: size, height: size, borderRadius: "50%",
        background: bg, border: `1px solid ${border}`,
        boxSizing: "border-box"
      }
    });
  }));
});

  window.WeekDots = WeekDots;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { WeekDots };
  }
})();
