// lib/time-of-day.js
//
// Pure time-of-day section math. DEFAULT_TIME_RANGES + getTimeRanges +
// hourInRange + getCurrentSection lifted out of index.html L1244-L1273
// (30 LOC). All four declared at top-level classic-script scope so
// App() picks them up by bare name.
//
// Evening wraps through midnight (18..6), so hourInRange handles the
// wrap-case. getCurrentSection returns "morning"/"afternoon"/"evening"
// based on either the user-overridden data.timeRanges or the defaults.
// Avoid is never a time of day — it always renders separately.

// Default hour boundaries (24h) for each time-of-day block. Can be
// overridden per-user via `data.timeRanges`. Evening wraps through
// midnight (18..6), so `inRange` below handles the wrap case.
const DEFAULT_TIME_RANGES = {
  morning:   { start: 6,  end: 12 },
  afternoon: { start: 12, end: 18 },
  evening:   { start: 18, end: 6  }
};
const getTimeRanges = d => {
  const t = d && d.timeRanges;
  return t && t.morning && t.afternoon && t.evening ? t : DEFAULT_TIME_RANGES;
};
const hourInRange = (hour, start, end) => {
  if (start === end) return false;
  return start < end ? (hour >= start && hour < end)
                     : (hour >= start || hour < end); // wraps past midnight
};
// Returns "morning" | "afternoon" | "evening" for the given Date,
// based on the user's (or default) time-of-day boundaries. Avoid
// is not considered a time of day — it always renders separately.
const getCurrentSection = (d, now = new Date()) => {
  const r = getTimeRanges(d);
  const h = now.getHours();
  if (hourInRange(h, r.morning.start,   r.morning.end))   return "morning";
  if (hourInRange(h, r.afternoon.start, r.afternoon.end)) return "afternoon";
  if (hourInRange(h, r.evening.start,   r.evening.end))   return "evening";
  // Fallback: if the user configured gaps in their day, land on whichever
  // block sits closest before `h`.
  return "evening";
};
