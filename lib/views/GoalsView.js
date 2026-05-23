// lib/views/GoalsView.js — Phase B of v75 view extraction.
//
// Extracted from index.html (`tab === "goals" && …`, lines 19718–21344).
// React.createElement only — no JSX, no build step. Frozen prop signature:
//   { data, dispatch, deviceProfile, callbacks }
//
// View-local state (per the spec): expanded-goal id map + per-goal
// quick-add drafts. The bulky new-goal form state (3-step wizard,
// SMART fields, first-habit subform), inline edit-goal state, area-
// filter chips, sort-pref state, and every WRITE-side helper remain in
// App() and are injected via the `callbacks` bag. The shape of that bag
// is documented just below.
//
// callbacks contract (each function is required unless noted optional):
//   ── form / wizard ────────────────────────────────────────────────
//   onOpenAddGoal()                            open the new-goal form
//   isAddGoalOpen()                            bool — form expanded?
//   getGoalFormStep()  / setGoalFormStep(n)    0..3 wizard step
//   getGoalFormDraft()                         { nGoal, nGType, nGSmart,
//                                                nGFirstHabit, nHSec, nHDur,
//                                                nHImp, nHFreq, nHStart,
//                                                nHNotes, nHHasTarget, nHTarget,
//                                                nHTargetOp, nHUnitLabel,
//                                                nHIncrement }
//   setGoalFormField(name, value)              update a single draft field
//   getGoalAreaErr() / setGoalAreaErr(bool)    inline area-required flag
//   onSubmitAddGoal()                          commit the wizard (App addGoal)
//   onCancelAddGoal()                          close + reset
//
//   ── area / sort / filter ────────────────────────────────────────
//   isGoalPillsOpen() / setGoalPillsOpen()
//   getGoalTypeFilter() / setGoalTypeFilter(arr)
//   filterPressProps(val, selected, setSel, ref, isAll)   — App helper
//   renderSortButton(page)                      — App-provided
//   getGoalSortMode()                           — string
//   getCustomGoalTypes()                        — array
//   sortItems(items, mode, kind)                — App-provided
//   sortAreasForRender(areas)                   — App-provided (memoed)
//   getCollapsedGoalAreas() / setCollapsedGoalAreas(updater)
//
//   ── per-goal interactions ───────────────────────────────────────
//   onEditGoal(goal)                            sEGoal(goal)
//   onArchiveGoal(goal)                         setCompleteGoalModal(goal)
//   onDeleteGoal(goal)                          delGoal(goal.id)
//   onJournalGoal(goal)                         open journal modal
//   onReorderGoals(nextList)                    reordGoals(list) — drag handler
//   onMoveGoal(goalId, delta)                   moveItemByDelta("goals", id, ±1)
//   onAddGoalHabit(goal, draftText)             — pure quick-add (App keeps state)
//   onAddGoalTodo(goal, draftText)
//
//   ── per-goal sub-section state ──────────────────────────────────
//   isGoalSubOpen(goalId, subId)                — App helper
//   toggleGoalSub(goalId, subId)                — App helper
//
//   ── future-goals drawer ─────────────────────────────────────────
//   isFutureGoalsOpen() / setFutureGoalsOpen()
//
//   ── inline-edit state (when sEGId === goal.id) ──────────────────
//   getEditingGoalId()
//   getEditGoalDraft()                          { eGTxt, eGType, eGSmart }
//   setEditGoalField(name, value)
//   onSaveEditedGoal(goalId)                    svEGoal(id)
//   onCancelEditGoal()                          sEGId(null)
//
//   ── render helpers from App ─────────────────────────────────────
//   renderFreqPicker(nHFreq, sNHFreq, nHStart, sNHStart)
//   renderGoalHabitQuickAdd(goal)               — App-provided in v74 too
//   renderGoalTodoQuickAdd(goal)
//   renderLinkedUserContent(item, opts)
//   firstLinkedAudioFor(kind, id)
//   isDone(habit, dateKey)
//   isMissed(habit, dateKey)
//   freqRank(h) / freqLabel(h)
//
//   ── style + constant pass-through ───────────────────────────────
//   constants                                   { HT, SECTIONS, SF_FIELDS,
//                                                 DURS, IMP, IS, S, EI, AB }
//   selDate                                     current selected date key
//
//   ── lazy helpers ────────────────────────────────────────────────
//   Grip                                        SVG component
//   Glyph(emoji, opts)                          — App helper
//   SC                                          Save/Cancel button component
//
// The above bag is bigger than other views' because the Goals view has
// the most internal sub-features in this app (3-step wizard, inline
// edit, per-area collapse, per-card 3-subsection drawer, future-goals
// drawer). The frozen prop signature keeps integration mechanical even
// so — Phase C wires each callback to its existing inline implementation
// with no renaming or refactoring.
//
// Resolves goalsDomain at render time (window for browser, require for
// node). Tests don't mount the React tree, so the require-fallback is
// only needed when something else does `require("./GoalsView.js")`.

let _goalsDomain;
if (typeof require !== "undefined") {
  try { _goalsDomain = require("../domains/goals.js").goalsDomain; }
  catch (_) { _goalsDomain = null; }
}
function _resolveDomain() {
  if (_goalsDomain) return _goalsDomain;
  if (typeof window !== "undefined" && window.goalsDomain) return window.goalsDomain;
  return null;
}

function GoalsView(props) {
  const { data, deviceProfile, callbacks } = props || {};
  const R = (typeof React !== "undefined") ? React : (typeof window !== "undefined" ? window.React : null);
  if (!R) return null;
  const { useState } = R;
  const cb = callbacks || {};
  const C = cb.constants || {};
  const HT          = C.HT || [];
  const SF_FIELDS   = C.SF_FIELDS || [];
  const SECTIONS    = C.SECTIONS || [];
  const DURS        = C.DURS || [];
  const IMP         = C.IMP || [];
  const IS          = C.IS || {};
  const S           = C.S || {};
  const EI          = C.EI || {};
  const AB          = C.AB || {};
  const selDate     = cb.selDate;
  const goalsDom    = _resolveDomain();

  // ── view-local state per spec §3 Goals row ──────────────────────
  //   - expandedGoalCards: { [goalId]: boolean } — which cards have
  //     their 3-subsection panel revealed (SMART / Linked Habits /
  //     Linked To-Dos). Distinct from per-section open state which
  //     stays in App (isGoalSubOpen / toggleGoalSub).
  //   - quickAddDrafts: { [goalId]: { habitText, todoText } } — per-
  //     goal inline quick-add inputs. Reset on submit.
  const [expandedGoalCards, setExpandedGoalCards] = useState({});
  const [quickAddDrafts, setQuickAddDrafts] = useState({});

  const toggleExpanded = (goalId) => {
    setExpandedGoalCards(p => ({ ...p, [goalId]: !p[goalId] }));
  };
  const setQuickAddDraft = (goalId, field, value) => {
    setQuickAddDrafts(p => ({
      ...p,
      [goalId]: { ...(p[goalId] || {}), [field]: value }
    }));
  };

  // App-derived state pulled via callbacks. Each get* is a thin
  // accessor App-side so subscriptions still trigger renders through
  // the App parent (callbacks are stable references; the data prop
  // changing is what re-renders us).
  const expGForm     = cb.isAddGoalOpen ? cb.isAddGoalOpen() : false;
  const goalFormStep = cb.getGoalFormStep ? cb.getGoalFormStep() : 0;
  const goalAreaErr  = cb.getGoalAreaErr ? cb.getGoalAreaErr() : false;
  const draft        = cb.getGoalFormDraft ? cb.getGoalFormDraft() : {};
  const goalPillsOpen   = cb.isGoalPillsOpen ? cb.isGoalPillsOpen() : false;
  const goalTypeFilter  = cb.getGoalTypeFilter ? cb.getGoalTypeFilter() : [];
  const customGoalTypes = cb.getCustomGoalTypes ? cb.getCustomGoalTypes() : (data && data.customGoalTypes) || [];
  const collapsedGoalAreas = cb.getCollapsedGoalAreas ? cb.getCollapsedGoalAreas() : {};
  const editingGoalId  = cb.getEditingGoalId ? cb.getEditingGoalId() : null;
  const editGoalDraft  = cb.getEditGoalDraft ? cb.getEditGoalDraft() : {};
  const futureOpen     = cb.isFutureGoalsOpen ? cb.isFutureGoalsOpen() : false;
  const goalSortMode   = cb.getGoalSortMode ? cb.getGoalSortMode() : "default";
  const Grip = cb.Grip || (() => null);
  const Glyph = cb.Glyph || ((_e, _o) => null);
  const SC = cb.SC || (() => null);

  // ── Header: empty-state framing + add button + filter pill + sort
  const emptyState = (data.goals || []).length === 0 && R.createElement("div", {
    style: { padding: "32px 20px 20px", textAlign: "center", maxWidth: 480, margin: "0 auto" }
  },
    R.createElement("p", {
      style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: "var(--c-text-strong)", marginBottom: 12, lineHeight: 1.4 }
    }, "A goal is a future you. Where do you want to be in six months? Twelve?"),
    R.createElement("button", {
      onClick: () => { cb.setGoalFormStep && cb.setGoalFormStep(0); cb.onOpenAddGoal && cb.onOpenAddGoal(); },
      style: { padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, cursor: "pointer", marginTop: 8 }
    }, "Add your first goal")
  );

  const headerRow = R.createElement("div", {
    style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 6 }
  },
    R.createElement("button", {
      onClick: () => {
        if (cb.onOpenAddGoal) cb.onOpenAddGoal();
      },
      "aria-label": "New goal",
      title: "New goal",
      style: {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: "50%",
        border: "none",
        background: expGForm ? "#234a23" : "#2d5a2d",
        color: "#fff", cursor: "pointer", flexShrink: 0,
        WebkitTapHighlightColor: "transparent"
      }
    }, R.createElement("span", {
      style: {
        color: "#fff", fontSize: 18, lineHeight: 1, fontWeight: 300,
        transform: expGForm ? "rotate(45deg)" : "none",
        transition: "transform .18s ease", display: "inline-block"
      }
    }, "+")),
    (() => {
      const active = goalTypeFilter.length > 0;
      const expanded = goalPillsOpen || active;
      const count = goalTypeFilter.length;
      return R.createElement("button", {
        onClick: () => {
          if (active) { cb.setGoalTypeFilter && cb.setGoalTypeFilter([]); cb.setGoalPillsOpen && cb.setGoalPillsOpen(true); return; }
          cb.setGoalPillsOpen && cb.setGoalPillsOpen(!goalPillsOpen);
        },
        title: "All Goals — tap to expand goal-type filters",
        style: {
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 20,
          border: `1px solid ${active ? "#fde68a" : expanded ? "#c6dfc6" : "var(--c-border)"}`,
          background: active ? "#fffbeb" : expanded ? "var(--c-tint-success-bg)" : "#fff",
          color: active ? "#d97706" : expanded ? "#2d5a2d" : "#6b7280",
          fontSize: 11, fontWeight: expanded || active ? 700 : 500,
          cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          WebkitTapHighlightColor: "transparent", userSelect: "none"
        }
      },
        "All Goals",
        count > 0 && R.createElement("span", {
          style: { background: "#d97706", color: "#fff", borderRadius: 9, padding: "0 5px", fontSize: 9, fontWeight: 700, minWidth: 12, textAlign: "center" }
        }, count),
        R.createElement("span", {
          style: { fontSize: 8, opacity: 0.7, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .18s ease", display: "inline-block", marginLeft: 2 }
        }, "▼")
      );
    })(),
    cb.renderSortButton ? cb.renderSortButton("goals") : null
  );

  // ── Pills row (goal-type filters) ──
  const pillsRow = (goalPillsOpen || goalTypeFilter.length > 0) && R.createElement("div", {
    className: "fade-in",
    style: { display: "flex", flexWrap: "wrap", rowGap: 6, columnGap: 5, marginBottom: 8 }
  }, (() => {
    const allHT = [...HT, ...(customGoalTypes || [])];
    const filters = [{ val: "all", label: "All", color: "#2d5a2d", border: "#c6dfc6", bg: "var(--c-tint-success-bg)" }, ...allHT.map(t => ({ val: t.value, label: t.value, color: t.color, border: t.border, bg: t.bg }))];
    return filters.map(f => {
      const isAll = f.val === "all";
      const on = isAll ? goalTypeFilter.length === 0 : goalTypeFilter.includes(f.val);
      const press = cb.filterPressProps ? cb.filterPressProps(f.val, goalTypeFilter, cb.setGoalTypeFilter, null, isAll) : { onClick: () => {} };
      return R.createElement("button", Object.assign({
        key: f.val,
        title: isAll ? "Show all" : "Tap to show only " + f.label + " — hold to add/remove",
        style: { padding: "4px 10px", borderRadius: 20, border: `1px solid ${on ? f.border : "var(--c-border)"}`, background: on ? f.bg : "#fff", color: on ? f.color : "#9ca3af", fontSize: 10, fontWeight: on ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", WebkitTapHighlightColor: "transparent", userSelect: "none", flexShrink: 0 }
      }, press), f.label);
    });
  })());

  // ── Add-Goal wizard. State for every field lives in App; we just
  // render a controlled form against the draft object. ──
  const wizard = expGForm && R.createElement("div", {
    className: "fade-in",
    "data-tour-id": "goal-form",
    style: {
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "14px", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,.04)"
    }
  },
    R.createElement("div", {
      style: { display: "flex", gap: 4, justifyContent: "center", marginBottom: 10 }
    }, [0, 1, 2].map(i => R.createElement("div", {
      key: "gs" + i,
      style: {
        width: i === goalFormStep ? 22 : 8,
        height: 5, borderRadius: 3,
        background: i <= goalFormStep ? "#2d5a2d" : "var(--c-border)",
        transition: "all .18s ease"
      }
    }))),
    // STEP 0 — name
    R.createElement("div", { style: { display: goalFormStep === 0 ? "block" : "none" } },
      R.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2d5a2d", textTransform: "uppercase", marginBottom: 6 } }, "Step 1 of 3 — Name your goal"),
      R.createElement("input", {
        value: draft.nGoal || "",
        onChange: e => cb.setGoalFormField && cb.setGoalFormField("nGoal", e.target.value),
        onKeyDown: e => { if (e.key === "Enter") e.preventDefault(); },
        placeholder: "e.g. Run a half-marathon",
        "data-tour-id": "goal-name",
        autoFocus: goalFormStep === 0,
        style: Object.assign({}, IS, { width: "100%", marginBottom: 4 })
      }),
      R.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginBottom: 4 } }, "Keep it concrete and short.")
    ),
    // STEP 1 — Area of Life
    R.createElement("div", { style: { display: goalFormStep === 1 ? "block" : "none" } },
      R.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2d5a2d", textTransform: "uppercase", marginBottom: 6 } }, "Step 2 of 3 — Pick an Area of Life"),
      R.createElement("select", {
        value: draft.nGType || "",
        onChange: e => { cb.setGoalFormField && cb.setGoalFormField("nGType", e.target.value); if (e.target.value && cb.setGoalAreaErr) cb.setGoalAreaErr(false); },
        "data-tour-id": "goal-area",
        autoFocus: goalFormStep === 1,
        style: Object.assign({}, S, {
          width: "100%",
          marginBottom: goalAreaErr ? 2 : 6,
          color: [...HT, ...(customGoalTypes || [])].find(t => t.value === draft.nGType)?.color || "#9ca3af",
          border: goalAreaErr ? "1px solid #dc2626" : (S.border || "1px solid #e5e7eb"),
          background: goalAreaErr ? "#fef2f2" : (S.background || "#fff")
        })
      },
        R.createElement("option", { value: "" }, "🏷 Area of Life"),
        [...HT, ...(customGoalTypes || [])].map(t => R.createElement("option", { key: t.value, value: t.value }, t.value))
      ),
      goalAreaErr && R.createElement("div", { style: { fontSize: 11, color: "#dc2626", marginBottom: 6 } }, "Pick an area of life to continue.")
    ),
    // STEP 2 — SMART
    R.createElement("div", { style: { display: goalFormStep === 2 ? "block" : "none" } },
      R.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2d5a2d", textTransform: "uppercase", marginBottom: 6 } }, "Step 3 of 4 — SMART details (optional)"),
      R.createElement("div", { "data-tour-id": "goal-smart", style: { fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 8 } }, "Fill these in now or come back later."),
      R.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 } },
        SF_FIELDS.map(f => {
          const smart = draft.nGSmart || {};
          if (f.key === "timebound") {
            return R.createElement("div", { key: f.key },
              R.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 2 } }, f.label),
              R.createElement("input", {
                type: "date", className: "sf",
                value: (() => { const v = smart.timebound || ""; const m = /^(\d{4}-\d{2}-\d{2})/.exec(v); return m ? m[1] : ""; })(),
                onChange: e => cb.setGoalFormField && cb.setGoalFormField("nGSmart", Object.assign({}, smart, { timebound: e.target.value })),
                placeholder: "Target date",
                style: { width: "100%" }
              })
            );
          }
          return R.createElement("div", { key: f.key },
            R.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 2 } }, f.label),
            R.createElement("textarea", {
              className: "sf", rows: 2,
              value: smart[f.key] || "",
              onChange: e => cb.setGoalFormField && cb.setGoalFormField("nGSmart", Object.assign({}, smart, { [f.key]: e.target.value })),
              placeholder: f.ph
            })
          );
        })
      )
    ),
    // STEP 3 — First habit. Delegated to App since the habit subform is
    // identical to the standalone Add-Habit flow (renderFreqPicker, etc.).
    R.createElement("div", { style: { display: goalFormStep === 3 ? "block" : "none" } },
      R.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2d5a2d", textTransform: "uppercase", marginBottom: 6 } }, "Step 4 of 4 — First habit (required)"),
      R.createElement("div", { style: { fontSize: 10, color: "#6b7280", marginBottom: 8, lineHeight: 1.5 } }, "Every goal needs at least one habit driving it. Set its details below. Target, units, and +/tap can be added later by tapping the habit card."),
      R.createElement("input", {
        type: "text", className: "sf",
        value: draft.nGFirstHabit || "",
        onChange: e => cb.setGoalFormField && cb.setGoalFormField("nGFirstHabit", e.target.value),
        placeholder: "e.g. Run 30 min, Meditate, Read 20 pages",
        autoFocus: goalFormStep === 3,
        style: Object.assign({}, IS, { width: "100%", marginBottom: 8 })
      }),
      // Section + Duration row, Importance, Yes/No vs Target, and the
      // frequency picker all live behind renderFreqPicker / App-owned
      // setters. We render them inline so the form looks identical.
      R.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8 } },
        R.createElement("select", {
          value: draft.nHSec || "morning",
          onChange: e => cb.setGoalFormField && cb.setGoalFormField("nHSec", e.target.value),
          style: Object.assign({}, S, { flex: 1, color: SECTIONS.find(s => s.value === draft.nHSec)?.color || "var(--c-text-soft)" })
        },
          R.createElement("option", { value: "morning" }, "🌅 Time of Day"),
          SECTIONS.map(s => R.createElement("option", { key: s.value, value: s.value }, s.icon, " ", s.label))
        ),
        R.createElement("select", {
          value: draft.nHDur || "",
          onChange: e => cb.setGoalFormField && cb.setGoalFormField("nHDur", e.target.value),
          style: Object.assign({}, S, { flex: 1 })
        },
          R.createElement("option", { value: "" }, "⏱ Duration"),
          DURS.map(d => R.createElement("option", { key: d.value, value: d.value }, d.label))
        )
      ),
      R.createElement("select", {
        value: draft.nHImp || "Important",
        onChange: e => cb.setGoalFormField && cb.setGoalFormField("nHImp", e.target.value),
        style: Object.assign({}, S, { width: "100%", marginBottom: 8, color: IMP.find(i => i.value === draft.nHImp)?.color || "var(--c-text-soft)" })
      },
        R.createElement("option", { value: "Important" }, "★ Importance"),
        IMP.map(i => R.createElement("option", { key: i.value, value: i.value }, i.value))
      ),
      cb.renderFreqPicker
        ? cb.renderFreqPicker(
            draft.nHFreq,
            (v) => cb.setGoalFormField && cb.setGoalFormField("nHFreq", v),
            draft.nHStart,
            (v) => cb.setGoalFormField && cb.setGoalFormField("nHStart", v)
          )
        : null,
      R.createElement("textarea", {
        value: draft.nHNotes || "",
        onChange: e => cb.setGoalFormField && cb.setGoalFormField("nHNotes", e.target.value),
        placeholder: "Sub-components / notes — e.g. Sit-ups \xB7 Planks \xB7 Leg raises",
        rows: 2,
        style: Object.assign({}, IS, { width: "100%", marginBottom: 4, resize: "none", lineHeight: 1.5 })
      })
    ),
    // Nav row
    R.createElement("div", {
      style: { display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }
    },
      R.createElement("button", {
        onClick: () => cb.onCancelAddGoal && cb.onCancelAddGoal(),
        style: Object.assign({}, AB, { background: "var(--c-surface-muted)", color: "#6b7280", padding: "8px 14px", fontSize: 12 })
      }, "Cancel"),
      R.createElement("div", { style: { display: "flex", gap: 8 } },
        goalFormStep > 0 && R.createElement("button", {
          onClick: () => cb.setGoalFormStep && cb.setGoalFormStep(Math.max(0, goalFormStep - 1)),
          style: Object.assign({}, AB, { background: "var(--c-surface-muted)", color: "var(--c-text-soft)", padding: "8px 14px", fontSize: 12 })
        }, "Back"),
        goalFormStep < 3 && R.createElement("button", {
          "data-tour-id": "goal-next",
          onClick: () => {
            if (goalFormStep === 0) {
              if (!(draft.nGoal || "").trim()) return;
              cb.setGoalFormStep && cb.setGoalFormStep(1);
            } else if (goalFormStep === 1) {
              if (!draft.nGType) { cb.setGoalAreaErr && cb.setGoalAreaErr(true); return; }
              cb.setGoalFormStep && cb.setGoalFormStep(2);
            } else if (goalFormStep === 2) {
              cb.setGoalFormStep && cb.setGoalFormStep(3);
            }
          },
          disabled: goalFormStep === 0 ? !(draft.nGoal || "").trim() : false,
          style: Object.assign({}, AB, {
            padding: "8px 18px", fontSize: 12,
            background: (goalFormStep === 0 && !(draft.nGoal || "").trim()) ? "#9ca3af" : "#2d5a2d",
            cursor: (goalFormStep === 0 && !(draft.nGoal || "").trim()) ? "default" : "pointer"
          })
        }, "Next"),
        goalFormStep === 3 && R.createElement("button", {
          "data-tour-id": "goal-save",
          onClick: () => cb.onSubmitAddGoal && cb.onSubmitAddGoal(),
          disabled: !(draft.nGFirstHabit || "").trim(),
          style: Object.assign({}, AB, {
            padding: "8px 18px", fontSize: 12,
            background: (draft.nGFirstHabit || "").trim() ? "#2d5a2d" : "#9ca3af",
            cursor: (draft.nGFirstHabit || "").trim() ? "pointer" : "default"
          })
        }, "Add Goal")
      )
    )
  );

  // ── Helper: render a single goal card. Pulled out so the per-area
  // groups + future drawer can share it without duplicating the
  // 900-line tree. ──
  const renderGoalCard = (goal) => {
    const isE = editingGoalId === goal.id;
    const isExp = !!expandedGoalCards[goal.id];
    const gt = HT.find(t => t.value === goal.type);
    const smartInfo = goalsDom ? goalsDom.smartCompleteness(goal) : { filled: 0, total: 5, hasAny: false };
    const smartCount = smartInfo.filled;
    const cardIncomplete = goalsDom ? goalsDom.isGoalCardIncomplete(goal) : false;

    const linkedHabits = goalsDom
      ? goalsDom.linkedHabitsFor(data, goal.id)
      : ((data.habits || []).filter(h => !h.parked && (h.goalId === goal.id || (Array.isArray(h.goalIds) && h.goalIds.includes(goal.id)))));
    const linkedDone = linkedHabits.filter(h => cb.isDone && cb.isDone(h, selDate)).length;
    const linkedTotal = linkedHabits.length;

    const momentum = (() => {
      if (!linkedTotal) return null;
      let total = 0, days = 0;
      for (let i = 0; i < 7; i++) {
        const d2 = new Date(); d2.setDate(d2.getDate() - i);
        // Use ISO local date — App injects isDone so we don't import dk here.
        const k = (function (d) { const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0"); return y + "-" + m + "-" + day; })(d2);
        const done = linkedHabits.filter(h => cb.isDone && cb.isDone(h, k)).length;
        total += done / linkedTotal; days++;
      }
      const avg = days ? total / days : 0;
      return avg >= 0.65 ? "up" : avg <= 0.25 ? "down" : "flat";
    })();

    const cardChildren = [];
    // Desktop reorder buttons
    if ((deviceProfile === "desktop" || deviceProfile === "desktop-wide") && !isE) {
      cardChildren.push(R.createElement("div", {
        key: "reorder",
        style: { display: "flex", flexDirection: "column", gap: 1, marginRight: 2, flexShrink: 0, alignSelf: "center" }
      },
        R.createElement("button", {
          onClick: (e) => { e.stopPropagation(); cb.onMoveGoal && cb.onMoveGoal(goal.id, -1); },
          onDoubleClick: (e) => e.stopPropagation(),
          title: "Move up", "aria-label": "Move goal up",
          style: { background: "transparent", border: "none", color: "var(--c-text-faint)", cursor: "pointer", padding: "0 4px", fontSize: 10, lineHeight: 1 }
        }, "▲"),
        R.createElement("button", {
          onClick: (e) => { e.stopPropagation(); cb.onMoveGoal && cb.onMoveGoal(goal.id, 1); },
          onDoubleClick: (e) => e.stopPropagation(),
          title: "Move down", "aria-label": "Move goal down",
          style: { background: "transparent", border: "none", color: "var(--c-text-faint)", cursor: "pointer", padding: "0 4px", fontSize: 10, lineHeight: 1 }
        }, "▼")
      ));
    }

    // Donut split per linked habit (segmented progress ring)
    const ringColor = gt?.color || "#2d5a2d";
    const Cn = 2 * Math.PI * 4;
    const n = linkedHabits.length;
    const gap = n > 1 ? 0.5 : 0;
    const segLen = n > 0 ? Math.max(0.001, (Cn / n) - gap) : 0;
    cardChildren.push(R.createElement("svg", {
      key: "donut",
      width: 28, height: 28, viewBox: "0 0 12 12", style: { flexShrink: 0 }
    },
      R.createElement("circle", { cx: 6, cy: 6, r: 4, fill: "none", stroke: "var(--c-border)", strokeWidth: 2 }),
      ...linkedHabits.map((h, i) => {
        const done = cb.isDone && cb.isDone(h, selDate);
        const start = i * (Cn / n) + gap / 2;
        return R.createElement("circle", {
          key: "seg-" + h.id,
          cx: 6, cy: 6, r: 4, fill: "none",
          stroke: done ? ringColor : "transparent",
          strokeWidth: 2, strokeLinecap: "butt",
          strokeDasharray: segLen + " " + (Cn - segLen),
          strokeDashoffset: -start,
          transform: "rotate(-90 6 6)"
        });
      }),
      ...(n >= 1 ? linkedHabits.map((_, i) => {
        const angleDeg = (i * 360 / n) - 90;
        const angle = angleDeg * Math.PI / 180;
        const cosA = Math.cos(angle); const sinA = Math.sin(angle);
        return R.createElement("line", {
          key: "tick-" + i,
          x1: 6 + 3 * cosA, y1: 6 + 3 * sinA,
          x2: 6 + 5 * cosA, y2: 6 + 5 * sinA,
          stroke: ringColor, strokeWidth: 0.7, strokeLinecap: "butt"
        });
      }) : [])
    ));

    // Title + edit-mode body
    if (isE) {
      cardChildren.push(R.createElement("div", {
        key: "edit-body", style: { flex: 1 }
      },
        R.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 } },
          R.createElement("input", {
            value: editGoalDraft.eGTxt || "",
            onChange: e => cb.setEditGoalField && cb.setEditGoalField("eGTxt", e.target.value),
            autoFocus: true,
            style: Object.assign({}, EI, { flex: 1, minWidth: 120 })
          }),
          R.createElement("select", {
            value: editGoalDraft.eGType || "",
            onChange: e => { cb.setEditGoalField && cb.setEditGoalField("eGType", e.target.value); if (e.target.value && cb.setGoalAreaErr) cb.setGoalAreaErr(false); },
            style: Object.assign({}, S, {
              padding: "5px 8px", fontSize: 11,
              border: goalAreaErr ? "1px solid #dc2626" : (S.border || "1px solid #e5e7eb"),
              background: goalAreaErr ? "#fef2f2" : (S.background || "#fff")
            })
          },
            R.createElement("option", { value: "" }, "🏷"),
            HT.map(t => R.createElement("option", { key: t.value, value: t.value }, t.value))
          )
        ),
        goalAreaErr && R.createElement("div", { style: { fontSize: 11, color: "#dc2626", marginBottom: 6 } }, "Pick an area of life to save."),
        R.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 } },
          SF_FIELDS.map(f => {
            const sm = editGoalDraft.eGSmart || {};
            if (f.key === "timebound") {
              return R.createElement("div", { key: f.key },
                R.createElement("div", { style: { fontSize: 9, fontWeight: 600, color: "#2d5a2d", marginBottom: 3, textTransform: "uppercase" } }, f.label),
                R.createElement("input", {
                  type: "date", className: "sf",
                  value: (() => { const v = sm.timebound || ""; const m = /^(\d{4}-\d{2}-\d{2})/.exec(v); return m ? m[1] : ""; })(),
                  onChange: e => cb.setEditGoalField && cb.setEditGoalField("eGSmart", Object.assign({}, sm, { timebound: e.target.value })),
                  placeholder: "Target date",
                  style: { width: "100%" }
                })
              );
            }
            return R.createElement("div", { key: f.key },
              R.createElement("div", { style: { fontSize: 9, fontWeight: 600, color: "#2d5a2d", marginBottom: 3, textTransform: "uppercase" } }, f.label),
              R.createElement("textarea", {
                className: "sf", rows: 3,
                value: sm[f.key] || "",
                onChange: e => cb.setEditGoalField && cb.setEditGoalField("eGSmart", Object.assign({}, sm, { [f.key]: e.target.value })),
                placeholder: f.ph
              })
            );
          })
        ),
        R.createElement(SC, {
          onSave: () => cb.onSaveEditedGoal && cb.onSaveEditedGoal(goal.id),
          onCancel: () => cb.onCancelEditGoal && cb.onCancelEditGoal()
        }),
        R.createElement("div", { style: { display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" } },
          R.createElement("button", {
            type: "button",
            onClick: () => cb.onJournalGoal && cb.onJournalGoal(goal),
            style: { flex: 1, minWidth: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid #bae6fd", background: "#eff6ff", color: "#0891b2", fontSize: 11, fontWeight: 700, cursor: "pointer" }
          }, "📝 Journal"),
          R.createElement("button", {
            type: "button",
            onClick: () => cb.onArchiveGoal && cb.onArchiveGoal(goal),
            style: { flex: 1, minWidth: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid #86efac", background: "#f0fdf4", color: "#15803d", fontSize: 11, fontWeight: 700, cursor: "pointer" }
          }, "📦 Archive"),
          R.createElement("button", {
            type: "button",
            onClick: () => cb.onDeleteGoal && cb.onDeleteGoal(goal),
            style: { flex: 1, minWidth: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--c-tint-danger-border)", background: "var(--c-tint-danger-bg)", color: "var(--c-tint-danger-fg)", fontSize: 11, fontWeight: 700, cursor: "pointer" }
          }, "🗑 Delete")
        )
      ));
    } else {
      // Read-mode title row
      cardChildren.push(R.createElement(R.Fragment, { key: "title-row" },
        R.createElement("div", { style: { flex: 1, minWidth: 0 } },
          R.createElement("div", {
            style: { fontSize: 13, color: "var(--c-text)", fontWeight: 500, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.35 }
          },
            cardIncomplete && R.createElement("span", {
              title: "Incomplete — open the goal to fill in area, SMART details, or target date.",
              style: { marginRight: 4, display: "inline-flex", alignItems: "center", verticalAlign: "middle" }
            }, Glyph("🚨", { size: 12, color: "#b91c1c" })),
            (() => {
              const audio = cb.firstLinkedAudioFor && cb.firstLinkedAudioFor("goal", goal.id);
              if (!audio) return null;
              return R.createElement("button", {
                type: "button",
                "aria-label": "Play linked audio",
                title: "Play " + (audio.title || audio.fileName || "linked audio"),
                onClick: (e) => { e.stopPropagation(); cb.onPlayLinkedAudio && cb.onPlayLinkedAudio("goal", goal.id, audio); },
                onPointerDown: (e) => e.stopPropagation(),
                style: { marginRight: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, paddingLeft: 2, verticalAlign: "middle", flexShrink: 0 }
              }, "▶");
            })(),
            goal.text
          )
        ),
        // Days-to-deadline chip
        (() => {
          const raw = (goal.smart && goal.smart.timebound) || "";
          const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
          if (!m) return null;
          const target = new Date(+m[1], +m[2] - 1, +m[3]); target.setHours(0, 0, 0, 0);
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const days = Math.round((target - today) / 86400000);
          const nAbs = Math.abs(days);
          let color, bg;
          if (days < 0) { color = "#b91c1c"; bg = "#fee2e2"; }
          else if (days <= 7) { color = "#b45309"; bg = "#fef3c7"; }
          else { color = "#4b5563"; bg = "var(--c-surface-muted)"; }
          const yy = m[1].slice(2);
          const dateLabel = (+m[2]) + "/" + (+m[3]) + "/" + yy;
          const dayLabel = days < 0 ? "T+" + nAbs : "T-" + nAbs;
          return R.createElement("span", {
            style: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: color, background: bg, border: "1px solid " + (bg === "var(--c-surface-muted)" ? "var(--c-border)" : "transparent"), borderRadius: 8, padding: "3px 6px", boxSizing: "border-box", width: 64, marginLeft: 6, lineHeight: 1.15, whiteSpace: "nowrap" }
          },
            R.createElement("span", { style: { fontSize: 12, fontWeight: 700, letterSpacing: 0.2 } }, dayLabel),
            R.createElement("span", { style: { fontSize: 9, fontWeight: 500, fontStyle: "italic", opacity: 0.8 } }, dateLabel)
          );
        })(),
        // Trending arrow slot
        R.createElement("span", {
          style: { fontSize: 14, flexShrink: 0, width: 16, textAlign: "center", color: momentum === "up" ? "#16a34a" : momentum === "down" ? "#dc2626" : momentum === "flat" ? "#d97706" : "transparent", lineHeight: 1, pointerEvents: "none", marginLeft: 4 }
        }, momentum === "up" ? "↑" : momentum === "down" ? "↓" : momentum === "flat" ? "→" : ""),
        // Area-of-life rotated label on the right edge
        gt && R.createElement("div", {
          style: { position: "absolute", right: 0, top: 0, bottom: 0, width: "22px", background: gt.color, display: "flex", alignItems: "center", justifyContent: "center", borderTopRightRadius: 9, borderBottomRightRadius: 9 }
        }, R.createElement("span", {
          style: { fontSize: 7, fontWeight: 700, color: "#fff", textTransform: "uppercase", transform: "rotate(90deg)", whiteSpace: "nowrap", userSelect: "none" }
        }, gt.value))
      ));
    }

    const headerSection = R.createElement("div", Object.assign({
      className: "hrow"
    }, { style: { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", paddingRight: gt ? "34px" : "14px", position: "relative" } }), cardChildren);

    // Progress bar (under the header)
    const progressBar = linkedTotal > 0 && R.createElement("div", {
      style: { height: 3, background: "var(--c-surface-muted)" }
    }, R.createElement("div", {
      style: {
        height: "100%",
        width: `${Math.round(linkedDone / linkedTotal * 100)}%`,
        background: gt?.color || "#2d5a2d",
        transition: "width 0.4s ease",
        minWidth: linkedDone > 0 ? 4 : 0
      }
    }));

    // Expanded panel (SMART + Linked Habits + Linked To-Dos)
    const smOpen = cb.isGoalSubOpen ? cb.isGoalSubOpen(goal.id, "smart") : false;
    const habitsOpen = cb.isGoalSubOpen ? cb.isGoalSubOpen(goal.id, "habits") : false;
    const todosOpen = cb.isGoalSubOpen ? cb.isGoalSubOpen(goal.id, "todos") : false;

    const expandedPanel = isExp && !isE && R.createElement("div", {
      style: { display: "flex", flexDirection: "column-reverse" }
    },
      // SMART subsection
      R.createElement("div", {
        style: { borderTop: "1px solid #f3f4f6", padding: "10px 14px", background: "var(--c-surface-raised)" }
      },
        R.createElement("div", {
          onClick: (e) => { e.stopPropagation(); cb.toggleGoalSub && cb.toggleGoalSub(goal.id, "smart"); },
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", padding: smOpen ? "0 0 8px 0" : "0" }
        },
          R.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: smartCount < 5 ? "#b91c1c" : "#6b7280", textTransform: "uppercase" } }, "S.M.A.R.T. Framework"),
          R.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            R.createElement("span", { style: { fontSize: 10, color: smartCount < 5 ? "#b91c1c" : "#9ca3af", fontWeight: 500 } }, smartCount + "/5"),
            R.createElement("span", { style: { fontSize: 10, color: smartCount < 5 ? "#b91c1c" : "#9ca3af", transform: smOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", display: "inline-block" } }, "▸")
          )
        ),
        smOpen && R.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 7 } },
          SF_FIELDS.map(f => {
            let shown = null;
            if (f.key === "measurable") {
              const amt = goal.smart?.measurable || "";
              const unit = goal.smart?.measurableUnit || "";
              if (amt || unit) shown = [amt, unit].filter(Boolean).join(" ");
            } else if (f.key === "timebound") {
              const raw = goal.smart?.timebound || "";
              const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
              if (m) {
                const dt = new Date(+m[1], +m[2] - 1, +m[3]);
                shown = dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
              } else if (raw) shown = raw;
            } else if (goal.smart?.[f.key]) {
              shown = goal.smart[f.key];
            }
            if (!shown) return null;
            return R.createElement("div", { key: f.key },
              R.createElement("div", { style: { fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 2 } }, f.label),
              R.createElement("div", { style: { fontSize: 13, fontWeight: 500, color: "var(--c-text-strong)", lineHeight: 1.6, paddingLeft: 8 } }, shown)
            );
          })
        )
      ),
      // Linked Habits + To-Dos
      (() => {
        const linked = linkedHabits.slice().sort((a, b) => (cb.freqRank ? cb.freqRank(a) - cb.freqRank(b) : 0));
        const linkedTodos = goalsDom ? goalsDom.linkedTodosFor(data, goal.id) : ((data.todos || []).filter(t => String(t.goalId) === String(goal.id)));
        return R.createElement(R.Fragment, null,
          R.createElement("div", {
            onPointerDown: e => e.stopPropagation(), onPointerUp: e => e.stopPropagation(),
            style: { borderTop: "1px solid #f3f4f6", padding: "10px 14px", background: "var(--c-surface-raised)" }
          },
            R.createElement("div", {
              onClick: (e) => { e.stopPropagation(); cb.toggleGoalSub && cb.toggleGoalSub(goal.id, "habits"); },
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", marginBottom: habitsOpen ? 6 : 8 }
            },
              (() => {
                const habitsDone = linked.filter(h => cb.isDone && cb.isDone(h, selDate)).length;
                const habitsIncomplete = linked.length > 0 && habitsDone < linked.length;
                return R.createElement(R.Fragment, null,
                  R.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: habitsIncomplete ? "#b91c1c" : "#6b7280", textTransform: "uppercase" } }, "Linked Habits"),
                  R.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    R.createElement("span", { style: { fontSize: 10, color: habitsIncomplete ? "#b91c1c" : "#9ca3af", fontWeight: 500 } }, habitsDone + "/" + linked.length),
                    R.createElement("span", { style: { fontSize: 10, color: habitsIncomplete ? "#b91c1c" : "#9ca3af", transform: habitsOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", display: "inline-block" } }, "▸")
                  )
                );
              })()
            ),
            habitsOpen && R.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 } },
              linked.length > 0 && R.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5 } },
                linked.map(h => {
                  const d = cb.isDone && cb.isDone(h, selDate);
                  const m = cb.isMissed && cb.isMissed(h, selDate);
                  return R.createElement("div", {
                    key: h.id,
                    style: { display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, padding: "7px 10px", border: `1px solid ${d ? "#86efac" : m ? "#fca5a5" : "var(--c-border)"}` }
                  },
                    R.createElement("div", {
                      style: { width: 18, height: 18, borderRadius: "50%", background: d ? "#22c55e" : m ? "#ef4444" : "var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }
                    },
                      d && R.createElement("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "none" }, R.createElement("path", { d: "M1.5 5L4 7.5L8.5 2.5", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round" })),
                      m && R.createElement("svg", { width: "8", height: "8", viewBox: "0 0 8 8", fill: "none" }, R.createElement("path", { d: "M1 1L7 7M7 1L1 7", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round" }))
                    ),
                    R.createElement("span", { style: { fontSize: 12, color: d ? "#15803d" : m ? "#991b1b" : "var(--c-text-soft)", fontWeight: 500, textDecoration: d || m ? "line-through" : "none" } }, h.text),
                    R.createElement("span", { style: { marginLeft: "auto", fontSize: 9, color: "#9ca3af" } }, SECTIONS.find(s => s.value === h.section)?.icon || ""),
                    R.createElement("span", { style: { fontSize: 9, color: "#9ca3af", marginLeft: 4 } }, cb.freqLabel ? cb.freqLabel(h) : "")
                  );
                })
              ),
              cb.renderGoalHabitQuickAdd ? cb.renderGoalHabitQuickAdd(goal) : null
            )
          ),
          R.createElement("div", {
            onPointerDown: e => e.stopPropagation(), onPointerUp: e => e.stopPropagation(),
            style: { borderTop: "1px solid #f3f4f6", padding: "10px 14px", background: "var(--c-surface-raised)" }
          },
            R.createElement("div", {
              onClick: (e) => { e.stopPropagation(); cb.toggleGoalSub && cb.toggleGoalSub(goal.id, "todos"); },
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", marginBottom: todosOpen ? 6 : 0 }
            },
              (() => {
                const todosPending = linkedTodos.length;
                const todosIncomplete = todosPending > 0;
                return R.createElement(R.Fragment, null,
                  R.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: todosIncomplete ? "#b91c1c" : "#6b7280", textTransform: "uppercase" } }, "Linked To-Dos"),
                  R.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    R.createElement("span", { style: { fontSize: 10, color: todosIncomplete ? "#b91c1c" : "#9ca3af", fontWeight: 500 } }, "0/" + todosPending),
                    R.createElement("span", { style: { fontSize: 10, color: todosIncomplete ? "#b91c1c" : "#9ca3af", transform: todosOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", display: "inline-block" } }, "▸")
                  )
                );
              })()
            ),
            todosOpen && R.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 0 } },
              linkedTodos.length > 0 && R.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5 } },
                linkedTodos.map(t => R.createElement("div", {
                  key: t.id,
                  style: { display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, padding: "7px 10px", border: "1px solid #e5e7eb" }
                },
                  R.createElement("div", {
                    onClick: () => cb.onCheckTodo && cb.onCheckTodo(t.id),
                    title: "Mark done",
                    style: { width: 16, height: 16, borderRadius: 4, border: "1.5px solid #d1d5db", background: "#fff", cursor: "pointer", flexShrink: 0 }
                  }),
                  R.createElement("span", { style: { fontSize: 12, color: "var(--c-text-soft)", fontWeight: 500, flex: 1 } }, t.text),
                  t.dueDate && R.createElement("span", { style: { fontSize: 10, color: "#6b7280" } }, t.dueDate),
                  R.createElement("button", {
                    onClick: () => cb.onDeleteTodo && cb.onDeleteTodo(t.id),
                    title: "Remove",
                    style: { background: "transparent", border: "none", color: "#9ca3af", fontSize: 14, cursor: "pointer", padding: "0 4px", lineHeight: 1 }
                  }, "×")
                ))
              ),
              cb.renderGoalTodoQuickAdd ? cb.renderGoalTodoQuickAdd(goal) : null
            )
          )
        );
      })()
    );

    return R.createElement("div", {
      key: goal.id,
      style: {
        background: "#fff",
        border: `1px solid ${gt ? gt.border : "var(--c-border)"}`,
        borderRadius: 10, overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        cursor: isE ? "default" : "pointer", userSelect: "none"
      },
      onClick: () => { if (isE) return; toggleExpanded(goal.id); },
      onDoubleClick: e => { if (isE) return; e.stopPropagation(); cb.onEditGoal && cb.onEditGoal(goal); }
    }, headerSection, progressBar, expandedPanel);
  };

  // ── Per-Area groups
  const grouped = goalsDom ? goalsDom.bySectionGroup(data) : { groups: [], untyped: [], future: [] };

  // App provides the sorted-areas list (it has memoedAreaProgress / area
  // custom order / merged date-sort logic). Fall back to HT order if not.
  const isDateSort = goalSortMode === "date-asc" || goalSortMode === "date-desc";
  const sortedAreas = cb.sortAreasForRender ? cb.sortAreasForRender(HT, { merged: isDateSort }) : HT;

  const areaSection = R.createElement("div", { className: "goals-areas-grid" },
    sortedAreas.map(ht => {
      // Find matching grouped entry (or all goals if "merged")
      const merged = ht.merged;
      let typeGoalsRaw;
      if (merged) {
        // Flatten all active goals into one list
        typeGoalsRaw = [].concat(...grouped.groups.map(g => g.goals.map(e => e.goal)));
      } else {
        const found = grouped.groups.find(g => g.type === ht.value);
        typeGoalsRaw = found ? found.goals.map(e => e.goal) : [];
      }
      // Filter by user's pill selection
      if (!merged && goalTypeFilter.length > 0 && !goalTypeFilter.includes(ht.value)) return null;
      if (merged) typeGoalsRaw = typeGoalsRaw.filter(g => goalTypeFilter.length === 0 || goalTypeFilter.includes(g.type));
      const typeGoals = cb.sortItems ? cb.sortItems(typeGoalsRaw, goalSortMode, "goal") : typeGoalsRaw;
      if (!typeGoals.length) return null;

      const areaCollapsed = !merged && !!collapsedGoalAreas[ht.value];
      return R.createElement("div", {
        key: ht.value, "data-area": ht.value, style: { marginBottom: 10 }
      },
        !merged && R.createElement("div", {
          onClick: () => cb.setCollapsedGoalAreas && cb.setCollapsedGoalAreas(p => ({ ...p, [ht.value]: !p[ht.value] })),
          title: (areaCollapsed ? "Expand " : "Collapse ") + ht.value,
          style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6, cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent" }
        },
          R.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: ht.color } }),
          R.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: ht.color, letterSpacing: .5 } }, ht.value),
          R.createElement("span", { style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", marginLeft: 2 } }, "(" + typeGoals.length + ")"),
          R.createElement("div", { style: { flex: 1, height: 1, background: ht.border } }),
          R.createElement("span", { style: { fontSize: 11, color: ht.color, opacity: .7, transform: areaCollapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform .15s ease", display: "inline-block", lineHeight: 1 } }, "▾")
        ),
        !areaCollapsed && R.createElement("div", { className: "habit-grid" }, typeGoals.map(g => renderGoalCard(g)))
      );
    })
  );

  // ── "General" group: active goals with no type
  const generalGoals = grouped.untyped.map(e => e.goal);
  const generalSection = goalTypeFilter.length === 0 && generalGoals.length > 0 && R.createElement("div", {
    "data-area": "general", style: { marginBottom: 16 }
  },
    R.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 } },
      R.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#9ca3af" } }, "General"),
      R.createElement("div", { style: { flex: 1, height: 1, background: "var(--c-border)" } })
    ),
    R.createElement("div", { className: "habit-grid" },
      (cb.sortItems ? cb.sortItems(generalGoals, goalSortMode, "goal") : generalGoals).map(g => renderGoalCard(g))
    )
  );

  // ── Future Goals drawer
  const futureGoals = grouped.future;
  const futureSection = futureGoals.length > 0 && R.createElement("div", {
    className: "future-goals-drawer", style: { marginTop: 18, marginBottom: 18 }
  },
    R.createElement("div", {
      onClick: () => cb.setFutureGoalsOpen && cb.setFutureGoalsOpen(!futureOpen),
      title: futureOpen ? "Hide future goals" : "Show future goals",
      style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: futureOpen ? 8 : 0, userSelect: "none", WebkitTapHighlightColor: "transparent" }
    },
      R.createElement("span", { style: { fontSize: 11, color: "#6b7280", transform: futureOpen ? "rotate(90deg)" : "none", transition: "transform .15s", display: "inline-block", width: 10 } }, "▶"),
      R.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", letterSpacing: .5 } }, "Future Goals"),
      R.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "#9ca3af" } }, "(" + futureGoals.length + ")"),
      R.createElement("div", { style: { flex: 1, height: 1, background: "var(--c-border)" } })
    ),
    futureOpen && R.createElement("div", { className: "habit-grid" },
      (cb.sortItems ? cb.sortItems(futureGoals, goalSortMode, "goal") : futureGoals).map(goal => {
        const gt = HT.find(t => t.value === goal.type);
        return R.createElement("div", {
          key: goal.id,
          style: { background: "#fff", border: "1px solid " + (gt ? gt.border : "var(--c-border)"), borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.04)" },
          onClick: () => cb.onEditGoal && cb.onEditGoal(goal),
          title: "Edit goal — link a habit to make it active"
        },
          gt && R.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: gt.color, flexShrink: 0 } }),
          R.createElement("div", { style: { flex: 1, fontSize: 13, color: "var(--c-text)", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" } }, goal.text),
          gt && R.createElement("span", { style: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: gt.color, padding: "2px 7px", borderRadius: 6, background: gt.bg, border: "1px solid " + gt.border, letterSpacing: .4, whiteSpace: "nowrap" } }, goal.type)
        );
      })
    )
  );

  return R.createElement("div", { className: "fade-in" },
    emptyState,
    headerRow,
    pillsRow,
    R.createElement("div", { style: { height: 1, background: "#f0f0ee", margin: "4px 0 14px" } }),
    wizard,
    areaSection,
    generalSection,
    futureSection
  );
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GoalsView };
} else if (typeof window !== "undefined") {
  window.GoalsView = GoalsView;
}
