// Pinned-behavior tests for lib/domains/quotes.js — Inspiration panel
// merge + deterministic "quote of the day" pick. Pinning the merge
// order + the hash so daily picks don't shift after the extraction.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { quotesDomain } = require("../../lib/domains/quotes.js");

// ─────────────────────────────────────────────────────────────────────
// mergeQuotes
// ─────────────────────────────────────────────────────────────────────

test("mergeQuotes returns custom-only (untouched) when includesPresets is false", () => {
  const custom = [{ id: 1, text: "A", custom: true }, { id: 2, text: "B", custom: true }];
  const presets = [{ text: "P0" }, { text: "P1" }];
  const out = quotesDomain.mergeQuotes(custom, presets, false);
  assert.equal(out.length, 2);
  assert.equal(out[0].id, 1, "custom entries pass through with their original ids");
  assert.equal(out[1].id, 2);
  assert.ok(out.every(q => !q.preset), "no preset:true tags on custom-only output");
});

test("mergeQuotes pre-pends presets with stable 'pqN' ids when includesPresets is true", () => {
  const custom = [{ id: 1, text: "C0", custom: true }];
  const presets = [{ text: "P0", author: "A0" }, { text: "P1", author: "A1" }];
  const out = quotesDomain.mergeQuotes(custom, presets, true);
  assert.equal(out.length, 3);
  assert.equal(out[0].id, "pq0");
  assert.equal(out[1].id, "pq1");
  assert.equal(out[2].id, 1);
  assert.equal(out[0].text, "P0");
  assert.equal(out[0].author, "A0");
  assert.equal(out[0].preset, true);
  assert.equal(out[0].dateKey, null);
});

test("mergeQuotes handles missing / non-array presets gracefully when includesPresets is true", () => {
  const custom = [{ id: 1, text: "C", custom: true }];
  assert.deepEqual(quotesDomain.mergeQuotes(custom, null,      true), custom);
  assert.deepEqual(quotesDomain.mergeQuotes(custom, undefined, true), custom);
  assert.deepEqual(quotesDomain.mergeQuotes(custom, "nope",    true), custom);
});

test("mergeQuotes handles null/undefined custom list", () => {
  assert.deepEqual(quotesDomain.mergeQuotes(null,      [], false), []);
  assert.deepEqual(quotesDomain.mergeQuotes(undefined, [], false), []);
  assert.equal(quotesDomain.mergeQuotes(null, [{ text: "P" }], true)[0].id, "pq0");
});

// ─────────────────────────────────────────────────────────────────────
// quoteForDate — deterministic hash-by-date pick
// ─────────────────────────────────────────────────────────────────────

test("quoteForDate returns null on empty / null / undefined quote list", () => {
  assert.equal(quotesDomain.quoteForDate([], "2026-05-25"), null);
  assert.equal(quotesDomain.quoteForDate(null, "2026-05-25"), null);
  assert.equal(quotesDomain.quoteForDate(undefined, "2026-05-25"), null);
});

test("quoteForDate returns the same quote for the same date key (deterministic)", () => {
  const quotes = Array.from({ length: 10 }, (_, i) => ({ id: i, text: `Q${i}` }));
  const a = quotesDomain.quoteForDate(quotes, "2026-05-25");
  const b = quotesDomain.quoteForDate(quotes, "2026-05-25");
  assert.equal(a.id, b.id);
});

test("quoteForDate matches the inline byte-for-byte index formula (2026-05-26 -> idx 7 of 10)", () => {
  //   acc = 0;
  //   acc = 0*31 + 2026 = 2026
  //   acc = 2026*31 + 5 = 62811
  //   acc = 62811*31 + 26 = 1947167
  //   1947167 % 10 = 7
  const quotes = Array.from({ length: 10 }, (_, i) => ({ id: i, text: `Q${i}` }));
  const out = quotesDomain.quoteForDate(quotes, "2026-05-26");
  assert.equal(out.id, 7);
});

test("quoteForDate produces different indices for adjacent dates (when list is big enough)", () => {
  const quotes = Array.from({ length: 50 }, (_, i) => ({ id: i, text: `Q${i}` }));
  const dayA = quotesDomain.quoteForDate(quotes, "2026-05-25");
  const dayB = quotesDomain.quoteForDate(quotes, "2026-05-26");
  assert.notEqual(dayA.id, dayB.id, "consecutive dates should hash to different indices for a 50-quote list");
});

test("quoteForDate handles a single-quote list (every date returns it)", () => {
  const only = [{ id: 99, text: "Only" }];
  assert.equal(quotesDomain.quoteForDate(only, "2026-05-25").id, 99);
  assert.equal(quotesDomain.quoteForDate(only, "1999-01-01").id, 99);
});

test("quoteForDate tolerates a malformed date key (treats non-numeric parts as 0)", () => {
  // Whatever the malformed key hashes to, the picker must NOT throw and
  // must return SOME quote — UI fallback rather than a crash.
  const quotes = Array.from({ length: 5 }, (_, i) => ({ id: i }));
  const out = quotesDomain.quoteForDate(quotes, "not-a-date");
  assert.ok(out, "malformed key still returns a quote (no crash)");
  assert.ok(out.id >= 0 && out.id < 5, "returned id stays in range");
});
