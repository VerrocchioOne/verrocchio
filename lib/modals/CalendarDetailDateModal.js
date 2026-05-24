// lib/modals/CalendarDetailDateModal.js
//
// Day-detail snapshot opened when the user taps a day cell in the
// Calendar modal's month grid. Shows that day's habit hits + misses,
// active goals (live + within timebound), due/done todos, and journal
// entries. Read-only summary; backdrop closes.
//
// Wave 4.1.10. Originally inline in index.html L20248-L20327.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function CalendarDetailDateModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const dateKey = s.dateKey; // "YYYY-MM-DD"
    const onClose = cb.onClose || (() => {});

    if (!dateKey) return null;

    const titleDate = new Date(dateKey + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const habits = data && data.habits ? data.habits : [];
    const completed = habits.filter(h => {
      if (!h.completions) return false;
      const v = h.completions[dateKey];
      return v === "done" || v === true || (v && typeof v === "object");
    });
    const missed = habits.filter(h => h.completions && h.completions[dateKey] === "missed");

    const goals = data && data.goals ? data.goals : [];
    const activeGoals = goals.filter(g => {
      if (!g) return false;
      const tb = g.smart && g.smart.timebound;
      return !g.completed && (!tb || dateKey <= tb);
    });

    const todos = data && data.todos ? data.todos : [];
    const dueOrDone = todos.filter(t => {
      if (!t || t.archived) return false;
      const dueOnDay = t.dueDate === dateKey;
      const doneOnDay = t.done && t.completedDate === dateKey;
      return dueOnDay || doneOnDay;
    });

    const journal = data && data.journal ? data.journal : [];
    const entries = journal.filter(e => e && e.dateKey === dateKey);

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "calendar-detail-title",
      overlayStyle: { padding: 16, zIndex: 1100, alignItems: "center" },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: 16, padding: 20, maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,.3)" }
    },
      React.createElement("h2", {
        id: "calendar-detail-title",
        style: { fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 16, color: "var(--c-text-strong, var(--c-text))", fontSize: 20 }
      }, "Snapshot — " + titleDate),

      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 } }, "Habits"),
        completed.length > 0 && React.createElement("div", { style: { marginBottom: 6 } },
          completed.map(h => React.createElement("div", { key: "c-" + h.id, style: { padding: "4px 0", fontSize: 14, color: "var(--c-text-strong, var(--c-text))" } }, "✓ " + h.text))
        ),
        missed.length > 0 && React.createElement("div", null,
          missed.map(h => React.createElement("div", { key: "m-" + h.id, style: { padding: "4px 0", fontSize: 14, color: "var(--c-text-faint)" } }, "○ " + h.text + " (missed)"))
        ),
        completed.length === 0 && missed.length === 0 && React.createElement("div", { style: { fontSize: 13, color: "var(--c-text-faint)", fontStyle: "italic" } }, "No habit activity")
      ),

      activeGoals.length > 0 && React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 } }, "Active goals"),
        activeGoals.map(g => React.createElement("div", { key: "g-" + g.id, style: { padding: "4px 0", fontSize: 14, color: "var(--c-text-strong, var(--c-text))" } }, "• " + g.text))
      ),

      dueOrDone.length > 0 && React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 } }, "To-dos"),
        dueOrDone.map(t => React.createElement("div", { key: "t-" + t.id, style: { padding: "4px 0", fontSize: 14, color: t.done ? "var(--c-text-faint)" : "var(--c-text-strong, var(--c-text))" } }, (t.done ? "✓ " : "○ ") + t.text))
      ),

      entries.length > 0 && React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 } }, "Journal"),
        entries.map(e => React.createElement("div", {
          key: "j-" + e.id,
          style: { padding: "8px 10px", marginBottom: 6, background: "var(--c-surface-muted)", borderRadius: 8, fontSize: 13, color: "var(--c-text-soft)" }
        },
          e.tag && React.createElement("span", { style: { fontSize: 11, color: "var(--c-text-faint)", marginRight: 6 } }, "[" + e.tag + "] "),
          e.text || "(empty)"
        ))
      ),

      React.createElement("button", {
        type: "button",
        "data-a11y-dialog-hide": true,
        style: { display: "block", width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: "var(--c-surface-muted)", color: "var(--c-text-soft)", fontWeight: 500, cursor: "pointer", marginTop: 8, fontSize: 14 }
      }, "Close")
    );
  }

  window.CalendarDetailDateModal = CalendarDetailDateModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { CalendarDetailDateModal };
  }
})();
