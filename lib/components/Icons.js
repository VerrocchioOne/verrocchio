// lib/components/Icons.js
//
// Four visual primitives bundled together:
//   GLYPH_PATHS         — emoji → SVG path-data map (achievement badges).
//   Glyph(token, opts)  — renders an SVG glyph, falls back to plain
//                         emoji span for unknown tokens.
//   IllusHabitsEmpty    — empty-state illustration for Habits tab.
//   VerrocchioIcon      — brand mark, used in splash + onboarding + auth.
//
// Originally inline at index.html L1424-L1465 (glyphs) + L1787-L1849
// (illustrations).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

/* ── Brand glyphs ─────────────────────────────────────────────────
   Replaces stock emoji icons in achievements + smart-tips with small
   monochrome line marks in brand green. 1.5px stroke at 16x16,
   currentColor stroke so they pick up var(--accent) by default and
   inherit any container color override. Unknown tokens fall through
   to a plain emoji span — anything not in the map keeps rendering
   the original char so nothing visibly breaks during migration. */
const GLYPH_PATHS = {
  "✨":  "M8 1.5L9.2 6.8L14.5 8L9.2 9.2L8 14.5L6.8 9.2L1.5 8L6.8 6.8z",
  "🔥":  "M8 14.5c2.7 0 4.5-1.8 4.5-4 0-2-1.5-3-2.5-4.5-.7-1-1-2-1-3.5-1.5 1-3 2.5-3 5 0 1-1 1.5-1.5 1.5C3 9 3.5 14.5 8 14.5zM6.5 11.5c0-1 1-1.5 1.5-2.5",
  "⚡":  "M9.5 1.5L3 9.5h4l-1 5L13 7H8.5z",
  "🌋":  "M1.5 13.5L6 5.5l3 4 1.5-2 4 6.5zM5.5 5.5V3M7 4l-1.5-1.5M4 4l1.5-1.5",
  "☄️":  "M3 13l8.5-8.5M12 5h2V3M3 13l-1.5 1.5M5 11l-1.5 1M3 9l-1.5.5",
  "🎯":  "M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM8 7a1 1 0 100 2 1 1 0 000-2z",
  "🔗":  "M9.5 6.5a2.5 2.5 0 013.5 0 2.5 2.5 0 010 3.5L11 12M6.5 9.5a2.5 2.5 0 01-3.5 0 2.5 2.5 0 010-3.5L5 4M5.5 10.5l5-5",
  "🗓️":  "M3.5 3h9a1 1 0 011 1v9a1 1 0 01-1 1h-9a1 1 0 01-1-1V4a1 1 0 011-1zM2.5 6.5h11M5 1.5v3M11 1.5v3",
  "🏗️":  "M3 13.5h10M5 13.5V6L11 4v9.5M5 8h6M5 11h6",
  "🏛️":  "M2.5 13.5h11M3 5.5L8 2l5 3.5M3.5 5.5h9V8h-9zM4.5 8v5.5M7.5 8v5.5M10.5 8v5.5",
  "🗺️":  "M2 4l4-1.5 4 1.5 4-1.5v10l-4 1.5-4-1.5-4 1.5zM6 2.5v11M10 4v11",
  "🏆":  "M5 3h6v3a3 3 0 01-6 0zM3.5 4H5v2.5a2 2 0 002 2M12.5 4H11v2.5a2 2 0 01-2 2M8 8.5v3M6 11.5h4M5 14h6",
  "🚨":  "M8 2L14.5 13.5h-13zM8 6.5v3.5M8 11.5v.5",
  "📉":  "M2 4l5 5 3-3 4 4M14 5v5h-5",
  "📋":  "M5.5 3h5v2h-5zM4 4.5h8v10h-8zM6 8.5h4M6 11h4M6 13h2",
  "💡":  "M5.5 7.5a2.5 3 0 015 0c0 1.2-1 2-1 3h-3c0-1-1-1.8-1-3zM6.5 12.5h3M7 14h2",
  "🕘":  "M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 4v4l-2.5 1.5",
};
function Glyph(token, opts) {
  const size   = (opts && opts.size)   || 16;
  const stroke = (opts && opts.stroke) || 1.5;
  const color  = (opts && opts.color)  || "var(--accent)";
  const path = token && GLYPH_PATHS[token];
  if (!path) {
    return /*#__PURE__*/React.createElement("span", { style: { fontSize: size, lineHeight: 1, display: "inline-block", flexShrink: 0 } }, token || "");
  }
  return /*#__PURE__*/React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 16 16",
    fill: "none", stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": "true",
    style: { color: color, display: "inline-block", verticalAlign: "middle", flexShrink: 0 }
  }, /*#__PURE__*/React.createElement("path", { d: path }));
}

// Empty-state illustration for "No habits yet" screens. Same
// language as the onboarding illus* components at ~L5110 —
// Verrocchio green strokes, 56×56 viewport, gentle. A stack of
// three habit rows with a pulse through them so the shelf reads
// as "future state" rather than "error state."
function IllusHabitsEmpty({ size = 84 }) {
  const GREEN = "#2d5a2d";
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 56 56", "aria-hidden": true
  },
    // Three stacked habit-row cards
    ...[0, 1, 2].map(i => React.createElement("g", { key: i, opacity: 1 - i * 0.2 },
      React.createElement("rect", {
        x: 8, y: 12 + i * 11, width: 40, height: 8, rx: 3,
        fill: "none", stroke: GREEN, strokeWidth: 1.2
      }),
      React.createElement("circle", {
        cx: 13, cy: 16 + i * 11, r: 2, fill: i === 0 ? GREEN : "none",
        stroke: GREEN, strokeWidth: 1.2
      }),
      React.createElement("line", {
        x1: 18, y1: 16 + i * 11, x2: 28 + i * 4, y2: 16 + i * 11,
        stroke: GREEN, strokeWidth: 1, opacity: 0.55
      })
    ))
  );
}

// Verrocchio brand mark — 4-3-2-1 stack of 10 green blocks.
// Mirrors the splashv4 .b1–.b10 stride (44×26 blocks at 52×30 grid)
// in a 240×240 viewBox so the mark sits centered with breathing room.
function VerrocchioIcon({ size = 96, color = "#2d5a2d", bg = "transparent" }) {
  const W = 44, H = 26, GX = 52, GY = 30;
  const baseY = 180;       // y of the bottom-row blocks' top edge
  const baseX = 20;        // x of the bottom-row leftmost block
  const blocks = [
    // Row 1 — 4 blocks
    [0,0],[1,0],[2,0],[3,0],
    // Row 2 — 3 blocks, offset half a stride
    [0.5,1],[1.5,1],[2.5,1],
    // Row 3 — 2 blocks
    [1,2],[2,2],
    // Row 4 — apex
    [1.5,3]
  ];
  return /*#__PURE__*/React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 240 240",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-label": "Verrocchio",
    style: { display: "block" }
  },
    bg && bg !== "transparent" ? /*#__PURE__*/React.createElement("rect", {
      x: 0, y: 0, width: 240, height: 240, fill: bg, rx: 32
    }) : null,
    ...blocks.map(([cx, cy], i) => /*#__PURE__*/React.createElement("rect", {
      key: "b" + i,
      x: baseX + cx * GX,
      y: baseY - cy * GY,
      width: W, height: H, rx: 3,
      fill: color
    }))
  );
}

  window.GLYPH_PATHS = GLYPH_PATHS;
  window.Glyph = Glyph;
  window.IllusHabitsEmpty = IllusHabitsEmpty;
  window.VerrocchioIcon = VerrocchioIcon;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { GLYPH_PATHS, Glyph, IllusHabitsEmpty, VerrocchioIcon };
  }
})();
