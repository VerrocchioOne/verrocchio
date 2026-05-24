// lib/components/CompletionWave.js
//
// CompletionWave React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const CompletionWave = React.memo(function CompletionWave({ rates, width = 300, height = 40 }) {
  if (!rates || rates.length === 0) return null;
  const n = rates.length;
  const step = width / (n - 1);
  const pts = rates.map((r, i) => [i * step, height - r * (height - 4) - 2]);
  const line = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${width} ${height} L 0 ${height} Z`;
  return React.createElement("svg", {
    width: "100%", height, viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "none",
    "aria-hidden": true,
    style: { display: "block" }
  },
    React.createElement("defs", null,
      React.createElement("linearGradient", { id: "waveG", x1: 0, y1: 0, x2: 0, y2: 1 },
        React.createElement("stop", { offset: "0%", stopColor: "#2d5a2d", stopOpacity: 0.35 }),
        React.createElement("stop", { offset: "100%", stopColor: "#2d5a2d", stopOpacity: 0.02 })
      )
    ),
    React.createElement("path", { d: area, fill: "url(#waveG)" }),
    React.createElement("path", { d: line, stroke: "#2d5a2d", strokeWidth: 1.2, fill: "none", strokeLinejoin: "round" })
  );
});

  window.CompletionWave = CompletionWave;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { CompletionWave };
  }
})();
