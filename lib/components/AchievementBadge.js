// lib/components/AchievementBadge.js
//
// AchievementBadge React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const AchievementBadge = React.memo(function AchievementBadge({ cat, tier, size = 30 }) {
  const tierCol = ({
    Bronze: "#a16207", Silver: "#6b7280", Gold: "#d97706",
    Platinum: "#0891b2", Diamond: "#7c3aed"
  })[tier] || "#6b7280";
  const glyph = (() => {
    const common = { stroke: tierCol, strokeWidth: 1.6, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
    if (cat === "Dedication") {
      return React.createElement("g", null,
        React.createElement("path", Object.assign({ d: "M4 18 Q 14 6 24 18" }, common)),
        React.createElement("line", Object.assign({ x1: 4, y1: 21, x2: 24, y2: 21 }, common)),
        ...[9, 14, 19].map((x, i) => React.createElement("line", Object.assign({ key: i, x1: x, y1: 10 - (i === 1 ? 2 : 0), x2: x, y2: 5 - (i === 1 ? 2 : 0) }, common)))
      );
    }
    if (cat === "Streaks") {
      return React.createElement("path", Object.assign({
        d: "M14 3 C 18 8 21 11 21 16 C 21 21 17 24 14 24 C 11 24 7 21 7 16 C 7 12 10 9 14 3 Z"
      }, common, { fill: tierCol, fillOpacity: 0.18 }));
    }
    if (cat === "Achiever") {
      return React.createElement("g", null,
        React.createElement("circle", Object.assign({ cx: 14, cy: 14, r: 9 }, common)),
        React.createElement("circle", Object.assign({ cx: 14, cy: 14, r: 5 }, common)),
        React.createElement("circle", { cx: 14, cy: 14, r: 2, fill: tierCol })
      );
    }
    if (cat === "Builder") {
      return React.createElement("g", null,
        React.createElement("rect", Object.assign({ x: 4, y: 18, width: 20, height: 5, rx: 0.8 }, common)),
        React.createElement("rect", Object.assign({ x: 6, y: 12, width: 16, height: 5, rx: 0.8 }, common)),
        React.createElement("rect", Object.assign({ x: 9, y: 6, width: 10, height: 5, rx: 0.8 }, common))
      );
    }
    // XP
    return React.createElement("path", Object.assign({
      d: "M16 4 L 8 16 L 14 16 L 12 24 L 20 12 L 14 12 Z"
    }, common, { fill: tierCol, fillOpacity: 0.22 }));
  })();
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 28 28",
    "aria-hidden": true, style: { display: "block" }
  },
    // Outer shield
    React.createElement("path", {
      d: "M14 2 L 24 5 L 24 14 C 24 20 19 25 14 26 C 9 25 4 20 4 14 L 4 5 Z",
      fill: "#fff", stroke: tierCol, strokeWidth: 1.6
    }),
    glyph
  );
});

  window.AchievementBadge = AchievementBadge;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { AchievementBadge };
  }
})();
