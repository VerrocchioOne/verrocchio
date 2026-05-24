// lib/components/YearHeatmap.js
//
// YearHeatmap React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const YearHeatmap = React.memo(function YearHeatmap({ habit, cellSize = 10, gap = 3, color, range = "year" }) {
  const today = new Date();
  const cells = [];
  // Range controls how far back the grid looks:
  //   week  — last 7 days, single column
  //   month — last 28 days, 4 weeks wide
  //   year  — 26 weeks + today's DOW offset (~6 months)
  const daysBack =
    range === "week"  ? 6
    : range === "month" ? 27
    : 7 * 26 + today.getDay();
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = dk(d);
    const state = habit.completions?.[k];
    cells.push({ k, state });
  }
  // Resolve the "done" fill: explicit prop > habit-type color > brand green.
  const typeColor = color || (habit && habit.type ? (HT.find(t => t.value === habit.type) || {}).color : null) || "#2d5a2d";
  // Low-opacity version of the same hue for empty cells. Preserves
  // the HabitKit "monochrome chip" look where empty is a very light
  // tint instead of a neutral gray.
  const emptyFill = typeColor + "1A"; // ~10% alpha via appended hex
  const missedFill = "#fca5a5";
  // Lay out as 7 rows × N columns. First cell goes in row = DOW of earliest date.
  const firstDow = new Date(cells[0].k + "T12:00:00").getDay();
  const total = cells.length;
  const cols = Math.ceil((firstDow + total) / 7);
  const w = cols * (cellSize + gap);
  const h = 7 * (cellSize + gap);
  const r = Math.max(1.5, Math.round(cellSize * 0.25));
  return React.createElement("svg", {
    width: w, height: h, viewBox: `0 0 ${w} ${h}`, "aria-hidden": true,
    style: { display: "block" }
  }, cells.map((c, i) => {
    const idx = firstDow + i;
    const col = Math.floor(idx / 7);
    const row = idx % 7;
    const fill = c.state === "done" ? typeColor
               : c.state === "missed" ? missedFill
               : emptyFill;
    return React.createElement("rect", {
      key: i,
      x: col * (cellSize + gap),
      y: row * (cellSize + gap),
      width: cellSize,
      height: cellSize,
      rx: r,
      fill
    });
  }));
});

  window.YearHeatmap = YearHeatmap;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { YearHeatmap };
  }
})();
