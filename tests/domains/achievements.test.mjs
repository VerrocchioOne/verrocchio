// Pinned-behavior tests for lib/domains/achievements.js — the stat
// snapshot the ACHIEVEMENTS tier list compares against. Pinning the
// shape and the threshold-as-count semantics protects the unlock
// pipeline (achievementsUnlocked write effect at index.html ~L5230)
// from silent regressions.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { achievementsDomain } = require("../../lib/domains/achievements.js");

// Synthetic getStreak: returns habit._streak so tests can hand-pick
// per-habit streak values without building real completion histories.
const fakeStreak = h => (h && typeof h._streak === "number") ? h._streak : 0;

// Helper: a fully SMART-complete goal.
const SMART_OK = {
  specific: "Run 5k three times a week",
  measurable: "5",
  measurableUnit: "km",
  achievable: "Yes; current base = 3k",
  relevant: "Aligns with marathon prep",
  timebound: "2026-08-01"
};

// Default opts everywhere uses fakeStreak so the dual-loaded getStreak
// can't flap test outcomes if utils.js isn't present in the runner env.
const OPTS = { getStreak: fakeStreak };

// ─────────────────────────────────────────────────────────────────────
// shape + happy path
// ─────────────────────────────────────────────────────────────────────

test("computeAchievementStats returns a fully-populated record on empty data", () => {
  const out = achievementsDomain.computeAchievementStats({}, OPTS);
  assert.deepEqual(out, {
    visits: 0,
    bestStreak: 0,
    goals: 0,
    habitsActive: 0,
    xp: 0,
    smartGoals: 0,
    goalsCreated: 0,
    activeGoalsCleared: 0,
    habitPerGoal: 0,
    featuresExplored: 0
  });
});

test("computeAchievementStats tolerates null/undefined data", () => {
  const expected = {
    visits: 0, bestStreak: 0, goals: 0, habitsActive: 0, xp: 0,
    smartGoals: 0, goalsCreated: 0, activeGoalsCleared: 0,
    habitPerGoal: 0, featuresExplored: 0
  };
  assert.deepEqual(achievementsDomain.computeAchievementStats(null, OPTS), expected);
  assert.deepEqual(achievementsDomain.computeAchievementStats(undefined, OPTS), expected);
});

// ─────────────────────────────────────────────────────────────────────
// bestStreak: max(currentPerHabit, cachedBest)
// ─────────────────────────────────────────────────────────────────────

test("bestStreak = max of current per-habit streak across habits and cached bestStreaks", () => {
  // Arrange — current streaks are higher than cache
  const data = {
    habits: [
      { id: 1, _streak: 4 },
      { id: 2, _streak: 11 },
      { id: 3, _streak: 7 }
    ],
    bestStreaks: { 1: 9, 2: 5 }
  };
  // Act
  const out = achievementsDomain.computeAchievementStats(data, OPTS);
  // Assert — 11 wins
  assert.equal(out.bestStreak, 11);
});

test("bestStreak retains the cached best when current is lower (resets don't lose history)", () => {
  // Arrange — current streaks are 0; cache shows a past peak of 30
  const data = {
    habits: [{ id: 1, _streak: 0 }],
    bestStreaks: { 1: 30, 2: 12 }
  };
  // Act
  // Assert — cached 30 wins
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).bestStreak, 30);
});

// ─────────────────────────────────────────────────────────────────────
// habitsActive: only non-parked habits
// ─────────────────────────────────────────────────────────────────────

test("habitsActive counts only non-parked habits", () => {
  const data = {
    habits: [
      { id: 1, parked: false },
      { id: 2, parked: true },
      { id: 3, parked: false },
      { id: 4 } // parked undefined = not parked
    ]
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).habitsActive, 3);
});

// ─────────────────────────────────────────────────────────────────────
// smartGoals: requires every SMART field non-empty (measurable + unit)
// ─────────────────────────────────────────────────────────────────────

test("smartGoals counts goals (live + archived) where every SMART field is filled", () => {
  const data = {
    goals: [
      { id: 1, smart: SMART_OK }, // counts
      { id: 2, smart: { ...SMART_OK, achievable: "" } } // missing A — doesn't count
    ],
    goalArchive: [
      { id: 3, smart: SMART_OK } // counts
    ]
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).smartGoals, 2);
});

test("smartGoals requires BOTH measurable number AND measurableUnit", () => {
  // Arrange — UI splits M into a number + unit; both must be filled
  const data = {
    goals: [
      { id: 1, smart: { ...SMART_OK, measurable: "5", measurableUnit: "" } }, // unit blank — no
      { id: 2, smart: { ...SMART_OK, measurable: "", measurableUnit: "km" } } // number blank — no
    ]
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).smartGoals, 0);
});

// ─────────────────────────────────────────────────────────────────────
// goalsCreated: live + archived combined
// ─────────────────────────────────────────────────────────────────────

test("goalsCreated sums live + archived (so completing goals doesn't lose history)", () => {
  const data = {
    goals: [{ id: 1 }, { id: 2 }],
    goalArchive: [{ id: 3 }, { id: 4 }, { id: 5 }]
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).goalsCreated, 5);
});

// ─────────────────────────────────────────────────────────────────────
// activeGoalsCleared: 1 iff zero live AND ≥1 archived
// ─────────────────────────────────────────────────────────────────────

test("activeGoalsCleared = 1 at the clean-slate moment (zero live, >=1 archived)", () => {
  const data = { goals: [], goalArchive: [{ id: 1 }] };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).activeGoalsCleared, 1);
});

test("activeGoalsCleared = 0 when there are still live goals", () => {
  const data = { goals: [{ id: 1 }], goalArchive: [{ id: 2 }] };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).activeGoalsCleared, 0);
});

test("activeGoalsCleared = 0 on an empty workspace (no archived goals yet)", () => {
  assert.equal(achievementsDomain.computeAchievementStats({ goals: [], goalArchive: [] }, OPTS).activeGoalsCleared, 0);
});

// ─────────────────────────────────────────────────────────────────────
// habitPerGoal: 1 iff >=1 goal AND every live goal has an active habit
// ─────────────────────────────────────────────────────────────────────

test("habitPerGoal = 1 when every live goal has at least one ACTIVE linked habit", () => {
  const data = {
    goals: [{ id: 1 }, { id: 2 }],
    habits: [
      { id: 10, goalId: 1, parked: false },
      { id: 20, goalId: 2, parked: false }
    ]
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).habitPerGoal, 1);
});

test("habitPerGoal = 0 when a goal is linked only to a PARKED habit", () => {
  const data = {
    goals: [{ id: 1 }],
    habits: [{ id: 10, goalId: 1, parked: true }]
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).habitPerGoal, 0);
});

test("habitPerGoal = 0 on an empty workspace (zero goals must not trivially pass)", () => {
  // .every on an empty array returns true; the function gates on
  // goalsArr.length >= 1 explicitly so empty stays locked.
  assert.equal(achievementsDomain.computeAchievementStats({ goals: [], habits: [] }, OPTS).habitPerGoal, 0);
});

test("habitPerGoal stringifies goal ids before matching (so numeric/string mismatch doesn't lock)", () => {
  const data = {
    goals: [{ id: 7 }],
    // habit was authored with a string goalId; goal id is numeric
    habits: [{ id: 10, goalId: "7", parked: false }]
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).habitPerGoal, 1);
});

// ─────────────────────────────────────────────────────────────────────
// featuresExplored: count of touched featureAccess entries
// ─────────────────────────────────────────────────────────────────────

test("featuresExplored counts the keys with truthy timestamps in featureAccess", () => {
  const data = {
    featureAccess: {
      "habit.create": 1700000000000,
      "goal.create":  1710000000000,
      "todo.create":  0,    // explicitly never touched
      "ai.brief":     null  // ditto
    }
  };
  assert.equal(achievementsDomain.computeAchievementStats(data, OPTS).featuresExplored, 2);
});

// ─────────────────────────────────────────────────────────────────────
// isSmartComplete (re-exported helper) — pinned alongside the stats
// ─────────────────────────────────────────────────────────────────────

test("isSmartComplete returns false on missing smart object", () => {
  assert.equal(achievementsDomain.isSmartComplete(null), false);
  assert.equal(achievementsDomain.isSmartComplete({}), false);
  assert.equal(achievementsDomain.isSmartComplete({ smart: null }), false);
});

test("isSmartComplete returns false when any single SMART field is whitespace-only", () => {
  // Whitespace-only must NOT satisfy any field — guard against the
  // user typing a space and walking away.
  const g = { smart: { ...SMART_OK, relevant: "   " } };
  assert.equal(achievementsDomain.isSmartComplete(g), false);
});

test("isSmartComplete returns true on a fully-populated SMART block", () => {
  assert.equal(achievementsDomain.isSmartComplete({ smart: SMART_OK }), true);
});
