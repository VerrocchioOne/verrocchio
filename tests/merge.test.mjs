// Regression tests for mergeRemoteWithLocalToday (lib/merge.js).
// Phase 2 OSS-port Port #12 extraction + §audit-P1 regression guard.
//
// The critical case: slotCompletions[todayK] must be per-key merged, not
// whole-map replaced. Without this, marking morning:0 "done" on one device
// drops evening:0 "done" that was recorded on a second device (cloud).

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { mergeRemoteWithLocalToday } = require("../lib/merge.js");

const TODAY = "2026-05-18";
const PAST  = "2026-05-17";

// ─────────────────────────────────────────────────────────────────────────
// Guard rails — null / bad input
// ─────────────────────────────────────────────────────────────────────────

test("null remote returns null", () => {
  assert.equal(mergeRemoteWithLocalToday(null, {}, TODAY), null);
});

test("null local returns remote unchanged", () => {
  const remote = { habits: [], dayVisits: [] };
  const result = mergeRemoteWithLocalToday(remote, null, TODAY);
  assert.deepEqual(result, remote);
});

test("missing todayK returns remote unchanged", () => {
  const remote = { habits: [], dayVisits: [] };
  const result = mergeRemoteWithLocalToday(remote, {}, "");
  assert.deepEqual(result, remote);
});

// ─────────────────────────────────────────────────────────────────────────
// §audit-P1 — slotCompletions per-key merge (the regression case)
// ─────────────────────────────────────────────────────────────────────────

test("slotCompletions today keys from cloud and local are both preserved", () => {
  // Cloud: evening:0 done (from device B)
  // Local: morning:0 done (from this device A)
  // Expected merged: both keys present
  const remote = {
    habits: [{
      id: "h1",
      slotCompletions: { [TODAY]: { "evening:0": "done" } }
    }],
    dayVisits: [],
    dailyRitual: {}
  };
  const local = {
    habits: [{
      id: "h1",
      slotCompletions: { [TODAY]: { "morning:0": "done" } }
    }],
    dayVisits: [],
    dailyRitual: {}
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  const sc = result.habits[0].slotCompletions[TODAY];
  assert.equal(sc["morning:0"], "done", "local morning:0 preserved");
  assert.equal(sc["evening:0"], "done", "cloud evening:0 preserved");
});

test("slotCompletions: local wins on overlap (same slot key, different values)", () => {
  const remote = {
    habits: [{ id: "h1", slotCompletions: { [TODAY]: { "morning:0": "missed" } } }],
    dayVisits: [], dailyRitual: {}
  };
  const local = {
    habits: [{ id: "h1", slotCompletions: { [TODAY]: { "morning:0": "done" } } }],
    dayVisits: [], dailyRitual: {}
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.equal(result.habits[0].slotCompletions[TODAY]["morning:0"], "done");
});

test("slotCompletions: past-day entries are NOT touched", () => {
  const remote = {
    habits: [{ id: "h1", slotCompletions: { [PAST]: { "morning:0": "done" }, [TODAY]: {} } }],
    dayVisits: [], dailyRitual: {}
  };
  const local = {
    habits: [{ id: "h1", slotCompletions: { [TODAY]: { "morning:0": "done" } } }],
    dayVisits: [], dailyRitual: {}
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  // Past entry comes from cloud, untouched.
  assert.equal(result.habits[0].slotCompletions[PAST]["morning:0"], "done");
});

test("slotCompletions: absent local today key leaves cloud entry intact", () => {
  const remote = {
    habits: [{ id: "h1", slotCompletions: { [TODAY]: { "evening:0": "done" } } }],
    dayVisits: [], dailyRitual: {}
  };
  const local = {
    habits: [{ id: "h1" }], // no slotCompletions on local
    dayVisits: [], dailyRitual: {}
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.equal(result.habits[0].slotCompletions[TODAY]["evening:0"], "done");
});

// ─────────────────────────────────────────────────────────────────────────
// §audit-P1 — slotCompletionTimes per-key merge
// ─────────────────────────────────────────────────────────────────────────

test("slotCompletionTimes today keys from cloud and local are both preserved", () => {
  const remote = {
    habits: [{ id: "h1", slotCompletionTimes: { [TODAY]: { "evening:0": "18:30" } } }],
    dayVisits: [], dailyRitual: {}
  };
  const local = {
    habits: [{ id: "h1", slotCompletionTimes: { [TODAY]: { "morning:0": "07:15" } } }],
    dayVisits: [], dailyRitual: {}
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  const sct = result.habits[0].slotCompletionTimes[TODAY];
  assert.equal(sct["morning:0"], "07:15");
  assert.equal(sct["evening:0"], "18:30");
});

// ─────────────────────────────────────────────────────────────────────────
// Primitive completion fields — local wins on today key
// ─────────────────────────────────────────────────────────────────────────

test("completions[today] local value overwrites cloud", () => {
  const remote = {
    habits: [{ id: "h1", completions: { [TODAY]: "missed" } }],
    dayVisits: [], dailyRitual: {}
  };
  const local = {
    habits: [{ id: "h1", completions: { [TODAY]: "done" } }],
    dayVisits: [], dailyRitual: {}
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.equal(result.habits[0].completions[TODAY], "done");
});

test("completions[past] cloud value is preserved unchanged", () => {
  const remote = {
    habits: [{ id: "h1", completions: { [PAST]: "done", [TODAY]: "done" } }],
    dayVisits: [], dailyRitual: {}
  };
  const local = {
    habits: [{ id: "h1", completions: {} }], // local has nothing for past
    dayVisits: [], dailyRitual: {}
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.equal(result.habits[0].completions[PAST], "done");
});

// ─────────────────────────────────────────────────────────────────────────
// dayVisits union
// ─────────────────────────────────────────────────────────────────────────

test("dayVisits: union of cloud + local, deduped, sorted", () => {
  const remote = { habits: [], dayVisits: ["2026-05-16", "2026-05-17"], dailyRitual: {} };
  const local  = { habits: [], dayVisits: ["2026-05-17", "2026-05-18"], dailyRitual: {} };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.deepEqual(result.dayVisits, ["2026-05-16", "2026-05-17", "2026-05-18"]);
});

// ─────────────────────────────────────────────────────────────────────────
// dailyRitual overlay
// ─────────────────────────────────────────────────────────────────────────

test("dailyRitual[today]: local key wins over cloud on overlap", () => {
  const remote = {
    habits: [], dayVisits: [],
    dailyRitual: { [TODAY]: { tipsReviewed: false, briefingReviewed: true } }
  };
  const local = {
    habits: [], dayVisits: [],
    dailyRitual: { [TODAY]: { tipsReviewed: true } }
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.equal(result.dailyRitual[TODAY].tipsReviewed, true, "local wins");
  assert.equal(result.dailyRitual[TODAY].briefingReviewed, true, "cloud key preserved");
});

test("dailyRitual[past]: cloud past entries untouched", () => {
  const remote = {
    habits: [], dayVisits: [],
    dailyRitual: { [PAST]: { tipsReviewed: true }, [TODAY]: {} }
  };
  const local = {
    habits: [], dayVisits: [],
    dailyRitual: { [TODAY]: {} }
  };
  const result = mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.equal(result.dailyRitual[PAST].tipsReviewed, true);
});

// ─────────────────────────────────────────────────────────────────────────
// Immutability — inputs must not be mutated
// ─────────────────────────────────────────────────────────────────────────

test("does not mutate remote input", () => {
  const remote = {
    habits: [{ id: "h1", completions: { [TODAY]: "missed" } }],
    dayVisits: ["2026-05-17"], dailyRitual: {}
  };
  const remoteCopy = JSON.parse(JSON.stringify(remote));
  const local = {
    habits: [{ id: "h1", completions: { [TODAY]: "done" } }],
    dayVisits: [TODAY], dailyRitual: {}
  };
  mergeRemoteWithLocalToday(remote, local, TODAY);
  assert.deepEqual(remote, remoteCopy, "remote must not be mutated");
});
