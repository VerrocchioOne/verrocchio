// lib/modals/ConfirmDeleteAcctModal.js
//
// Delete-account confirmation. Requires the user's password (entered
// in the Account section above, passed in via state.acctCurrentPw) AND
// the literal phrase "delete my account" typed in the confirm box.
// Offers a "forgot my password" link that triggers a Firebase reset
// email (handled by the onSendPasswordResetEmail callback).
//
// Wave 4.1.9. Originally inline in index.html L20379-L20437.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function ConfirmDeleteAcctModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const confirmText = s.confirmText || "";
    const acctFeedback = s.acctFeedback;
    const acctBusy = !!s.acctBusy;
    const acctCurrentPw = s.acctCurrentPw;
    const onClose = cb.onClose || (() => {});
    const onSendPasswordResetEmail = cb.onSendPasswordResetEmail || (() => {});
    const onDelete = cb.onDelete || (() => {});
    const setConfirmText = cb.setConfirmText || (() => {});

    const phraseOk = confirmText.trim().toLowerCase() === "delete my account";
    const disabled = acctBusy || !acctCurrentPw || !phraseOk;

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "del-acct-title",
      overlayStyle: { background: "rgba(0,0,0,0.6)", zIndex: 320, alignItems: "center", padding: 20 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: 16, padding: "22px 20px", maxWidth: 420, boxShadow: "0 10px 40px rgba(0,0,0,.3)" }
    },
      React.createElement("div", {
        id: "del-acct-title",
        style: { fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 700, color: "#991b1b", marginBottom: 8 }
      }, "Delete account?"),
      React.createElement("div", {
        style: { fontSize: 13, color: "var(--c-text)", lineHeight: 1.6, marginBottom: 14 }
      }, "This permanently deletes your account, all habits, journal entries, goals, and uploaded files. This cannot be undone."),
      React.createElement("div", {
        style: { fontSize: 11, color: "#6b7280", marginBottom: 14 }
      }, "Re-enter your current password in the Account section above, then confirm below."),
      React.createElement("a", {
        href: "#",
        onClick: (e) => { e.preventDefault(); onSendPasswordResetEmail(); },
        style: { fontSize: 12, color: "var(--c-text-faint)", textDecoration: "underline", cursor: "pointer", marginTop: 4, marginBottom: 12, display: "inline-block" }
      }, "I forgot my password"),
      React.createElement("p", {
        style: { fontSize: 13, color: "var(--c-text-soft)", marginTop: 8, marginBottom: 6 }
      }, "Type \"delete my account\" to confirm:"),
      React.createElement("input", {
        type: "text",
        value: confirmText,
        onChange: (e) => setConfirmText(e.target.value),
        placeholder: "delete my account",
        autoCapitalize: "none",
        autoComplete: "off",
        style: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--c-border)", marginBottom: 10, fontSize: 14, boxSizing: "border-box" }
      }),
      acctFeedback && acctFeedback.kind === "err" && React.createElement("div", {
        style: { fontSize: 12, padding: "6px 10px", borderRadius: 6, color: "#991b1b", background: "#fef2f2", border: "1px solid #fca5a5", marginBottom: 12 }
      }, acctFeedback.msg),
      acctFeedback && acctFeedback.kind === "info" && React.createElement("div", {
        style: { fontSize: 12, padding: "6px 10px", borderRadius: 6, color: "var(--c-text-soft)", background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", marginBottom: 12 }
      }, acctFeedback.msg),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("button", {
          type: "button",
          "data-a11y-dialog-hide": true,
          disabled: acctBusy,
          style: { flex: 1, minHeight: 44, padding: 11, borderRadius: 10, border: "1px solid var(--c-border)", background: "var(--c-surface-raised)", color: "var(--c-text)", fontSize: 13, fontWeight: 600, cursor: acctBusy ? "default" : "pointer" }
        }, "Cancel"),
        React.createElement("button", {
          type: "button",
          onClick: onDelete,
          disabled,
          style: { flex: 1, minHeight: 44, padding: 11, borderRadius: 10, border: "none", background: "#991b1b", color: "#fff", fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }
        }, acctBusy ? "Deleting…" : "Delete forever")
      )
    );
  }

  window.ConfirmDeleteAcctModal = ConfirmDeleteAcctModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ConfirmDeleteAcctModal };
  }
})();
