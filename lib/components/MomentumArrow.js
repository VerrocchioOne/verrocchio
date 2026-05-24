// lib/components/MomentumArrow.js
//
// MomentumArrow React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const MomentumArrow = React.memo(function MomentumArrow({ habit }) {
  const now = new Date();
  const days = (offset, count) => {
    let c = 0;
    for (let i = offset; i < offset + count; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      if (habit.completions?.[dk(d)] === "done") c++;
    }
    return c;
  };
  const recent = days(0, 7);
  const prior = days(7, 7);
  const delta = recent - prior;
  const glyph = delta > 0 ? "\u25B2" : delta < 0 ? "\u25BC" : "\u2192";
  const color = delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#9ca3af";
  return React.createElement("span", {
    title: `Last 7d: ${recent} · Prior 7d: ${prior}`,
    style: { fontSize: 9, fontWeight: 700, color, marginLeft: 4 }
  }, glyph, delta !== 0 ? " " + Math.abs(delta) : "");
});

  window.MomentumArrow = MomentumArrow;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { MomentumArrow };
  }
})();
