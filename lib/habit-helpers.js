// lib/habit-helpers.js
//
// Pure habit-cadence helpers + the SMART field config + a default
// habit-icon palette. Originally inline at index.html L1347-L1486.
//
// Exposes (all top-level classic-script scope):
//   DOW_ABBR / DOW_ORDER / dowDisplayRank — Sunday-first day-of-week
//     storage + Monday-first display ordering.
//   getFreq / freqRank / freqLabel        — frequency normalize / rank /
//     display.
//   habitGoalIds / habitLinkedToGoal      — goal-link traversal.
//   isHabitDueOn(h, dateKey)              — calendar-cadence predicate.
//   SF_FIELDS                             — SMART field config (S/M/A/R/T).
//   HABIT_ICONS                           — default emoji palette.
//
// All pure; no React, no closure over App state.

// Indexed by JS `Date.getDay()` — 0 = Sun … 6 = Sat. Kept in Sunday-first
// order so day values stored in `frequency.days` / `frequency.day` keep
// their meaning across the whole codebase.
const DOW_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Display order for the day-picker UI: Mon → Sun. The picker iterates
// this list when rendering chips so Monday appears first, while the
// stored day numbers still map to DOW_ABBR. Also used to sort the
// comma-joined display in freqLabel so "Mon · Wed · Sun" reads left-to
// -right in the same Monday-first order.
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
const dowDisplayRank = d => {
  const i = DOW_ORDER.indexOf(d);
  return i === -1 ? 99 : i;
};
/* Normalize any habit shape to a
   `{ type, days, day, monthDay, month }` frequency object.
   - Legacy habits without a `.frequency` field render as "Daily".
   - Legacy `weekly-day` cadence is collapsed into `weekly` (its `day`
     value is preserved, so an existing "every Tuesday" habit stays
     on Tuesday after the merge).
   - `monthDay` / `month` are new fields for monthly / quarterly /
     annual habits; they default to null when absent. */
// getFreq lives in lib/constants.js (loaded before this file). Don't
// re-declare here — duplicate const would throw at script load.
const freqRank = h => {
  const t = getFreq(h).type;
  const row = FREQ.find(f => f.value === t);
  return row ? row.rank : 1;
};
// habitGoalIds + habitLinkedToGoal live in lib/domains/goals.js (loaded
// before this file). Don't re-declare here — duplicate const would
// shadow goals.js's function declaration and throw at load time.
// isHabitDueOn lives in lib/constants.js (loaded before this file).
// Don't re-declare here — duplicate const would throw at script load.
const freqLabel = h => {
  const fq = getFreq(h);
  if (fq.type === "weekdays") {
    const picks = (fq.days || []).slice().sort((a, b) => dowDisplayRank(a) - dowDisplayRank(b)).map(d => DOW_ABBR[d]).join(" \u00B7 ");
    return picks ? "Days: " + picks : "Select Days";
  }
  if (fq.type === "weekly") {
    // Every weekly habit is now anchored to one weekday — merged from
    // the old weekly / weekly-day split. Show "Weekly — Tue" so the
    // user can see the anchor at a glance.
    return "Weekly \u2014 " + (DOW_ABBR[fq.day == null ? 1 : fq.day] || "Mon");
  }
  if (fq.type === "monthly") {
    return fq.monthDay ? "Monthly \u2014 " + ordSuffix(fq.monthDay) : "Monthly";
  }
  if (fq.type === "quarterly") {
    if (fq.month != null && fq.monthDay) {
      return "Quarterly \u2014 " + MONTHS_SHORT[fq.month] + " " + fq.monthDay;
    }
    return "Quarterly";
  }
  if (fq.type === "annual") {
    if (fq.month != null && fq.monthDay) {
      return "Annual \u2014 " + MONTHS_SHORT[fq.month] + " " + fq.monthDay;
    }
    return "Annual";
  }
  const row = FREQ.find(f => f.value === fq.type);
  return row ? row.label : "Daily";
};
const SF_FIELDS = [{
  key: "specific",
  label: "S — Specific",
  ph: "What exactly do you want to accomplish?"
}, {
  key: "measurable",
  label: "M — Measurable",
  ph: "How will you measure progress?"
}, {
  key: "achievable",
  label: "A — Achievable",
  ph: "Why is this realistic for you?"
}, {
  key: "relevant",
  label: "R — Relevant",
  ph: "How does this align with your values?"
}, {
  key: "timebound",
  label: "T — Time-bound",
  ph: "What is your target date?"
}];
const HABIT_ICONS = ["🏃", "💪", "🧘", "🚴", "🏊", "⚽", "🎾", "🥊", "🤸", "🧗", "📖", "✍️", "🎯", "🧠", "💻", "🎓", "📝", "🔬", "🎨", "🎭", "🥗", "💊", "💧", "🛌", "🌅", "🧘", "🍎", "🥦", "☕", "🫁", "🙏", "📿", "✝️", "🕊️", "🌿", "⭐", "🌙", "☀️", "🔥", "❤️", "💰", "📊", "💼", "🏦", "📈", "💳", "🏠", "🚗", "✈️", "💎", "🎵", "🎹", "🎸", "🎺", "🎻", "🖼️", "📸", "🌍", "🗣️", "🤝", "😴", "🧹", "🪥", "🛁", "👟", "⌚", "📱", "🔑", "📦", "🎁"];
