// lib/modals/TimeEntryCtxModal.js
//
// Time-entry sheet: opened when the user logs OR misses a habit at a
// specific time. Two entries: "Log now" with the current time pre-
// filled, OR a custom <input type="time"> with explicit Save.
//
// Wave 4.1.14. Originally inline at index.html L20644-L20715 (IIFE).
//
// References from shared classic-script global lexical environment:
//   tkTime() (utils.js)

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function to12h(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t || "");
    if (!m) return t;
    let h = parseInt(m[1], 10);
    const mins = m[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return h + ":" + mins + " " + ampm;
  }

  function TimeEntryCtxModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const ctx = s.ctx;
    if (!ctx) return null;
    const habit = (data.habits || []).find(h => h.id === ctx.habitId);
    if (!habit) return null;

    const timeEntryValue = s.timeEntryValue || "";
    const setTimeEntryValue = cb.setTimeEntryValue || (() => {});
    const onClose = cb.onClose || (() => {});
    const onCommit = cb.onCommit || (() => {});

    const verb = ctx.mode === "missed" ? "Miss" : "Log";

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "te-title",
      overlayStyle: { zIndex: 315 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: "20px 20px 0 0", padding: "20px 18px 22px", maxWidth: 480, boxShadow: "0 -8px 40px rgba(0,0,0,.2)" }
    },
      React.createElement("div", {
        id: "te-title",
        style: { fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }
      }, verb + " completion"),
      React.createElement("div", {
        style: { fontSize: 13, color: "#6b7280", marginBottom: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
      }, habit.text),
      React.createElement("button", {
        type: "button",
        onClick: () => onCommit(tkTime()),
        style: { width: "100%", minHeight: 44, padding: "12px 14px", borderRadius: 10, border: "none", background: ctx.mode === "missed" ? "#991b1b" : "#2d5a2d", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10 }
      }, "Log now (" + to12h(tkTime()) + ")"),
      React.createElement("div", {
        style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }
      },
        React.createElement("label", {
          style: { fontSize: 12, color: "#6b7280", flexShrink: 0 }
        }, "At"),
        React.createElement("input", {
          type: "time",
          value: timeEntryValue,
          onChange: e => setTimeEntryValue(e.target.value),
          style: { flex: 1, minHeight: 44, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-surface-raised)", color: "var(--c-text)", fontSize: 14 }
        }),
        React.createElement("button", {
          type: "button",
          onClick: () => onCommit(timeEntryValue),
          disabled: !/^\d{2}:\d{2}$/.test(timeEntryValue),
          style: { minHeight: 44, padding: "10px 16px", borderRadius: 8, border: "1px solid " + (ctx.mode === "missed" ? "#991b1b" : "#2d5a2d"), background: "transparent", color: (ctx.mode === "missed" ? "#991b1b" : "#2d5a2d"), fontSize: 13, fontWeight: 700, cursor: "pointer" }
        }, "Save")
      ),
      React.createElement("button", {
        type: "button",
        "data-a11y-dialog-hide": true,
        style: { width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 10, border: "none", background: "var(--c-surface-muted)", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }
      }, "Cancel")
    );
  }

  window.TimeEntryCtxModal = TimeEntryCtxModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { TimeEntryCtxModal };
  }
})();
