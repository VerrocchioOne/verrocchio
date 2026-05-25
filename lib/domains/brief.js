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
  welcomeBriefing
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { briefDomain };
} else if (typeof window !== "undefined") {
  window.briefDomain = briefDomain;
}

})(); // end IIFE wrapper (§13.4a v75)
