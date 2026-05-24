// lib/modals/ConfirmExitDemoModal.js
//
// Two-stage confirmation when the user wants to leave the guided demo.
// Stage "confirm" → "Exit the demo?" with Keep Exploring / Exit buttons.
// Stage "hint" → tells them where to find the replay path, then a single
// "Got it" button that calls exitDemo().
//
// Wave 4.1.1. Originally inline in index.html L16867-L16955.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function ConfirmExitDemoModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const stage = s.stage; // "confirm" | "hint"
    const onClose = cb.onClose || (() => {});
    const onAdvanceToHint = cb.onAdvanceToHint || (() => {});
    const onExit = cb.onExit || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "exit-demo-title",
      overlayStyle: { background: "rgba(0,0,0,0.55)", zIndex: 10100, alignItems: "center", padding: 20 },
      cardStyle: { background: "transparent", boxShadow: "none", padding: 0, borderRadius: 0, maxWidth: 400, maxHeight: "85vh", overflowY: "auto" }
    }, stage === "confirm"
      ? React.createElement("div", {
          className: "fade-in lg tour-tip",
          style: {
            borderRadius: 18, padding: "24px",
            width: "100%", maxWidth: 360,
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 20px 48px rgba(0,0,0,.38), 0 2px 8px rgba(0,0,0,.1)"
          }
        },
          React.createElement("div", { style: { fontSize: 28, textAlign: "center", marginBottom: 12 } }, "\u{1F44B}"),
          React.createElement("div", {
            id: "exit-demo-title",
            className: "tour-tip-title card-title",
            style: { fontSize: 16, textAlign: "center", marginBottom: 8 }
          }, "Exit the demo?"),
          React.createElement("div", {
            className: "tour-tip-body",
            style: { fontSize: 13, textAlign: "center", lineHeight: 1.6, marginBottom: 16 }
          }, "You'll leave the guided tour and go back to the sign-in screen. You can replay the tour anytime from Settings."),
          React.createElement("div", { style: { display: "flex", gap: 10 } },
            React.createElement("button", {
              "data-a11y-dialog-hide": true,
              style: {
                flex: 1, background: "var(--c-surface-muted)", border: "none", borderRadius: 10,
                padding: "12px", fontSize: 13, fontWeight: 600, color: "var(--c-text-soft)", cursor: "pointer"
              }
            }, "Keep Exploring"),
            React.createElement("button", {
              onClick: onAdvanceToHint,
              style: {
                flex: 1, background: "#fef3c7", border: "1px solid #fcd34d",
                borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600,
                color: "#78350f", cursor: "pointer"
              }
            }, "Exit Demo")
          )
        )
      : React.createElement("div", {
          className: "fade-in lg tour-tip",
          style: {
            borderRadius: 18, padding: "24px",
            width: "100%", maxWidth: 380,
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 20px 48px rgba(0,0,0,.38), 0 2px 8px rgba(0,0,0,.1)"
          }
        },
          React.createElement("div", { style: { fontSize: 28, textAlign: "center", marginBottom: 12 } }, "\u{1F9ED}"),
          React.createElement("div", {
            id: "exit-demo-title",
            className: "tour-tip-title card-title",
            style: { fontSize: 16, textAlign: "center", marginBottom: 10 }
          }, "Want to replay the tour later?"),
          React.createElement("div", {
            className: "tour-tip-body",
            style: { fontSize: 13, lineHeight: 1.6, marginBottom: 14, textAlign: "center" }
          }, "You'll find it anytime under"),
          React.createElement("div", {
            style: {
              fontSize: 13, color: "#78350f",
              background: "#fffbeb", border: "1px solid #fcd34d",
              borderRadius: 10, padding: "10px 12px",
              textAlign: "center", marginBottom: 16,
              fontWeight: 600, lineHeight: 1.5
            }
          }, "Profile → App Settings → Guided Tour → Replay Welcome Tour"),
          React.createElement("button", {
            onClick: onExit,
            style: {
              width: "100%", background: "#2d5a2d", color: "#fff",
              border: "none", borderRadius: 10, padding: "12px",
              fontSize: 13, fontWeight: 600, cursor: "pointer"
            }
          }, "Got it — exit demo")
        )
    );
  }

  window.ConfirmExitDemoModal = ConfirmExitDemoModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ConfirmExitDemoModal };
  }
})();
