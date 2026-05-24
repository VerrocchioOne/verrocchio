// lib/components/Sparkline14.js
//
// 14-day completion sparkline. Done days draw at the top edge, missed
// at the bottom; a faint line connects the day tops with a dot on each.
//
// Bisect-probe extraction (Wave 2 of full decomposition). The earlier
// A11yDialog extraction caused unrelated E2E tests to fail; this tiny
// component (27 LOC, no hooks, no state) isolates whether
// script-tag addition itself is the regression vector or whether the
// failure was A11yDialog-specific.
//
// Dual-loaded (browser <script> global + Node CJS export) per
// docs/superpowers/patterns/view-extraction.md.
//
// Browser dependencies:
//   - React (UMD global, loaded earlier in head)
//   - getLast14 (utils.js global, loaded earlier in head)
//
// Originally lived inline in index.html L2816-L2842.

(function () {
  "use strict";

  const R = (typeof window !== "undefined" && window.React) || null;
  if (!R) return;

  const Sparkline14 = R.memo(function Sparkline14({ habit, width = 72, height = 14, color = "#2d5a2d" }) {
    const l14 = getLast14(habit);
    const n = l14.length;
    const step = width / n;
    const top = 2, bot = height - 2;
    const pts = l14.map((d, i) => [i * step + step / 2, d.done ? top : bot]);
    const pathD = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    return R.createElement("svg", {
      width, height, viewBox: `0 0 ${width} ${height}`, "aria-hidden": true,
      style: { display: "block", flexShrink: 0 }
    },
      R.createElement("line", { x1: 0, y1: bot + 0.5, x2: width, y2: bot + 0.5, stroke: "var(--c-border)", strokeWidth: 1 }),
      R.createElement("path", { d: pathD, stroke: color, strokeWidth: 1.2, fill: "none", opacity: 0.55, strokeLinejoin: "round" }),
      ...l14.map((d, i) => R.createElement("circle", {
        key: i,
        cx: (i * step + step / 2).toFixed(1),
        cy: d.done ? top : bot,
        r: d.done ? 1.6 : 1.1,
        fill: d.done ? color : "#fff",
        stroke: d.done ? color : "#d1d5db",
        strokeWidth: 0.8
      }))
    );
  });

  if (typeof window !== "undefined") {
    window.Sparkline14 = Sparkline14;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { Sparkline14 };
  }
})();
