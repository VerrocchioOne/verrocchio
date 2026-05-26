// Pinned-behavior tests for lib/domains/habits.js — Phase B of v75 view
// extraction. Mirrors the test conventions in tests/merge.test.mjs:
//   - node:test runner
//   - node:assert/strict
//   - createRequire bootstrap for the CJS domain module
//   - AAA (Arrange / Act / Assert) per case
//
// Scope: READ-side derivations only (groupedBySection, dueToday,
// sectionRowsForRender, upcomingHabits, isDueOn). WRITE-side helpers
// stay in App and are not in scope here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { habitsDomain } = require("../../lib/domains/habits.js");

const TODAY = "2026-05-23"; // Saturday (per project memory date).
const PAST_DAY = "2026-05-20"; // Wednesday
const FUTURE_DAY = "2026-06-15";

// ─────────────────────────────────────────────────────────────────────────
// groupedBySection
// ─────────────────────────────────────────────────────────────────────────

test("groupedBySection: groups active single-slot habits by their section", () => {
  // Arrange
  const data = {
    habits: [
      { id: "h1", text: "Run",     section: "morning" },
      { id: "h2", text: "Read",    section: "evening" },
      { id: "h3", text: "Email",   section: "morning" },
      { id: "h4", text: "Avoid X", section: "avoid" }
    ]
  };
  // Act
  const grouped = habitsDomain.groupedBySection(data);
  // Assert
  assert.deepEqual(grouped.morning.map(h => h.id), ["h1", "h3"]);
  assert.deepEqual(grouped.evening.map(h => h.id), ["h2"]);
  assert.deepEqual(grouped.afternoon, []);
  assert.deepEqual(grouped.avoid.map(h => h.id), ["h4"]);
});

test("groupedBySection: multi-slot habit appears in every section its slotSections lists", () => {
  // A two-slot habit covering morning + evening should appear in both
  // groups exactly once each. Duplicate-section slots ("morning","morning")
  // dedupe at the section-membership level — per-slot row expansion is
  // sectionRowsForRender's job.
  // Arrange
  const data = {
    habits: [
      { id: "ms", text: "Study", section: "morning", slotSections: ["morning", "evening"] },
      { id: "dup", text: "Drill", section: "morning", slotSections: ["morning", "morning", "evening"] }
    ]
  };
  // Act
  const grouped = habitsDomain.groupedBySection(data);
  // Assert
  assert.deepEqual(grouped.morning.map(h => h.id), ["ms", "dup"]);
  assert.deepEqual(grouped.evening.map(h => h.id), ["ms", "dup"]);
  // Same habit only listed once per section.
  assert.equal(grouped.morning.filter(h => h.id === "dup").length, 1);
});

test("groupedBySection: child habits (parentId set) are skipped", () => {
  // Arrange
  const data = {
    habits: [
      { id: "p",  text: "Parent",  section: "morning" },
      { id: "c1", text: "Child",   section: "morning", parentId: "p" }
    ]
  };
  // Act
  const grouped = habitsDomain.groupedBySection(data);
  // Assert
  assert.deepEqual(grouped.morning.map(h => h.id), ["p"]);
});

test("groupedBySection: missing habits array returns empty section buckets", () => {
  // Arrange
  const data = {};
  // Act
  const grouped = habitsDomain.groupedBySection(data);
  // Assert — all four canonical sections present, all empty.
  assert.deepEqual(grouped.morning, []);
  assert.deepEqual(grouped.afternoon, []);
  assert.deepEqual(grouped.evening, []);
  assert.deepEqual(grouped.avoid, []);
});

// ─────────────────────────────────────────────────────────────────────────
// dueToday — respects frequency types
// ─────────────────────────────────────────────────────────────────────────

test("dueToday: daily habits are always due", () => {
  // Arrange
  const data = {
    habits: [
      { id: "d", text: "Daily",  section: "morning", frequency: { type: "daily" } },
      { id: "n", text: "NoFreq", section: "morning" } // defaults to daily
    ]
  };
  // Act
  const due = habitsDomain.dueToday(data, TODAY);
  // Assert
  assert.deepEqual(due.map(h => h.id), ["d", "n"]);
});

test("dueToday: weekly habit due only on its anchor day", () => {
  // TODAY = 2026-05-23 (Saturday, dow=6). A weekly habit anchored to
  // Saturday is due; a weekly habit anchored to Monday is not.
  // Arrange
  const data = {
    habits: [
      { id: "sat", text: "Sat",  section: "morning", frequency: { type: "weekly", day: 6 } },
      { id: "mon", text: "Mon",  section: "morning", frequency: { type: "weekly", day: 1 } }
    ]
  };
  // Act
  const due = habitsDomain.dueToday(data, TODAY);
  // Assert
  assert.deepEqual(due.map(h => h.id), ["sat"]);
});

test("dueToday: weekdays habit due only on listed days-of-week", () => {
  // Saturday (dow 6) — included in [0,6], excluded from [1,2,3,4,5].
  // Arrange
  const data = {
    habits: [
      { id: "weekend", text: "Weekend", section: "morning", frequency: { type: "weekdays", days: [0, 6] } },
      { id: "weekday", text: "Weekday", section: "morning", frequency: { type: "weekdays", days: [1, 2, 3, 4, 5] } }
    ]
  };
  // Act
  const due = habitsDomain.dueToday(data, TODAY);
  // Assert
  assert.deepEqual(due.map(h => h.id), ["weekend"]);
});

test("dueToday: avoid-section habits are always returned regardless of frequency", () => {
  // An avoid habit with a weekly schedule that DOESN'T match today still
  // shows up — you can't be "off-schedule" for not doing something.
  // Arrange
  const data = {
    habits: [
      { id: "av", text: "Avoid", section: "avoid", frequency: { type: "weekly", day: 1 } } // anchored Monday
    ]
  };
  // Act
  const due = habitsDomain.dueToday(data, TODAY); // Saturday
  // Assert
  assert.deepEqual(due.map(h => h.id), ["av"]);
});

test("dueToday: parked and date-future habits are excluded", () => {
  // Arrange
  const data = {
    habits: [
      { id: "active", text: "Active", section: "morning" },
      { id: "parked", text: "Parked", section: "morning", parked: true },
      { id: "future", text: "Future", section: "morning", startDate: FUTURE_DAY }
    ]
  };
  // Act
  const due = habitsDomain.dueToday(data, TODAY);
  // Assert — only the active one survives the future-habit filter.
  assert.deepEqual(due.map(h => h.id), ["active"]);
});

// ─────────────────────────────────────────────────────────────────────────
// sectionRowsForRender — multi-slot habit row expansion
// ─────────────────────────────────────────────────────────────────────────

test("sectionRowsForRender: multi-slot habit expands into one row per matching slot, sorted by slotOrders/_order", () => {
  // Habit "study" has slotSections ["morning","morning","evening"]. In
  // the morning section we should see TWO rows (slotArrayIdx 0 and 1);
  // in evening we should see ONE row (slotArrayIdx 2). slotOrders pins
  // explicit positions per slot.
  // Arrange
  const data = {
    habits: [
      { id: "run",   text: "Run",   section: "morning", _order: 0 },
      { id: "study", text: "Study", section: "morning", _order: 2, slotSections: ["morning", "morning", "evening"], slotOrders: [1, 3, 0] },
      { id: "read",  text: "Read",  section: "evening", _order: 5 }
    ]
  };
  // Act
  const morningRows = habitsDomain.sectionRowsForRender(data, "morning");
  const eveningRows = habitsDomain.sectionRowsForRender(data, "evening");
  // Assert — morning has 3 rows total (run + 2 study slots), sorted
  // by effOrder: run(0), study/slot0(1), study/slot1(3).
  assert.equal(morningRows.length, 3);
  assert.deepEqual(morningRows[0], { habitId: "run",   slotArrayIdx: -1, effOrder: 0 });
  assert.deepEqual(morningRows[1], { habitId: "study", slotArrayIdx: 0,  effOrder: 1 });
  assert.deepEqual(morningRows[2], { habitId: "study", slotArrayIdx: 1,  effOrder: 3 });
  // Evening has 2 rows: study/slot2(0) before read(5).
  assert.equal(eveningRows.length, 2);
  assert.deepEqual(eveningRows[0], { habitId: "study", slotArrayIdx: 2,  effOrder: 0 });
  assert.deepEqual(eveningRows[1], { habitId: "read",  slotArrayIdx: -1, effOrder: 5 });
});

test("sectionRowsForRender: multi-slot habit without slotOrders falls back to habit _order for every slot", () => {
  // No slotOrders → every slot inherits h._order. This is the legacy
  // pre-v74 shape; the renderer must still produce one row per matching
  // slot so the v74 per-slot UI doesn't break on old data.
  // Arrange
  const data = {
    habits: [
      { id: "legacy", text: "Legacy", section: "morning", _order: 5, slotSections: ["morning", "morning"] }
    ]
  };
  // Act
  const rows = habitsDomain.sectionRowsForRender(data, "morning");
  // Assert
  assert.equal(rows.length, 2);
  assert.equal(rows[0].habitId, "legacy");
  assert.equal(rows[1].habitId, "legacy");
  assert.equal(rows[0].effOrder, 5);
  assert.equal(rows[1].effOrder, 5);
  // Both slot rows present (arrayIdx 0 and 1, in stable order).
  const idxs = rows.map(r => r.slotArrayIdx).sort((a, b) => a - b);
  assert.deepEqual(idxs, [0, 1]);
});

test("sectionRowsForRender: child habits are excluded", () => {
  // Arrange
  const data = {
    habits: [
      { id: "p", text: "Parent", section: "morning", _order: 0 },
      { id: "c", text: "Child",  section: "morning", _order: 1, parentId: "p" }
    ]
  };
  // Act
  const rows = habitsDomain.sectionRowsForRender(data, "morning");
  // Assert
  assert.equal(rows.length, 1);
  assert.equal(rows[0].habitId, "p");
});

// ─────────────────────────────────────────────────────────────────────────
// upcomingHabits — filters by startDate / parked flag
// ─────────────────────────────────────────────────────────────────────────

test("upcomingHabits: includes parked habits AND habits with startDate strictly after todayKey", () => {
  // Arrange
  const data = {
    habits: [
      { id: "active",  text: "Active",   section: "morning" },
      { id: "parked",  text: "Parked",   section: "morning", parked: true },
      { id: "future",  text: "Future",   section: "morning", startDate: FUTURE_DAY },
      { id: "started", text: "Started",  section: "morning", startDate: PAST_DAY },
      { id: "starting", text: "StartsToday", section: "morning", startDate: TODAY }
    ]
  };
  // Act
  const upcoming = habitsDomain.upcomingHabits(data, TODAY);
  // Assert — parked + strictly-future only. A habit that starts TODAY
  // is already active (matches isFutureHabit's `> todayKey` strict check).
  const ids = upcoming.map(h => h.id).sort();
  assert.deepEqual(ids, ["future", "parked"]);
});

test("upcomingHabits: child habits (parentId) are skipped even when future", () => {
  // Arrange
  const data = {
    habits: [
      { id: "p",  text: "Parent",      section: "morning" },
      { id: "fc", text: "FutureChild", section: "morning", parentId: "p", parked: true }
    ]
  };
  // Act
  const upcoming = habitsDomain.upcomingHabits(data, TODAY);
  // Assert
  assert.deepEqual(upcoming, []);
});

// ─────────────────────────────────────────────────────────────────────────
// isDueOn — exposed for the view; pins frequency-type semantics
// ─────────────────────────────────────────────────────────────────────────

test("isDueOn: malformed date key falls through to true (don't hide on uncertainty)", () => {
  // Arrange
  const h = { frequency: { type: "weekly", day: 1 } };
  // Act + Assert
  assert.equal(habitsDomain.isDueOn(h, "garbage"), true);
  assert.equal(habitsDomain.isDueOn(h, ""), true);
  assert.equal(habitsDomain.isDueOn(h, null), true);
});

test("isDueOn: monthly habit due only on its monthDay", () => {
  // Arrange
  const h = { frequency: { type: "monthly", monthDay: 23 } };
  // Act + Assert
  assert.equal(habitsDomain.isDueOn(h, "2026-05-23"), true);
  assert.equal(habitsDomain.isDueOn(h, "2026-05-22"), false);
});

test("isDueOn: legacy weekly-day type is normalized to weekly", () => {
  // Pre-v?? data may carry "weekly-day" — the getFreq compat shim must
  // route it through the same anchor-day check used by "weekly".
  // Arrange
  const h = { frequency: { type: "weekly-day", day: 6 } }; // Saturday
  // Act + Assert
  assert.equal(habitsDomain.isDueOn(h, "2026-05-23"), true);  // Saturday
  assert.equal(habitsDomain.isDueOn(h, "2026-05-25"), false); // Monday
});

// ─────────────────────────────────────────────────────────────────────────
// appWideStreak — global "any habit done" streak across all habits
// ─────────────────────────────────────────────────────────────────────────

// Pin "now" to local noon on 2026-05-25 so day-0 / day-1 / day-2 keys
// are stable irrespective of timezone.
const APP_STREAK_NOW = new Date(2026, 4, 25, 12, 0, 0);

test("appWideStreak counts consecutive days with ANY positive completion across habits", () => {
  // Arrange — two habits cover the last 3 days between them, with no gaps
  const habits = [
    { id: 1, completions: { "2026-05-25": "done", "2026-05-23": "done" } },
    { id: 2, completions: { "2026-05-24": "done" } }
  ];
  // Act
  const out = habitsDomain.appWideStreak(habits, { now: APP_STREAK_NOW });
  // Assert — streak walks back today, yesterday, day-before — 3
  assert.equal(out, 3);
});

test("appWideStreak allows today (day 0) to be blank without breaking the streak", () => {
  // Arrange — no completion today, but yesterday + 2 days ago are filled
  const habits = [
    { id: 1, completions: { "2026-05-24": "done", "2026-05-23": "done" } }
  ];
  // Act
  // Assert — today blank is OK; streak is 2 (yesterday + day-before)
  assert.equal(habitsDomain.appWideStreak(habits, { now: APP_STREAK_NOW }), 2);
});

test("appWideStreak breaks on the first blank day after a started streak", () => {
  // Arrange — today filled, yesterday blank, day-before filled
  const habits = [
    { id: 1, completions: { "2026-05-25": "done", "2026-05-23": "done" } }
  ];
  // Act
  // Assert — only today counts; the blank yesterday breaks the chain
  assert.equal(habitsDomain.appWideStreak(habits, { now: APP_STREAK_NOW }), 1);
});

test("appWideStreak excludes parked habits from the union", () => {
  // Arrange — every recent completion is on a parked habit
  const habits = [
    { id: 1, parked: true,  completions: { "2026-05-25": "done", "2026-05-24": "done" } },
    { id: 2, parked: false, completions: {} } // active but blank
  ];
  // Act
  // Assert — the only active habit has no completions, so streak is 0
  assert.equal(habitsDomain.appWideStreak(habits, { now: APP_STREAK_NOW }), 0);
});

test("appWideStreak returns 0 when there are no non-parked habits at all", () => {
  assert.equal(habitsDomain.appWideStreak([], { now: APP_STREAK_NOW }), 0);
  assert.equal(habitsDomain.appWideStreak([{ id: 1, parked: true }], { now: APP_STREAK_NOW }), 0);
  assert.equal(habitsDomain.appWideStreak(null, { now: APP_STREAK_NOW }), 0);
  assert.equal(habitsDomain.appWideStreak(undefined, { now: APP_STREAK_NOW }), 0);
});

test("appWideStreak respects a custom windowDays cap", () => {
  // Arrange — 5 consecutive days going back from today
  const days = ["2026-05-25", "2026-05-24", "2026-05-23", "2026-05-22", "2026-05-21"];
  const completions = {};
  days.forEach(k => completions[k] = "done");
  const habits = [{ id: 1, completions }];
  // Act + Assert
  assert.equal(
    habitsDomain.appWideStreak(habits, { now: APP_STREAK_NOW, windowDays: 365 }),
    5,
    "wide window captures the full 5-day streak"
  );
  assert.equal(
    habitsDomain.appWideStreak(habits, { now: APP_STREAK_NOW, windowDays: 3 }),
    3,
    "narrow 3-day window caps the streak at 3"
  );
});

// ─────────────────────────────────────────────────────────────────────────
// sortAreasByProgress — Goals tab's "areas that need attention" order
// ─────────────────────────────────────────────────────────────────────────

// Synthetic getCR for deterministic tests: looks up the habit's own
// `.pct` field so tests can hand-pick the rate without building a real
// 30-day completion history.
const fakeCR = h => ({ pct: h && typeof h._pct === "number" ? h._pct : 0 });

test("sortAreasByProgress puts the lowest-average area first", () => {
  // Arrange — two areas; Mind avg = 30, Fitness avg = 80
  const habits = [
    { id: 1, type: "Mind",    _pct: 20 },
    { id: 2, type: "Mind",    _pct: 40 },
    { id: 3, type: "Fitness", _pct: 80 }
  ];
  const areas = [{ value: "Mind" }, { value: "Fitness" }];
  // Act
  const out = habitsDomain.sortAreasByProgress(habits, areas, { getCR: fakeCR });
  // Assert — Mind first (lower avg means "needs attention")
  assert.deepEqual(out.map(a => a.value), ["Mind", "Fitness"]);
});

test("sortAreasByProgress sorts areas with no habits to the very end (score = Infinity)", () => {
  const habits = [
    { id: 1, type: "Mind",    _pct: 60 },
    { id: 2, type: "Fitness", _pct: 30 }
  ];
  const areas = [{ value: "Empty" }, { value: "Mind" }, { value: "Fitness" }];
  const out = habitsDomain.sortAreasByProgress(habits, areas, { getCR: fakeCR });
  assert.equal(out[out.length - 1].value, "Empty", "Empty area lands at the end");
});

test("sortAreasByProgress excludes parked habits from each area's score", () => {
  // Arrange — Mind has one active habit at 10% and one parked at 100%.
  // Without the parked filter the avg would be 55; with it the avg is 10
  // and Mind sorts first (low) instead of last (high).
  const habits = [
    { id: 1, type: "Mind", parked: false, _pct: 10 },
    { id: 2, type: "Mind", parked: true,  _pct: 100 },
    { id: 3, type: "Fitness", _pct: 50 }
  ];
  const areas = [{ value: "Mind" }, { value: "Fitness" }];
  const out = habitsDomain.sortAreasByProgress(habits, areas, { getCR: fakeCR });
  assert.deepEqual(out.map(a => a.value), ["Mind", "Fitness"]);
});

test("sortAreasByProgress is stable for tied scores (preserves input order)", () => {
  // Arrange — every area has the same average. The output order MUST
  // match the input order; this is what the inline code's `return 0`
  // tie-breaker pinned.
  const habits = [
    { id: 1, type: "A", _pct: 50 },
    { id: 2, type: "B", _pct: 50 },
    { id: 3, type: "C", _pct: 50 }
  ];
  const areas = [{ value: "A" }, { value: "B" }, { value: "C" }];
  const out = habitsDomain.sortAreasByProgress(habits, areas, { getCR: fakeCR });
  assert.deepEqual(out.map(a => a.value), ["A", "B", "C"]);
});

test("sortAreasByProgress returns a new array (input not mutated)", () => {
  const habits = [{ id: 1, type: "B", _pct: 10 }, { id: 2, type: "A", _pct: 90 }];
  const areas = [{ value: "A" }, { value: "B" }];
  const before = areas.slice();
  habitsDomain.sortAreasByProgress(habits, areas, { getCR: fakeCR });
  assert.deepEqual(areas, before, "input areas array must remain unchanged");
});

test("sortAreasByProgress handles empty / null habits + areas without throwing", () => {
  assert.deepEqual(habitsDomain.sortAreasByProgress([], [], { getCR: fakeCR }), []);
  assert.deepEqual(habitsDomain.sortAreasByProgress(null, null, { getCR: fakeCR }), []);
  assert.deepEqual(
    habitsDomain.sortAreasByProgress(null, [{ value: "A" }], { getCR: fakeCR }).map(a => a.value),
    ["A"]
  );
});

// ─────────────────────────────────────────────────────────────────────────
// offScheduleHabits — filter + map wrapper around utils.js detectOffSchedule
// ─────────────────────────────────────────────────────────────────────────

// Synthetic detector: returns a tagged note when habit.text matches a
// known "off" pattern, else null. Mirrors detectOffSchedule's shape
// (caller filters out the nulls).
const fakeOff = h => (h && h.text && h.text.startsWith("OFF:"))
  ? { habitId: h.id, note: h.text }
  : null;

test("offScheduleHabits excludes parked habits", () => {
  const habits = [
    { id: 1, text: "OFF:A", parked: true,  section: "morning" },
    { id: 2, text: "OFF:B", parked: false, section: "morning" }
  ];
  const out = habitsDomain.offScheduleHabits(habits, { detectOffSchedule: fakeOff });
  assert.equal(out.length, 1);
  assert.equal(out[0].habitId, 2);
});

test("offScheduleHabits excludes 'avoid'-section habits", () => {
  const habits = [
    { id: 1, text: "OFF:A", section: "avoid"   },
    { id: 2, text: "OFF:B", section: "morning" }
  ];
  const out = habitsDomain.offScheduleHabits(habits, { detectOffSchedule: fakeOff });
  assert.equal(out.length, 1);
  assert.equal(out[0].habitId, 2);
});

test("offScheduleHabits drops null detector results (habits that are on-schedule)", () => {
  const habits = [
    { id: 1, text: "OFF:A", section: "morning" },
    { id: 2, text: "ON:fine", section: "morning" },
    { id: 3, text: "OFF:B", section: "morning" }
  ];
  const out = habitsDomain.offScheduleHabits(habits, { detectOffSchedule: fakeOff });
  assert.equal(out.length, 2);
  assert.deepEqual(out.map(o => o.habitId).sort(), [1, 3]);
});

test("offScheduleHabits returns [] when no detector is available + none was injected", () => {
  // Forcing the no-detector path by passing a non-function override.
  const habits = [{ id: 1, text: "OFF:A", section: "morning" }];
  assert.deepEqual(habitsDomain.offScheduleHabits(habits, { detectOffSchedule: null }), []);
});

test("offScheduleHabits handles empty / null / undefined input", () => {
  assert.deepEqual(habitsDomain.offScheduleHabits([],        { detectOffSchedule: fakeOff }), []);
  assert.deepEqual(habitsDomain.offScheduleHabits(null,      { detectOffSchedule: fakeOff }), []);
  assert.deepEqual(habitsDomain.offScheduleHabits(undefined, { detectOffSchedule: fakeOff }), []);
});

// ─────────────────────────────────────────────────────────────────────────
// isFutureHabit(h, todayKey)
// ─────────────────────────────────────────────────────────────────────────

const FUTURE_TODAY = "2026-05-26";

test("isFutureHabit returns false for a falsy habit", () => {
  assert.equal(habitsDomain.isFutureHabit(null, FUTURE_TODAY), false);
  assert.equal(habitsDomain.isFutureHabit(undefined, FUTURE_TODAY), false);
});

test("isFutureHabit returns true when the habit is parked, regardless of startDate", () => {
  assert.equal(habitsDomain.isFutureHabit({ parked: true }, FUTURE_TODAY), true);
  assert.equal(habitsDomain.isFutureHabit({ parked: true, startDate: "1999-01-01" }, FUTURE_TODAY), true);
});

test("isFutureHabit returns true when startDate is lexicographically after todayKey", () => {
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2026-05-27" }, FUTURE_TODAY), true);
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2026-12-31" }, FUTURE_TODAY), true);
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2030-01-01" }, FUTURE_TODAY), true);
});

test("isFutureHabit returns false when startDate is today or earlier", () => {
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2026-05-26" }, FUTURE_TODAY), false, "same day = active");
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2026-05-25" }, FUTURE_TODAY), false, "yesterday = active");
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2025-01-01" }, FUTURE_TODAY), false, "long-active");
});

test("isFutureHabit returns false when habit has no startDate", () => {
  assert.equal(habitsDomain.isFutureHabit({}, FUTURE_TODAY), false);
  assert.equal(habitsDomain.isFutureHabit({ startDate: null }, FUTURE_TODAY), false);
  assert.equal(habitsDomain.isFutureHabit({ startDate: "" }, FUTURE_TODAY), false);
});

test("isFutureHabit returns false when todayKey is missing (no comparison possible)", () => {
  // Without a todayKey, the implementation cannot decide; defaults to "not future"
  // (i.e. include in active set). Mirrors the inline guard behavior.
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2099-01-01" }, null), false);
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2099-01-01" }, ""), false);
  assert.equal(habitsDomain.isFutureHabit({ startDate: "2099-01-01" }, undefined), false);
});
