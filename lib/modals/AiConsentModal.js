// lib/modals/AiConsentModal.js
//
// AI consent gate — explains that AI features send text to Anthropic
// via the secure proxy, links to the Privacy Policy. "I agree" writes
// data.aiConsentAt timestamp; Cancel just closes.
//
// Wave 4.1.13. Originally inline in index.html (small version; the
// user's plan-estimate of 650 LOC corresponded to an earlier draft;
// current shipped version is ~35 LOC).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function AiConsentModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const cb = callbacks || {};
    const onClose = cb.onClose || (() => {});
    const onAgree = cb.onAgree || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "ai-consent-title",
      overlayStyle: { padding: 16, zIndex: 1000, alignItems: "center" },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,.3)" }
    },
      React.createElement("h2", {
        id: "ai-consent-title",
        style: { fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 12, color: "var(--c-text-strong, var(--c-text))", fontSize: 20 }
      }, "Enable AI insights"),
      React.createElement("p", {
        style: { color: "var(--c-text-soft)", lineHeight: 1.5, marginBottom: 16, fontSize: 14 }
      },
        "AI features send the text you generate (e.g. recent habit completions or a journal entry you choose to summarize) to Anthropic via our secure proxy. Anthropic does not train models on your content. See our ",
        React.createElement("a", {
          href: "/privacy",
          target: "_blank",
          rel: "noopener noreferrer",
          style: { color: "var(--accent, #4f46e5)" }
        }, "Privacy Policy"),
        "."
      ),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("button", {
          type: "button",
          "data-a11y-dialog-hide": true,
          style: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text-soft)", cursor: "pointer", fontSize: 13 }
        }, "Cancel"),
        React.createElement("button", {
          type: "button",
          "data-a11y-dialog-hide": true,
          onClick: onAgree,
          style: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "none", background: "var(--accent, #4f46e5)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }
        }, "I agree")
      )
    );
  }

  window.AiConsentModal = AiConsentModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { AiConsentModal };
  }
})();
