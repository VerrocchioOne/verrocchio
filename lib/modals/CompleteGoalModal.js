// lib/modals/CompleteGoalModal.js
//
// Confirmation when marking a goal complete. Shows the goal text in a
// success-tinted card, lets the user optionally seed a next goal that
// links back to this completion.
//
// Wave 4.1.2. Originally inline at index.html L16895-L17015.
//
// References from shared classic-script global lexical environment:
//   IS, AB (style objects, lib/constants.js)

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function CompleteGoalModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const goal = s.goal;
    if (!goal) return null;
    const nextGoalTxt = s.nextGoalTxt || "";
    const setNextGoalTxt = cb.setNextGoalTxt || (() => {});
    const onClose = cb.onClose || (() => {});
    const onCompleteOnly = cb.onCompleteOnly || (() => {});
    const onCompleteAndNext = cb.onCompleteAndNext || (() => {});

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "complete-goal-title",
      cardStyle: { background: "var(--c-surface, #fff)" }
    },
      React.createElement("div", {
        style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }
      },
        React.createElement("div", {
          id: "complete-goal-title",
          style: { fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 700, color: "var(--c-text-strong)" }
        }, "Complete Goal 🎉"),
        React.createElement("button", {
          "aria-label": "Close",
          type: "button",
          "data-a11y-dialog-hide": true,
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }
        }, "×")
      ),
      React.createElement("div", {
        style: { background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10, padding: "12px", marginBottom: 16 }
      },
        React.createElement("div", {
          style: { fontSize: 10, fontWeight: 700, color: "#2d5a2d", textTransform: "uppercase", marginBottom: 4 }
        }, "Goal Achieved"),
        React.createElement("div", {
          style: { fontSize: 14, fontWeight: 600, color: "var(--c-text)" }
        }, goal.text)
      ),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("div", {
          style: { fontSize: 12, fontWeight: 600, color: "var(--c-text-soft)", marginBottom: 8 }
        }, "What's your next goal? (optional)"),
        React.createElement("input", {
          value: nextGoalTxt,
          onChange: e => setNextGoalTxt(e.target.value),
          placeholder: `e.g., Build on "${goal.text.slice(0, 30)}..."`,
          style: { ...IS, width: "100%", marginBottom: 8 }
        }),
        React.createElement("div", {
          style: { fontSize: 11, color: "#9ca3af" }
        }, "This will be linked to the completed goal so you can track your progression.")
      ),
      React.createElement("div", { style: { display: "flex", gap: 10 } },
        React.createElement("button", {
          type: "button",
          onClick: onCompleteOnly,
          style: { flex: 1, background: "var(--c-surface-muted)", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, color: "var(--c-text-soft)", cursor: "pointer" }
        }, "Complete Only"),
        React.createElement("button", {
          type: "button",
          onClick: () => onCompleteAndNext(nextGoalTxt),
          style: { flex: 1, ...AB, borderRadius: 10, padding: "12px", fontSize: 13 }
        }, "Complete & Create Next")
      )
    );
  }

  window.CompleteGoalModal = CompleteGoalModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { CompleteGoalModal };
  }
})();
