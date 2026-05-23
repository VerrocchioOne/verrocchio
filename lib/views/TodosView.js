// lib/views/TodosView.js — extracted Todos tab render block (Phase B of v75).
//
// Frozen prop signature per docs/superpowers/patterns/view-extraction.md:
//   { data, dispatch, deviceProfile, callbacks }
//
// `dispatch` is accepted but unused — every write here is App-scope (it
// reads multiple useState setters, undo stack, touchFeature, save), so
// writes go through `callbacks`. When the WRITE-side helpers are
// extracted in a future plan they can switch to dispatch(todosDomain.fn(...)).
//
// View-local useState for: new-todo draft fields + the inline add-task
// form open/close + the section-filter pill row open/close + per-todo
// expand-state + edit-state + archive-drawer open/close. App owns
// `todoSecFilter` (it's read by Brief too) so that one stays a callback.

function TodosView(props) {
  const data = props.data;
  const callbacks = props.callbacks || {};
  const todosDomainRef = (typeof window !== "undefined" && window.todosDomain) ||
    (typeof require === "function" ? require("../domains/todos.js").todosDomain : {});

  // ── View-local UI state (matches the inline App-scope hooks 1:1) ──
  const [nTodo, sNTodo] = React.useState("");
  const [nTodoDue, sNTodoDue] = React.useState("");
  const [nTodoGoalId, sNTodoGoalId] = React.useState("");
  const [expTodoForm, setExpTodoForm] = React.useState(false);
  const [expTodoIds, setExpTodoIds] = React.useState({});
  const [eTodoId, sETodoId] = React.useState(null);
  const [eTodoTxt, sETodoTxt] = React.useState("");
  const [eTodoDue, sETodoDue] = React.useState("");
  const [showArchivedTodos, setShowArchivedTodos] = React.useState(false);

  // ── App-scope-owned values surfaced through callbacks ──
  // `todoSecFilter` + `todoPillsOpen` stay in App so the Brief tab and the
  // home banner can react to them (they're not purely view-local). The
  // sort button + linked-content panel + style tokens + Glyph all close
  // over App-scope state; passed through as render helpers.
  const todoSecFilter   = callbacks.todoSecFilter || [];
  const todoPillsOpen   = !!callbacks.todoPillsOpen;
  const setTodoSecFilter = callbacks.setTodoSecFilter || (() => {});
  const setTodoPillsOpen = callbacks.setTodoPillsOpen || (() => {});
  const renderSortButton = callbacks.renderSortButton || (() => null);
  const linkedContentForEntity = callbacks.linkedContentForEntity || (() => null);
  const fmtD  = callbacks.fmtD  || (s => String(s || ""));
  const Glyph = callbacks.Glyph || (() => null);
  const dp    = callbacks.dp    || (() => ({}));
  const sortItems = callbacks.sortItems || ((items) => items);
  const IS  = callbacks.IS  || {};
  const S   = callbacks.S   || {};
  const AB  = callbacks.AB  || {};
  const EI  = callbacks.EI  || {};
  const SC  = callbacks.SC  || (() => null);
  const HT  = callbacks.HT  || [];
  const tk  = callbacks.tk  || (() => "");

  // ── Write callbacks (App-scope) ──
  const onAddTodo      = callbacks.onAddTodo      || (() => {});
  const onCompleteTodo = callbacks.onCompleteTodo || (() => {});
  const onDeleteTodo   = callbacks.onDeleteTodo   || (() => {});
  const onArchiveTodo  = callbacks.onArchiveTodo  || (() => {});
  const onRestoreTodo  = callbacks.onRestoreTodo  || (() => {});
  const onEditTodoSave = callbacks.onEditTodoSave || (() => {});
  const onNavigateTab  = callbacks.onNavigateTab  || (() => {});
  const onExpandGoal   = callbacks.onExpandGoal   || (() => {});

  // ── Derived values (use the pure domain module) ──
  const todayKey = tk();
  const pending  = todosDomainRef.pendingTodos
    ? todosDomainRef.pendingTodos(data)
    : (data.todos || []).filter(t => t && !t.done && !t.archived);
  const todoHasUrgent = todosDomainRef.hasUrgent
    ? todosDomainRef.hasUrgent(data, todayKey)
    : false;
  const dueStatusFn = todosDomainRef.dueStatus
    || ((d) => null);
  const isTodoIncompleteFn = todosDomainRef.isTodoIncomplete
    || (() => false);
  const getSecFn = (t) => todosDomainRef.getSection
    ? todosDomainRef.getSection(t, todayKey)
    : "unassigned";

  const SECS = [
    { key: "today",      label: "Today",       color: "#dc2626", bg: "#fef2f2", bc: "#fecaca" },
    { key: "week",       label: "This Week",   color: "#d97706", bg: "#fffbeb", bc: "#fde68a" },
    { key: "month",      label: "This Month",  color: "#0891b2", bg: "#f0f9ff", bc: "#bae6fd" },
    { key: "later",      label: "Later",       color: "#6b7280", bg: "var(--c-surface-raised)", bc: "var(--c-border)" },
    { key: "unassigned", label: "No Due Date", color: "#9ca3af", bg: "var(--c-surface-raised)", bc: "var(--c-border)" }
  ];

  const todoRit = (data.dailyRitual && data.dailyRitual[todayKey]) || {};

  // Row renderer — kept inside TodosView so it can close over view-local
  // edit/expansion state and the goal lookup. Identical structure to the
  // inline `Row` from index.html.
  const Row = ({ todo, idx }) => {
    const ds = dueStatusFn(todo.dueDate, todayKey);
    const isE = eTodoId === todo.id;
    const isTExp = !!expTodoIds[todo.id];
    const linkedGoal = todo.goalId
      ? (data.goals || []).find(x => String(x.id) === String(todo.goalId))
      : null;

    const rowChildren = [
      React.createElement("div", {
        key: "chk",
        onClick: (e) => { e.stopPropagation(); if (!isE) onCompleteTodo(todo.id); },
        style: {
          width: 16, height: 16, borderRadius: 4,
          border: "1.5px solid #d1d5db",
          background: "#fff", cursor: "pointer", flexShrink: 0
        }
      }),
      isE
        ? React.createElement("div", {
            key: "edit",
            style: { flex: 1, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }
          },
            React.createElement("input", {
              value: eTodoTxt,
              onChange: e => sETodoTxt(e.target.value),
              onKeyDown: e => {
                if (e.key === "Enter") e.preventDefault();
                if (e.key === "Escape") sETodoId(null);
              },
              autoFocus: true,
              style: { ...EI, flex: 1, minWidth: 120 }
            }),
            React.createElement("input", {
              type: "date", value: eTodoDue,
              onChange: e => sETodoDue(e.target.value),
              style: { fontSize: 12, border: "1px solid #7c3aed", borderRadius: 6, padding: "5px 8px", color: "#7c3aed", background: "#faf5ff", outline: "none" }
            }),
            React.createElement(SC, {
              onSave: () => {
                if (!eTodoTxt.trim()) return;
                onEditTodoSave(todo.id, eTodoTxt.trim(), eTodoDue || null);
                sETodoId(null);
              },
              onCancel: () => sETodoId(null)
            })
          )
        : React.createElement(React.Fragment, { key: "view" },
            React.createElement("div", {
              onClick: () => setExpTodoIds(p => ({ ...p, [todo.id]: !p[todo.id] })),
              style: { flex: 1, fontSize: 13, color: "var(--c-text-soft)", wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.3, cursor: linkedGoal ? "pointer" : "default" }
            },
              isTodoIncompleteFn(todo) && React.createElement("span", {
                title: "Incomplete — pick a due date for this to-do.",
                style: { marginRight: 4, display: "inline-flex", alignItems: "center", verticalAlign: "middle" }
              }, Glyph("🚨", { size: 12, color: "#b91c1c" })),
              todo.text
            ),
            ds && React.createElement("span", {
              style: { fontSize: 10, fontWeight: 600, color: ds.color, background: ds.bg, padding: "2px 8px", borderRadius: 8, flexShrink: 0, whiteSpace: "nowrap" }
            }, ds.label),
            React.createElement("button", {
              "aria-label": "Edit",
              className: "edit-btn",
              onClick: () => {
                sETodoId(todo.id);
                sETodoTxt(todo.text);
                sETodoDue(todo.dueDate || "");
              },
              style: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12, opacity: 0, padding: "4px" }
            }, "✎"),
            React.createElement("button", {
              "aria-label": "Archive",
              className: "edit-btn",
              title: "Archive",
              onClick: () => onArchiveTodo(todo.id),
              style: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 13, opacity: 0, padding: "4px" }
            }, "📦"),
            React.createElement("button", {
              "aria-label": "Close",
              className: "del-btn",
              onClick: () => onDeleteTodo(todo.id),
              style: { background: "none", border: "none", cursor: "pointer", color: "#d1d5db", fontSize: 16, opacity: 0, lineHeight: 1 }
            }, "×")
          )
    ];

    return React.createElement("div",
      Object.assign({ className: "hrow" },
        isE ? {} : dp(idx, pending, callbacks.reordTodos || (() => {})),
        {
          style: {
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderBottom: "1px solid #f3f4f6",
            padding: "9px 10px"
          }
        }
      ),
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 8 }
      }, rowChildren),
      isTExp && linkedGoal && !isE && React.createElement("div", {
        style: { marginTop: 6, marginLeft: 24, display: "flex", alignItems: "center", gap: 8 }
      },
        React.createElement("span", {
          style: { fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }
        }, "Linked goal"),
        React.createElement("button", {
          onClick: () => { onNavigateTab("goals"); onExpandGoal(linkedGoal.id); },
          title: "Open goal",
          style: {
            fontSize: 11, fontWeight: 600,
            color: "#2d5a2d", background: "var(--c-tint-success-bg)",
            border: "1px solid var(--c-tint-success-border)", borderRadius: 10,
            padding: "2px 10px", cursor: "pointer"
          }
        }, "🎯 ", linkedGoal.text.length > 30 ? linkedGoal.text.slice(0, 28) + "…" : linkedGoal.text)
      ),
      isTExp && !isE && React.createElement("div", {
        style: { marginTop: 6, marginLeft: 24 }
      }, linkedContentForEntity("todo", todo.id))
    );
  };

  const secFilterOn = (key) => todoSecFilter.length === 0 || todoSecFilter.includes(key);

  const todoReturnBanner = (!todoRit.todosReviewed && todoHasUrgent)
    ? React.createElement("div", {
        onClick: () => onNavigateTab("brief"),
        style: {
          display: "flex", alignItems: "center", gap: 10,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderLeft: "4px solid #1d4ed8",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 10,
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(29,78,216,.08)"
        }
      },
        React.createElement("span", {
          "aria-hidden": true,
          style: { fontSize: 16, color: "#1d4ed8", flexShrink: 0 }
        }, "←"),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", {
            style: { fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.4 }
          }, "Reviewing urgent to-dos"),
          React.createElement("div", {
            style: { fontSize: 12, color: "#1e3a8a", lineHeight: 1.4 }
          }, "Triage anything overdue or due soon, then tap here to return to the home page review.")
        ),
        React.createElement("span", {
          style: { fontSize: 11, fontWeight: 700, color: "#1d4ed8", flexShrink: 0 }
        }, "Home")
      )
    : null;

  // ── Active section blocks ─────────────────────────────────────────
  const sectionBlocks = SECS.filter(s => secFilterOn(s.key)).map(sec => {
    const st = sortItems(
      pending.filter(t => getSecFn(t) === sec.key),
      (data.sortPrefs && data.sortPrefs.todos) || "default",
      "todo"
    );
    if (!st.length) return null;
    return React.createElement("div", { key: sec.key, style: { marginBottom: 10 } },
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }
      },
        React.createElement("span", {
          style: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: sec.color }
        }, sec.label),
        React.createElement("span", {
          style: { fontSize: 10, color: "#d1d5db" }
        }, st.length),
        React.createElement("div", {
          style: { flex: 1, height: 1, background: sec.bc }
        })
      ),
      React.createElement("div", {
        style: { border: `1px solid ${sec.bc}`, borderRadius: 10, overflow: "hidden", background: sec.bg }
      }, st.map(t => React.createElement(Row, { key: t.id, todo: t, idx: pending.indexOf(t) })))
    );
  });

  // ── Archive drawer (non-deleted, non-completed: archived flag only) ──
  const archivedTodos = (data.todos || []).filter(t => t && t.archived);
  const archiveDrawer = archivedTodos.length === 0 ? null
    : React.createElement("div", { style: { marginTop: 16 } },
        React.createElement("button", {
          onClick: () => setShowArchivedTodos(s => !s),
          style: {
            background: "transparent", border: "none",
            color: "var(--c-text-faint)", cursor: "pointer",
            fontSize: 12, padding: 4
          }
        }, (showArchivedTodos ? "Hide" : "View") + " archive (" + archivedTodos.length + ")"),
        showArchivedTodos && React.createElement("div", {
          className: "fade-in", style: { marginTop: 8 }
        },
          archivedTodos.map(t => React.createElement("div", {
            key: t.id,
            style: {
              padding: 10, background: "var(--c-surface-muted)",
              borderRadius: 8, marginBottom: 6, fontSize: 13,
              color: "var(--c-text-soft)", display: "flex",
              alignItems: "center", justifyContent: "space-between", gap: 8
            }
          },
            React.createElement("span", {
              style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
            }, t.text || "(no text)"),
            React.createElement("button", {
              onClick: () => onRestoreTodo(t.id),
              style: {
                background: "transparent",
                border: "1px solid var(--c-border)",
                color: "var(--c-text-soft)", cursor: "pointer",
                fontSize: 12, padding: "4px 8px", borderRadius: 6, flexShrink: 0
              }
            }, "Restore")
          ))
        )
      );

  // ── Completed footer (tombstone archive) ──
  const completedFooter = ((data.archive || []).length > 0) && React.createElement("div", {
    style: { marginTop: 10 }
  },
    React.createElement("div", {
      style: { fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }
    }, "Completed (", (data.archive || []).length, ")"),
    React.createElement("div", {
      style: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }
    },
      [...(data.archive || [])].reverse().slice(0, 15).map(t => React.createElement("div", {
        key: t.id,
        style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid #f9fafb", opacity: .5 }
      },
        React.createElement("div", {
          style: { width: 14, height: 14, borderRadius: 3, background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }
        },
          React.createElement("span", { style: { color: "white", fontSize: 8, fontWeight: "bold" } }, "✓")
        ),
        React.createElement("span", {
          style: { flex: 1, fontSize: 12, color: "#6b7280", textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
        }, t.text),
        React.createElement("span", { style: { fontSize: 9, color: "#9ca3af", flexShrink: 0 } },
          t.archivedAt ? fmtD(t.archivedAt) : ""
        )
      ))
    )
  );

  return React.createElement("div", { className: "fade-in" },
    todoReturnBanner,
    (data.todos || []).length === 0 && React.createElement("div", {
      style: { padding: "32px 20px 20px", textAlign: "center", maxWidth: 480, margin: "0 auto" }
    },
      React.createElement("p", {
        style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: "var(--c-text-strong)", marginBottom: 0, lineHeight: 1.4 }
      }, "A clean inbox starts here. Capture anything you don't want to forget.")
    ),
    // Header row: + button + filter pills + sort.
    React.createElement("div", {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5, marginBottom: 8 }
    },
      React.createElement("button", {
        onClick: () => setExpTodoForm(p => !p),
        "aria-label": "New task",
        title: "New task",
        style: {
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: "50%",
          border: "none",
          background: expTodoForm ? "#234a23" : "#2d5a2d",
          color: "#fff", cursor: "pointer", flexShrink: 0,
          WebkitTapHighlightColor: "transparent"
        }
      },
        React.createElement("span", {
          style: {
            color: "#fff", fontSize: 18, lineHeight: 1, fontWeight: 300,
            transform: expTodoForm ? "rotate(45deg)" : "none",
            transition: "transform .18s ease", display: "inline-block"
          }
        }, "+")
      ),
      // "All Tasks" pill — expands / collapses the section-filter row.
      (() => {
        const active   = todoSecFilter.length > 0;
        const expanded = todoPillsOpen || active;
        const count    = todoSecFilter.length;
        return React.createElement("button", {
          onClick: () => {
            if (active) { setTodoSecFilter([]); setTodoPillsOpen(true); return; }
            setTodoPillsOpen(!todoPillsOpen);
          },
          title: "All Tasks — tap to expand section filters",
          style: {
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px",
            borderRadius: 20,
            border: `1px solid ${active ? "#fde68a" : expanded ? "#c6dfc6" : "var(--c-border)"}`,
            background: active ? "#fffbeb" : expanded ? "var(--c-tint-success-bg)" : "#fff",
            color: active ? "#d97706" : expanded ? "#2d5a2d" : "#6b7280",
            fontSize: 11, fontWeight: expanded || active ? 700 : 500,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            WebkitTapHighlightColor: "transparent", userSelect: "none"
          }
        },
          "All Tasks",
          count > 0 && React.createElement("span", {
            style: { background: "#d97706", color: "#fff", borderRadius: 9, padding: "0 5px", fontSize: 9, fontWeight: 700, minWidth: 12, textAlign: "center" }
          }, count),
          React.createElement("span", {
            style: { fontSize: 8, opacity: 0.7, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .18s ease", display: "inline-block", marginLeft: 2 }
          }, "▼")
        );
      })(),
      renderSortButton("todos")
    ),
    // Section-filter pill row
    (todoPillsOpen || todoSecFilter.length > 0) && React.createElement("div", {
      className: "fade-in",
      style: { display: "flex", flexWrap: "wrap", rowGap: 6, columnGap: 5, marginBottom: 8 }
    },
      [{ val: "all", label: "All", color: "#2d5a2d", border: "#c6dfc6", bg: "var(--c-tint-success-bg)" },
       ...SECS.map(s => ({ val: s.key, label: s.label, color: s.color, border: s.bc, bg: s.bg }))
      ].map(f => {
        const isAll = f.val === "all";
        const on = isAll ? todoSecFilter.length === 0 : todoSecFilter.includes(f.val);
        return React.createElement("button", {
          key: f.val,
          onClick: () => {
            if (isAll) { setTodoSecFilter([]); return; }
            const next = todoSecFilter.includes(f.val)
              ? todoSecFilter.filter(x => x !== f.val)
              : [...todoSecFilter, f.val];
            setTodoSecFilter(next);
          },
          style: { padding: "4px 10px", borderRadius: 20, border: `1px solid ${on ? f.border : "var(--c-border)"}`, background: on ? f.bg : "#fff", color: on ? f.color : "#9ca3af", fontSize: 10, fontWeight: on ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", WebkitTapHighlightColor: "transparent", userSelect: "none", flexShrink: 0 }
        }, f.label);
      })
    ),
    // Inline add-task form
    expTodoForm && React.createElement("div", {
      className: "fade-in",
      style: {
        background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10,
        padding: 10, marginBottom: 8,
        display: "flex", flexDirection: "column", gap: 8
      }
    },
      React.createElement("input", {
        value: nTodo,
        onChange: e => sNTodo(e.target.value),
        onKeyDown: e => {
          if (e.key === "Enter") e.preventDefault();
          if (e.key === "Escape") setExpTodoForm(false);
        },
        placeholder: "What do you need to get done?",
        autoFocus: true,
        style: { ...IS, width: "100%" }
      }),
      React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
        React.createElement("input", {
          type: "date",
          value: nTodoDue,
          onChange: e => sNTodoDue(e.target.value),
          title: "Due date",
          style: { ...IS, fontSize: 12, cursor: "pointer", color: nTodoDue ? "#7c3aed" : "#9ca3af", flex: "1 1 140px", minWidth: 140 }
        }),
        React.createElement("select", {
          value: nTodoGoalId,
          onChange: e => sNTodoGoalId(e.target.value),
          title: "Link to a goal",
          style: { ...S, fontSize: 12, flex: "2 1 180px", minWidth: 160, color: nTodoGoalId ? "#2d5a2d" : "#9ca3af" }
        },
          React.createElement("option", { value: "" }, "🎯 No goal"),
          HT.map(ht => {
            const tg = (data.goals || []).filter(g => g.type === ht.value);
            if (!tg.length) return null;
            return React.createElement("optgroup", { key: ht.value, label: ht.value },
              tg.map(g => React.createElement("option", { key: g.id, value: g.id }, g.text)));
          }),
          (data.goals || []).filter(g => !g.type).length > 0 && React.createElement("optgroup", { label: "General" },
            (data.goals || []).filter(g => !g.type).map(g => React.createElement("option", { key: g.id, value: g.id }, g.text)))
        )
      ),
      React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" } },
        React.createElement("button", {
          onClick: () => { sNTodo(""); sNTodoDue(""); sNTodoGoalId(""); setExpTodoForm(false); },
          style: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: "#6b7280", cursor: "pointer" }
        }, "Cancel"),
        React.createElement("button", {
          className: "add-btn",
          onClick: () => {
            if (!nTodo.trim()) return;
            onAddTodo(nTodo.trim(), nTodoDue || null, nTodoGoalId || null);
            sNTodo("");
            sNTodoDue("");
            // Goal selection stays sticky — matches inline addTodo behavior.
            setExpTodoForm(false);
          },
          style: { ...AB, padding: "7px 18px", fontSize: 13 }
        }, "Add Task")
      )
    ),
    data.todos.length === 0 && React.createElement("div", {
      style: { textAlign: "center", color: "#d1d5db", fontSize: 13, padding: "40px 0" }
    }, "No tasks yet"),
    sectionBlocks,
    archiveDrawer,
    completedFooter
  );
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TodosView };
} else if (typeof window !== "undefined") {
  window.TodosView = TodosView;
}
