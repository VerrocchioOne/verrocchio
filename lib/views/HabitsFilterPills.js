// lib/views/HabitsFilterPills.js
//
// Filter / sort toolbar for the Habits view. Renders:
//   • [+] New-habit button
//   • Today's-Habits cycle pill (Today / Not Today / All)
//   • Master Filter pill (toggles the Priority/Goal/Freq/Duration sub-rows)
//   • Sort button (delegates to renderSortButton)
//   • Total-duration pill at the trailing edge
//   • Four expanded pill rows: Priority, Goal, Freq, Duration
//   • The Organize button (enters reorder mode)
//
// Extracted from HabitsView.js to bring that file toward the 1000-LOC
// cap (see CLAUDE.md "File-size rule"). Behavior is byte-identical
// to the original inline region in HabitsView.
//
// All filter state lives in App (passed in via the cb bundle), so this
// component is pure-render: no useState, no useEffect. Long-press refs
// (impLpRef / habGoalLpRef / habFreqLpRef) and the filterPressProps
// helper come in via h (the helpers bundle).

(function () {
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

  function HabitsFilterPills(props) {
    const p = props || {};
    const data                       = p.data || {};
    const openNewHabitModal          = p.openNewHabitModal          || (() => {});
    const filtH                      = p.filtH                      || [];
    const cohortDurationSum          = p.cohortDurationSum          || (() => 0);
    const renderSortButton           = p.renderSortButton           || (() => null);
    const filterPressProps           = p.filterPressProps           || (() => ({}));
    const reorderEntryBlockedByFilter = p.reorderEntryBlockedByFilter;
    const impLpRef                   = p.impLpRef;
    const habGoalLpRef               = p.habGoalLpRef;
    const habFreqLpRef               = p.habFreqLpRef;
    const setReorderMode             = p.setReorderMode             || (() => {});

    // Filter state (App-owned, mirrored as locals so the byte-copied
    // region below resolves bare names exactly as it did in HabitsView).
    const dueFilter            = p.dueFilter            || "all";
    const setDueFilter         = p.setDueFilter         || (() => {});
    const impFilter            = p.impFilter            || [];
    const setImpFilter         = p.setImpFilter         || (() => {});
    const habGoalFilter        = p.habGoalFilter        || [];
    const setHabGoalFilter     = p.setHabGoalFilter     || (() => {});
    const habFreqFilter        = p.habFreqFilter        || [];
    const setHabFreqFilter     = p.setHabFreqFilter     || (() => {});
    const durRange             = p.durRange             || [DUR_MIN, DUR_MAX];
    const setDurRange          = p.setDurRange          || (() => {});
    const filterMenuOpen       = p.filterMenuOpen;
    const setFilterMenuOpen    = p.setFilterMenuOpen    || (() => {});
    const impPillsOpen         = p.impPillsOpen;
    const setImpPillsOpen      = p.setImpPillsOpen      || (() => {});
    const habGoalPillsOpen     = p.habGoalPillsOpen;
    const setHabGoalPillsOpen  = p.setHabGoalPillsOpen  || (() => {});
    const habFreqPillsOpen     = p.habFreqPillsOpen;
    const setHabFreqPillsOpen  = p.setHabFreqPillsOpen  || (() => {});
    const durPillsOpen         = p.durPillsOpen;
    const setDurPillsOpen      = p.setDurPillsOpen      || (() => {});

    return React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        // Allow the main filter pill row to wrap onto a second line when
        // the [+] button plus all five toggles (Time / Priority / Goal /
        // Freq / Duration) would otherwise overflow on narrow screens.
        flexWrap: "wrap",
        gap: 4,
        rowGap: 6,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      // Opens the same bottom-sheet form Edit Habit uses, in
      // create mode. The legacy inline add-habit form (gated on
      // showAddHabit) is no longer reachable from here; the
      // modal exposes target/unit/op/+per-tap which the inline
      // form never did.
      onClick: () => openNewHabitModal(),
      "aria-label": "New habit",
      style: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#2d5a2d",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#fff",
        fontSize: 18,
        lineHeight: 1,
        fontWeight: 300
      }
    }, "+")),
      // The global Organize button now sits at the END of this
      // toolbar row (after the duration pill) so the leading
      // controls stay focused on filtering/sorting; see the
      // matching insertion further down.
      // NOTE: the "Time" compact filter pill has been intentionally
      // removed — time-of-day filtering is now expressed by the section
      // headers themselves (tap a header to expand/collapse its habits).
      // `secFilter` state is retained but effectively unused on the
      // habits page; left in place to preserve any callers outside this
      // view and avoid a broader refactor.
      // Compact "Priority" toggle.
      // Today's Habits / Not Today / All toggle. Cycles on each tap.
      // "Today" hides habits whose frequency doesn't include the
      // selected date (a Mon/Wed weekly habit on Thursday, etc.).
      // "Not Today" inverts. "All" disables the filter entirely.
      (() => {
        const labelMap = { today: "Today", other: "Not Today", all: "All" };
        const isFiltering = dueFilter !== "all";
        const next = dueFilter === "today" ? "other" : dueFilter === "other" ? "all" : "today";
        return /*#__PURE__*/React.createElement("button", {
          onClick: () => setDueFilter(next),
          title: "Cycle: Today's Habits → Not Today → All",
          style: {
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px",
            borderRadius: 20,
            border: `1px solid ${isFiltering ? "#86efac" : "var(--c-border)"}`,
            background: isFiltering ? "#f0fdf4" : "#fff",
            color: isFiltering ? "#166534" : "#6b7280",
            fontSize: 11, fontWeight: isFiltering ? 700 : 500,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            WebkitTapHighlightColor: "transparent", userSelect: "none"
          }
        }, labelMap[dueFilter]);
      })(),
      // Master "Filter" pill — collapses Priority / Goal / Freq /
      // Duration behind one entry point. Filter icon (SVG funnel)
      // + "Filter" label, with a count badge summing the active
      // sub-filters. Tapping toggles the sub-pills' visibility.
      // When any sub-filter is active the sub-pills also stay
      // visible regardless of this toggle so the user can see
      // what's filtering them.
      (() => {
        const [dMin, dMax] = durRange;
        const durActive = !(dMin === DUR_MIN && dMax === DUR_MAX);
        const totalCount = impFilter.length + habGoalFilter.length + habFreqFilter.length + (durActive ? 1 : 0);
        const active = totalCount > 0;
        const expanded = filterMenuOpen || active;
        return /*#__PURE__*/React.createElement("button", {
          onClick: () => setFilterMenuOpen(p => !p),
          title: "Filter habits",
          style: {
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px",
            borderRadius: 20,
            border: `1px solid ${active ? "#c6dfc6" : expanded ? "#d1d5db" : "var(--c-border)"}`,
            background: active ? "var(--c-tint-success-bg)" : expanded ? "var(--c-surface-muted)" : "#fff",
            color: active ? "var(--accent, #2d5a2d)" : "#6b7280",
            fontSize: 11, fontWeight: active ? 700 : 500,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            WebkitTapHighlightColor: "transparent", userSelect: "none"
          }
        },
          // Funnel icon — sits left of "Filter" so the master
          // pill is visually distinct from the sub-pills.
          /*#__PURE__*/React.createElement("svg", {
            "aria-hidden": true, width: 11, height: 11, viewBox: "0 0 16 16", fill: "none",
            style: { marginRight: 1 }
          }, /*#__PURE__*/React.createElement("path", {
            d: "M2 3h12l-4.5 6v4l-3 1.5V9L2 3z",
            stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round", fill: "none"
          })),
          "Filter",
          totalCount > 0 && /*#__PURE__*/React.createElement("span", {
            style: { background: "var(--accent, #2d5a2d)", color: "#fff", borderRadius: 9, padding: "0 5px", fontSize: 9, fontWeight: 700, minWidth: 12, textAlign: "center" }
          }, totalCount),
          /*#__PURE__*/React.createElement("span", {
            "aria-hidden": true,
            style: { display: "inline-block", fontSize: 9, lineHeight: 1, marginLeft: 2, opacity: .7, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }
          }, "▾")
        );
      })(),
      // Sort button — moved up here (was at the end of the row)
      // so the default closed-Filter layout reads [+] [Today]
      // [Filter] [Sort] all on one line. The sub-filter pills
      // below render after the Sort button and wrap to a new row
      // when expanded, which is fine because that's a deliberate
      // user action.
      renderSortButton("habits"),
      // Total-duration pill at the end of the filter row. Sums the
      // durations of every habit that survived the current filter
      // set + due-date toggle. Hidden when zero so an empty
      // filter result doesn't leave a "0m" pill dangling.
      (() => {
        // Layered (concurrent) habits roll up to MAX, not SUM, so
        // the pill matches the actual block of time on the calendar.
        // Sub-habits also roll up under their parent's duration.
        const totalMin = cohortDurationSum(filtH.filter(h => !h.parentId));
        if (totalMin <= 0) return null;
        const fmt = totalMin >= 60
          ? Math.floor(totalMin / 60) + "h" + (totalMin % 60 > 0 ? " " + (totalMin % 60) + "m" : "")
          : totalMin + "m";
        return /*#__PURE__*/React.createElement("span", {
          title: "Total scheduled time across the visible habits",
          style: {
            display: "flex", alignItems: "center", gap: 3,
            padding: "4px 9px",
            borderRadius: 20,
            border: "1px solid var(--c-border)",
            background: "var(--c-tint-success-bg)",
            color: "#2d5a2d",
            fontSize: 11, fontWeight: 700,
            whiteSpace: "nowrap", flexShrink: 0,
            userSelect: "none"
          }
        },
          /*#__PURE__*/React.createElement("span", { style: { opacity: 0.8 } }, "⏱"),
          fmt
        );
      })(),
      (() => {
        const active = impFilter.length > 0;
        const expanded = impPillsOpen || active;
        const count = impFilter.length;
        if (!filterMenuOpen && !active) return null;
        return /*#__PURE__*/React.createElement("button", {
          onClick: () => setImpPillsOpen(p => !p),
          title: "Filter by priority",
          style: {
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px",
            borderRadius: 20,
            border: `1px solid ${active ? "#fde68a" : expanded ? "#d1d5db" : "var(--c-border)"}`,
            background: active ? "#fffbeb" : expanded ? "var(--c-surface-muted)" : "#fff",
            color: active ? "#b45309" : "#6b7280",
            fontSize: 11, fontWeight: active ? 700 : 500,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            WebkitTapHighlightColor: "transparent", userSelect: "none"
          }
        },
          "Priority",
          count > 0 && /*#__PURE__*/React.createElement("span", {
            style: { background: "#b45309", color: "#fff", borderRadius: 9, padding: "0 5px", fontSize: 9, fontWeight: 700, minWidth: 12, textAlign: "center" }
          }, count),
          /*#__PURE__*/React.createElement("span", {
            "aria-hidden": true,
            style: { display: "inline-block", fontSize: 9, lineHeight: 1, marginLeft: 2, opacity: .7, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }
          }, "\u25BE")
        );
      })(),
      // Compact "Goal" toggle — filters habits by Area-of-Life (habit.type).
      // Mirrors the Time/Priority pill styling. The badge count shows how
      // many area values are currently selected; tap expands the full pill
      // row underneath.
      (() => {
        const active = habGoalFilter.length > 0;
        const expanded = habGoalPillsOpen || active;
        const count = habGoalFilter.length;
        if (!filterMenuOpen && !active) return null;
        return /*#__PURE__*/React.createElement("button", {
          onClick: () => setHabGoalPillsOpen(p => !p),
          title: "Filter by goal / area of life",
          style: {
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px",
            borderRadius: 20,
            border: `1px solid ${active ? "#c6dfc6" : expanded ? "#d1d5db" : "var(--c-border)"}`,
            background: active ? "var(--c-tint-success-bg)" : expanded ? "var(--c-surface-muted)" : "#fff",
            color: active ? "var(--accent, #2d5a2d)" : "#6b7280",
            fontSize: 11, fontWeight: active ? 700 : 500,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            WebkitTapHighlightColor: "transparent", userSelect: "none"
          }
        },
          "Goal",
          count > 0 && /*#__PURE__*/React.createElement("span", {
            style: { background: "var(--accent, #2d5a2d)", color: "#fff", borderRadius: 9, padding: "0 5px", fontSize: 9, fontWeight: 700, minWidth: 12, textAlign: "center" }
          }, count),
          /*#__PURE__*/React.createElement("span", {
            "aria-hidden": true,
            style: { display: "inline-block", fontSize: 9, lineHeight: 1, marginLeft: 2, opacity: .7, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }
          }, "\u25BE")
        );
      })(),
      // Compact "Frequency" toggle — filters habits by freq.type (daily,
      // weekdays, weekly, monthly, …). Uses a neutral/slate accent so it
      // visually groups with Goal without clashing with the Time (amber)
      // and Priority (amber) pills.
      (() => {
        const active = habFreqFilter.length > 0;
        const expanded = habFreqPillsOpen || active;
        const count = habFreqFilter.length;
        if (!filterMenuOpen && !active) return null;
        return /*#__PURE__*/React.createElement("button", {
          onClick: () => setHabFreqPillsOpen(p => !p),
          title: "Filter by frequency",
          style: {
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px",
            borderRadius: 20,
            border: `1px solid ${active ? "#bfdbfe" : expanded ? "#d1d5db" : "var(--c-border)"}`,
            background: active ? "#eff6ff" : expanded ? "var(--c-surface-muted)" : "#fff",
            color: active ? "#1d4ed8" : "#6b7280",
            fontSize: 11, fontWeight: active ? 700 : 500,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            WebkitTapHighlightColor: "transparent", userSelect: "none"
          }
        },
          // Shortened from "Frequency" → "Freq" so the Time / Priority /
          // Goal / Freq / Duration filter pills all fit on a single row
          // without wrapping on narrow viewports.
          "Freq",
          count > 0 && /*#__PURE__*/React.createElement("span", {
            style: { background: "#1d4ed8", color: "#fff", borderRadius: 9, padding: "0 5px", fontSize: 9, fontWeight: 700, minWidth: 12, textAlign: "center" }
          }, count),
          /*#__PURE__*/React.createElement("span", {
            "aria-hidden": true,
            style: { display: "inline-block", fontSize: 9, lineHeight: 1, marginLeft: 2, opacity: .7, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }
          }, "\u25BE")
        );
      })(),
      // Compact "Duration" toggle — just the pill in the top row now;
      // the dual-thumb slider lives in its own expanded row below so the
      // layout mirrors Time / Priority / Goal / Frequency. The pill shows
      // the stopwatch glyph at full span and "min–max m" when narrowed;
      // tapping toggles the expanded row open/closed.
      (() => {
        const [dMin, dMax] = durRange;
        const any = dMin === DUR_MIN && dMax === DUR_MAX;
        const active = !any;
        const expanded = durPillsOpen || active;
        if (!filterMenuOpen && !active) return null;
        return /*#__PURE__*/React.createElement("button", {
          key: "dur-label",
          type: "button",
          onClick: () => setDurPillsOpen(p => !p),
          title: active ? "Duration: " + (dMin === dMax ? `${dMin}m` : `${dMin}–${dMax}m`) : "Filter by duration",
          "aria-label": active ? "Duration filter active" : "Open duration filter",
          style: {
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px",
            borderRadius: 20,
            border: `1px solid ${active ? "#c6dfc6" : expanded ? "#d1d5db" : "var(--c-border)"}`,
            background: active ? "var(--c-tint-success-bg)" : expanded ? "var(--c-surface-muted)" : "#fff",
            color: active ? "var(--accent, #2d5a2d)" : "#6b7280",
            fontSize: 11, fontWeight: active ? 700 : 500,
            cursor: "pointer",
            whiteSpace: "nowrap", flexShrink: 0,
            WebkitTapHighlightColor: "transparent", userSelect: "none",
            lineHeight: 1
          }
        },
          // Bare U+23F1 stopwatch (no \uFE0F) to match the monochrome
          // glyph shown next to each habit's duration (e.g. "⏱15m").
          // When a range is active the pill shows ONLY the icon — the
          // actual range is read off the expanded slider row below,
          // which auto-opens whenever the range has been narrowed.
          // Keeping the pill icon-only guarantees it fits on the same
          // line as Priority / Goal / Frequency at all viewport widths.
          /*#__PURE__*/React.createElement("span", {
            "aria-hidden": true,
            style: { fontSize: 12, lineHeight: 1 }
          }, "\u23F1"),
          // Chevron shown only in the inactive state so the pill is
          // discoverable; dropped once a range is active, matching the
          // icon-only compact treatment described above.
          !active && /*#__PURE__*/React.createElement("span", {
            "aria-hidden": true,
            style: { display: "inline-block", fontSize: 9, lineHeight: 1, marginLeft: 2, opacity: .7, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }
          }, "\u25BE")
        );
      })(),
      // (The "Routine" pill previously lived here. Moved to Profile →
      // App Settings → Routine Compare so the Habits tab's filter row
      // stays focused on filters.)
      // Global Organize entry point — the ONLY way to reorder habits.
      // Tapping enters inline reorder mode: cards become inert (no tap,
      // no swipe, no edit), each gets a drag handle on the right edge,
      // and explicit "first/last" drop zones flank each section column.
      // Tap Done in the top bar to exit. Disabled when filter pills
      // are active (reordering a filtered subset would risk misordering
      // hidden habits).
      /*#__PURE__*/React.createElement("button", {
        onClick: () => { if (!reorderEntryBlockedByFilter) setReorderMode(true); },
        disabled: reorderEntryBlockedByFilter,
        title: reorderEntryBlockedByFilter
          ? "Clear filters before reordering — partial reorders can misorder hidden habits."
          : "Organize habits — tap to enter drag-to-reorder mode",
        "aria-label": "Organize habits",
        style: {
          width: 32, height: 32,
          borderRadius: "50%",
          border: "1px solid var(--c-border)",
          background: "#fff",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
          padding: 0
        }
      },
        // Three-bar (hamburger) glyph — readable at this size
        // without a text label. Same medium-weight strokes as the
        // section chevrons elsewhere on the page.
        /*#__PURE__*/React.createElement("svg", {
          "aria-hidden": true,
          width: 14, height: 14, viewBox: "0 0 14 14", fill: "none"
        },
          /*#__PURE__*/React.createElement("path", {
            d: "M2 3.5h10M2 7h10M2 10.5h10",
            stroke: "#6b7280", strokeWidth: 1.6, strokeLinecap: "round"
          })
        )
      )
    ),
    // (Time of Day expanded pill row removed — see comment above about
    // the Time compact toggle being removed in favor of collapsible
    // section headers.)
    // Expanded row: Priority pills.
    (impPillsOpen || impFilter.length > 0) && /*#__PURE__*/React.createElement("div", {
      className: "fade-in",
      style: {
        display: "flex",
        flexWrap: "wrap",
        rowGap: 6,
        columnGap: 5,
        borderTop: "1px solid #f0f0ee",
        paddingTop: 8,
        marginBottom: 8
      }
    }, [{
      val: "all",
      label: "All Importance",
      color: "#2d5a2d",
      border: "#c6dfc6",
      bg: "var(--c-tint-success-bg)"
    }, ...IMP.map(i => ({
      val: i.value,
      label: i.value,
      color: i.color,
      border: i.border,
      bg: i.bg
    }))].map(f => {
      const isAll = f.val === "all";
      const on = isAll ? impFilter.length === 0 : impFilter.includes(f.val);
      const press = filterPressProps(f.val, impFilter, setImpFilter, impLpRef, isAll);
      return /*#__PURE__*/React.createElement("button", Object.assign({
        key: f.val,
        title: isAll ? "Show all" : "Tap to show only " + f.label + " — hold to add/remove",
        style: {
          padding: "3px 9px",
          borderRadius: 20,
          border: `1px solid ${on ? f.border : "var(--c-border)"}`,
          background: on ? f.bg : "#fff",
          color: on ? f.color : "#9ca3af",
          fontSize: 10,
          fontWeight: on ? 700 : 400,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          textAlign: "center",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none"
        }
      }, press), f.label);
    })),
    // Expanded row: Goal / Area-of-Life pills. Built from HT so each
    // area renders in its own themed color and stays in sync with the
    // forms' Area-of-Life dropdown.
    (habGoalPillsOpen || habGoalFilter.length > 0) && /*#__PURE__*/React.createElement("div", {
      className: "fade-in",
      style: {
        display: "flex",
        flexWrap: "wrap",
        rowGap: 6,
        columnGap: 5,
        borderTop: "1px solid #f0f0ee",
        paddingTop: 8,
        marginBottom: 8
      }
    }, [{
      val: "all",
      label: "All Goals",
      color: "#2d5a2d",
      border: "#c6dfc6",
      bg: "var(--c-tint-success-bg)"
    }, ...HT.map(t => ({
      val: t.value,
      label: t.value,
      color: t.color,
      border: t.border,
      bg: t.bg
    }))].map(f => {
      const isAll = f.val === "all";
      const on = isAll ? habGoalFilter.length === 0 : habGoalFilter.includes(f.val);
      const press = filterPressProps(f.val, habGoalFilter, setHabGoalFilter, habGoalLpRef, isAll);
      return /*#__PURE__*/React.createElement("button", Object.assign({
        key: f.val,
        title: isAll ? "Show all" : "Tap to show only " + f.label + " — hold to add/remove",
        style: {
          padding: "3px 9px",
          borderRadius: 20,
          border: `1px solid ${on ? f.border : "var(--c-border)"}`,
          background: on ? f.bg : "#fff",
          color: on ? f.color : "#9ca3af",
          fontSize: 10,
          fontWeight: on ? 700 : 400,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          textAlign: "center",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none"
        }
      }, press), f.label);
    })),
    // Expanded row: Frequency pills. Shares a single blue accent (matches
    // the compact Frequency toggle) since FREQ values don't have their
    // own palette; the "All" pill keeps the Verrocchio-green treatment
    // used across the other expanded rows.
    (habFreqPillsOpen || habFreqFilter.length > 0) && /*#__PURE__*/React.createElement("div", {
      className: "fade-in",
      style: {
        display: "flex",
        flexWrap: "wrap",
        rowGap: 6,
        columnGap: 5,
        borderTop: "1px solid #f0f0ee",
        paddingTop: 8,
        marginBottom: 8
      }
    }, [{
      val: "all",
      label: "All Frequency",
      color: "#2d5a2d",
      border: "#c6dfc6",
      bg: "var(--c-tint-success-bg)"
    }, ...FREQ.map(fr => ({
      val: fr.value,
      label: fr.label,
      color: "#1d4ed8",
      border: "#bfdbfe",
      bg: "#eff6ff"
    }))].map(f => {
      const isAll = f.val === "all";
      const on = isAll ? habFreqFilter.length === 0 : habFreqFilter.includes(f.val);
      const press = filterPressProps(f.val, habFreqFilter, setHabFreqFilter, habFreqLpRef, isAll);
      return /*#__PURE__*/React.createElement("button", Object.assign({
        key: f.val,
        title: isAll ? "Show all" : "Tap to show only " + f.label + " — hold to add/remove",
        style: {
          padding: "3px 9px",
          borderRadius: 20,
          border: `1px solid ${on ? f.border : "var(--c-border)"}`,
          background: on ? f.bg : "#fff",
          color: on ? f.color : "#9ca3af",
          fontSize: 10,
          fontWeight: on ? 700 : 400,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          textAlign: "center",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none"
        }
      }, press), f.label);
    })),
    // Expanded row: Duration slider. Shown when the user taps the
    // Duration pill or whenever the range has been narrowed. Layout
    // mirrors the pill rows above: an "All Duration" reset pill on
    // the left acts as the sub-row's left-hand label + reset affordance,
    // then the dual-thumb slider fills the remaining width.
    (() => {
      const [dMin, dMax] = durRange;
      const any = dMin === DUR_MIN && dMax === DUR_MAX;
      if (!durPillsOpen && any) return null;
      const pctLo = ((dMin - DUR_MIN) / (DUR_MAX - DUR_MIN)) * 100;
      const pctHi = ((dMax - DUR_MIN) / (DUR_MAX - DUR_MIN)) * 100;
      return /*#__PURE__*/React.createElement("div", {
        className: "fade-in",
        style: {
          display: "flex",
          alignItems: "center",
          rowGap: 6,
          columnGap: 8,
          borderTop: "1px solid #f0f0ee",
          paddingTop: 8,
          marginBottom: 8
        }
      },
        /*#__PURE__*/React.createElement("button", {
          type: "button",
          onClick: () => setDurRange([DUR_MIN, DUR_MAX]),
          title: "Reset duration range",
          style: {
            padding: "3px 9px",
            borderRadius: 20,
            border: `1px solid ${any ? "#c6dfc6" : "var(--c-border)"}`,
            background: any ? "var(--c-tint-success-bg)" : "#fff",
            color: any ? "#2d5a2d" : "#9ca3af",
            fontSize: 10,
            fontWeight: any ? 700 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            textAlign: "center",
            WebkitTapHighlightColor: "transparent",
            userSelect: "none"
          }
        }, "All Duration"),
        /*#__PURE__*/React.createElement("div", {
          className: "dur-slider-wrap",
          title: "Duration range"
        },
          /*#__PURE__*/React.createElement("div", { className: "dur-track" }),
          /*#__PURE__*/React.createElement("div", {
            className: "dur-fill",
            style: { left: pctLo + "%", right: (100 - pctHi) + "%" }
          }),
          /*#__PURE__*/React.createElement("input", {
            type: "range",
            className: "dur-slider",
            min: DUR_MIN, max: DUR_MAX, step: DUR_STEP,
            value: dMin,
            onChange: e => {
              const v = Math.min(Number(e.target.value), dMax - DUR_STEP < DUR_MIN ? dMax : dMax - DUR_STEP);
              setDurRange([Math.max(DUR_MIN, Math.min(v, dMax)), dMax]);
            },
            "aria-label": "Minimum duration"
          }),
          /*#__PURE__*/React.createElement("input", {
            type: "range",
            className: "dur-slider",
            min: DUR_MIN, max: DUR_MAX, step: DUR_STEP,
            value: dMax,
            onChange: e => {
              const v = Math.max(Number(e.target.value), dMin + DUR_STEP > DUR_MAX ? dMin : dMin + DUR_STEP);
              setDurRange([dMin, Math.min(DUR_MAX, Math.max(v, dMin))]);
            },
            "aria-label": "Maximum duration"
          })
        ),
        !any && /*#__PURE__*/React.createElement("span", {
          style: { fontSize: 11, fontWeight: 700, color: "var(--accent, #2d5a2d)", flexShrink: 0, minWidth: 46, textAlign: "right" }
        }, dMin === dMax ? `${dMin}m` : `${dMin}\u2013${dMax}m`)
      );
    })(),
    );
  }

  window.HabitsFilterPills = HabitsFilterPills;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { HabitsFilterPills };
  }
})();
