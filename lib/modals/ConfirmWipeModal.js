// lib/modals/ConfirmWipeModal.js
//
// Wipe-all-data two-stage confirmation. Stage "1" is a clear warning
// with Cancel / Continue. Stage "2" is a typed-DELETE confirmation —
// only the literal uppercase word DELETE enables the final button.
//
// Wave 4.1.8. Originally inline in index.html L20309-L20373.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function ConfirmWipeModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const stage = s.stage; // "1" or "2"
    const typedText = s.typedText || "";
    const onClose = cb.onClose || (() => {});
    const onAdvanceToStage2 = cb.onAdvanceToStage2 || (() => {});
    const onWipe = cb.onWipe || (() => {});
    const setTypedText = cb.setTypedText || (() => {});

    const isReady = typedText.trim().toUpperCase() === "DELETE";

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "wipe-title",
      overlayStyle: { background: "rgba(0,0,0,0.6)", zIndex: 330, alignItems: "center", padding: 20 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: 16, padding: "22px 20px", maxWidth: 420, boxShadow: "0 10px 40px rgba(0,0,0,.3)" }
    },
      React.createElement("div", {
        id: "wipe-title",
        style: { fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 700, color: "#b91c1c", marginBottom: 8 }
      }, stage === "1" ? "Delete all data?" : "Final confirmation"),
      stage === "1"
        ? React.createElement("div", {
            style: { fontSize: 13, color: "var(--c-text-soft)", lineHeight: 1.55, marginBottom: 18 }
          }, "This will permanently erase every goal, habit, to-do, journal entry, and saved date on your account. Your sign-in stays intact — but the data cannot be recovered.")
        : React.createElement(React.Fragment, null,
            React.createElement("div", {
              style: { fontSize: 13, color: "var(--c-text-soft)", lineHeight: 1.55, marginBottom: 12 }
            }, "Type ", React.createElement("strong", { style: { color: "#b91c1c" } }, "delete"), " to confirm. This cannot be undone."),
            React.createElement("input", {
              type: "text",
              value: typedText,
              onChange: e => setTypedText(e.target.value),
              autoFocus: true,
              autoCapitalize: "characters",
              autoCorrect: "off",
              spellCheck: false,
              placeholder: "Type delete",
              style: { width: "100%", padding: "10px 12px", border: "1px solid var(--c-border)", borderRadius: 8, fontSize: 14, marginBottom: 18, outline: "none", background: "var(--c-surface-raised)" }
            })
          ),
      React.createElement("div", {
        style: { display: "flex", gap: 8, justifyContent: "flex-end" }
      },
        React.createElement("button", {
          "data-a11y-dialog-hide": true,
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "var(--c-text-soft)", cursor: "pointer" }
        }, "Cancel"),
        stage === "1"
          ? React.createElement("button", {
              onClick: onAdvanceToStage2,
              style: { background: "var(--c-tint-danger-bg)", border: "1px solid var(--c-tint-danger-border)", color: "var(--c-tint-danger-fg)", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }
            }, "Continue")
          : React.createElement("button", {
              onClick: onWipe,
              disabled: !isReady,
              style: {
                background: isReady ? "#b91c1c" : "#9ca3af",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "9px 16px", fontSize: 13, fontWeight: 700,
                cursor: isReady ? "pointer" : "not-allowed"
              }
            }, "Delete All Data")
      )
    );
  }

  window.ConfirmWipeModal = ConfirmWipeModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ConfirmWipeModal };
  }
})();
