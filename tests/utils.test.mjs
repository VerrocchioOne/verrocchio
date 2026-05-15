import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dk, tk, dkTime, tkTime, pastDays, getStreak, daysSinceLast, getCR, getLast14, parseClock, findCorrelations, detectOffSchedule, SECTION_CUTOFFS } = require("../utils.js");

// Helper: freeze Date to a known local-time instant for the duration of
// a test. Restores the original Date when the test returns. We use a
// fixed local date (Apr 23, 2026, 10:00 local time) so tests are
// deterministic regardless of the runner's timezone.
function withFakeNow(localIsoNoTz, fn) {
  const Real = Date;
  const frozen = new Real(localIsoNoTz);
  globalThis.Date = class extends Real {
    constructor(...args) { return args.length ? new Real(...args) : new Real(frozen); }
    static now() { return frozen.getTime(); }
  };
  try { return fn(); } finally { globalThis.Date = Real; }
}

// dk() builds a local YYYY-MM-DD. The interesting case is near midnight
// in a non-UTC zone — the old implementation used toISOString() which
// silently shifted the day. These tests assert we never shift.
test("dk returns zero-padded local YYYY-MM-DD", () => {
  assert.equal(dk(new Date(2026, 0, 5)), "2026-01-05");  // Jan 5
  assert.equal(dk(new Date(2026, 11, 31)), "2026-12-31"); // Dec 31
  assert.equal(dk(new Date(2026, 3, 1)), "2026-04-01");   // single-digit day padded
});

test("dk does not shift the day when local time is late evening", () => {
  // 23:45 on Apr 23 local. UTC would be next-day for zones east of UTC-0:15,
  // previous-day for zones east beyond that — but dk is supposed to use
  // LOCAL fields, so it must always return 2026-04-23 regardless of TZ.
  assert.equal(dk(new Date(2026, 3, 23, 23, 45)), "2026-04-23");
});

test("dk does not shift the day when local time is very early morning", () => {
  assert.equal(dk(new Date(2026, 3, 23, 0, 15)), "2026-04-23");
});

test("tk returns today's local date key", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    assert.equal(tk(), dk(new Date(2026, 3, 23, 10, 0, 0)));
  });
});

test("dkTime returns zero-padded HH:MM in 24-hour time", () => {
  assert.equal(dkTime(new Date(2026, 3, 23, 8, 5)), "08:05");
  assert.equal(dkTime(new Date(2026, 3, 23, 0, 0)), "00:00");
  assert.equal(dkTime(new Date(2026, 3, 23, 23, 59)), "23:59");
});

test("tkTime tracks the fake clock", () => {
  withFakeNow("2026-04-23T14:07:00", () => {
    assert.equal(tkTime(), "14:07");
  });
});

// ── parseClock ────────────────────────────────────────────────────
test("parseClock returns minutes since midnight or null for bad input", () => {
  assert.equal(parseClock("00:00"), 0);
  assert.equal(parseClock("08:30"), 8 * 60 + 30);
  assert.equal(parseClock("23:59"), 23 * 60 + 59);
  assert.equal(parseClock("8:30"), null);   // not zero-padded
  assert.equal(parseClock("24:00"), null);  // out of range
  assert.equal(parseClock(null), null);
  assert.equal(parseClock(""), null);
});

// ── findCorrelations ──────────────────────────────────────────────
// Helper: build a habit with completions on the given ISO keys, each
// stamped at the same HH:MM.
function habitWith(id, section, text, completionsByKey) {
  const completions = {};
  const completionTimes = {};
  for (const [k, t] of Object.entries(completionsByKey)) {
    completions[k] = "done";
    completionTimes[k] = t;
  }
  return { id, section, text, completions, completionTimes };
}

test("findCorrelations returns empty when no habit meets min support", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const A = habitWith("a", "morning", "Run", {}); // 0 days on-time
    const B = habitWith("b", "evening", "Sleep early", {});
    const out = findCorrelations([A, B]);
    assert.deepEqual(out, []);
  });
});

test("findCorrelations surfaces a pair whose conditional beats the base by min lift", () => {
  // Construct 20 recent days. On the first 18 of them, A is done by
  // 07:00 (morning section cutoff is noon, so on-time). On 17 of those
  // 18 days, B is also done. On 2 more days, B is done without A. So:
  //   support (A on-time) = 18
  //   conditional P(B|A) = 17/18 ≈ 0.944
  //   base P(B) = (17+2)/20 = 0.95 — whoops, that gives zero lift.
  // Let me spread B so base is lower.
  // Target: A done by cutoff on 16 days (support). B done on 14 of
  // those. B done on 0 other days. So base = 14/20 = 0.70, conditional
  // = 14/16 = 0.875, lift = 0.175 — BELOW threshold. Need more.
  // Let me go: base = 10/20 = 0.5, conditional = 14/14 = 1.0. Lift 0.5.
  withFakeNow("2026-04-23T10:00:00", () => {
    const days60 = [];
    const today = new Date(2026, 3, 23);
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days60.push(dk(d));
    }
    // A done by 07:00 on the 14 most recent days.
    const aC = {};
    for (let i = 0; i < 14; i++) aC[days60[i]] = "07:00";
    // B done on the same 14 days.
    const bC = {};
    for (let i = 0; i < 14; i++) bC[days60[i]] = "22:00";
    const A = habitWith("a", "morning", "Morning run", aC);
    const B = habitWith("b", "evening", "Read before bed", bC);
    const out = findCorrelations([A, B]);
    // At least one direction: A → B should be detected.
    const hit = out.find(r => r.aHabitId === "a" && r.bHabitId === "b");
    assert.ok(hit, "expected A → B correlation in output");
    assert.equal(hit.support, 14);
    assert.equal(hit.conditional, 1); // B done every time A was on-time
    assert.ok(hit.lift >= 0.20, `lift ${hit.lift} should meet threshold`);
  });
});

test("findCorrelations never uses an avoid habit as the A (conditioning) side", () => {
  // Avoid habits don't have a "done by cutoff" semantic — you can't
  // finish resisting a temptation by 8am — so they must never appear
  // as the A in "if A on-time, then B". They CAN appear as the B
  // outcome ("if you do your run, you skip sugar 78% of the time")
  // so we only assert the direction that violates the semantic.
  withFakeNow("2026-04-23T10:00:00", () => {
    const today = new Date(2026, 3, 23);
    const days = [];
    for (let i = 0; i < 20; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push(dk(d));
    }
    const aC = {}; for (let i = 0; i < 14; i++) aC[days[i]] = "07:00";
    const bC = {}; for (let i = 0; i < 14; i++) bC[days[i]] = "22:00";
    const avoidH = habitWith("a", "avoid", "Skip sugar", aC);
    const evening = habitWith("b", "evening", "Read", bC);
    const out = findCorrelations([avoidH, evening]);
    // No result should have aHabitId === "a" (the avoid habit).
    assert.equal(out.filter(r => r.aHabitId === "a").length, 0);
  });
});

// ── detectOffSchedule ─────────────────────────────────────────────
test("detectOffSchedule flags a habit done late in most recent completions", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const today = new Date(2026, 3, 23);
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push(dk(d));
    }
    // Morning habit logged at 15:00 on 6 of 7 recent completions.
    const comps = {};
    comps[days[0]] = "15:00";
    comps[days[1]] = "16:00";
    comps[days[2]] = "15:30";
    comps[days[3]] = "14:00";
    comps[days[4]] = "07:00"; // on-time outlier
    comps[days[5]] = "15:00";
    comps[days[6]] = "16:30";
    const h = habitWith("h", "morning", "Run", comps);
    const out = detectOffSchedule(h);
    assert.ok(out, "expected off-schedule detection");
    assert.equal(out.loggedCount, 7);
    assert.equal(out.lateCount, 6);
    assert.ok(out.lateRate > 0.6);
  });
});

test("detectOffSchedule returns null when not enough recent completions", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const today = new Date(2026, 3, 23);
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push(dk(d));
    }
    const comps = {};
    comps[days[0]] = "15:00";
    comps[days[1]] = "15:30";
    // only 2 completions, below minLogged = 4
    const h = habitWith("h", "morning", "Run", comps);
    assert.equal(detectOffSchedule(h), null);
  });
});

test("detectOffSchedule returns null for avoid habits", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const h = habitWith("h", "avoid", "Skip sugar", {});
    assert.equal(detectOffSchedule(h), null);
  });
});

test("detectOffSchedule returns null for multi-slot habits with no per-slot times recorded", () => {
  // Legacy data path: multi-slot habit exists but slotCompletionTimes
  // is empty (data written before the field shipped). With no
  // per-slot timestamps, there's nothing to compare against the
  // section cutoffs — return null instead of guessing.
  withFakeNow("2026-04-23T10:00:00", () => {
    const today = new Date(2026, 3, 23);
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push(dk(d));
    }
    const comps = {};
    for (let i = 0; i < 7; i++) comps[days[i]] = "15:00";
    const h = habitWith("h", "morning", "Study CFA", comps);
    h.slotSections = ["morning", "evening"];
    assert.equal(detectOffSchedule(h), null);
  });
});

test("detectOffSchedule flags multi-slot habit when per-slot times are late", () => {
  // Multi-slot habit "Study CFA" with morning + evening slots.
  // Morning slot consistently lands after noon (the morning cutoff).
  // Aggregate late rate should trip the threshold.
  withFakeNow("2026-04-23T10:00:00", () => {
    const today = new Date(2026, 3, 23);
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push(dk(d));
    }
    const h = habitWith("h", "morning", "Study CFA", {});
    h.slotSections = ["morning", "evening"];
    h.slotCompletionTimes = {};
    for (let i = 0; i < 7; i++) {
      h.slotCompletionTimes[days[i]] = { morning: "15:00" };
    }
    const out = detectOffSchedule(h);
    assert.ok(out, "expected off-schedule detection on multi-slot");
    assert.equal(out.loggedCount, 7);
    assert.equal(out.lateCount, 7);
    assert.equal(out.section, "morning+evening");
    assert.equal(out.cutoffHour, null);
  });
});

test("detectOffSchedule does NOT flag multi-slot habit when each slot is within its own cutoff", () => {
  // Per-slot semantics: morning slot at 07:15 (before noon) and
  // evening slot at 21:00 (before midnight) for 7 days. Each slot
  // beats its own cutoff. Should return null.
  withFakeNow("2026-04-23T10:00:00", () => {
    const today = new Date(2026, 3, 23);
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push(dk(d));
    }
    const h = habitWith("h", "morning", "Study CFA", {});
    h.slotSections = ["morning", "evening"];
    h.slotCompletionTimes = {};
    for (let i = 0; i < 7; i++) {
      h.slotCompletionTimes[days[i]] = { morning: "07:15", evening: "21:00" };
    }
    assert.equal(detectOffSchedule(h), null);
  });
});

test("findCorrelations never uses a multi-slot habit as the A side", () => {
  // Same rationale as detectOffSchedule — the A-side of a correlation
  // is "did A happen by its cutoff?", and a multi-slot habit has
  // multiple cutoffs but only one completionTimes[date]. Mark it
  // cutoff:null so it never qualifies as a predictor. It can still
  // appear on the B side via the `any` set.
  withFakeNow("2026-04-23T10:00:00", () => {
    const today = new Date(2026, 3, 23);
    const days = [];
    for (let i = 0; i < 20; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push(dk(d));
    }
    const aC = {}; for (let i = 0; i < 14; i++) aC[days[i]] = "07:00";
    const bC = {}; for (let i = 0; i < 14; i++) bC[days[i]] = "22:00";
    const multi = habitWith("a", "morning", "Study CFA", aC);
    multi.slotSections = ["morning", "evening"];
    const reader = habitWith("b", "evening", "Read", bC);
    const out = findCorrelations([multi, reader]);
    assert.equal(out.filter(r => r.aHabitId === "a").length, 0);
  });
});

test("pastDays returns N keys starting with today, going back one day at a time", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const keys = pastDays(5);
    assert.equal(keys.length, 5);
    assert.equal(keys[0], dk(new Date(2026, 3, 23)));
    assert.equal(keys[4], dk(new Date(2026, 3, 19)));
  });
});

test("getStreak counts consecutive completions back from today", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const comp = {};
    // 3-day streak: today, yesterday, two days ago
    comp[dk(new Date(2026, 3, 23))] = true;
    comp[dk(new Date(2026, 3, 22))] = true;
    comp[dk(new Date(2026, 3, 21))] = true;
    // Gap at day -3
    comp[dk(new Date(2026, 3, 19))] = true;
    assert.equal(getStreak({ completions: comp }), 3);
  });
});

test("getStreak returns 0 for empty or missing completions", () => {
  assert.equal(getStreak({ completions: {} }), 0);
  assert.equal(getStreak({}), 0);
});

test("daysSinceLast returns the offset of the most recent completion", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const comp = {};
    comp[dk(new Date(2026, 3, 20))] = true; // 3 days ago
    assert.equal(daysSinceLast({ completions: comp }), 3);
  });
});

test("daysSinceLast returns null when nothing is logged in the last year", () => {
  assert.equal(daysSinceLast({ completions: {} }), null);
  assert.equal(daysSinceLast({}), null);
});

test("getCR computes 30-day completion percentage", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const comp = {};
    // Mark 15 of the last 30 days as complete → 50%
    for (let i = 0; i < 15; i++) {
      const d = new Date(2026, 3, 23);
      d.setDate(d.getDate() - i);
      comp[dk(d)] = true;
    }
    assert.equal(getCR({ completions: comp }).pct, 50);
  });
});

test("getLast14 returns 14 day-keyed entries, oldest first, with done flags", () => {
  withFakeNow("2026-04-23T10:00:00", () => {
    const comp = {};
    comp[dk(new Date(2026, 3, 23))] = true; // today
    comp[dk(new Date(2026, 3, 18))] = true; // 5 days ago
    const cells = getLast14({ completions: comp });
    assert.equal(cells.length, 14);
    // Last entry is today
    assert.equal(cells[13].k, dk(new Date(2026, 3, 23)));
    assert.equal(cells[13].done, true);
    // Entry at index 8 is 5 days ago (13 - 8 = 5)
    assert.equal(cells[8].k, dk(new Date(2026, 3, 18)));
    assert.equal(cells[8].done, true);
    // A gap day
    assert.equal(cells[12].done, false);
  });
});

// ── Regression suite (W3-T32) ──────────────────────────────────────
// Top test gaps from docs/research/2026-05-12-appstore-readiness/05-code-quality.md §10.
//
// DEFERRED from this batch (require functions still embedded in index.html):
//   - sanitizeForFirestore round-trip — lives in index.html; can't unit-test
//     without extracting it. Out of scope for v1.0.
//   - hydrateCloudDoc legacy migration (scalar goalId → goalIds array) —
//     lives in index.html. Same deferral.
//
// Tests below cover the date-math regressions that DO live in utils.js.

test("dk handles US Spring Forward 2026-03-08 — no shifted day on either side", () => {
  // DST starts 2026-03-08 02:00 → 03:00 local in US zones. dk uses local
  // fields so both sides of the transition should produce the expected
  // calendar key regardless of the runner's timezone.
  assert.equal(dk(new Date(2026, 2, 7, 12, 0, 0)), "2026-03-07");
  assert.equal(dk(new Date(2026, 2, 8, 12, 0, 0)), "2026-03-08");
  assert.equal(dk(new Date(2026, 2, 9, 12, 0, 0)), "2026-03-09");
  // Early-morning instants near the spring-forward gap.
  assert.equal(dk(new Date(2026, 2, 8, 1, 30, 0)), "2026-03-08");
  assert.equal(dk(new Date(2026, 2, 8, 3, 30, 0)), "2026-03-08");
});

test("dk handles US Fall Back 2026-11-01 — no shifted day on either side", () => {
  // DST ends 2026-11-01 02:00 → 01:00 local. The "repeated" 01:00–02:00
  // hour must still resolve to 2026-11-01.
  assert.equal(dk(new Date(2026, 9, 31, 12, 0, 0)), "2026-10-31");
  assert.equal(dk(new Date(2026, 10, 1, 12, 0, 0)), "2026-11-01");
  assert.equal(dk(new Date(2026, 10, 2, 12, 0, 0)), "2026-11-02");
  assert.equal(dk(new Date(2026, 10, 1, 1, 30, 0)), "2026-11-01");
});

test("getStreak walks correctly across the Spring Forward DST boundary", () => {
  // Freeze "today" at 2026-03-10 noon, then mark 5 consecutive days
  // INCLUDING the DST transition day (2026-03-08). A naïve
  // `setDate(getDate()-i)` walk on a midnight anchor would skip or
  // double-count the 23-hour day; utils.js uses local date fields, so
  // the streak should still resolve to 5.
  withFakeNow("2026-03-10T12:00:00", () => {
    const comp = {};
    for (let i = 0; i < 5; i++) {
      const d = new Date(2026, 2, 10);
      d.setDate(d.getDate() - i);
      comp[dk(d)] = true;
    }
    assert.equal(getStreak({ completions: comp }), 5);
  });
});

test("getStreak walks correctly across the Fall Back DST boundary for a weekly habit", () => {
  // Weekly-Sunday habit; "today" is Tuesday 2026-11-03. Should walk
  // back, find Sunday 2026-11-01 (the fall-back day itself, a 25-hour
  // day) and Sunday 2026-10-25 both completed → streak of 2.
  withFakeNow("2026-11-03T12:00:00", () => {
    const comp = {};
    comp[dk(new Date(2026, 10, 1))] = true;  // Sun Nov 1 (DST end day)
    comp[dk(new Date(2026, 9, 25))] = true;  // Sun Oct 25
    const habit = {
      completions: comp,
      frequency: { type: "weekly", day: 0 } // Sunday
    };
    assert.equal(getStreak(habit), 2);
  });
});

test("getStreak respects startDate so brand-new habits don't fake a streak", () => {
  // Habit created today. Even if completions exist for prior days,
  // the streak should not walk past startDate.
  withFakeNow("2026-04-23T10:00:00", () => {
    const comp = {};
    comp[dk(new Date(2026, 3, 23))] = true;
    comp[dk(new Date(2026, 3, 22))] = true; // before startDate, ignored
    const habit = {
      completions: comp,
      startDate: dk(new Date(2026, 3, 23))
    };
    assert.equal(getStreak(habit), 1);
  });
});
