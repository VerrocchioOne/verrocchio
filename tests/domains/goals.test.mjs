// Pinned-behavior tests for lib/domains/goals.js.
// Phase B of v75 view-extraction. Mirrors tests/merge.test.mjs bootstrap.
//
// These tests document the READ-side semantics of goalsDomain so a
// future refactor (or Phase C wiring) can't drift from the inline
// implementation in index.html without breaking a green build.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { goalsDomain } = require("../../lib/domains/goals.js");

const {
  bySectionGroup,
  smartCompleteness,
  isLinkedGoalIncomplete,
  isGoalCardIncomplete,
  linkedHabitsFor,
  linkedTodosFor,
  habitGoalIds,
  habitLinkedToGoal,
} = goalsDomain;

// ─────────────────────────────────────────────────────────────────────
// smartCompleteness — the SMART filled/missing counter that drives
// the per-goal "{n}/5" sub-header.
// ─────────────────────────────────────────────────────────────────────

test("smartCompleteness: empty goal returns 0 filled, all missing", () => {
  const result = smartCompleteness({ smart: {} });
  assert.equal(result.filled, 0);
  assert.equal(result.total, 5);
  assert.equal(result.hasAny, false);
  assert.deepEqual(result.missing, ["specific", "measurable", "achievable", "relevant", "timebound"]);
});

test("smartCompleteness: fully filled goal returns 5/5", () => {
  const goal = {
    smart: {
      specific: "Run 21k",
      measurable: "21",
      measurableUnit: "km",
      achievable: "+10%/wk",
      relevant: "Cardio",
      timebound: "2026-10-15"
    }
  };
  const result = smartCompleteness(goal);
  assert.equal(result.filled, 5);
  assert.deepEqual(result.missing, []);
  assert.equal(result.present.measurable, true);
});

test("smartCompleteness: measurableUnit alone counts as M filled (legacy back-compat)", () => {
  // Inline at index.html:20376 — `_mFilled = _hasVal(_sm.measurable) ||
  // _hasVal(_sm.measurableUnit)`. Unit-only entries (legacy data) still
  // make the M letter count.
  const result = smartCompleteness({ smart: { measurableUnit: "books" } });
  assert.equal(result.present.measurable, true);
  assert.equal(result.filled, 1);
});

test("smartCompleteness: whitespace-only values don't count as filled", () => {
  const result = smartCompleteness({ smart: { specific: "   ", relevant: "" } });
  assert.equal(result.filled, 0);
  assert.equal(result.hasAny, false);
});

test("smartCompleteness: null / undefined goal is handled gracefully", () => {
  const a = smartCompleteness(null);
  const b = smartCompleteness(undefined);
  assert.equal(a.filled, 0);
  assert.equal(b.filled, 0);
});

// ─────────────────────────────────────────────────────────────────────
// isLinkedGoalIncomplete — used for habit cards' ⚠️ warning. Stricter
// than isGoalCardIncomplete: ANY missing SMART field flags the goal.
// ─────────────────────────────────────────────────────────────────────

test("isLinkedGoalIncomplete: habit with no goal links returns false", () => {
  const result = isLinkedGoalIncomplete({ id: "h1" }, []);
  assert.equal(result, false);
});

test("isLinkedGoalIncomplete: habit linked to fully-filled goal returns false", () => {
  const goals = [{
    id: "g1", text: "Run a half-marathon",
    smart: {
      specific: "21k",
      measurable: "21",
      achievable: "weekly +10%",
      relevant: "cardio",
      timebound: "2026-10-15"
    }
  }];
  const habit = { id: "h1", goalId: "g1" };
  assert.equal(isLinkedGoalIncomplete(habit, goals), false);
});

test("isLinkedGoalIncomplete: habit linked to goal missing one SMART field returns true", () => {
  const goals = [{
    id: "g1", text: "Run",
    smart: {
      specific: "21k",
      measurable: "21",
      achievable: "ok",
      relevant: "cardio",
      timebound: "" // missing T
    }
  }];
  assert.equal(isLinkedGoalIncomplete({ id: "h1", goalId: "g1" }, goals), true);
});

test("isLinkedGoalIncomplete: multi-goal habit flags if ANY linked goal is incomplete", () => {
  const goals = [
    { id: "g1", text: "Fully filled", smart: { specific: "x", measurable: "x", achievable: "x", relevant: "x", timebound: "x" } },
    { id: "g2", text: "Missing T", smart: { specific: "x", measurable: "x", achievable: "x", relevant: "x", timebound: "" } }
  ];
  const habit = { id: "h1", goalIds: ["g1", "g2"] };
  assert.equal(isLinkedGoalIncomplete(habit, goals), true);
});

test("isLinkedGoalIncomplete: linked goal id that doesn't resolve is ignored (treated as complete)", () => {
  // Defensive: a dangling goalId shouldn't flash a warning on a habit
  // card. The cleanup is supposed to happen in doDelGoal (index.html:7891).
  const goals = [{ id: "g1", text: "Filled", smart: { specific: "x", measurable: "x", achievable: "x", relevant: "x", timebound: "x" } }];
  assert.equal(isLinkedGoalIncomplete({ id: "h1", goalId: "missing-id" }, goals), false);
});

// ─────────────────────────────────────────────────────────────────────
// isGoalCardIncomplete — looser variant (per-goal-card 🚨 glyph).
// True when ANY of: no type, zero SMART touched, or no timebound.
// ─────────────────────────────────────────────────────────────────────

test("isGoalCardIncomplete: goal with no type returns true", () => {
  assert.equal(isGoalCardIncomplete({ text: "x", smart: { specific: "y" } }), true);
});

test("isGoalCardIncomplete: typed goal with zero SMART returns true", () => {
  assert.equal(isGoalCardIncomplete({ text: "x", type: "Physical", smart: {} }), true);
});

test("isGoalCardIncomplete: typed goal with SMART but no timebound returns true", () => {
  assert.equal(isGoalCardIncomplete({
    text: "x", type: "Physical",
    smart: { specific: "y" }
  }), true);
});

test("isGoalCardIncomplete: typed goal with at least one SMART field + timebound returns false", () => {
  assert.equal(isGoalCardIncomplete({
    text: "x", type: "Physical",
    smart: { specific: "y", timebound: "2026-10-15" }
  }), false);
});

// ─────────────────────────────────────────────────────────────────────
// habitGoalIds / habitLinkedToGoal — back-compat between legacy
// `goalId: number` and the multi-link `goalIds: number[]` shape.
// ─────────────────────────────────────────────────────────────────────

test("habitGoalIds: legacy single goalId is returned as a 1-element array", () => {
  assert.deepEqual(habitGoalIds({ goalId: 42 }), [42]);
});

test("habitGoalIds: new goalIds array is returned as-is, with nulls filtered", () => {
  assert.deepEqual(habitGoalIds({ goalIds: [1, null, 2, undefined, 3] }), [1, 2, 3]);
});

test("habitLinkedToGoal: matches with string / number coercion", () => {
  // Goals carry numeric ids but `String(gid) === String(goalId)` lets
  // the same check pass for either shape — important because Firestore
  // round-trips can collapse numeric ids to strings.
  assert.equal(habitLinkedToGoal({ goalId: 7 }, "7"), true);
  assert.equal(habitLinkedToGoal({ goalIds: ["7"] }, 7), true);
  assert.equal(habitLinkedToGoal({ goalId: 7 }, 9), false);
});

// ─────────────────────────────────────────────────────────────────────
// bySectionGroup — by-Area-of-Life grouping with linked habits +
// linked todos enrichment + future-bucket filter (parked habits don't
// make a goal "active").
// ─────────────────────────────────────────────────────────────────────

test("bySectionGroup: empty data returns empty groups", () => {
  const result = bySectionGroup({});
  assert.deepEqual(result.groups, []);
  assert.deepEqual(result.untyped, []);
  assert.deepEqual(result.future, []);
});

test("bySectionGroup: active goals bucketed by type; untyped go to .untyped", () => {
  const data = {
    goals: [
      { id: "g1", type: "Physical", text: "Run" },
      { id: "g2", type: "Mental",   text: "Read" },
      { id: "g3", text: "No type goal" }
    ],
    habits: [
      { id: "h1", goalId: "g1" },
      { id: "h2", goalId: "g2" },
      { id: "h3", goalId: "g3" }
    ]
  };
  const result = bySectionGroup(data);
  const types = result.groups.map(g => g.type).sort();
  assert.deepEqual(types, ["Mental", "Physical"]);
  assert.equal(result.untyped.length, 1);
  assert.equal(result.untyped[0].goal.id, "g3");
  assert.equal(result.future.length, 0);
});

test("bySectionGroup: goals with no active habits land in .future (parked excluded)", () => {
  const data = {
    goals: [
      { id: "g1", type: "Physical", text: "Active" },
      { id: "g2", type: "Physical", text: "Parked only" },
      { id: "g3", type: "Physical", text: "Nothing linked" }
    ],
    habits: [
      { id: "h1", goalId: "g1" },                 // active link
      { id: "h2", goalId: "g2", parked: true }    // parked link
      // g3 has no linked habit at all
    ]
  };
  const result = bySectionGroup(data);
  const futureIds = result.future.map(g => g.id).sort();
  assert.deepEqual(futureIds, ["g2", "g3"]);
  // g1 is active → in a group
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].goals[0].goal.id, "g1");
});

test("bySectionGroup: parked habits are excluded from each goal's linkedHabits list", () => {
  // §6 Future Habits — parked habits should NOT inflate a goal's
  // linkedHabits count (it would corrupt momentum + the donut).
  const data = {
    goals: [{ id: "g1", type: "Physical", text: "Run" }],
    habits: [
      { id: "h1", goalId: "g1" },
      { id: "h2", goalId: "g1", parked: true }
    ]
  };
  const result = bySectionGroup(data);
  assert.equal(result.groups[0].goals[0].linkedHabits.length, 1);
  assert.equal(result.groups[0].goals[0].linkedHabits[0].id, "h1");
});

test("bySectionGroup: includeParkedHabits opt restores parked links", () => {
  const data = {
    goals: [{ id: "g1", type: "Physical", text: "Run" }],
    habits: [
      { id: "h1", goalId: "g1" },
      { id: "h2", goalId: "g1", parked: true }
    ]
  };
  const result = bySectionGroup(data, { includeParkedHabits: true });
  assert.equal(result.groups[0].goals[0].linkedHabits.length, 2);
});

test("bySectionGroup: linkedTodos enriches each active goal entry", () => {
  const data = {
    goals: [{ id: "g1", type: "Physical", text: "Run" }],
    habits: [{ id: "h1", goalId: "g1" }],
    todos: [
      { id: "t1", goalId: "g1", text: "Buy shoes" },
      { id: "t2", goalId: "g1", text: "Plan route" },
      { id: "t3", goalId: "other-goal", text: "Unrelated" }
    ]
  };
  const result = bySectionGroup(data);
  assert.equal(result.groups[0].goals[0].linkedTodos.length, 2);
});

// ─────────────────────────────────────────────────────────────────────
// linkedHabitsFor / linkedTodosFor — convenience helpers used directly
// by the view.
// ─────────────────────────────────────────────────────────────────────

test("linkedHabitsFor: respects parked filter by default; can be opted in", () => {
  const data = {
    habits: [
      { id: "h1", goalId: "g1" },
      { id: "h2", goalId: "g1", parked: true },
      { id: "h3", goalId: "other" }
    ]
  };
  assert.equal(linkedHabitsFor(data, "g1").length, 1);
  assert.equal(linkedHabitsFor(data, "g1", { includeParkedHabits: true }).length, 2);
});

test("linkedTodosFor: returns only todos with matching goalId (string coercion)", () => {
  const data = {
    todos: [
      { id: "t1", goalId: 1, text: "a" },
      { id: "t2", goalId: "1", text: "b" },
      { id: "t3", goalId: 2, text: "c" }
    ]
  };
  assert.equal(linkedTodosFor(data, "1").length, 2);
  assert.equal(linkedTodosFor(data, 2).length, 1);
});

// ─────────────────────────────────────────────────────────────────────
// Immutability — inputs must not be mutated.
// ─────────────────────────────────────────────────────────────────────

test("bySectionGroup: does not mutate the input data", () => {
  const data = {
    goals: [{ id: "g1", type: "Physical", text: "x" }],
    habits: [{ id: "h1", goalId: "g1" }],
    todos: []
  };
  const snap = JSON.parse(JSON.stringify(data));
  bySectionGroup(data);
  assert.deepEqual(data, snap);
});
