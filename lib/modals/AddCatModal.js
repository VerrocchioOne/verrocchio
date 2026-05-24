// lib/modals/AddCatModal.js
//
// "New Goal Category" modal. Lets the user type a category name and
// pick a color from a fixed palette, then saves it to
// data.customGoalTypes and sets the goal type filter to that category.
//
// Wave 4.1.7. Originally inline in index.html L20255-L20296.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const PALETTE = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#14b8a6","#f97316"];

  function AddCatModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const newCatName = s.newCatName || "";
    const newCatColor = s.newCatColor;
    const setNewCatName = cb.setNewCatName || (() => {});
    const setNewCatColor = cb.setNewCatColor || (() => {});
    const onClose = cb.onClose || (() => {});
    const onCreate = cb.onCreate || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "add-cat-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", zIndex: 300, alignItems: "center", padding: 24 },
      cardStyle: { background: "#fff", borderRadius: 16, padding: "24px 20px", maxWidth: 360, boxShadow: "0 8px 40px rgba(0,0,0,.2)" }
    },
      React.createElement("div", { id: "add-cat-title", className: "card-title", style: { fontSize: 16, color: "var(--c-text-strong)", marginBottom: 16 } }, "New Goal Category"),
      React.createElement("input", {
        value: newCatName,
        onChange: e => setNewCatName(e.target.value),
        placeholder: "Category name (e.g. Health, Family...)",
        autoFocus: true,
        style: { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", marginBottom: 12, boxSizing: "border-box" }
      }),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" } }, "Color"),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          PALETTE.map(c =>
            React.createElement("div", {
              key: c,
              onClick: () => setNewCatColor(c),
              style: { width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: newCatColor === c ? "3px solid #111" : "3px solid transparent", boxSizing: "border-box" }
            })
          )
        )
      ),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("button", { "data-a11y-dialog-hide": true, style: { flex: 1, background: "var(--c-surface-muted)", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" } }, "Cancel"),
        React.createElement("button", {
          onClick: () => onCreate(newCatName, newCatColor),
          style: { flex: 2, background: "#2d5a2d", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }
        }, "Create Category")
      )
    );
  }

  window.AddCatModal = AddCatModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { AddCatModal };
  }
})();
