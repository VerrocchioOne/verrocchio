// lib/domains/brief.js — Phase B view-extraction.
// Pure READ derivations for the BriefView (Home / Daily Ritual).
//
// NO React, NO DOM, no `latestData.current`. All inputs are plain data
// (the full `data` object, plus small primitives or memoized helpers
// from App scope). All outputs are plain values or new data objects.
//
// The companion view (`lib/views/BriefView.js`) calls these functions
// at render time. The pinned-behavior tests live at
// `tests/domains/brief.test.mjs`.
//
// dual-load guard at the bottom; mirror tests/merge.test.mjs.

// §13.4a (v75) — Body wrapped in IIFE to prevent top-level helper
// names (_briefDk, _todayKey, etc.) from colliding with identically-
// named helpers in sibling lib/domains/*.js files. Classic browser
// scripts share top-level lexical scope; two `let _todayKey` decls
// across two loaded scripts → SyntaxError. IIFE keeps internals
// script-private while the dual-load guard at the bottom still
// exposes briefDomain via module.exports / window.briefDomain.
(function () {
"use strict";

// dk dual-load:
//   - Browser: utils.js sets a Script-scope `dk` global; we re-bind here.
//   - Node: tests `require("./brief.js")` first, so we need to require
//     utils.js explicitly to get dk.
// `_briefDk` lets call sites override (e.g. for tests pinning "today"
// without freezing the system clock).
let _briefDk;
if (typeof require !== "undefined") {
  try {
    _briefDk = require("../../utils.js").dk;
  } catch (_) {
    _briefDk = null;
  }
}
if (!_briefDk && typeof globalThis !== "undefined" && typeof globalThis.dk === "function") {
  _briefDk = globalThis.dk;
}
// Final fallback — matches utils.js#dk exactly. Keeps brief.js
// usable in a stripped-down Node context that has neither the
// CommonJS export of utils.js nor a global `dk`.
if (!_briefDk) {
  _briefDk = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
}

// Local YYYY-MM-DD for a given Date or "now". Lets tests inject a
// fixed "today" without mocking system time.
const _todayKey = (now) => _briefDk(now ? new Date(now) : new Date());

// Sibling-domain dual-load (mirrors the _briefDk pattern above).
// Node tests resolve these via require; the browser already has them
// as script-scope globals from lib/constants.js / lib/slots.js loaded
// before lib/domains/brief.js.
let _briefIsHabitDueOn;
let _briefSlotIdForIndex;
if (typeof require !== "undefined") {
  try { _briefIsHabitDueOn = require("../constants.js").isHabitDueOn; } catch (_) {}
  try { _briefSlotIdForIndex = require("../slots.js").slotIdForIndex; } catch (_) {}
}
if (!_briefIsHabitDueOn && typeof globalThis !== "undefined" && typeof globalThis.isHabitDueOn === "function") {
  _briefIsHabitDueOn = globalThis.isHabitDueOn;
}
if (!_briefSlotIdForIndex && typeof globalThis !== "undefined" && typeof globalThis.slotIdForIndex === "function") {
  _briefSlotIdForIndex = globalThis.slotIdForIndex;
}

// ─────────────────────────────────────────────────────────────────────
// greetingForTime(timeOfDay) — pure, no data dependency.
// timeOfDay can be a Date, an hours integer (0–23), or undefined.
// Returns "Good morning" / "Good afternoon" / "Good evening".
// Used as a header greeting; kept tiny so the test pins the cut-offs.
// ─────────────────────────────────────────────────────────────────────
const greetingForTime = (timeOfDay) => {
  let h;
  if (timeOfDay == null) h = new Date().getHours();
  else if (typeof timeOfDay === "number") h = timeOfDay;
  else if (timeOfDay instanceof Date) h = timeOfDay.getHours();
  else h = 12;
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ─────────────────────────────────────────────────────────────────────
// todayRitualState(data, now?) — slice of the day-of ritual record
// the view needs to drive its step states. Reads
// `data.dailyRitual[todayKey]` and surfaces booleans + the intention.
// All fields default to false / "" so the view never sees `undefined`.
// ─────────────────────────────────────────────────────────────────────
const todayRitualState = (data, now) => {
  const k = _todayKey(now);
  const rit = (data && data.dailyRitual && data.dailyRitual[k]) || {};
  const intention = (rit.intention && String(rit.intention).trim()) || "";
  return {
    todayKey: k,
    intention,
    intentionSet: !!intention,
    briefingReviewed: !!rit.briefingReviewed,
    yesterdayReviewed: !!rit.yesterdayReviewed,
    goalsReviewed: !!rit.goalsReviewed,
    tipsReviewed: !!rit.tipsReviewed,
    todosReviewed: !!rit.todosReviewed,
    yestJournalReviewed: !!rit.yestJournalReviewed,
    weeklyReviewDone: !!rit.weeklyReviewDone,
    debriefCompletedAt: rit.debriefCompletedAt || null,
    eveningDebriefCompletedAt: rit.eveningDebriefCompletedAt || null,
    aiTipBody: rit.aiTipBody || "",
    aiTipKey: rit.aiTipKey || "",
    // Echo through so the view can render previously-shown cached briefing.
    briefing: rit.briefing || ""
  };
};

// ─────────────────────────────────────────────────────────────────────
// tipsForToday(data, opts) — assembles the ordered tip list that the
// Brief tab's Tips & Reminders card renders.
//
// This is the pre-action tip catalogue: each entry has { icon, title,
// body, kind, payload }. The view turns `kind`+`payload` into the
// onClick handler via its `callbacks` prop (see view file). Keeping
// `action` out of this module preserves purity — no functions on the
// output, the view can be inspected/snapshot-tested if we ever add it.
//
// opts shape (everything optional):
//   {
//     deviceProfile,            // window.__deviceProfile snapshot (unused
//                                 today; kept on the signature per §3 spec)
//     memoedOffSchedule,        // array — App's useMemo result
//     memoedCorrelations,       // array — App's useMemo result
//     aiEnabled,                // boolean — AI_ENABLED constant
//     today,                    // optional Date for "today" anchor
//     isHabitIncomplete,        // App predicates passed in to keep this
//     isGoalIncomplete,         //   module decoupled from App scope
//     isTodoIncomplete,
//     isFutureHabit,
//     isFutureGoal,
//     getCR,                    // utils.js#getCR — pass for testability
//     features,                 // FEATURES array from index.html
//     ageDaysOverride           // optional — bypass signupAt math
//   }
// ─────────────────────────────────────────────────────────────────────
const tipsForToday = (data, opts) => {
  const o = opts || {};
  const tk = _todayKey(o.today);
  const tips = [];

  // 1. Personalized AI tip (cached on dailyRitual[today]).
  let aiTipHabitId = null;
  const ritToday = (data && data.dailyRitual && data.dailyRitual[tk]) || {};
  if (o.aiEnabled && data && data.aiConsentAt && ritToday.aiTipBody && ritToday.aiTipKey) {
    const isCorr = ritToday.aiTipKey.indexOf(":corr:") !== -1;
    if (!isCorr) {
      const m = /:off:([^:]+):/.exec(ritToday.aiTipKey);
      if (m) aiTipHabitId = m[1];
    }
    tips.push({
      icon: isCorr ? "🔗" : "🕘",
      title: "Personalized for you",
      body: ritToday.aiTipBody,
      kind: "none",
      payload: null
    });
  }

  // 2. Off-schedule hits (top 2, minus whichever the AI tip already
  // covers — same de-dupe rule as the inline render had).
  const off = Array.isArray(o.memoedOffSchedule) ? o.memoedOffSchedule : [];
  const offHits = off
    .filter(x => !aiTipHabitId || String(x.habitId) !== String(aiTipHabitId))
    .slice(0, 2);
  for (const x of offHits) {
    const secLabel = x.section.charAt(0).toUpperCase() + x.section.slice(1);
    const suggestSec = x.section === "morning"
      ? "afternoon"
      : x.section === "afternoon" ? "evening" : "morning";
    tips.push({
      icon: "🕘",
      title: `"${String(x.habitText).slice(0, 30)}" keeps landing later`,
      body: `${x.lateCount}/${x.loggedCount} of the last logged ${secLabel} sessions were after the cutoff. Consider moving it to ${suggestSec}.`,
      kind: "off-schedule",
      payload: { habitId: x.habitId, suggestedSection: suggestSec }
    });
  }

  // 3. Top correlation (single).
  const corr = Array.isArray(o.memoedCorrelations) ? o.memoedCorrelations : [];
  const topCorr = corr[0];
  if (topCorr) {
    const hrLabel = topCorr.aCutoffHour === 12
      ? "by noon"
      : topCorr.aCutoffHour === 18 ? "by 6pm" : "before bed";
    tips.push({
      icon: "🔗",
      title: "Pattern: habits move together",
      body: `When you do "${String(topCorr.aText).slice(0, 30)}" ${hrLabel}, "${String(topCorr.bText).slice(0, 30)}" lands ${Math.round(topCorr.conditional * 100)}% of the time (vs ${Math.round(topCorr.base * 100)}% otherwise).`,
      kind: "none",
      payload: null
    });
  }

  // 4. SMART-less goal (first non-future, non-filled goal).
  const isFutureGoal = typeof o.isFutureGoal === "function" ? o.isFutureGoal : () => false;
  const goals = (data && data.goals) || [];
  const noSmartGoal = goals.find(g =>
    !isFutureGoal(g) && (!g.smart || !Object.values(g.smart).some(v => v && String(v).trim()))
  );
  if (noSmartGoal) {
    tips.push({
      icon: "🎯",
      title: "Add S.M.A.R.T. details",
      body: `Your goal "${String(noSmartGoal.text).slice(0, 40)}…" has no SMART framework. Tap to add specifics.`,
      kind: "open-goals",
      payload: null
    });
  }

  // 5. Incomplete-detail nudges (habits / goals / todos).
  const isHabitIncomplete = typeof o.isHabitIncomplete === "function" ? o.isHabitIncomplete : () => false;
  const isFutureHabit = typeof o.isFutureHabit === "function" ? o.isFutureHabit : () => false;
  const incompleteHabits = ((data && data.habits) || []).filter(h => isHabitIncomplete(h) && !isFutureHabit(h));
  if (incompleteHabits.length > 0) {
    const sample = incompleteHabits[0];
    tips.push({
      icon: "🚨",
      title: "Fill in habit details",
      body: incompleteHabits.length === 1
        ? `"${String(sample.text).slice(0, 40)}" is missing area, section, or frequency. Tap to finish it.`
        : `${incompleteHabits.length} habits (starting with "${String(sample.text).slice(0, 30)}") are missing area / section / freq. Tap to finish them.`,
      kind: "coach-habit",
      payload: { habit: sample, reason: "incomplete-details" }
    });
  }

  const isGoalIncomplete = typeof o.isGoalIncomplete === "function" ? o.isGoalIncomplete : () => false;
  const incompleteGoals = goals.filter(g => isGoalIncomplete(g) && !isFutureGoal(g));
  if (incompleteGoals.length > 0) {
    const sample = incompleteGoals[0];
    tips.push({
      icon: "🚨",
      title: "Fill in goal details",
      body: incompleteGoals.length === 1
        ? `"${String(sample.text).slice(0, 40)}" is missing area, SMART, or target date.`
        : `${incompleteGoals.length} goals (starting with "${String(sample.text).slice(0, 30)}") need area / SMART / target date.`,
      kind: "coach-goal",
      payload: { goal: sample, reason: "incomplete-details" }
    });
  }

  const isTodoIncomplete = typeof o.isTodoIncomplete === "function" ? o.isTodoIncomplete : () => false;
  const incompleteTodos = ((data && data.todos) || []).filter(isTodoIncomplete);
  if (incompleteTodos.length > 0) {
    const sample = incompleteTodos[0];
    tips.push({
      icon: "🚨",
      title: "Set due dates",
      body: incompleteTodos.length === 1
        ? `"${String(sample.text || "").slice(0, 40)}" has no due date — when does it need to happen?`
        : `${incompleteTodos.length} to-dos are missing due dates. Tap to assign them.`,
      kind: "open-todos",
      payload: null
    });
  }

  // 6. Low-completion habit (first active non-parked under 30%).
  if (typeof o.getCR === "function") {
    // Use the caller's `activeHabits` view if provided; else fall back to
    // the data.habits filtered the same way the App does.
    const active = Array.isArray(o.activeHabits)
      ? o.activeHabits
      : ((data && data.habits) || []).filter(h => h && !h.parked);
    const low = active.find(h => o.getCR(h).pct < 30);
    if (low) {
      tips.push({
        icon: "📉",
        title: "Habit needs attention",
        body: `"${String(low.text).slice(0, 40)}" has a ${o.getCR(low).pct}% completion rate. Check in and recommit.`,
        kind: "coach-habit",
        payload: { habit: low, reason: "low-completion" }
      });
    }
  }

  // 7. Unused-feature nudges (after 3+ days of use).
  const ageDays = o.ageDaysOverride != null
    ? o.ageDaysOverride
    : (data && data.signupAt ? Math.floor((Date.now() - data.signupAt) / 86400000) : 0);
  if (ageDays >= 3 && Array.isArray(o.features)) {
    const access = (data && data.featureAccess) || {};
    const missing = o.features.filter(f => f && f.tipWhenMissing && !access[f.id]);
    if (missing.length) {
      const f = missing[0];
      tips.push({
        icon: "🧭",
        title: "Try " + String(f.label || "").toLowerCase(),
        body: f.tipDesc || "A part of Verrocchio you haven't explored yet.",
        kind: "none",
        payload: null
      });
    }
  }

  // 8. Always-tail evergreen tip so the user never sees an empty card
  // when nothing else fired. Matches the inline behaviour exactly.
  if (tips.length < 3) {
    tips.push({
      icon: "💡",
      title: "Stay consistent",
      body: "Small consistent actions compound over time. Even 1% better each day is transformative.",
      kind: "none",
      payload: null
    });
  }

  return tips;
};

// ─────────────────────────────────────────────────────────────────────
// upcomingDatesForBrief(data, now?) — merge goal-target deadlines +
// user-added one-off dates into a single sorted list. Each item:
//   { kind: "goal"|"custom", id, rawId?, text, date, daysUntil }
// `daysUntil` can be negative (past). Pure; no DOM. The view formats
// the date label.
// ─────────────────────────────────────────────────────────────────────
const upcomingDatesForBrief = (data, now) => {
  const today0 = now ? new Date(now) : new Date();
  today0.setHours(0, 0, 0, 0);
  const goalDates = ((data && data.goals) || [])
    .map(g => {
      const raw = (g && g.smart && g.smart.timebound) || "";
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
      if (!m) return null;
      return {
        kind: "goal",
        id: "g-" + g.id,
        text: g.text,
        date: m[1] + "-" + m[2] + "-" + m[3]
      };
    })
    .filter(Boolean);
  const customDates = ((data && data.upcomingDates) || []).map(u => ({
    kind: "custom",
    id: "u-" + u.id,
    rawId: u.id,
    text: u.text,
    date: u.date
  }));
  const all = [...goalDates, ...customDates].sort((a, b) => a.date.localeCompare(b.date));
  return all.map(item => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(item.date);
    let daysUntil = 0;
    if (m) {
      const t = new Date(+m[1], +m[2] - 1, +m[3]);
      t.setHours(0, 0, 0, 0);
      daysUntil = Math.round((t - today0) / 86400000);
    }
    return { ...item, daysUntil };
  });
};

// ─────────────────────────────────────────────────────────────────────
// urgentTodosForBrief(data, now?) — overdue + due-within-3-days todos.
// Mirrors the To-Dos tab `pending` filter so the Home widget can't
// drift from the canonical list: skip done, skip archived, require
// dueDate. Returns sorted ascending by days-until-due.
// Item shape: { todo, days } — matching the inline shape so the view
// can drop in unchanged.
// ─────────────────────────────────────────────────────────────────────
const urgentTodosForBrief = (data, now) => {
  const today0 = now ? new Date(now) : new Date();
  today0.setHours(0, 0, 0, 0);
  const all = ((data && data.todos) || []).filter(t => t && !t.done && !t.archived && t.dueDate);
  const annotated = all.map(t => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t.dueDate);
    if (!m) return null;
    const due = new Date(+m[1], +m[2] - 1, +m[3]);
    const days = Math.round((due - today0) / 86400000);
    return { todo: t, due, days };
  }).filter(Boolean);
  return annotated.filter(({ days }) => days <= 3).sort((a, b) => a.days - b.days);
};

// ─────────────────────────────────────────────────────────────────────
// detectAdditiveCrowding(habits, todayDate) — §14.3 Brief-tab card.
// Pure, deterministic — no AI. Returns null when the pattern doesn't
// fit so the card can render conditionally. Window = 14 days.
// Thresholds: non-negotiable < 50% complete, additive > 80% complete.
// Also requires the user is actively logging (>=3 done completions in
// the last 7 days) to avoid firing on dormant users. When multiple
// candidates exist, picks the worst-missed non-negotiable + the most-
// reliable additive.
// ─────────────────────────────────────────────────────────────────────
const detectAdditiveCrowding = (habits, todayDate) => {
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    days.push(_briefDk(d));
  }
  const stats = (habits || []).map(h => {
    let done = 0;
    days.forEach(k => {
      const v = h.completions && h.completions[k];
      if (v === "done" || v === true) done++;
    });
    return { h, done, rate: done / 14 };
  }).filter(s => s.h && s.h.text);
  const missedNonNeg = stats.filter(s => s.h.importance === "Non-Negotiable" && s.rate < 0.5);
  const reliableAdd = stats.filter(s => s.h.importance === "Additive" && s.rate > 0.8);
  if (!missedNonNeg.length || !reliableAdd.length) return null;
  const lastWeekKeys = days.slice(0, 7);
  const isActive = stats.some(s => lastWeekKeys.filter(k => {
    const v = s.h.completions && s.h.completions[k];
    return v === "done" || v === true;
  }).length >= 3);
  if (!isActive) return null;
  missedNonNeg.sort((a, b) => a.rate - b.rate);
  reliableAdd.sort((a, b) => b.rate - a.rate);
  const target = missedNonNeg[0];
  const culprit = reliableAdd[0];
  return {
    nonNeg: target.h,
    nonNegDone: target.done,
    additive: culprit.h,
    additiveDone: culprit.done
  };
};

// ─────────────────────────────────────────────────────────────────────
// completionDayCount(habits) — distinct days with any habit completion.
// Gates the AI Daily Briefing behind a minimum week of usage data.
// Parked habits are excluded so the dataDays denominator matches the
// dH (active, non-parked) denominator used in area percentages —
// counting parked-habit history inflated dataDays vs dH and deflated
// every "% over N days" stat in the briefing.
// "missed" values do NOT count as a logged day; only positive
// completions (truthy and not "missed") do.
// ─────────────────────────────────────────────────────────────────────
const completionDayCount = (habits) => {
  const set = new Set();
  (habits || []).filter(h => h && !h.parked).forEach(h => {
    const comps = h.completions || {};
    for (const day in comps) {
      if (comps[day] && comps[day] !== "missed") set.add(day);
    }
  });
  return set.size;
};

// ─────────────────────────────────────────────────────────────────────
// welcomeBriefing(completionDays, threshold=7) — placeholder briefing
// shown before the real AI briefing unlocks. Counts down the remaining
// usage days the user needs to log. When the threshold is met, the
// message switches to the "unlock on next open" line. Pure string.
// ─────────────────────────────────────────────────────────────────────
const welcomeBriefing = (completionDays, threshold) => {
  const t = (typeof threshold === "number" && threshold > 0) ? threshold : 7;
  const remaining = Math.max(0, t - (completionDays || 0));
  if (remaining === 0) {
    return "You've logged a full week — your personalized briefing unlocks next time you open the app.";
  }
  return `Log ${remaining} more day${remaining === 1 ? "" : "s"} of use to unlock your daily briefing.`;
};

// ─────────────────────────────────────────────────────────────────────
// allYesterdayHabitsReviewed(habits, opts?) — AI Daily Briefing gate.
// Returns true iff every habit that was DUE yesterday has an explicit
// "done" / true / "missed" state for yesterday. The gate ensures the
// model sees a complete picture; without it the briefing summarizes
// partial data and looks confused. Excludes:
//   - parked / future-start habits (via injected isFutureHabit)
//   - habits whose frequency excludes yesterday (via isHabitDueOn)
//   - "avoid" habits (their daily count is implicit, no explicit state)
//   - sub-habits (parentId set) — the parent rollup covers them
//   - habits whose startDate is after yesterday (created today onward)
// For multi-slot habits requires explicit state for every slot.
//
// opts:
//   - isFutureHabit: (h) => boolean   REQUIRED (App-scope predicate)
//   - now:           number|Date|null pin "today" for tests; default = Date.now()
// ─────────────────────────────────────────────────────────────────────
const allYesterdayHabitsReviewed = (habits, opts) => {
  const o = opts || {};
  const isFutureHabit = typeof o.isFutureHabit === "function" ? o.isFutureHabit : (() => false);
  const isHabitDueOn = _briefIsHabitDueOn || (() => true);
  const slotIdForIndex = _briefSlotIdForIndex || ((slots, i) => {
    if (!Array.isArray(slots)) return null;
    const section = slots[i];
    if (section == null) return null;
    let localIdx = 0;
    for (let j = 0; j < i; j++) if (slots[j] === section) localIdx++;
    return section + ":" + localIdx;
  });
  const nowMs = o.now != null ? new Date(o.now).getTime() : Date.now();
  const yKey = _briefDk(new Date(nowMs - 86400000));
  const dueYesterday = (habits || []).filter(h => {
    if (!h) return false;
    if (isFutureHabit(h)) return false;
    if (h.section === "avoid") return false;
    if (h.parentId != null) return false;
    if (h.startDate && h.startDate > yKey) return false;
    return isHabitDueOn(h, yKey);
  });
  return dueYesterday.every(h => {
    const slots = Array.isArray(h.slotSections) ? h.slotSections : null;
    if (slots && slots.length > 0) {
      const sc = (h.slotCompletions && h.slotCompletions[yKey]) || {};
      return slots.every((_, i) => {
        const sid = slotIdForIndex(slots, i);
        const v = sc[sid];
        return v === "done" || v === true || v === "missed";
      });
    }
    const v = (h.completions || {})[yKey];
    return v === "done" || v === true || v === "missed";
  });
};

// ─────────────────────────────────────────────────────────────────────
// reorderForCrowdingPair(habits, nonNegId, additiveId) -> result
//
// Pure kernel for the §14.3 "promote a missed non-negotiable above a
// crowding additive" reorder action. No side effects: App owns the
// save() + dailyRitual throttle update + telemetry that follow.
//
// Result discriminated union:
//   { kind: "missing" }        — either id is not in habits
//   { kind: "cross-section" }  — both found but in different sections
//                                 (cross-section reorder is out of scope)
//   { kind: "same-section", nextHabits }
//                              — both found in the same section; nextHabits
//                                is a NEW array with _order updated when a
//                                move was needed (nonNeg moved to occupy
//                                additive's slot) or === habits when nonNeg
//                                already ordered ahead of additive.
//
// Both id args use === comparison against habit.id (no string coerce).
// ─────────────────────────────────────────────────────────────────────
const reorderForCrowdingPair = (habits, nonNegId, additiveId) => {
  const arr = (habits || []).slice();
  const nonNegIdx   = arr.findIndex(h => h && h.id === nonNegId);
  const additiveIdx = arr.findIndex(h => h && h.id === additiveId);
  if (nonNegIdx < 0 || additiveIdx < 0) return { kind: "missing" };

  const nonNeg = arr[nonNegIdx];
  const additive = arr[additiveIdx];
  if (nonNeg.section !== additive.section) return { kind: "cross-section" };

  // Already in the right order — no move needed; the caller still
  // records the throttle entry.
  if ((nonNeg._order || 0) <= (additive._order || 0)) {
    return { kind: "same-section", nextHabits: arr };
  }

  const sectionHabits = arr.filter(h => h.section === nonNeg.section);
  sectionHabits.sort((a, b) => (a._order || 0) - (b._order || 0));
  const nonNegPos   = sectionHabits.findIndex(h => h.id === nonNegId);
  const additivePos = sectionHabits.findIndex(h => h.id === additiveId);
  const [moved] = sectionHabits.splice(nonNegPos, 1);
  sectionHabits.splice(additivePos > nonNegPos ? additivePos - 1 : additivePos, 0, moved);
  const orderMap = new Map();
  sectionHabits.forEach((h, i) => orderMap.set(h.id, i));
  const nextHabits = arr.map(h => orderMap.has(h.id) ? { ...h, _order: orderMap.get(h.id) } : h);
  return { kind: "same-section", nextHabits };
};

// ─────────────────────────────────────────────────────────────────────
// deterministicBriefing(opts) -> string  (multi-paragraph; \n\n joins)
//
// Pure no-AI Morning Brief renderer used when AI_BACKEND_URL isn't set.
// Drives the demo personas' opening view + every real user's first
// experience until the AI proxy is wired. Three paragraphs:
//   1) opening + today's task/habit status + streak
//   2) one or more "what to notice" insights (peak habit, slipping
//      habit, weekly trend, area balance)
//   3) optional time-of-day correlation pattern (when present)
//
// All inputs are precomputed by the caller so the function is
// straight-line and easy to test. App-scope wrapper supplies:
//   - data          full state (uses .habits, .todos, .aiTone)
//   - today         "YYYY-MM-DD" key
//   - pastDays30    array of 30 day keys (today first, oldest last)
//   - dataDays      number — denominator capped at observed days
//   - habitTypeAreas the HT constant (each row = { value, label })
//   - correlations  result of findCorrelations(habits) (array)
//   - isDone        (h, dateKey) -> bool predicate
//
// Tone variants come from data.aiTone ∈ {"tough-love"|"neutral"|"encouraging"|undef}.
// ─────────────────────────────────────────────────────────────────────
const deterministicBriefing = (opts) => {
  const o = opts || {};
  const data = o.data || {};
  const td = o.today;
  const l30 = Array.isArray(o.pastDays30) ? o.pastDays30 : [];
  const dataDays = Math.max(1, Number(o.dataDays) || 1);
  const HT = Array.isArray(o.habitTypeAreas) ? o.habitTypeAreas : [];
  const correlations = Array.isArray(o.correlations) ? o.correlations : [];
  const isDone = typeof o.isDone === "function" ? o.isDone : (() => false);
  const tone = data.aiTone || "neutral";

  const habits = (data.habits) || [];
  const dH = habits.filter(h => h && h.section !== "avoid" && !h.parked);
  const pend = ((data.todos) || []).filter(t => t && !t.done);
  const doneCt = dH.filter(h => isDone(h, td)).length;

  // Per-area completion percentages (mirrors the AI-prompt computation).
  const tc = HT.map(t => {
    const g = dH.filter(h => h.type === t.value);
    if (!g.length) return null;
    return {
      type: t.value,
      pct: Math.round(g.reduce((s, h) => s + l30.filter(d => h.completions && h.completions[d]).length, 0) / (g.length * dataDays) * 100)
    };
  }).filter(Boolean);
  const focused   = tc.filter(t => t.pct >= 70).map(t => t.type);
  const neglected = tc.filter(t => t.pct < 40).map(t => t.type);

  const topCorr = correlations[0];

  // Per-habit completion counts over each habit's OWN active window.
  // (See §perf comment in the original inline body: dividing by global
  // dataDays for new habits unfairly punished them.)
  const habitScores = dH.map(h => {
    const cnt = l30.filter(d => h.completions && h.completions[d]).length;
    const startKey = h.startDate || null;
    const perHabitWindow = startKey
      ? Math.max(1, l30.filter(d => d >= startKey).length)
      : dataDays;
    return { h, cnt, pct: Math.round(cnt / perHabitWindow * 100), perHabitWindow };
  }).sort((a, b) => b.pct - a.pct);
  const topHabit = habitScores[0];
  const offHabit = [...habitScores].sort((a, b) => a.pct - b.pct)[0];

  // Trend: last 7 days vs prior 7 days, NORMALIZED to per-day-per-habit
  // (so a short prior window doesn't bias the percentage upward).
  const sumWindow = (from, to) => {
    const w = l30.slice(from, to);
    return dH.reduce((s, h) => s + w.filter(d => h.completions && h.completions[d]).length, 0);
  };
  const thisLen = Math.min(7, dataDays);
  const prevLen = Math.max(0, Math.min(14, dataDays) - 7);
  const thisCnt = sumWindow(0, thisLen);
  const prevCnt = sumWindow(7, 7 + prevLen);
  const denomThis = thisLen * Math.max(1, dH.length);
  const denomPrev = prevLen * Math.max(1, dH.length);
  const thisRate = denomThis > 0 ? thisCnt / denomThis : 0;
  const prevRate = denomPrev > 0 ? prevCnt / denomPrev : 0;
  const trend = (prevRate > 0 && prevLen >= 3)
    ? Math.round(((thisRate - prevRate) / prevRate) * 100)
    : null;

  // Current cross-habit streak — consecutive days ending today with at
  // least one completion across any active habit.
  let streak = 0;
  for (let i = 0; i < l30.length; i++) {
    const any = dH.some(h => h.completions && h.completions[l30[i]]);
    if (!any) break;
    streak++;
  }

  // ── Paragraph 1: opening + task/habit status ──────────────────────
  const opening = tone === "tough-love"
    ? "Morning. Here's where you stand:"
    : tone === "neutral"
      ? "Today's status:"
      : "Good morning.";
  const taskLine = pend.length
    ? `${pend.length} task${pend.length === 1 ? "" : "s"} open${pend.length <= 3 ? ` — ${pend.map(t => t.text).join(", ")}` : "."}`
    : (tone === "tough-love"
        ? "Task list is clear — no excuses."
        : "Nothing urgent on the task list — clear runway.");
  const habitsLine = dH.length ? `Habits today: ${doneCt}/${dH.length} logged.` : "";
  const streakLine = streak > 0 ? ` Streak: ${streak} day${streak === 1 ? "" : "s"}.` : "";
  const parts = [];
  parts.push(`${opening} ${taskLine} ${habitsLine}${streakLine}`.trim());

  // ── Paragraph 2: data-driven insights ─────────────────────────────
  const insightBits = [];
  if (topHabit && topHabit.cnt >= Math.ceil(dataDays * 0.6)) {
    insightBits.push(tone === "tough-love"
      ? `"${topHabit.h.text}" is your anchor — ${topHabit.pct}% over ${dataDays} days. Everything else should be at least this reliable.`
      : tone === "neutral"
        ? `Most consistent: "${topHabit.h.text}" at ${topHabit.pct}%.`
        : `Your anchor habit is "${topHabit.h.text}" — ${topHabit.pct}% over the last ${dataDays} days. Build off that.`);
  }
  if (offHabit && topHabit && offHabit.h.id !== topHabit.h.id && offHabit.pct < 40) {
    insightBits.push(tone === "tough-love"
      ? `"${offHabit.h.text}" is slipping at ${offHabit.pct}%. Fix it this week.`
      : tone === "neutral"
        ? `Lowest: "${offHabit.h.text}" at ${offHabit.pct}%.`
        : `"${offHabit.h.text}" could use some love — sitting at ${offHabit.pct}%.`);
  }
  if (trend != null && Math.abs(trend) >= 15) {
    insightBits.push(tone === "tough-love"
      ? `${trend > 0 ? `Up ${trend}%` : `Down ${Math.abs(trend)}%`} vs last week. ${trend < 0 ? "Reverse it." : "Hold it."}`
      : tone === "neutral"
        ? `This week vs last: ${trend > 0 ? "+" : ""}${trend}%.`
        : `${trend > 0 ? `This week is up ${trend}%` : `This week is down ${Math.abs(trend)}%`} vs last. ${trend > 0 ? "Nice rhythm" : "Gentle reset"}.`);
  }
  if (focused.length || neglected.length) {
    const bits = [];
    if (focused.length) bits.push(tone === "neutral" ? `${focused.join(", ").toLowerCase()} consistent` : `consistent with ${focused.join(", ").toLowerCase()}`);
    if (neglected.length) bits.push(tone === "tough-love" ? `${neglected.join(", ").toLowerCase()} is slipping` : `${neglected.join(", ").toLowerCase()} ${neglected.length === 1 ? "has" : "have"} slipped`);
    insightBits.push(`Across areas: ${bits.join(", ")}.`);
  }
  if (insightBits.length > 0) parts.push(insightBits.join(" "));

  // ── Paragraph 3: optional time-of-day correlation ────────────────
  if (topCorr) {
    const hr = topCorr.aCutoffHour === 12 ? "by noon"
             : topCorr.aCutoffHour === 18 ? "by 6pm"
             : "before bed";
    parts.push(`Pattern: when you finish "${topCorr.aText}" ${hr}, "${topCorr.bText}" lands ${Math.round(topCorr.conditional * 100)}% of the time (vs ${Math.round(topCorr.base * 100)}% normally).`);
  }

  return parts.join("\n\n");
};

// ─────────────────────────────────────────────────────────────────────
// nextRitualState(data, todayKey, patch) -> dailyRitual map (new ref)
//
// Returns the next `data.dailyRitual` value after merging `patch` into
// today's entry. Pure — App's updateRitual handler calls save() with
// the result. Other days' entries pass through unchanged (same ref).
// Today's entry is shallow-merged: existing fields stay unless `patch`
// overrides them.
// ─────────────────────────────────────────────────────────────────────
const nextRitualState = (data, todayKey, patch) => {
  const existingMap = (data && data.dailyRitual) || {};
  const existingToday = existingMap[todayKey] || {};
  return {
    ...existingMap,
    [todayKey]: { ...existingToday, ...(patch || {}) }
  };
};

// ─────────────────────────────────────────────────────────────────────
// aiBriefingPrompt(opts) -> string
//
// Builds the prompt the AI proxy receives for the daily briefing.
// Extracted from genBrief in index.html so prompt-shape regressions
// are catchable by unit tests independent of the network call.
//
// opts:
//   data           — full app data (reads data.aiTone, data.goals)
//   today          — today's date key (YYYY-MM-DD)
//   dH             — filtered active habits (non-avoid, non-parked)
//   pend           — pending todos (filter(!t.done))
//   dataDays       — clamped denominator for area percentages
//   tc             — type-coverage [{type, pct}] precomputed by caller
//   correlations   — memoedCorrelations array; top 3 are formatted inside
//   isDone         — (habit, dateKey) => bool predicate
// ─────────────────────────────────────────────────────────────────────
const aiBriefingPrompt = (opts) => {
  const o = opts || {};
  const data = o.data || {};
  const today = o.today || "";
  const dH = Array.isArray(o.dH) ? o.dH : [];
  const pend = Array.isArray(o.pend) ? o.pend : [];
  const dataDays = Math.max(1, Number(o.dataDays) || 1);
  const tc = Array.isArray(o.tc) ? o.tc : [];
  const correlations = Array.isArray(o.correlations) ? o.correlations : [];
  const isDone = typeof o.isDone === "function" ? o.isDone : () => false;

  const toneLine =
    (data.aiTone === "tough-love")
      ? "You are a direct, no-nonsense coach who holds the user accountable without being cruel. Call out slipping habits plainly and expect better. Skip the pep talk."
      : (data.aiTone === "encouraging")
        ? "You are a warm personal coach. Lead with positive framing and celebrate progress."
        : "You are a neutral analyst. Summarize the user's day factually without cheerleading or criticism. Plain language, no emotional framing.";

  // Pre-format correlation hints (top 3 only — prompt budget).
  const corrHints = correlations.slice(0, 3).map((r) => {
    const hrLabel = r.aCutoffHour === 12
      ? "by noon"
      : r.aCutoffHour === 18 ? "by 6pm" : "by midnight";
    const pct = Math.round((r.lift || 0) * 100);
    return `When "${r.aText}" is done ${hrLabel}, "${r.bText}" is ${pct}pp more likely to happen (${Math.round((r.conditional || 0) * 100)}% vs ${Math.round((r.base || 0) * 100)}% base)`;
  });

  const goalsStr = (data.goals || [])
    .map(g => `[${g.type || "General"}] ${g.text}`)
    .join(" | ") || "None";
  const tasksStr = pend.map(t => t.text).join(", ") || "All clear!";
  const doneCount = dH.filter(h => isDone(h, today)).length;
  const habitsStr = dH
    .map(h => `${isDone(h, today) ? "✓" : "○"} ${h.text}`)
    .join(", ") || "none";
  const focusedStr = tc.filter(t => t.pct >= 70).map(t => t.type).join(", ") || "none";
  const neglectedStr = tc.filter(t => t.pct < 40).map(t => t.type).join(", ") || "none";
  const patternsStr = corrHints.length
    ? `\nPATTERNS DETECTED: ${corrHints.join(" | ")}`
    : "";

  return `${toneLine} Generate a brief, data-driven morning briefing. Do NOT include any quotations, author attributions, or motivational aphorisms — that content lives elsewhere in the app.\n\nGOALS: ${goalsStr}\nTASKS: ${tasksStr}\nHABITS (${doneCount}/${dH.length} done): ${habitsStr}\nFOCUSED areas (${dataDays}d): ${focusedStr}\nNEGLECTED areas (${dataDays}d): ${neglectedStr}${patternsStr}\n\n3 short paragraphs: 1) greeting referencing today's tasks/goals, 2) life-balance insight — weave in any PATTERNS DETECTED naturally if present, 3) brief closing. Match the tone above exactly. No quotes.`;
};

// ─────────────────────────────────────────────────────────────────────
// briefDomain — exported bag.
// ─────────────────────────────────────────────────────────────────────
const briefDomain = {
  greetingForTime,
  todayRitualState,
  tipsForToday,
  upcomingDatesForBrief,
  urgentTodosForBrief,
  detectAdditiveCrowding,
  completionDayCount,
  welcomeBriefing,
  allYesterdayHabitsReviewed,
  reorderForCrowdingPair,
  nextRitualState,
  deterministicBriefing,
  aiBriefingPrompt
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { briefDomain };
} else if (typeof window !== "undefined") {
  window.briefDomain = briefDomain;
}

})(); // end IIFE wrapper (§13.4a v75)
