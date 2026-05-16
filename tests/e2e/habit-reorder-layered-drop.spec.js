const { test, expect } = require("@playwright/test");

// §13.3f — Layered-drop regression coverage for commitHabitReorderDrop.
//
// Background: an earlier migration from the hand-rolled pointer pipeline
// to SortableJS silently orphaned the "drop on a peer's left/right edge =
// concurrent-cohort layering" capability because SortableJS only reports
// `newIndex` (a sequential insertion point), not edge-hit information.
// The commit function `commitHabitReorderDrop` still accepted layered
// opts, but the onEnd hook hardcoded them to falsy — the user complained
// "drag and drop doesn't work" because the layering gesture they expected
// was unreachable.
//
// The fix restored edge detection via a document pointermove during the
// drag. To prevent THIS class of orphaning happening again, these tests
// exercise commitHabitReorderDrop directly through the test-hook surface
// (window.__verrocchioTestHooks.runReorderTestScenario). They don't drive
// the actual SortableJS pipeline — that's intentional. The risk being
// defended against is "a future drag-library swap drops the layered-drop
// call site"; assuring the commit function works correctly in isolation
// lets a code reviewer cheaply verify the call site is wired right
// (one place, one onEnd handler) rather than auditing hundreds of lines
// of pointer event handling.
//
// Each test calls runReorderTestScenario once — an atomic seed + commit
// + read inside a single page.evaluate. Split across multiple round-trips
// the spec flaked because React re-renders between rounds sometimes
// repointed the commit-function ref at a stale closure. One round-trip,
// one synchronous JS call, no race surface.

test.describe("habits: layered drop via commitHabitReorderDrop (§13.3f)", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "React state-update timing is most reliable on Chromium"
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html?debug=1");
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(
      () => typeof window.__verrocchioTestHooks === "object"
            && window.__verrocchioTestHooks !== null
            && typeof window.__verrocchioTestHooks.runReorderTestScenario === "function",
      null,
      { timeout: 10000 }
    );
    await page.evaluate(() => window.__verrocchioTestHooks.primeForDialogTests());
  });

  // Helper: build a fixture of N sequential habits all in `morning`, all
  // concurrent:false (each its own one-habit cohort). Test cases override
  // specific habits' `concurrent` flags inline.
  const fixture = (overrides = {}) => {
    const base = ["h1", "h2", "h3", "h4"].map((id, i) => ({
      id,
      text: "Habit " + (i + 1),
      section: "morning",
      _order: i,
      concurrent: false,
      completions: {},
      completionTimes: {},
      frequency: { type: "daily" }
    }));
    return base.map(h => overrides[h.id] ? { ...h, ...overrides[h.id] } : h);
  };

  const runScenario = (page, seedHabits, dropArgs) =>
    page.evaluate(
      ({ s, d }) => window.__verrocchioTestHooks.runReorderTestScenario(s, d),
      { s: seedHabits, d: dropArgs }
    );

  const morningSorted = habits => habits
    .filter(h => h.section === "morning" && !h.parentId)
    .sort((a, b) => (a._order ?? 999) - (b._order ?? 999));

  test("plain reorder: moving habit shifts position, no concurrent flag changes", async ({ page }) => {
    const habits = await runScenario(page, fixture(), {
      habitId: "h1", section: "morning", idx: 2,
      opts: { targetConcurrent: false, layeredPeerId: null, layeredSide: null }
    });
    const morning = morningSorted(habits);
    expect(morning.map(h => h.id)).toEqual(["h2", "h3", "h1", "h4"]);
    expect(morning.map(h => h.concurrent)).toEqual([false, false, false, false]);
  });

  test("right-edge drop: dragged habit joins peer's cohort from the right (concurrent=true)", async ({ page }) => {
    const habits = await runScenario(page, fixture(), {
      habitId: "h1", section: "morning", idx: 2,
      opts: { targetConcurrent: true, layeredPeerId: "h3", layeredSide: "right" }
    });
    const morning = morningSorted(habits);
    expect(morning.map(h => h.id)).toEqual(["h2", "h3", "h1", "h4"]);
    // h3 stays a cohort starter (concurrent:false); h1 joins from the
    // right (concurrent:true). h2 and h4 untouched.
    const byId = Object.fromEntries(morning.map(h => [h.id, h.concurrent]));
    expect(byId).toEqual({ h2: false, h3: false, h1: true, h4: false });
  });

  test("left-edge drop on cohort starter: dragged habit becomes new starter, peer flips to concurrent=true", async ({ page }) => {
    const habits = await runScenario(page, fixture(), {
      habitId: "h1", section: "morning", idx: 1,
      opts: { targetConcurrent: true, layeredPeerId: "h3", layeredSide: "left" }
    });
    const morning = morningSorted(habits);
    expect(morning.map(h => h.id)).toEqual(["h2", "h1", "h3", "h4"]);
    const byId = Object.fromEntries(morning.map(h => [h.id, h.concurrent]));
    expect(byId).toEqual({ h2: false, h1: false, h3: true, h4: false });
  });

  test("position-0 invariant: first habit in new sequence is forced to concurrent=false", async ({ page }) => {
    // Seed: h1 starter, h2 in h1's cohort, h3 and h4 sequential.
    // Plain reorder moves h2 (currently concurrent:true) to position 0.
    // The function MUST force-flip h2 to concurrent:false because the
    // first habit in any section can't be mid-cohort — there's no peer
    // above it for the cohort to attach to.
    const habits = await runScenario(page, fixture({ h2: { concurrent: true } }), {
      habitId: "h2", section: "morning", idx: 0,
      opts: { targetConcurrent: false, layeredPeerId: null, layeredSide: null }
    });
    const morning = morningSorted(habits);
    expect(morning.map(h => h.id)).toEqual(["h2", "h1", "h3", "h4"]);
    // h2 was concurrent:true; invariant forced it to false at position 0.
    // h1 was the starter; nothing layered onto it, so it stays
    // concurrent:false. Result: the old [h1, h2] cohort is cleanly
    // broken — h2 alone at top, h1 alone below.
    const byId = Object.fromEntries(morning.map(h => [h.id, h.concurrent]));
    expect(byId).toEqual({ h2: false, h1: false, h3: false, h4: false });
  });
});
