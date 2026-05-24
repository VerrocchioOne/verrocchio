// lib/views/Header.js
//
// Sticky liquid-glass header: brand + tagline (left), date pill +
// double-tap-to-save flash (middle), voice mic + streak + level/XP
// + profile pill (right), plus a collapsible secondary row with
// month calendar grid + travel-day picker + month stats.
//
// Wave 4.2.2. Originally inline at index.html L12284-L13133.
//
// VERBATIM body extraction (same pattern as HabitsView §13.4b): the
// render tree is copied 1:1 from the inline source; a destructuring
// prelude at the top of Header() re-binds every App-scope identifier
// the body references so render output is bit-identical.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function Header(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const data = h.data;
    const save = h.save;
    const tk = h.tk;
    const dk = h.dk;
    const isDone = h.isDone;
    const getStreak = h.getStreak;
    const selDate = h.selDate;
    const setSelDate = h.setSelDate;
    const demoMode = !!h.demoMode;
    const profileName = h.profileName;
    const manualSyncFlash = h.manualSyncFlash;
    const setManualSyncFlash = h.setManualSyncFlash;
    const todayPillLastTapRef = h.todayPillLastTapRef;
    const speechRecAvailable = !!h.speechRecAvailable;
    const setVoiceCaptureOpen = h.setVoiceCaptureOpen;
    const memoedAppStreak = h.memoedAppStreak;
    const SHOW_DEBUG_UI = !!h.SHOW_DEBUG_UI;
    const devProfile = h.devProfile;
    const setShowProfile = h.setShowProfile;
    const headerCollapsed = !!h.headerCollapsed;
    const headerExpanded = !!h.headerExpanded;
    const setHeaderExpanded = h.setHeaderExpanded;
    const travelEntryFor = h.travelEntryFor;
    const tripDrag = h.tripDrag;
    const setTripDrag = h.setTripDrag;
    const calTravelMode = h.calTravelMode;
    const setCalTravelMode = h.setCalTravelMode;
    const setCalendarView = h.setCalendarView;
    const setCalendarFocus = h.setCalendarFocus;
    const setCalendarModalOpen = h.setCalendarModalOpen;
    const beginLevelPress = h.beginLevelPress;
    const cancelLevelPress = h.cancelLevelPress;
    const levelLongPressFiredRef = h.levelLongPressFiredRef;
    const setShowXpChart = h.setShowXpChart;
    const habits = h.habits || [];

    return React.createElement("div", {
      className: "lg",
      style: {
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.65)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 8px rgba(0,0,0,.06)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }
    }, React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "max(10px, calc(env(safe-area-inset-top, 0px) + 6px)) 16px 8px",
        gap: 8
      }
    }, React.createElement("div", null, React.createElement("h1", {
      style: { fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 700, color: "var(--c-text-strong)", letterSpacing: -.3, lineHeight: 1 }
    }, "Verrocchio"), React.createElement("div", {
      style: { fontSize: 10, color: "#9ca3af", fontWeight: 500, marginTop: 1, letterSpacing: .5 }
    }, "Achieve Anything")), (() => {
      const isTodaySel = selDate === tk();
      const sd = new Date(selDate + "T12:00:00");
      const now = new Date();
      const sameYear = sd.getFullYear() === now.getFullYear();
      const label = isTodaySel
        ? "Today"
        : sd.toLocaleDateString("en-US", sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
      const flashLabel = manualSyncFlash === "saving"  ? "Saving…"
                       : manualSyncFlash === "synced"  ? "✓ Saved"
                       : null;
      const flashColor = manualSyncFlash === "synced" ? "#2d5a2d" : "#6b7280";
      return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        React.createElement("button", {
          onClick: () => {
            const now2 = Date.now();
            if (now2 - todayPillLastTapRef.current < 350) {
              todayPillLastTapRef.current = 0;
              setManualSyncFlash("saving");
              save(data);
              return;
            }
            todayPillLastTapRef.current = now2;
            setSelDate(tk());
          },
          title: isTodaySel ? "Showing today (double-click to save)" : "Viewing a different day — tap to jump to today",
          "data-tour": "header-date",
          style: {
            background: isTodaySel ? "#2d5a2d" : "var(--c-tint-danger-bg)",
            border: isTodaySel ? "1px solid var(--c-tint-brand-border)" : "1px solid var(--c-tint-danger-border)",
            borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700,
            color: isTodaySel ? "#fff" : "var(--c-tint-danger-fg)",
            cursor: "pointer", whiteSpace: "nowrap", touchAction: "manipulation",
            userSelect: "none", WebkitUserSelect: "none"
          }
        }, label),
        flashLabel && React.createElement("span", {
          className: "fade-in",
          style: { fontSize: 11, fontWeight: 600, color: flashColor, letterSpacing: 0.2, whiteSpace: "nowrap" }
        }, flashLabel)
      );
    })(), React.createElement("div", {
      style: { display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }
    },
      speechRecAvailable && React.createElement("button", {
        type: "button",
        onClick: () => setVoiceCaptureOpen(true),
        title: "Capture by voice — talk to add a goal, habit, to-do, or journal entry",
        "aria-label": "Voice capture",
        style: { width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--c-border)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0, WebkitTapHighlightColor: "transparent" }
      }, React.createElement("svg", {
        "aria-hidden": true, width: 14, height: 14, viewBox: "0 0 24 24", fill: "none",
        stroke: "#2d5a2d", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"
      },
        React.createElement("rect", { x: "9", y: "2", width: "6", height: "11", rx: "3" }),
        React.createElement("path", { d: "M5 11a7 7 0 0014 0" }),
        React.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "22" })
      )),
      (() => {
      const appStreak = memoedAppStreak;
      const active = appStreak > 0;
      return React.createElement("div", {
        title: active ? `${appStreak}-day streak` : "No streak yet — log a habit to start one!",
        "data-tour": "header-streak",
        style: { display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: active ? "#fff7ed" : "var(--c-surface-muted)", border: `1px solid ${active ? "#fdba74" : "var(--c-border)"}` }
      },
        React.createElement("span", { style: { fontSize: 14, lineHeight: 1, filter: active ? "none" : "grayscale(1) opacity(0.6)" } }, "🔥"),
        React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: active ? "#c2410c" : "#9ca3af" } }, appStreak)
      );
    })(),
    SHOW_DEBUG_UI && devProfile && devProfile !== "phone" && React.createElement("span", {
      className: "device-indicator",
      "aria-label": "Layout: " + devProfile,
      title: "Detected layout: " + devProfile + " (viewport " + (typeof window !== "undefined" ? window.innerWidth : "?") + "px). Wider columns active.",
      style: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 30, padding: "0 10px", borderRadius: 14, background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", color: "var(--c-tint-brand-fg)", fontSize: 11, fontWeight: 700, lineHeight: 1, marginRight: 4, textTransform: "uppercase", letterSpacing: 0.4 }
    }, "🖥", React.createElement("span", null, devProfile)),
    React.createElement("button", {
      onClick: () => setShowProfile(true),
      "aria-label": "Profile", "data-tour": "profile",
      "data-brand": demoMode ? "1" : null,
      style: { minWidth: 34, height: 34, padding: demoMode ? "0 10px" : 0, width: demoMode ? "auto" : 34, borderRadius: demoMode ? 17 : "50%", background: "#2d5a2d", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }
    }, demoMode ? React.createElement("span", {
      style: { color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: .3 }
    }, "Demo") : profileName ? React.createElement("span", {
      style: { color: "#fff", fontSize: 14, fontWeight: 700 }
    }, profileName.charAt(0).toUpperCase()) : React.createElement("svg", {
      width: "18", height: "18", viewBox: "0 0 24 24", fill: "none",
      stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"
    }, React.createElement("path", { d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" }),
       React.createElement("circle", { cx: "12", cy: "7", r: "4" }))))),
    React.createElement("div", {
      style: { padding: headerCollapsed ? "0 8px" : "2px 8px 10px", maxHeight: headerCollapsed ? 0 : 600, opacity: headerCollapsed ? 0 : 1, overflow: "hidden", pointerEvents: headerCollapsed ? "none" : "auto", transition: "max-height .22s ease, opacity .18s ease, padding .22s ease" }
    }, React.createElement("div", {
      style: { display: "flex", alignItems: "center", gap: 4 }
    }, React.createElement("button", {
      onClick: () => setHeaderExpanded(p => !p),
      "data-tour": "header-calendar", "aria-label": "Open calendar",
      style: { background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#9ca3af", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", WebkitTapHighlightColor: "transparent" }
    }, React.createElement("svg", {
      width: "18", height: "18", viewBox: "0 0 24 24", fill: "none",
      stroke: "#9ca3af", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"
    }, React.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
       React.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
       React.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
       React.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" }))),
    (() => {
      const entry = travelEntryFor(selDate);
      const isTravel = !!entry;
      const quickToggleTravel = () => {
        const current = data.travelDays || [];
        const existing = current.find(t => t.date === selDate);
        if (existing) {
          const next = existing.tripId
            ? current.filter(t => t.tripId !== existing.tripId)
            : current.filter(t => t.date !== selDate);
          save({ ...data, travelDays: next });
        } else {
          const loc = window.prompt("Where will you be on " + selDate + "?", data.homeLocation || "");
          if (loc === null) return;
          const tripId = "t" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
          const next = [...current, { date: selDate, location: loc.trim(), tripId }].sort((a, b) => a.date.localeCompare(b.date));
          save({ ...data, travelDays: next });
        }
      };
      return React.createElement("button", {
        onClick: quickToggleTravel,
        title: isTravel && entry && entry.location ? "Traveling — " + entry.location : (isTravel ? "Traveling" : "At Home"),
        "data-tour": "header-travel",
        style: { background: isTravel ? "#fff7ed" : "var(--c-tint-success-bg)", border: "1px solid " + (isTravel ? "#fdba74" : "#c6dfc6"), borderRadius: 14, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: isTravel ? "#c2410c" : "#2d5a2d", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, letterSpacing: .2, WebkitTapHighlightColor: "transparent" }
      }, isTravel ? "Traveling" : "At Home");
    })(), (() => {
      const xpTotal = data.xp || 0;
      const level = Math.floor(xpTotal / 500) + 1;
      const xpInLevel = xpTotal % 500;
      const xpPct = Math.round(xpInLevel / 500 * 100);
      return React.createElement("div", {
        onPointerDown: beginLevelPress, onPointerUp: cancelLevelPress,
        onPointerLeave: cancelLevelPress, onPointerCancel: cancelLevelPress,
        onClick: () => {
          if (levelLongPressFiredRef.current) { levelLongPressFiredRef.current = false; return; }
          setShowXpChart(true);
        },
        title: "Tap for XP history · Hold for achievements", role: "button", "data-tour": "header-xp",
        style: { flex: 1, display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#f0fdf4,#f0f7f0)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10, padding: "6px 12px", minWidth: 0, cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent" }
      },
        React.createElement("span", { style: { fontSize: 16 } }, "⚡"),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 3 } },
            React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#2d5a2d" } }, "Level ", level),
            React.createElement("span", { style: { fontSize: 10, color: "#6b7280" } }, xpInLevel, " / 500 XP")
          ),
          React.createElement("div", { style: { height: 5, background: "var(--c-border)", borderRadius: 3, overflow: "hidden" } },
            React.createElement("div", { style: { height: "100%", width: xpPct + "%", background: "linear-gradient(90deg,#2d5a2d,#16a34a)", borderRadius: 3, transition: "width 0.5s ease" } })
          )
        ),
        React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#2d5a2d", whiteSpace: "nowrap" } }, xpTotal.toLocaleString(), " XP")
      );
    })()), headerExpanded && (() => {
      const sd = new Date(selDate + "T12:00:00");
      const yr = sd.getFullYear();
      const mo = sd.getMonth();
      const first = new Date(yr, mo, 1).getDay();
      const dim = new Date(yr, mo + 1, 0).getDate();
      const tdMap = new Map((data.travelDays || []).map(t => [t.date, t.location || ""]));
      const tdSet = tdMap;
      const tripIdByDate = new Map((data.travelDays || []).map(t => [t.date, t.tripId || null]));
      return React.createElement("div", {
        className: "fade-in",
        style: { marginTop: 8, background: "var(--c-surface-raised)", borderRadius: 10, padding: "10px" }
      }, React.createElement("div", {
        style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }
      }, React.createElement("button", {
        onClick: () => { const d = new Date(selDate + "T12:00:00"); d.setMonth(d.getMonth() - 1); setSelDate(dk(d)); },
        style: { background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: "0 6px" }
      }, "‹"), React.createElement("span", {
        style: { fontSize: 12, fontWeight: 700, color: "var(--c-text-soft)" }
      }, sd.toLocaleDateString("en-US", { month: "long", year: "numeric" })), React.createElement("button", {
        onClick: () => { const d = new Date(selDate + "T12:00:00"); d.setMonth(d.getMonth() + 1); setSelDate(dk(d)); },
        style: { background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: "0 6px" }
      }, "›")),
      React.createElement("div", {
        style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }
      },
        React.createElement("div", {
          style: { display: "flex", gap: 6, flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 3 }
        },
          [{ val: false, label: "📅 Select date", color: "#2d5a2d", bg: "var(--c-tint-success-bg)", border: "#c6dfc6" },
           { val: true,  label: "✈ Assign travel",  color: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" }].map(o => {
            const on = calTravelMode === o.val;
            return React.createElement("button", {
              key: String(o.val), onClick: () => setCalTravelMode(o.val),
              style: { flex: 1, minWidth: 0, padding: "5px 8px", borderRadius: 14, border: on ? `1px solid ${o.border}` : "1px solid transparent", background: on ? o.bg : "transparent", color: on ? o.color : "#9ca3af", fontSize: 11, fontWeight: on ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", textAlign: "center", transition: "all .15s" }
            }, o.label);
          })
        ),
        React.createElement("button", {
          onClick: () => { setCalendarView("day"); setCalendarFocus(selDate); setHeaderExpanded(false); setCalendarModalOpen(true); },
          title: "Open the full calendar (day, week, month + .ics export)",
          "aria-label": "Open full calendar",
          style: { background: "#2d5a2d", border: "1px solid #2d5a2d", borderRadius: 14, padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, WebkitTapHighlightColor: "transparent" }
        }, "Open Calendar →")
      ),
      React.createElement("div", {
        style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }
      }, ["S", "M", "T", "W", "T", "F", "S"].map((d, i) => React.createElement("div", {
        key: i, style: { textAlign: "center", fontSize: 9, fontWeight: 600, color: "#9ca3af", paddingBottom: 4 }
      }, d)), Array.from({ length: first }, (_, i) => React.createElement("div", { key: "e" + i })),
      Array.from({ length: dim }, (_, i) => {
        const day = i + 1;
        const d = new Date(yr, mo, day);
        const val = dk(d);
        const isT = val === tk();
        const isSel = val === selDate;
        const isFut = val > tk();
        const isTrav = tdSet.has(val);
        const hasDone = habits.some(hh => isDone(hh, val));
        let inDrag = false;
        if (tripDrag) {
          const lo = tripDrag.start <= tripDrag.end ? tripDrag.start : tripDrag.end;
          const hi = tripDrag.start <= tripDrag.end ? tripDrag.end : tripDrag.start;
          inDrag = val >= lo && val <= hi;
        }
        const col = (first + i) % 7;
        const myTrip = tripIdByDate.get(val) || null;
        const prevVal = dk(new Date(yr, mo, day - 1));
        const nextVal = dk(new Date(yr, mo, day + 1));
        const trackLeft  = !!(myTrip && col !== 0 && tripIdByDate.get(prevVal) === myTrip);
        const trackRight = !!(myTrip && col !== 6 && tripIdByDate.get(nextVal) === myTrip);
        const isContinuous = trackLeft || trackRight;
        const selColor = isTrav ? "#0891b2" : "#2d5a2d";
        const todayBg  = isTrav ? "#f0f9ff" : "var(--c-tint-success-bg)";
        const todayFg  = isTrav ? "#0891b2" : "#2d5a2d";
        const travBg   = "#ecfeff";
        const dragBg   = "#cffafe";
        const fill = inDrag ? dragBg : (isSel ? selColor : isT ? todayBg : isTrav ? travBg : "transparent");
        let borderRadius = "50%";
        if (isContinuous) {
          if (trackLeft && trackRight) borderRadius = 0;
          else if (trackLeft) borderRadius = "0 999px 999px 0";
          else borderRadius = "999px 0 0 999px";
        }
        const shapeBorder = {};
        if (inDrag) {
          const c = "1.5px solid #0891b2";
          if (isContinuous) {
            shapeBorder.borderTop = c; shapeBorder.borderBottom = c;
            if (!trackLeft)  shapeBorder.borderLeft  = c;
            if (!trackRight) shapeBorder.borderRight = c;
          } else { shapeBorder.border = c; }
        } else if (isTrav && !isSel) {
          const c = "1px dashed #67e8f9";
          if (isContinuous) {
            shapeBorder.borderTop = c; shapeBorder.borderBottom = c;
            if (!trackLeft)  shapeBorder.borderLeft  = c;
            if (!trackRight) shapeBorder.borderRight = c;
          } else { shapeBorder.border = c; }
        }
        return React.createElement("button", {
          key: day,
          "data-travel-day": calTravelMode ? val : null,
          onPointerDown: calTravelMode ? (e) => { setTripDrag({ start: val, end: val }); e.preventDefault(); } : undefined,
          onClick: () => {
            if (!calTravelMode) {
              setSelDate(val);
              setHeaderExpanded(false);
            }
          },
          style: { aspectRatio: "1", background: "transparent", border: "none", padding: 0, cursor: calTravelMode ? "crosshair" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", opacity: isFut && !calTravelMode ? .7 : 1, touchAction: calTravelMode ? "none" : "auto", userSelect: "none", overflow: "visible" }
        },
          React.createElement("div", {
            style: Object.assign({ position: "absolute", top: 0, bottom: 0, left: trackLeft ? -3 : 0, right: trackRight ? -3 : 0, borderRadius: borderRadius, background: fill, boxSizing: "border-box", pointerEvents: "none" }, shapeBorder)
          }),
          React.createElement("span", {
            style: { fontSize: 11, fontWeight: isSel || isT || isTrav ? 700 : 400, color: isSel ? "#fff" : isT ? todayFg : isTrav ? "#0e7490" : "var(--c-text-soft)", position: "relative", zIndex: 1 }
          }, day), hasDone && !isSel && React.createElement("div", {
            style: { position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: "#22c55e", zIndex: 1 }
          }));
      })),
      (() => {
        const activeH = (data.habits || []).filter(hh => hh.section !== "avoid" && !hh.parked);
        const today = tk();
        const daysThisMonth = [];
        for (let d = 1; d <= dim; d++) {
          const k = dk(new Date(yr, mo, d));
          if (k > today) break;
          daysThisMonth.push(k);
        }
        let perfect = 0, zero = 0, anyCount = 0;
        for (const k of daysThisMonth) {
          const done = activeH.filter(hh => {
            const c = hh.completions && hh.completions[k];
            return c === "done" || c === true;
          }).length;
          if (activeH.length && done === activeH.length) perfect++;
          if (done === 0) zero++;
          if (done > 0) anyCount++;
        }
        const totalDonePct = daysThisMonth.length ? Math.round(anyCount / daysThisMonth.length * 100) : 0;
        let allDoneStreak = 0;
        for (let i = 0; i < 365 && activeH.length; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const k = dk(d);
          const done = activeH.filter(hh => {
            const c = hh.completions && hh.completions[k];
            return c === "done" || c === true;
          }).length;
          if (done === activeH.length) allDoneStreak++;
          else break;
        }
        const bestStreak = activeH.length ? Math.max(0, ...activeH.map(hh => getStreak(hh)), ...Object.values(data.bestStreaks || {})) : 0;
        const card = (value, label, color) => React.createElement("div", {
          style: { flex: 1, minWidth: 0, padding: "8px 10px", background: "var(--c-surface, #fff)", border: "1px solid var(--c-border)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }
        },
          React.createElement("span", { style: { fontSize: 11, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" } }, label),
          React.createElement("span", { style: { fontFamily: "'Lora',serif", fontSize: 14, fontWeight: 700, color: color || "var(--c-text)" } }, value)
        );
        return React.createElement("div", {
          style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }
        },
          React.createElement("div", { style: { display: "flex", gap: 6 } },
            React.createElement("div", {
              style: { flex: "0 0 auto", width: 72, padding: "8px 10px", background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10, textAlign: "center" }
            },
              React.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 700, color: "#2d5a2d", lineHeight: 1 } }, totalDonePct, "%"),
              React.createElement("div", { style: { fontSize: 9, color: "#2d5a2d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginTop: 4 } }, "Total done")
            ),
            React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 4 } },
              card(allDoneStreak + "d", "All-done streak", "#2d5a2d"),
              card(bestStreak + "d", "Best streak", "#d97706")
            )
          ),
          React.createElement("div", { style: { display: "flex", gap: 6 } },
            card(perfect + "d", "All done", "#16a34a"),
            card(zero + "d", "Zero done", "#991b1b")
          )
        );
      })(),
      React.createElement("div", {
        style: { display: "flex", gap: 10, justifyContent: "center", marginTop: 8, fontSize: 10, color: "#6b7280" }
      },
        React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } },
          React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)" } }),
          (data.homeLocation ? "Home — " + data.homeLocation : "Home")),
        React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } },
          React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "#ecfeff", border: "1px dashed #67e8f9" } }), "Travel")),
      (data.travelDays && data.travelDays.length > 0) ? (() => {
        const groupMap = new Map();
        for (const t of (data.travelDays || []).slice().sort((a, b) => a.date.localeCompare(b.date))) {
          const key = t.tripId || ("solo-" + t.date);
          if (!groupMap.has(key)) groupMap.set(key, []);
          groupMap.get(key).push(t);
        }
        const trips = Array.from(groupMap.values()).sort((a, b) => a[0].date.localeCompare(b[0].date));
        const editTripLoc = (trip) => {
          const current = trip[0].location || "";
          const loc = window.prompt(
            trip.length === 1
              ? "Location for " + trip[0].date + ":"
              : "Location for trip (" + trip[0].date + " → " + trip[trip.length - 1].date + "):",
            current
          );
          if (loc === null) return;
          const ids = new Set(trip.map(t => t.tripId).filter(Boolean));
          const dates = new Set(trip.map(t => t.date));
          const next = (data.travelDays || []).map(t =>
            (t.tripId && ids.has(t.tripId)) || dates.has(t.date)
              ? { ...t, location: loc.trim() }
              : t
          );
          save({ ...data, travelDays: next });
        };
        const deleteTrip = (trip) => {
          const ids = new Set(trip.map(t => t.tripId).filter(Boolean));
          const dates = new Set(trip.map(t => t.date));
          const next = (data.travelDays || []).filter(t =>
            !((t.tripId && ids.has(t.tripId)) || dates.has(t.date))
          );
          save({ ...data, travelDays: next });
        };
        return React.createElement("div", {
          style: { marginTop: 10, paddingTop: 8, borderTop: "1px solid #e5e7eb" }
        },
          React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 } }, "Trips"),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" } },
            trips.map(trip => {
              const firstD = trip[0].date, last = trip[trip.length - 1].date;
              const rangeLabel = firstD === last ? firstD : firstD + " → " + last;
              const loc = trip[0].location;
              return React.createElement("div", {
                key: "trip-" + (trip[0].tripId || firstD),
                style: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px" }
              },
                React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#0891b2", minWidth: 130, whiteSpace: "nowrap" } }, rangeLabel),
                React.createElement("button", {
                  onClick: () => editTripLoc(trip),
                  style: { flex: 1, textAlign: "left", background: "transparent", border: "none", fontSize: 11, color: loc ? "var(--c-text)" : "#9ca3af", fontStyle: loc ? "normal" : "italic", cursor: "pointer", padding: "2px 0" }
                }, loc || "Tap to set location"),
                React.createElement("button", {
                  onClick: () => deleteTrip(trip),
                  style: { background: "transparent", border: "none", color: "#9ca3af", fontSize: 16, cursor: "pointer", padding: "0 4px", lineHeight: 1 },
                  title: "Remove trip"
                }, "×")
              );
            })
          )
        );
      })() : null);
    })()));
  }

  window.Header = Header;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { Header };
  }
})();
