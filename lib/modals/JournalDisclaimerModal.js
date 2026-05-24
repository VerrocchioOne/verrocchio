// lib/modals/JournalDisclaimerModal.js
//
// Disclaimer shown after the user's first journal save. Tells them
// Verrocchio is not a medical device and the entries are private. The
// "Got it" button marks `data.journalDisclaimerAcked` so the modal
// doesn't reappear.
//
// Wave 4.1.12 — first Wave 4 modal extraction (pilot). Validates the
// modal extraction pattern from
// docs/superpowers/plans/2026-05-24-wave-4-subsystems.md.
//
// Dual-loaded (browser <script> global + Node CJS export).
//
// Browser dependencies:
//   - React (UMD global)
//   - window.VerrocchioReactDialog (lib/components/A11yDialog.js)
//
// Originally lived inline in index.html L20576-L20594.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function JournalDisclaimerModal({ data, dispatch, deviceProfile, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const onClose = (callbacks && callbacks.onClose) || (() => {});
    const onAck = (callbacks && callbacks.onAck) || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "journal-disclaimer-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", padding: 16, zIndex: 1000, alignItems: "center" },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: 16, padding: 24, maxWidth: 360, boxShadow: "0 10px 40px rgba(0,0,0,.3)" }
    },
      React.createElement("h2", {
        id: "journal-disclaimer-title",
        style: { fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 12, color: "var(--c-text-strong, var(--c-text))", fontSize: 20 }
      }, "A quick note"),
      React.createElement("p", {
        style: { color: "var(--c-text-soft)", lineHeight: 1.5, marginBottom: 16, fontSize: 14 }
      }, "Verrocchio is not a medical device. Your journal entries are stored in your private Firebase account and visible only to you. If you're in crisis, please contact a qualified professional or local emergency services."),
      React.createElement("button", {
        type: "button",
        onClick: onAck,
        style: { display: "block", width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: "var(--accent, #4f46e5)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }
      }, "Got it")
    );
  }

  window.JournalDisclaimerModal = JournalDisclaimerModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { JournalDisclaimerModal };
  }
})();
