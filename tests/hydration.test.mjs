// Pinned-behavior tests for hydrateCloudDoc. Originally inlined at
// index.html:3118-3359; extracted to lib/hydration.js as Phase 2 OSS-port
// Port #3 (superstruct). These tests lock in the EXISTING behavior so the
// extraction + superstruct rewrite can't silently regress any defaulting,
// type-guard, or legacy migration branch.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { hydrateCloudDoc } = require("../lib/hydration.js");

// ─────────────────────────────────────────────────────────────────────────
// Top-level defaults
// ─────────────────────────────────────────────────────────────────────────

test("empty input gets every top-level default", () => {
  const out = hydrateCloudDoc({});
  // Arrays
  assert.ok(Array.isArray(out.habits), "habits is array");
  assert.ok(Array.isArray(out.goals), "goals is array");
  assert.ok(Array.isArray(out.journal), "journal is array");
  assert.ok(Array.isArray(out.archive), "archive is array");
  assert.ok(Array.isArray(out.quotes), "quotes is array");
  assert.ok(Array.isArray(out.todos), "todos is array");
  assert.ok(Array.isArray(out.customGoalTypes), "customGoalTypes is array");
  assert.ok(Array.isArray(out.customImportance), "customImportance is array");
  assert.ok(Array.isArray(out.customSections), "customSections is array");
  assert.ok(Array.isArray(out.dayVisits), "dayVisits is array");
  assert.ok(Array.isArray(out.upcomingDates), "upcomingDates is array");
  assert.ok(Array.isArray(out.travelDays), "travelDays is array");
  // Objects
  assert.equal(typeof out.bestStreaks, "object");
  assert.ok(!Array.isArray(out.bestStreaks));
  assert.equal(typeof out.achievementsUnlocked, "object");
  assert.ok(!Array.isArray(out.achievementsUnlocked));
  assert.equal(typeof out.dailyRitual, "object");
  assert.equal(typeof out.featureAccess, "object");
  assert.ok(!Array.isArray(out.featureAccess));
  assert.equal(typeof out.sortPrefs, "object");
  assert.equal(typeof out.reviewPrompt, "object");
  assert.ok(Array.isArray(out.reviewPrompt.dismissedDays));
  // Scalars
  assert.equal(out.xp, 0);
  assert.equal(out.homeLocation, "");
  assert.equal(out.aiConsentAt, 0);
  assert.equal(out.aiTone, "neutral");
  assert.equal(typeof out.signupAt, "number");
  assert.equal(out.homeCoords, null);
  assert.equal(out.locationOptIn, false);
  assert.equal(out.notifyOptIn, false);
  // Booleans seeded from emptiness
  assert.equal(out.welcomeModalSeen, false, "no habits + no tour --> not yet seen");
  assert.equal(out.journalDisclaimerAcked, false);
  assert.equal(out.onboardingComplete, false);
  assert.equal(out.tourDone, true);
  assert.equal(out.celebratedFirstGoal, false);
  assert.equal(out.celebratedFirstHabit, false);
});

test("empty habits-array is preserved (deliberate delete must not be re-seeded)", () => {
  // Regression guard: previous code re-seeded any [] back to SEED_HABITS.
  const out = hydrateCloudDoc({ habits: [], goals: [] });
  assert.deepEqual(out.habits, []);
  assert.deepEqual(out.goals, []);
});

test("bestStreaks supplied as an array is replaced with {} (strict object guard)", () => {
  const out = hydrateCloudDoc({ bestStreaks: [] });
  assert.equal(typeof out.bestStreaks, "object");
  assert.ok(!Array.isArray(out.bestStreaks));
  assert.deepEqual(out.bestStreaks, {});
});

test("featureAccess supplied as an array is replaced with {} (strict object guard)", () => {
  const out = hydrateCloudDoc({ featureAccess: [] });
  assert.equal(typeof out.featureAccess, "object");
  assert.ok(!Array.isArray(out.featureAccess));
  assert.deepEqual(out.featureAccess, {});
});

test("achievementsUnlocked supplied as array is replaced with {}", () => {
  const out = hydrateCloudDoc({ achievementsUnlocked: [] });
  assert.equal(typeof out.achievementsUnlocked, "object");
  assert.ok(!Array.isArray(out.achievementsUnlocked));
});

// ─────────────────────────────────────────────────────────────────────────
// Legacy timestamp normalization (string ISO --> epoch ms)
// ─────────────────────────────────────────────────────────────────────────

test("achievementsUnlocked ISO-string timestamps become epoch ms numbers", () => {
  const iso = "2026-04-01T12:00:00.000Z";
  const expected = new Date(iso).getTime();
  const out = hydrateCloudDoc({ achievementsUnlocked: { ach1: iso } });
  assert.equal(typeof out.achievementsUnlocked.ach1, "number");
  assert.equal(out.achievementsUnlocked.ach1, expected);
});

test("archive entries with ISO archivedAt become epoch ms", () => {
  const iso = "2026-03-01T08:30:00.000Z";
  const expected = new Date(iso).getTime();
  const out = hydrateCloudDoc({
    archive: [{ id: "h1", text: "Old habit", archivedAt: iso }]
  });
  assert.equal(typeof out.archive[0].archivedAt, "number");
  assert.equal(out.archive[0].archivedAt, expected);
});

test("goalArchive entries with ISO archivedAt become epoch ms", () => {
  const iso = "2026-02-15T00:00:00.000Z";
  const expected = new Date(iso).getTime();
  const out = hydrateCloudDoc({
    goalArchive: [{ id: "g1", text: "Old goal", archivedAt: iso }]
  });
  assert.equal(typeof out.goalArchive[0].archivedAt, "number");
  assert.equal(out.goalArchive[0].archivedAt, expected);
});

// ─────────────────────────────────────────────────────────────────────────
// Habit-level backfills
// ─────────────────────────────────────────────────────────────────────────

test("habit without frequency gets daily default", () => {
  const out = hydrateCloudDoc({ habits: [{ id: "h1", text: "Run" }] });
  assert.equal(out.habits[0].frequency.type, "daily");
  assert.deepEqual(out.habits[0].frequency.days, []);
  assert.equal(out.habits[0].frequency.day, null);
});

test("habit without completionTimes/completionUnits gets empty objects", () => {
  const out = hydrateCloudDoc({ habits: [{ id: "h1", text: "Run" }] });
  assert.deepEqual(out.habits[0].completionTimes, {});
  assert.deepEqual(out.habits[0].completionUnits, {});
});

test("habit goalIds is backfilled from legacy goalId scalar", () => {
  const out = hydrateCloudDoc({
    habits: [{ id: "h1", text: "Run", goalId: "g42" }]
  });
  assert.deepEqual(out.habits[0].goalIds, ["g42"]);
  // Preserves legacy scalar so a downgrade wouldn't drop the link.
  assert.equal(out.habits[0].goalId, "g42");
});

test("habit with no goalId gets empty goalIds array", () => {
  const out = hydrateCloudDoc({
    habits: [{ id: "h1", text: "Run" }]
  });
  assert.deepEqual(out.habits[0].goalIds, []);
});

test("habit parked defaults to false", () => {
  const out = hydrateCloudDoc({
    habits: [{ id: "h1", text: "Run" }]
  });
  assert.equal(out.habits[0].parked, false);
});

test("multi-slot habit missing slotCompletionTimes gets {}", () => {
  const out = hydrateCloudDoc({
    habits: [{ id: "h1", text: "X", slotSections: ["morning", "evening"] }]
  });
  assert.deepEqual(out.habits[0].slotCompletionTimes, {});
});

test("falsy entries in habits array are dropped", () => {
  const out = hydrateCloudDoc({
    habits: [null, { id: "h1", text: "Run" }, undefined, false]
  });
  assert.equal(out.habits.length, 1);
  assert.equal(out.habits[0].id, "h1");
});

// ─────────────────────────────────────────────────────────────────────────
// Slot completions migration --- bare-section keys --> "section:0"
// ─────────────────────────────────────────────────────────────────────────

test("legacy slotCompletions keyed by bare section becomes :0-keyed", () => {
  const out = hydrateCloudDoc({
    habits: [{
      id: "h1",
      text: "Routine",
      slotSections: ["morning", "evening"],
      slotCompletions: {
        "2026-05-15": { morning: "done", evening: "done" }
      }
    }]
  });
  assert.deepEqual(
    out.habits[0].slotCompletions["2026-05-15"],
    { "morning:0": "done", "evening:0": "done" }
  );
});

test("canonical 'section:0' keys are preserved when both present (canonical wins)", () => {
  const out = hydrateCloudDoc({
    habits: [{
      id: "h1",
      text: "Routine",
      slotSections: ["morning"],
      slotCompletions: {
        "2026-05-15": { "morning:0": "canonical", morning: "bare-should-not-overwrite" }
      }
    }]
  });
  assert.equal(out.habits[0].slotCompletions["2026-05-15"]["morning:0"], "canonical");
});

test("orphan bare-section keys (section dropped from slotSections) are removed", () => {
  const out = hydrateCloudDoc({
    habits: [{
      id: "h1",
      text: "Routine",
      slotSections: ["morning"], // evening was removed
      slotCompletions: {
        "2026-05-15": { morning: "done", evening: "orphan" }
      }
    }]
  });
  const day = out.habits[0].slotCompletions["2026-05-15"];
  assert.equal(day["morning:0"], "done");
  assert.ok(!("evening" in day), "orphan dropped");
  assert.ok(!("evening:0" in day), "orphan not promoted");
});

test("slotCompletionTimes also undergoes bare-->:0 migration", () => {
  const out = hydrateCloudDoc({
    habits: [{
      id: "h1",
      text: "Routine",
      slotSections: ["morning"],
      slotCompletionTimes: { "2026-05-15": { morning: "07:30" } }
    }]
  });
  assert.equal(out.habits[0].slotCompletionTimes["2026-05-15"]["morning:0"], "07:30");
});

// ─────────────────────────────────────────────────────────────────────────
// _order backfill for goals and todos
// ─────────────────────────────────────────────────────────────────────────

test("goals get _order backfilled from array position", () => {
  const out = hydrateCloudDoc({
    goals: [{ id: "g1", text: "A" }, { id: "g2", text: "B" }, { id: "g3", text: "C" }]
  });
  assert.equal(out.goals[0]._order, 0);
  assert.equal(out.goals[1]._order, 1);
  assert.equal(out.goals[2]._order, 2);
});

test("todos get _order backfilled from array position", () => {
  const out = hydrateCloudDoc({
    todos: [{ id: "t1", text: "A" }, { id: "t2", text: "B" }]
  });
  assert.equal(out.todos[0]._order, 0);
  assert.equal(out.todos[1]._order, 1);
});

test("existing _order on goals is preserved", () => {
  const out = hydrateCloudDoc({
    goals: [{ id: "g1", text: "A", _order: 99 }]
  });
  assert.equal(out.goals[0]._order, 99);
});

// ─────────────────────────────────────────────────────────────────────────
// Sort prefs defaults
// ─────────────────────────────────────────────────────────────────────────

test("missing sortPrefs gets fully-populated default object", () => {
  const out = hydrateCloudDoc({});
  assert.equal(out.sortPrefs.habits, "default");
  assert.equal(out.sortPrefs.goals, "default");
  assert.equal(out.sortPrefs.todos, "default");
});

test("partial sortPrefs has missing fields filled in", () => {
  const out = hydrateCloudDoc({ sortPrefs: { habits: "alpha" } });
  assert.equal(out.sortPrefs.habits, "alpha");
  assert.equal(out.sortPrefs.goals, "default");
  assert.equal(out.sortPrefs.todos, "default");
});

// ─────────────────────────────────────────────────────────────────────────
// Booleans seeded from data emptiness (onboarding semantics)
// ─────────────────────────────────────────────────────────────────────────

test("welcomeModalSeen true when habits exist", () => {
  const out = hydrateCloudDoc({ habits: [{ id: "h1", text: "Run" }] });
  assert.equal(out.welcomeModalSeen, true);
});

test("welcomeModalSeen true when tourDone is true", () => {
  const out = hydrateCloudDoc({ tourDone: true });
  assert.equal(out.welcomeModalSeen, true);
});

test("onboardingComplete true when goals exist", () => {
  const out = hydrateCloudDoc({ goals: [{ id: "g1", text: "Ship" }] });
  assert.equal(out.onboardingComplete, true);
});

test("celebratedFirstHabit true when habits exist", () => {
  const out = hydrateCloudDoc({ habits: [{ id: "h1", text: "Run" }] });
  assert.equal(out.celebratedFirstHabit, true);
});

test("celebratedFirstGoal true when goals exist", () => {
  const out = hydrateCloudDoc({ goals: [{ id: "g1", text: "Ship" }] });
  assert.equal(out.celebratedFirstGoal, true);
});

test("journalDisclaimerAcked true when journal entries exist", () => {
  const out = hydrateCloudDoc({ journal: [{ id: "j1", text: "Day 1" }] });
  assert.equal(out.journalDisclaimerAcked, true);
});

// ─────────────────────────────────────────────────────────────────────────
// travelDays normalization
// ─────────────────────────────────────────────────────────────────────────

test("travelDays as bare-string array becomes {date,location,tripId} objects", () => {
  const out = hydrateCloudDoc({ travelDays: ["2026-05-15", "2026-05-16"] });
  assert.equal(out.travelDays[0].date, "2026-05-15");
  assert.equal(out.travelDays[0].location, "");
  assert.equal(out.travelDays[0].tripId, "t-2026-05-15");
  assert.equal(out.travelDays[1].tripId, "t-2026-05-16");
});

test("travelDays without tripId gets one synthesized from date", () => {
  const out = hydrateCloudDoc({
    travelDays: [{ date: "2026-05-15", location: "NYC" }]
  });
  assert.equal(out.travelDays[0].tripId, "t-2026-05-15");
  assert.equal(out.travelDays[0].location, "NYC");
});

test("travelDays entries without a date are dropped", () => {
  const out = hydrateCloudDoc({
    travelDays: [{ date: "2026-05-15" }, { location: "no date" }, null]
  });
  assert.equal(out.travelDays.length, 1);
  assert.equal(out.travelDays[0].date, "2026-05-15");
});

// ─────────────────────────────────────────────────────────────────────────
// "Already current" round-trip --- semantically identical
// ─────────────────────────────────────────────────────────────────────────

test("habit with current shape preserves all its fields", () => {
  const input = {
    habits: [{
      id: "h1",
      text: "Run",
      frequency: { type: "daily", days: [], day: null },
      completions: { "2026-05-15": "done" },
      completionTimes: { "2026-05-15": "07:30" },
      completionUnits: {},
      goalIds: [],
      parked: false,
      slotCompletionTimes: {}
    }]
  };
  const out = hydrateCloudDoc(input);
  const h = out.habits[0];
  assert.equal(h.id, "h1");
  assert.equal(h.text, "Run");
  assert.equal(h.frequency.type, "daily");
  assert.deepEqual(h.completions, { "2026-05-15": "done" });
  assert.deepEqual(h.completionTimes, { "2026-05-15": "07:30" });
  assert.equal(h.parked, false);
  assert.deepEqual(h.goalIds, []);
});

test("reviewPrompt with valid shape is preserved", () => {
  const out = hydrateCloudDoc({
    reviewPrompt: { dismissedDays: [7, 14] }
  });
  assert.deepEqual(out.reviewPrompt.dismissedDays, [7, 14]);
});

test("reviewPrompt with non-array dismissedDays gets repaired to []", () => {
  const out = hydrateCloudDoc({
    reviewPrompt: { dismissedDays: "broken" }
  });
  assert.deepEqual(out.reviewPrompt.dismissedDays, []);
});
