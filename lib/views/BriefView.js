// lib/views/BriefView.js — Phase B view extraction.
//
// Home / Daily Ritual tab. React.createElement throughout (no JSX, no
// build step). View-local state is permitted for ephemeral UI flags
// (the expanded-pill key, the bottom-sheet contents, the upcoming-date
// draft). Everything else flows through { data, dispatch, deviceProfile,
// callbacks } — see docs/superpowers/patterns/view-extraction.md.
//
// Most computation is pulled from briefDomain (lib/domains/brief.js).
// App-scope helpers that need closure access to App state (memoized
// correlations, off-schedule scan, AI fetch, predicate functions,
// theming, save() routing) come in via `callbacks` and `helpers`.

(function () {
  // Resolve briefDomain across browser and (defensive) Node contexts.
  // Browser: lib/domains/brief.js sets window.briefDomain at load time.
  // Node: require it explicitly so this file is also testable without
  // a DOM (the parse-check in the orchestrator script depends on this).
  let _briefDomain = null;
  if (typeof window !== "undefined" && window.briefDomain) {
    _briefDomain = window.briefDomain;
  } else if (typeof require !== "undefined") {
    try { _briefDomain = require("../domains/brief.js").briefDomain; } catch (_) {}
  }

  // React resolves from window (browser) or noop in Node parse-check.
  const R = (typeof window !== "undefined" && window.React) || null;

  // ───────────────────────────────────────────────────────────────────
  // BriefView component.
  // ───────────────────────────────────────────────────────────────────
  function BriefView(props) {
    // Hard-bail in the rare case the script is evaluated server-side
    // without React on the global. The orchestrator's parse-check stops
    // at require/load — it never calls the component.
    if (!R) return null;
    const data = (props && props.data) || {};
    const dispatch = (props && props.dispatch) || (() => {});
    const deviceProfile = props && props.deviceProfile;
    const cb = (props && props.callbacks) || {};

    // ── Pure derivations from briefDomain ────────────────────────────
    const rit = _briefDomain.todayRitualState(data);
    const todayK = rit.todayKey;
    // Past day key list (yesterday).
    const _pastDays = (typeof window !== "undefined" && window.pastDays) || ((n) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        out.push(dk(d));
      }
      return out;
    });
    const yest = _pastDays(2)[1];
    const today7 = (function () {
      const out = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        out.push(dk(d));
      }
      return out;
    })();

    // ── App-supplied helper predicates / memos via callbacks.helpers ──
    // These remain in App so they can close over App-scope state
    // (memoedCorrelations etc). All defaulted to safe no-ops so a
    // partial wiring during Phase C just hides a tip instead of
    // crashing.
    const h = (cb.helpers) || {};
    const matchesRoutine = h.matchesRoutine || (() => true);
    const isHabitDueOn = h.isHabitDueOn || (() => true);
    const isDone = h.isDone || (() => false);
    const isMissed = h.isMissed || (() => false);
    const isHabitIncomplete = h.isHabitIncomplete || (() => false);
    const isGoalIncomplete = h.isGoalIncomplete || (() => false);
    const isTodoIncomplete = h.isTodoIncomplete || (() => false);
    const isFutureHabit = h.isFutureHabit || (() => false);
    const isFutureGoal = h.isFutureGoal || (() => false);
    const habitLinkedToGoal = h.habitLinkedToGoal || (() => false);
    const getStreak = h.getStreak || ((x) => 0);
    const getCR = h.getCR || (() => ({ pct: 0 }));
    const detectAdditiveCrowding = h.detectAdditiveCrowding || (() => null);
    const memoedOffSchedule = h.memoedOffSchedule || [];
    const memoedCorrelations = h.memoedCorrelations || [];
    const aiEnabled = !!h.aiEnabled;
    const features = h.features || [];
    const HT = h.HT || [];
    const AB = h.AB || {
      background: "#2d5a2d", border: "none", borderRadius: 8,
      padding: "10px 18px", color: "#fff", fontSize: 13,
      fontWeight: 600, cursor: "pointer"
    };
    const Glyph = h.Glyph || ((_t, opts) => R.createElement("span", { style: { fontSize: (opts && opts.size) || 14 } }, "•"));
    const A11yDialog = h.A11yDialog || null;
    const VoiceMicButton = h.VoiceMicButton || (() => null);
    const accentColor = h.accentColor || "#2d5a2d";
    const settingsMode = h.settingsMode || "default";
    const themeLocked = !!h.themeLocked;
    const demoMode = !!h.demoMode;
    const pendingReviewPromptDay = h.pendingReviewPromptDay || (() => null);
    const completionDayCount = h.completionDayCount || (() => 0);
    const briefing = !!h.briefing;     // "generating" flag
    const briefTxt = h.briefTxt || "";
    const resistanceStep = h.resistanceStep || null;
    const resistanceFlagged = h.resistanceFlagged || [];
    const resistancePlanText = h.resistancePlanText || "";

    // App-supplied draft inputs (kept in App scope so a tab switch
    // doesn't reset them and so the journal save can read the same
    // textarea value).
    const jTxt = h.jTxt || "";
    const jMood = h.jMood || "";

    // App-supplied draft for the Upcoming Dates form. Kept in App for
    // continuity across tab switches.
    const upDateDraft = h.upDateDraft || { text: "", date: "" };

    // ── View-local UI state ──────────────────────────────────────────
    const [expandedPill, setExpandedPill] = R.useState(null);
    const [pillSheet, setPillSheet] = R.useState(null);

    // ── Active habit counts (matches inline behavior verbatim) ───────
    const habits = (data.habits || []);
    const activeH = habits.filter(h0 => matchesRoutine(h0) && !h0.parked);
    const dueToday = activeH.filter(h0 => isHabitDueOn(h0, todayK));
    const dueYesterday = activeH.filter(h0 => isHabitDueOn(h0, yest));
    const todayDone = dueToday.filter(h0 => isDone(h0, todayK)).length;
    const yestDone = dueYesterday.filter(h0 => isDone(h0, yest)).length;
    const yestMissedCount = dueYesterday.filter(h0 => isMissed(h0, yest)).length;
    const yestResolvedCount = yestDone + yestMissedCount;
    const todayDueCount = dueToday.length;
    const yestDueCount = dueYesterday.length;
    const pct7 = activeH.length
      ? Math.round(today7.reduce((s, d) => s + activeH.filter(h0 => isDone(h0, d)).length, 0) / (activeH.length * 7) * 100)
      : 0;
    const bestStreak = activeH.length > 0 ? Math.max(0, ...activeH.map(h0 => getStreak(h0))) : 0;
    const perfect7 = today7.filter(d => activeH.length > 0 && activeH.every(h0 => isDone(h0, d))).length;

    // ── Tips assembled via briefDomain ───────────────────────────────
    const smartTips = _briefDomain.tipsForToday(data, {
      aiEnabled,
      memoedOffSchedule,
      memoedCorrelations,
      isHabitIncomplete,
      isGoalIncomplete,
      isTodoIncomplete,
      isFutureHabit,
      isFutureGoal,
      getCR,
      activeHabits: activeH,
      features,
      deviceProfile
    });

    // Map `kind` -> onClick (callbacks own the actual action).
    const tipAction = (tip) => {
      switch (tip.kind) {
        case "off-schedule":
          return () => cb.onCoachContext && cb.onCoachContext({
            kind: "habit",
            habitId: tip.payload.habitId,
            reason: "off-schedule",
            suggestedSection: tip.payload.suggestedSection
          });
        case "open-goals":
          return () => cb.onOpenTab && cb.onOpenTab("goals");
        case "open-todos":
          return () => cb.onOpenTab && cb.onOpenTab("todos");
        case "coach-habit":
          return () => cb.onCoachContext && cb.onCoachContext({
            kind: "habit",
            habit: tip.payload.habit,
            reason: tip.payload.reason
          });
        case "coach-goal":
          return () => cb.onCoachContext && cb.onCoachContext({
            kind: "goal",
            goal: tip.payload.goal,
            reason: tip.payload.reason
          });
        default:
          return null;
      }
    };

    // ── Card / pill style constants (parity with inline render) ──────
    const cardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,.04)" };
    const titleStyle = { fontFamily: "'Lora',serif", fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 4 };
    const subTitleStyle = { fontSize: 12, color: "#9ca3af", marginBottom: 12 };

    // Reviewed-state pill (tap to expand, long-press for action sheet).
    const reviewedPill = (k, label, detail, actions) => {
      const isOpen = expandedPill === k;
      let pressTimer = null;
      let longFired = false;
      const startPress = () => {
        longFired = false;
        pressTimer = setTimeout(() => {
          longFired = true;
          setPillSheet({ title: label, actions });
        }, 500);
      };
      const endPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
      const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } longFired = true; };
      const handleClick = () => { if (longFired) return; setExpandedPill(isOpen ? null : k); };
      return R.createElement("div", {
        key: k,
        onClick: handleClick,
        onMouseDown: startPress, onMouseUp: endPress, onMouseLeave: cancelPress,
        onTouchStart: startPress, onTouchEnd: endPress, onTouchMove: cancelPress, onTouchCancel: cancelPress,
        onContextMenu: e => e.preventDefault(),
        style: {
          background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10,
          padding: "10px 14px", marginBottom: 10, cursor: "pointer",
          userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none"
        }
      },
        R.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          R.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: "#2d5a2d" } }, "✓"),
          R.createElement("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: "var(--c-text)" } }, label),
          R.createElement("span", { style: { fontSize: 11, color: "#6b7280", fontWeight: 500 } }, isOpen ? "▲" : "▼")
        ),
        isOpen && detail ? R.createElement("div", {
          style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid #d8ead8", fontSize: 12, color: "var(--c-text-soft)", lineHeight: 1.6 }
        }, detail) : null
      );
    };

    // ── Pinned intention card ────────────────────────────────────────
    const intentionAccent = (settingsMode === "custom" && !themeLocked && accentColor) ? accentColor : "#2d5a2d";
    const intMix = (hex, pct) => {
      try {
        const h0 = String(hex).replace("#", "");
        const full = h0.length === 3 ? h0.split("").map(c => c + c).join("") : h0;
        const num = parseInt(full, 16);
        if (isNaN(num)) return hex;
        let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
        if (pct >= 0) {
          r = Math.round(r + (255 - r) * pct);
          g = Math.round(g + (255 - g) * pct);
          b = Math.round(b + (255 - b) * pct);
        } else {
          r = Math.round(r * (1 + pct));
          g = Math.round(g * (1 + pct));
          b = Math.round(b * (1 + pct));
        }
        return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
      } catch (_) { return hex; }
    };
    const intRgb = (hex) => {
      try {
        const h0 = String(hex).replace("#", "");
        const full = h0.length === 3 ? h0.split("").map(c => c + c).join("") : h0;
        const num = parseInt(full, 16);
        if (isNaN(num)) return [45, 90, 45];
        return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
      } catch (_) { return [45, 90, 45]; }
    };
    const intRgbTuple = intRgb(intentionAccent);
    const intentionPinned = rit.intentionSet ? R.createElement("div", {
      key: "int-pin",
      style: {
        background: "linear-gradient(135deg, " + intentionAccent + ", " + intMix(intentionAccent, 0.22) + ")",
        borderRadius: 12, padding: "16px 18px", marginBottom: 12,
        boxShadow: "0 2px 8px rgba(" + intRgbTuple[0] + "," + intRgbTuple[1] + "," + intRgbTuple[2] + ",.22)",
        color: "#fff"
      }
    },
      R.createElement("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "rgba(255,255,255,.8)", marginBottom: 6 } }, "TODAY'S INTENTION"),
      R.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 600, lineHeight: 1.45, marginBottom: 10 } }, rit.intention),
      R.createElement("button", {
        onClick: () => cb.onUpdateRitual && cb.onUpdateRitual({ intention: "" }),
        style: { background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }
      }, "Edit")
    ) : null;

    const bottomPills = [];

    // ── Daily Briefing card / pill ───────────────────────────────────
    if (rit.briefingReviewed) {
      bottomPills.push(reviewedPill(
        "brief-p",
        "Daily Briefing reviewed",
        briefTxt
          ? R.createElement("div", { style: { whiteSpace: "pre-wrap" } }, briefTxt)
          : "No briefing was generated today.",
        [
          { label: "Regenerate briefing", onClick: () => { setExpandedPill(null); cb.onGenBrief && cb.onGenBrief(); cb.onUpdateRitual && cb.onUpdateRitual({ briefingReviewed: false }); } },
          { label: "Undo review", onClick: () => { setExpandedPill(null); cb.onUpdateRitual && cb.onUpdateRitual({ briefingReviewed: false }); } }
        ]
      ));
    }

    const dueYesterdayNonAvoid = dueYesterday.filter(h0 => h0.section !== "avoid");
    const yestResolvedNonAvoid = dueYesterdayNonAvoid.filter(h0 => isDone(h0, yest) || isMissed(h0, yest)).length;
    const briefGateOpen = dueYesterdayNonAvoid.length === 0 || yestResolvedNonAvoid === dueYesterdayNonAvoid.length;
    const briefIsWelcomeStage = completionDayCount() < 7;
    const refreshAllowed = (briefIsWelcomeStage || briefGateOpen) && !briefing;
    const refreshTooltip = briefing
      ? "Generating…"
      : (!briefGateOpen && !briefIsWelcomeStage
          ? "Mark yesterday's habits done or missed first."
          : "Refresh briefing");
    const refreshBtn = R.createElement("button", {
      type: "button",
      "aria-label": "Refresh briefing",
      title: refreshTooltip,
      disabled: !refreshAllowed,
      onClick: () => {
        if (!refreshAllowed) return;
        cb.onClearBriefTxt && cb.onClearBriefTxt();
        cb.onUpdateRitual && cb.onUpdateRitual({ briefing: "" });
        cb.onGenBrief && cb.onGenBrief();
      },
      style: {
        width: 28, height: 28, borderRadius: "50%",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "transparent",
        border: "1px solid var(--c-border, #e5e7eb)",
        color: refreshAllowed ? "var(--c-text-faint, #9ca3af)" : "var(--c-text-faint, #d1d5db)",
        fontSize: 14, lineHeight: 1,
        cursor: refreshAllowed ? "pointer" : "not-allowed",
        opacity: refreshAllowed ? 1 : 0.45,
        padding: 0, flexShrink: 0
      }
    }, briefing ? "⋯" : "↻");

    const briefingCard = rit.briefingReviewed
      ? null
      : R.createElement("div", { key: "brief", style: cardStyle },
          R.createElement("div", {
            style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }
          },
            R.createElement("div", {
              style: { fontFamily: "'Lora',serif", fontSize: 16, fontWeight: 700, color: "var(--c-text-strong)" }
            }, "Your Daily Briefing"),
            refreshBtn
          ),
          briefing && R.createElement("div", {
            className: "pulsing",
            style: { textAlign: "center", padding: "28px 0", color: "#9ca3af", fontSize: 13 }
          }, "Generating your briefing…"),
          !briefing && briefTxt && R.createElement("div", {
            style: { fontSize: 14, lineHeight: 1.8, color: "var(--c-text-soft)", whiteSpace: "pre-wrap", marginBottom: 14 }
          }, briefTxt),
          !briefing && !briefTxt && (function () {
            const BRIEF_UNLOCK = 3;
            const visits = Math.max(1, (data.dayVisits || []).length);
            const remaining = Math.max(0, BRIEF_UNLOCK - visits);
            if (!briefIsWelcomeStage && !briefGateOpen) {
              return R.createElement("div", {
                style: { textAlign: "center", padding: "20px 6px", color: "var(--c-text-faint, #9ca3af)", fontSize: 13, lineHeight: 1.5 }
              },
                R.createElement("div", { style: { marginBottom: 10 } },
                  "Mark yesterday's habits done or missed to generate today's briefing."
                ),
                R.createElement("button", {
                  type: "button",
                  onClick: () => { cb.onOpenYesterdayInHabits && cb.onOpenYesterdayInHabits(yest); },
                  style: {
                    background: "transparent",
                    border: "1px solid var(--c-border, #e5e7eb)",
                    color: "var(--c-text-strong, #374151)",
                    fontSize: 12, fontWeight: 600,
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer"
                  }
                }, "Review yesterday")
              );
            }
            const msg = remaining > 0
              ? `Log ${remaining} more day${remaining === 1 ? "" : "s"} of use to unlock your daily briefing.`
              : "Add a goal or habit to see your first briefing.";
            return R.createElement("div", {
              style: { textAlign: "center", padding: "22px 0", color: "#9ca3af", fontSize: 13, lineHeight: 1.5 }
            }, msg);
          })(),
          !briefing && briefTxt && R.createElement("button", {
            onClick: () => cb.onUpdateRitual && cb.onUpdateRitual({ briefingReviewed: true }),
            style: Object.assign({}, AB, { width: "100%", padding: "9px" })
          }, "Mark as Reviewed ✓")
        );

    // ── Yesterday's-habits card (with resistance flow) ───────────────
    const yMissedHabits = (function () {
      const missedDueStreak = (h0) => {
        if (!h0) return 0;
        const fq = h0.frequency || { type: "daily" };
        const type = fq.type === "weekly-day" ? "weekly" : (fq.type || "daily");
        const startKey = h0.startDate || null;
        let s = 0;
        for (let i = 1; i <= 60; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const k = dk(d);
          if (startKey && k < startKey) break;
          let due = true;
          if (type === "weekdays") due = Array.isArray(fq.days) && fq.days.includes(d.getDay());
          else if (type === "weekly") due = (typeof fq.day === "number" ? fq.day : 1) === d.getDay();
          else if (type === "monthly") due = (fq.monthDay || 1) === d.getDate();
          else if (type === "quarterly") {
            const m = typeof fq.month === "number" ? fq.month : 0;
            const md = fq.monthDay || 1;
            due = ((d.getMonth() - m) % 3 + 3) % 3 === 0 && d.getDate() === md;
          } else if (type === "annual") {
            const m = typeof fq.month === "number" ? fq.month : 0;
            const md = fq.monthDay || 1;
            due = d.getMonth() === m && d.getDate() === md;
          }
          if (!due) continue;
          const v = h0.completions && h0.completions[k];
          const done = v === "done" || v === true;
          if (done) break;
          s++;
        }
        return s;
      };
      return activeH
        .map(h0 => ({ h: h0, streak: missedDueStreak(h0) }))
        .filter(x => x.streak >= 2)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5)
        .map(x => x.h);
    })();
    const yMissedIds = yMissedHabits.map(h0 => h0.id);
    const ritResistanceDoneFor = (data.dailyRitual && data.dailyRitual[todayK] && data.dailyRitual[todayK].resistanceCompletedFor) || null;
    const resistanceAlreadyDone = ritResistanceDoneFor === yest;
    const inResistance = rit.yesterdayReviewed && resistanceStep && yMissedHabits.length > 0 && !resistanceAlreadyDone;

    const yesterdayCard = inResistance
      ? (function () {
          const flagged = resistanceFlagged.filter(id => yMissedIds.includes(id));
          const flaggedHabits = yMissedHabits.filter(h0 => flagged.includes(h0.id));
          if (resistanceStep === "rank") {
            return R.createElement("div", { key: "yd-rank", style: cardStyle },
              R.createElement("div", { style: titleStyle }, "Which Are You Resisting?"),
              R.createElement("div", { style: subTitleStyle }, "Tap the habits you avoided yesterday to rank them — most resisted first."),
              R.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 260, overflowY: "auto" }
              }, yMissedHabits.map(h0 => {
                const idx = flagged.indexOf(h0.id);
                const isFlagged = idx >= 0;
                return R.createElement("div", {
                  key: "rh-" + h0.id,
                  onClick: () => cb.onToggleResistanceFlag && cb.onToggleResistanceFlag(h0.id),
                  style: {
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px",
                    background: isFlagged ? "var(--c-tint-danger-bg)" : "var(--c-surface-raised)",
                    border: "1px solid " + (isFlagged ? "var(--c-tint-danger-border)" : "var(--c-border)"),
                    borderLeft: isFlagged ? "3px solid var(--c-tint-danger-fg)" : "1px solid var(--c-border)",
                    borderRadius: 8, cursor: "pointer", userSelect: "none"
                  }
                },
                  R.createElement("div", {
                    style: { width: 22, textAlign: "center", fontSize: 11, fontWeight: 700, color: isFlagged ? "var(--c-tint-danger-fg)" : "#9ca3af" }
                  }, isFlagged ? "#" + (idx + 1) : "·"),
                  R.createElement("div", {
                    style: { flex: 1, fontSize: 13, color: "var(--c-text)", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }
                  }, h0.text)
                );
              })),
              R.createElement("div", { style: { display: "flex", gap: 8 } },
                R.createElement("button", {
                  onClick: () => cb.onFinishResistance && cb.onFinishResistance({ skipPlan: true, yest }),
                  style: { flex: 1, background: "var(--c-surface-muted)", border: "none", borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 600, color: "#6b7280", cursor: "pointer" }
                }, "Skip"),
                R.createElement("button", {
                  onClick: () => cb.onSetResistanceStep && cb.onSetResistanceStep("plan"),
                  disabled: flagged.length === 0,
                  style: { flex: 2, background: flagged.length === 0 ? "#9ca3af" : "#b91c1c", border: "none", borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: flagged.length === 0 ? "default" : "pointer", opacity: flagged.length === 0 ? 0.6 : 1 }
                }, "Next: Restructure →")
              )
            );
          }
          return R.createElement("div", { key: "yd-plan", style: cardStyle },
            R.createElement("div", { style: titleStyle }, "Restructure Today"),
            R.createElement("div", { style: subTitleStyle },
              "How will today be different so " +
              (flaggedHabits.length === 1
                ? `"${flaggedHabits[0].text.slice(0, 40)}"`
                : flaggedHabits.length + " habits") +
              " actually happen?"
            ),
            R.createElement("textarea", {
              value: resistancePlanText,
              onChange: e => cb.onSetResistancePlanText && cb.onSetResistancePlanText(e.target.value),
              placeholder: "Move it earlier, stack it after coffee, prep the gear the night before, schedule a reminder...",
              rows: 4,
              style: { width: "100%", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", color: "var(--c-text)", fontSize: 13, lineHeight: 1.5, outline: "none", fontFamily: "system-ui,-apple-system,sans-serif", resize: "none", marginBottom: 10, boxSizing: "border-box" }
            }),
            R.createElement("div", { style: { display: "flex", gap: 8 } },
              R.createElement("button", {
                onClick: () => cb.onSetResistanceStep && cb.onSetResistanceStep("rank"),
                style: { flex: 1, background: "var(--c-surface-muted)", border: "none", borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 600, color: "#6b7280", cursor: "pointer" }
              }, "← Back"),
              R.createElement("button", {
                onClick: () => cb.onFinishResistance && cb.onFinishResistance({ yest }),
                style: { flex: 2, background: "#2d5a2d", border: "none", borderRadius: 8, padding: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }
              }, resistancePlanText.trim() ? "Save plan & continue" : "Skip plan & continue")
            )
          );
        })()
      : (rit.yesterdayReviewed
        ? null
        : (function () {
          const openYesterdayInHabits = () => cb.onOpenYesterdayInHabits && cb.onOpenYesterdayInHabits(yest);
          return R.createElement("div", { key: "yd", style: cardStyle },
            R.createElement("div", {
              onClick: openYesterdayInHabits,
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }
            },
              R.createElement("div", { style: titleStyle }, "Review Yesterday's Habits"),
              (function () {
                const resolved = yestDueCount === 0 || yestResolvedCount === yestDueCount;
                return R.createElement("span", {
                  style: { fontSize: 11, fontWeight: 700, color: resolved ? "#15803d" : "#b45309", flexShrink: 0, marginLeft: 8, background: resolved ? "var(--c-tint-success-bg)" : "#fef3c7", padding: "3px 8px", borderRadius: 12 }
                }, yestDueCount === 0 ? "None due" : (yestResolvedCount + "/" + yestDueCount + " Recorded"));
              })()
            ),
            R.createElement("div", {
              onClick: openYesterdayInHabits,
              style: { fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 1.45, cursor: "pointer" }
            }, yestDueCount === 0
              ? "No habits were scheduled for yesterday."
              : "Tap to open yesterday's habits and mark each one done or missed."
            ),
            (yestDueCount === 0 || yestResolvedCount === yestDueCount)
              ? R.createElement("button", {
                  onClick: () => cb.onMarkYesterdayReviewed && cb.onMarkYesterdayReviewed({
                    yest, hasMissed: yMissedHabits.length > 0, resistanceAlreadyDone
                  }),
                  style: Object.assign({}, AB, { width: "100%", padding: "9px" })
                }, "Mark Reviewed ✓")
              : null
          );
        })());

    if (rit.yesterdayReviewed && !inResistance) {
      const pillKey = "yd-p";
      const pillActions = [
        { label: "Edit yesterday in Habits", onClick: () => { setExpandedPill(null); cb.onOpenYesterdayInHabits && cb.onOpenYesterdayInHabits(yest); } },
        { label: "Undo review", onClick: () => { setExpandedPill(null); cb.onUpdateRitual && cb.onUpdateRitual({ yesterdayReviewed: false }); } }
      ];
      let pressTimer = null;
      let longFired = false;
      const startPress = () => {
        longFired = false;
        pressTimer = setTimeout(() => {
          longFired = true;
          setPillSheet({ title: "Yesterday's habits reviewed", actions: pillActions });
        }, 500);
      };
      const endPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
      const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } longFired = true; };
      bottomPills.push(R.createElement("div", {
        key: pillKey,
        onClick: () => { if (longFired) return; cb.onOpenYesterdayInHabits && cb.onOpenYesterdayInHabits(yest); },
        onMouseDown: startPress, onMouseUp: endPress, onMouseLeave: cancelPress,
        onTouchStart: startPress, onTouchEnd: endPress, onTouchMove: cancelPress, onTouchCancel: cancelPress,
        onContextMenu: e => e.preventDefault(),
        style: {
          background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10,
          padding: "10px 14px", marginBottom: 10, cursor: "pointer",
          userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none"
        }
      },
        R.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          R.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: "#2d5a2d" } }, "✓"),
          R.createElement("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: "var(--c-text)" } }, "Yesterday's habits reviewed"),
          R.createElement("span", { style: { fontSize: 11, color: "#6b7280", fontWeight: 500 } }, yestDone + "/" + yestDueCount)
        )
      ));
    }

    // ── Intention input card ─────────────────────────────────────────
    const intentionInput = !rit.intentionSet ? R.createElement("div", { key: "int-in", style: cardStyle },
      R.createElement("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }
      },
        R.createElement("div", { style: Object.assign({}, titleStyle, { marginBottom: 0 }) }, "Set Today's Intention"),
        R.createElement(VoiceMicButton, {
          label: "Dictate intention",
          onTranscript: (txt) => cb.onAppendJournalDraft && cb.onAppendJournalDraft(txt)
        })
      ),
      R.createElement("div", { style: subTitleStyle }, "What is the one thing you must accomplish today?"),
      R.createElement("textarea", {
        value: jTxt,
        onChange: e => cb.onSetJournalDraft && cb.onSetJournalDraft(e.target.value),
        placeholder: "Write your intention for today (or tap the mic)...",
        rows: 3,
        style: { width: "100%", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", color: "var(--c-text)", fontSize: 13, lineHeight: 1.6, outline: "none", fontFamily: "system-ui,-apple-system,sans-serif", resize: "none", marginBottom: 10, boxSizing: "border-box" }
      }),
      R.createElement("button", {
        onClick: () => cb.onSaveIntention && cb.onSaveIntention({ text: jTxt, mood: jMood }),
        style: Object.assign({}, AB, { width: "100%", padding: "9px" })
      }, "Save Intention")
    ) : null;

    // ── Tips card / pill ─────────────────────────────────────────────
    const tipsCard = rit.tipsReviewed
      ? null
      : R.createElement("div", { key: "tips", style: cardStyle },
          R.createElement("div", { style: titleStyle }, "Tips & Reminders"),
          smartTips.length === 0
            ? R.createElement("div", { style: { fontSize: 12, color: "var(--c-text-faint)", padding: "8px 0 12px" } }, "No tips today - you're on track.")
            : R.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }
              },
                smartTips.slice(0, 3).map((tip, i) => {
                  const onClick = tipAction(tip);
                  return R.createElement("div", {
                    key: "tip" + i,
                    onClick: onClick || undefined,
                    style: { display: "flex", alignItems: "flex-start", gap: 10, background: "var(--c-surface-raised)", borderRadius: 8, padding: "10px 12px", cursor: onClick ? "pointer" : "default", border: "1px solid var(--c-border)" }
                  },
                    R.createElement("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, flexShrink: 0, marginTop: 1 } }, Glyph(tip.icon, { size: 16 })),
                    R.createElement("div", { style: { flex: 1, minWidth: 0 } },
                      R.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--c-text-soft)", marginBottom: 2 } }, tip.title),
                      R.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", lineHeight: 1.5 } }, tip.body)
                    ),
                    onClick && R.createElement("svg", {
                      width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--c-text-faint)", strokeWidth: "2",
                      style: { flexShrink: 0, marginTop: 4 }
                    }, R.createElement("polyline", { points: "9 18 15 12 9 6" }))
                  );
                })
              ),
          R.createElement("button", {
            onClick: () => cb.onUpdateRitual && cb.onUpdateRitual({ tipsReviewed: true }),
            style: Object.assign({}, AB, { width: "100%", padding: "9px" })
          }, "Mark Tips Reviewed ✓")
        );

    // ── Dashboard ────────────────────────────────────────────────────
    const dashboardCard = R.createElement("div", { key: "dash", style: cardStyle },
      R.createElement("div", { style: titleStyle }, "Today's Progress"),
      R.createElement("div", { style: subTitleStyle }, "Tap any tile to see how it's calculated."),
      R.createElement("div", {
        style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8, marginBottom: 10 }
      },
        R.createElement("button", {
          type: "button",
          "aria-label": "Open yesterday's habits",
          onClick: () => cb.onOpenYesterdayInHabits && cb.onOpenYesterdayInHabits(yest),
          style: { background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 10, padding: "12px", cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }
        },
          R.createElement("div", { className: "eyebrow", style: { color: "var(--c-text-faint)", marginBottom: 4 } }, "Yesterday"),
          R.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, color: (yestDueCount > 0 && yestDone === yestDueCount) ? "#22c55e" : "#d97706" } },
            yestDone,
            R.createElement("span", { style: { fontSize: 13, color: "var(--c-text-faint)" } }, "/", yestDueCount)
          ),
          R.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", marginTop: 2 } }, "habits done")
        ),
        R.createElement("button", {
          type: "button",
          "aria-label": "Open today's habits",
          onClick: () => cb.onOpenTodayInHabits && cb.onOpenTodayInHabits(todayK),
          style: { background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10, padding: "12px", cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }
        },
          R.createElement("div", { className: "eyebrow", style: { color: "#2d5a2d", marginBottom: 4 } }, "Today"),
          R.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, color: "#2d5a2d" } },
            todayDone,
            R.createElement("span", { style: { fontSize: 13, color: "var(--c-text-faint)" } }, "/", todayDueCount)
          ),
          R.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", marginTop: 2 } }, "habits done")
        )
      ),
      R.createElement("div", {
        style: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }
      },
        [
          { label: "7-Day",   val: pct7 + "%",         color: "#0891b2", title: "Average habits-completed % across the last 7 days. Tap to open Habits.",                  onClick: () => cb.onOpenTodayInHabits && cb.onOpenTodayInHabits(todayK) },
          { label: "Streak",  val: bestStreak,         color: "#d97706", title: "Longest consecutive-due-day streak across all your habits. Tap to open Habits.",          onClick: () => cb.onOpenTodayInHabits && cb.onOpenTodayInHabits(todayK) },
          { label: "Perfect", val: perfect7,           color: "#2d5a2d", title: "Days in the last 7 where every active habit was done. Tap to open the Calendar heatmap.", onClick: () => cb.onOpenCalendarModal && cb.onOpenCalendarModal() },
          { label: "Goals",   val: (data.goals || []).length, color: "#7c3aed", title: "Active goals you're tracking. Tap to open Goals.",                                  onClick: () => cb.onOpenTab && cb.onOpenTab("goals") }
        ].map(s => R.createElement("button", {
          key: s.label,
          type: "button",
          onClick: s.onClick,
          title: s.title,
          "aria-label": s.label + ": " + s.val + ". " + s.title,
          style: { textAlign: "center", background: "var(--c-surface-raised)", borderRadius: 8, padding: "8px 4px", border: "1px solid var(--c-border)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }
        },
          R.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 700, color: s.color } }, s.val),
          R.createElement("div", { style: { fontSize: 9, color: "var(--c-text-faint)", fontWeight: 600, textTransform: "uppercase" } }, s.label)
        ))
      )
    );

    if (rit.tipsReviewed) {
      bottomPills.push(reviewedPill(
        "tips-p",
        "Tips reviewed",
        smartTips.length > 0
          ? R.createElement("div", null, smartTips.slice(0, 3).map((t, i) =>
              R.createElement("div", { key: "td" + i, style: { marginBottom: 4 } }, t.icon + "  " + t.title)))
          : "No tips today.",
        [
          { label: "Show tips again", onClick: () => { setExpandedPill(null); cb.onUpdateRitual && cb.onUpdateRitual({ tipsReviewed: false }); } }
        ]
      ));
    }

    // ── Bottom-sheet ─────────────────────────────────────────────────
    const sheet = pillSheet && A11yDialog ? R.createElement(A11yDialog, {
      onHide: () => setPillSheet(null),
      ariaLabelledby: "pillsheet-title",
      overlayStyle: { background: "rgba(17,24,39,.45)", zIndex: 200 },
      cardStyle: { maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "14px 16px 22px", boxShadow: "0 -4px 20px rgba(0,0,0,.2)" }
    },
        R.createElement("div", { style: { width: 40, height: 4, background: "#d1d5db", borderRadius: 2, margin: "0 auto 14px" } }),
        R.createElement("div", {
          id: "pillsheet-title",
          style: { fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", marginBottom: 12 }
        }, pillSheet.title),
        pillSheet.actions.map((a, i) => R.createElement("button", {
          key: "act" + i,
          "data-a11y-dialog-hide": true,
          onClick: () => a.onClick(),
          style: { width: "100%", background: "var(--c-surface-raised)", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, color: "var(--c-text)", marginBottom: 8, cursor: "pointer", textAlign: "center" }
        }, a.label)),
        R.createElement("button", {
          "data-a11y-dialog-hide": true,
          style: { width: "100%", background: "transparent", border: "none", padding: "10px", fontSize: 13, color: "#6b7280", cursor: "pointer", marginTop: 4 }
        }, "Cancel")
    ) : null;

    const pillsSection = bottomPills.length > 0 ? R.createElement("div", {
      key: "pills", style: { marginTop: 4 }
    }, bottomPills) : null;

    // ── Review banner ────────────────────────────────────────────────
    const reviewMilestone = !demoMode ? pendingReviewPromptDay() : null;
    const reviewBanner = reviewMilestone ? R.createElement("div", {
      key: "rev-banner-" + reviewMilestone,
      style: { background: "linear-gradient(135deg, #2d5a2d, #3d7a3d)", borderRadius: 12, padding: "14px 16px", marginBottom: 12, color: "#fff", boxShadow: "0 2px 8px rgba(45,90,45,.15)" }
    },
      R.createElement("div", { style: { fontFamily: "'Lora',serif", fontSize: 15, fontWeight: 700, marginBottom: 4 } },
        reviewMilestone === 7 ? "One week in — how's it feeling?"
          : reviewMilestone === 14 ? "Two weeks of Verrocchio"
          : "A month of Verrocchio"),
      R.createElement("div", { style: { fontSize: 12, lineHeight: 1.5, marginBottom: 10, color: "rgba(255,255,255,0.88)" } },
        "If the app's been useful, a quick rating helps other people find it. Takes 30 seconds."),
      R.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
        R.createElement("button", {
          onClick: () => cb.onOpenReviewLink && cb.onOpenReviewLink(reviewMilestone),
          style: { background: "#fff", color: "#2d5a2d", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 36 }
        }, "Leave a review"),
        R.createElement("button", {
          onClick: () => cb.onDismissReviewPrompt && cb.onDismissReviewPrompt(reviewMilestone),
          style: { background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 36 }
        }, "Maybe later")
      )
    ) : null;

    // ── Urgent todos card / pill ─────────────────────────────────────
    const urgentTodos = _briefDomain.urgentTodosForBrief(data);
    const todosReviewed = rit.todosReviewed;
    if (todosReviewed && urgentTodos.length > 0) {
      const pillKey = "td-p";
      const pillActions = [
        { label: "Open To-Dos", onClick: () => { setExpandedPill(null); cb.onOpenTab && cb.onOpenTab("todos"); } },
        { label: "Undo review", onClick: () => { setExpandedPill(null); cb.onUpdateRitual && cb.onUpdateRitual({ todosReviewed: false }); } }
      ];
      let pressTimer = null;
      let longFired = false;
      const startPress = () => {
        longFired = false;
        pressTimer = setTimeout(() => { longFired = true; setPillSheet({ title: "Urgent to-dos reviewed", actions: pillActions }); }, 500);
      };
      const endPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
      const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } longFired = true; };
      bottomPills.push(R.createElement("div", {
        key: pillKey,
        onClick: () => { if (longFired) return; cb.onOpenTab && cb.onOpenTab("todos"); },
        onMouseDown: startPress, onMouseUp: endPress, onMouseLeave: cancelPress,
        onTouchStart: startPress, onTouchEnd: endPress, onTouchMove: cancelPress, onTouchCancel: cancelPress,
        onContextMenu: e => e.preventDefault(),
        style: {
          background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10,
          padding: "10px 14px", marginBottom: 10, cursor: "pointer",
          userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none"
        }
      },
        R.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          R.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: "#2d5a2d" } }, "✓"),
          R.createElement("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: "var(--c-text)" } }, "Urgent to-dos reviewed"),
          R.createElement("span", { style: { fontSize: 11, color: "#6b7280", fontWeight: 500 } }, urgentTodos.length)
        )
      ));
    }
    const todoUrgentCard = (function () {
      if (todosReviewed || urgentTodos.length === 0) return null;
      return R.createElement("div", {
        key: "todo-urgent",
        style: {
          background: "#fff", border: "1px solid #fecaca", borderLeft: "4px solid #dc2626",
          borderRadius: 12, padding: "12px 14px", marginBottom: 12, boxShadow: "0 1px 3px rgba(220,38,38,.06)"
        }
      },
        R.createElement("div", {
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }
        },
          R.createElement("div", {
            style: { fontSize: 11, fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: 0.5 }
          }, "Urgent To-Dos · " + urgentTodos.length),
          R.createElement("button", {
            onClick: () => cb.onOpenTab && cb.onOpenTab("todos"),
            style: { background: "transparent", border: "none", color: "#b91c1c", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0 }
          }, "View To-Dos →")
        ),
        R.createElement("div", {
          style: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }
        }, urgentTodos.slice(0, 5).map(({ todo, days }) => {
          const overdue = days < 0;
          const today = days === 0;
          const dayLabel = overdue ? Math.abs(days) + "d overdue" : today ? "Due today" : "in " + days + "d";
          const tint = overdue ? "#fee2e2" : today ? "#fef3c7" : "#fff7ed";
          const stroke = overdue ? "#fca5a5" : today ? "#fde68a" : "#fed7aa";
          const text = overdue ? "#991b1b" : today ? "#92400e" : "#9a3412";
          return R.createElement("div", {
            key: todo.id,
            onClick: () => cb.onOpenTab && cb.onOpenTab("todos"),
            style: {
              display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
              background: tint, border: "1px solid " + stroke, borderRadius: 8, cursor: "pointer"
            }
          },
            R.createElement("span", {
              style: { fontSize: 9, fontWeight: 700, color: text, textTransform: "uppercase", letterSpacing: 0.4, flexShrink: 0, minWidth: 70 }
            }, dayLabel),
            R.createElement("span", {
              style: { flex: 1, fontSize: 13, color: "var(--c-text)", whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }
            }, todo.text)
          );
        })),
        R.createElement("button", {
          onClick: () => cb.onUpdateRitual && cb.onUpdateRitual({ todosReviewed: true }),
          style: Object.assign({}, AB, { width: "100%", padding: "9px" })
        }, "Mark Reviewed ✓")
      );
    })();

    // ── Yesterday's daily journal card / pill ────────────────────────
    const yestJournalReviewed = rit.yestJournalReviewed;
    const yestJournalCard = (function () {
      if (yestJournalReviewed) return null;
      const yestEntries = ((data.journal) || []).filter(e => e && e.dateKey === yest && e.tag === "daily-recap");
      const wroteCount = yestEntries.length;
      const openReflection = () => cb.onOpenYesterdayReflection && cb.onOpenYesterdayReflection(yest);
      return R.createElement("div", { key: "yest-journal", style: cardStyle },
        R.createElement("div", {
          onClick: openReflection,
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 8 }
        },
          R.createElement("div", { style: titleStyle }, "Write Yesterday's Daily Journal"),
          R.createElement("span", {
            style: { fontSize: 11, fontWeight: 700, color: wroteCount > 0 ? "#15803d" : "#b45309", flexShrink: 0, marginLeft: 8, background: wroteCount > 0 ? "var(--c-tint-success-bg)" : "#fef3c7", padding: "3px 8px", borderRadius: 12 }
          }, wroteCount > 0 ? (wroteCount + " wrote ✓") : "Pending")
        ),
        R.createElement("div", {
          onClick: openReflection,
          style: { fontSize: 12, color: "#9ca3af", marginBottom: 10, lineHeight: 1.45, cursor: "pointer" }
        }, wroteCount > 0
          ? "You wrote " + wroteCount + " entry" + (wroteCount === 1 ? "" : "ies") + " for yesterday. Tap to revisit or add more."
          : "Tap to capture how yesterday actually went — the reflection feeds your weekly insights."
        ),
        wroteCount > 0
          ? R.createElement("button", {
              onClick: () => cb.onUpdateRitual && cb.onUpdateRitual({ yestJournalReviewed: true }),
              style: Object.assign({}, AB, { width: "100%", padding: "9px" })
            }, "Mark Reviewed ✓")
          : null
      );
    })();
    if (yestJournalReviewed) {
      bottomPills.push(R.createElement("div", {
        key: "yj-p",
        onClick: () => cb.onOpenTab && cb.onOpenTab("reflection"),
        style: {
          background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 10,
          padding: "10px 14px", marginBottom: 10, cursor: "pointer",
          userSelect: "none", WebkitUserSelect: "none"
        }
      },
        R.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          R.createElement("span", { style: { fontSize: 15, fontWeight: 700, color: "#2d5a2d" } }, "✓"),
          R.createElement("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: "var(--c-text)" } }, "Yesterday's journal reviewed")
        )
      ));
    }

    // ── Weekly Review prompt ─────────────────────────────────────────
    const weeklyReviewCard = (function () {
      const wr = (data && data.weeklyReview) || { day: 0, hour: 0 };
      const now = new Date();
      if (now.getDay() !== wr.day) return null;
      if (now.getHours() < (wr.hour == null ? 0 : wr.hour)) return null;
      if (rit.weeklyReviewDone) return null;
      return R.createElement("div", { key: "weekly-review", style: cardStyle },
        R.createElement("div", { style: titleStyle }, "Weekly Review"),
        R.createElement("div", { style: subTitleStyle }, "Look at the next 7 days. Anything you're traveling for, big meetings, family time? Pencil it in now so the calendar reflects reality."),
        R.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 8 } },
          R.createElement("button", {
            onClick: () => cb.onOpenHeader && cb.onOpenHeader(),
            style: { flex: 1, background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, color: "#2d5a2d", cursor: "pointer" }
          }, "📅 Open calendar to assign travel"),
          R.createElement("button", {
            onClick: () => cb.onOpenWeekCalendar && cb.onOpenWeekCalendar(todayK),
            style: { flex: 1, background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, color: "var(--c-text)", cursor: "pointer" }
          }, "📊 Browse next week →")
        ),
        R.createElement("button", {
          onClick: () => cb.onUpdateRitual && cb.onUpdateRitual({ weeklyReviewDone: true }),
          style: Object.assign({}, AB, { width: "100%", padding: "9px" })
        }, "Mark Reviewed ✓")
      );
    })();

    // ── Empty-state for brand-new users ──────────────────────────────
    if ((data.habits || []).length === 0) {
      return R.createElement("div", { className: "fade-in" },
        R.createElement("div", {
          style: { padding: "40px 20px", textAlign: "center", maxWidth: 480, margin: "0 auto" }
        },
          R.createElement("p", {
            style: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: "var(--c-text-strong)", marginBottom: 12, lineHeight: 1.4 }
          }, "Good morning. Let's set up your day — add your first habit to begin."),
          R.createElement("button", {
            onClick: () => cb.onOpenTab && cb.onOpenTab("habits"),
            style: { padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, cursor: "pointer", marginTop: 8 }
          }, "Add a habit")
        )
      );
    }

    // ── Top banners (debrief entry + evening debrief + crowding card) ─
    // Extracted to lib/views/BriefTopBanners.js to keep this file under
    // the 1000-LOC cap. See CLAUDE.md "File-size rule".
    const topBanners = window.BriefTopBanners
      ? R.createElement(window.BriefTopBanners, { data, todayK, cb, detectAdditiveCrowding })
      : null;

    return R.createElement("div", { className: "fade-in" },
      topBanners,
      intentionPinned,
      reviewBanner,
      R.createElement("div", { className: "home-grid", key: "home-grid" },
        tipsCard,
        dashboardCard,
        yesterdayCard,
        yestJournalCard,
        briefingCard,
        todoUrgentCard,
        weeklyReviewCard,
        intentionInput
      ),
      pillsSection,
      sheet
    );
  }

  // ── Dual-load export guard ─────────────────────────────────────────
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { BriefView };
  } else if (typeof window !== "undefined") {
    window.BriefView = BriefView;
  }
})();
