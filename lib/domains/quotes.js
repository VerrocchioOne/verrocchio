// lib/domains/quotes.js — pure quote-list helpers.
//
// Two exports:
//   - mergeQuotes(customQuotes, presets, includesPresets)
//       Returns the merged list the Inspiration panel renders. When
//       includesPresets is true, presets land FIRST (pre-pended with
//       stable "pq0", "pq1", ... ids) so they appear at the top of
//       the list above any custom entries. When false, custom-only
//       is returned untouched (no preset ids leak into the output).
//   - quoteForDate(quotes, dateKey)
//       Deterministic "quote of the day" pick: hashes the date key
//       to an index in [0, quotes.length). Same date -> same quote;
//       different date -> different quote (modulo length).
//
// Lifted out of App()'s allQuotes useMemo + todayQ helper so the
// merge-and-pick logic is unit-tested rather than relying on a brief-
// tab E2E to catch regressions.

(function () {
"use strict";

// mergeQuotes(custom, presets, includesPresets) -> Quote[]
// - presets get { id: "pq" + i, preset: true, dateKey: null } stamped
//   onto a shallow copy of each entry. The "pq" id prefix is the
//   stable key the React list keys off of; do not change.
const mergeQuotes = (customQuotes, presets, includesPresets) => {
  const custom = customQuotes || [];
  if (!includesPresets) return custom;
  const presetsArr = Array.isArray(presets) ? presets : [];
  const presetWithIds = presetsArr.map((q, i) => ({
    ...q,
    id: "pq" + i,
    preset: true,
    dateKey: null
  }));
  return [...presetWithIds, ...custom];
};

// quoteForDate(quotes, dateKey) -> Quote | null
// Picks a quote deterministically given a "YYYY-MM-DD" date key by
// hashing the key as `y*31^2 + m*31 + d` (left-fold) and taking the
// result modulo quotes.length. Returns null when quotes is empty.
// The hash itself is trivially weak but the only requirement is
// "same date -> same quote"; any reproducible function of the date
// key satisfies that. Preserved byte-for-byte from the inline body
// so already-shipped daily picks don't shift after this extraction.
const quoteForDate = (quotes, dateKey) => {
  if (!quotes || !quotes.length) return null;
  const key = String(dateKey || "");
  const parts = key.split("-");
  let acc = 0;
  for (const p of parts) {
    const n = parseInt(p, 10);
    acc = acc * 31 + (Number.isFinite(n) ? n : 0);
  }
  const idx = Math.abs(acc) % quotes.length;
  return quotes[idx];
};

const quotesDomain = { mergeQuotes, quoteForDate };

if (typeof module !== "undefined" && module.exports) {
  module.exports = { quotesDomain };
} else if (typeof window !== "undefined") {
  window.quotesDomain = quotesDomain;
}

})();
