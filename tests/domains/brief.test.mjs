// Pinned-behavior tests for lib/domains/brief.js (Phase B view extraction).
//
// Mirrors tests/merge.test.mjs structure: createRequire bootstrap so the
// shared CommonJS module file works under Node ESM test runners; AAA
// blocks per behavior.
//
// What we pin here is the BriefView's CURRENT semantics — extraction is
// a refactor, not a behavior change.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { briefDomain } = require("../../lib/domains/brief.js");
const { dk } = require("../../utils.js");

const todayK = dk(new Date());

// ─────────────────────────────────────────────────────────────────────
// greetingForTime — pinned cut-offs
// ─────────────────────────────────────────────────────────────────────

test("greetingForTime returns morning before noon", () => {
  // Arrange
  // Act
  const out = briefDomain.greetingForTime(8);
  // Assert
  assert.equal(out, "Good morning");
});

test("greetingForTime returns afternoon between 12 and 18", () => {
  assert.equal(briefDomain.greetingForTime(12), "Good afternoon");
  assert.equal(briefDomain.greetingForTime(17), "Good afternoon");
});

test("greetingForTime returns evening at and after 18", () => {
  assert.equal(briefDomain.greetingForTime(18), "Good evening");
  assert.equal(briefDomain.greetingForTime(23), "Good evening");
});

test("greetingForTime accepts a Date and reads its hour", () => {
  const morning = new Date();
  morning.setHours(7, 0, 0, 0);
  const evening = new Date();
  evening.setHours(20, 0, 0, 0);
  assert.equal(briefDomain.greetingForTime(morning), "Good morning");
  assert.equal(briefDomain.greetingForTime(evening), "Good evening");
});

// ─────────────────────────────────────────────────────────────────────
// todayRitualState — reads today's ritual slice with safe defaults
// ─────────────────────────────────────────────────────────────────────

test("todayRitualState defaults every flag to false when data is empty", () => {
  // Arrange
  const data = { dailyRitual: {} };
  // Act
  const s = briefDomain.todayRitualState(data);
  // Assert
  assert.equal(s.intentionSet, false);
  assert.equal(s.intention, "");
  assert.equal(s.briefingReviewed, false);
  assert.equal(s.yesterdayReviewed, false);
  assert.equal(s.goalsReviewed, false);
  assert.equal(s.tipsReviewed, false);
  assert.equal(s.todosReviewed, false);
  assert.equal(s.yestJournalReviewed, false);
  assert.equal(s.weeklyReviewDone, false);
  assert.equal(s.debriefCompletedAt, null);
  assert.equal(s.eveningDebriefCompletedAt, null);
});

test("todayRitualState reflects flags + intention from today's slice", () => {
  // Arrange
  const data = {
    dailyRitual: {
      [todayK]: {
        intention: "Ship the Brief extraction",
        briefingReviewed: true,
        tipsReviewed: true,
        debriefCompletedAt: 1234567890,
        aiTipBody: "Hello world",
        aiTipKey: "warm:corr:abc"
      }
    }
  };
  // Act
  const s = briefDomain.todayRitualState(data);
  // Assert
  assert.equal(s.intention, "Ship the Brief extraction");
  assert.equal(s.intentionSet, true);
  assert.equal(s.briefingReviewed, true);
  assert.equal(s.tipsReviewed, true);
  assert.equal(s.debriefCompletedAt, 1234567890);
  assert.equal(s.aiTipBody, "Hello world");
  assert.equal(s.aiTipKey, "warm:corr:abc");
});

test("todayRitualState treats whitespace-only intention as unset", () => {
  const data = { dailyRitual: { [todayK]: { intention: "   " } } };
  const s = briefDomain.todayRitualState(data);
  assert.equal(s.intentionSet, false);
  assert.equal(s.intention, "");
});

test("todayRitualState does not mutate the input data", () => {
  const data = { dailyRitual: { [todayK]: { briefingReviewed: true } } };
  const snapshot = JSON.parse(JSON.stringify(data));
  briefDomain.todayRitualState(data);
  assert.deepEqual(data, snapshot);
});

// ─────────────────────────────────────────────────────────────────────
// tipsForToday — assembly order + filters
// ─────────────────────────────────────────────────────────────────────

test("tipsForToday appends the evergreen tip when nothing else fires", () => {
  // Arrange
  const data = { habits: [], goals: [], todos: [], dailyRitual: {} };
  // Act
  const tips = briefDomain.tipsForToday(data, {});
  // Assert — at least the evergreen "Stay consistent" so the card never
  // renders empty.
  assert.ok(tips.length >= 1);
  assert.equal(tips[tips.length - 1].title, "Stay consistent");
});

test("tipsForToday prepends the AI personalized tip when present and consented", () => {
  // Arrange — cached AI tip on today's ritual, consent recorded.
  const data = {
    habits: [], goals: [], todos: [],
    aiConsentAt: 1,
    dailyRitual: {
      [todayK]: {
        aiTipBody: "Try moving cardio earlier.",
        aiTipKey: "calm:off:h1:morning"
      }
    }
  };
  // Act
  const tips = briefDomain.tipsForToday(data, { aiEnabled: true });
  // Assert
  assert.equal(tips[0].title, "Personalized for you");
  assert.equal(tips[0].body, "Try moving cardio earlier.");
  assert.equal(tips[0].icon, "🕘"); // off-schedule shape, not :corr:
});

test("tipsForToday hides off-schedule entry already covered by AI tip habitId", () => {
  // Arrange — AI tip targets h1; off-schedule list has h1 + h2.
  const data = {
    habits: [], goals: [], todos: [],
    aiConsentAt: 1,
    dailyRitual: {
      [todayK]: {
        aiTipBody: "x",
        aiTipKey: "warm:off:h1:morning"
      }
    }
  };
  const off = [
    { habitId: "h1", habitText: "Cardio", section: "morning", lateCount: 5, loggedCount: 7 },
    { habitId: "h2", habitText: "Stretch", section: "afternoon", lateCount: 4, loggedCount: 6 }
  ];
  // Act
  const tips = briefDomain.tipsForToday(data, {
    aiEnabled: true,
    memoedOffSchedule: off
  });
  // Assert — h1 must not appear as a templated off-schedule tip.
  const offTips = tips.filter(t => t.kind === "off-schedule");
  assert.equal(offTips.length, 1);
  assert.equal(offTips[0].payload.habitId, "h2");
});

test("tipsForToday surfaces an incomplete-habit nudge with the first incomplete sample", () => {
  // Arrange
  const incomplete = { id: "h1", text: "Read 20 pages" };
  const ok = { id: "h2", text: "Hydrate", type: "Health", section: "morning", frequency: { type: "daily" } };
  const data = { habits: [incomplete, ok], goals: [], todos: [], dailyRitual: {} };
  const isHabitIncomplete = h => !h.type || !h.section || !h.frequency;
  // Act
  const tips = briefDomain.tipsForToday(data, { isHabitIncomplete });
  // Assert — exactly one habit-detail tip, mentioning the sample text.
  const hit = tips.find(t => t.title === "Fill in habit details");
  assert.ok(hit, "expected a habit-detail tip");
  assert.ok(hit.body.includes("Read 20 pages"));
  assert.equal(hit.kind, "coach-habit");
  assert.equal(hit.payload.habit.id, "h1");
});

test("tipsForToday surfaces a top-correlation pattern tip with the right cutoff label", () => {
  // Arrange
  const corr = [{
    aText: "Wake by 7", bText: "Cardio", aCutoffHour: 12,
    conditional: 0.8, base: 0.4
  }];
  // Act
  const tips = briefDomain.tipsForToday({}, { memoedCorrelations: corr });
  // Assert
  const hit = tips.find(t => t.title === "Pattern: habits move together");
  assert.ok(hit, "expected a correlation tip");
  assert.ok(hit.body.includes("by noon"));
  assert.ok(hit.body.includes("80%"));
  assert.ok(hit.body.includes("40%"));
});

test("tipsForToday surfaces low-completion habit using injected getCR", () => {
  // Arrange
  const low = { id: "h1", text: "Meditate" };
  const data = { habits: [low], goals: [], todos: [], dailyRitual: {} };
  const getCR = (h) => ({ pct: h.id === "h1" ? 12 : 90 });
  // Act
  const tips = briefDomain.tipsForToday(data, { getCR });
  // Assert
  const hit = tips.find(t => t.title === "Habit needs attention");
  assert.ok(hit);
  assert.ok(hit.body.includes("12%"));
  assert.equal(hit.payload.reason, "low-completion");
});

// ─────────────────────────────────────────────────────────────────────
// upcomingDatesForBrief — merge, sort, daysUntil
// ─────────────────────────────────────────────────────────────────────

test("upcomingDatesForBrief merges goal targets + custom dates and sorts ascending", () => {
  // Arrange — pick dates strictly ahead of "today" so daysUntil > 0 and
  // ordering is stable across timezones.
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const inDays = (n) => {
    const d = new Date(today0); d.setDate(d.getDate() + n);
    return dk(d);
  };
  const data = {
    goals: [
      { id: 1, text: "Run marathon",  smart: { timebound: inDays(30) } },
      { id: 2, text: "Read 12 books", smart: { timebound: inDays(10) } }
    ],
    upcomingDates: [
      { id: 99, text: "Anniversary", date: inDays(5)  },
      { id: 88, text: "Trip",        date: inDays(20) }
    ]
  };
  // Act
  const out = briefDomain.upcomingDatesForBrief(data, today0);
  // Assert
  assert.equal(out.length, 4);
  assert.deepEqual(out.map(x => x.daysUntil), [5, 10, 20, 30]);
  assert.equal(out[0].kind, "custom");
  assert.equal(out[1].kind, "goal");
  assert.equal(out[2].kind, "custom");
  assert.equal(out[3].kind, "goal");
});

// ─────────────────────────────────────────────────────────────────────
// urgentTodosForBrief — overdue + <=3 days, skip done/archived
// ─────────────────────────────────────────────────────────────────────

test("urgentTodosForBrief surfaces overdue + due-within-3-days, sorted ascending", () => {
  // Arrange
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const inDays = (n) => {
    const d = new Date(today0); d.setDate(d.getDate() + n);
    return dk(d);
  };
  const data = {
    todos: [
      { id: 1, text: "Pay rent",     dueDate: inDays(-2) }, // overdue
      { id: 2, text: "Buy gift",     dueDate: inDays(1)  }, // urgent
      { id: 3, text: "Read paper",   dueDate: inDays(10) }, // not urgent
      { id: 4, text: "Old task",     dueDate: inDays(0), done: true }, // skip
      { id: 5, text: "Archived",     dueDate: inDays(0), archived: true } // skip
    ]
  };
  // Act
  const out = briefDomain.urgentTodosForBrief(data, today0);
  // Assert
  assert.equal(out.length, 2);
  assert.equal(out[0].todo.id, 1);
  assert.equal(out[1].todo.id, 2);
  assert.equal(out[0].days, -2);
  assert.equal(out[1].days, 1);
});

// ─────────────────────────────────────────────────────────────────────
// detectAdditiveCrowding — §14.3
// ─────────────────────────────────────────────────────────────────────

// Helper: a habit with `completions` filled in for the N most-recent of
// the past 14 days (oldest filled day = N-1 days ago, newest = today).
const habitWithRecentRate = (id, text, importance, doneInLast14) => {
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const completions = {};
  for (let i = 0; i < doneInLast14; i++) {
    const d = new Date(today0); d.setDate(d.getDate() - i);
    completions[dk(d)] = "done";
  }
  return { id, text, importance, completions };
};

test("detectAdditiveCrowding fires when a non-negotiable is missed and an additive is reliable", () => {
  // Arrange — 3/14 = 21% non-negotiable (< 50%), 13/14 = 93% additive (> 80%)
  const habits = [
    habitWithRecentRate(1, "Meditate", "Non-Negotiable", 3),
    habitWithRecentRate(2, "Read",     "Additive",       13)
  ];
  // Act
  const out = briefDomain.detectAdditiveCrowding(habits, new Date());
  // Assert
  assert.ok(out, "expected a crowding pair");
  assert.equal(out.nonNeg.id, 1);
  assert.equal(out.additive.id, 2);
  assert.equal(out.nonNegDone, 3);
  assert.equal(out.additiveDone, 13);
});

test("detectAdditiveCrowding returns null when no non-negotiable is missed enough (>=50%)", () => {
  const habits = [
    habitWithRecentRate(1, "Meditate", "Non-Negotiable", 8),  // ~57%
    habitWithRecentRate(2, "Read",     "Additive",       13)
  ];
  assert.equal(briefDomain.detectAdditiveCrowding(habits, new Date()), null);
});

test("detectAdditiveCrowding returns null when no additive is reliable enough (<=80%)", () => {
  const habits = [
    habitWithRecentRate(1, "Meditate", "Non-Negotiable", 2),
    habitWithRecentRate(2, "Read",     "Additive",       10)  // ~71%
  ];
  assert.equal(briefDomain.detectAdditiveCrowding(habits, new Date()), null);
});

test("detectAdditiveCrowding returns null on a dormant user (<3 done in last 7 days)", () => {
  // Arrange — all completions are 7+ days ago, so last-week activity = 0
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const olderOnly = (n) => {
    const c = {};
    for (let i = 0; i < n; i++) {
      const d = new Date(today0); d.setDate(d.getDate() - (7 + i));
      c[dk(d)] = "done";
    }
    return c;
  };
  const habits = [
    { id: 1, text: "Meditate", importance: "Non-Negotiable", completions: olderOnly(3)  },
    { id: 2, text: "Read",     importance: "Additive",       completions: olderOnly(12) }
  ];
  assert.equal(briefDomain.detectAdditiveCrowding(habits, new Date()), null);
});

test("detectAdditiveCrowding picks the worst-missed non-negotiable + best-reliable additive when multiple candidates exist", () => {
  const habits = [
    habitWithRecentRate(1, "Meditate", "Non-Negotiable", 6),  // 43%
    habitWithRecentRate(2, "Stretch",  "Non-Negotiable", 2),  // 14% — worst
    habitWithRecentRate(3, "Read",     "Additive",       12), // 86%
    habitWithRecentRate(4, "Podcast",  "Additive",       14)  // 100% — best
  ];
  const out = briefDomain.detectAdditiveCrowding(habits, new Date());
  assert.ok(out);
  assert.equal(out.nonNeg.id, 2, "expected the lowest-rate non-negotiable");
  assert.equal(out.additive.id, 4, "expected the highest-rate additive");
});

test("detectAdditiveCrowding handles empty/null input gracefully", () => {
  assert.equal(briefDomain.detectAdditiveCrowding([], new Date()), null);
  assert.equal(briefDomain.detectAdditiveCrowding(null, new Date()), null);
  assert.equal(briefDomain.detectAdditiveCrowding(undefined, new Date()), null);
});

// ─────────────────────────────────────────────────────────────────────
// completionDayCount — gate denominator for the AI Daily Briefing
// ─────────────────────────────────────────────────────────────────────

test("completionDayCount counts distinct days with positive completions across habits", () => {
  // Arrange — two habits sharing one day, each with one unique day
  const habits = [
    { id: 1, completions: { "2026-05-20": "done", "2026-05-21": true } },
    { id: 2, completions: { "2026-05-21": "done", "2026-05-22": "done" } }
  ];
  // Act
  const out = briefDomain.completionDayCount(habits);
  // Assert — 3 distinct days: 5-20, 5-21, 5-22
  assert.equal(out, 3);
});

test("completionDayCount excludes 'missed' values from the day count", () => {
  // Arrange — only one positive day; the rest are explicit "missed"
  const habits = [
    { id: 1, completions: { "2026-05-20": "done", "2026-05-21": "missed", "2026-05-22": "missed" } }
  ];
  // Act
  // Assert
  assert.equal(briefDomain.completionDayCount(habits), 1);
});

test("completionDayCount excludes parked habits entirely", () => {
  // Arrange — parked habit's history must NOT contribute to the denominator
  const habits = [
    { id: 1, parked: true,  completions: { "2026-05-20": "done", "2026-05-21": "done" } },
    { id: 2, parked: false, completions: { "2026-05-22": "done" } }
  ];
  // Act
  // Assert — only the active habit's one day counts
  assert.equal(briefDomain.completionDayCount(habits), 1);
});

test("completionDayCount handles empty / null / undefined input gracefully", () => {
  assert.equal(briefDomain.completionDayCount([]), 0);
  assert.equal(briefDomain.completionDayCount(null), 0);
  assert.equal(briefDomain.completionDayCount(undefined), 0);
});

// ─────────────────────────────────────────────────────────────────────
// welcomeBriefing — placeholder copy for pre-unlock state
// ─────────────────────────────────────────────────────────────────────

test("welcomeBriefing counts down remaining days with correct pluralization", () => {
  assert.equal(briefDomain.welcomeBriefing(0), "Log 7 more days of use to unlock your daily briefing.");
  assert.equal(briefDomain.welcomeBriefing(5), "Log 2 more days of use to unlock your daily briefing.");
  assert.equal(briefDomain.welcomeBriefing(6), "Log 1 more day of use to unlock your daily briefing.");
});

test("welcomeBriefing switches to the unlock-on-next-open line at threshold", () => {
  const unlockMsg = "You've logged a full week — your personalized briefing unlocks next time you open the app.";
  assert.equal(briefDomain.welcomeBriefing(7), unlockMsg);
  assert.equal(briefDomain.welcomeBriefing(99), unlockMsg, "overshooting the threshold still shows the unlock copy");
});

test("welcomeBriefing accepts a custom threshold", () => {
  assert.equal(briefDomain.welcomeBriefing(0, 3), "Log 3 more days of use to unlock your daily briefing.");
  assert.equal(briefDomain.welcomeBriefing(3, 3), "You've logged a full week — your personalized briefing unlocks next time you open the app.");
});

test("welcomeBriefing falls back to the 7-day threshold on invalid threshold", () => {
  assert.equal(briefDomain.welcomeBriefing(0, 0),   "Log 7 more days of use to unlock your daily briefing.");
  assert.equal(briefDomain.welcomeBriefing(0, -2),  "Log 7 more days of use to unlock your daily briefing.");
  assert.equal(briefDomain.welcomeBriefing(0, "x"), "Log 7 more days of use to unlock your daily briefing.");
});

// ─────────────────────────────────────────────────────────────────────
// allYesterdayHabitsReviewed — AI Daily Briefing gate predicate
// ─────────────────────────────────────────────────────────────────────

// Pin "now" to a known calendar day so yKey is stable for every test.
// 2026-05-25 local midnight; yesterday = 2026-05-24.
const PINNED_NOW = new Date(2026, 4, 25, 12, 0, 0); // local noon avoids DST edge cases
const YKEY = "2026-05-24";
const neverFuture = () => false;

test("allYesterdayHabitsReviewed returns true when no habit was due yesterday", () => {
  // Arrange — single daily habit but with startDate after yesterday (= future-relative-to-Y)
  const habits = [
    { id: 1, frequency: { type: "daily" }, startDate: "2026-05-25", completions: {} }
  ];
  // Act + Assert — dueYesterday is empty, .every returns true
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    true
  );
});

test("allYesterdayHabitsReviewed returns true when every due habit has a 'done' or 'missed' value", () => {
  const habits = [
    { id: 1, frequency: { type: "daily" }, completions: { [YKEY]: "done" } },
    { id: 2, frequency: { type: "daily" }, completions: { [YKEY]: "missed" } },
    { id: 3, frequency: { type: "daily" }, completions: { [YKEY]: true } }
  ];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    true
  );
});

test("allYesterdayHabitsReviewed returns false when a due habit lacks any explicit yesterday value", () => {
  const habits = [
    { id: 1, frequency: { type: "daily" }, completions: { [YKEY]: "done" } },
    { id: 2, frequency: { type: "daily" }, completions: {} } // missing
  ];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    false
  );
});

test("allYesterdayHabitsReviewed excludes parked / future-start habits via isFutureHabit", () => {
  // Arrange — second habit is "future" by injection; its missing value must not flip the gate
  const habits = [
    { id: 1, frequency: { type: "daily" }, completions: { [YKEY]: "done" } },
    { id: 2, frequency: { type: "daily" }, completions: {} } // unreviewed but parked
  ];
  const isFutureHabit = h => h.id === 2;
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit }),
    true
  );
});

test("allYesterdayHabitsReviewed excludes 'avoid' habits", () => {
  const habits = [
    { id: 1, frequency: { type: "daily" }, completions: { [YKEY]: "done" } },
    { id: 2, frequency: { type: "daily" }, section: "avoid", completions: {} } // implicit count
  ];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    true
  );
});

test("allYesterdayHabitsReviewed excludes sub-habits (parentId set) — parent rollup covers them", () => {
  const habits = [
    { id: 1, frequency: { type: "daily" }, completions: { [YKEY]: "done" } },
    { id: 2, frequency: { type: "daily" }, parentId: 1, completions: {} } // child missing OK
  ];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    true
  );
});

test("allYesterdayHabitsReviewed excludes habits whose startDate is after yesterday (created today)", () => {
  const habits = [
    { id: 1, frequency: { type: "daily" }, startDate: "2026-05-25", completions: {} } // created today
  ];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    true
  );
});

test("allYesterdayHabitsReviewed walks every slot for multi-slot habits", () => {
  // Arrange — 3 slots; one of them is missing yesterday's state, so gate is open
  const habits = [{
    id: 1,
    frequency: { type: "daily" },
    slotSections: ["morning", "morning", "evening"],
    slotCompletions: {
      [YKEY]: {
        "morning:0": "done",
        "morning:1": "missed",
        // "evening:0" missing
      }
    }
  }];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    false
  );
});

test("allYesterdayHabitsReviewed passes for multi-slot habit when every slot has explicit state", () => {
  const habits = [{
    id: 1,
    frequency: { type: "daily" },
    slotSections: ["morning", "morning", "evening"],
    slotCompletions: {
      [YKEY]: {
        "morning:0": "done",
        "morning:1": "missed",
        "evening:0": true
      }
    }
  }];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    true
  );
});

test("allYesterdayHabitsReviewed excludes habits whose frequency doesn't include yesterday", () => {
  // Arrange — weekly habit anchored to a different weekday than yesterday.
  // 2026-05-24 was a Sunday (day=0); anchor habit to Monday (day=1).
  const habits = [
    { id: 1, frequency: { type: "weekly", day: 1 }, completions: {} } // unreviewed but not due
  ];
  assert.equal(
    briefDomain.allYesterdayHabitsReviewed(habits, { now: PINNED_NOW, isFutureHabit: neverFuture }),
    true
  );
});

test("allYesterdayHabitsReviewed handles empty / null / undefined habits", () => {
  assert.equal(briefDomain.allYesterdayHabitsReviewed([], { now: PINNED_NOW, isFutureHabit: neverFuture }), true);
  assert.equal(briefDomain.allYesterdayHabitsReviewed(null, { now: PINNED_NOW, isFutureHabit: neverFuture }), true);
  assert.equal(briefDomain.allYesterdayHabitsReviewed(undefined, { now: PINNED_NOW, isFutureHabit: neverFuture }), true);
});
