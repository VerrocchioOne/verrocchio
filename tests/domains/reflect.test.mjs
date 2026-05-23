// Tests for lib/domains/reflect.js — Reflect tab READ derivations.
// Mirrors tests/merge.test.mjs bootstrap (createRequire) + AAA shape.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { reflectDomain } = require("../../lib/domains/reflect.js");

// ─────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────

const SUNDAY = "2026-05-17"; // week start (Sunday) — anchor for "week" filter
const MONDAY = "2026-05-18";
const PREV_SAT = "2026-05-16"; // outside the SUNDAY-anchored week

// timestamps are local-time ISO strings so the week-filter math (which
// parses entry.timestamp as a Date and compares to a Sunday-anchored
// [start, end) window built from the anchor day) lands in the expected
// bucket.
const tsAt = (dateKey, hh = 12) => new Date(`${dateKey}T${String(hh).padStart(2, "0")}:00:00`).toISOString();

const makeEntry = (id, dateKey, extras = {}) => ({
  id,
  text: extras.text || "entry " + id,
  mood: extras.mood || "",
  tag: extras.tag || "reflection",
  goalId: extras.goalId || null,
  timestamp: extras.timestamp || tsAt(dateKey),
  dateKey,
});

const sampleData = () => ({
  goals: [],
  journal: [
    makeEntry(1, MONDAY,   { tag: "daily-recap" }),
    makeEntry(2, MONDAY,   { tag: "reflection" }),
    makeEntry(3, SUNDAY,   { tag: "goals", goalId: "g1" }),
    makeEntry(4, PREV_SAT, { tag: "wins", timestamp: tsAt(PREV_SAT, 9) }),
    makeEntry(5, "2026-04-01", { tag: "learning" }), // far past
  ],
});

// ─────────────────────────────────────────────────────────────────────────
// pastEntriesCount
// ─────────────────────────────────────────────────────────────────────────

test("pastEntriesCount returns 0 for missing journal", () => {
  assert.equal(reflectDomain.pastEntriesCount({}), 0);
  assert.equal(reflectDomain.pastEntriesCount({ journal: null }), 0);
  assert.equal(reflectDomain.pastEntriesCount(null), 0);
});

test("pastEntriesCount returns total entry count", () => {
  const data = sampleData();
  assert.equal(reflectDomain.pastEntriesCount(data), 5);
});

test("pastEntriesCount drops falsy entries defensively", () => {
  const data = { journal: [makeEntry(1, MONDAY), null, undefined, makeEntry(2, MONDAY)] };
  assert.equal(reflectDomain.pastEntriesCount(data), 2);
});

// ─────────────────────────────────────────────────────────────────────────
// entriesByDay
// ─────────────────────────────────────────────────────────────────────────

test("entriesByDay groups entries by dateKey", () => {
  const data = sampleData();
  const grouped = reflectDomain.entriesByDay(data);
  assert.equal(grouped[MONDAY].length, 2);
  assert.equal(grouped[SUNDAY].length, 1);
  assert.equal(grouped[PREV_SAT].length, 1);
  assert.equal(grouped["2026-04-01"].length, 1);
});

test("entriesByDay does not mutate input", () => {
  const data = sampleData();
  const snapshot = JSON.parse(JSON.stringify(data));
  reflectDomain.entriesByDay(data);
  assert.deepEqual(data, snapshot);
});

test("entriesByDay buckets missing dateKey under empty-string key", () => {
  const data = { journal: [makeEntry(1, MONDAY), { id: 2, text: "orphan", timestamp: tsAt(MONDAY) }] };
  const grouped = reflectDomain.entriesByDay(data);
  assert.equal(grouped[MONDAY].length, 1);
  assert.equal(grouped[""].length, 1);
});

// ─────────────────────────────────────────────────────────────────────────
// entriesForFilter
// ─────────────────────────────────────────────────────────────────────────

test("entriesForFilter 'all' returns every entry untouched", () => {
  const data = sampleData();
  const out = reflectDomain.entriesForFilter(data, "all", MONDAY);
  assert.equal(out.length, 5);
});

test("entriesForFilter 'today' filters to entries with matching dateKey", () => {
  const data = sampleData();
  const out = reflectDomain.entriesForFilter(data, "today", MONDAY);
  assert.equal(out.length, 2);
  assert.ok(out.every(e => e.dateKey === MONDAY));
});

test("entriesForFilter 'week' includes the Sunday-anchored week of selDate", () => {
  // Anchor on MONDAY (2026-05-18). The week containing this Monday
  // starts on Sunday 2026-05-17. PREV_SAT (2026-05-16) is OUTSIDE
  // that window; SUNDAY and MONDAY are inside.
  const data = sampleData();
  const out = reflectDomain.entriesForFilter(data, "week", MONDAY);
  const ids = out.map(e => e.id).sort();
  assert.deepEqual(ids, [1, 2, 3], "entries on Sunday and Monday only");
});

test("entriesForFilter 'week' excludes timestamps outside the window", () => {
  const data = { journal: [
    makeEntry(1, MONDAY,   { timestamp: tsAt(MONDAY, 12) }),
    makeEntry(2, PREV_SAT, { timestamp: tsAt(PREV_SAT, 12) }), // Saturday before
    makeEntry(3, "2026-05-24", { timestamp: tsAt("2026-05-24", 12) }), // next week's Sunday
  ]};
  const out = reflectDomain.entriesForFilter(data, "week", MONDAY);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 1);
});

test("entriesForFilter handles missing journal safely", () => {
  assert.deepEqual(reflectDomain.entriesForFilter({}, "all", MONDAY), []);
  assert.deepEqual(reflectDomain.entriesForFilter({}, "today", MONDAY), []);
  assert.deepEqual(reflectDomain.entriesForFilter({}, "week", MONDAY), []);
});

test("entriesForFilter does not mutate input", () => {
  const data = sampleData();
  const snapshot = JSON.parse(JSON.stringify(data));
  reflectDomain.entriesForFilter(data, "today", MONDAY);
  reflectDomain.entriesForFilter(data, "week", MONDAY);
  reflectDomain.entriesForFilter(data, "all", MONDAY);
  assert.deepEqual(data, snapshot);
});
