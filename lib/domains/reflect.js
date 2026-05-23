// lib/domains/reflect.js — Reflect view's READ derivations.
//
// Pure functions. No React, no DOM, no Firestore. Inputs are plain
// data; outputs are plain data or new arrays. Mirrors the inline
// derivations in index.html's `tab === "reflection"` render block
// (~lines 19049-19717) so the extracted ReflectView and the legacy
// inline code agree on what the user sees.
//
// Dual-loaded:
//   • Browser: classic <script> tag in index.html publishes
//     `window.reflectDomain` so the view module can read it.
//   • Node:    `require("../lib/domains/reflect.js")` returns
//     `{ reflectDomain }` for the test suite.

// All journal entries (the "Past Entries" feed is unified — daily,
// goal-specific, and other-tagged entries all live in one list).
// The inline code filters with `(data.journal || []).filter(e => e)`
// which is a no-op truthiness gate; we keep the same shape so a
// later regression that accidentally pushes a null doesn't crash.
const allEntries = (data) =>
  ((data && data.journal) || []).filter(e => e);

// Past Entries grouped by `dateKey` ("YYYY-MM-DD"). Returns a plain
// object keyed by date — values are arrays of entries in insertion
// order. Entries missing a dateKey are bucketed under "" so callers
// can choose to display or drop them; nothing in this module mutates
// the input array.
const entriesByDay = (data) => {
  const out = {};
  for (const e of allEntries(data)) {
    const key = (e && e.dateKey) || "";
    if (!out[key]) out[key] = [];
    out[key].push(e);
  }
  return out;
};

// Total count of journal entries — drives the "N total" subtitle on
// the Past Entries header. Counts every entry, not just today's
// filter slice.
const pastEntriesCount = (data) =>
  allEntries(data).length;

// Filtered subset that the Past Entries list actually renders.
//
//   filter === "today" → entries where dateKey matches `selDate`
//   filter === "week"  → entries whose `timestamp` falls in the
//                        Sunday-anchored week that contains `selDate`
//   filter === "all"   → every entry (the default)
//
// `selDate` defaults to today via the `tk` helper so callers that
// don't pass a date still get sensible behavior. Pure: never mutates
// the input array; the inline code's `[...filtered].reverse()` for
// render ordering stays the view's concern.
const entriesForFilter = (data, filter, selDate) => {
  const entries = allEntries(data);
  if (filter !== "today" && filter !== "week") return entries;
  // Anchor day: caller-provided selDate, falling back to today via
  // tk() if it's exposed (browser path) or a fresh new Date() for
  // Node tests that bypass the global.
  const anchorKey = selDate || (typeof tk === "function" ? tk() : null);
  if (!anchorKey) return entries;
  if (filter === "today") {
    return entries.filter(e => e && e.dateKey === anchorKey);
  }
  // Week filter — Sunday-anchored window [wStart, wEnd) keyed off
  // the anchor day's local calendar week, matching the inline math
  // at index.html ~line 19343.
  const sd = new Date(anchorKey + "T12:00:00");
  if (isNaN(sd.getTime())) return entries;
  const wStart = new Date(sd);
  wStart.setDate(sd.getDate() - sd.getDay());
  wStart.setHours(0, 0, 0, 0);
  const wEnd = new Date(wStart);
  wEnd.setDate(wStart.getDate() + 7);
  return entries.filter(e => {
    if (!e || !e.timestamp) return false;
    const ts = new Date(e.timestamp);
    if (isNaN(ts.getTime())) return false;
    return ts >= wStart && ts < wEnd;
  });
};

const reflectDomain = {
  entriesByDay,
  pastEntriesCount,
  entriesForFilter,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { reflectDomain };
} else if (typeof window !== "undefined") {
  window.reflectDomain = reflectDomain;
}
