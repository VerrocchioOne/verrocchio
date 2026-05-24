// lib/constants.js — Wave 3 (App() constants & pure helpers extraction).
//
// Pure data constants currently defined inline in index.html. This file
// is the destination of the Wave 3 lift. It is NOT yet wired in via a
// `<script src>` tag in index.html — that integration step is deferred
// until Wave 2 (component extractions) commits to avoid a parallel-edit
// collision. When the index.html alias-swap lands, follow the pattern
// in docs/superpowers/patterns/view-extraction.md §"Per-component task
// pattern" and the per-constant line numbers documented in
// docs/superpowers/plans/2026-05-23-full-decomposition-wave3-status.md.
//
// Browser dependencies: NONE. Pure data (numbers, strings, objects).
// CSS-var strings inside style objects are resolved by the browser at
// render time, not at module load.
//
// Node dependencies: NONE. The bottom-of-file CommonJS export is what
// makes this module usable from `tests/*.test.mjs` via `createRequire`.
//
// Originally lived inline in index.html at:
//   IMP                                                     L1363
//   HT                                                      L1379
//   SECTIONS                                                L1445
//   DURS                                                    L1641
//   FREQ                                                    L1722
//   DUR_MIN / DUR_MAX / DUR_STEP   (inside App)             L6603
//   I / IS / S / AB                (inside App)             L11125-L11166

// ── PRIORITY / IMPORTANCE TAXONOMY ────────────────────────────────
// Three-tier importance ladder used to color habit chips, weight goal
// progress, and sort filtered lists. Order matters — index 0 is the
// highest priority (Non-Negotiable). Values are user-facing strings;
// don't rename without a migration.
const IMP = [{
  value: "Non-Negotiable",
  color: "var(--c-tint-danger-fg)",
  bg: "var(--c-tint-danger-bg)",
  border: "var(--c-tint-danger-border)"
}, {
  value: "Important",
  color: "var(--c-tint-warn-fg)",
  bg: "var(--c-tint-warn-bg)",
  border: "var(--c-tint-warn-border)"
}, {
  value: "Additive",
  color: "var(--c-text-faint)",
  bg: "var(--c-surface-raised)",
  border: "var(--c-border)"
}];

// ── HABIT TYPE TAXONOMY ───────────────────────────────────────────
// Seven categories the user assigns to each habit. Determines the
// row's accent color across the app and is the X-axis of the habit-
// type distribution chart on the Brief tab.
const HT = [{
  value: "Physical",
  color: "var(--c-tint-success-fg)",
  bg: "var(--c-tint-success-bg)",
  border: "var(--c-tint-success-border)"
}, {
  value: "Mental",
  color: "var(--c-tint-travel-fg)",
  bg: "var(--c-tint-travel-bg)",
  border: "var(--c-tint-travel-border)"
}, {
  value: "Career",
  color: "var(--c-tint-info-fg)",
  bg: "var(--c-tint-info-bg)",
  border: "var(--c-tint-info-border)"
}, {
  value: "Spiritual",
  color: "var(--c-tint-purple-fg)",
  bg: "var(--c-tint-purple-bg)",
  border: "var(--c-tint-purple-border)"
}, {
  value: "Social",
  color: "var(--c-tint-pink-fg)",
  bg: "var(--c-tint-pink-bg)",
  border: "var(--c-tint-pink-border)"
}, {
  value: "Wealth",
  color: "var(--c-tint-warn-fg)",
  bg: "var(--c-tint-warn-bg)",
  border: "var(--c-tint-warn-border)"
}, {
  value: "Creative",
  color: "var(--c-tint-teal-fg)",
  bg: "var(--c-tint-teal-bg)",
  border: "var(--c-tint-teal-border)"
}];

// ── TIME-OF-DAY SECTIONS ──────────────────────────────────────────
// Five buckets the habit list groups into: morning / afternoon /
// evening / all-day / avoid. The first three are time-bounded by
// `data.timeRanges` (or DEFAULT_TIME_RANGES). `all-day` is ambient
// (water, posture). `avoid` is constructive-negative (don't-do).
const SECTIONS = [{
  value: "morning",
  label: "Morning",
  icon: "🌅",
  color: "var(--c-tint-warn-fg)",
  bg: "var(--c-tint-warn-bg)",
  border: "var(--c-tint-warn-border)"
}, {
  value: "afternoon",
  label: "Afternoon",
  icon: "☀️",
  color: "var(--c-tint-orange-fg)",
  bg: "var(--c-tint-orange-bg)",
  border: "var(--c-tint-orange-border)"
}, {
  value: "evening",
  label: "Evening",
  icon: "🌙",
  color: "var(--c-tint-purple-fg)",
  bg: "var(--c-tint-purple-bg)",
  border: "var(--c-tint-purple-border)"
}, {
  value: "all-day",
  label: "Daily Completion",
  icon: "🔁",
  color: "var(--c-tint-teal-fg)",
  bg: "var(--c-tint-teal-bg)",
  border: "var(--c-tint-teal-border)"
}, {
  value: "avoid",
  label: "Avoid",
  icon: "🚫",
  color: "var(--c-tint-danger-fg)",
  bg: "var(--c-tint-danger-bg)",
  border: "var(--c-tint-danger-border)"
}];

// ── DURATION PRESETS ──────────────────────────────────────────────
// Picker options for habit duration. Values are minute strings to
// match the underlying `habit.duration` field (stored as a string for
// historical reasons; do not change without a migration).
const DURS = [
  { value: "5",   label: "5 min" },
  { value: "10",  label: "10 min" },
  { value: "15",  label: "15 min" },
  { value: "20",  label: "20 min" },
  { value: "30",  label: "30 min" },
  { value: "45",  label: "45 min" },
  { value: "60",  label: "1 hr" },
  { value: "90",  label: "1.5 hr" },
  { value: "120", label: "2 hr" },
  { value: "150", label: "2.5 hr" },
  { value: "180", label: "3 hr" },
  { value: "240", label: "4 hr" },
  { value: "300", label: "5 hr" },
  { value: "360", label: "6 hr" },
  { value: "420", label: "7 hr" },
  { value: "480", label: "8 hr" },
  { value: "540", label: "9 hr" },
  { value: "600", label: "10 hr" },
  { value: "660", label: "11 hr" },
  { value: "720", label: "12 hr" }
];

// Duration-filter slider bounds (minutes). The Habits-tab dual-thumb
// range filter clamps to [DUR_MIN, DUR_MAX] in DUR_STEP increments.
// When min === DUR_MIN && max === DUR_MAX the filter is treated as
// "Any" (no filtering).
const DUR_MIN = 0;
const DUR_MAX = 720;
const DUR_STEP = 5;

// ── HABIT FREQUENCY CADENCES ──────────────────────────────────────
// `rank` orders cadences from most-often (1) to least-often (7) when
// a goal expands its linked habits. `daily` is the pre-existing
// implicit default — legacy habits without a `.frequency` field are
// treated as daily by `getFreq()`.
//
// Per-cadence frequency shape:
//   daily      — no extra fields
//   weekdays   — `days: number[]`  (0..6 Sun..Sat; multi-select)
//   weekly     — `day: number`     (0..6 Sun..Sat; single day)
//   monthly    — `monthDay: 1..31`
//   quarterly  — `month: 0..11` + `monthDay: 1..31`
//                (anchor; repeats every 3 months from the anchor)
//   annual     — `month: 0..11` + `monthDay: 1..31`
//                (anchor; repeats every year)
//
// Historical note: earlier builds had `weekly` (no day) and
// `weekly-day` (with day). They've been merged into a single `weekly`
// that always carries a `day`. Legacy `weekly-day` habits are
// migrated on read by `getFreq()`.
const FREQ = [
  { value: "daily",     label: "Daily",       icon: "\u{1F4C5}", rank: 1 },
  { value: "weekdays",  label: "Select Days", icon: "\u{1F5D3}", rank: 2 },
  { value: "weekly",    label: "Weekly",      icon: "\u{1F5D3}", rank: 3 },
  { value: "monthly",   label: "Monthly",     icon: "\u{1F4C6}", rank: 5 },
  { value: "quarterly", label: "Quarterly",   icon: "\u{1F4C6}", rank: 6 },
  { value: "annual",    label: "Annual",      icon: "\u{1F4C6}", rank: 7 }
];

// ── FORM ELEMENT STYLES ───────────────────────────────────────────
// Inline style objects for the inline new-habit form (and several
// other form blocks). `I` is the base input style; `IS` is the
// secondary/smaller-input variant that spreads from `I`. `S` is the
// select style. `AB` is the primary action button. Currently defined
// inside App() at L11125-L11166 — Wave 3 lift moves them to module
// scope here so cross-view forms can share them once SettingsView /
// Onboarding / etc. are extracted in Wave 4.
//
// CSS-var strings are resolved by the browser at render time; passing
// these objects through Node doesn't touch them.
const I = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 14px",
  color: "var(--c-text)",
  fontSize: 14,
  boxShadow: "0 1px 2px rgba(0,0,0,.04)"
};

const IS = {
  ...I,
  fontSize: 13,
  padding: "9px 12px"
};

const S = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px",
  // §5.3 — was fontSize: 12 but the adjacent `IS` input is 13, so a
  // <select> next to an <input> in the same row produced a visible
  // 12-vs-13 jump on iOS (where the system also inflates <select>
  // text independently). Match the input scale.
  fontSize: 13,
  cursor: "pointer",
  color: "var(--c-text-soft)",
  boxShadow: "0 1px 2px rgba(0,0,0,.04)"
};

const AB = {
  background: "#2d5a2d",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer"
};

// CommonJS export for Node-side tests. The `typeof module` guard
// means the browser path (no CommonJS) is untouched and the consts
// above remain script-scope globals usable from index.html's inline
// scripts and from other `<script src>` modules loaded after this
// file.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { IMP, HT, SECTIONS, DURS, DUR_MIN, DUR_MAX, DUR_STEP, FREQ, I, IS, S, AB };
}
