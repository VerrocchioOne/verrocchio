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

const habitsDomain = {
  HABIT_SECTIONS,
  groupedBySection,
  dueToday,
  sectionRowsForRender,
  upcomingHabits,
  isDueOn
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { habitsDomain };
} else if (typeof window !== "undefined") {
  window.habitsDomain = habitsDomain;
}
