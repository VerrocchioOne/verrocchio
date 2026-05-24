// lib/views/HabitsNewHabitForm.js
//
// The inline "Add a habit" form that opens when the user taps the [+]
// pill in the Habits filter toolbar. Extracted from HabitsView.js to
// keep that file moving toward the 1000-LOC cap (see CLAUDE.md
// "File-size rule").
//
// Behavior is byte-identical to the inline block it replaces in
// HabitsView. All form state lives in App (via callbacks bundle),
// so closing and reopening preserves the in-progress entry — same as
// before extraction.
//
// Props (all pass-through from HabitsView's closure):
//   data            — full app data object (reads data.goals)
//   nHabit, nHGoal, nHType, nHSec, nHDur, nHImp, nHFreq, nHStart, nHNotes
//                   — form value bindings (App state)
//   sNHabit, sNHGoal, sNHType, sNHSec, sNHDur, sNHImp, sNHFreq, sNHStart, sNHNotes
//                   — corresponding setters
//   setTab          — tab navigator (used by "Create a new goal first")
//   setShowAddHabit — closes the form on Cancel
//   addHabit        — commit handler (reads form state from App scope)
//   renderFreqPicker — helper that paints the cadence sub-picker

(function () {
  if (typeof window === "undefined" || !window.React) return;
  const R = window.React;

  function HabitsNewHabitForm(props) {
    const p = props || {};
    const data           = p.data || {};
    const nHabit         = p.nHabit;
    const nHGoal         = p.nHGoal;
    const nHType         = p.nHType;
    const nHSec          = p.nHSec;
    const nHDur          = p.nHDur;
    const nHImp          = p.nHImp;
    const nHFreq         = p.nHFreq;
    const nHStart        = p.nHStart;
    const nHNotes        = p.nHNotes;
    const sNHabit        = p.sNHabit  || (() => {});
    const sNHGoal        = p.sNHGoal  || (() => {});
    const sNHType        = p.sNHType  || (() => {});
    const sNHSec         = p.sNHSec   || (() => {});
    const sNHDur         = p.sNHDur   || (() => {});
    const sNHImp         = p.sNHImp   || (() => {});
    const sNHFreq        = p.sNHFreq  || (() => {});
    const sNHStart       = p.sNHStart || (() => {});
    const sNHNotes       = p.sNHNotes || (() => {});
    const setTab         = p.setTab          || (() => {});
    const setShowAddHabit = p.setShowAddHabit || (() => {});
    const addHabit       = p.addHabit        || (() => {});
    const renderFreqPicker = p.renderFreqPicker || (() => null);

    return R.createElement("div", {
      className: "fade-in",
      // data-tour-id markers — same pattern as the goal form. The tour
      // uses these selectors to walk the user through the habit fields
      // (timing, area, link-to-goal, save) one prompt at a time.
      "data-tour-id": "habit-form",
      style: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "14px",
        marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,.04)"
      }
    }, R.createElement("input", {
      value: nHabit,
      onChange: e => sNHabit(e.target.value),
      // No Enter-to-save. The habit only commits when the user taps the
      // spotlighted Add button — hitting Enter mid-form used to save a
      // habit that was missing its area / importance / schedule, which
      // read as the card closing on the user by accident.
      onKeyDown: e => { if (e.key === "Enter") e.preventDefault(); },
      // Inviting example to match the goal form's "e.g. Run a half-
      // marathon" — a concrete action beats a bare "Habit name".
      placeholder: "e.g. Run for 30 minutes",
      "data-tour-id": "habit-name",
      style: {
        ...IS,
        width: "100%",
        marginBottom: 4
      }
    }),
    R.createElement("div", {
      style: { fontSize: 11, color: "#6b7280", marginBottom: 8 }
    }, "Keep it concrete and short."),
    R.createElement("select", {
      value: nHGoal,
      onChange: e => {
        if (e.target.value === "__new__") {
          sNHGoal("");
          setTab("goals");
        } else {
          const v = e.target.value;
          sNHGoal(v);
          // Auto-sync the habit's Area of Life to the linked goal's
          // area so the two never drift. Clearing the link leaves the
          // current area alone — the user can then pick any bucket.
          if (v) {
            const g = data.goals.find(x => String(x.id) === String(v));
            if (g && g.type) sNHType(g.type);
          }
        }
      },
      "data-tour-id": "habit-goal",
      style: {
        ...S,
        width: "100%",
        marginBottom: 8,
        color: nHGoal ? "#2d5a2d" : "#9ca3af"
      }
    }, R.createElement("option", {
      value: ""
    }, "🎯 Link to a Goal (optional)"), R.createElement("option", {
      value: "__new__"
    }, "＋ Create a new goal first"), HT.map(ht => {
      const tg = data.goals.filter(g => g.type === ht.value);
      if (!tg.length) return null;
      return R.createElement("optgroup", {
        key: ht.value,
        label: ht.value
      }, tg.map(g => R.createElement("option", {
        key: g.id,
        value: g.id
      }, g.text)));
    }), data.goals.filter(g => !g.type).length > 0 && R.createElement("optgroup", {
      label: "General"
    }, data.goals.filter(g => !g.type).map(g => R.createElement("option", {
      key: g.id,
      value: g.id
    }, g.text)))), R.createElement("div", {
      "data-tour-id": "habit-timing",
      style: {
        display: "flex",
        gap: 6,
        marginBottom: 8
      }
    }, R.createElement("select", {
      value: nHSec,
      onChange: e => sNHSec(e.target.value),
      style: {
        ...S,
        flex: 1,
        color: SECTIONS.find(s => s.value === nHSec)?.color || "var(--c-text-soft)"
      }
    }, R.createElement("option", {
      value: "morning"
    }, "🌅 Time of Day"), SECTIONS.map(s => R.createElement("option", {
      key: s.value,
      value: s.value
    }, s.icon, " ", s.label))), R.createElement("select", {
      value: nHDur,
      onChange: e => sNHDur(e.target.value),
      style: {
        ...S,
        flex: 1
      }
    }, R.createElement("option", {
      value: ""
    }, "⏱ Duration"), DURS.map(d => R.createElement("option", {
      key: d.value,
      value: d.value
    }, d.label)))), R.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginBottom: 8
      }
    }, R.createElement("select", {
      value: nHType,
      // When a goal is linked, the habit's Area of Life is locked to
      // match the goal's area — a habit can't sit in "Physical" while
      // laddering up to a "Career" goal. The dropdown still renders
      // (so the user sees which bucket they're in) but editing is
      // disabled until the goal link is cleared.
      onChange: e => { if (!nHGoal) sNHType(e.target.value); },
      disabled: !!nHGoal,
      "data-tour-id": "habit-area",
      style: {
        ...S,
        flex: 1,
        color: HT.find(t => t.value === nHType)?.color || "#9ca3af",
        opacity: nHGoal ? 0.75 : 1,
        cursor: nHGoal ? "not-allowed" : "pointer"
      }
    }, R.createElement("option", {
      value: ""
    }, "🌱 Area of Life"), HT.map(t => R.createElement("option", {
      key: t.value,
      value: t.value
    }, t.value))), R.createElement("select", {
      value: nHImp,
      onChange: e => sNHImp(e.target.value),
      "data-tour-id": "habit-importance",
      style: {
        ...S,
        flex: 1,
        color: IMP.find(i => i.value === nHImp)?.color || "var(--c-text-soft)"
      }
    }, R.createElement("option", {
      value: "Important"
    }, "★ Importance"), IMP.map(i => R.createElement("option", {
      key: i.value,
      value: i.value
    }, i.value)))),
    // Schedule block: start date + frequency cadence + cadence-specific
    // sub-picker (weekday chips, day-of-month, or month+day anchor).
    // See `renderFreqPicker` for the per-cadence field layout.
    // Wrapped so the tour can spotlight the whole schedule block at once
    // (start date + cadence) as a single walkthrough step instead of
    // flashing the picker sub-selects one by one.
    R.createElement("div", {
      "data-tour-id": "habit-schedule"
    }, renderFreqPicker(nHFreq, sNHFreq, nHStart, sNHStart)),
    R.createElement("textarea", {
      value: nHNotes,
      onChange: e => sNHNotes(e.target.value),
      placeholder: "Sub-components / notes — e.g. Sit-ups \xB7 Planks \xB7 Leg raises",
      rows: 2,
      style: {
        ...IS,
        width: "100%",
        marginBottom: 8,
        resize: "none",
        lineHeight: 1.5
      }
    }), R.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        justifyContent: "flex-end"
      }
    }, R.createElement("button", {
      onClick: () => setShowAddHabit(false),
      style: {
        ...AB,
        background: "var(--c-surface-muted)",
        color: "#6b7280",
        padding: "8px 14px",
        fontSize: 12
      }
    }, "Cancel"), R.createElement("button", {
      className: "add-btn",
      "data-tour-id": "habit-save",
      // addHabit() closes the form internally on successful save; calling
      // setShowAddHabit(false) unconditionally here was the old pattern
      // but it silently ate empty-name taps (form closed without adding
      // anything). Trust addHabit to handle its own close.
      onClick: addHabit,
      style: {
        ...AB,
        padding: "8px 18px",
        fontSize: 12
      }
    }, "Add")));
  }

  window.HabitsNewHabitForm = HabitsNewHabitForm;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { HabitsNewHabitForm };
  }
})();
