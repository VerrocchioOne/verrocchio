// lib/views/HabitsTouchReorderBar.js
//
// Slim sticky top bar shown on touch devices when reorder mode is
// active. Replaces the desktop HabitsReorderToolbar's exit button +
// status text with a single-row affordance sized for finger tap.
// Lives in its own module so HabitsView stays under the 1000-LOC cap.

(function () {
  if (typeof window === "undefined" || !window.React) return;
  const R = window.React;

  function HabitsTouchReorderBar(props) {
    const isDragging = !!(props && props.dragState && props.dragState.dragging);
    const onExitReorder = (props && props.onExitReorder) || (() => {});
    return R.createElement("div", {
      style: {
        position: "sticky", top: 0, zIndex: 200,
        padding: "10px 14px",
        background: "var(--c-surface-raised, #fff)",
        borderBottom: "1px solid var(--c-border, #e5e7eb)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
      }
    },
      R.createElement("span", {
        style: { fontSize: 13, fontWeight: 700, color: "var(--c-text-strong, #111)" }
      }, isDragging ? "Drop to reorder" : "Drag the ≡ handle to reorder"),
      R.createElement("button", {
        type: "button",
        onClick: onExitReorder,
        style: {
          minHeight: 36, padding: "6px 14px", borderRadius: 8,
          border: "1px solid #2d5a2d", background: "#2d5a2d",
          color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
        }
      }, "Done")
    );
  }

  window.HabitsTouchReorderBar = HabitsTouchReorderBar;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = HabitsTouchReorderBar;
  }
})();
