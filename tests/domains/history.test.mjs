// Pinned-behavior tests for lib/domains/history.js — Profile sheet
// History-panel timeline aggregator. These pin the event shapes the
// view consumes (id format, kind discriminator, ts ordering, archive
// flag propagation) so a refactor of the aggregator can't silently
// drop a field.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { historyDomain } = require("../../lib/domains/history.js");

// ─────────────────────────────────────────────────────────────────────
// Stable timestamps so the desc-sort assertions are predictable.
const T = {
  oldest: 1_700_000_000_000,
  mid:    1_710_000_000_000,
  newer:  1_720_000_000_000,
  newest: 1_730_000_000_000
};
// ─────────────────────────────────────────────────────────────────────

test("flatHistoryEvents returns [] for empty / null / undefined data", () => {
  assert.deepEqual(historyDomain.flatHistoryEvents(null), []);
  assert.deepEqual(historyDomain.flatHistoryEvents(undefined), []);
  assert.deepEqual(historyDomain.flatHistoryEvents({}), []);
  assert.deepEqual(historyDomain.flatHistoryEvents({ goals: [], habits: [], goalArchive: [] }), []);
});

test("flatHistoryEvents emits a goal-completed event for each archived goal with a finite ts", () => {
  const data = {
    goalArchive: [
      { id: 1, text: "Run a 10k", type: "Fitness", archivedAt: new Date(T.mid).toISOString() }
    ],
    goals: [],
    habits: []
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0], {
    ts: T.mid,
    kind: "goal-completed",
    name: "Run a 10k",
    type: "Fitness",
    nextGoal: null,
    id: "gc-1"
  });
});

test("flatHistoryEvents wires nextGoal when a later goal carries parentGoalId of the archived goal", () => {
  const data = {
    goalArchive: [
      { id: 1, text: "Run a 10k", type: "Fitness", archivedAt: new Date(T.mid).toISOString() }
    ],
    goals: [
      { id: 99, text: "Run a half-marathon", type: "Fitness", parentGoalId: 1 }
    ],
    habits: []
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "goal-completed");
  assert.ok(out[0].nextGoal, "nextGoal should be present");
  assert.equal(out[0].nextGoal.id, 99);
  assert.equal(out[0].nextGoal.text, "Run a half-marathon");
});

test("flatHistoryEvents drops archived goals lacking a parseable archivedAt", () => {
  const data = {
    goalArchive: [
      { id: 1, text: "No date" /* archivedAt missing */ },
      { id: 2, text: "Bad date", archivedAt: "not-a-date" },
      { id: 3, text: "Zero ts",  archivedAt: 0 },
      { id: 4, text: "Good",     archivedAt: new Date(T.mid).toISOString() }
    ],
    goals: [],
    habits: []
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 1, "only the well-formed archive entry survives");
  assert.equal(out[0].id, "gc-4");
});

test("flatHistoryEvents emits a goal-edited event for each goal-history snapshot", () => {
  const data = {
    goalArchive: [],
    goals: [
      {
        id: 7, text: "Read more", type: "Mind",
        history: [
          { ts: T.oldest, text: "Read" },
          { ts: T.mid,    text: "Read 10 books" }
        ]
      }
    ],
    habits: []
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 2);
  // both must be tagged correctly + carry the goal's CURRENT name/type
  assert.ok(out.every(e => e.kind === "goal-edited"));
  assert.ok(out.every(e => e.name === "Read more" && e.type === "Mind"));
  // id format pinned for the view's React keys
  const ids = out.map(e => e.id).sort();
  assert.deepEqual(ids, ["ge-7-" + T.mid, "ge-7-" + T.oldest].sort());
});

test("flatHistoryEvents emits a habit-edited event for each habit-history snapshot with all fields preserved", () => {
  const data = {
    goalArchive: [],
    goals: [],
    habits: [
      {
        id: 42, text: "Meditate", type: "Mind", archived: false,
        history: [
          { ts: T.mid, text: "10 min meditation", importance: "Non-Negotiable", section: "morning" }
        ]
      }
    ]
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0], {
    ts: T.mid,
    kind: "habit-edited",
    name: "Meditate",
    type: "Mind",
    prevText: "10 min meditation",
    prevImp: "Non-Negotiable",
    prevSec: "morning",
    habitId: 42,
    archived: false,
    id: "he-42-" + T.mid
  });
});

test("flatHistoryEvents propagates habit.archived flag into every event for that habit", () => {
  const data = {
    goalArchive: [],
    goals: [],
    habits: [
      { id: 1, text: "Old form", type: "Fitness", archived: true,
        history: [{ ts: T.oldest, text: "Older form" }] }
    ]
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 1);
  assert.equal(out[0].archived, true);
});

test("flatHistoryEvents skips snapshots whose ts isn't of type 'number'", () => {
  // Matches the inline implementation's typeof-only filter — string/null/
  // missing ts are dropped; NaN slips through because typeof NaN === "number".
  // That's a known latent edge case, not in scope for this refactor.
  const data = {
    goalArchive: [],
    goals: [{ id: 1, text: "G", history: [
      { ts: T.mid, text: "kept" },
      { ts: "abc", text: "dropped — string ts" },
      { /* ts missing */ text: "dropped — missing ts" },
      { ts: null,  text: "dropped — null ts" }
    ]}],
    habits: [{ id: 2, text: "H", history: [
      { ts: T.newer, text: "kept" }
    ]}]
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map(e => e.ts).sort(), [T.mid, T.newer].sort());
});

test("flatHistoryEvents returns the full timeline sorted descending by ts", () => {
  const data = {
    goalArchive: [
      { id: 1, text: "GArch", archivedAt: new Date(T.oldest).toISOString() }
    ],
    goals: [
      { id: 2, text: "G", history: [{ ts: T.newest, text: "g-snap-newest" }] }
    ],
    habits: [
      { id: 3, text: "H", history: [
        { ts: T.mid,   text: "h-snap-mid" },
        { ts: T.newer, text: "h-snap-newer" }
      ]}
    ]
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 4);
  assert.deepEqual(out.map(e => e.ts), [T.newest, T.newer, T.mid, T.oldest]);
});

test("flatHistoryEvents tolerates null/undefined entries inside the collections without throwing", () => {
  const data = {
    goalArchive: [null, undefined,
      { id: 1, text: "G", archivedAt: new Date(T.mid).toISOString() }
    ],
    goals: [null,
      { id: 2, text: "G", history: [null, { ts: T.newer, text: "ok" }] }
    ],
    habits: [undefined,
      { id: 3, text: "H", history: [{ ts: T.oldest, text: "ok" }, null] }
    ]
  };
  const out = historyDomain.flatHistoryEvents(data);
  assert.equal(out.length, 3);
});
