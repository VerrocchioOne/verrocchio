// Pinned-behavior tests for calendarDomain (lib/domains/calendar.js).
// Phase B of v75 view extraction. Mirrors tests/merge.test.mjs structure:
// createRequire bootstrap, node:test runner, AAA per behavior.
//
// Coverage targets:
//   - monthGrid: 42 cells; month-boundary alignment (Feb 2026 starts Sun);
//                leap-year (Feb 2024 = 29 days); isToday signal honoured.
//   - habitsDueOnDay: weekly / monthly / daily / annual filters; startDate
//                     cutoff; avoid + all-day + child filters; concurrent
//                     stacking; section-cursor stacking; parked filter.
//   - dayCompletionStats: done / missed / skipped counts + total.
//   - markDayVisited: idempotent; immutable; appends new key.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { calendarDomain } = require("../../lib/domains/calendar.js");
const { monthGrid, habitsDueOnDay, dayCompletionStats, markDayVisited } = calendarDomain;

// ─────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────

const habit = (id, text, overrides = {}) => ({
  id,
  text,
  section: "morning",
  _order: 0,
  concurrent: false,
  type: "Physical",
  duration: 30,
  startDate: "2020-01-01",
  parked: false,
  completions: {},
  completionTimes: {},
  frequency: { type: "daily" },
  ...overrides
});

const goal = (id, text, timebound) => ({
  id, text, type: "Career", smart: { timebound }
});

const TODAY = "2026-05-23";

// ─────────────────────────────────────────────────────────────────────
// monthGrid — month-boundary + leap year + isToday
// ─────────────────────────────────────────────────────────────────────

test("monthGrid: always returns exactly 42 cells (6 rows × 7 cols)", () => {
  const data = { habits: [], goals: [] };
  const grid = monthGrid(data, 2026, 1, TODAY); // Feb 2026
  assert.equal(grid.length, 42);
});

test("monthGrid: Feb 2026 starts on Sunday → no leading blanks, 14 trailing", () => {
  // Feb 1 2026 is a Sunday (dow=0); 28 days; 0 leading + 14 trailing.
  const data = { habits: [], goals: [] };
  const grid = monthGrid(data, 2026, 1, TODAY);

  const dayCells = grid.filter(c => !c.blank);
  const blankCells = grid.filter(c => c.blank);
  assert.equal(dayCells.length, 28, "Feb 2026 has 28 days");
  assert.equal(blankCells.length, 14, "14 trailing blanks");
  assert.equal(dayCells[0].dayNum, 1, "first cell is day 1");
  assert.equal(dayCells[0].k, "2026-02-01");
  assert.equal(dayCells[27].dayNum, 28, "last day cell is 28");
  assert.equal(grid[0].blank, false, "first slot is day 1, not blank");
  assert.equal(grid[28].blank, true, "slot 28 is the first trailing blank");
});

test("monthGrid: leap year Feb 2024 has 29 day cells", () => {
  const data = { habits: [], goals: [] };
  const grid = monthGrid(data, 2024, 1, TODAY); // Feb 2024 = leap
  const dayCells = grid.filter(c => !c.blank);
  assert.equal(dayCells.length, 29);
  assert.equal(dayCells[28].dayNum, 29);
  assert.equal(dayCells[28].k, "2024-02-29");
});

test("monthGrid: weekday alignment respects firstDow (May 2026 starts Friday)", () => {
  // May 1 2026 is a Friday (dow=5); 5 leading blanks before day 1.
  const data = { habits: [], goals: [] };
  const grid = monthGrid(data, 2026, 4, TODAY); // May = month index 4
  assert.equal(grid[0].blank, true, "slot 0 (Sun) is blank — May starts Fri");
  assert.equal(grid[4].blank, true, "slot 4 (Thu) is the last leading blank");
  assert.equal(grid[5].blank, false, "slot 5 (Fri) is day 1");
  assert.equal(grid[5].dayNum, 1);
  assert.equal(grid[5].k, "2026-05-01");
});

test("monthGrid: isToday is true only for the cell matching todayKey", () => {
  const data = { habits: [], goals: [] };
  const grid = monthGrid(data, 2026, 4, "2026-05-15"); // May 2026, today = 15th
  const todayCells = grid.filter(c => c.isToday);
  assert.equal(todayCells.length, 1);
  assert.equal(todayCells[0].dayNum, 15);
  assert.equal(todayCells[0].k, "2026-05-15");
});

test("monthGrid: goals chip lands on cell whose date matches smart.timebound", () => {
  const data = {
    habits: [],
    goals: [goal(1, "Finish course", "2026-02-15")]
  };
  const grid = monthGrid(data, 2026, 1, TODAY); // Feb 2026
  const cellWithGoal = grid.find(c => !c.blank && c.k === "2026-02-15");
  assert.ok(cellWithGoal, "cell for Feb 15 exists");
  assert.equal(cellWithGoal.goals.length, 1);
  assert.equal(cellWithGoal.goals[0].text, "Finish course");

  const cellWithoutGoal = grid.find(c => !c.blank && c.k === "2026-02-10");
  assert.equal(cellWithoutGoal.goals.length, 0);
});

test("monthGrid: daily habits are excluded from due[] (sparse-only)", () => {
  const data = {
    habits: [habit("h1", "Daily hydration", { frequency: { type: "daily" } })],
    goals: []
  };
  const grid = monthGrid(data, 2026, 1, TODAY);
  for (const c of grid.filter(c => !c.blank)) {
    assert.equal(c.due.length, 0, "no sparse chip for daily habit on " + c.k);
  }
});

test("monthGrid: weekly habit on Mondays appears in due[] only on Mondays", () => {
  // Feb 2 2026 (Mon), Feb 9 (Mon), Feb 16 (Mon), Feb 23 (Mon).
  const data = {
    habits: [habit("h1", "Weekly stretch", { frequency: { type: "weekly", day: 1 } })],
    goals: []
  };
  const grid = monthGrid(data, 2026, 1, TODAY);
  const mondays = ["2026-02-02", "2026-02-09", "2026-02-16", "2026-02-23"];
  for (const c of grid.filter(c => !c.blank)) {
    if (mondays.includes(c.k)) {
      assert.equal(c.due.length, 1, c.k + " is a Monday → habit due");
      assert.equal(c.due[0].habit.text, "Weekly stretch");
    } else {
      assert.equal(c.due.length, 0, c.k + " is NOT Monday → no chip");
    }
  }
});

// ─────────────────────────────────────────────────────────────────────
// habitsDueOnDay — frequency types + startDate + filters
// ─────────────────────────────────────────────────────────────────────

test("habitsDueOnDay: daily habit is due every day", () => {
  const data = { habits: [habit("h1", "Hydrate", { frequency: { type: "daily" } })] };
  const due = habitsDueOnDay(data, "2026-05-23");
  assert.equal(due.length, 1);
  assert.equal(due[0].habit.text, "Hydrate");
});

test("habitsDueOnDay: weekly habit fires only on its weekday", () => {
  // Tuesday = dow 2. 2026-05-26 is a Tuesday.
  const data = {
    habits: [habit("h1", "Tuesday class", { frequency: { type: "weekly", day: 2 } })]
  };
  assert.equal(habitsDueOnDay(data, "2026-05-26").length, 1);
  assert.equal(habitsDueOnDay(data, "2026-05-27").length, 0);
});

test("habitsDueOnDay: monthly habit fires only on its monthDay", () => {
  const data = {
    habits: [habit("h1", "Pay rent", { frequency: { type: "monthly", monthDay: 15 } })]
  };
  assert.equal(habitsDueOnDay(data, "2026-05-15").length, 1, "due on 15th");
  assert.equal(habitsDueOnDay(data, "2026-05-14").length, 0, "not due 14th");
  assert.equal(habitsDueOnDay(data, "2026-06-15").length, 1, "due on next month's 15th");
});

test("habitsDueOnDay: annual habit fires only on its (month, monthDay)", () => {
  // March 21 every year.
  const data = {
    habits: [habit("h1", "Spring equinox ritual", {
      frequency: { type: "annual", month: 2, monthDay: 21 }
    })]
  };
  assert.equal(habitsDueOnDay(data, "2026-03-21").length, 1);
  assert.equal(habitsDueOnDay(data, "2026-03-20").length, 0);
  assert.equal(habitsDueOnDay(data, "2027-03-21").length, 1, "same date next year");
});

test("habitsDueOnDay: startDate cutoff excludes pre-startDate dates", () => {
  const data = {
    habits: [habit("h1", "New routine", {
      startDate: "2026-06-01",
      frequency: { type: "daily" }
    })]
  };
  assert.equal(habitsDueOnDay(data, "2026-05-31").length, 0, "before start");
  assert.equal(habitsDueOnDay(data, "2026-06-01").length, 1, "on start date");
  assert.equal(habitsDueOnDay(data, "2026-07-15").length, 1, "well after start");
});

test("habitsDueOnDay: parked / avoid / all-day / child habits excluded", () => {
  const data = {
    habits: [
      habit("h1", "Active", { frequency: { type: "daily" } }),
      habit("h2", "Parked",   { parked: true,        frequency: { type: "daily" } }),
      habit("h3", "Avoid bad", { section: "avoid",    frequency: { type: "daily" } }),
      habit("h4", "All-day",   { section: "all-day",  frequency: { type: "daily" } }),
      habit("h5", "Child of 1", { parentId: "h1",     frequency: { type: "daily" } })
    ]
  };
  const due = habitsDueOnDay(data, "2026-05-23");
  assert.equal(due.length, 1, "only the plain active scheduled habit");
  assert.equal(due[0].habit.id, "h1");
});

test("habitsDueOnDay: section-stacking puts non-concurrent habits sequentially", () => {
  // Default morning start = 6:00 (360 min). First → 360..390, second → 390..450.
  const data = {
    habits: [
      habit("h1", "A", { _order: 0, duration: 30, frequency: { type: "daily" } }),
      habit("h2", "B", { _order: 1, duration: 60, frequency: { type: "daily" } })
    ]
  };
  const due = habitsDueOnDay(data, "2026-05-23");
  assert.equal(due.length, 2);
  assert.equal(due[0].startMin, 360, "first starts at 6:00");
  assert.equal(due[0].endMin, 390);
  assert.equal(due[1].startMin, 390, "second starts right after first");
  assert.equal(due[1].endMin, 450);
});

test("habitsDueOnDay: concurrent habit shares predecessor's start", () => {
  const data = {
    habits: [
      habit("h1", "A", { _order: 0, duration: 30, frequency: { type: "daily" } }),
      habit("h2", "B", { _order: 1, duration: 30, concurrent: true, frequency: { type: "daily" } })
    ]
  };
  const due = habitsDueOnDay(data, "2026-05-23");
  assert.equal(due.length, 2);
  assert.equal(due[0].startMin, due[1].startMin, "both start at the same minute");
  assert.equal(due[0].startMin, 360);
});

test("habitsDueOnDay: parent with children gets summed-duration slot + members", () => {
  // effDuration = 10 + 15 = 25. members = [child1, child2].
  const data = {
    habits: [
      habit("p1", "Morning routine", { duration: 30, frequency: { type: "daily" } }),
      habit("c1", "Brush teeth", { parentId: "p1", _order: 0, duration: 10 }),
      habit("c2", "Wash face",   { parentId: "p1", _order: 1, duration: 15 })
    ]
  };
  const due = habitsDueOnDay(data, "2026-05-23");
  assert.equal(due.length, 1, "children filtered out; only parent slot");
  assert.equal(due[0].durationMin, 25, "sum of children, not parent's own");
  assert.equal(due[0].members.length, 2, "children carried as members");
  assert.equal(due[0].members[0].text, "Brush teeth");
  assert.equal(due[0].members[1].text, "Wash face");
});

// ─────────────────────────────────────────────────────────────────────
// dayCompletionStats
// ─────────────────────────────────────────────────────────────────────

test("dayCompletionStats: counts done / missed / skipped + total", () => {
  // 4 due habits; one done, one missed, one skipped, one untouched.
  const data = {
    habits: [
      habit("h1", "A", { completions: { "2026-05-23": "done" } }),
      habit("h2", "B", { completions: { "2026-05-23": true     } }), // legacy boolean
      habit("h3", "C", { completions: { "2026-05-23": "missed" } }),
      habit("h4", "D", { completions: { "2026-05-23": "skipped" } }),
      habit("h5", "E", { completions: {} }) // untouched
    ]
  };
  const stats = dayCompletionStats(data, "2026-05-23");
  assert.equal(stats.total, 5);
  assert.equal(stats.done, 2, "h1 + h2 (string + bool both count)");
  assert.equal(stats.missed, 1);
  assert.equal(stats.skipped, 1);
});

test("dayCompletionStats: avoid + children + parked + future-start excluded from total", () => {
  const data = {
    habits: [
      habit("h1", "Active",   { completions: { "2026-05-23": "done" } }),
      habit("h2", "Avoid",    { section: "avoid",   completions: {} }),
      habit("h3", "Parked",   { parked: true,       completions: {} }),
      habit("h4", "FutureStart", { startDate: "2026-06-01", completions: {} }),
      habit("h5", "Child",    { parentId: "h1",     completions: {} })
    ]
  };
  const stats = dayCompletionStats(data, "2026-05-23");
  assert.equal(stats.total, 1, "only h1 active on this date");
  assert.equal(stats.done, 1);
});

test("dayCompletionStats: weekly habit not due on the date contributes 0 to total", () => {
  // Mon-only weekly; check Tue (2026-05-26) vs Mon (2026-05-25).
  const data = {
    habits: [habit("h1", "Mon class", { frequency: { type: "weekly", day: 1 } })]
  };
  const onTue = dayCompletionStats(data, "2026-05-26");
  const onMon = dayCompletionStats(data, "2026-05-25");
  assert.equal(onTue.total, 0, "not due → not counted");
  assert.equal(onMon.total, 1, "due Monday → counted");
});

// ─────────────────────────────────────────────────────────────────────
// markDayVisited — idempotent, immutable, curried
// ─────────────────────────────────────────────────────────────────────

test("markDayVisited: curried — returns a function awaiting data", () => {
  const action = markDayVisited("2026-05-23");
  assert.equal(typeof action, "function");
});

test("markDayVisited: appends new dateKey to dayVisits when absent", () => {
  const data = { dayVisits: ["2026-05-20"], habits: [] };
  const next = markDayVisited("2026-05-23")(data);
  assert.notEqual(next, data, "returns a new object");
  assert.deepEqual(next.dayVisits, ["2026-05-20", "2026-05-23"]);
  assert.equal(next.habits, data.habits, "unaffected fields stay reference-equal");
});

test("markDayVisited: idempotent — already-visited day returns input unchanged", () => {
  const data = { dayVisits: ["2026-05-20", "2026-05-23"], habits: [] };
  const next = markDayVisited("2026-05-23")(data);
  assert.equal(next, data, "same object reference returned (no-op)");
  assert.deepEqual(next.dayVisits, ["2026-05-20", "2026-05-23"], "list unchanged");
});

test("markDayVisited: missing dayVisits array is treated as empty", () => {
  const data = { habits: [] };
  const next = markDayVisited("2026-05-23")(data);
  assert.deepEqual(next.dayVisits, ["2026-05-23"]);
});

test("markDayVisited: does not mutate input dayVisits array", () => {
  const original = ["2026-05-20"];
  const data = { dayVisits: original, habits: [] };
  markDayVisited("2026-05-23")(data);
  assert.deepEqual(original, ["2026-05-20"], "original array reference is untouched");
});
