// lib/views/HabitsView.js — Phase B of v75 view extraction (PARTIAL).
//
// The Habits render block in index.html (lines 15595–18496, ~2900 lines)
// is the LARGEST view in the app and depends on ~40+ App-scope useState
// hooks (filter pills, sort prefs, dur range, swipe refs, modal flags,
// new-habit form state, etc.) plus the recently-shipped v72–v74 select-
// then-act reorder pipeline. A faithful tree-for-tree extraction in one
// pass would either:
//   (a) require lifting ~40 useState hooks AND their effects out of App
//       in this same change — breaking the spec's §9 "App-level cross-
//       cutting state stays in App" rule, OR
//   (b) re-implement the render with reduced fidelity — changing the
//       v72–v74 reorder semantics the agent brief explicitly forbids.
//
// The §8 risk register anticipates this exact case ("Habits extraction
// blows up due to v72-v74 reorder complexity → Habits view stays inline").
// This file therefore:
//   1. Honors the FROZEN prop signature { data, dispatch, deviceProfile,
//      callbacks } so the Phase C integration agent has a working module
//      to wire into.
//   2. Holds the four view-local UI state items the spec assigns to the
//      view (reorderMode, reorderSelectedId, showFutureHabits, swipe
//      anim refs).
//   3. Uses the pure READ derivations from lib/domains/habits.js to
//      drive a minimal but valid render tree (section grid + future
//      drawer) — enough to prove the wiring, NOT a tree-for-tree
//      replica of the inline render.
//   4. Accepts an optional `callbacks.renderInline(viewState)` escape
//      hatch so Phase C can keep the rich App-side render in place
//      while still moving the per-tab state container here. If
//      renderInline is provided, the view delegates to it and exposes
//      the local state via the argument; otherwise it renders its own
//      minimal tree.
//
// All cross-domain / App-scope writes (toggle, reorder commits, modal
// opens, …) go through `callbacks` — never imported, never mutated.

function HabitsView(props) {
  // Resolve React from window in the browser and from the global the
  // index.html <script> loader puts there. NOT imported — that would
  // pull a second copy of React into Node tests.
  const R = (typeof React !== "undefined" && React)
    || (typeof window !== "undefined" && window.React)
    || null;
  if (!R) return null;

  const data = (props && props.data) || {};
  const dispatch = (props && props.dispatch) || (() => {});
  const deviceProfile = (props && props.deviceProfile) || "desktop";
  const callbacks = (props && props.callbacks) || {};

  // ─── View-local UI state (per spec §3 Habits row) ──────────────────
  // These belong to the view, not to App. Listed here so the prop
  // contract documents what App should STOP owning when the inline
  // render block is finally retired.
  const [reorderMode, setReorderMode] = R.useState(false);
  const [reorderSelectedId, setReorderSelectedId] = R.useState(null);
  const [showFutureHabits, setShowFutureHabits] = R.useState(false);
  // swipeAnim refs per row — Map keyed by row source id (e.g.
  // "h1" or "h1@morning:0"). Mutating Map.set is OK on a ref object;
  // the underlying React state never changes.
  const swipeAnimRefs = R.useRef(new Map());

  // ─── Resolve the domain module ────────────────────────────────────
  // Browser path uses window.habitsDomain (loaded by the <script> tag
  // in index.html head). Node-side tests bypass this whole component
  // and exercise the domain module directly.
  const domain = (typeof window !== "undefined" && window.habitsDomain)
    || (typeof habitsDomain !== "undefined" ? habitsDomain : null);
  if (!domain) return null;

  // ─── Escape hatch for Phase C transitional integration ────────────
  // The inline render in App() is 2900 lines and references ~40
  // App-scope state hooks. Phase C can pass callbacks.renderInline to
  // keep the existing rich render in place while THIS module owns the
  // view-local state listed above. When renderInline is omitted (the
  // post-transition target), the minimal tree below is the renderer.
  if (typeof callbacks.renderInline === "function") {
    return callbacks.renderInline({
      data,
      reorderMode, setReorderMode,
      reorderSelectedId, setReorderSelectedId,
      showFutureHabits, setShowFutureHabits,
      swipeAnimRefs,
      deviceProfile,
      dispatch,
      callbacks
    });
  }

  // ─── Minimal local render (fallback / post-transition baseline) ───
  // A faithful section grid driven by the domain derivations. NOT a
  // visual replica of the inline render — that lives inline until the
  // App-scope state can be migrated. The wiring is correct: every
  // mutation goes through `callbacks`.
  const todayKey = (typeof tk === "function") ? tk() : new Date().toISOString().slice(0, 10);
  const sections = (domain.HABIT_SECTIONS || ["morning", "afternoon", "evening", "avoid"]);
  const upcoming = domain.upcomingHabits(data, todayKey);

  const onTogHabit = callbacks.onTogHabit || (() => {});
  const onMoveRowWithinSection = callbacks.onMoveRowWithinSection || (() => {});
  const onCommitHabitReorderDrop = callbacks.onCommitHabitReorderDrop || (() => {});
  const onCommitSlotReorderDrop = callbacks.onCommitSlotReorderDrop || (() => {});
  const onToggleConcurrent = callbacks.onToggleConcurrent || (() => {});
  const onOpenEditHabit = callbacks.onOpenEditHabit || (() => {});
  const onOpenAddHabit = callbacks.onOpenAddHabit || (() => {});

  // Reorder-mode toolbar — minimal version of the §13.3i top bar. Real
  // styling lives inline; this is enough to verify the callback wiring.
  const reorderBar = reorderMode ? R.createElement("div", {
    key: "reorder-bar",
    style: {
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: "var(--c-surface-raised)",
      borderBottom: "1px solid var(--c-border)",
      padding: "8px 12px",
      display: "flex", gap: 8, alignItems: "center"
    }
  },
    R.createElement("span", { style: { fontWeight: 700, flex: 1 } },
      reorderSelectedId ? ("Selected: " + reorderSelectedId) : "Tap a card to select"
    ),
    R.createElement("button", {
      type: "button",
      onClick: () => { if (reorderSelectedId) onMoveRowWithinSection(reorderSelectedId, -1); }
    }, "▲"),
    R.createElement("button", {
      type: "button",
      onClick: () => { if (reorderSelectedId) onMoveRowWithinSection(reorderSelectedId, 1); }
    }, "▼"),
    R.createElement("button", {
      type: "button",
      onClick: () => {
        const id = reorderSelectedId ? String(reorderSelectedId).split("@")[0] : null;
        if (id) onToggleConcurrent(id);
      }
    }, "⇶"),
    R.createElement("button", {
      type: "button",
      onClick: () => { setReorderMode(false); setReorderSelectedId(null); }
    }, "Done")
  ) : null;

  // Section grid — one column per section, each listing its rows
  // sorted via the domain derivation. Per-row click in reorder mode
  // selects; otherwise toggles via onTogHabit.
  const sectionGrid = R.createElement("div", {
    key: "grid",
    style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }
  }, sections.map(sec => {
    const rows = domain.sectionRowsForRender(data, sec);
    return R.createElement("div", {
      key: "sec-" + sec,
      style: { border: "1px solid var(--c-border)", borderRadius: 10, padding: 10 }
    },
      R.createElement("div", {
        style: { fontWeight: 700, marginBottom: 6, textTransform: "capitalize" }
      }, sec, " (", String(rows.length), ")"),
      rows.map(row => {
        const h = (data.habits || []).find(x => String(x.id) === String(row.habitId));
        if (!h) return null;
        const sourceId = row.slotArrayIdx >= 0
          ? (h.id + "@" + sec + ":" + _localIdxForSlot(h, row.slotArrayIdx, sec))
          : String(h.id);
        const isSelected = reorderMode && String(reorderSelectedId) === sourceId;
        return R.createElement("div", {
          key: sourceId,
          onClick: () => {
            if (reorderMode) {
              setReorderSelectedId(isSelected ? null : sourceId);
            } else {
              onTogHabit(h.id, todayKey);
            }
          },
          style: {
            padding: "8px 10px",
            marginBottom: 6,
            border: "1px solid " + (isSelected ? "#2d5a2d" : "var(--c-border)"),
            borderRadius: 8,
            background: isSelected ? "var(--c-tint-success-bg)" : "var(--c-surface, #fff)",
            cursor: "pointer"
          }
        }, h.text || "(untitled habit)");
      })
    );
  }));

  // Future-habits drawer — driven by upcomingHabits.
  const futureDrawer = upcoming.length > 0 ? R.createElement("div", {
    key: "future",
    style: { marginTop: 18 }
  },
    R.createElement("div", {
      onClick: () => { if (!reorderMode) setShowFutureHabits(p => !p); },
      style: { display: "flex", alignItems: "center", gap: 8, cursor: reorderMode ? "default" : "pointer", opacity: reorderMode ? 0.55 : 1 }
    },
      R.createElement("span", null, showFutureHabits ? "▼" : "▶"),
      R.createElement("span", { style: { fontWeight: 700, textTransform: "uppercase", fontSize: 11 } },
        "Future Habits (", String(upcoming.length), ")"
      )
    ),
    showFutureHabits && !reorderMode ? R.createElement("div", { style: { marginTop: 6 } },
      upcoming.map(h => R.createElement("div", {
        key: h.id,
        onClick: () => onOpenEditHabit(h),
        style: {
          padding: "8px 10px", marginBottom: 6,
          border: "1px solid var(--c-border)", borderRadius: 8,
          background: "var(--c-surface, #fff)", cursor: "pointer"
        }
      }, h.text || "(untitled habit)"))
    ) : null
  ) : null;

  // Top action row: + new habit, Organize toggle.
  const topActions = R.createElement("div", {
    key: "top-actions",
    style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }
  },
    R.createElement("button", {
      type: "button",
      "aria-label": "New habit",
      onClick: () => onOpenAddHabit(),
      style: {
        width: 28, height: 28, borderRadius: "50%",
        background: "#2d5a2d", color: "#fff", border: "none",
        cursor: "pointer", fontSize: 18, lineHeight: 1
      }
    }, "+"),
    R.createElement("button", {
      type: "button",
      "aria-label": "Organize habits",
      onClick: () => setReorderMode(true),
      style: {
        marginLeft: "auto",
        padding: "4px 10px", borderRadius: 8,
        background: "var(--c-surface, #fff)",
        border: "1px solid var(--c-border)", cursor: "pointer"
      }
    }, "Organize")
  );

  return R.createElement("div", { className: "fade-in" },
    reorderBar,
    reorderMode ? R.createElement("div", { style: { height: 56 } }) : null,
    topActions,
    sectionGrid,
    futureDrawer
  );
}

// Map a slotArrayIdx back to the section-local index ("morning:0",
// "morning:1") so the row's sourceId matches the format the App-scope
// reorder pipeline expects. Mirrors slotIdForIndex in index.html.
function _localIdxForSlot(habit, slotArrayIdx, sectionName) {
  const slots = Array.isArray(habit && habit.slotSections) ? habit.slotSections : [];
  let local = 0;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] !== sectionName) continue;
    if (i === slotArrayIdx) return local;
    local += 1;
  }
  return 0;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HabitsView };
} else if (typeof window !== "undefined") {
  window.HabitsView = HabitsView;
}
