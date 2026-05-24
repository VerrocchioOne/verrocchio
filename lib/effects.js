// lib/effects.js
//
// One-shot DOM-based confetti burst. Originally inline at
// index.html L1858-L1908. Kept feather-light (no canvas-confetti
// dep) — ~100 absolutely-positioned divs driven by a single CSS
// keyframe defined in index.html. Respects prefers-reduced-motion.

(function () {
  "use strict";
  if (typeof window === "undefined") return;

/* ── CONFETTI BURST ───────────────────────────────────────────────
   One-shot DOM-based confetti used on first-goal / first-habit. We
   don't pull in a library — 100-ish absolutely-positioned divs driven
   by one CSS keyframe keeps this feather-light and self-contained.
   Each particle gets its own end translate / rotation via CSS custom
   properties so the burst looks varied. The root container is removed
   after the longest possible animation window, so nothing lingers in
   the DOM. Respect prefers-reduced-motion by skipping entirely. */
function fireConfetti() {
  if (typeof document === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#2d5a2d", "#3d7a3d", "#fbbf24", "#f97316", "#3b82f6", "#ec4899", "#a855f7"];
  const root = document.createElement("div");
  root.className = "confetti-root";
  root.setAttribute("aria-hidden", "true");
  root.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;contain:strict";
  const N = 90;
  for (let i = 0; i < N; i++) {
    const p = document.createElement("div");
    const color = colors[i % colors.length];
    // Start clustered around the center-top of the viewport so the
    // burst reads as coming from a single origin point rather than
    // raining uniformly from the top.
    const startX = 35 + Math.random() * 30; // center 30% band
    const startY = 30 + Math.random() * 15;
    const delay = Math.random() * 180;
    const dur = 1700 + Math.random() * 1200;
    const endX = (Math.random() - .5) * 140; // vw distance either side
    const endY = 80 + Math.random() * 30;    // vh — well off the bottom
    const rotStart = Math.random() * 360;
    const rotDelta = 360 + Math.random() * 900;
    const w = 6 + Math.random() * 6;
    const h = 10 + Math.random() * 8;
    p.style.cssText =
      "position:absolute;" +
      "left:" + startX + "%;top:" + startY + "%;" +
      "width:" + w + "px;height:" + h + "px;" +
      "background:" + color + ";" +
      "border-radius:1px;" +
      "opacity:.95;" +
      "transform:rotate(" + rotStart + "deg);" +
      "will-change:transform,opacity;" +
      "animation:confetti-fall " + dur + "ms cubic-bezier(.2,.55,.4,1) " + delay + "ms forwards;" +
      "--cf-x:" + endX + "vw;" +
      "--cf-y:" + endY + "vh;" +
      "--cf-rot:" + (rotStart + rotDelta) + "deg;";
    root.appendChild(p);
  }
  document.body.appendChild(root);
  setTimeout(() => { if (root.parentNode) root.parentNode.removeChild(root); }, 3400);
}

  window.fireConfetti = fireConfetti;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { fireConfetti };
  }
})();
