// lib/components/StreakChain.js
//
// StreakChain React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const StreakChain = React.memo(function StreakChain({ streak, cold }) {
  if (streak > 0) {
    const shown = Math.min(streak, 5);
    // Flame colors ramp from amber → orange → red as the streak grows.
    const hot = streak >= 30 ? "#dc2626" : streak >= 7 ? "#ea580c" : "#f59e0b";
    return React.createElement("div", {
      style: {
        height: 16, display: "flex", alignItems: "center", gap: 1,
        paddingLeft: 3, paddingRight: 5, background: "#fff7ed",
        border: "1px solid #fed7aa", borderRadius: 4, flexShrink: 0
      }
    },
      ...Array.from({ length: shown }, (_, i) => React.createElement("svg", {
        key: i, width: 7, height: 10, viewBox: "0 0 7 10", "aria-hidden": true
      },
        React.createElement("path", {
          d: "M3.5 0.5 C 5 2 6 3.5 6 5.5 C 6 7.8 4.8 9.3 3.5 9.3 C 2.2 9.3 1 7.8 1 5.5 C 1 4.2 1.8 3 3.5 0.5 Z",
          fill: hot, opacity: 0.55 + (i / Math.max(shown - 1, 1)) * 0.45
        })
      )),
      React.createElement("span", {
        style: { fontSize: 8, fontWeight: 700, color: "#c2410c", marginLeft: 2 }
      }, streak > 5 ? "\u00B7 " + streak : streak)
    );
  }
  if (cold != null) {
    return React.createElement("div", {
      style: {
        height: 16, display: "flex", alignItems: "center", gap: 2,
        paddingLeft: 4, paddingRight: 5, background: "var(--c-tint-info-bg)",
        border: "1px solid var(--c-tint-info-border)", borderRadius: 4, flexShrink: 0
      }
    },
      React.createElement("svg", {
        width: 10, height: 10, viewBox: "0 0 10 10", "aria-hidden": true
      },
        // Broken chain — two small links with a gap
        React.createElement("circle", { cx: 3, cy: 5, r: 1.8, fill: "none", stroke: "#3b82f6", strokeWidth: 1.2 }),
        React.createElement("circle", { cx: 7, cy: 5, r: 1.8, fill: "none", stroke: "#3b82f6", strokeWidth: 1.2, opacity: 0.5 }),
        React.createElement("line", { x1: 4.5, y1: 5, x2: 5.5, y2: 5, stroke: "#3b82f6", strokeWidth: 1.2, opacity: 0.35 })
      ),
      React.createElement("span", { style: { fontSize: 8, fontWeight: 700, color: "var(--c-tint-info-fg)" } }, cold)
    );
  }
  return null;
});

  window.StreakChain = StreakChain;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { StreakChain };
  }
})();
