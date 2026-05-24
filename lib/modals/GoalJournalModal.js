// lib/modals/GoalJournalModal.js
//
// Per-goal journal entry composer. Reached from GoalMoreMenu →
// "Add Journal Entry". Save appends a new entry to data.journal
// tagged "goals" with the goal's id; close clears the draft text.
//
// Wave 4.1.4. Originally inline at index.html L19617-L19644.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function GoalJournalModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const goal = s.goal;
    if (!goal) return null;
    const draft = s.draft || "";
    const onClose = cb.onClose || (() => {});
    const onSave = cb.onSave || (() => {});
    const setDraft = cb.setDraft || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "goal-journal-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", zIndex: 300 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: "20px 20px 0 0", padding: "24px 20px", maxWidth: 640, boxShadow: "0 -8px 40px rgba(0,0,0,.2)" }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("div", { id: "goal-journal-title", style: { fontFamily: "'Lora',serif", fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 12 } }, "Journal: ", goal.text),
        React.createElement("button", { "aria-label": "Close", "data-a11y-dialog-hide": true, style: { background: "var(--c-surface-muted)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" } }, "×")
      ),
      React.createElement("textarea", {
        value: draft,
        onChange: e => setDraft(e.target.value),
        placeholder: "Reflect on this goal — what's working, what's not, what's next...",
        rows: 5,
        autoFocus: true,
        style: { width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", color: "var(--c-text)", boxSizing: "border-box", lineHeight: 1.6 }
      }),
      React.createElement("button", {
        onClick: () => onSave(draft),
        style: { marginTop: 12, width: "100%", background: "#2d5a2d", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }
      }, "Save Entry")
    );
  }

  window.GoalJournalModal = GoalJournalModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { GoalJournalModal };
  }
})();
