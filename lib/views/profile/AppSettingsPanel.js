// lib/views/profile/AppSettingsPanel.js
//
// Profile > App Settings panel: default-vs-custom mode toggle, accent
// palette, dark-mode switch, default-list expansions, custom-list
// managers (categories / importance / time-of-day), location +
// notification opt-ins, weekly-review + evening-debrief settings,
// time-range editor, walkthrough replay.
//
// Wave 4.4.6. Originally inline at index.html L16184-L16817 as a
// (() => {...})() IIFE. Body is preserved verbatim; a destructuring
// prelude re-binds every App-scope identifier the body references so
// it can keep using bare names.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function AppSettingsPanel(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    // Data + save
    const data = h.data || {};
    const save = h.save || (() => {});
    // Shell helpers
    const sectionTitle = h.sectionTitle;
    const inputS = h.inputS;
    const labelS = h.labelS;
    // Constants from lib/constants.js (top-level globals) — fall back to
    // window-side bindings or the local references for safety.
    const HT = h.HT || (typeof window !== "undefined" && window.HT) || [];
    const SECTIONS = h.SECTIONS || (typeof window !== "undefined" && window.SECTIONS) || [];
    const IMP = h.IMP || (typeof window !== "undefined" && window.IMP) || [];
    const DOW_ABBR = h.DOW_ABBR || (typeof window !== "undefined" && window.DOW_ABBR) || [];
    const DOW_ORDER = h.DOW_ORDER || (typeof window !== "undefined" && window.DOW_ORDER) || [];
    const DEFAULT_TIME_RANGES = h.DEFAULT_TIME_RANGES || (typeof window !== "undefined" && window.DEFAULT_TIME_RANGES) || {};
    // State values
    const accentColor = h.accentColor;
    const settingsMode = h.settingsMode || "default";
    const darkMode = !!h.darkMode;
    const newImpColor = h.newImpColor;
    const newSecColor = h.newSecColor;
    const expandedDefault = h.expandedDefault || {};
    // Setters
    const setAccentColor = h.setAccentColor || (() => {});
    const setAddCatModal = h.setAddCatModal || (() => {});
    const setDarkMode = h.setDarkMode || (() => {});
    const setExpandedDefault = h.setExpandedDefault || (() => {});
    const setGoalTypeFilter = h.setGoalTypeFilter || (() => {});
    const setImpFilter = h.setImpFilter || (() => {});
    const setNewCatColor = h.setNewCatColor || (() => {});
    const setNewCatName = h.setNewCatName || (() => {});
    const setSettingsMode = h.setSettingsMode || (() => {});
    const setShowProfile = h.setShowProfile || (() => {});
    const setTourDone = h.setTourDone || (() => {});
    const setTourStep = h.setTourStep || (() => {});
    // App helpers
    const tk = h.tk || (() => "");
    const touchFeature = h.touchFeature || (() => {});
    const updateRitual = h.updateRitual || (() => {});

        const isCustom = settingsMode === "custom";
        const swatch = (color) => /*#__PURE__*/React.createElement("span", {
          style: { width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }
        });
        const modeBtn = (val, title, subtitle) => /*#__PURE__*/React.createElement("button", {
          key: val,
          onClick: () => setSettingsMode(val),
          style: {
            flex: 1, padding: "12px 10px", borderRadius: 10, cursor: "pointer", textAlign: "left",
            background: settingsMode === val ? "var(--c-tint-success-bg)" : "var(--c-surface-raised)",
            border: settingsMode === val ? "2px solid #2d5a2d" : "1px solid #e5e7eb",
            color: "var(--c-text-strong)"
          }
        },
          /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, fontWeight: 700, marginBottom: 2 } }, title),
          /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280" } }, subtitle)
        );
        // Toggle switch helper (reusable pill-switch for Dark Mode)
        const toggleSwitch = (on, onToggle, label, sub) => /*#__PURE__*/React.createElement("div", {
          style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 12 }
        },
          /*#__PURE__*/React.createElement("div", { style: { flex: 1 } },
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--c-text-strong)", marginBottom: 2 } }, label),
            /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280" } }, sub)
          ),
          /*#__PURE__*/React.createElement("button", {
            "aria-pressed": on,
            onClick: onToggle,
            style: {
              width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: on ? "#2d5a2d" : "#d1d5db", position: "relative", flexShrink: 0,
              transition: "background .15s"
            }
          },
            /*#__PURE__*/React.createElement("span", {
              style: {
                position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20,
                borderRadius: "50%", background: "#fff", transition: "left .15s",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)"
              }
            })
          )
        );
        // Descriptions of the built-in defaults — shown when a default
        // row is tapped. Gives the user concrete example habits and
        // goals so they know what content belongs under each bucket.
        const DEFAULT_DESCRIPTIONS = {
          "cat:Physical": "Body-first goals. e.g. Run a half-marathon, lift 3x/week, sleep 8 hrs/night, meal prep on Sundays, drink 2L water daily.",
          "cat:Mental": "Mind and learning. e.g. Read 2 books/month, meditate 10 min/day, learn Spanish, therapy weekly, journal before bed.",
          "cat:Career": "Work and professional growth. e.g. Earn a promotion, ship a side project, network 1x/month, learn SQL, 90-min deep-work block daily.",
          "cat:Spiritual": "Meaning, purpose, reflection. e.g. Morning gratitude, weekly service, silent retreat, reread a sacred text, 15-min evening reflection.",
          "cat:Social": "Relationships. e.g. Call parents weekly, date night every Friday, host dinner monthly, remember friends' birthdays, 1:1 with a mentor.",
          "cat:Wealth": "Money and finances. e.g. Save 20% of income, max 401k, pay off car loan, weekly budget review, $0 on impulse buys this month.",
          "cat:Creative": "Making things. e.g. Write 500 words/day, paint weekly, learn guitar, launch a podcast, one photo a day.",
          "imp:Non-Negotiable": "The habits you'd feel broken without. Miss these and the day is off. Keep this list SHORT. e.g. Brush teeth, take meds, drink water, 20-min walk.",
          "imp:Important": "High-value but flexible. Hit them most days, skip them on hard ones without guilt. e.g. Workout, 30-min reading, journal, meal prep.",
          "imp:Additive": "Bonus momentum. Nice when you get to them, no damage when you don't. e.g. Clean desk, try a new recipe, extra cardio, long-form writing.",
          "sec:Morning": "Sets the tone for the day. e.g. Hydrate, stretch, write today's intention, make the bed, meditate, no-phone first hour.",
          "sec:Afternoon": "Mid-day push. e.g. Gym, 90-min deep-work block, lunch walk, 15-min creative practice, protein-rich lunch.",
          "sec:Evening": "Wind down and review. e.g. Dinner with family, screen-off hour, journal, plan tomorrow, read before bed.",
          "sec:Avoid": "Habits where you're trying to MINIMIZE the unit count rather than hit a target — set a ≤ cap and stay under it. e.g. ≤ 15 min Instagram, ≤ 0 drinks on weeknights, ≤ 1 sugary snack, ≤ 30 min doom-scrolling."
        };
        // Generic "manage list of categorized items" section (goal
        // categories, importance levels, time-of-day groups). Built-in
        // rows are tap-to-expand with a description; custom rows have
        // a × delete button. The header button label is "Edit <thing>"
        // since it both adds new items and hosts the delete affordances
        // on the custom rows below.
        const manageList = ({ listKey, titleLabel, builtIn, custom, onDelete, onAddClick, editLabel, keyField = "value", labelField = "value", iconField, subLabel }) => {
          const renderRow = (c, isBuiltIn) => {
            const label = c[labelField];
            const rowKey = listKey + ":" + label;
            const expanded = !!expandedDefault[rowKey];
            const desc = DEFAULT_DESCRIPTIONS[rowKey];
            return /*#__PURE__*/React.createElement("div", {
              key: (isBuiltIn ? "b-" : "c-") + c[keyField],
              style: { background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }
            },
              /*#__PURE__*/React.createElement("div", {
                style: {
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px"
                }
              },
                iconField && c[iconField] ? /*#__PURE__*/React.createElement("span", { style: { fontSize: 14 } }, c[iconField]) : swatch(c.color),
                /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, color: "var(--c-text-strong)", fontWeight: 500, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, label),
                isBuiltIn
                  ? /*#__PURE__*/React.createElement("span", { title: "Built-in (read-only)", style: { fontSize: 11, color: "var(--c-text-soft)", flexShrink: 0 } }, "\uD83D\uDD12")
                  : /*#__PURE__*/React.createElement("button", {
                      onClick: (e) => { e.stopPropagation(); onDelete(c); },
                      "aria-label": "Delete",
                      style: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 2 }
                    }, "\u00D7")
              ),
              // Built-in row descriptions are now ALWAYS visible
              // (used to be tap-to-expand). Custom rows still have
              // no description since the user authored them.
              isBuiltIn && desc ? /*#__PURE__*/React.createElement("div", {
                style: { padding: "0 12px 10px 30px", fontSize: 11, lineHeight: 1.55, color: "var(--c-text-soft)" }
              }, desc) : null
            );
          };
          return /*#__PURE__*/React.createElement("div", { style: { marginBottom: 18 } },
            /*#__PURE__*/React.createElement("div", {
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }
            },
              /*#__PURE__*/React.createElement("div", null,
                /*#__PURE__*/React.createElement("div", { style: labelS }, titleLabel),
                subLabel ? /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 2 } }, subLabel) : null
              ),
              isCustom ? /*#__PURE__*/React.createElement("button", {
                onClick: onAddClick,
                style: { background: "transparent", border: "1px dashed #d1d5db", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#6b7280", cursor: "pointer", fontWeight: 600 }
              }, editLabel) : null
            ),
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5 } },
              builtIn.map(c => renderRow(c, true)),
              isCustom ? custom.map(c => renderRow(c, false)) : null
            )
          );
        };
        // Palette swatches for pickers
        const palette = ["#2d5a2d","#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#14b8a6","#f97316","#db2777","#0891b2"];
        return /*#__PURE__*/React.createElement("div", null,
          sectionTitle("App Settings"),
          // Mode selector
          /*#__PURE__*/React.createElement("div", { style: labelS }, "Theme"),
          /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16 } },
            modeBtn("default", "Default", "Green accent + built-in categories"),
            modeBtn("custom", "Custom", "Your accent + your own categories")
          ),
          // Dark mode toggle
          toggleSwitch(darkMode, () => setDarkMode(d => !d), "Dark Mode", darkMode ? "Low-light theme active" : "Classic light theme"),
          // R-4: Evening Debrief opt-in. Off by default. When on, a purple
          //   entry card appears on the Brief tab after 6pm local time.
          toggleSwitch(
            !!data.eveningDebriefEnabled,
            () => save({ ...data, eveningDebriefEnabled: !data.eveningDebriefEnabled }),
            "Evening Debrief",
            data.eveningDebriefEnabled ? "A 3-step ritual after 6pm — log, reflect, set tomorrow." : "A 3-step ritual after 6pm — off by default."
          ),
          // Accent color picker (only visible in custom mode)
          isCustom ? /*#__PURE__*/React.createElement("div", { style: { marginBottom: 18 } },
            /*#__PURE__*/React.createElement("div", { style: labelS }, "Accent Color"),
            /*#__PURE__*/React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, padding: "12px 14px", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10 } },
              palette.map(c => /*#__PURE__*/React.createElement("button", {
                key: c,
                onClick: () => setAccentColor(c),
                "aria-label": "Set accent " + c,
                // `data-brand` on the Verrocchio-green swatch exempts it
                // from the .accent-custom remap, so it stays visibly green
                // even when the current accent is pink/blue/etc. — users
                // always have a visible way to return to the default.
                // Selected-ring uses a contrast color that works against
                // both a light background (dark mode off) and a dark one
                // (dark mode on): darkMode flips it white, otherwise dark.
                ...(c === "#2d5a2d" ? { "data-brand": "1" } : {}),
                style: { width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: accentColor === c ? ("3px solid " + (darkMode ? "#fff" : "#111")) : "3px solid transparent", padding: 0, boxSizing: "border-box" }
              })),
              /*#__PURE__*/React.createElement("label", {
                style: { width: 32, height: 32, borderRadius: "50%", border: "1px dashed #d1d5db", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
                title: "Pick any color"
              },
                /*#__PURE__*/React.createElement("span", { style: { fontSize: 16, color: "#9ca3af" } }, "\uD83C\uDFA8"),
                /*#__PURE__*/React.createElement("input", {
                  type: "color",
                  value: accentColor,
                  onChange: e => setAccentColor(e.target.value),
                  style: { position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }
                })
              )
            )
          ) : null,
          // Custom goal categories
          manageList({
            listKey: "cat",
            titleLabel: "Goal Categories",
            subLabel: isCustom ? "Tap a row to read what belongs in it" : "Tap a row to read what belongs in it · Switch to Custom to add your own",
            builtIn: HT,
            custom: data.customGoalTypes || [],
            onDelete: (cat) => {
              if (!window.confirm(`Delete category "${cat.value}"? Goals tagged with it will remain but their category will be cleared.`)) return;
              const nextCustom = (data.customGoalTypes || []).filter(t => t.value !== cat.value);
              const nextGoals = (data.goals || []).map(g => g.type === cat.value ? { ...g, type: "" } : g);
              save({ ...data, customGoalTypes: nextCustom, goals: nextGoals });
              setGoalTypeFilter(prev => (Array.isArray(prev) ? prev.filter(v => v !== cat.value) : []));
            },
            onAddClick: () => { setNewCatName(""); setNewCatColor("#6366f1"); setAddCatModal(true); },
            editLabel: "Edit Categories"
          }),
          // Custom importance levels
          manageList({
            listKey: "imp",
            titleLabel: "Habit Importance",
            subLabel: isCustom ? "Tap a row to see example habits" : "Tap a row to see example habits · Switch to Custom to add your own",
            builtIn: IMP,
            custom: data.customImportance || [],
            onDelete: (lvl) => {
              // Non-destructive cleanup: re-assign affected habits to
              // "Important" (the middle built-in tier) so no habit ends
              // up with an orphaned label the picker can't show. Mirrors
              // the goal-category cleanup just above.
              const affected = (data.habits || []).filter(h => h.importance === lvl.value);
              const fallback = "Important";
              const msg = affected.length === 0
                ? `Delete importance level "${lvl.value}"?`
                : `Delete "${lvl.value}"? ${affected.length} habit${affected.length === 1 ? "" : "s"} using it will be moved to "${fallback}".`;
              if (!window.confirm(msg)) return;
              const nextImp = (data.customImportance || []).filter(t => t.value !== lvl.value);
              const nextHabits = affected.length === 0
                ? data.habits
                : (data.habits || []).map(h => h.importance === lvl.value ? { ...h, importance: fallback } : h);
              save({ ...data, customImportance: nextImp, habits: nextHabits });
              setImpFilter(prev => (Array.isArray(prev) ? prev.filter(v => v !== lvl.value) : []));
            },
            onAddClick: () => {
              const name = window.prompt("New importance level name (e.g. Critical, Optional):", "");
              if (!name || !name.trim()) return;
              const v = name.trim();
              if (IMP.some(i => i.value === v) || (data.customImportance || []).some(i => i.value === v)) {
                window.alert("That importance level already exists.");
                return;
              }
              const c = newImpColor;
              save({ ...data, customImportance: [...(data.customImportance || []), { value: v, color: c, bg: c + "22", border: c + "66" }] });
            },
            editLabel: "Edit Importance"
          }),
          // Custom time-of-day groups
          manageList({
            listKey: "sec",
            titleLabel: "Time of Day",
            subLabel: isCustom ? "Tap a row to see example habits" : "Tap a row to see example habits · Switch to Custom to add your own",
            builtIn: SECTIONS.map(s => ({ ...s, value: s.label || s.value })),
            custom: (data.customSections || []).map(s => ({ ...s, value: s.label || s.value })),
            iconField: "icon",
            onDelete: (sec) => {
              const key = sec.label || sec.value;
              // The manageList rendering remaps `value: s.label || s.value`,
              // so `sec.value` here is the label, not the kebab-case value
              // habits actually store on h.section. Recover the original.
              const original = (data.customSections || []).find(t => (t.label || t.value) === key);
              const sectionValue = original ? original.value : key;
              const affected = (data.habits || []).filter(h => h.section === sectionValue);
              const fallback = "morning"; // earliest built-in section
              const msg = affected.length === 0
                ? `Delete time-of-day group "${key}"?`
                : `Delete "${key}"? ${affected.length} habit${affected.length === 1 ? "" : "s"} in this group will be moved to "Morning".`;
              if (!window.confirm(msg)) return;
              const nextSec = (data.customSections || []).filter(t => (t.label || t.value) !== key);
              const nextHabits = affected.length === 0
                ? data.habits
                : (data.habits || []).map(h => h.section === sectionValue ? { ...h, section: fallback } : h);
              save({ ...data, customSections: nextSec, habits: nextHabits });
            },
            onAddClick: () => {
              const label = window.prompt("New time-of-day group name (e.g. Late Night, Commute):", "");
              if (!label || !label.trim()) return;
              const v = label.trim();
              const value = v.toLowerCase().replace(/\s+/g, "-");
              if (SECTIONS.some(s => s.label === v) || (data.customSections || []).some(s => s.label === v)) {
                window.alert("That time-of-day group already exists.");
                return;
              }
              const icon = window.prompt("Pick an emoji icon for this group:", "\u2B50") || "\u2B50";
              const c = newSecColor;
              save({ ...data, customSections: [...(data.customSections || []), { value, label: v, icon, color: c, bg: c + "22", border: c + "66" }] });
            },
            editLabel: "Edit Time of Day"
          }),
          // Time-of-day hour boundaries. The morning/afternoon/evening
          // sections on the Habits tab auto-expand the block you're
          // currently in, and these ranges decide which block "now" is.
          // Evening wraps past midnight when end < start (e.g. 18→6).
          (() => {
            const ranges = (data && data.timeRanges && data.timeRanges.morning) ? data.timeRanges : DEFAULT_TIME_RANGES;
            const fmtHr = h => {
              const suf = h < 12 ? "AM" : "PM";
              const disp = h === 0 ? 12 : (h > 12 ? h - 12 : h);
              return disp + ":00 " + suf;
            };
            const setHour = (section, field, val) => {
              const next = {
                morning:   { ...ranges.morning },
                afternoon: { ...ranges.afternoon },
                evening:   { ...ranges.evening }
              };
              next[section][field] = val;
              save({ ...data, timeRanges: next });
            };
            const hourSelect = (section, field) => /*#__PURE__*/React.createElement("select", {
              value: ranges[section][field],
              onChange: e => setHour(section, field, parseInt(e.target.value, 10)),
              style: { flex: 1, padding: "6px 8px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "var(--c-text)", cursor: "pointer", minWidth: 0 }
            },
              Array.from({ length: 24 }, (_, h) => /*#__PURE__*/React.createElement("option", { key: h, value: h }, fmtHr(h)))
            );
            // Per-section description — surfaces the intent of each
            // bucket so the user understands what kinds of habits go
            // where (Morning = wake-up routine, Avoid = "don't do" lines,
            // etc.). Sub-text below the start/end pickers, not the
            // section label, so the row stays compact.
            const row = (section, icon, label, description) => /*#__PURE__*/React.createElement("div", {
              key: section,
              style: { display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 6 }
            },
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", alignItems: "center", gap: 8 }
              },
                /*#__PURE__*/React.createElement("span", { style: { fontSize: 14, flexShrink: 0 } }, icon),
                /*#__PURE__*/React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "var(--c-text-strong)", width: 76, flexShrink: 0 } }, label),
                hourSelect(section, "start"),
                /*#__PURE__*/React.createElement("span", { style: { fontSize: 11, color: "var(--c-text-soft)", flexShrink: 0 } }, "to"),
                hourSelect(section, "end")
              ),
              description && /*#__PURE__*/React.createElement("div", {
                style: { fontSize: 10, color: "var(--c-text-soft)", lineHeight: 1.45, paddingLeft: 22 }
              }, description)
            );
            // Coverage check \u2014 the three sections together must
            // cover a full 24-hour day. Compute the span of each
            // (allowing the evening section to wrap midnight) and
            // surface a red banner when the sum drifts away from
            // 24. Default values (6\u219212, 12\u219218, 18\u21926) total exactly
            // 24, so the banner stays hidden until the user pulls
            // a slider that creates a gap or an overlap.
            const span = sec => ((ranges[sec].end - ranges[sec].start + 24) % 24) || 24;
            const totalHrs = span("morning") + span("afternoon") + span("evening");
            const coverageOk = totalHrs === 24;
            return /*#__PURE__*/React.createElement("div", { style: { marginBottom: 18 } },
              /*#__PURE__*/React.createElement("div", { style: labelS }, "Time-of-Day Hours"),
              /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "var(--c-text-soft)", marginBottom: 8, lineHeight: 1.45 } }, "When \"Morning\", \"Afternoon\", and \"Evening\" start and end \u2014 evening can wrap past midnight. Habits and to-dos are sorted into these buckets on the Habits and Calendar tabs."),
              row("morning",   "\uD83C\uDF05", "Morning",
                "Wake-up routine and the work you front-load before the day starts pulling at you. Habits that need willpower or a fresh head go here."),
              row("afternoon", "\u2600\uFE0F", "Afternoon",
                "The productive middle of the day \u2014 meetings, deep work, exercise, errands. Habits that fit between meals or breaks."),
              row("evening",   "\uD83C\uDF19", "Evening",
                "Wind-down hours \u2014 family time, reflection, prep for tomorrow, sleep prep. Habits that benefit from a slower pace."),
              // Reference rows for the two non-clock sections so the
              // user understands them too. No hour selects since they
              // don't take a time range.
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 6, opacity: 0.85 }
              },
                /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                  /*#__PURE__*/React.createElement("span", { style: { fontSize: 14, flexShrink: 0 } }, "\u2713"),
                  /*#__PURE__*/React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "var(--c-text-strong)" } }, "Daily Completion"),
                  /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, color: "var(--c-text-soft)", marginLeft: "auto" } }, "all-day")
                ),
                /*#__PURE__*/React.createElement("div", {
                  style: { fontSize: 10, color: "var(--c-text-soft)", lineHeight: 1.45, paddingLeft: 22 }
                }, "Habits that just need to happen sometime today \u2014 no specific clock time. They sit at the bottom of the day on the Habits page and don't appear on the Calendar timeline.")
              ),
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 6, opacity: 0.85 }
              },
                /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                  /*#__PURE__*/React.createElement("span", { style: { fontSize: 14, flexShrink: 0 } }, "\uD83D\uDEAB"),
                  /*#__PURE__*/React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "var(--c-text-strong)" } }, "Avoid"),
                  /*#__PURE__*/React.createElement("span", { style: { fontSize: 10, color: "var(--c-text-soft)", marginLeft: "auto" } }, "anti-habits")
                ),
                /*#__PURE__*/React.createElement("div", {
                  style: { fontSize: 10, color: "var(--c-text-soft)", lineHeight: 1.45, paddingLeft: 22 }
                }, "Habits where you're trying to MINIMIZE the unit count rather than hit a target. Set a \u2264 cap and stay under it \u2014 e.g. \u2264 15 min Instagram, \u2264 1 drink, \u2264 30 min doom-scrolling. The day counts as won when you finish under the cap.")
              ),
              !coverageOk && /*#__PURE__*/React.createElement("div", {
                style: {
                  marginTop: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderLeft: "3px solid #dc2626",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11,
                  color: "#b91c1c",
                  lineHeight: 1.45
                }
              },
                /*#__PURE__*/React.createElement("div", { style: { fontWeight: 700, marginBottom: 2 } }, "Hours don't add up to a full day"),
                /*#__PURE__*/React.createElement("div", null,
                  "Morning + Afternoon + Evening currently cover ",
                  /*#__PURE__*/React.createElement("strong", null, totalHrs + " hr"),
                  " \u2014 should be 24. Adjust the start/end times so the three sections leave no gap and no overlap."
                )
              ),
              coverageOk && /*#__PURE__*/React.createElement("div", {
                style: { marginTop: 6, fontSize: 10, color: "#15803d", fontWeight: 600 }
              }, "\u2713 Hours total 24 \u2014 full-day coverage")
            );
          })(),
          // Location & Notifications — scaffolded for Capacitor. The
          // "Set home location" button captures a one-shot GPS fix via
          // the Web Geolocation API (Capacitor's @capacitor/geolocation
          // plugin will transparently override it on native). The two
          // toggles gate ANY automatic behavior so users who don't want
          // the app touching location or notifications don't get them.
          (() => {
            const coords = data.homeCoords;
            const hasCoords = !!(coords && typeof coords.lat === "number");
            const notifPerm = notificationService.permission();
            const captureHome = async () => {
              try {
                const pos = await locationService.getCurrent();
                save({ ...data, homeCoords: pos });
                touchFeature("settings.location");
              } catch (e) {
                alert("Couldn't capture location. Check that location access is allowed for this app.");
              }
            };
            const clearHome = () => save({ ...data, homeCoords: null, locationOptIn: false });
            const toggleLoc = (v) => save({ ...data, locationOptIn: !!v });
            const toggleNotif = async (v) => {
              if (v && notifPerm !== "granted") {
                const res = await notificationService.requestPermission();
                save({ ...data, notifyOptIn: res === "granted" });
                if (res === "granted") touchFeature("settings.notifications");
              } else {
                save({ ...data, notifyOptIn: !!v });
                if (v) touchFeature("settings.notifications");
              }
            };
            const rowS = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 8, marginBottom: 8, minHeight: 44 };
            const toggleStyle = (on) => ({
              width: 44, height: 26, borderRadius: 13, border: "1px solid " + (on ? "#2d5a2d" : "var(--c-border)"),
              background: on ? "#2d5a2d" : "var(--c-surface, #fff)",
              position: "relative", cursor: "pointer", flexShrink: 0,
              WebkitTapHighlightColor: "transparent", padding: 0
            });
            const knobStyle = (on) => ({
              position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: 10,
              background: on ? "#fff" : "#6b7280", transition: "left .15s"
            });
            return /*#__PURE__*/React.createElement("div", { style: { marginBottom: 18 } },
              /*#__PURE__*/React.createElement("div", { style: labelS }, "Location & Notifications"),
              /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "var(--c-text-soft)", marginBottom: 8 } }, "Optional. Track habits by location and get a nudge when you leave home. You can type a city/region manually if you'd rather not grant GPS access."),
              // Home location row — typed home label (city, neighborhood,
              // 'Home', etc.) doesn't require location permission. The
              // 'Capture GPS' button below is opt-in and only matters
              // for the away-detection toggle.
              /*#__PURE__*/React.createElement("div", { style: { ...rowS, flexDirection: "column", alignItems: "stretch" } },
                /*#__PURE__*/React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
                  /*#__PURE__*/React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, color: "var(--c-text)", fontWeight: 600 } }, "Home location"),
                    /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-soft)", marginTop: 2 } },
                      hasCoords
                        ? `GPS saved ${new Date(coords.capturedAt).toLocaleDateString()} · ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`
                        : ((data.homeLocation || "").trim() ? "Manual: typed below" : "Not set"))
                  ),
                  /*#__PURE__*/React.createElement("button", {
                    type: "button",
                    onClick: hasCoords ? clearHome : captureHome,
                    title: hasCoords ? "Remove the saved GPS coordinates" : "One-shot GPS fix — only needed for the 'when you leave home' nudge below",
                    style: { minHeight: 36, padding: "7px 12px", borderRadius: 8, border: "1px solid " + (hasCoords ? "#991b1b" : "var(--c-border)"), background: "transparent", color: hasCoords ? "#991b1b" : "var(--c-text-soft)", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }
                  }, hasCoords ? "Clear GPS" : "Capture GPS")
                ),
                /*#__PURE__*/React.createElement("input", {
                  type: "text",
                  value: data.homeLocation || "",
                  onChange: e => save({ ...data, homeLocation: e.target.value.slice(0, 60) }),
                  placeholder: "e.g. Brooklyn NY, Home, Mom's house — typed only, no GPS",
                  style: { ...inputS, fontSize: 12, padding: "7px 10px", marginTop: 8 }
                })
              ),
              // Auto-detect toggle
              /*#__PURE__*/React.createElement("div", { style: rowS },
                /*#__PURE__*/React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, color: "var(--c-text)", fontWeight: 600 } }, "Detect when I'm away"),
                  /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 2 } }, "One location check per app open. Battery-safe.")
                ),
                /*#__PURE__*/React.createElement("button", {
                  type: "button",
                  "aria-pressed": !!data.locationOptIn,
                  "aria-label": "Toggle away detection",
                  disabled: !hasCoords,
                  onClick: () => toggleLoc(!data.locationOptIn),
                  style: { ...toggleStyle(!!data.locationOptIn), opacity: hasCoords ? 1 : 0.4 }
                }, /*#__PURE__*/React.createElement("span", { style: knobStyle(!!data.locationOptIn) }))
              ),
              // Notifications toggle
              /*#__PURE__*/React.createElement("div", { style: rowS },
                /*#__PURE__*/React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, color: "var(--c-text)", fontWeight: 600 } }, "Notifications"),
                  /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginTop: 2 } },
                    notifPerm === "denied"
                      ? "Blocked by browser — enable in site settings."
                      : "Heads-up when you leave home; habit reminders later.")
                ),
                /*#__PURE__*/React.createElement("button", {
                  type: "button",
                  "aria-pressed": !!data.notifyOptIn,
                  "aria-label": "Toggle notifications",
                  disabled: notifPerm === "denied",
                  onClick: () => toggleNotif(!data.notifyOptIn),
                  style: { ...toggleStyle(!!data.notifyOptIn), opacity: notifPerm === "denied" ? 0.4 : 1 }
                }, /*#__PURE__*/React.createElement("span", { style: knobStyle(!!data.notifyOptIn) }))
              )
            );
          })(),
          // Briefing tone — shapes the voice of the daily briefing
          // (AI + deterministic fallback). Ordered with Neutral in the
          // middle so the default sits visually between the two ends of
          // the spectrum.
          (() => {
            const currentTone = data.aiTone || "neutral";
            const toneOpts = [
              { v: "encouraging", label: "Warm",      hint: "Lead with positive framing and celebrate progress." },
              { v: "neutral",     label: "Neutral",   hint: "Factual summary, no cheerleading or criticism." },
              { v: "tough-love",  label: "Tough love", hint: "Direct accountability without being cruel." }
            ];
            const pickTone = (v) => {
              save({ ...data, aiTone: v });
              touchFeature("settings.tone");
              // If today's briefing was already cached, clear it so the
              // next Home-tab visit regenerates in the new voice.
              const rit = (data.dailyRitual && data.dailyRitual[tk()]) || {};
              if (rit.briefing) updateRitual({ briefing: "" });
            };
            return /*#__PURE__*/React.createElement("div", { style: { marginBottom: 18 } },
              /*#__PURE__*/React.createElement("div", { style: labelS }, "Briefing Tone"),
              /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 8 } }, "How your daily briefing talks to you."),
              /*#__PURE__*/React.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 6 }
              }, toneOpts.map(t => {
                const on = currentTone === t.v;
                return /*#__PURE__*/React.createElement("button", {
                  key: t.v,
                  type: "button",
                  onClick: () => pickTone(t.v),
                  style: {
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "10px 12px",
                    border: "1px solid " + (on ? "#2d5a2d" : "var(--c-border)"),
                    borderRadius: 10,
                    background: on ? "var(--c-tint-success-bg)" : "var(--c-surface-raised)",
                    color: on ? "#2d5a2d" : "var(--c-text)",
                    fontSize: 13, fontWeight: on ? 700 : 500,
                    cursor: "pointer", textAlign: "left",
                    minHeight: 44
                  }
                },
                  /*#__PURE__*/React.createElement("div", {
                    style: { display: "flex", alignItems: "center", gap: 8, width: "100%" }
                  },
                    /*#__PURE__*/React.createElement("span", null, t.label),
                    on ? /*#__PURE__*/React.createElement("span", { style: { marginLeft: "auto", fontSize: 12 } }, "✓") : null
                  ),
                  /*#__PURE__*/React.createElement("div", {
                    style: { fontSize: 11, fontWeight: 500, color: on ? "#2d5a2d" : "#6b7280", marginTop: 4 }
                  }, t.hint)
                );
              }))
            );
          })(),
          // Weekly Review — day + hour to be prompted to reflect on
          // the week. Captured in onboarding; editable here after.
          (() => {
            const wr = (data && data.weeklyReview) || { day: 0, hour: 18 };
            const setWR = (patch) => save({ ...data, weeklyReview: { ...wr, ...patch } });
            const fmtHr = h => {
              const suf = h < 12 ? "AM" : "PM";
              const disp = h === 0 ? 12 : (h > 12 ? h - 12 : h);
              return disp + ":00 " + suf;
            };
            return /*#__PURE__*/React.createElement("div", { style: { marginBottom: 18 } },
              /*#__PURE__*/React.createElement("div", { style: labelS }, "Weekly Review"),
              /*#__PURE__*/React.createElement("div", { style: { fontSize: 10, color: "#9ca3af", marginBottom: 8 } }, "One moment a week to look back on progress, slips, and what to sharpen next."),
              /*#__PURE__*/React.createElement("div", {
                style: { padding: "10px", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 8 }
              },
                /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginBottom: 6 } }, "Day"),
                /*#__PURE__*/React.createElement("div", {
                  style: { display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }
                },
                  DOW_ORDER.map(dayVal => {
                    const on = wr.day === dayVal;
                    return /*#__PURE__*/React.createElement("button", {
                      key: "wr-d" + dayVal,
                      onClick: () => setWR({ day: dayVal }),
                      style: {
                        flex: 1, minWidth: 32, padding: "6px 0", fontSize: 11,
                        fontWeight: on ? 700 : 500,
                        border: "1px solid " + (on ? "#2d5a2d" : "#d1d5db"),
                        borderRadius: 6,
                        background: on ? "#2d5a2d" : "#fff",
                        color: on ? "#fff" : "var(--c-text-soft)",
                        cursor: "pointer"
                      }
                    }, DOW_ABBR[dayVal]);
                  })
                ),
                /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: "#6b7280", marginBottom: 6 } }, "Time"),
                /*#__PURE__*/React.createElement("select", {
                  value: wr.hour,
                  onChange: e => setWR({ hour: parseInt(e.target.value, 10) }),
                  style: { width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "var(--c-text)", cursor: "pointer" }
                },
                  Array.from({ length: 24 }, (_, h) => /*#__PURE__*/React.createElement("option", { key: h, value: h }, fmtHr(h)))
                )
              )
            );
          })(),
          // Replay guided tour — clears the "seen" flag and re-opens the
          // onboarding walkthrough from step 1. Available in all modes
          // (default + custom) so users who skipped on first login can
          // always come back to it.
          /*#__PURE__*/React.createElement("div", { style: { marginTop: 18, paddingTop: 16, borderTop: "1px solid #f3f4f6" } },
            /*#__PURE__*/React.createElement("div", { style: labelS }, "Guided Tour"),
            /*#__PURE__*/React.createElement("button", {
              onClick: () => {
                localStorage.removeItem("v-tour-done");
                setTourDone(false);
                setShowProfile(false);
                // Defer so the profile sheet has time to unmount before
                // the tour tries to anchor to the (now visible) nav.
                setTimeout(() => setTourStep(1), 350);
              },
              style: { width: "100%", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, color: "#2d5a2d", cursor: "pointer" }
            }, "Replay Welcome Tour")
          ),
          // Routine Compare has moved out to its own top-level Profile nav
          // section (My Routines). App Settings now only carries the things
          // that are genuinely app-configuration (theme, accent, custom
          // categories, guided tour replay).
          // Reset to defaults escape hatch
          isCustom ? /*#__PURE__*/React.createElement("button", {
            onClick: () => {
              if (!window.confirm("Reset theme + accent back to the Verrocchio defaults? Your custom categories will be kept.")) return;
              setSettingsMode("default");
              setAccentColor("#2d5a2d");
            },
            style: { width: "100%", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px", fontSize: 12, fontWeight: 600, color: "#6b7280", cursor: "pointer", marginTop: 16 }
          }, "Reset to Verrocchio Defaults") : null
        );
  }

  window.AppSettingsPanel = AppSettingsPanel;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = AppSettingsPanel;
  }
})();
