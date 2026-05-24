// lib/modals/WelcomeModal.js
//
// First-run welcome shown only when the user has zero habits and
// hasn't seen the modal yet. Both buttons save the seen flag so the
// modal doesn't reappear; "Add my first habit" also routes to the
// Habits tab.
//
// Wave 4.1.11. Originally inline in index.html L20537-L20570.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function WelcomeModal({ data, dispatch, deviceProfile, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const onClose = (callbacks && callbacks.onClose) || (() => {});
    const onAddFirstHabit = (callbacks && callbacks.onAddFirstHabit) || (() => {});
    const onSkip = (callbacks && callbacks.onSkip) || onClose;
    const onPronounce = (callbacks && callbacks.onPronounce) || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "welcome-title",
      overlayStyle: { padding: 16, zIndex: 1000, alignItems: "center" },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: 16, padding: 24, maxWidth: 360, width: "100%", textAlign: "center", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,.3)" }
    },
      React.createElement("h2", {
        id: "welcome-title",
        style: { fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 12, color: "var(--c-text-strong, var(--c-text))", fontSize: 22 }
      },
        "Welcome to Verrocchio",
        React.createElement("button", {
          type: "button",
          onClick: onPronounce,
          title: "Hear how it's pronounced",
          "aria-label": "Pronounce Verrocchio",
          style: { background: "transparent", border: "none", color: "var(--c-text-faint)", cursor: "pointer", padding: "2px 6px", marginLeft: 6, fontSize: 14, lineHeight: 1, verticalAlign: "middle" }
        }, "🔊")
      ),
      React.createElement("p", {
        style: { color: "var(--c-text-soft)", lineHeight: 1.5, marginBottom: 20, fontSize: 14 }
      }, "A calm place for the habits, goals, and reflections that compound into who you become."),
      React.createElement("button", {
        type: "button",
        "data-a11y-dialog-hide": true,
        onClick: onAddFirstHabit,
        style: { display: "block", width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: "var(--accent, #4f46e5)", color: "#fff", fontWeight: 600, marginBottom: 8, cursor: "pointer", fontSize: 14 }
      }, "Add my first habit"),
      React.createElement("button", {
        type: "button",
        "data-a11y-dialog-hide": true,
        onClick: onSkip,
        style: { display: "block", width: "100%", padding: "8px 16px", borderRadius: 10, border: "none", background: "transparent", color: "var(--c-text-faint)", fontSize: 13, cursor: "pointer" }
      }, "Skip for now")
    );
  }

  window.WelcomeModal = WelcomeModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { WelcomeModal };
  }
})();
