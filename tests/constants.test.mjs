// Pinned-behavior tests for lib/constants.js — getFreq + isHabitDueOn.
// Verifies the canonical frequency-check logic that lib/domains/calendar.js
// mirrors as _getFreq/_isHabitDueOn. Having ONE source-of-truth tested here
// prevents the two copies from silently drifting.
//
// Also pins the §audit-P1 guard logic from allYesterdayHabitsReviewed —
// the pure filtering conditions (parentId guard, startDate guard) that the
// AI-briefing gate uses to decide which habits count as "due yesterday".

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getFreq, isHabitDueOn } = require("../lib/constants.js");

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const habit = (overrides = {}) => ({
  frequency: { type: "daily" },
  ...overrides
});

// Simulates the §audit-P1 dueYesterday filter from allYesterdayHabitsReviewed.
// The full function lives in App() and also calls isFutureHabit() (which uses
// React state), but these two guards are pure boolean checks extractable here.
const isIncludedInYesterdayGate = (h, yKey) => {
  if (h.parentId != null) return false;        // §audit-P1
  if (h.startDate && h.startDate > yKey) return false;  // §audit-P1
  return isHabitDueOn(h, yKey);
};

// ─────────────────────────────────────────────────────────────────────
// getFreq — normalization
// ─────────────────────────────────────────────────────────────────────

test("getFreq: null / missing habit returns daily default", () => {
  assert.deepEqual(getFreq(null), { type: "daily", days: [], day: null, monthDay: null, month: null });
  assert.deepEqual(getFreq({}), { type: "daily", days: [], day: null, monthDay: null, month: null });
  assert.deepEqual(getFreq({ frequency: {} }), { type: "daily", days: [], day: null, monthDay: null, month: null });
});

test("getFreq: legacy weekly-day type is normalized to weekly", () => {
  const h = habit({ frequency: { type: "weekly-day", day: 2 } });
  assert.equal(getFreq(h).type, "weekly");
});

test("getFreq: numeric fields are preserved; non-numeric coerced to null", () => {
  const h = habit({ frequency: { type: "monthly", monthDay: 15, day: "bad", month: "bad" } });
  const fq = getFreq(h);
  assert.equal(fq.monthDay, 15);
  assert.equal(fq.day, null);
  assert.equal(fq.month, null);
});

test("getFreq: weekdays days array is preserved", () => {
  const h = habit({ frequency: { type: "weekdays", days: [1, 3, 5] } });
  assert.deepEqual(getFreq(h).days, [1, 3, 5]);
});

// ─────────────────────────────────────────────────────────────────────
// isHabitDueOn — frequency gate
// ─────────────────────────────────────────────────────────────────────

test("isHabitDueOn: daily habit is due on any day", () => {
  const h = habit({ frequency: { type: "daily" } });
  assert.equal(isHabitDueOn(h, "2026-05-25"), true);  // Monday
  assert.equal(isHabitDueOn(h, "2026-05-24"), true);  // Sunday
});

test("isHabitDueOn: weekdays habit due only on selected days-of-week", () => {
  // Monday=1, Wednesday=3
  const h = habit({ frequency: { type: "weekdays", days: [1, 3] } });
  assert.equal(isHabitDueOn(h, "2026-05-25"), true);   // Monday
  assert.equal(isHabitDueOn(h, "2026-05-27"), true);   // Wednesday
  assert.equal(isHabitDueOn(h, "2026-05-26"), false);  // Tuesday
  assert.equal(isHabitDueOn(h, "2026-05-24"), false);  // Sunday
});

test("isHabitDueOn: weekdays with empty days array → never due", () => {
  const h = habit({ frequency: { type: "weekdays", days: [] } });
  assert.equal(isHabitDueOn(h, "2026-05-25"), false);
});

test("isHabitDueOn: weekly habit due only on its anchor day-of-week", () => {
  // day: 1 = Monday
  const h = habit({ frequency: { type: "weekly", day: 1 } });
  assert.equal(isHabitDueOn(h, "2026-05-25"), true);   // Monday
  assert.equal(isHabitDueOn(h, "2026-05-26"), false);  // Tuesday
});

test("isHabitDueOn: weekly with null day defaults to Monday (day 1)", () => {
  const h = habit({ frequency: { type: "weekly", day: null } });
  assert.equal(isHabitDueOn(h, "2026-05-25"), true);   // Monday
  assert.equal(isHabitDueOn(h, "2026-05-26"), false);  // Tuesday
});

test("isHabitDueOn: monthly habit due only on its monthDay", () => {
  const h = habit({ frequency: { type: "monthly", monthDay: 15 } });
  assert.equal(isHabitDueOn(h, "2026-05-15"), true);
  assert.equal(isHabitDueOn(h, "2026-05-16"), false);
  assert.equal(isHabitDueOn(h, "2026-06-15"), true);
});

test("isHabitDueOn: monthly with null monthDay defaults to 1st", () => {
  const h = habit({ frequency: { type: "monthly", monthDay: null } });
  assert.equal(isHabitDueOn(h, "2026-05-01"), true);
  assert.equal(isHabitDueOn(h, "2026-05-02"), false);
});

test("isHabitDueOn: quarterly habit due on the anchor month/day every 3 months", () => {
  // Anchored to January 10 (month=0, monthDay=10)
  const h = habit({ frequency: { type: "quarterly", month: 0, monthDay: 10 } });
  assert.equal(isHabitDueOn(h, "2026-01-10"), true);   // Jan 10
  assert.equal(isHabitDueOn(h, "2026-04-10"), true);   // Apr 10 (+3)
  assert.equal(isHabitDueOn(h, "2026-07-10"), true);   // Jul 10 (+6)
  assert.equal(isHabitDueOn(h, "2026-10-10"), true);   // Oct 10 (+9)
  assert.equal(isHabitDueOn(h, "2026-02-10"), false);  // Feb 10 (not quarterly)
  assert.equal(isHabitDueOn(h, "2026-01-11"), false);  // Jan 11 (wrong day)
});

test("isHabitDueOn: annual habit due only on its month+day", () => {
  const h = habit({ frequency: { type: "annual", month: 4, monthDay: 15 } });  // May 15
  assert.equal(isHabitDueOn(h, "2026-05-15"), true);
  assert.equal(isHabitDueOn(h, "2026-05-16"), false);
  assert.equal(isHabitDueOn(h, "2027-05-15"), true);
  assert.equal(isHabitDueOn(h, "2026-06-15"), false);
});

test("isHabitDueOn: unparsable dateKey defaults to true (don't hide)", () => {
  const h = habit({ frequency: { type: "weekly", day: 1 } });
  assert.equal(isHabitDueOn(h, ""), true);
  assert.equal(isHabitDueOn(h, null), true);
  assert.equal(isHabitDueOn(h, "not-a-date"), true);
});

// ─────────────────────────────────────────────────────────────────────
// §audit-P1 gate guard logic
// ─────────────────────────────────────────────────────────────────────

test("§audit-P1: child habit (parentId set) is excluded from yesterday gate", () => {
  // A child habit with parentId should never block the AI briefing gate.
  // The parent's rollup represents the child; double-counting closes the gate.
  const child = habit({ parentId: 42, frequency: { type: "daily" } });
  assert.equal(isIncludedInYesterdayGate(child, "2026-05-24"), false);
});

test("§audit-P1: habit created today (startDate > yKey) is excluded from yesterday gate", () => {
  // A habit created today was not due yesterday; including it keeps the gate
  // permanently closed (yesterday has no completions for a brand-new habit).
  const newToday = habit({ startDate: "2026-05-25", frequency: { type: "daily" } });
  const yKey = "2026-05-24";
  assert.equal(isIncludedInYesterdayGate(newToday, yKey), false);
});

test("§audit-P1: habit created yesterday (startDate === yKey) IS included in gate", () => {
  // A habit started yesterday was due yesterday and its completion should
  // gate the briefing (absent = missed, which counts as reviewed).
  const startedYesterday = habit({ startDate: "2026-05-24", frequency: { type: "daily" } });
  const yKey = "2026-05-24";
  assert.equal(isIncludedInYesterdayGate(startedYesterday, yKey), true);
});

test("§audit-P1: habit created before yesterday IS included in gate", () => {
  const old = habit({ startDate: "2026-01-01", frequency: { type: "daily" } });
  assert.equal(isIncludedInYesterdayGate(old, "2026-05-24"), true);
});

test("§audit-P1: top-level habit (no parentId) with null startDate IS included", () => {
  const h = habit({ startDate: null, frequency: { type: "daily" } });
  assert.equal(isIncludedInYesterdayGate(h, "2026-05-24"), true);
});

test("§audit-P1: weekly habit not due yesterday is correctly excluded from gate", () => {
  // Tuesday-only habit, yesterday was Monday → not included (not due)
  const h = habit({ frequency: { type: "weekly", day: 2 }, startDate: "2020-01-01" });
  // 2026-05-24 is a Sunday; not a Tuesday
  assert.equal(isIncludedInYesterdayGate(h, "2026-05-24"), false);
});
