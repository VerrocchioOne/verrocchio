// lib/views/SortMenu.js
//
// Per-page sort utility (pure `sortItems` comparator dispatch) and the
// "⇅ Sort" button + bottom-sheet picker UI. Originally inline at
// index.html L9350-L9650 (300 LOC). Exposes one namespace:
//
//   window.SortMenu = {
//     sortItems,          // pure: (items, mode, kind, getStreak) -> sorted copy
//     setSortPref,        // routes through save({...data, sortPrefs: ...})
//     canonicalSort,      // legacy-alias resolver, used by the active-pill math
//     LEGACY_ALIASES,     // alpha -> alpha-asc, etc. (legacy save migration)
//     LABEL,              // short pill labels keyed by mode string
//     GROUPS,             // per-page row config
//     renderButton,       // (helpers) -> React button element
//     renderSheet         // (helpers) -> React A11yDialog or null
//   };
//
// Helpers bags passed to renderButton / renderSheet hold the App-scope
// state + setters this component would otherwise close over:
//   data, save, openSortMenu, setOpenSortMenu, openGoalReorder,
//   openTodoReorder
//
// App() retains tiny pass-through wrappers (sortItems, renderSortButton,
// renderSortSheet) so the existing callback interface to extracted
// views (HabitsView, BriefView, GoalsView, etc.) doesn't change.

(function () {
  "use strict";
  if (typeof window === "undefined") return;
  const R = window.React;

  // Mode strings are now directional: `${axis}-${dir}` where axis ∈
  // {alpha, created, date, streak} and dir ∈ {asc, desc}. Legacy single-
  // word modes from older saves ("alpha", "created", "date", "streak")
  // are aliased to the direction they originally shipped with so the
  // previous behavior is preserved on read.
  const LEGACY_ALIASES = {
    alpha:   "alpha-asc",
    created: "created-desc",
    date:    "date-asc",
    streak:  "streak-desc"
  };

  // Returns a sorted COPY of `items`. `kind` selects the per-mode
  // comparator so, e.g., "date-asc" means goal.smart.timebound ascending
  // for goals and todo.dueDate ascending for todos. Unknown modes fall
  // back to `_order` (custom) so a forward-compat sortPref doesn't crash.
  function sortItems(items, mode, kind, getStreakFn) {
    if (!Array.isArray(items)) return [];
    const getStreak = getStreakFn || (typeof window !== "undefined" && window.getStreak) || (() => 0);
    const copy = items.slice();
    const norm = LEGACY_ALIASES[mode] || mode;
    const byOrder = (a, b) => (a._order ?? 999) - (b._order ?? 999);
    const byAlpha = (a, b) => String(a.text || "").localeCompare(String(b.text || ""), undefined, { sensitivity: "base" });
    // Item ids come from Date.now(), so id is a monotonic proxy for
    // creation time. Fall back to zero for any non-numeric id so the
    // comparator is total.
    const byIdDesc = (a, b) => (Number(b.id) || 0) - (Number(a.id) || 0);
    const byIdAsc  = (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0);
    const dateKey = (it) => {
      if (kind === "goal") return it.smart && it.smart.timebound ? it.smart.timebound : "";
      if (kind === "todo") return it.dueDate || "";
      return "";
    };
    // Empty dates always sort to the end regardless of direction.
    const byDateAsc = (a, b) => {
      const da = dateKey(a), db = dateKey(b);
      if (!da && !db) return byOrder(a, b);
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    };
    const byDateDesc = (a, b) => {
      const da = dateKey(a), db = dateKey(b);
      if (!da && !db) return byOrder(a, b);
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    };
    const byStreakDesc = (a, b) => getStreak(b) - getStreak(a);
    const byStreakAsc  = (a, b) => getStreak(a) - getStreak(b);
    switch (norm) {
      case "alpha-asc":    return copy.sort(byAlpha);
      case "alpha-desc":   return copy.sort((a, b) => -byAlpha(a, b));
      case "created-desc": return copy.sort(byIdDesc);
      case "created-asc":  return copy.sort(byIdAsc);
      case "date-asc":     return copy.sort(byDateAsc);
      case "date-desc":    return copy.sort(byDateDesc);
      case "streak-desc":  return kind === "habit" ? copy.sort(byStreakDesc) : copy.sort(byOrder);
      case "streak-asc":   return kind === "habit" ? copy.sort(byStreakAsc)  : copy.sort(byOrder);
      case "custom":       return copy.sort(byOrder);
      case "default":
      default:
        // Default pick per kind:
        //   habits → section _order (manual ordering via the
        //            edit-habit Order x/y input)
        //   goals  → earliest target date within the area
        //   todos  → due date ascending
        if (kind === "goal")  return copy.sort(byDateAsc);
        if (kind === "todo")  return copy.sort(byDateAsc);
        return copy.sort(byOrder);
    }
  }

  // Routes through save so the pref syncs to Firestore + other tabs.
  function setSortPref(data, save, page, mode) {
    save({ ...data, sortPrefs: { ...(data.sortPrefs || {}), [page]: mode } });
  }

  // Short labels — used both in the sheet pills and in the collapsed
  // "⇅ <label>" trigger on the page.
  const LABEL = {
    default:       "Default",
    "alpha-asc":   "A → Z",
    "alpha-desc":  "Z → A",
    "created-desc":"Newest",
    "created-asc": "Oldest",
    "date-asc":    "Earliest",
    "date-desc":   "Latest",
    "streak-desc": "Highest streak",
    "streak-asc":  "Lowest streak",
    custom:        "Custom"
  };

  // Per-page axis config.
  const GROUPS = {
    habits: [
      { id: "default", label: "Default" },
      { axis: "alpha",   label: "Alphabetical", asc: { mode: "alpha-asc",    pill: "A → Z"    }, desc: { mode: "alpha-desc",   pill: "Z → A" } },
      { axis: "created", label: "Creation",     asc: { mode: "created-asc",  pill: "Oldest"   }, desc: { mode: "created-desc", pill: "Newest" } },
      { axis: "streak",  label: "Streak",       asc: { mode: "streak-asc",   pill: "Lowest"   }, desc: { mode: "streak-desc",  pill: "Highest" } }
    ],
    goals: [
      { id: "default", label: "Default" },
      { axis: "alpha",   label: "Alphabetical", asc: { mode: "alpha-asc",    pill: "A → Z"    }, desc: { mode: "alpha-desc",   pill: "Z → A" } },
      { axis: "created", label: "Creation",     asc: { mode: "created-asc",  pill: "Oldest"   }, desc: { mode: "created-desc", pill: "Newest" } },
      { axis: "date",    label: "Target date",  asc: { mode: "date-asc",     pill: "Earliest" }, desc: { mode: "date-desc",    pill: "Latest" } },
      { id: "custom",  label: "Custom" }
    ],
    todos: [
      { id: "default", label: "Default" },
      { axis: "alpha",   label: "Alphabetical", asc: { mode: "alpha-asc",    pill: "A → Z"    }, desc: { mode: "alpha-desc",   pill: "Z → A" } },
      { axis: "created", label: "Creation",     asc: { mode: "created-asc",  pill: "Oldest"   }, desc: { mode: "created-desc", pill: "Newest" } },
      { axis: "date",    label: "Due date",     asc: { mode: "date-asc",     pill: "Earliest" }, desc: { mode: "date-desc",    pill: "Latest" } },
      { id: "custom",  label: "Custom" }
    ]
  };

  // Resolve a stored pref into its canonical directional string.
  function canonicalSort(mode) {
    return LEGACY_ALIASES[mode] || mode || "default";
  }

  function renderButton(helpers) {
    if (!R) return null;
    const { data, page, openSortMenu, setOpenSortMenu } = helpers;
    let current = canonicalSort((data.sortPrefs && data.sortPrefs[page]) || "default");
    if (page === "habits" && current === "custom") current = "default";
    return /*#__PURE__*/R.createElement("button", {
      onClick: () => setOpenSortMenu(openSortMenu === page ? null : page),
      "aria-label": "Sort",
      title: "Change sort order",
      style: {
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 10px",
        borderRadius: 20,
        border: "1px solid var(--c-border)",
        background: current !== "default" ? "var(--c-tint-success-bg)" : "var(--c-surface, #fff)",
        color: current !== "default" ? "#2d5a2d" : "#6b7280",
        fontSize: 11, fontWeight: current !== "default" ? 700 : 500,
        cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
        WebkitTapHighlightColor: "transparent", userSelect: "none"
      }
    },
      /*#__PURE__*/R.createElement("span", { style: { fontSize: 12, lineHeight: 1 } }, "⇅"),
      "Sort",
      current !== "default" && /*#__PURE__*/R.createElement("span", {
        style: { fontSize: 9, fontWeight: 700, opacity: 0.75 }
      }, "· " + (LABEL[current] || ""))
    );
  }

  function renderSheet(helpers) {
    if (!R) return null;
    const { data, save, openSortMenu, setOpenSortMenu, openGoalReorder, openTodoReorder } = helpers;
    const A11yDialog = window.VerrocchioReactDialog;
    if (!openSortMenu || !A11yDialog) return null;
    const page = openSortMenu;
    const groups = GROUPS[page] || [{ id: "default", label: "Default" }];
    let current = canonicalSort((data.sortPrefs && data.sortPrefs[page]) || "default");
    if (page === "habits" && current === "custom") current = "default";
    const close = () => setOpenSortMenu(null);
    const pick = (mode) => { setSortPref(data, save, page, mode); close(); };
    const openReorder = () => {
      close();
      if (page === "goal" || page === "goals") (openGoalReorder || (() => {}))();
      else if (page === "todo" || page === "todos") (openTodoReorder || (() => {}))();
      // Habits custom order is edited per-section via long-press.
    };
    const rowShell = (active) => ({
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 12px",
      border: "1px solid " + (active ? "#2d5a2d" : "var(--c-border)"),
      borderRadius: 10,
      background: active ? "var(--c-tint-success-bg)" : "var(--c-surface, #fff)",
      gap: 10
    });
    const axisLabelStyle = (active) => ({
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      color: active ? "#2d5a2d" : "var(--c-text)"
    });
    const dirPill = (pill, mode, selected) => /*#__PURE__*/R.createElement("button", {
      key: mode,
      type: "button",
      onClick: (e) => { e.stopPropagation(); pick(mode); },
      style: {
        padding: "6px 12px",
        border: "1px solid " + (selected ? "#2d5a2d" : "var(--c-border)"),
        borderRadius: 999,
        background: selected ? "#2d5a2d" : "transparent",
        color: selected ? "#fff" : "#4b5563",
        fontSize: 12, fontWeight: selected ? 700 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        WebkitTapHighlightColor: "transparent"
      }
    }, pill);
    const renderGroup = (g) => {
      if (g.id) {
        const active = current === g.id;
        return /*#__PURE__*/R.createElement("button", {
          key: g.id,
          type: "button",
          onClick: () => pick(g.id),
          style: Object.assign(rowShell(active), {
            textAlign: "left",
            cursor: "pointer",
            color: active ? "#2d5a2d" : "var(--c-text)",
            fontSize: 13, fontWeight: active ? 700 : 500
          })
        }, /*#__PURE__*/R.createElement("span", null, g.label), active ? "✓" : "");
      }
      const ascSel  = current === g.asc.mode;
      const descSel = current === g.desc.mode;
      const active = ascSel || descSel;
      return /*#__PURE__*/R.createElement("div", {
        key: g.axis,
        style: rowShell(active)
      },
        /*#__PURE__*/R.createElement("span", { style: axisLabelStyle(active) }, g.label),
        /*#__PURE__*/R.createElement("div", {
          style: { display: "flex", gap: 6, flexShrink: 0 }
        },
          dirPill(g.asc.pill,  g.asc.mode,  ascSel),
          dirPill(g.desc.pill, g.desc.mode, descSel)
        )
      );
    };
    return /*#__PURE__*/R.createElement(A11yDialog, {
      onHide: close,
      dialogProps: { "aria-label": "Sort options" },
      overlayStyle: { zIndex: 305 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: "20px 20px 0 0", padding: "18px 16px 22px", maxWidth: 520, boxShadow: "0 -8px 40px rgba(0,0,0,.2)" }
    },
      /*#__PURE__*/R.createElement("div", {
        style: { fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.3 }
      }, "Sort"),
      /*#__PURE__*/R.createElement("div", {
        style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 6 }
      }, groups.map(renderGroup)),
      (page === "goals" || page === "todos") && /*#__PURE__*/R.createElement("button", {
        type: "button",
        onClick: openReorder,
        style: {
          width: "100%",
          padding: "11px 12px",
          marginTop: 6,
          border: "1px dashed #2d5a2d",
          borderRadius: 10,
          background: "transparent",
          color: "#2d5a2d",
          fontSize: 13, fontWeight: 600,
          cursor: "pointer",
          textAlign: "center"
        }
      }, "Edit custom order…"),
      page === "habits" && /*#__PURE__*/R.createElement("div", {
        style: { marginTop: 8, padding: "8px 10px", fontSize: 11, color: "#6b7280", textAlign: "center" }
      }, "Press and hold a habit card to drag it into a new position.")
    );
  }

  window.SortMenu = {
    sortItems,
    setSortPref,
    canonicalSort,
    LEGACY_ALIASES,
    LABEL,
    GROUPS,
    renderButton,
    renderSheet
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = window.SortMenu;
  }
})();
