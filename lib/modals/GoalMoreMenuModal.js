// lib/modals/GoalMoreMenuModal.js
//
// Per-goal action sheet ("…" overflow menu): Add Journal Entry,
// Edit Goal, Mark Complete, Delete Goal. Each action handler also
// closes this menu before opening any follow-up modal.
//
// Wave 4.1.3. Originally inline at index.html L19594-L19618 (IIFE).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const btnStyle = (color, first) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    padding: "15px 4px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    color,
    textAlign: "left",
    fontWeight: 500,
    borderTop: first ? "none" : "1px solid #f3f4f6"
  });

  function GoalMoreMenuModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const goal = s.goal;
    if (!goal) return null;
    const onClose = cb.onClose || (() => {});
    const onAddJournal = cb.onAddJournal || (() => {});
    const onEdit = cb.onEdit || (() => {});
    const onComplete = cb.onComplete || (() => {});
    const onDelete = cb.onDelete || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "goal-more-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", zIndex: 300 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: "20px 20px 0 0", padding: "24px 20px", maxWidth: 640, boxShadow: "0 -8px 40px rgba(0,0,0,.2)" }
    },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
        React.createElement("div", { id: "goal-more-title", style: { fontFamily: "'Lora',serif", fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 12 } }, goal.text),
        React.createElement("button", { "aria-label": "Close", "data-a11y-dialog-hide": true, style: { background: "var(--c-surface-muted)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" } }, "×")
      ),
      React.createElement("div", { style: { height: 1, background: "var(--c-surface-muted)", margin: "14px 0" } }),
      React.createElement("button", { onClick: onAddJournal, style: btnStyle("#0891b2", true) }, "📝 Add Journal Entry"),
      React.createElement("button", { onClick: onEdit, style: btnStyle("var(--c-text)", false) }, "✎ Edit Goal"),
      React.createElement("button", { onClick: onComplete, style: btnStyle("#16a34a", false) }, "✓ Mark Complete"),
      React.createElement("button", { onClick: onDelete, style: btnStyle("#dc2626", false) }, "🗑 Delete Goal")
    );
  }

  window.GoalMoreMenuModal = GoalMoreMenuModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { GoalMoreMenuModal };
  }
})();
