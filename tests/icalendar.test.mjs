// Pinned-behavior tests for the iCalendar export. The hand-rolled
// VEVENT-string builder used to be inline in index.html (Phase 2 OSS-port
// Port #4). This suite locks in the EXISTING behavior so the extraction +
// ical.js rewrite cannot silently regress RRULEs, PRIORITY mapping,
// VALARM, DESCRIPTION formatting, or escaping. Every test parses the
// generated ICS with ical.js and asserts on properties — the tests are
// behaviour-level, not byte-level.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildICS } = require("../lib/icalendar.js");
const ICAL = require("ical.js");

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

// Builds a minimal `habitTime` record matching the shape that the inline
// exportHabitsICS prepares: { habit, members, durationMin, startMin, allDay }.
// startMin / durationMin both default to sensible values. `members` defaults
// to `[habit]` (no children).
function ht(habit, overrides = {}) {
  return {
    habit,
    members: overrides.members || [habit],
    durationMin: overrides.durationMin != null ? overrides.durationMin : 30,
    startMin: overrides.startMin != null ? overrides.startMin : 6 * 60,
    allDay: overrides.allDay === true
  };
}

function parseVCal(icsText) {
  const jcal = ICAL.parse(icsText);
  return new ICAL.Component(jcal);
}

function firstVEvent(icsText) {
  return parseVCal(icsText).getFirstSubcomponent("vevent");
}

function rrulePropValue(vevent) {
  // ical.js exposes RRULE as a structured value. .getFirstPropertyValue
  // returns an ICAL.Recur instance whose toString gives the canonical form.
  const v = vevent.getFirstPropertyValue("rrule");
  return v ? v.toString() : null;
}

function commonOpts() {
  return { tzid: "America/New_York" };
}

// ─────────────────────────────────────────────────────────────────────────
// Calendar envelope
// ─────────────────────────────────────────────────────────────────────────

test("envelope: PRODID, VERSION, METHOD, X-WR-CALNAME, X-WR-TIMEZONE", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning",
    frequency: { type: "daily" }
  })], commonOpts());
  const vcal = parseVCal(ics);
  assert.equal(vcal.name, "vcalendar");
  assert.equal(vcal.getFirstPropertyValue("version"), "2.0");
  assert.match(String(vcal.getFirstPropertyValue("prodid")), /Verrocchio/);
  assert.equal(vcal.getFirstPropertyValue("method"), "PUBLISH");
  assert.equal(vcal.getFirstPropertyValue("calscale"), "GREGORIAN");
  assert.equal(vcal.getFirstPropertyValue("x-wr-calname"), "Verrocchio Habits");
  assert.equal(vcal.getFirstPropertyValue("x-wr-timezone"), "America/New_York");
});

test("output uses CRLF line endings and ends with CRLF", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning", frequency: { type: "daily" }
  })], commonOpts());
  // Must contain CRLF between properties.
  assert.ok(ics.includes("\r\n"), "ICS should use CRLF line endings");
  // Must end with CRLF (ICS spec).
  assert.ok(ics.endsWith("\r\n"), "ICS should end with CRLF");
});

// ─────────────────────────────────────────────────────────────────────────
// RRULE branches (every frequency.type)
// ─────────────────────────────────────────────────────────────────────────

test("RRULE: daily habit → FREQ=DAILY", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning",
    frequency: { type: "daily" }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=DAILY/);
});

test("RRULE: weekly habit with .day=2 → FREQ=WEEKLY;BYDAY=TU", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Therapy", section: "afternoon",
    frequency: { type: "weekly", day: 2 }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=WEEKLY/);
  assert.match(rrule, /BYDAY=TU/);
});

test("RRULE: weekly habit with no .day → FREQ=WEEKLY (no BYDAY)", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Whenever", section: "morning",
    frequency: { type: "weekly" }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=WEEKLY/);
  assert.ok(!/BYDAY/.test(rrule), "no BYDAY when day is missing");
});

test("RRULE: weekdays habit Mon/Wed/Fri → FREQ=WEEKLY;BYDAY=MO,WE,FR", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Gym", section: "morning",
    frequency: { type: "weekdays", days: [1, 3, 5] }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=WEEKLY/);
  // ical.js may reorder BYDAY canonically; just assert each token is present.
  for (const d of ["MO", "WE", "FR"]) {
    assert.match(rrule, new RegExp("BYDAY=[A-Z,]*" + d));
  }
});

test("RRULE: weekdays habit with empty days → falls back to FREQ=DAILY", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Whatever", section: "morning",
    frequency: { type: "weekdays", days: [] }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=DAILY/);
});

test("RRULE: monthly day-15 → FREQ=MONTHLY;BYMONTHDAY=15", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Pay bills", section: "morning",
    frequency: { type: "monthly", monthDay: 15 }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=MONTHLY/);
  assert.match(rrule, /BYMONTHDAY=15/);
});

test("RRULE: quarterly → FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=...", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Quarterly review", section: "morning",
    frequency: { type: "quarterly", monthDay: 1 }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=MONTHLY/);
  assert.match(rrule, /INTERVAL=3/);
  assert.match(rrule, /BYMONTHDAY=1/);
});

test("RRULE: annual → FREQ=YEARLY;BYMONTH=...;BYMONTHDAY=...", () => {
  // month is 0-indexed in habit.frequency; ICS BYMONTH is 1-indexed,
  // so freq.month=2 (March) must render BYMONTH=3.
  const ics = buildICS([ht({
    id: "h1", text: "Annual checkup", section: "morning",
    frequency: { type: "annual", month: 2, monthDay: 14 }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=YEARLY/);
  assert.match(rrule, /BYMONTH=3/);
  assert.match(rrule, /BYMONTHDAY=14/);
});

test("RRULE: weekly-day alias collapses to weekly (via getFreq-equivalent input)", () => {
  // exportHabitsICS calls getFreq(h) which normalises "weekly-day" → "weekly".
  // The pure buildICS sees only normalised frequency objects, so the test
  // passes the normalised shape — same as production.
  const ics = buildICS([ht({
    id: "h1", text: "Movie night", section: "evening",
    frequency: { type: "weekly", day: 5 }
  })], commonOpts());
  const rrule = rrulePropValue(firstVEvent(ics));
  assert.match(rrule, /FREQ=WEEKLY/);
  assert.match(rrule, /BYDAY=FR/);
});

// ─────────────────────────────────────────────────────────────────────────
// PRIORITY
// ─────────────────────────────────────────────────────────────────────────

test("PRIORITY: Non-Negotiable → 1", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Meds", section: "morning",
    frequency: { type: "daily" }, importance: "Non-Negotiable"
  })], commonOpts());
  assert.equal(firstVEvent(ics).getFirstPropertyValue("priority"), 1);
});

test("PRIORITY: Additive → 7", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Read", section: "evening",
    frequency: { type: "daily" }, importance: "Additive"
  })], commonOpts());
  assert.equal(firstVEvent(ics).getFirstPropertyValue("priority"), 7);
});

test("PRIORITY: anything else → 5", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning",
    frequency: { type: "daily" }
  })], commonOpts());
  assert.equal(firstVEvent(ics).getFirstPropertyValue("priority"), 5);
});

// ─────────────────────────────────────────────────────────────────────────
// VALARM (5-minute reminder before each event)
// ─────────────────────────────────────────────────────────────────────────

test("VALARM: every timed VEVENT carries a -PT5M display alarm", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning",
    frequency: { type: "daily" }
  })], commonOpts());
  const vevent = firstVEvent(ics);
  const valarm = vevent.getFirstSubcomponent("valarm");
  assert.ok(valarm, "VALARM subcomponent present");
  assert.equal(valarm.getFirstPropertyValue("action"), "DISPLAY");
  const trigger = valarm.getFirstPropertyValue("trigger");
  // ical.js parses TRIGGER:-PT5M as a Duration with isNegative + minutes=5.
  // Stringified, it round-trips to "-PT5M".
  assert.equal(String(trigger), "-PT5M");
});

// ─────────────────────────────────────────────────────────────────────────
// SUMMARY + DESCRIPTION
// ─────────────────────────────────────────────────────────────────────────

test("SUMMARY: habit text becomes SUMMARY (escaped on the wire)", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run; eat, sleep\nrepeat",
    section: "morning", frequency: { type: "daily" }
  })], commonOpts());
  // ical.js handles the unescape on parse — assert on the parsed value.
  assert.equal(firstVEvent(ics).getFirstPropertyValue("summary"), "Run; eat, sleep\nrepeat");
});

test("DESCRIPTION: single habit lists importance · type · duration", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning",
    frequency: { type: "daily" },
    importance: "Non-Negotiable", type: "Physical", duration: 30
  })], commonOpts());
  const desc = firstVEvent(ics).getFirstPropertyValue("description");
  assert.match(desc, /Non-Negotiable/);
  assert.match(desc, /Physical/);
  assert.match(desc, /30 min/);
});

test("DESCRIPTION: parent with sub-habits lists each on its own line", () => {
  const parent = { id: "p1", text: "Morning routine", section: "morning", frequency: { type: "daily" } };
  const kids = [
    { id: "k1", text: "Brush teeth", duration: 5, parentId: "p1" },
    { id: "k2", text: "Comb hair",   duration: 3, parentId: "p1" },
    { id: "k3", text: "Stretch",     duration: 7, parentId: "p1" }
  ];
  const ics = buildICS([
    ht(parent, { members: kids, durationMin: 15, startMin: 6 * 60 })
  ], commonOpts());
  const desc = firstVEvent(ics).getFirstPropertyValue("description");
  assert.match(desc, /Brush teeth/);
  assert.match(desc, /Comb hair/);
  assert.match(desc, /Stretch/);
  // Bullet list marker from the hand-rolled implementation: "• ".
  assert.match(desc, /•/);
  // Footer line with total + count.
  assert.match(desc, /15 min total/);
  assert.match(desc, /3 sub-habits/);
});

// ─────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────

test("CATEGORIES: includes type and importance", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning",
    frequency: { type: "daily" }, type: "Physical", importance: "Non-Negotiable"
  })], commonOpts());
  // ical.js exposes CATEGORIES multi-values via Property.getValues().
  // getFirstPropertyValue would only return the first category.
  const prop = firstVEvent(ics).getFirstProperty("categories");
  const cats = prop ? prop.getValues() : [];
  const flat = cats.join(",");
  assert.match(flat, /Physical/);
  assert.match(flat, /Non-Negotiable/);
});

// ─────────────────────────────────────────────────────────────────────────
// UID + DTSTAMP
// ─────────────────────────────────────────────────────────────────────────

test("UID: derived from habit.id and @verrocchio.app domain", () => {
  const ics = buildICS([ht({
    id: "h-abc", text: "Run", section: "morning", frequency: { type: "daily" }
  })], commonOpts());
  const uid = firstVEvent(ics).getFirstPropertyValue("uid");
  assert.equal(uid, "h-abc@verrocchio.app");
});

test("DTSTAMP: present and parseable as UTC", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning", frequency: { type: "daily" }
  })], commonOpts());
  const stamp = firstVEvent(ics).getFirstPropertyValue("dtstamp");
  // ical.js parses DTSTAMP into an ICAL.Time. Confirm it's a valid time.
  assert.ok(stamp, "DTSTAMP present");
  // ICAL.Time stringifies to the wire format (with optional dashes/colons).
  assert.match(String(stamp), /^\d{4}-?\d{2}-?\d{2}T\d{2}:?\d{2}:?\d{2}Z$/);
});

// ─────────────────────────────────────────────────────────────────────────
// DTSTART / DTEND
// ─────────────────────────────────────────────────────────────────────────

test("DTSTART: TZID parameter is set to the requested tzid", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning", frequency: { type: "daily" }
  }, { startMin: 6 * 60, durationMin: 30 })], { tzid: "Europe/London" });
  const vevent = firstVEvent(ics);
  const dtstart = vevent.getFirstProperty("dtstart");
  assert.equal(dtstart.getParameter("tzid"), "Europe/London");
});

test("DTEND: equals DTSTART + durationMin (30 min after 6:00 → 6:30)", () => {
  const ics = buildICS([ht({
    id: "h1", text: "Run", section: "morning", frequency: { type: "daily" }
  }, { startMin: 6 * 60, durationMin: 30 })], commonOpts());
  const vevent = firstVEvent(ics);
  const start = vevent.getFirstPropertyValue("dtstart");
  const end   = vevent.getFirstPropertyValue("dtend");
  // ICAL.Time exposes hour/minute properties.
  assert.equal(start.hour, 6);
  assert.equal(start.minute, 0);
  assert.equal(end.hour, 6);
  assert.equal(end.minute, 30);
});

// ─────────────────────────────────────────────────────────────────────────
// Multiple events
// ─────────────────────────────────────────────────────────────────────────

test("multiple habits produce one VEVENT each", () => {
  const ics = buildICS([
    ht({ id: "h1", text: "Run",  section: "morning",   frequency: { type: "daily" } }),
    ht({ id: "h2", text: "Read", section: "evening",   frequency: { type: "daily" } }, { startMin: 18 * 60 }),
    ht({ id: "h3", text: "Yoga", section: "afternoon", frequency: { type: "weekly", day: 0 } }, { startMin: 12 * 60 })
  ], commonOpts());
  const events = parseVCal(ics).getAllSubcomponents("vevent");
  assert.equal(events.length, 3);
});
