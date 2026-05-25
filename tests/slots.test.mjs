// Pinned-behavior tests for lib/slots.js (multi-slot habit helpers, §5.8b).
//
// These pin the slot-ID grammar and per-row materialization the App-scope
// inline copies relied on for v75-v78. Any change to slotIdForIndex /
// parseSlotId output here would break the persistent slotCompletions
// keys stored in Firestore for every existing multi-slot habit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_SLOTS,
  slotIdForIndex,
  parseSlotId,
  slotSectionCounts,
  slotRowsFor
} = require("../lib/slots.js");

// ─────────────────────────────────────────────────────────────────────
// MAX_SLOTS
// ─────────────────────────────────────────────────────────────────────

test("MAX_SLOTS is 12 (matches the stepper UI cap)", () => {
  assert.equal(MAX_SLOTS, 12);
});

// ─────────────────────────────────────────────────────────────────────
// slotIdForIndex
// ─────────────────────────────────────────────────────────────────────

test("slotIdForIndex returns 'section:localIdx' counting prior same-section entries", () => {
  // Arrange
  const slots = ["morning", "morning", "afternoon", "morning"];
  // Act + Assert
  assert.equal(slotIdForIndex(slots, 0), "morning:0",   "first morning is :0");
  assert.equal(slotIdForIndex(slots, 1), "morning:1",   "second morning is :1");
  assert.equal(slotIdForIndex(slots, 2), "afternoon:0", "first afternoon is :0 (independent counter)");
  assert.equal(slotIdForIndex(slots, 3), "morning:2",   "third morning is :2 even after an afternoon row");
});

test("slotIdForIndex returns null on non-array, out-of-range, or null-section input", () => {
  assert.equal(slotIdForIndex(null, 0), null);
  assert.equal(slotIdForIndex(undefined, 0), null);
  assert.equal(slotIdForIndex("morning", 0), null, "string is not an array");
  assert.equal(slotIdForIndex(["morning"], 5), null, "out-of-range arrayIdx");
  assert.equal(slotIdForIndex([null, "morning"], 0), null, "null section returns null");
});

// ─────────────────────────────────────────────────────────────────────
// parseSlotId
// ─────────────────────────────────────────────────────────────────────

test("parseSlotId parses 'section:localIdx' shape", () => {
  assert.deepEqual(parseSlotId("morning:0"),  { section: "morning",  localIdx: 0 });
  assert.deepEqual(parseSlotId("evening:2"),  { section: "evening",  localIdx: 2 });
  assert.deepEqual(parseSlotId("avoid:11"),   { section: "avoid",    localIdx: 11 });
});

test("parseSlotId treats bare-section ids (no colon) as localIdx 0", () => {
  // Some legacy slotCompletions may have been written before colon-suffixed
  // ids existed; the parser stays lenient so the historical data still loads.
  assert.deepEqual(parseSlotId("morning"), { section: "morning", localIdx: 0 });
});

test("parseSlotId falls back to localIdx 0 on non-numeric suffixes", () => {
  assert.deepEqual(parseSlotId("morning:foo"), { section: "morning", localIdx: 0 });
  assert.deepEqual(parseSlotId("morning:"),    { section: "morning", localIdx: 0 });
});

test("parseSlotId returns null on falsy or non-string input", () => {
  assert.equal(parseSlotId(null), null);
  assert.equal(parseSlotId(undefined), null);
  assert.equal(parseSlotId(""), null);
  assert.equal(parseSlotId(42), null);
});

// ─────────────────────────────────────────────────────────────────────
// slotSectionCounts
// ─────────────────────────────────────────────────────────────────────

test("slotSectionCounts tallies section occurrences", () => {
  assert.deepEqual(
    slotSectionCounts(["morning", "morning", "afternoon", "morning", "evening"]),
    { morning: 3, afternoon: 1, evening: 1 }
  );
});

test("slotSectionCounts returns {} for empty / null / undefined input", () => {
  assert.deepEqual(slotSectionCounts([]), {});
  assert.deepEqual(slotSectionCounts(null), {});
  assert.deepEqual(slotSectionCounts(undefined), {});
});

// ─────────────────────────────────────────────────────────────────────
// slotRowsFor
// ─────────────────────────────────────────────────────────────────────

test("slotRowsFor materializes per-row metadata with stable slot IDs", () => {
  // Arrange
  const slots = ["morning", "morning", "afternoon"];
  // Act
  const rows = slotRowsFor(slots);
  // Assert
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], {
    section: "morning", arrayIdx: 0, localIdx: 0, countInSection: 2, slotId: "morning:0"
  });
  assert.deepEqual(rows[1], {
    section: "morning", arrayIdx: 1, localIdx: 1, countInSection: 2, slotId: "morning:1"
  });
  assert.deepEqual(rows[2], {
    section: "afternoon", arrayIdx: 2, localIdx: 0, countInSection: 1, slotId: "afternoon:0"
  });
});

test("slotRowsFor's slotId field matches slotIdForIndex output position-by-position", () => {
  // Cross-check: the renderer derives slotId via slotRowsFor; persistent
  // keys are written via slotIdForIndex. Both must agree.
  const slots = ["morning", "afternoon", "morning", "evening", "afternoon"];
  const rows = slotRowsFor(slots);
  rows.forEach((r, i) => {
    assert.equal(r.slotId, slotIdForIndex(slots, i),
      `row ${i} (${r.section}) slotId mismatch`);
  });
});

test("slotRowsFor returns [] on non-array input", () => {
  assert.deepEqual(slotRowsFor(null), []);
  assert.deepEqual(slotRowsFor(undefined), []);
  assert.deepEqual(slotRowsFor("morning"), []);
});
