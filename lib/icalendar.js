// iCalendar (.ics) export — built on top of ical.js (Mozilla, MIT). Originally
// inlined in index.html as ~160 lines of hand-rolled string concatenation;
// extracted and rebuilt as Phase 2 OSS-port Port #4.
//
// Loaded from index.html as a classic <script>, which puts the `buildICS`
// binding in the shared Script scope so the inline app script below can
// reference it by name. Also exports via CommonJS when the file is required
// from Node so tests/icalendar.test.mjs can import the same source.
//
// Contract (preserved verbatim from the hand-rolled version — see
// tests/icalendar.test.mjs for the pinned behaviour):
//
//   buildICS(habitTimes, { tzid }) -> string
//
// `habitTimes` is an array of records prepared by index.html's
// exportHabitsICS wrapper — section cursor stacking, parent/child member
// collapsing, and the avoid/all-day filter all happen there. The shape is:
//   {
//     habit:        { id, text, section, frequency, importance?, type?, duration? },
//     members:      Habit[]   // [habit] for childless; child habits for parents
//     durationMin:  number    // VEVENT length in minutes
//     startMin:     number    // minutes since midnight (local)
//     allDay:       boolean   // currently always false; reserved for future use
//   }
//
// The output is a full VCALENDAR document with CRLF line endings (RFC 5545).

// Pick up ICAL from whichever world we're in. In the browser the global is
// attached by an ESM bootstrap that pulls ical.js@2.2.1 from esm.sh and
// assigns it to window.ICAL. In Node tests we require it directly from npm.
// Lookup is lazy (inside getICAL) so that the browser ESM module has time
// to resolve before the user clicks the export button — top-level script
// order would otherwise force a race.
function getICAL() {
  if (typeof window !== "undefined" && window.ICAL) return window.ICAL;
  if (typeof require === "function") return require("ical.js");
  throw new Error("ical.js not available — window.ICAL is not set and require() is unavailable");
}

const DOW_ICS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// First date matching the RRULE — calendar apps key off this so DTSTART
// must fall on a date the RRULE actually expands to (Apple Calendar in
// particular silently drops events whose DTSTART doesn't match BYDAY).
function firstOccurrence(freq, today) {
  if (!freq || freq.type === "daily") return new Date(today);
  if (freq.type === "weekdays" || freq.type === "weekly") {
    const targets = freq.type === "weekdays"
      ? (Array.isArray(freq.days) ? freq.days : [])
      : (typeof freq.day === "number" ? [freq.day] : []);
    if (!targets.length) return new Date(today);
    for (let i = 0; i < 14; i++) {
      const c = new Date(today);
      c.setDate(today.getDate() + i);
      if (targets.includes(c.getDay())) return c;
    }
    return new Date(today);
  }
  if (freq.type === "monthly") {
    const md = freq.monthDay || 1;
    const c = new Date(today.getFullYear(), today.getMonth(), md);
    if (c < today) c.setMonth(c.getMonth() + 1);
    return c;
  }
  if (freq.type === "quarterly") {
    const md = freq.monthDay || 1;
    const m  = typeof freq.month === "number" ? freq.month : today.getMonth();
    let c = new Date(today.getFullYear(), m, md);
    while (c < today) c.setMonth(c.getMonth() + 3);
    return c;
  }
  if (freq.type === "annual") {
    const md = freq.monthDay || 1;
    const m  = typeof freq.month === "number" ? freq.month : 0;
    let c = new Date(today.getFullYear(), m, md);
    if (c < today) c = new Date(today.getFullYear() + 1, m, md);
    return c;
  }
  return new Date(today);
}

// Recurrence (RRULE) derives directly from habit.frequency. The ICAL.Recur
// constructor accepts a jCal-style options object — ical.js serialises it
// to the canonical FREQ=…;… form below.
//   daily      → FREQ=DAILY
//   weekdays   → FREQ=WEEKLY;BYDAY=MO,WE,FR…
//   weekly     → FREQ=WEEKLY;BYDAY=<one day>  (or bare FREQ=WEEKLY if no .day)
//   monthly    → FREQ=MONTHLY;BYMONTHDAY=<n>
//   quarterly  → FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=<n>
//   annual     → FREQ=YEARLY;BYMONTH=<m>;BYMONTHDAY=<n>
function buildRecur(ICAL, freq) {
  if (!freq || freq.type === "daily") return new ICAL.Recur({ freq: "DAILY" });
  if (freq.type === "weekdays") {
    const days = (freq.days || []).map(d => DOW_ICS[d]).filter(Boolean);
    return days.length
      ? new ICAL.Recur({ freq: "WEEKLY", byday: days })
      : new ICAL.Recur({ freq: "DAILY" });
  }
  if (freq.type === "weekly") {
    return typeof freq.day === "number"
      ? new ICAL.Recur({ freq: "WEEKLY", byday: [DOW_ICS[freq.day]] })
      : new ICAL.Recur({ freq: "WEEKLY" });
  }
  if (freq.type === "monthly") {
    return new ICAL.Recur({ freq: "MONTHLY", bymonthday: [freq.monthDay || 1] });
  }
  if (freq.type === "quarterly") {
    return new ICAL.Recur({ freq: "MONTHLY", interval: 3, bymonthday: [freq.monthDay || 1] });
  }
  if (freq.type === "annual") {
    return new ICAL.Recur({
      freq: "YEARLY",
      bymonth:    [(freq.month || 0) + 1],
      bymonthday: [freq.monthDay || 1]
    });
  }
  return new ICAL.Recur({ freq: "DAILY" });
}

// Importance → iCalendar PRIORITY mapping. RFC 5545 priority is 0–9 where
// 1 is highest, 5 is normal, 9 is lowest. Most calendar apps surface this
// as a flag/icon on the event.
function priorityFor(imp) {
  if (imp === "Non-Negotiable") return 1;
  if (imp === "Additive")       return 7;
  return 5;
}

function buildICS(habitTimes, opts) {
  const ICAL = getICAL();
  const tzid = (opts && opts.tzid) || "UTC";

  const vcal = new ICAL.Component(["vcalendar", [], []]);
  vcal.updatePropertyWithValue("version", "2.0");
  vcal.updatePropertyWithValue("prodid", "-//Verrocchio//Habits//EN");
  vcal.updatePropertyWithValue("calscale", "GREGORIAN");
  vcal.updatePropertyWithValue("method", "PUBLISH");
  vcal.updatePropertyWithValue("x-wr-calname", "Verrocchio Habits");
  vcal.updatePropertyWithValue("x-wr-timezone", tzid);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Single DTSTAMP per export — every VEVENT shares the same generation
  // timestamp (matches the hand-rolled behaviour).
  const dtstampNow = ICAL.Time.fromJSDate(new Date(), true);

  for (const ht of habitTimes) {
    const h = ht.habit;
    const freq = h && h.frequency ? h.frequency : { type: "daily" };
    const first = firstOccurrence(freq, today);
    // Has-children check: members holds either the children (when present)
    // or just [parent], so length > 1 means this is a parent with sub-habits.
    const hasChildren = ht.members && ht.members.length > 1;

    const vevent = new ICAL.Component("vevent");
    const event = new ICAL.Event(vevent);

    event.uid = (h.id || ("h-" + Math.random().toString(36).slice(2, 10))) + "@verrocchio.app";
    event.summary = h.text || "Habit";

    // DESCRIPTION assembly.
    //   Parent with kids: bullet list of sub-habits, then a footer line
    //                     with total minutes + sub-habit count.
    //   Childless habit:  inline "importance · type · duration" line.
    let description;
    if (hasChildren) {
      const bullets = ht.members.map(m => {
        const min = parseInt(m.duration, 10);
        return "• " + m.text + (isFinite(min) && min > 0 ? " (" + min + " min)" : "");
      }).join("\n");
      const footer = ht.durationMin + " min total · " + ht.members.length + " sub-habits";
      description = bullets + "\n\n" + footer;
    } else {
      const parts = [];
      if (h.importance) parts.push(h.importance);
      if (h.type)       parts.push(h.type);
      if (h.duration)   parts.push(h.duration + " min");
      description = parts.join(" · ");
    }
    if (description) event.description = description;

    // Local-time DTSTART/DTEND. Passing `useUTC=false` to fromJSDate keeps
    // the wall-clock time; we then attach TZID via the property parameter
    // so calendar clients render it in the user's zone.
    const start = new Date(first);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(ht.startMin);
    const end = new Date(start.getTime() + ht.durationMin * 60000);
    event.startDate = ICAL.Time.fromJSDate(start, false);
    event.endDate   = ICAL.Time.fromJSDate(end,   false);
    vevent.getFirstProperty("dtstart").setParameter("tzid", tzid);
    vevent.getFirstProperty("dtend").setParameter("tzid", tzid);

    // DTSTAMP — ical.js doesn't auto-add this, even though RFC 5545 requires
    // it on every VEVENT. Set it explicitly.
    vevent.updatePropertyWithValue("dtstamp", dtstampNow);

    // PRIORITY (RFC 5545 integer 0–9).
    vevent.updatePropertyWithValue("priority", priorityFor(h.importance));

    // CATEGORIES — multi-value list of type + importance tags. Calendar
    // clients use these for filtering / colour-coding.
    const categories = [];
    if (h.type)       categories.push(h.type);
    if (h.importance) categories.push(h.importance);
    if (categories.length) {
      const catProp = new ICAL.Property("categories", vevent);
      catProp.setValues(categories);
      vevent.addProperty(catProp);
    }

    // RRULE — single Recur per VEVENT, set via updatePropertyWithValue so
    // ical.js serialises it to the canonical FREQ=…;… form.
    vevent.updatePropertyWithValue("rrule", buildRecur(ICAL, freq));

    // VALARM — 5-minute display reminder before each event. ical.js doesn't
    // expose a dedicated Alarm API in v2, so we build the subcomponent
    // directly. ICAL.Duration.fromString handles the trigger value.
    const valarm = new ICAL.Component("valarm");
    valarm.updatePropertyWithValue("action", "DISPLAY");
    valarm.updatePropertyWithValue("description", h.text || "Habit");
    valarm.updatePropertyWithValue("trigger", ICAL.Duration.fromString("-PT5M"));
    vevent.addSubcomponent(valarm);

    vcal.addSubcomponent(vevent);
  }

  // ical.js emits LF-terminated lines; RFC 5545 (and every real calendar
  // client) requires CRLF. Convert any bare LF to CRLF and ensure a trailing
  // CRLF so the file matches the hand-rolled output's wire format.
  let out = vcal.toString();
  out = out.replace(/\r?\n/g, "\r\n");
  if (!out.endsWith("\r\n")) out += "\r\n";
  return out;
}

// CommonJS export for Node-side tests. The `typeof module` guard means the
// browser path (no CommonJS) is untouched, so buildICS stays available as
// a Script-scope global to the inline app code in index.html.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildICS };
}
