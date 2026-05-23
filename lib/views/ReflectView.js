// lib/views/ReflectView.js — Reflect (journaling) tab as an
// extracted module. Mirrors the inline render block in index.html
// at the `tab === "reflection"` branch (~lines 19049-19717) on a
// FROZEN prop signature:
//
//   ReflectView({ data, dispatch, deviceProfile, callbacks })
//
// - data           : full app data object (read-only here)
// - dispatch       : App's dispatch(transform) helper. Reserved for
//                    future migrations of write helpers into
//                    reflectDomain; today the writes flow through
//                    `callbacks` so App keeps owning save() / undo
//                    history / Firestore sanitization.
// - deviceProfile  : window.__deviceProfile snapshot. Not consumed
//                    today (no responsive forks in this view) but
//                    kept on the signature per the pattern doc.
// - callbacks      : flat object with the App-owned actions and
//                    primitives this view needs:
//                      onSaveEntry({ text, kind, goalId, tag, dateKey })
//                      onUpdateEntry(id, { text, tag })
//                      onDeleteEntry(id)
//                      onGenerateInsights()    // AI insights button
//                      onDismissInsights()     // close X on the panel
//                      onNavigateToBrief()     // "return to home" banner
//                      goals                   // data.goals shortcut for the picker
//                      tipTokens               // { S, IS, AB } shared design tokens
//                      VoiceMicButton          // App-provided component
//                      SC                      // App-provided save/cancel pair
//                      fmtD                    // App-provided date formatter
//                      tk                      // utils.js tk() for today key
//                      dk                      // utils.js dk() for date keys
//                      HT                      // habit-type list (for goal color)
//                      JTAGS                   // theme suggestion list
//                      AI_ENABLED              // boolean flag
//                      insights : {
//                        text,   // current ins string
//                        loading,
//                        visible
//                      }
//                      ui : {
//                        selDate,  // current selected date (App owns)
//                        yestJournalReviewed, // dailyRitual[today].yestJournalReviewed
//                      }
//
// View-local state (useState):
//   • jKind       — "daily" | "goal" | "other" — entry kind picker
//   • jTxt        — new-entry draft text
//   • jTag        — free-form theme when kind === "other"
//   • nGType      — selected goal id when kind === "goal"
//   • jFil        — "today" | "week" | "all" — Past Entries filter
//   • eJId        — id of the entry currently being edited (or null)
//   • eJTxt       — edit-mode draft text
//   • eJTag       — edit-mode theme
//   • jExp        — id of the entry expanded past 160 chars (or null)
//
// This view DOES NOT touch localStorage, Firestore, or window.* state.
// All persistence flows through callbacks so the extraction can be
// tested in Node without a browser environment.

function ReflectView({ data, dispatch, deviceProfile, callbacks }) {
  const cb = callbacks || {};
  const tokens = cb.tipTokens || {};
  const S = tokens.S || {};
  const IS = tokens.IS || {};
  const AB = tokens.AB || {};
  const VoiceMicButton = cb.VoiceMicButton || (() => null);
  const SC = cb.SC || (() => null);
  const fmtD = cb.fmtD || ((iso) => String(iso || ""));
  const HT = cb.HT || [];
  const JTAGS = cb.JTAGS || [];
  const AI_ENABLED = !!cb.AI_ENABLED;
  const insights = cb.insights || {};
  const ui = cb.ui || {};
  const goals = (cb.goals != null ? cb.goals : ((data && data.goals) || []));
  const tkFn = typeof cb.tk === "function" ? cb.tk : (typeof tk === "function" ? tk : () => "");
  const selDate = ui.selDate || tkFn();

  const [jKind, sJKind] = React.useState("daily");
  const [jTxt, sJTxt] = React.useState("");
  const [jTag, sJTag] = React.useState("reflection");
  const [nGType, sNGType] = React.useState("");
  const [jFil, sJFil] = React.useState("all");
  const [eJId, sEJId] = React.useState(null);
  const [eJTxt, sEJTxt] = React.useState("");
  const [eJTag, sEJTag] = React.useState("reflection");
  const [jExp, sJExp] = React.useState(null);

  const reflect = (typeof window !== "undefined" && window.reflectDomain)
    || (typeof reflectDomain !== "undefined" ? reflectDomain : null);

  // ── "Return to home review" banner ───────────────────────────
  const yestKey = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    // Use cb.dk if exposed, else assume the browser global.
    const dkFn = typeof cb.dk === "function" ? cb.dk : (typeof dk === "function" ? dk : null);
    return dkFn ? dkFn(d) : "";
  })();
  const todayKey = tkFn();
  const showReturnBanner = selDate === yestKey && !ui.yestJournalReviewed;
  const returnBanner = showReturnBanner && React.createElement("div", {
    onClick: () => { if (typeof cb.onNavigateToBrief === "function") cb.onNavigateToBrief(); },
    style: {
      display: "flex", alignItems: "center", gap: 10,
      background: "var(--c-tint-info-bg)",
      border: "1px solid var(--c-tint-info-border)",
      borderLeft: "4px solid var(--c-tint-info-fg)",
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 10,
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(29,78,216,.08)"
    }
  },
    React.createElement("span", { "aria-hidden": true, style: { fontSize: 16, color: "#1d4ed8", flexShrink: 0 } }, "←"),
    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.4 } }, "Writing yesterday's journal"),
      React.createElement("div", { style: { fontSize: 12, color: "#1e3a8a", lineHeight: 1.4 } }, "Capture how yesterday actually went, then tap here to return to the home page review.")
    ),
    React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#1d4ed8", flexShrink: 0 } }, "Home")
  );

  // ── Empty-state hint above "My Journal" ──────────────────────
  const journalArr = (data && data.journal) || [];
  const emptyHint = journalArr.length === 0 && React.createElement("div", {
    style: { padding: "32px 20px 20px", textAlign: "center", maxWidth: 480, margin: "0 auto" }
  },
    React.createElement("p", {
      style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: "var(--c-text-strong)", marginBottom: 0, lineHeight: 1.4 }
    }, "How are you today? Even one sentence counts.")
  );

  // ── Entry form (kind picker + textarea + Save) ───────────────
  const kindPicker = React.createElement("div", {
    style: { display: "flex", gap: 4, marginBottom: 10, background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 18, padding: 3 }
  },
    [
      { val: "daily", label: "Daily" },
      { val: "goal", label: "Goal-Specific" },
      { val: "other", label: "Other" }
    ].map(k => {
      const on = jKind === k.val;
      return React.createElement("button", {
        key: k.val,
        type: "button",
        onClick: () => sJKind(k.val),
        style: {
          flex: 1, minWidth: 0, padding: "5px 8px", borderRadius: 14,
          border: "1px solid " + (on ? "#2d5a2d" : "transparent"),
          background: on ? "var(--c-tint-success-bg)" : "transparent",
          color: on ? "#2d5a2d" : "var(--c-text-soft)",
          fontSize: 11, fontWeight: on ? 700 : 500,
          cursor: "pointer", textAlign: "center"
        }
      }, k.label);
    })
  );

  const goalSelector = jKind === "goal" && React.createElement("select", {
    value: nGType,
    onChange: e => sNGType(e.target.value),
    style: {
      ...S,
      width: "100%",
      marginBottom: 8,
      color: (HT.find(t => t.value === nGType) || {}).color || "var(--c-text-soft)"
    }
  },
    React.createElement("option", { value: "" }, "Select a goal (optional)"),
    goals.map(g => React.createElement("option", { key: g.id, value: g.id }, (g.text || "").slice(0, 50)))
  );

  const themeInput = jKind === "other" && React.createElement("div", {
    style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }
  },
    React.createElement("span", { style: { fontSize: 10, fontWeight: 700, color: "var(--c-text-soft)", textTransform: "uppercase", letterSpacing: 0.4, flexShrink: 0 } }, "Theme"),
    React.createElement("input", {
      type: "text",
      value: jTag || "",
      onChange: e => sJTag(e.target.value.replace(/[\r\n]/g, "")),
      placeholder: "reflection, gratitude, travel…",
      list: "journal-theme-suggestions-new",
      style: { ...IS, flex: 1, minWidth: 0, fontSize: 12, padding: "6px 10px" }
    }),
    React.createElement("datalist", { id: "journal-theme-suggestions-new" },
      JTAGS.map(t => React.createElement("option", { key: t, value: t }))
    )
  );

  const micRow = React.createElement("div", {
    style: { display: "flex", justifyContent: "flex-end", marginBottom: 6 }
  },
    React.createElement(VoiceMicButton, {
      label: "Dictate journal entry",
      onTranscript: (txt) => sJTxt(prev => (prev && prev.trim() ? prev.trimEnd() + " " : "") + txt)
    })
  );

  const textarea = React.createElement("textarea", {
    value: jTxt,
    onChange: e => sJTxt(e.target.value),
    placeholder: jKind === "goal"
      ? "Progress, obstacles, reflections on this goal… (or tap the mic)"
      : "What happened today? What are you grateful for? What did you learn? (or tap the mic)",
    rows: 4,
    "data-tour": "reflect-input",
    style: {
      width: "100%",
      background: "var(--c-surface-raised)",
      border: "1px solid var(--c-border)",
      borderRadius: 8,
      padding: "10px 12px",
      color: "var(--c-text)",
      fontSize: 13,
      lineHeight: 1.7,
      marginBottom: 10,
      outline: "none",
      fontFamily: "system-ui,-apple-system,sans-serif",
      resize: "none",
      boxSizing: "border-box"
    }
  });

  const saveButton = React.createElement("div", {
    style: { display: "flex", justifyContent: "flex-end" }
  },
    React.createElement("button", {
      onClick: () => {
        if (!jTxt.trim()) return;
        const text = jTxt.trim();
        const tag = jKind === "daily"
          ? "daily-recap"
          : jKind === "goal"
            ? "goals"
            : ((jTag && jTag.trim()) || "reflection");
        if (typeof cb.onSaveEntry === "function") {
          cb.onSaveEntry({
            text,
            kind: jKind,
            goalId: jKind === "goal" ? (nGType || null) : null,
            tag,
            dateKey: selDate || tkFn()
          });
        }
        sJTxt("");
        if (jKind === "goal") sNGType("");
        if (jKind === "other") sJTag("");
      },
      style: { ...AB, padding: "8px 18px", fontSize: 12 }
    }, "Save Entry")
  );

  const myJournalHeader = React.createElement("div", {
    className: "card-title",
    style: { fontSize: 15, color: "var(--c-text-strong)", marginBottom: 10 }
  }, "My Journal");

  const entryForm = React.createElement("div", {
    style: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "14px",
      marginBottom: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,.04)"
    }
  }, kindPicker, goalSelector, themeInput, micRow, textarea, saveButton);

  // ── Filter pills + AI insights button ────────────────────────
  const filtersRow = (() => {
    const selSD = new Date(selDate + "T12:00:00");
    const sameYear = selSD.getFullYear() === new Date().getFullYear();
    const fmtOpts = sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" };
    const dayIdx = selSD.getDay();
    const wStart = new Date(selSD); wStart.setDate(selSD.getDate() - dayIdx); wStart.setHours(0, 0, 0, 0);
    const now = new Date();
    const curStart = new Date(now); curStart.setDate(now.getDate() - now.getDay()); curStart.setHours(0, 0, 0, 0);
    const todayLabel = selDate === tkFn() ? "Today" : selSD.toLocaleDateString("en-US", fmtOpts);
    const weekLabel = wStart.getTime() === curStart.getTime() ? "This Week" : "Week of " + wStart.toLocaleDateString("en-US", fmtOpts);
    const insightsEligible = AI_ENABLED && journalArr.filter(e => e.tag === "general" || !e.tag).length >= 5;
    return React.createElement("div", {
      style: { display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }
    },
      [{ k: "today", l: todayLabel }, { k: "week", l: weekLabel }, { k: "all", l: "All" }].map(f =>
        React.createElement("button", {
          key: f.k,
          onClick: () => sJFil(f.k),
          style: {
            padding: "4px 12px",
            borderRadius: 20,
            border: `1px solid ${jFil === f.k ? "#2d5a2d" : "var(--c-border)"}`,
            background: jFil === f.k ? "var(--c-tint-success-bg)" : "#fff",
            fontSize: 11,
            color: jFil === f.k ? "#2d5a2d" : "#6b7280",
            fontWeight: jFil === f.k ? 600 : 400,
            cursor: "pointer"
          }
        }, f.l)
      ),
      insightsEligible && React.createElement("button", {
        onClick: () => { if (typeof cb.onGenerateInsights === "function") cb.onGenerateInsights(); },
        style: {
          marginLeft: "auto",
          background: "#2d5a2d",
          border: "none",
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 600,
          color: "#fff",
          cursor: "pointer"
        }
      }, "✨ Insights")
    );
  })();

  // ── Insights panel ───────────────────────────────────────────
  const insightsPanel = AI_ENABLED && insights.visible && React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,#f0f7f0,#f5faf5)",
      border: "1px solid var(--c-tint-success-border)",
      borderRadius: 12,
      padding: "14px",
      marginBottom: 12
    }
  },
    React.createElement("div", {
      style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }
    },
      React.createElement("div", {
        className: "card-title",
        style: { fontSize: 14, color: "#2d5a2d" }
      }, "Journal Insights"),
      React.createElement("button", {
        "aria-label": "Close",
        onClick: () => { if (typeof cb.onDismissInsights === "function") cb.onDismissInsights(); },
        style: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 18, lineHeight: 1 }
      }, "\xD7")
    ),
    insights.loading
      ? React.createElement("div", {
          className: "pulsing",
          style: { textAlign: "center", padding: "16px", color: "#9ca3af", fontSize: 13 }
        }, "Analyzing…")
      : React.createElement("div", {
          style: { fontSize: 13, lineHeight: 1.75, color: "var(--c-text-soft)", whiteSpace: "pre-wrap" }
        }, insights.text || "")
  );

  // ── Past Entries feed ────────────────────────────────────────
  const pastFeed = (() => {
    const totalEntries = reflect
      ? reflect.pastEntriesCount(data)
      : journalArr.length;
    const filtered = reflect
      ? reflect.entriesForFilter(data, jFil, selDate)
      : journalArr;
    const filterLabel = jFil === "today" ? "today" : jFil === "week" ? "this week" : "";
    return React.createElement("div", { style: { marginBottom: 24 } },
      totalEntries > 0 && React.createElement("div", {
        style: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }
      },
        React.createElement("div", {
          className: "card-title",
          style: { fontSize: 14, color: "var(--c-text-strong)" }
        }, "Past Entries"),
        React.createElement("div", {
          style: { fontSize: 11, color: "var(--c-text-faint)", fontVariantNumeric: "tabular-nums" }
        }, filtered.length === totalEntries
          ? filtered.length + " total"
          : filtered.length + " of " + totalEntries + (filterLabel ? " · " + filterLabel : ""))
      ),
      filtered.length === 0
        ? React.createElement("div", {
            style: { textAlign: "center", color: "var(--c-text-faint)", fontSize: 13, padding: "24px 0", lineHeight: 1.5 }
          }, totalEntries === 0
            ? "No entries yet — write your first above."
            : "No entries " + (filterLabel || "in this view") + ". Tap “All” to see your full history (" + totalEntries + ").")
        : React.createElement("div", {
            style: { display: "flex", flexDirection: "column", gap: 6 }
          }, [...filtered].reverse().map(entry => {
            const isE = eJId === entry.id;
            const isX = jExp === entry.id;
            const startEdit = () => {
              sEJId(entry.id);
              sEJTxt(entry.text || "");
              sEJTag(entry.tag || "reflection");
            };
            const saveEdit = () => {
              if (!eJTxt.trim()) return;
              if (typeof cb.onUpdateEntry === "function") {
                cb.onUpdateEntry(entry.id, { text: eJTxt.trim(), tag: eJTag });
              }
              sEJId(null);
            };
            return React.createElement("div", {
              key: entry.id,
              className: "ecard",
              style: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 1px 2px rgba(0,0,0,.04)" }
            },
              React.createElement("div", { style: { padding: "10px 12px" } },
                React.createElement("div", {
                  style: { display: "flex", alignItems: "center", gap: 8, marginBottom: isE ? 8 : 4 }
                },
                  React.createElement("span", {
                    style: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#9ca3af", flex: 1 }
                  }, fmtD(entry.timestamp)),
                  !isE && entry.tag && entry.tag !== "general" && React.createElement("span", {
                    style: { fontSize: 9, fontWeight: 700, color: "#2d5a2d", background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 8, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.4 }
                  }, entry.tag),
                  !isE && React.createElement(React.Fragment, null,
                    React.createElement("button", {
                      className: "e-edit",
                      onClick: startEdit,
                      "aria-label": "Edit entry",
                      style: { background: "var(--c-surface-muted)", border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", color: "#6b7280", fontSize: 12, lineHeight: 1, padding: "4px 6px" }
                    }, "✎"),
                    React.createElement("button", {
                      className: "e-del",
                      onClick: () => { if (typeof cb.onDeleteEntry === "function") cb.onDeleteEntry(entry.id); },
                      "aria-label": "Delete entry",
                      style: { background: "var(--c-surface-muted)", border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer", color: "#9ca3af", fontSize: 14, lineHeight: 1, padding: "4px 7px" }
                    }, "\xD7")
                  )
                ),
                isE
                  ? React.createElement("div", null,
                      React.createElement("div", {
                        style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }
                      },
                        React.createElement("span", {
                          style: { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, flexShrink: 0 }
                        }, "Theme"),
                        React.createElement("input", {
                          type: "text",
                          value: eJTag || "",
                          onChange: e => sEJTag(e.target.value.replace(/[\r\n]/g, "")),
                          placeholder: "reflection, gratitude, or your own…",
                          list: "journal-theme-suggestions",
                          style: { ...IS, flex: 1, minWidth: 0, fontSize: 12 }
                        }),
                        React.createElement("datalist", { id: "journal-theme-suggestions" },
                          JTAGS.map(t => React.createElement("option", { key: t, value: t }))
                        )
                      ),
                      React.createElement("textarea", {
                        value: eJTxt,
                        onChange: e => sEJTxt(e.target.value),
                        rows: 3,
                        autoFocus: true,
                        style: { width: "100%", background: "var(--c-surface-raised)", border: "1px solid #2d5a2d", borderRadius: 8, padding: "8px", color: "var(--c-text)", fontSize: 13, lineHeight: 1.6, outline: "none", marginBottom: 8, resize: "none" }
                      }),
                      React.createElement(SC, { onSave: saveEdit, onCancel: () => sEJId(null) })
                    )
                  : React.createElement(React.Fragment, null,
                      React.createElement("div", {
                        style: { fontSize: 13, color: "var(--c-text-soft)", lineHeight: 1.7, whiteSpace: "pre-wrap" }
                      }, isX ? entry.text : (entry.text && entry.text.length > 160 ? entry.text.slice(0, 160) + "…" : entry.text)),
                      entry.text && entry.text.length > 160 && React.createElement("button", {
                        onClick: () => sJExp(p => p === entry.id ? null : entry.id),
                        style: { background: "none", border: "none", color: "#2d5a2d", fontSize: 11, cursor: "pointer", padding: "3px 0" }
                      }, isX ? "▲ Less" : "▼ More")
                    )
              )
            );
          })
        )
    );
  })();

  return React.createElement("div", { className: "fade-in" },
    returnBanner,
    emptyHint,
    myJournalHeader,
    entryForm,
    filtersRow,
    insightsPanel,
    pastFeed
  );
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ReflectView };
} else if (typeof window !== "undefined") {
  window.ReflectView = ReflectView;
}
