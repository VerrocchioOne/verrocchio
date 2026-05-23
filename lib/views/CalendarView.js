// lib/views/CalendarView.js — full-screen Calendar modal extracted from
// index.html L21345-L22216. Phase B of v75 view extraction.
//
// FROZEN prop signature (per docs/superpowers/patterns/view-extraction.md):
//   CalendarView({ data, dispatch, deviceProfile, callbacks })
//
// `callbacks` (per spec §3 Calendar row + render-block audit):
//   onClose         — () => void         // App: setCalendarModalOpen(false)
//   onExportICS     — () => void         // App-scope exportHabitsICS — preserved as
//                                        //   callback because the .ics builder reaches
//                                        //   into App state (save plumbing); not extracted
//   onOpenDayDetail — (dateKey) => void  // App: setCalendarDetailDate(k) +
//                                        //   touchFeature("calendar.daySnapshot");
//                                        //   the Snapshot dialog itself is rendered at
//                                        //   App level outside this view
//   onTogHabit      — (habitId) => void  // reserved cross-domain handler from spec §3;
//                                        //   not currently called by the inline render,
//                                        //   kept on the contract for future enhancements
//
// View-local useState:
//   - calendarView   — "day" | "week" | "month"  (the body toggle)
//   - focusKey       — "YYYY-MM-DD" — the date the user is browsing
//
// IMPORTANT:
//   - The view ONLY renders when its parent gates `calendarModalOpen && <CalendarView/>`.
//     The view does not own the open flag — App does, and toggles render.
//   - The day-detail Snapshot dialog (mounted at App level via calendarDetailDate state)
//     is NOT inside this view. The view fires `onOpenDayDetail(k)`; App lifts the rest.
//
// Coupling notes for Phase C:
//   - CSS tokens (var(--c-*)) are unchanged from the original render — dark-mode rides
//     on those. No new untokenized colors introduced.
//   - HT (area-of-life palette) is duplicated locally for self-containment so the view
//     can render without a Script-scope dependency. Kept in sync with index.html L1377.
//   - Importance dot colors mirror the inline `impColor` at L21384.

(function () {
  "use strict";

  // ── pure helpers (local) ───────────────────────────────────────────────

  // Local YYYY-MM-DD for a Date — mirrors utils.js `dk`.
  const dkLocal = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  };
  const tkLocal = () => dkLocal(new Date());

  // Area-of-life palette — kept in sync with index.html L1377 (HT).
  const HT_LOCAL = [
    { value: "Physical",  color: "var(--c-tint-success-fg)", bg: "var(--c-tint-success-bg)", border: "var(--c-tint-success-border)" },
    { value: "Mental",    color: "var(--c-tint-travel-fg)",  bg: "var(--c-tint-travel-bg)",  border: "var(--c-tint-travel-border)"  },
    { value: "Career",    color: "var(--c-tint-info-fg)",    bg: "var(--c-tint-info-bg)",    border: "var(--c-tint-info-border)"    },
    { value: "Spiritual", color: "var(--c-tint-purple-fg)",  bg: "var(--c-tint-purple-bg)",  border: "var(--c-tint-purple-border)"  },
    { value: "Social",    color: "var(--c-tint-pink-fg)",    bg: "var(--c-tint-pink-bg)",    border: "var(--c-tint-pink-border)"    },
    { value: "Wealth",    color: "var(--c-tint-warn-fg)",    bg: "var(--c-tint-warn-bg)",    border: "var(--c-tint-warn-border)"    },
    { value: "Creative",  color: "var(--c-tint-teal-fg)",    bg: "var(--c-tint-teal-bg)",    border: "var(--c-tint-teal-border)"    }
  ];
  const NEUTRAL_AREA = { color: "#6b7280", bg: "#f3f4f6", border: "var(--c-border)" };
  const areaOf = h => HT_LOCAL.find(t => t.value === (h && h.type)) || NEUTRAL_AREA;

  const DEFAULT_RANGES = {
    morning:   { start: 6,  end: 12 },
    afternoon: { start: 12, end: 18 },
    evening:   { start: 18, end: 6  }
  };
  const rangesFor = data => {
    const t = data && data.timeRanges;
    return (t && t.morning && t.afternoon && t.evening) ? t : DEFAULT_RANGES;
  };

  // Minutes-since-midnight → "6:30am" / "12pm".
  const fmtMins = mins => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const h12 = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? "am" : "pm";
    return h12 + (m === 0 ? "" : ":" + String(m).padStart(2, "0")) + ampm;
  };
  const fmtHour = h => {
    const h12 = ((h + 11) % 12) + 1;
    return h12 + (h < 12 ? "am" : "pm");
  };

  // Importance → dot color (matches index.html L21384 `impColor`).
  const impColor = imp =>
    imp === "Non-Negotiable" ? "#dc2626" :
    imp === "Additive"       ? "#16a34a" :
                               "#eab308";

  // Importance "stoplight" stripe pattern (matches index.html L21480 `impStripe`).
  const impStripe = (imp, area) => {
    if (imp === "Important") {
      return {
        background: "repeating-linear-gradient(45deg, " + area.color + " 0 3px, " + area.color + "55 3px 6px)"
      };
    }
    if (imp === "Additive") {
      return { background: "transparent", border: "1.5px solid " + area.color, boxSizing: "border-box" };
    }
    return { background: area.color };
  };

  // Frequency abbreviation for the per-slot meta tail.
  const freqLabel = h => {
    const t = h && h.frequency && h.frequency.type;
    if (t === "weekdays")  return "Weekdays";
    if (t === "weekly" || t === "weekly-day") return "Weekly";
    if (t === "monthly")   return "Monthly";
    if (t === "quarterly") return "Quarterly";
    if (t === "annual")    return "Annual";
    return "Daily";
  };

  const fmtDate = (d, opts) =>
    d.toLocaleDateString(undefined, opts || { weekday: "short", month: "short", day: "numeric" });

  // ── component ──────────────────────────────────────────────────────────

  function CalendarView(props) {
    const data = props.data || {};
    const callbacks = props.callbacks || {};
    const onClose = callbacks.onClose || function () {};
    const onExportICS = callbacks.onExportICS || function () {};
    const onOpenDayDetail = callbacks.onOpenDayDetail || function () {};
    // onTogHabit reserved for future cell-tap completion toggles.

    const cd = (typeof window !== "undefined" && window.calendarDomain) || {};
    const monthGrid = cd.monthGrid || function () { return []; };
    const habitsDueOnDay = cd.habitsDueOnDay || function () { return []; };

    // ── view-local state ────────────────────────────────────────────────
    // §13.4a (v75) — initial state seeded from callbacks if provided. Lets App's
    // openCalendarMonthForTest hook (and the day/week deep-link sites at
    // index.html L13369 + L15329) prime the view via setCalendarView()/
    // setCalendarFocus() on App-scope state, which is then passed in here as
    // initialView/initialFocus. After mount, the view owns its own state; App's
    // setters no longer reach it (the view remounts when calendarModalOpen
    // toggles from false to true, so initial values re-seed each open).
    const [calendarView, setCalendarView] = React.useState(
      (callbacks && callbacks.initialView) || "month"
    );
    const [focusKey, setFocusKey] = React.useState(
      () => (callbacks && callbacks.initialFocus) || tkLocal()
    );

    const focusDate = React.useMemo(() => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(focusKey);
      if (!m) return new Date();
      return new Date(+m[1], +m[2] - 1, +m[3]);
    }, [focusKey]);

    const ranges = rangesFor(data);

    const moveFocus = days => {
      const d = new Date(focusDate);
      d.setDate(d.getDate() + days);
      setFocusKey(dkLocal(d));
    };
    const moveMonth = months => {
      const d = new Date(focusDate);
      d.setMonth(d.getMonth() + months);
      setFocusKey(dkLocal(d));
    };

    const dueOnFocus = habitsDueOnDay(data, focusKey);

    // ── header pieces ───────────────────────────────────────────────────
    const viewBtn = (id, label) => React.createElement("button", {
      key: id,
      type: "button",
      onClick: () => setCalendarView(id),
      style: {
        flex: 1, padding: "8px 10px", fontSize: 12, fontWeight: 700,
        border: "1px solid " + (calendarView === id ? "#2d5a2d" : "var(--c-border)"),
        background: calendarView === id ? "var(--c-tint-success-bg)" : "#fff",
        color: calendarView === id ? "#2d5a2d" : "#6b7280",
        borderRadius: 8, cursor: "pointer"
      }
    }, label);

    const navBtn = (label, onClick, dim) => React.createElement("button", {
      type: "button",
      onClick: onClick,
      "aria-label": label,
      style: {
        background: "var(--c-surface-raised)", border: "1px solid var(--c-border)",
        borderRadius: 8, padding: "6px 10px", fontSize: 14, cursor: "pointer",
        color: dim ? "#9ca3af" : "var(--c-text)"
      }
    }, label);

    const rangeLabel = (function () {
      if (calendarView === "day") {
        return fmtDate(focusDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      }
      if (calendarView === "week") {
        const start = new Date(focusDate);
        start.setDate(focusDate.getDate() - focusDate.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return fmtDate(start, { month: "short", day: "numeric" })
             + " — "
             + fmtDate(end, { month: "short", day: "numeric", year: "numeric" });
      }
      return focusDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    })();

    const stepBack = () => {
      if (calendarView === "day")       moveFocus(-1);
      else if (calendarView === "week") moveFocus(-7);
      else                              moveMonth(-1);
    };
    const stepFwd = () => {
      if (calendarView === "day")       moveFocus(1);
      else if (calendarView === "week") moveFocus(7);
      else                              moveMonth(1);
    };

    // ── month grid renderer ─────────────────────────────────────────────
    const renderMonth = () => {
      const cells = monthGrid(data, focusDate.getFullYear(), focusDate.getMonth(), tkLocal());
      return React.createElement("div", null,
        React.createElement("div", {
          style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }
        }, ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d =>
          React.createElement("div", {
            key: d,
            style: { textAlign: "center", fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", padding: "4px 0" }
          }, d)
        )),
        React.createElement("div", {
          style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }
        }, cells.map(c => c.blank
          ? React.createElement("div", { key: c.key, style: { aspectRatio: "1 / 1.15" } })
          : React.createElement("button", {
              key: c.key,
              type: "button",
              onClick: () => {
                setFocusKey(c.k);
                onOpenDayDetail(c.k);
              },
              style: {
                aspectRatio: "1 / 1.15",
                display: "flex", flexDirection: "column", alignItems: "stretch",
                gap: 2,
                background: c.k === focusKey ? "#2d5a2d" : c.isToday ? "var(--c-tint-success-bg)" : "#fff",
                color: c.k === focusKey ? "#fff" : "var(--c-text)",
                border: "1px solid " + (c.isToday ? "#86efac" : "var(--c-border)"),
                borderRadius: 8, cursor: "pointer", padding: "3px 4px",
                fontSize: 11, fontWeight: c.isToday ? 700 : 500,
                overflow: "hidden", textAlign: "left"
              }
            },
              React.createElement("span", {
                style: { fontSize: 11, fontWeight: c.isToday ? 700 : 500 }
              }, c.dayNum),
              // Goal chips.
              c.goals.length > 0 && React.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 1 }
              }, c.goals.slice(0, 2).map(g => {
                const ht = HT_LOCAL.find(t => t.value === g.type);
                const fg = c.k === focusKey ? "#fff" : (ht ? ht.color : "#7c3aed");
                const bg = c.k === focusKey ? "rgba(255,255,255,0.18)" : (ht ? ht.bg : "#f5f3ff");
                return React.createElement("div", {
                  key: "g-" + g.id,
                  title: g.text,
                  style: {
                    fontSize: 8, fontWeight: 700,
                    color: fg, background: bg,
                    borderRadius: 3, padding: "1px 3px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    lineHeight: 1.3
                  }
                }, "🎯 " + g.text);
              })),
              // Sparse habit chips.
              c.due.length > 0 && React.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 1, marginTop: c.goals.length > 0 ? 1 : 0 }
              }, c.due.slice(0, 2).map(slot => {
                const ht = HT_LOCAL.find(t => t.value === slot.habit.type);
                const fg = c.k === focusKey ? "#fff" : (ht ? ht.color : "#6b7280");
                const bg = c.k === focusKey ? "rgba(255,255,255,0.14)" : (ht ? ht.bg : "var(--c-surface-muted)");
                return React.createElement("div", {
                  key: "h-" + slot.habit.id,
                  title: slot.habit.text,
                  style: {
                    fontSize: 8, fontWeight: 600,
                    color: fg, background: bg,
                    borderRadius: 3, padding: "1px 3px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    lineHeight: 1.3
                  }
                }, slot.habit.text);
              })),
              // Overflow indicator.
              ((c.goals.length + c.due.length) > 4) && React.createElement("div", {
                style: { fontSize: 8, color: c.k === focusKey ? "rgba(255,255,255,0.7)" : "#9ca3af", fontWeight: 600 }
              }, "+ " + ((c.goals.length + c.due.length) - 4) + " more")
            )
        ))
      );
    };

    // ── week grid renderer ──────────────────────────────────────────────
    const renderWeek = () => {
      const start = new Date(focusDate);
      start.setDate(focusDate.getDate() - focusDate.getDay());
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const k = dkLocal(d);
        days.push({ d, k, due: habitsDueOnDay(data, k), isToday: k === tkLocal() });
      }
      const morningStart   = (ranges.morning   && ranges.morning.start   != null) ? ranges.morning.start   : 6;
      const afternoonStart = (ranges.afternoon && ranges.afternoon.start != null) ? ranges.afternoon.start : 12;
      const eveningStart   = (ranges.evening   && ranges.evening.start   != null) ? ranges.evening.start   : 18;
      const dayStartHour = Math.max(0, Math.min(morningStart, afternoonStart, eveningStart, 6) - 1);
      const dayEndHour = 24;
      const pxPerMin = 0.7;
      const hours = [];
      for (let h = dayStartHour; h < dayEndHour; h++) hours.push(h);
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      return React.createElement("div", {
        style: {
          overflowX: "auto", overflowY: "auto",
          maxHeight: "calc(min(90vh, 90dvh) - 200px)",
          border: "1px solid var(--c-border)", borderRadius: 10,
          background: "var(--c-surface, #fff)"
        }
      },
        React.createElement("div", {
          style: { minWidth: 540, position: "relative" }
        },
          // Sticky day-column header.
          React.createElement("div", {
            style: {
              display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)",
              position: "sticky", top: 0, zIndex: 2,
              background: "var(--c-surface, #fff)",
              borderBottom: "1px solid var(--c-border)"
            }
          },
            React.createElement("div", { key: "hdr-corner", style: { borderRight: "1px solid #f3f4f6" } }),
            ...days.map(day => React.createElement("button", {
              key: "hdr-" + day.k,
              type: "button",
              onClick: () => setFocusKey(day.k),
              style: {
                background: day.k === focusKey ? "var(--c-tint-success-bg)" : (day.isToday ? "#f0fdf4" : "transparent"),
                border: "none",
                borderLeft: "1px solid #f3f4f6",
                cursor: "pointer",
                padding: "6px 2px",
                textAlign: "center",
                color: day.isToday ? "#2d5a2d" : (day.k === focusKey ? "#2d5a2d" : "#6b7280")
              }
            },
              React.createElement("div", { style: { fontSize: 9, fontWeight: 700, opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.4 } }, dayLabels[day.d.getDay()]),
              React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, day.d.getDate())
            ))
          ),
          // Time grid + floating blocks.
          React.createElement("div", {
            style: {
              display: "grid",
              gridTemplateColumns: "44px repeat(7, 1fr)",
              gridAutoRows: (60 * pxPerMin) + "px",
              position: "relative"
            }
          },
            ...hours.flatMap(h => {
              const row = [
                React.createElement("div", {
                  key: "tlbl-" + h,
                  style: {
                    fontSize: 9, color: "#9ca3af",
                    textAlign: "right",
                    paddingTop: 2, paddingRight: 5,
                    borderRight: "1px solid var(--c-border)",
                    borderBottom: h === dayEndHour - 1 ? "none" : "1px solid #f3f4f6",
                    fontVariantNumeric: "tabular-nums"
                  }
                }, fmtHour(h))
              ];
              for (let di = 0; di < 7; di++) {
                row.push(React.createElement("div", {
                  key: "cell-" + h + "-" + di,
                  style: {
                    borderLeft: "1px solid #f3f4f6",
                    borderBottom: h === dayEndHour - 1 ? "none" : "1px solid #f3f4f6",
                    background: days[di].k === focusKey ? "rgba(45,90,45,0.04)" : "transparent"
                  }
                }));
              }
              return row;
            }),
            React.createElement("div", {
              key: "blocks",
              style: { position: "absolute", inset: 0, pointerEvents: "none" }
            }, days.flatMap((day, di) => {
              const byStart = new Map();
              for (const slot of day.due) {
                const k = slot.startMin;
                if (!byStart.has(k)) byStart.set(k, []);
                byStart.get(k).push(slot);
              }
              return day.due.map(slot => {
                const peers = byStart.get(slot.startMin) || [slot];
                const idx = peers.indexOf(slot);
                const cols = peers.length;
                const a = areaOf(slot.habit);
                const top = Math.max(0, (slot.startMin - dayStartHour * 60) * pxPerMin);
                const height = Math.max(10, slot.durationMin * pxPerMin - 1);
                const leftBase = "calc(44px + " + di + " * (100% - 44px) / 7)";
                const colWidth = "calc((100% - 44px) / 7)";
                const sliceLeft = "calc(" + leftBase + " + " + idx + " * (" + colWidth + " / " + cols + "))";
                const sliceWidth = "calc(" + colWidth + " / " + cols + " - 2px)";
                return React.createElement("div", {
                  key: "blk-" + day.k + "-" + slot.habit.id,
                  title: slot.habit.text + " · " + fmtMins(slot.startMin) + "–" + fmtMins(slot.endMin),
                  style: {
                    position: "absolute",
                    top: top + "px",
                    left: sliceLeft,
                    width: sliceWidth,
                    height: height + "px",
                    background: a.bg,
                    border: "1px solid " + a.border,
                    borderLeft: "3px solid " + a.color,
                    borderRadius: 4,
                    fontSize: 9,
                    color: a.color,
                    padding: "2px 4px",
                    overflow: "hidden",
                    pointerEvents: "auto",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                  }
                },
                  React.createElement("div", {
                    style: { fontWeight: 700, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                  }, slot.displayName || slot.habit.text)
                );
              });
            }))
          )
        )
      );
    };

    // ── Outlook-style day timeline ──────────────────────────────────────
    const renderDay = () => {
      const morningStart   = (ranges.morning   && ranges.morning.start   != null) ? ranges.morning.start   : 6;
      const afternoonStart = (ranges.afternoon && ranges.afternoon.start != null) ? ranges.afternoon.start : 12;
      const eveningStart   = (ranges.evening   && ranges.evening.start   != null) ? ranges.evening.start   : 18;
      const dayStartHour = Math.max(0, Math.min(morningStart, afternoonStart, eveningStart, 6) - 1);
      const dayEndHour = 24;
      const totalMin = (dayEndHour - dayStartHour) * 60;
      const pxPerMin = 1;
      const colHeight = totalMin * pxPerMin;
      const hours = [];
      for (let h = dayStartHour; h < dayEndHour; h++) hours.push(h);

      const sectionIcon = sec =>
        sec === "morning"   ? "🌅" :
        sec === "afternoon" ? "☀️" :
        sec === "evening"   ? "🌙" : "•";

      return React.createElement("div", {
        style: { display: "flex", gap: 8, alignItems: "stretch", marginBottom: 8 }
      },
        // Timeline column.
        React.createElement("div", {
          style: {
            flex: "0 0 88px",
            position: "relative",
            height: colHeight + "px",
            overflowY: "auto",
            border: "1px solid var(--c-border)",
            borderRadius: 10,
            background: "var(--c-surface, #fff)"
          }
        },
          hours.map(h => React.createElement("div", {
            key: "hr-" + h,
            style: {
              position: "absolute",
              top: ((h - dayStartHour) * 60 * pxPerMin) + "px",
              left: 0, right: 0,
              height: (60 * pxPerMin) + "px",
              borderTop: "1px solid #f3f4f6"
            }
          },
            React.createElement("span", {
              style: {
                position: "absolute",
                top: "-7px", left: 4,
                fontSize: 10, color: "#9ca3af",
                background: "var(--c-surface, #fff)",
                padding: "0 4px",
                fontVariantNumeric: "tabular-nums"
              }
            }, fmtHour(h))
          )),
          (function () {
            const byStart = new Map();
            for (const slot of dueOnFocus) {
              const k = slot.startMin;
              if (!byStart.has(k)) byStart.set(k, []);
              byStart.get(k).push(slot);
            }
            const blocks = [];
            for (const slot of dueOnFocus) {
              const peers = byStart.get(slot.startMin) || [slot];
              const idx = peers.indexOf(slot);
              const cols = peers.length;
              const h = slot.habit;
              const top = Math.max(0, (slot.startMin - dayStartHour * 60) * pxPerMin);
              const height = Math.max(3, slot.durationMin * pxPerMin - 1);
              const a = areaOf(h);
              const stripPct = 100 / cols;
              blocks.push(React.createElement("div", {
                key: h.id,
                title: fmtMins(slot.startMin) + "–" + fmtMins(slot.endMin) + " · " + h.text + " · " + (h.importance || "Important") + (cols > 1 ? " · concurrent" : ""),
                style: {
                  position: "absolute",
                  top: top + "px",
                  left: "calc(38px + " + (idx * stripPct) + "% * (100% - 42px) / 100%)",
                  width: "calc((100% - 42px) * " + stripPct + " / 100 - 1px)",
                  height: height + "px",
                  background: a.bg,
                  border: "1px solid " + a.border,
                  borderRadius: 4
                }
              }));
            }
            return blocks;
          })()
        ),
        // Callout cards column.
        React.createElement("div", {
          style: {
            flex: 1,
            display: "flex", flexDirection: "column", gap: 6,
            maxHeight: colHeight + "px",
            overflowY: "auto"
          }
        }, dueOnFocus.length === 0
          ? React.createElement("div", {
              style: { fontSize: 12, color: "#9ca3af", padding: "8px 0", textAlign: "center" }
            }, "Nothing scheduled.")
          : (function () {
              const groups = [];
              for (let i = 0; i < dueOnFocus.length; i++) {
                const slot = dueOnFocus[i];
                const last = groups[groups.length - 1];
                if (last && last[0].startMin === slot.startMin && last[0].habit.section === slot.habit.section) {
                  last.push(slot);
                } else {
                  groups.push([slot]);
                }
              }
              const out = [];
              let prevSec = null;
              groups.forEach(group => {
                const firstSlot = group[0];
                const h0 = firstSlot.habit;
                if (h0.section !== prevSec) {
                  out.push(React.createElement("div", {
                    key: "brk-" + h0.section + "-" + firstSlot.startMin,
                    style: {
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                      color: "#9ca3af", textTransform: "uppercase",
                      margin: "4px 0"
                    }
                  },
                    React.createElement("div", { key: "l", style: { flex: 1, height: 0, borderTop: "1px dashed #e5e7eb" } }),
                    React.createElement("span", { key: "lbl" }, sectionIcon(h0.section) + " " + (h0.section === "morning" ? "Morning" : h0.section === "afternoon" ? "Afternoon" : "Evening")),
                    React.createElement("div", { key: "r", style: { flex: 1, height: 0, borderTop: "1px dashed #e5e7eb" } })
                  ));
                  prevSec = h0.section;
                }
                const cards = group.map(slot => {
                  const h = slot.habit;
                  const a = areaOf(h);
                  return React.createElement("div", {
                    key: h.id,
                    title: (h.importance || "Important") + " · " + (h.type || "Uncategorized") + (group.length > 1 ? " · concurrent" : ""),
                    style: {
                      display: "flex", alignItems: "stretch", gap: 0,
                      flex: 1, minWidth: 0,
                      background: a.bg,
                      border: "1px solid " + a.border,
                      borderRadius: 8,
                      overflow: "hidden",
                      padding: 0
                    }
                  },
                    React.createElement("div", {
                      key: "stripe",
                      style: Object.assign({ width: 6, flexShrink: 0 }, impStripe(h.importance, a))
                    }),
                    React.createElement("div", {
                      key: "body",
                      style: { flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }
                    },
                      React.createElement("div", {
                        key: "name",
                        style: { fontSize: 13, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                      }, slot.displayName || h.text),
                      slot.members && slot.members.length > 1 && React.createElement("div", {
                        key: "members",
                        style: { fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                      }, slot.members.map(m => m.text).join(" · ")),
                      React.createElement("div", {
                        key: "meta",
                        style: { fontSize: 10, color: a.color, display: "flex", gap: 6, fontVariantNumeric: "tabular-nums", flexWrap: "wrap", fontWeight: 600 }
                      },
                        React.createElement("span", { key: "t" }, fmtMins(slot.startMin) + "–" + fmtMins(slot.endMin)),
                        React.createElement("span", { key: "d1", style: { opacity: 0.4 } }, "·"),
                        React.createElement("span", { key: "dur" }, slot.durationMin + " min"),
                        React.createElement("span", { key: "d2", style: { opacity: 0.4 } }, "·"),
                        React.createElement("span", { key: "fq", style: { textTransform: "uppercase", fontWeight: 700 } }, freqLabel(h))
                      )
                    )
                  );
                });
                out.push(React.createElement("div", {
                  key: "grp-" + group[0].habit.id,
                  style: { display: "flex", gap: 6 }
                }, cards));
              });
              return out;
            })()
        )
      );
    };

    // ── modal shell ─────────────────────────────────────────────────────
    return React.createElement("div", {
      role: "dialog", "aria-modal": "true",
      style: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 290,
        display: "flex", alignItems: "flex-end", justifyContent: "center"
      },
      onClick: e => { if (e.target === e.currentTarget) onClose(); }
    }, React.createElement("div", {
      className: "fade-in",
      style: {
        background: "var(--c-surface, #fff)",
        borderRadius: "20px 20px 0 0",
        padding: "20px 18px calc(22px + env(safe-area-inset-bottom, 0px))",
        width: "100%", maxWidth: 640,
        maxHeight: "min(90vh, 90dvh)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        boxShadow: "0 -8px 40px rgba(0,0,0,.2)"
      }
    },
      // Title + close.
      React.createElement("div", {
        key: "title-row",
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }
      },
        React.createElement("div", {
          key: "title",
          style: { fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", letterSpacing: 0.3, textTransform: "uppercase" }
        }, "Calendar"),
        React.createElement("button", {
          key: "close",
          type: "button", "aria-label": "Close calendar",
          onClick: onClose,
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: "50%", width: 28, height: 28, fontSize: 14, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
        }, "×")
      ),
      // View toggle.
      React.createElement("div", {
        key: "toggle",
        style: { display: "flex", gap: 6, marginBottom: 10 }
      }, viewBtn("day", "Day"), viewBtn("week", "Week"), viewBtn("month", "Month")),
      // Range header + nav.
      React.createElement("div", {
        key: "nav",
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }
      },
        navBtn("←", stepBack),
        React.createElement("div", {
          key: "label",
          style: { fontSize: 14, fontWeight: 700, color: "var(--c-text-strong)", textAlign: "center", flex: 1 }
        }, rangeLabel),
        navBtn("→", stepFwd)
      ),
      // Body — month / week / day.
      React.createElement(React.Fragment, { key: "body" },
        calendarView === "month" ? renderMonth()
          : calendarView === "week" ? renderWeek()
          : renderDay()
      ),
      // Selected-day habits panel (suppressed in day view).
      calendarView !== "day" && React.createElement("div", {
        key: "selected-day",
        style: { marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--c-border)" }
      },
        React.createElement("div", {
          key: "sel-label",
          style: { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }
        }, fmtDate(focusDate, { weekday: "long", month: "short", day: "numeric" })
           + " · " + dueOnFocus.length
           + (dueOnFocus.length === 1 ? " habit" : " habits")),
        dueOnFocus.length === 0
          ? React.createElement("div", {
              key: "empty",
              style: { fontSize: 12, color: "#9ca3af", padding: "8px 0", textAlign: "center" }
            }, "Nothing scheduled.")
          : React.createElement("div", {
              key: "list",
              style: { display: "flex", flexDirection: "column", gap: 6 }
            }, dueOnFocus.map(slot => {
              const h = slot.habit;
              return React.createElement("div", {
                key: h.id,
                style: {
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px",
                  background: "var(--c-surface-raised)",
                  border: "1px solid var(--c-border)",
                  borderRadius: 8
                }
              },
                React.createElement("span", {
                  key: "time",
                  style: { fontSize: 10, color: "#6b7280", fontWeight: 700, width: 88, flexShrink: 0, fontVariantNumeric: "tabular-nums" }
                }, fmtMins(slot.startMin) + "–" + fmtMins(slot.endMin)),
                React.createElement("span", {
                  key: "dot",
                  style: { width: 8, height: 8, borderRadius: "50%", background: impColor(h.importance), flexShrink: 0 }
                }),
                React.createElement("span", {
                  key: "text",
                  style: { flex: 1, fontSize: 13, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                }, h.text),
                React.createElement("span", {
                  key: "fq",
                  style: { fontSize: 9, color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }
                }, freqLabel(h))
              );
            }))
      ),
      // .ics export — fires the App-scope exportHabitsICS via callback.
      React.createElement("button", {
        key: "export",
        type: "button",
        onClick: onExportICS,
        style: {
          marginTop: 16, width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: "1px solid var(--c-border)",
          background: "var(--c-surface-raised)",
          color: "var(--c-text)",
          fontSize: 13, fontWeight: 600, cursor: "pointer"
        }
      }, "📅 Export to iCalendar (.ics)"),
      React.createElement("div", {
        key: "export-help",
        style: { fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 6, lineHeight: 1.5 }
      }, "Imports into Apple Calendar, Google Calendar, Yahoo, Outlook. Importance is stamped as iCalendar PRIORITY (Non-Negotiable = highest, Additive = lowest).")
    ));
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { CalendarView };
  } else if (typeof window !== "undefined") {
    window.CalendarView = CalendarView;
  }
})();
