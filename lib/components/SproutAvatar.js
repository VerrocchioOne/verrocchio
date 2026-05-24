// lib/components/SproutAvatar.js
//
// SproutAvatar React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const SproutAvatar = React.memo(function SproutAvatar({ streak, size = 18 }) {
  const GREEN = "#2d5a2d", SOFT = "#86b686";
  const stage = streak >= 100 ? 4 : streak >= 30 ? 3 : streak >= 7 ? 2 : streak >= 3 ? 1 : 0;
  const common = { width: size, height: size, viewBox: "0 0 18 18", "aria-hidden": true, style: { display: "block", flexShrink: 0 } };
  if (stage === 0) {
    // Seed — a single dot on soil
    return React.createElement("svg", common,
      React.createElement("ellipse", { cx: 9, cy: 15, rx: 5.5, ry: 1.2, fill: SOFT, opacity: 0.45 }),
      React.createElement("circle", { cx: 9, cy: 13, r: 1.5, fill: "#8b5a2b" })
    );
  }
  if (stage === 1) {
    // Sprout — seed + a single curl
    return React.createElement("svg", common,
      React.createElement("ellipse", { cx: 9, cy: 15, rx: 5.5, ry: 1.2, fill: SOFT, opacity: 0.45 }),
      React.createElement("path", { d: "M9 14 Q 9 10 6 8", stroke: GREEN, strokeWidth: 1.6, strokeLinecap: "round", fill: "none" }),
      React.createElement("ellipse", { cx: 5.5, cy: 7.5, rx: 2, ry: 1.2, fill: GREEN, transform: "rotate(-30 5.5 7.5)" })
    );
  }
  if (stage === 2) {
    // Sapling — Y-shape with two leaves
    return React.createElement("svg", common,
      React.createElement("ellipse", { cx: 9, cy: 16, rx: 6, ry: 1.2, fill: SOFT, opacity: 0.45 }),
      React.createElement("line", { x1: 9, y1: 15, x2: 9, y2: 7, stroke: GREEN, strokeWidth: 1.6, strokeLinecap: "round" }),
      React.createElement("ellipse", { cx: 6, cy: 7, rx: 2.6, ry: 1.4, fill: GREEN, transform: "rotate(-30 6 7)" }),
      React.createElement("ellipse", { cx: 12, cy: 7, rx: 2.6, ry: 1.4, fill: GREEN, transform: "rotate(30 12 7)" })
    );
  }
  if (stage === 3) {
    // Small tree — trunk + canopy
    return React.createElement("svg", common,
      React.createElement("ellipse", { cx: 9, cy: 16, rx: 6, ry: 1.2, fill: SOFT, opacity: 0.45 }),
      React.createElement("rect", { x: 8, y: 10, width: 2, height: 6, rx: 0.5, fill: "#8b5a2b" }),
      React.createElement("circle", { cx: 9, cy: 7.5, r: 5, fill: GREEN }),
      React.createElement("circle", { cx: 6.5, cy: 6, r: 1, fill: "#fff", opacity: 0.25 })
    );
  }
  // Laurel — two curved branches of leaves
  return React.createElement("svg", common,
    ...[-1, 1].map(side => React.createElement("g", { key: side, transform: `translate(9 9) scale(${side} 1)` },
      React.createElement("path", { d: "M 0 6 C -5 3 -6 -2 -4 -6", stroke: GREEN, strokeWidth: 1.2, fill: "none" }),
      ...[0, 1, 2, 3].map(i => React.createElement("ellipse", {
        key: i, cx: -2 - i * 0.6, cy: 4 - i * 2.2,
        rx: 1.6, ry: 0.9, fill: GREEN,
        transform: `rotate(${-40 - i * 10} ${-2 - i * 0.6} ${4 - i * 2.2})`
      }))
    )),
    React.createElement("circle", { cx: 9, cy: 9, r: 2.2, fill: "#fde68a", stroke: GREEN, strokeWidth: 1 })
  );
});

  window.SproutAvatar = SproutAvatar;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { SproutAvatar };
  }
})();
