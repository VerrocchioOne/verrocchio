// lib/views/AppChrome.js
//
// App chrome banners (3 sibling overlays that float over the main
// render): tour exit banner, demo-mode banner, shake-to-exit hint.
//
// Wave 4.2.1. Originally inline at index.html L12278-L12337.
//
// Props (via state/callbacks):
//   tourStep, finishTour       — tour exit banner
//   demoMode, exitDemo         — demo mode banner
//   showShakeHint, dismissShakeHint — shake hint pill

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function AppChrome({ data, dispatch, deviceProfile, state, callbacks }) {
    const s = state || {};
    const cb = callbacks || {};
    const tourStep = s.tourStep || 0;
    const demoMode = !!s.demoMode;
    const showShakeHint = !!s.showShakeHint;
    const finishTour = cb.finishTour || (() => {});
    const exitDemo = cb.exitDemo || (() => {});
    const dismissShakeHint = cb.dismissShakeHint || (() => {});

    return React.createElement(React.Fragment, null,
      tourStep > 0 && React.createElement("button", {
        type: "button",
        onClick: finishTour,
        "aria-label": "Exit walkthrough",
        style: {
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 10100,
          paddingTop: "calc(8px + env(safe-area-inset-top, 0px))",
          paddingBottom: 10,
          paddingLeft: 14, paddingRight: 14,
          background: "#b91c1c",
          color: "#fff",
          border: "none",
          fontSize: 14, fontWeight: 700,
          letterSpacing: 0.3,
          textAlign: "center",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          cursor: "pointer",
          WebkitTapHighlightColor: "rgba(255,255,255,0.2)"
        }
      }, "✕ Exit walkthrough"),
      demoMode && React.createElement("div", {
        style: { background: "linear-gradient(90deg,#fef3c7,#fde68a)", borderBottom: "1px solid #fcd34d", padding: "max(6px, calc(env(safe-area-inset-top, 0px) + 4px)) 14px 6px", fontSize: 12, color: "#78350f", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 60 }
      },
        React.createElement("span", { style: { fontWeight: 700 } }, "✨ Demo Mode — nothing is saved"),
        React.createElement("button", {
          onClick: exitDemo,
          style: { background: "#78350f", color: "#fff", border: "none", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }
        }, "Exit demo")
      ),
      demoMode && showShakeHint && React.createElement("div", {
        onClick: dismissShakeHint,
        style: {
          position: "fixed",
          left: 12, right: 12, bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          zIndex: 200,
          background: "rgba(17,24,39,0.92)",
          color: "#fff",
          borderRadius: 12,
          padding: "10px 14px",
          boxShadow: "0 8px 28px rgba(0,0,0,.25)",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, lineHeight: 1.35,
          cursor: "pointer"
        }
      },
        React.createElement("span", { style: { fontSize: 18, lineHeight: 1 } }, "📳"),
        React.createElement("span", { style: { flex: 1 } }, "Shake your phone anytime to exit the demo."),
        React.createElement("span", { style: { fontSize: 11, color: "#9ca3af", fontWeight: 600 } }, "Got it")
      )
    );
  }

  window.AppChrome = AppChrome;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { AppChrome };
  }
})();
