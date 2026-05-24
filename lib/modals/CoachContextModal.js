// lib/modals/CoachContextModal.js
//
// "My Coach" modal triggered from any smart-tip click that references
// a specific habit, goal, or batch. Shows context: streak, completion
// rate, recent 14-day pattern, linked items, plus quick actions.
//
// Wave 4.1.15. Originally inline at index.html L20674-L20794 (IIFE).
//
// References from shared classic-script global lexical environment:
//   getCR, getStreak, getLast14, daysSinceLast, isDone, habitLinkedToGoal,
//   HT, SECTIONS, AB (style), tk()
//
// App-side actions come through callbacks: onOpenHabits, onEditHabit,
// onMarkHabitDone, onOpenGoals, onEditGoal.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const REASON_BLURB = {
    "low-completion": "This habit's completion rate is below 30%. Common reasons: too ambitious for your current week (try a smaller version), wrong time of day (the body's energy doesn't match the task), or a missing dependency (e.g. 'meditate' needs a quiet room you don't have until later).",
    "off-schedule":   "You keep logging this habit AFTER its scheduled section's cutoff. Your behavior has voted with its feet — moving the habit to the section where you actually do it usually fixes the streak overnight.",
    "incomplete-details": "This item is missing area / SMART / target details. Filling them in unlocks the tracker math (streak math, momentum, correlation detection) and makes the AI briefing more useful.",
    "yesterday-incomplete": "These habits were due yesterday but you haven't marked them done OR missed. Marking honestly (even 'missed') keeps the dataset clean — undecided habits weaken every other insight."
  };

  function CoachContextModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const ctx = s.ctx;
    if (!ctx) return null;
    const onClose = cb.onClose || (() => {});
    const onOpenHabits = cb.onOpenHabits || (() => {});
    const onEditHabit = cb.onEditHabit || (() => {});
    const onMarkHabitDone = cb.onMarkHabitDone || (() => {});
    const onOpenGoals = cb.onOpenGoals || (() => {});
    const onEditGoal = cb.onEditGoal || (() => {});

    const reasonText = REASON_BLURB[ctx.reason] || "Verrocchio noticed something worth your attention.";

    const renderHabitDetail = (h) => {
      const cr = getCR(h);
      const streak = getStreak(h);
      const days = daysSinceLast(h);
      const last14 = getLast14(h);
      const linkedGoals = (h.goalIds || []).map(gid => (data.goals || []).find(g => String(g.id) === String(gid))).filter(Boolean);
      const ht = HT.find(t => t.value === h.type);
      const sec = SECTIONS.find(x => x.value === h.section);
      return React.createElement("div", { key: h.id, style: { background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 14, marginBottom: 10 } },
        React.createElement("div", {
          style: { fontSize: 14, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 6, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "anywhere" }
        }, h.text),
        React.createElement("div", {
          style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }
        },
          ht && React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: ht.color, background: ht.bg, border: "1px solid " + ht.border, borderRadius: 4, padding: "2px 7px" } }, ht.value),
          sec && React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--c-text-soft)", background: "var(--c-surface-muted)", border: "1px solid var(--c-border)", borderRadius: 4, padding: "2px 7px" } }, sec.label || h.section),
          React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "#c2410c", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 4, padding: "2px 7px" } }, "🔥 " + streak + "-day streak"),
          React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: cr.pct >= 70 ? "#15803d" : cr.pct >= 40 ? "#b45309" : "#b91c1c", background: cr.pct >= 70 ? "var(--c-tint-success-bg)" : cr.pct >= 40 ? "#fef3c7" : "#fef2f2", border: "1px solid " + (cr.pct >= 70 ? "var(--c-tint-success-border)" : cr.pct >= 40 ? "#fde68a" : "#fecaca"), borderRadius: 4, padding: "2px 7px" } }, cr.pct + "% (30d)"),
          days != null && React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--c-text-faint)", background: "var(--c-surface-muted)", border: "1px solid var(--c-border)", borderRadius: 4, padding: "2px 7px" } }, "Last: " + days + "d ago")
        ),
        React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 } }, "Last 14 days"),
        React.createElement("div", { style: { display: "flex", gap: 3, marginBottom: 12 } },
          last14.map((d, i) => React.createElement("div", {
            key: i,
            title: d.k + (d.done ? " — done" : " — not done"),
            style: { width: 16, height: 16, borderRadius: 3, background: d.done ? "#2d5a2d" : "var(--c-border)" }
          }))
        ),
        linkedGoals.length > 0 && React.createElement("div", { style: { marginBottom: 10 } },
          React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 } }, "Linked goals"),
          React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
            linkedGoals.map(g => React.createElement("span", { key: g.id, style: { fontSize: 11, color: "#2d5a2d", background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 12, padding: "3px 9px" } }, "🎯 " + g.text.slice(0, 40)))
          )
        ),
        React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 } },
          React.createElement("button", {
            onClick: () => onOpenHabits(h),
            style: { ...AB, padding: "8px 12px", fontSize: 12 }
          }, "Open in Habits"),
          React.createElement("button", {
            onClick: () => onEditHabit(h),
            style: { background: "var(--c-surface-muted)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--c-text-soft)", cursor: "pointer" }
          }, "Edit habit"),
          !isDone(h, tk()) && React.createElement("button", {
            onClick: () => onMarkHabitDone(h),
            style: { background: "var(--c-tint-success-bg)", border: "1px solid var(--c-tint-success-border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#2d5a2d", cursor: "pointer" }
          }, "Mark done now")
        )
      );
    };

    const renderGoalDetail = (g) => {
      const sm = g.smart || {};
      const linkedHabits = (data.habits || []).filter(h => habitLinkedToGoal(h, g.id) && !h.parked);
      const linkedDone = linkedHabits.filter(h => isDone(h, tk())).length;
      return React.createElement("div", { key: g.id, style: { background: "var(--c-surface-raised)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 14, marginBottom: 10 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 6, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "anywhere" } }, g.text),
        React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", marginBottom: 10 } },
          linkedHabits.length === 0 ? "No habits linked yet." : ("Today: " + linkedDone + "/" + linkedHabits.length + " linked habits done.")
        ),
        sm.specific && React.createElement("div", { style: { fontSize: 12, color: "var(--c-text-soft)", marginBottom: 8, lineHeight: 1.5 } }, "S: " + sm.specific),
        sm.timebound && React.createElement("div", { style: { fontSize: 11, color: "var(--c-text-faint)", marginBottom: 10 } }, "Target date: " + sm.timebound),
        React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 } },
          React.createElement("button", {
            onClick: () => onOpenGoals(g),
            style: { ...AB, padding: "8px 12px", fontSize: 12 }
          }, "Open in Goals"),
          React.createElement("button", {
            onClick: () => onEditGoal(g),
            style: { background: "var(--c-surface-muted)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--c-text-soft)", cursor: "pointer" }
          }, "Edit goal")
        )
      );
    };

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "coach-context-title",
      overlayStyle: { background: "rgba(0,0,0,.55)", zIndex: 9999, padding: 16 },
      cardStyle: { background: "var(--c-surface)", borderRadius: "20px 20px 0 0", padding: 20, maxWidth: 560, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.35)" }
    },
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }
      },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "#2d5a2d", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 } }, "My Coach"),
          React.createElement("div", { id: "coach-context-title", style: { fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 700, color: "var(--c-text-strong)" } }, "Why this surfaced")
        ),
        React.createElement("button", {
          "aria-label": "Close",
          "data-a11y-dialog-hide": true,
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--c-text-faint)", fontSize: 16 }
        }, "×")
      ),
      React.createElement("div", {
        style: { fontSize: 13, color: "var(--c-text-soft)", lineHeight: 1.55, marginBottom: 14, padding: 12, background: "var(--c-tint-info-bg)", border: "1px solid var(--c-tint-info-border)", borderRadius: 8 }
      }, reasonText),
      ctx.kind === "habit"        && ctx.habit && renderHabitDetail(ctx.habit),
      ctx.kind === "goal"         && ctx.goal  && renderGoalDetail(ctx.goal),
      ctx.kind === "habit-batch"  && (ctx.habits || []).slice(0, 5).map(h => renderHabitDetail(h)),
      ctx.kind === "habit-batch"  && (ctx.habits || []).length > 5 && React.createElement("div", {
        style: { fontSize: 11, color: "var(--c-text-faint)", textAlign: "center", padding: "8px 0" }
      }, "+ " + ((ctx.habits || []).length - 5) + " more — open Habits to see all.")
    );
  }

  window.CoachContextModal = CoachContextModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { CoachContextModal };
  }
})();
