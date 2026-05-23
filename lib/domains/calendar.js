// lib/domains/calendar.js — Calendar view's pure derivations + curried writes.
// Phase B of v75 view extraction. Loaded from index.html as a classic <script>
// (puts `calendarDomain` on Script scope and window). Also CJS-exported so
// tests/domains/calendar.test.mjs can require the same source.
//
// Scope:
//   READ derivations
//     monthGrid(data, year, month [, todayKey])
//     habitsDueOnDay(data, dateKey)
//     dayCompletionStats(data, dateKey [, todayKey])
//   WRITE actions (curried)
//     markDayVisited(dateKey) -> (data) => newData
//
// Notes:
//   - The CalendarView's full week / day timeline rendering uses
//     habitsDueOnDay, which returns scheduled habits with their assigned
//     [startMin, endMin] window. Filtering rules match the inline code at
//     index.html L21345-L21459:
//       * h.parked      → excluded
//       * h.parentId    → excluded (children ride along inside the parent
//                         slot's `members` field; only the parent gets a
//                         scheduled block)
//       * section "all-day" / "avoid" → excluded (no clock-time slot)
//   - Frequency type "weekly-day" is treated as "weekly" (the codebase
//     migrated this years ago; legacy data may still carry the old type).
//   - Local-date semantics throughout. NEVER `toISOString()` for date keys
//     — UTC drift breaks day boundaries.

// §13.4a (v75) — Body wrapped in IIFE to prevent top-level helper
// names (_dk, _todayKey, _getFreq, etc.) from colliding with
// identically-named helpers in sibling lib/domains/*.js files. See
// brief.js for the rationale.
(function () {
"use strict";

// Local YYYY-MM-DD for a Date. Mirrors utils.js `dk` so this module is
// standalone for Node tests (utils.js is loaded as a separate <script>
// in the browser, but the test harness requires this file directly).
const _dk = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
};

const _todayKey = () => _dk(new Date());

// Default time ranges if `data.timeRanges` is absent or malformed.
const _DEFAULT_TIME_RANGES = {
  morning:   { start: 6,  end: 12 },
  afternoon: { start: 12, end: 18 },
  evening:   { start: 18, end: 6  }
};

const _getTimeRanges = data => {
  const t = data && data.timeRanges;
  return (t && t.morning && t.afternoon && t.evening) ? t : _DEFAULT_TIME_RANGES;
};

// Frequency normalizer. Mirrors index.html `getFreq` — collapses
// the legacy "weekly-day" type into "weekly" and fills missing fields.
const _getFreq = h => {
  const f = h && h.frequency;
  if (!f || !f.type) return { type: "daily", days: [], day: null, monthDay: null, month: null };
  const rawType = f.type === "weekly-day" ? "weekly" : f.type;
  return {
    type: rawType,
    days: Array.isArray(f.days) ? f.days : [],
    day:      typeof f.day      === "number" ? f.day      : null,
    monthDay: typeof f.monthDay === "number" ? f.monthDay : null,
    month:    typeof f.month    === "number" ? f.month    : null
  };
};

// Does habit `h` fire on `dateKey`? Mirrors index.html `isHabitDueOn`.
// startDate cutoff is handled by the caller (see habitsDueOnDay).
const _isHabitDueOn = (h, dateKey) => {
  const fq = _getFreq(h);
  if (!fq || fq.type === "daily") return true;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || "");
  if (!m) return true;
  const dt = new Date(+m[1], +m[2] - 1, +m[3]);
  const dow = dt.getDay();
  const day = dt.getDate();
  const mon = dt.getMonth();
  if (fq.type === "weekdays") return Array.isArray(fq.days) && fq.days.includes(dow);
  if (fq.type === "weekly")   return (fq.day == null ? 1 : fq.day) === dow;
  if (fq.type === "monthly")  return (fq.monthDay || 1) === day;
  if (fq.type === "quarterly") {
    const anchorMonth = fq.month == null ? 0 : fq.month;
    const anchorDay   = fq.monthDay || 1;
    return ((mon - anchorMonth) % 3 + 3) % 3 === 0 && anchorDay === day;
  }
  if (fq.type === "annual") {
    const anchorMonth = fq.month == null ? 0 : fq.month;
    const anchorDay   = fq.monthDay || 1;
    return mon === anchorMonth && day === anchorDay;
  }
  return true;
};

// Children of a parent habit (h.parentId stringification matters — see
// the inline `habitChildren` at index.html L8162).
const _habitChildren = (parent, allHabits) => {
  if (!parent || !Array.isArray(allHabits)) return [];
  return allHabits
    .filter(c => c && c.parentId != null && String(c.parentId) === String(parent.id))
    .sort((a, b) => (a._order == null ? 999 : a._order) - (b._order == null ? 999 : b._order));
};

// Effective slot duration for a parent — sum of children's durations,
// else parent's own duration, else 30. Minimum 5 (matches the inline
// `effDuration` at index.html L21411).
const _effDuration = (parent, kids) => {
  if (kids && kids.length > 0) {
    const sum = kids.reduce((s, c) => s + (parseInt(c && c.duration, 10) || 0), 0);
    if (sum > 0) return Math.max(5, sum);
  }
  return Math.max(5, parseInt(parent && parent.duration, 10) || 30);
};

// Compare habits within a section by _order, then numeric id.
const _sortRow = (a, b) => {
  const ao = a && a._order != null ? a._order : 999;
  const bo = b && b._order != null ? b._order : 999;
  if (ao !== bo) return ao - bo;
  return (Number(a && a.id) || 0) - (Number(b && b.id) || 0);
};

// ─────────────────────────────────────────────────────────────────────
// READ: habitsDueOnDay
// ─────────────────────────────────────────────────────────────────────
// Returns the scheduled habits for `dateKey` as an ordered list of
// slot objects: { habit, members, displayName, startMin, endMin,
// durationMin }. Concurrent habits share their predecessor's start.
// Sorted by startMin asc.
//
// Filters (matching index.html L21365-L21376):
//   * parked habits excluded
//   * children (h.parentId) excluded — they roll up into the parent
//   * all-day and avoid sections excluded — no clock-time
//   * habits with startDate > dateKey excluded (not yet active)
function habitsDueOnDay(data, dateKey) {
  if (!data || !dateKey) return [];
  const allHabits = (Array.isArray(data.habits) ? data.habits : []).filter(h => h && !h.parked);
  const scheduled = allHabits.filter(h =>
    h.section !== "all-day" && h.section !== "avoid" && !h.parentId
  );
  const ranges = _getTimeRanges(data);
  const due = scheduled.filter(h => {
    if (h.startDate && dateKey < h.startDate) return false;
    return _isHabitDueOn(h, dateKey);
  });
  const bySection = { morning: [], afternoon: [], evening: [] };
  for (const h of due) {
    const sec = h.section || "morning";
    if (bySection[sec]) bySection[sec].push(h);
  }
  const out = [];
  for (const sec of ["morning", "afternoon", "evening"]) {
    bySection[sec].sort(_sortRow);
    const r = ranges[sec] || _DEFAULT_TIME_RANGES[sec];
    let cursor = (r.start || 0) * 60;
    let prevStart = null;
    for (const h of bySection[sec]) {
      const kids = _habitChildren(h, allHabits);
      const dur = _effDuration(h, kids);
      let start;
      if (h.concurrent && prevStart != null) {
        start = prevStart;
        if (start + dur > cursor) cursor = start + dur;
      } else {
        start = cursor;
        cursor = start + dur;
      }
      out.push({
        habit: h,
        members: kids.length > 0 ? kids.slice() : [h],
        displayName: h.text,
        startMin: start,
        endMin: start + dur,
        durationMin: dur
      });
      prevStart = start;
    }
  }
  out.sort((a, b) => a.startMin - b.startMin);
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// READ: monthGrid
// ─────────────────────────────────────────────────────────────────────
// Derives the 6×7 (42-cell) month grid for the given year+month
// (month is 0-indexed: 0=Jan, 11=Dec). Mirrors index.html `renderMonth`
// at L21554-L21595.
//
// Cell shape:
//   { key, blank: true, isCurrentMonth: false }                leading/trailing blank
//   { key, k, dayNum, due, goals, isToday, isCurrentMonth }    day cell
//
// `due` is filtered to "sparse" frequency (weekly / weekly-day / monthly /
// quarterly / annual) so the cell doesn't get cluttered by daily / weekday
// habits. `goals` is the list of goals whose smart.timebound matches the
// cell's date key.
//
// `todayKey` is optional — defaults to local "today". Pass an explicit key
// for deterministic tests.
function monthGrid(data, year, month, todayKey) {
  const today = todayKey || _todayKey();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Index goals by their target-date key. A goal whose smart.timebound
  // matches a cell's date key renders as a 🎯 chip in that cell.
  const goalsByDate = {};
  const goals = Array.isArray(data && data.goals) ? data.goals : [];
  for (const g of goals) {
    const tb = g && g.smart && g.smart.timebound;
    if (!tb) continue;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(tb);
    if (!m) continue;
    const k = m[1] + "-" + m[2] + "-" + m[3];
    if (!goalsByDate[k]) goalsByDate[k] = [];
    goalsByDate[k].push(g);
  }

  const isSparseFreq = h => {
    const t = h && h.frequency && h.frequency.type;
    return t === "weekly" || t === "weekly-day" || t === "monthly"
        || t === "quarterly" || t === "annual";
  };

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDow + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ key: "blank-" + i, blank: true, isCurrentMonth: false });
    } else {
      const cellDate = new Date(year, month, dayNum);
      const k = _dk(cellDate);
      const due = habitsDueOnDay(data, k).filter(s => isSparseFreq(s.habit));
      const dayGoals = goalsByDate[k] || [];
      cells.push({
        key: k,
        k,
        dayNum,
        due,
        goals: dayGoals,
        isToday: k === today,
        isCurrentMonth: true,
        blank: false
      });
    }
  }
  return cells;
}

// ─────────────────────────────────────────────────────────────────────
// READ: dayCompletionStats
// ─────────────────────────────────────────────────────────────────────
// `{ done, total, missed, skipped }` summary for a date key.
//   total   — number of habits due on this day (scheduled + all-day,
//             excludes avoid + children + parked + not-yet-started).
//   done    — completions[k] === "done" or true.
//   missed  — completions[k] === "missed".
//   skipped — completions[k] === "skipped".
function dayCompletionStats(data, dateKey, todayKey) {
  if (!data || !dateKey) return { done: 0, total: 0, missed: 0, skipped: 0 };
  const allHabits = (Array.isArray(data.habits) ? data.habits : []).filter(h => h && !h.parked);
  // Day-summary scope: all non-avoid, non-child habits that were
  // active on dateKey (startDate respected). Includes all-day so the
  // user gets a true "completed today" count.
  const candidates = allHabits.filter(h =>
    h.section !== "avoid"
    && !h.parentId
    && (!h.startDate || dateKey >= h.startDate)
    && _isHabitDueOn(h, dateKey)
  );
  let done = 0, missed = 0, skipped = 0;
  for (const h of candidates) {
    const c = h.completions && h.completions[dateKey];
    if (c === "done" || c === true) done++;
    else if (c === "missed") missed++;
    else if (c === "skipped") skipped++;
  }
  return { done, total: candidates.length, missed, skipped };
}

// ─────────────────────────────────────────────────────────────────────
// WRITE: markDayVisited (curried)
// ─────────────────────────────────────────────────────────────────────
// Idempotent — appends `dateKey` to data.dayVisits only if absent.
// Returns the original data reference unchanged when nothing to add,
// so the App-side `dispatch(...)` short-circuit (`if next && next !== cur`)
// becomes a no-op.
function markDayVisited(dateKey) {
  return function (data) {
    if (!data || !dateKey) return data;
    const visits = Array.isArray(data.dayVisits) ? data.dayVisits : [];
    if (visits.includes(dateKey)) return data;
    return { ...data, dayVisits: [...visits, dateKey] };
  };
}

const calendarDomain = {
  monthGrid,
  habitsDueOnDay,
  dayCompletionStats,
  markDayVisited
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calendarDomain };
} else if (typeof window !== "undefined") {
  window.calendarDomain = calendarDomain;
}

})(); // end IIFE wrapper (§13.4a v75)
