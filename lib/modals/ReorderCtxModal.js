// lib/modals/ReorderCtxModal.js
//
// Multi-mode reorder/organize sheet. Dispatches on ctx.kind:
//   - "habitSection" — habit section organize with bulk-action bar
//     (Group / Layer / Unlink), nested row rendering for parent/child/
//     concurrent visualization, drag-via-arrows.
//   - "goal" / "todo" / "goalAreas" — flat list reorder with arrows;
//     saving switches the sort mode to Custom.
//
// Wave 4.1.18. Originally inline at index.html L20485-L20924 (IIFE,
// ~440 LOC).
//
// References from shared classic-script global lexical environment:
//   HT (lib/constants.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function ReorderCtxModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const ctx = s.ctx;
    if (!ctx) return null;
    const reorderDraft = s.draft || [];
    const organizeOverrides = s.overrides || {};
    const organizeSelection = s.selection || [];
    const onClose = cb.onClose || (() => {});
    const setReorderDraft = cb.setDraft || (() => {});
    const setOrganizeOverrides = cb.setOverrides || (() => {});
    const setOrganizeSelection = cb.setSelection || (() => {});
    const saveReorder = cb.onSave || (() => {});
    const moveDraftItem = cb.onMoveItem || (() => {});

    const pool =
      ctx.kind === "goal" ? (data.goals || [])
      : ctx.kind === "todo" ? (data.todos || [])
      : ctx.kind === "goalAreas" ? HT.map(t => ({ id: t.value, text: t.value }))
      : (data.habits || []);
    const itemsById = new Map(pool.map(x => [String(x.id), x]));
    const isHabitSec = ctx.kind === "habitSection";

    let bulkActionBar = null;
    if (isHabitSec) {
      const sel = organizeSelection.filter(id => reorderDraft.includes(id));
      const selectedCount = sel.length;
      const anyLinked = sel.some(id => {
        const ov = organizeOverrides[id];
        return ov && (ov.parentId || ov.concurrent);
      });
      const groupHabits = () => {
        if (sel.length < 2) return;
        const head = sel[0];
        const movers = sel.slice(1);
        const filtered = reorderDraft.filter(id => !movers.includes(id));
        const insertAt = filtered.indexOf(head) + 1;
        const newDraft = [...filtered.slice(0, insertAt), ...movers, ...filtered.slice(insertAt)];
        setReorderDraft(newDraft);
        setOrganizeOverrides(p => {
          const next = { ...p };
          next[head] = { ...(p[head] || {}), parentId: "", concurrent: false };
          for (const m of movers) {
            next[m] = { ...(p[m] || {}), parentId: String(head), concurrent: false };
          }
          return next;
        });
        setOrganizeSelection([]);
      };
      const layerHabits = () => {
        if (sel.length < 2) return;
        const head = sel[0];
        const movers = sel.slice(1);
        const filtered = reorderDraft.filter(id => !movers.includes(id));
        const insertAt = filtered.indexOf(head) + 1;
        const newDraft = [...filtered.slice(0, insertAt), ...movers, ...filtered.slice(insertAt)];
        setReorderDraft(newDraft);
        setOrganizeOverrides(p => {
          const next = { ...p };
          next[head] = { ...(p[head] || {}), parentId: "", concurrent: false };
          for (const m of movers) {
            next[m] = { ...(p[m] || {}), parentId: "", concurrent: true };
          }
          return next;
        });
        setOrganizeSelection([]);
      };
      const unlinkSelected = () => {
        if (sel.length === 0) return;
        setOrganizeOverrides(p => {
          const next = { ...p };
          for (const id of sel) {
            next[id] = { ...(p[id] || {}), parentId: "", concurrent: false };
          }
          return next;
        });
        setOrganizeSelection([]);
      };
      const btnStyle = (enabled, color) => ({
        flex: 1,
        background: enabled ? color : "var(--c-surface-muted)",
        border: "1px solid " + (enabled ? color : "var(--c-border)"),
        borderRadius: 8, padding: "8px 6px", fontSize: 11, fontWeight: 700,
        color: enabled ? "#fff" : "#9ca3af",
        cursor: enabled ? "pointer" : "default",
        opacity: enabled ? 1 : 0.6, whiteSpace: "nowrap"
      });
      bulkActionBar = React.createElement("div", {
        style: { display: "flex", gap: 6, marginBottom: 12, alignItems: "stretch" }
      },
        React.createElement("button", { type: "button", onClick: groupHabits, disabled: selectedCount < 2, style: btnStyle(selectedCount >= 2, "#15803d") }, "↳ Group (" + selectedCount + ")"),
        React.createElement("button", { type: "button", onClick: layerHabits, disabled: selectedCount < 2, style: btnStyle(selectedCount >= 2, "#1d4ed8") }, "⇶ Layer (" + selectedCount + ")"),
        React.createElement("button", { type: "button", onClick: unlinkSelected, disabled: !anyLinked, style: btnStyle(anyLinked, "#b45309") }, "Unlink")
      );
    }

    let disclaimer = null;
    if (isHabitSec) {
      const excluded = (data.habits || []).filter(h =>
        h.section === ctx.section &&
        Array.isArray(h.slotSections) && h.slotSections.length >= 2
      );
      if (excluded.length > 0) {
        disclaimer = React.createElement("div", {
          style: {
            padding: "8px 12px", marginBottom: 12,
            background: "var(--c-tint-info-bg)", border: "1px solid var(--c-tint-info-border)",
            borderRadius: 8, fontSize: 12, color: "var(--c-tint-info-fg)", lineHeight: 1.4
          }
        }, excluded.length === 1
          ? "1 multi-slot habit isn't shown here — manage it via Edit habit."
          : excluded.length + " multi-slot habits aren't shown here — manage them via Edit habit."
        );
      }
    }

    let body;
    if (reorderDraft.length === 0) {
      body = React.createElement("div", {
        style: { fontSize: 13, color: "#9ca3af", padding: "18px 4px" }
      }, "Nothing to reorder yet.");
    } else {
      const childrenByParent = {};
      for (const cid of reorderDraft) {
        const cov = organizeOverrides[cid];
        const pid = cov && cov.parentId;
        if (!pid) continue;
        if (!childrenByParent[pid]) childrenByParent[pid] = [];
        childrenByParent[pid].push(cid);
      }
      const colorForId = (id) => {
        const ov = organizeOverrides[id] || {};
        const lookup = ov.parentId ? String(ov.parentId) : String(id);
        const it = itemsById.get(lookup);
        const ht = HT.find(t => t.value === (it && it.type));
        return ht || null;
      };
      body = React.createElement("div", {
        style: { display: "flex", flexDirection: "column", gap: 0, marginBottom: 16 }
      }, reorderDraft.flatMap((id, i) => {
        const it = itemsById.get(String(id));
        if (!it) return [];
        const isFirst = i === 0;
        const isLast = i === reorderDraft.length - 1;
        const ov = (isHabitSec && organizeOverrides[id]) || { parentId: "", concurrent: false };
        const prevId = i > 0 ? reorderDraft[i - 1] : null;
        const prevOv = prevId != null ? organizeOverrides[prevId] : null;
        const prevIsTopLevel = prevId != null && (!prevOv || !prevOv.parentId);
        const isSub = !!ov.parentId;
        const isConcurrent = !!ov.concurrent;
        const isParent = !!childrenByParent[id];
        const groupColor = colorForId(id);

        const toggleSub = () => {
          if (!isHabitSec) return;
          setOrganizeOverrides(p => {
            const cur = p[id] || { parentId: "", concurrent: false };
            if (cur.parentId) return { ...p, [id]: { ...cur, parentId: "" } };
            if (!prevId || !prevIsTopLevel) return p;
            return { ...p, [id]: { ...cur, parentId: String(prevId), concurrent: false } };
          });
        };
        const toggleConcurrent = () => {
          if (!isHabitSec) return;
          setOrganizeOverrides(p => {
            const cur = p[id] || { parentId: "", concurrent: false };
            if (cur.concurrent) return { ...p, [id]: { ...cur, concurrent: false } };
            if (!prevId || cur.parentId) return p;
            return { ...p, [id]: { ...cur, concurrent: true } };
          });
        };
        const isSelected = isHabitSec && organizeSelection.includes(id);
        const toggleSelection = () => {
          if (!isHabitSec) return;
          setOrganizeSelection(prev => prev.includes(id)
            ? prev.filter(x => x !== id)
            : [...prev, id]);
        };

        const out = [];
        if (!isFirst && !isConcurrent) {
          out.push(React.createElement("div", {
            key: "spacer-" + id, "aria-hidden": true,
            style: { height: 6 }
          }));
        }
        if (!isFirst && isConcurrent) {
          out.push(React.createElement("div", {
            key: "bridge-" + id, "aria-hidden": true,
            style: { position: "relative", height: 18, display: "flex", alignItems: "center", justifyContent: "center" }
          },
            React.createElement("div", {
              style: { position: "absolute", left: 16, right: 16, top: 0, bottom: 0, display: "flex", alignItems: "center" }
            },
              React.createElement("div", {
                style: { flex: 1, height: 0, borderTop: "2px dashed #93c5fd" }
              })
            ),
            React.createElement("span", {
              style: {
                position: "relative", background: "#dbeafe", border: "1px solid #93c5fd",
                color: "#1d4ed8", fontSize: 9, fontWeight: 700,
                letterSpacing: 0.4, textTransform: "uppercase",
                padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap"
              }
            }, "⇶ Same time")
          ));
        }
        const familyColor = (isParent || isSub) && groupColor ? groupColor.color : null;
        const familyTint  = (isParent || isSub) && groupColor ? groupColor.bg    : null;
        const leftBar =
          isSelected   ? "3px solid #15803d"
          : familyColor ? "4px solid " + familyColor
          : isConcurrent ? "3px solid #93c5fd"
          : "1px solid var(--c-border)";
        const rowBg =
          isSelected ? "#dcfce7"
          : familyTint ? familyTint
          : isConcurrent ? "#eff6ff"
          : "var(--c-surface-raised)";
        out.push(React.createElement("div", {
          key: id,
          onClick: isHabitSec ? toggleSelection : undefined,
          style: {
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 10px", paddingLeft: isSub ? 22 : 10,
            background: rowBg,
            border: "1px solid " + (isSelected ? "#86efac" : (isConcurrent ? "#bfdbfe" : "var(--c-border)")),
            borderLeft: leftBar, borderRadius: 8,
            cursor: isHabitSec ? "pointer" : "default", userSelect: "none"
          }
        },
          isHabitSec && React.createElement("span", {
            "aria-hidden": true,
            style: {
              width: 16, height: 16, flexShrink: 0, borderRadius: 4,
              border: "1.5px solid " + (isSelected ? "#15803d" : "#d1d5db"),
              background: isSelected ? "#15803d" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1
            }
          }, isSelected ? "✓" : ""),
          React.createElement("span", {
            style: { fontSize: 11, fontWeight: 700, color: "#9ca3af", width: 22, textAlign: "center", flexShrink: 0 }
          }, i + 1),
          React.createElement("span", {
            style: { flex: 1, fontSize: 13, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
          }, (isSub ? "↳ " : "") + it.text + (isConcurrent ? " · ⇶" : "")),
          isHabitSec && React.createElement("button", {
            type: "button",
            "aria-label": isSub ? "Make top-level" : "Make sub-habit of previous",
            title: isSub ? "Tap to unindent — make this a top-level habit" : (prevIsTopLevel ? "Make this a sub-habit of the habit above" : "Move under a top-level habit first"),
            disabled: !isSub && !prevIsTopLevel,
            onClick: e => { e.stopPropagation(); toggleSub(); },
            style: {
              background: isSub ? "#dcfce7" : "none",
              border: "1px solid " + (isSub ? "#86efac" : "var(--c-border)"),
              borderRadius: 6, padding: "4px 6px",
              cursor: (!isSub && !prevIsTopLevel) ? "default" : "pointer",
              opacity: (!isSub && !prevIsTopLevel) ? 0.35 : 1,
              color: isSub ? "#15803d" : "var(--c-text-soft)",
              fontSize: 11, lineHeight: 1, fontWeight: 600
            }
          }, "↳"),
          isHabitSec && React.createElement("button", {
            type: "button",
            "aria-label": isConcurrent ? "Stop layering" : "Layer with previous",
            title: isConcurrent ? "Tap to stop layering" : (prevId && !ov.parentId ? "Run at the same time as the habit above" : "Pick a top-level row with a predecessor"),
            disabled: !isConcurrent && (!prevId || !!ov.parentId),
            onClick: e => { e.stopPropagation(); toggleConcurrent(); },
            style: {
              background: isConcurrent ? "#dbeafe" : "none",
              border: "1px solid " + (isConcurrent ? "#93c5fd" : "var(--c-border)"),
              borderRadius: 6, padding: "4px 6px",
              cursor: (!isConcurrent && (!prevId || !!ov.parentId)) ? "default" : "pointer",
              opacity: (!isConcurrent && (!prevId || !!ov.parentId)) ? 0.35 : 1,
              color: isConcurrent ? "#1d4ed8" : "var(--c-text-soft)",
              fontSize: 11, lineHeight: 1, fontWeight: 600
            }
          }, "⇶"),
          React.createElement("button", {
            type: "button",
            "aria-label": "Move up",
            disabled: isFirst,
            onClick: e => { e.stopPropagation(); moveDraftItem(id, -1); },
            style: {
              background: "none", border: "1px solid var(--c-border)", borderRadius: 6,
              padding: "4px 8px", cursor: isFirst ? "default" : "pointer",
              opacity: isFirst ? 0.35 : 1, color: "var(--c-text-soft)", fontSize: 12, lineHeight: 1
            }
          }, "▲"),
          React.createElement("button", {
            type: "button",
            "aria-label": "Move down",
            disabled: isLast,
            onClick: e => { e.stopPropagation(); moveDraftItem(id, 1); },
            style: {
              background: "none", border: "1px solid var(--c-border)", borderRadius: 6,
              padding: "4px 8px", cursor: isLast ? "default" : "pointer",
              opacity: isLast ? 0.35 : 1, color: "var(--c-text-soft)", fontSize: 12, lineHeight: 1
            }
          }, "▼")
        ));
        return out;
      }));
    }

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "reorder-title",
      overlayStyle: { background: "rgba(0,0,0,0.5)", zIndex: 310 },
      cardStyle: { background: "var(--c-surface, #fff)", borderRadius: "20px 20px 0 0", padding: "20px 18px 22px", maxWidth: 520, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,.2)" }
    },
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }
      },
        ctx.icon ? React.createElement("span", null, ctx.icon) : null,
        React.createElement("div", {
          id: "reorder-title",
          style: { flex: 1, fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", letterSpacing: 0.3, textTransform: "uppercase" }
        }, (isHabitSec ? "Organize " : "Reorder ") + ctx.label),
        React.createElement("button", {
          type: "button",
          "aria-label": "Close organize modal",
          "data-a11y-dialog-hide": true,
          style: {
            background: "var(--c-surface-muted)", border: "none", borderRadius: "50%",
            width: 28, height: 28, cursor: "pointer",
            fontSize: 14, color: "#6b7280",
            display: "flex", alignItems: "center", justifyContent: "center"
          }
        }, "×")
      ),
      React.createElement("div", {
        style: { fontSize: 12, color: "#6b7280", marginBottom: 14, lineHeight: 1.45 }
      }, isHabitSec
        ? "Tap a habit to select it. With 2+ selected, tap ↳ Group to make the first the parent of the rest, or ⇶ Layer to run them simultaneously. Drag-to-reorder is via ▲▼."
        : `Use the arrows to set the custom order for your ${ctx.label.toLowerCase()}. Saving switches the sort mode to Custom.`),
      bulkActionBar,
      disclaimer,
      body,
      React.createElement("div", {
        style: { display: "flex", gap: 8 }
      },
        React.createElement("button", {
          type: "button",
          "data-a11y-dialog-hide": true,
          style: { flex: 1, background: "var(--c-surface-muted)", border: "none", borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }
        }, "Cancel"),
        React.createElement("button", {
          type: "button",
          onClick: saveReorder,
          disabled: reorderDraft.length === 0,
          style: { flex: 2, background: "#2d5a2d", border: "none", borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 600, color: "#fff", cursor: reorderDraft.length === 0 ? "default" : "pointer", opacity: reorderDraft.length === 0 ? 0.5 : 1 }
        }, isHabitSec ? "Save & close" : "Save order")
      )
    );
  }

  window.ReorderCtxModal = ReorderCtxModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ReorderCtxModal };
  }
})();
