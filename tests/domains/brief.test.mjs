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
