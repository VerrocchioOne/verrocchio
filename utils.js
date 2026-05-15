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

// Streak is the count of consecutive DUE days that the user has
// completed, walking back from today. Days where the habit isn't
// scheduled (a Mon/Wed habit on Tuesday; a weekly-Sunday habit
// any day except Sunday) are skipped — they're not opportunities,
// so missing them shouldn't break the streak. Today is also given
// a grace pass: if today is a due day and not yet completed, we
// don't break (the user might still do it). Earlier due days
// without a completion still break.
//
// Walks past h.startDate (loop terminates when we cross before
// the habit existed) so brand-new habits don't get a long fake
// streak from a frequency that happened to land on green dates.
function getStreak(h) {
  if (!h) return 0;
  const fq = (h && h.frequency) || { type: "daily" };
  const type = fq.type === "weekly-day" ? "weekly" : (fq.type || "daily");
  const todayKey = tk();
  const startKey = h.startDate || null;
  let s = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dk(d);
    if (startKey && k < startKey) break;
    let due = true;
    if (type === "weekdays") {
      due = Array.isArray(fq.days) && fq.days.includes(d.getDay());
    } else if (type === "weekly") {
      due = (typeof fq.day === "number" ? fq.day : 1) === d.getDay();
    } else if (type === "monthly") {
      due = (fq.monthDay || 1) === d.getDate();
    } else if (type === "quarterly") {
      const m = typeof fq.month === "number" ? fq.month : 0;
      const md = fq.monthDay || 1;
      due = ((d.getMonth() - m) % 3 + 3) % 3 === 0 && d.getDate() === md;
    } else if (type === "annual") {
      const m = typeof fq.month === "number" ? fq.month : 0;
      const md = fq.monthDay || 1;
      due = d.getMonth() === m && d.getDate() === md;
    }
    // type === "daily" (or unknown) leaves due = true.
    if (!due) continue;
    if (h.completions?.[k]) s++;
    else if (k === todayKey) continue;
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
// §5.8b — Build the per-slot IDs for a slotSections array. Mirrors
// the slotIdForIndex helper defined inside the App component in
// index.html; reimplemented here because utils.js is loaded before
// the inline app script and Node tests require this file directly
// without access to App-scope helpers. Slot ID = "<section>:<localIdx>"
// where localIdx is the 0-based position of that occurrence within
// slotSections filtered to that section. Duplicate sections allowed:
// ["morning","morning","evening"] → [
//   { section: "morning", slotId: "morning:0" },
//   { section: "morning", slotId: "morning:1" },
//   { section: "evening", slotId: "evening:0" }
// ]
function buildSlotIds(slotSections) {
  if (!Array.isArray(slotSections)) return [];
  const counts = {};
  const out = [];
  for (const s of slotSections) {
    const i = counts[s] || 0;
    out.push({ section: s, slotId: s + ":" + i });
    counts[s] = i + 1;
  }
  return out;
}

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
    // §5.8 — Multi-slot habits qualify as the A (conditioning) side
    // under the STRICT semantic: a day counts as "on time" only when
    // every slot in slotSections has a per-slot completion time AND
    // each time is before its slot's section cutoff. If any slot is
    // missing or late, the day is not on-time. This makes the
    // correlation signal trustworthy: "when the user nailed every
    // slot of habit A on schedule, did habit B follow?"
    const isMultiSlot = Array.isArray(h && h.slotSections) && h.slotSections.length >= 2;
    const cutoff = isMultiSlot ? null : SECTION_CUTOFFS[h && h.section];
    // §5.8b — Build slot IDs once per habit. The slotCompletionTimes
    // map is keyed by slot ID ("morning:0", "morning:1"), not by bare
    // section name. Hydration in index.html migrates legacy bare-key
    // shapes to ":0" so this lookup is uniform.
    const slotIds = isMultiSlot ? buildSlotIds(h.slotSections) : [];
    // canBeASide replaces the old `cutoff != null` skip-marker — we
    // need to allow multi-slot habits through even though they have
    // no single cutoff. Single-slot avoid habits still get filtered
    // out (they have no SECTION_CUTOFFS entry and no slotSections).
    const canBeASide = isMultiSlot || cutoff != null;
    const onTime = new Set();
    const any = new Set();
    if (h && h.completions) {
      for (const day of days) {
        const c = h.completions[day];
        if (c !== "done" && c !== true) continue;
        any.add(day);
        if (isMultiSlot) {
          const dayTimes = (h.slotCompletionTimes || {})[day] || {};
          let allOnTime = slotIds.length > 0;
          for (const { section, slotId } of slotIds) {
            const slotCutoff = SECTION_CUTOFFS[section];
            // §5.8b — Look up by slot ID first; fall back to bare
            // section name so legacy data that never went through
            // hydration still reads correctly. Hydration normally
            // converts both, but a Node test or freshly-imported
            // doc may skip the migration shim.
            const recorded = dayTimes[slotId] != null ? dayTimes[slotId] : dayTimes[section];
            const mins = parseClock(recorded);
            if (slotCutoff == null || mins == null || mins >= slotCutoff * 60) {
              allOnTime = false;
              break;
            }
          }
          if (allOnTime) onTime.add(day);
        } else if (cutoff != null) {
          const mins = parseClock(h.completionTimes && h.completionTimes[day]);
          if (mins != null && mins < cutoff * 60) onTime.add(day);
        }
      }
    }
    return { h, cutoff, canBeASide, isMultiSlot, onTime, any };
  });
  const totalDays = days.length;
  for (const A of prepped) {
    if (!A.canBeASide) continue; // avoid or single-slot with no cutoff
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
          // Multi-slot habits expose a composite section so the caller
          // can render "morning+evening" rather than the form-default
          // .section value. cutoffHour stays null for multi-slot —
          // the strict semantic means there's no single "by hour"
          // label that fits.
          aSection: A.isMultiSlot ? A.h.slotSections.join("+") : A.h.section,
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
  // §5.8 — Multi-slot path: each slot has its own cutoff. Walk the
  // window comparing each slot's recorded time against that slot's
  // section cutoff. Aggregate late count across all slots so a habit
  // gets flagged when its overall on-time discipline slips below
  // threshold, regardless of which slot is the offender.
  const slots = Array.isArray(habit.slotSections) ? habit.slotSections : null;
  if (slots && slots.length >= 2) {
    const slotTimes = habit.slotCompletionTimes || {};
    // §5.8b — Iterate by slot ID ("<section>:<localIdx>") not bare
    // section name, so duplicates within slotSections (e.g.
    // ["morning","morning"] for two morning study chunks) each get
    // their own per-day time lookup. Legacy data keyed by bare
    // section name falls back to dayTimes[section] for back-compat
    // until hydration rewrites it to ":0".
    const slotIds = buildSlotIds(slots);
    let logged = 0, late = 0;
    const days = recentDays(windowDays, today);
    for (const d of days) {
      const dayTimes = slotTimes[d];
      if (!dayTimes) continue;
      for (const { section, slotId } of slotIds) {
        const slotCutoff = SECTION_CUTOFFS[section];
        if (slotCutoff == null) continue;
        const recorded = dayTimes[slotId] != null ? dayTimes[slotId] : dayTimes[section];
        const mins = parseClock(recorded);
        if (mins == null) continue;
        logged++;
        if (mins >= slotCutoff * 60) late++;
      }
    }
    if (logged < minLogged) return null;
    const lateRate = late / logged;
    if (lateRate < threshold) return null;
    return {
      habitId: habit.id,
      habitText: habit.text,
      // Composite identifier for multi-slot — caller can format
      // ("morning+evening") for display, or render a per-slot
      // breakdown by re-walking slotCompletionTimes.
      section: slots.join("+"),
      cutoffHour: null,
      lateCount: late,
      loggedCount: logged,
      lateRate
    };
  }
  // Single-slot path
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
