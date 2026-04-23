// Pure date/streak utilities shared by the Verrocchio app and the
// test suite. Loaded from index.html as a classic <script>, which
// puts the `const` bindings in the shared Script scope so the inline
// app script below can reference them by name (dk, tk, pastDays, …).
// Also exports via CommonJS when the file is required from Node so
// tests/*.test.mjs can import the same source of truth.

// Local YYYY-MM-DD for a Date. Using toISOString() here would convert
// to UTC first, which silently shifts the "day" by ±1 near midnight
// for users east/west of UTC — breaking streaks, "today" lookups, and
// calendar keys.
const dk = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const tk = () => dk(new Date());

// Local HH:MM (24-hour, zero-padded) for a Date. Used to stamp habit
// completion times alongside `completions[dateKey]` so we can later
// correlate e.g. "cardio before 8am" with "slept by 10pm".
const dkTime = d => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};
const tkTime = () => dkTime(new Date());

function pastDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return dk(d);
  });
}

function getStreak(h) {
  let s = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (h.completions?.[dk(d)]) s++;
    else break;
  }
  return s;
}

// How many days back we have to look to find the most recent completion.
// Returns null if there has never been a completion in the last year.
function daysSinceLast(h) {
  for (let i = 1; i <= 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (h.completions?.[dk(d)]) return i;
  }
  return null;
}

function getCR(h) {
  return {
    pct: Math.round(pastDays(30).filter(d => h.completions?.[d]).length / 30 * 100)
  };
}

function getLast14(h) {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const k = dk(d);
    return { k, done: !!h.completions?.[k] };
  });
}

// Parse "HH:MM" → minutes since midnight. Returns null for anything
// that isn't the expected shape so callers can early-out on missing /
// malformed data without try/catch.
function parseClock(hhmm) {
  if (typeof hhmm !== "string") return null;
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}

// Each section's "done by" cutoff in hours past midnight — used by the
// correlation + off-schedule detectors to define "on-time" for a habit.
// Morning = done by noon, afternoon = done by 6pm, evening = done by
// midnight. Avoid has no timing semantic so it's excluded from these
// detectors (you can't "resist a temptation by 8am").
const SECTION_CUTOFFS = {
  morning: 12,
  afternoon: 18,
  evening: 24
};

// Iterate days back from `today` (inclusive). If today isn't provided
// (browser use) we use the real clock; tests pass a fixed Date for
// determinism. Returns `{iter}` newest-first so the correlation /
// off-schedule readers share one day-key generator.
function recentDays(n, today) {
  const base = today ? new Date(today.getTime()) : new Date();
  base.setHours(12, 0, 0, 0); // noon → avoid DST edges when subtracting days
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    out.push(dk(d));
  }
  return out;
}

// Find pairs of habits where completing habit A by its section cutoff
// is correlated with completing habit B at all on the same day. Returns
// an array of {aHabitId, aText, aSection, bHabitId, bText, support,
// conditional, base, lift} sorted by lift desc.
//
// Thresholds match the product spec: minSupport = 14 (need at least
// 14 days of "A done by cutoff" to claim a pattern exists) and
// minLift = 0.20 (conditional probability must beat the base by at
// least 20 percentage points). Windows back 60 days so slow-building
// habits still generate findings.
function findCorrelations(habits, opts) {
  const minSupport = (opts && opts.minSupport) || 14;
  const minLift    = (opts && opts.minLift)    || 0.20;
  const window     = (opts && opts.windowDays) || 60;
  const today      = opts && opts.today;
  if (!Array.isArray(habits) || habits.length < 2) return [];
  const days = recentDays(window, today);
  const results = [];
  // Pre-compute each habit's "done-by-cutoff" bitmap + "done-at-all"
  // bitmap across the window so the N×N pair loop doesn't re-scan
  // completions on every iteration.
  const prepped = habits.map(h => {
    const cutoff = SECTION_CUTOFFS[h && h.section];
    const onTime = new Set();
    const any = new Set();
    if (h && h.completions) {
      for (const day of days) {
        const c = h.completions[day];
        if (c !== "done" && c !== true) continue;
        any.add(day);
        if (cutoff != null) {
          const mins = parseClock(h.completionTimes && h.completionTimes[day]);
          if (mins != null && mins < cutoff * 60) onTime.add(day);
        }
      }
    }
    return { h, cutoff, onTime, any };
  });
  const totalDays = days.length;
  for (const A of prepped) {
    if (A.cutoff == null) continue; // avoid or unknown section
    if (A.onTime.size < minSupport) continue;
    for (const B of prepped) {
      if (!B.h || A.h.id === B.h.id) continue;
      // Conditional: P(B done | A done by cutoff) over the support set.
      let bGivenA = 0;
      for (const d of A.onTime) if (B.any.has(d)) bGivenA++;
      const conditional = bGivenA / A.onTime.size;
      const base = B.any.size / totalDays;
      const lift = conditional - base;
      if (lift >= minLift) {
        results.push({
          aHabitId: A.h.id,
          aText: A.h.text,
          aSection: A.h.section,
          aCutoffHour: A.cutoff,
          bHabitId: B.h.id,
          bText: B.h.text,
          support: A.onTime.size,
          conditional,
          base,
          lift
        });
      }
    }
  }
  results.sort((x, y) => y.lift - x.lift);
  return results;
}

// Flag habits the user consistently logs after their section cutoff —
// e.g. a "morning run" logged after noon on 5 of the last 7 days it
// was completed. Returns null if the habit doesn't qualify (not enough
// recent completions, or the late rate is below threshold).
//
// Used to fire a Tips-section nudge: "your morning run lands in the
// afternoon most of the time — consider moving it to afternoon".
function detectOffSchedule(habit, opts) {
  const windowDays = (opts && opts.windowDays) || 14;
  const minLogged  = (opts && opts.minLogged)  || 4;
  const threshold  = (opts && opts.threshold)  || 0.6;
  const today      = opts && opts.today;
  if (!habit) return null;
  const cutoff = SECTION_CUTOFFS[habit.section];
  if (cutoff == null) return null;
  let logged = 0, late = 0;
  const days = recentDays(windowDays, today);
  for (const d of days) {
    const c = habit.completions && habit.completions[d];
    if (c !== "done" && c !== true) continue;
    const mins = parseClock(habit.completionTimes && habit.completionTimes[d]);
    if (mins == null) continue;
    logged++;
    if (mins >= cutoff * 60) late++;
  }
  if (logged < minLogged) return null;
  const lateRate = late / logged;
  if (lateRate < threshold) return null;
  return {
    habitId: habit.id,
    habitText: habit.text,
    section: habit.section,
    cutoffHour: cutoff,
    lateCount: late,
    loggedCount: logged,
    lateRate
  };
}

// CommonJS export for Node-side tests. The `typeof module` guard means
// the browser path (no CommonJS) is untouched.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { dk, tk, dkTime, tkTime, pastDays, getStreak, daysSinceLast, getCR, getLast14, parseClock, findCorrelations, detectOffSchedule, SECTION_CUTOFFS };
}
