import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dk, tk, pastDays, getStreak, daysSinceLast, getCR, getLast14 } = require("../utils.js");

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
