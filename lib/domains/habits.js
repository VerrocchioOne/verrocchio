// lib/domains/habits.js — Phase B (v75 view extraction)
//
// READ-side pure derivations for the Habits tab. NO React, NO DOM, NO
// references to `latestData.current`. Inputs are the plain `data` object
// (as shipped by App from Firestore + DD hydration) plus primitive args;
// outputs are plain JS values or NEW data objects (never mutated).
//
// WRITE-side helpers (togHabit, commitHabitReorderDrop, commitSlotReorderDrop,
// moveRowWithinSection, toggleConcurrentForHabit, addHabit, deleteHabit) stay
// in App() — they reference latestData.current + save + multiple App-scope
// helpers (slotIdForIndex, habitPositionInSection, etc.). The view receives
// them as `callbacks` props.
//
// The v72-v74 select-then-act reorder UX is NOT refactored. These pure
// derivations only describe what to RENDER; the App-side reorder pipeline
// owns all state transitions.

// Section ordering for the Habits tab. Mirrors the order rendered by the
// inline view in index.html. "avoid" is kept separate from the timed
// sections because it has no time-of-day cutoff.
const HABIT_SECTIONS = ["morning", "afternoon", "evening", "avoid"];

// Local YYYY-MM-DD for a Date — matches utils.js#dk exactly. Inlined
// rather than required so this file stays standalone (no cross-script
// load-order dependency on utils.js).
function _habitsDk(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// getCR + detectOffSchedule dual-load. Browser: utils.js sets each as a
// script-scope global; we re-bind them for use inside the file scope.
// Node: tests require() this file directly, so we require utils.js
// explicitly. sortAreasByProgress / offScheduleHabits accept opts.getCR
// / opts.detectOffSchedule overrides for deterministic tests.
let _habitsGetCR;
let _habitsDetectOffSchedule;
if (typeof require !== "undefined") {
  try {
    const u = require("../../utils.js");
    _habitsGetCR = u.getCR;
    _habitsDetectOffSchedule = u.detectOffSchedule;
  } catch (_) {}
}
if (!_habitsGetCR && typeof globalThis !== "undefined" && typeof globalThis.getCR === "function") {
  _habitsGetCR = globalThis.getCR;
}
if (!_habitsDetectOffSchedule && typeof globalThis !== "undefined" && typeof globalThis.detectOffSchedule === "function") {
  _habitsDetectOffSchedule = globalThis.detectOffSchedule;
}

// Parse YYYY-MM-DD safely. Returns null for anything that isn't the expected
// shape so callers can short-circuit on missing/malformed input without
// throwing. Mirrors lib/constants.js isHabitDueOn parsing semantics.
function _parseDateKey(dateKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || "");
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

// Mirrors getFreq() in lib/constants.js. Frequency defaults to "daily" when
// missing or shape-broken so legacy habits don't get hidden by the due
// filter.
function _getFreq(h) {
  const fq = h && h.frequency;
  if (!fq || typeof fq !== "object") return { type: "daily" };
  const t = fq.type || "daily";
  // Legacy "weekly-day" was merged into "weekly" anchored to fq.day.
  return { ...fq, type: t === "weekly-day" ? "weekly" : t };
}

// Pure equivalent of lib/constants.js isHabitDueOn(h, dateKey). Returns true
// when the habit's frequency schedule lands on the given date. Unknown
// frequency types fall through to true (don't hide on uncertainty —
// matches existing behavior).
function isDueOn(h, dateKey) {
  const fq = _getFreq(h);
  if (!fq || fq.type === "daily") return true;
  const dt = _parseDateKey(dateKey);
  if (!dt) return true;
  const dow = dt.getDay();
  const day = dt.getDate();
  const mon = dt.getMonth();
  if (fq.type === "weekdays") {
    return Array.isArray(fq.days) && fq.days.includes(dow);
  }
  if (fq.type === "weekly") {
    return (fq.day == null ? 1 : fq.day) === dow;
  }
  if (fq.type === "monthly") {
    return (fq.monthDay || 1) === day;
  }
  if (fq.type === "quarterly") {
    const anchorMonth = fq.month == null ? 0 : fq.month;
    const anchorDay = fq.monthDay || 1;
    return ((mon - anchorMonth) % 3 + 3) % 3 === 0 && anchorDay === day;
  }
  if (fq.type === "annual") {
    const anchorMonth = fq.month == null ? 0 : fq.month;
    const anchorDay = fq.monthDay || 1;
    return mon === anchorMonth && day === anchorDay;
  }
  return true;
}

// Pure equivalent of index.html's isFutureHabit. A habit is "future" when
// it's explicitly parked OR its startDate is strictly after the given
// todayKey. Parked habits and date-future habits live in the Future
// Habits drawer below the active section grid.
function _isFuture(h, todayKey) {
  if (!h) return false;
  if (h.parked) return true;
  if (h.startDate && todayKey && h.startDate > todayKey) return true;
  return false;
}

// groupedBySection(data) — group active (non-future, non-child) habits by
// their section. Multi-slot habits land in every section their slotSections
// references; single-slot habits land in h.section (defaulting to
// "morning"). Returns a plain object keyed by HABIT_SECTIONS values, each
// holding an array of habit objects (each appearing once per section it
// occupies). Stable ordering: same order as data.habits.
//
// Used for: rendering each section column, computing per-section counts.
// Pure — does NOT sort by _order; that's sectionRowsForRender's job.
function groupedBySection(data) {
  const habits = (data && Array.isArray(data.habits)) ? data.habits : [];
  const out = {};
  for (const sec of HABIT_SECTIONS) out[sec] = [];
  for (const h of habits) {
    if (!h || h.parentId) continue;
    const sections = Array.isArray(h.slotSections) ? h.slotSections : null;
    if (sections && sections.length > 0) {
      // Multi-slot: append to each unique section it occupies. A habit
      // with ["morning","morning","evening"] appears in morning ONCE
      // and evening ONCE here (per-slot rows are sectionRowsForRender's
      // concern; this is a coarse grouping).
      const seen = new Set();
      for (const s of sections) {
        if (seen.has(s)) continue;
        seen.add(s);
        if (out[s]) out[s].push(h);
        else { out[s] = [h]; }
      }
    } else {
      const sec = h.section || "morning";
      if (out[sec]) out[sec].push(h);
      else { out[sec] = [h]; }
    }
  }
  return out;
}

// dueToday(data, todayKey) — list every active habit due on todayKey.
// Avoid-section habits are always included (their "due-ness" doesn't
// apply — you can't be off-schedule for "don't smoke"). Future habits
// (parked or startDate>todayKey) are filtered out. Sub-habits (parentId)
// are excluded — they're rendered nested under their parent.
//
// Used for: badge counts on section headers, the "today" filter pill,
// and the Brief tab's "due today" rollup.
function dueToday(data, todayKey) {
  const habits = (data && Array.isArray(data.habits)) ? data.habits : [];
  return habits.filter(h => {
    if (!h || h.parentId) return false;
    if (_isFuture(h, todayKey)) return false;
    if (h.section === "avoid") return true;
    return isDueOn(h, todayKey);
  });
}

// sectionRowsForRender(data, section) — pure equivalent of App-scope
// gatherSectionRowsSorted, lifted out so the view can compute its
// per-section row order without reaching into App. Returns an array of
// row descriptors sorted by effective order:
//   { habitId, slotArrayIdx, effOrder }
// where slotArrayIdx is -1 for single-slot habits and the index into
// slotSections for multi-slot slot rows. Multiple slot rows from the
// same habit can appear in the same section if slotSections lists the
// section more than once; effOrder reads slotOrders[i] first, falling
// back to the habit's _order (then 999 for never-ordered).
//
// Future habits and child habits are excluded — same gates as
// groupedBySection. Avoid-section habits are included when section ===
// "avoid".
//
// Note: this mirrors gatherSectionRowsSorted at index.html L8888, but
// reads from `data` directly (no latestData.current). The App-side
// version stays for the WRITE-path because that path needs the absolute
// latest in-memory state during a multi-frame drag pipeline.
function sectionRowsForRender(data, section) {
  const habits = (data && Array.isArray(data.habits)) ? data.habits : [];
  const rows = [];
  for (const h of habits) {
    if (!h || h.parentId) continue;
    const sections = Array.isArray(h.slotSections) ? h.slotSections : null;
    if (sections && sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        if (sections[i] !== section) continue;
        const effOrder = (h.slotOrders && h.slotOrders[i] != null)
          ? h.slotOrders[i]
          : (h._order != null ? h._order : 999);
        rows.push({ habitId: h.id, slotArrayIdx: i, effOrder });
      }
    } else if ((h.section || "morning") === section) {
      rows.push({
        habitId: h.id,
        slotArrayIdx: -1,
        effOrder: h._order != null ? h._order : 999
      });
    }
  }
  // Stable sort by effOrder. Ties fall back to insertion order (which
  // mirrors data.habits order — the same fallback the inline gatherer
  // relied on implicitly).
  rows.sort((a, b) => a.effOrder - b.effOrder);
  return rows;
}

// upcomingHabits(data, todayKey) — habits that aren't active yet but
// will become active. Includes both `parked` habits AND date-future
// habits (startDate strictly after todayKey). Child habits excluded.
//
// Used for: the "Future Habits" drawer that renders below the active
// section grid.
function upcomingHabits(data, todayKey) {
  const habits = (data && Array.isArray(data.habits)) ? data.habits : [];
  return habits.filter(h => {
    if (!h || h.parentId) return false;
    return _isFuture(h, todayKey);
  });
}

// ─────────────────────────────────────────────────────────────────────
// appWideStreak(habits, opts?) — global "any habit done" streak in days.
// Walks back from `now` (default = Date.now()) up to `windowDays` days
// (default 365). Counts a day if ANY non-parked habit has a positive
// completion that day. Day 0 (today) being blank does NOT break the
// streak (mid-day check); day 1 blank breaks. Returns 0 when there
// are no non-parked habits.
// ─────────────────────────────────────────────────────────────────────
function appWideStreak(habits, opts) {
  const o = opts || {};
  const hs = (habits || []).filter(h => h && !h.parked);
  if (!hs.length) return 0;
  const windowDays = (typeof o.windowDays === "number" && o.windowDays > 0) ? o.windowDays : 365;
  const nowDate = o.now != null ? new Date(o.now) : new Date();
  let streak = 0;
  let started = false;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(nowDate);
    d.setDate(d.getDate() - i);
    const key = _habitsDk(d);
    const any = hs.some(h => h.completions && h.completions[key]);
    if (any) { streak++; started = true; }
    else if (started) break;
    else if (i > 0) break;
  }
  return streak;
}

// ─────────────────────────────────────────────────────────────────────
// sortAreasByProgress(habits, areas, opts?) -> areas sorted ascending
// by average completion rate of their habits (lowest average first =
// "show the areas that need attention at the top"). Areas with NO
// active habits sort to the end (score = Infinity).
//
// Defaults to using utils.js#getCR; opts.getCR overrides (lets tests
// pin scores without building real completion histories). Tie-breaker
// is the input order of `areas` — stable sort preserves it.
// ─────────────────────────────────────────────────────────────────────
function sortAreasByProgress(habits, areas, opts) {
  const o = opts || {};
  const getCR = typeof o.getCR === "function" ? o.getCR : _habitsGetCR;
  if (typeof getCR !== "function") {
    // Without a getCR there's nothing meaningful to sort on — return
    // the input order unchanged so callers don't get a thrown error.
    return (areas || []).slice();
  }
  const allH = (habits || []).filter(h => h && !h.parked);
  const score = (areaValue) => {
    const inArea = allH.filter(h => h && h.type === areaValue);
    if (inArea.length === 0) return Infinity;
    const total = inArea.reduce((s, h) => s + ((getCR(h) || {}).pct || 0), 0);
    return total / inArea.length;
  };
  return (areas || []).slice().sort((a, b) => {
    const sa = score(a && a.value);
    const sb = score(b && b.value);
    if (sa !== sb) return sa - sb;
    return 0;
  });
}

// ─────────────────────────────────────────────────────────────────────
// offScheduleHabits(habits, opts?) -> Array of off-schedule notes.
// Filters parked + "avoid" habits (their cadences are intentional, not
// missed) and runs detectOffSchedule(h) on the rest; drops null entries
// for habits whose cadence is on-schedule. opts.detectOffSchedule lets
// tests inject a deterministic stub.
// ─────────────────────────────────────────────────────────────────────
function offScheduleHabits(habits, opts) {
  const o = opts || {};
  const detect = typeof o.detectOffSchedule === "function"
    ? o.detectOffSchedule
    : _habitsDetectOffSchedule;
  if (typeof detect !== "function") return [];
  const hs = (habits || []).filter(h => h && h.section !== "avoid" && !h.parked);
  return hs.map(h => detect(h)).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────
// isFutureHabit(h, todayKey) -> boolean
// A habit is "future" if it's parked (manually deferred) OR its
// startDate sits after todayKey. Both keys are "YYYY-MM-DD" strings
// compared lexicographically — works because dk(d)-format keys are
// padded so string-compare matches date-compare. Falsy `h` is treated
// as "not a habit" → false (matches the inline behavior callers rely
// on for `data.habits.some(h => habitLinkedToGoal(h, …) && !isFutureHabit(h))`).
// ─────────────────────────────────────────────────────────────────────
function isFutureHabit(h, todayKey) {
  if (!h) return false;
  if (h.parked) return true;
  return !!(h.startDate && todayKey && h.startDate > todayKey);
}

// ─────────────────────────────────────────────────────────────────────
// prepareHabitsForICS(data, opts) -> { habitTimes, tzid }
//
// Pure compute side of exportHabitsICS — filters, sorts, stacks habit
// times by section anchor + concurrent flag, and returns the
// habitTimes array shape that buildICS() consumes. App keeps the
// blob/download/revokeObjectURL side-effects.
//
// opts (all optional — dual-loaded fallbacks from window globals):
//   getTimeRanges(data) -> { morning, afternoon, evening }
//   getFreq(habit)      -> frequency object (normalises weekly-day etc.)
// ─────────────────────────────────────────────────────────────────────
const prepareHabitsForICS = (data, opts) => {
  const o = opts || {};
  const _getTimeRanges = o.getTimeRanges
    || (typeof globalThis !== "undefined" && globalThis.getTimeRanges)
    || ((_d) => ({}));
  const _getFreq = o.getFreq
    || (typeof globalThis !== "undefined" && globalThis.getFreq)
    || ((h) => h.frequency || { type: "daily" });

  const habits = ((data && data.habits) || []).filter(h =>
    h && h.section !== "avoid" && h.section !== "all-day" && !h.parentId
  );
  const tzid = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (_e) { return "UTC"; }
  })();
  if (!habits.length) return { habitTimes: [], tzid };

  const ranges = _getTimeRanges(data) || {};
  const SECTION_START = {
    morning:   (ranges.morning   && ranges.morning.start   != null ? ranges.morning.start   : 6)  * 60,
    afternoon: (ranges.afternoon && ranges.afternoon.start != null ? ranges.afternoon.start : 12) * 60,
    evening:   (ranges.evening   && ranges.evening.start   != null ? ranges.evening.start   : 18) * 60
  };
  const sortedHabits = habits.slice().sort((a, b) => {
    const ao = a._order != null ? a._order : 999;
    const bo = b._order != null ? b._order : 999;
    if (ao !== bo) return ao - bo;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
  const sectionCursor = { morning: 0, afternoon: 0, evening: 0 };
  const sectionPrevStart = { morning: null, afternoon: null, evening: null };

  // Effective duration: parent uses sum of children's durations when
  // children exist, otherwise falls back to its own h.duration.
  const _effDur = (h) => {
    const kids = ((data && data.habits) || []).filter(c =>
      c.parentId != null && String(c.parentId) === String(h.id)
    );
    if (kids.length > 0) {
      const sum = kids.reduce((s, c) => s + (parseInt(c.duration, 10) || 0), 0);
      if (sum > 0) return Math.max(5, sum);
    }
    return Math.max(5, parseInt(h.duration, 10) || 30);
  };

  const habitTimes = sortedHabits.map(h => {
    const dur = _effDur(h);
    const sec = h.section;
    const anchor = SECTION_START[sec] != null ? SECTION_START[sec] : 12 * 60;
    let startMin;
    if (h.concurrent && sectionPrevStart[sec] != null) {
      startMin = sectionPrevStart[sec];
      const endOffset = (startMin - anchor) + dur;
      if (endOffset > (sectionCursor[sec] || 0)) sectionCursor[sec] = endOffset;
    } else {
      const offset = sectionCursor[sec] || 0;
      startMin = anchor + offset;
      sectionCursor[sec] = offset + dur;
    }
    sectionPrevStart[sec] = startMin;
    const kids = ((data && data.habits) || [])
      .filter(c => c.parentId != null && String(c.parentId) === String(h.id))
      .sort((a, b) => (a._order != null ? a._order : 999) - (b._order != null ? b._order : 999));
    return {
      habit: Object.assign({}, h, { frequency: _getFreq(h) }),
      members: kids.length > 0 ? kids.slice() : [h],
      durationMin: dur,
      startMin,
      allDay: false
    };
  });

  return { habitTimes, tzid };
};

const habitsDomain = {
  HABIT_SECTIONS,
  groupedBySection,
  dueToday,
  sectionRowsForRender,
  upcomingHabits,
  isDueOn,
  appWideStreak,
  sortAreasByProgress,
  offScheduleHabits,
  isFutureHabit,
  prepareHabitsForICS
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { habitsDomain };
} else if (typeof window !== "undefined") {
  window.habitsDomain = habitsDomain;
}
