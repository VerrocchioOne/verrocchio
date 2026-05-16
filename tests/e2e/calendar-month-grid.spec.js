const { test, expect } = require("@playwright/test");

// Port #11 — pinned-behavior regression coverage for the Calendar
// modal's month-view grid (renderMonth at index.html L21540).
//
// Background: the month grid is currently hand-rolled — 42 cell
// buttons in a 6×7 layout, with per-cell goal-target chips, sparse
// habit chips, today + focused highlights, and an overflow indicator.
// Port #11 is evaluating whether to swap this for vanilla-calendar-pro
// @3.1.0. Either way, these tests pin the user-observable behavior so
// any swap (or future hand-rolled change) that breaks the contract
// surfaces in CI rather than in a user bug report.
//
// Like habit-reorder-layered-drop.spec.js, each scenario is ATOMIC:
// one synchronous page.evaluate seeds data + opens the modal + sets
// the focus month. Splitting seed/open/observe across multiple
// round-trips would race React commits (the reorder spec flaked badly
// before being consolidated; same pattern here).
//
// Chromium-only: the rest of the E2E suite already establishes
// WebKit on Windows is flaky around React state-update timing under
// Playwright.

test.describe("calendar: month grid (Port #11)", () => {
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
            && typeof window.__verrocchioTestHooks.openCalendarMonthForTest === "function",
      null,
      { timeout: 10000 }
    );
    await page.evaluate(() => window.__verrocchioTestHooks.primeForDialogTests());
  });

  test.afterEach(async ({ page }) => {
    // Close between tests so any hover/click side-effects don't leak
    // into the next scenario's render tree.
    await page.evaluate(() => {
      try { window.__verrocchioTestHooks.closeCalendarForTest(); } catch (_) {}
    });
  });

  // Seed builders. Habits and goals carry only the fields the month
  // grid reads — the rest of the data doc is filled in by
  // primeForDialogTests().
  const buildHabit = (id, text, frequencyType, extra = {}) => ({
    id,
    text,
    section: "morning",
    _order: 0,
    concurrent: false,
    type: "Physical",
    duration: 30,
    startDate: "2026-01-01",
    parked: false,
    completions: {},
    completionTimes: {},
    frequency: { type: frequencyType, ...extra }
  });

  const buildGoal = (id, text, timebound) => ({
    id, text, type: "Career", smart: { timebound }
  });

  // Helper: drives the atomic seed+open hook on the page.
  const openMonth = (page, habits, goals, focusKey) =>
    page.evaluate(
      ({ h, g, k }) =>
        window.__verrocchioTestHooks.openCalendarMonthForTest(h, g, k),
      { h: habits, g: goals, k: focusKey }
    );

  // Selector helper run inside the page: the month grid's cell
  // buttons are uniquely identifiable by an inline `aspect-ratio:
  // 1 / 1.15` style. The weekday-header row uses regular text divs;
  // the day cells are the only buttons that carry that aspect-ratio.
  const CELL_SELECTOR_FN = () => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
      b.getAttribute("style") || ""
    ));
  };

  // Returns the visible day-number text content for every non-blank
  // cell, in render order.
  const collectDayNumbers = page => page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const cells = btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
      b.getAttribute("style") || ""
    ));
    return cells.map(b => (b.textContent || "").trim().replace(/[^0-9].*$/, ""));
  });

  test("renders 28 day-cell buttons + 14 blank slots = 42 total for Feb 2026", async ({ page }) => {
    // Feb 2026: Feb 1 is a Sunday (dow=0), so startDow=0 — no leading
    // blanks. 28 days + 0 leading + 14 trailing blanks = 42 cells, of
    // which 28 are non-blank buttons with day numbers 1..28.
    await openMonth(page, [], [], "2026-02-15");

    // Wait for the modal + grid to mount.
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
        b.getAttribute("style") || ""
      )).length >= 28;
    }, null, { timeout: 5000 });

    const dayNumbers = await collectDayNumbers(page);
    expect(dayNumbers.length).toBe(28); // Feb 2026 = 28 days
    expect(dayNumbers[0]).toBe("1");
    expect(dayNumbers[27]).toBe("28");

    // Count total cell-slot DOM nodes inside the grid (blanks + buttons).
    // We locate the grid by its specific gridTemplateColumns + gap style.
    const totalSlots = await page.evaluate(() => {
      const grids = Array.from(document.querySelectorAll("div")).filter(d => {
        const s = d.getAttribute("style") || "";
        return /repeat\(7,\s*1fr\)/.test(s) && /gap:\s*4/.test(s);
      });
      if (!grids.length) return 0;
      // Pick the grid that contains the day-cells (filter by aspect-ratio child)
      const grid = grids.find(g =>
        Array.from(g.children).some(c =>
          /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(c.getAttribute("style") || "")
        )
      );
      return grid ? grid.children.length : 0;
    });
    // 42 = 28 days + 14 trailing blanks (Feb 1 2026 is a Sunday → 0
    // leading blanks). The blanks are empty <div>s, not <button>s.
    expect(totalSlots).toBe(42);
  });

  test("today's cell is visually distinct when focusDate is in current month", async ({ page }) => {
    // Read today's local date from the page (must match dk() — the
    // hand-rolled grid compares c.k === tk()).
    const today = await page.evaluate(() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return { full: `${y}-${m}-${day}`, day: String(d.getDate()) };
    });
    await openMonth(page, [], [], today.full);
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
        b.getAttribute("style") || ""
      )).length >= 28;
    }, null, { timeout: 5000 });

    // Today's cell renders with a 'today' border color (#86efac in the
    // hand-rolled impl) AND/OR bold font weight (700). Either signal
    // counts — both convey 'this cell is special'.
    const todayCellInfo = await page.evaluate((todayDay) => {
      const btns = Array.from(document.querySelectorAll("button"));
      const cells = btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
        b.getAttribute("style") || ""
      ));
      const match = cells.find(b => {
        const txt = (b.textContent || "").trim().replace(/[^0-9].*$/, "");
        return txt === todayDay;
      });
      if (!match) return null;
      const style = match.getAttribute("style") || "";
      return {
        hasTodayBorder: /#86efac/i.test(style),
        hasBoldWeight:  /font-weight:\s*700/i.test(style),
        hasTodayTint:   /var\(--c-tint-success-bg\)/i.test(style)
      };
    }, today.day);
    expect(todayCellInfo).not.toBeNull();
    // The current impl wears all three signals (border + bold + tint).
    // Assert ANY one of them so a post-port impl can pick its own
    // signaling — what matters is "today is visually distinct".
    expect(
      todayCellInfo.hasTodayBorder
        || todayCellInfo.hasBoldWeight
        || todayCellInfo.hasTodayTint
    ).toBe(true);
  });

  test("clicking a cell opens the day-detail snapshot for that date", async ({ page }) => {
    await openMonth(page, [], [], "2026-02-15");
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
        b.getAttribute("style") || ""
      )).length >= 28;
    }, null, { timeout: 5000 });

    // Click the cell for Feb 10, 2026.
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const cells = btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
        b.getAttribute("style") || ""
      ));
      const match = cells.find(b => {
        const txt = (b.textContent || "").trim().replace(/[^0-9].*$/, "");
        return txt === "10";
      });
      if (match) match.click();
    });

    // The click handler sets calendarDetailDate to the cell's key,
    // which mounts the Snapshot dialog with a header reading
    // "Snapshot — Tuesday, February 10". Asserting the snapshot opens
    // is the stable user-visible contract: the click-callback fired
    // and pushed the focus date into the day-detail surface.
    //
    // We deliberately do NOT also assert on the focused-cell inline
    // style here — the dev server triggers an SW update + reload on
    // some test runs (see "New version available" banner in error
    // screenshots), which races the style-poll. The snapshot-open
    // signal alone fully covers the user-visible click contract;
    // focused-cell styling is an implementation detail that may
    // change post-Port-11.
    await expect(
      page.locator("text=/^Snapshot — .+ February 10/")
    ).toBeVisible({ timeout: 2000 });
  });

  test("goal target chip (🎯) appears in the cell whose date matches goal.smart.timebound", async ({ page }) => {
    const goal = buildGoal(1, "Finish course", "2026-02-15");
    await openMonth(page, [], [goal], "2026-02-15");

    // The goal chip text "🎯 Finish course" is rendered inside the
    // cell for Feb 15. We don't need to drill into the cell — the
    // string is unique to that day, so a plain locator works.
    await expect(
      page.locator("text=/🎯\\s*Finish course/")
    ).toBeVisible({ timeout: 5000 });
  });

  test("sparse-habit chip appears for a weekly habit due on a cell date", async ({ page }) => {
    // Weekly habit due on Mondays. Feb 9, 2026 is a Monday.
    const habit = buildHabit("h1", "Weekly stretch", "weekly", { day: 1 });
    await openMonth(page, [habit], [], "2026-02-15");

    // The habit chip renders the habit text verbatim. We assert
    // at least one chip with that text is visible.
    await expect(
      page.locator("text=Weekly stretch").first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("daily habit is NOT rendered as a chip in the month grid", async ({ page }) => {
    // Per renderMonth's isSparseFreq filter, only weekly /
    // weekly-day / monthly / quarterly / annual habits are shown.
    // Daily and weekdays habits are excluded — they fire most days
    // and would clutter the grid.
    const habit = buildHabit("h1", "Daily hydration", "daily");
    await openMonth(page, [habit], [], "2026-02-15");

    // Wait for the grid to render.
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
        b.getAttribute("style") || ""
      )).length >= 28;
    }, null, { timeout: 5000 });

    // The text "Daily hydration" must NOT appear as a chip inside
    // any of the month-grid cell buttons. (The modal's bottom panel
    // does list it for the focused day — that's the day-detail
    // surface, not the month grid contract being pinned here.)
    const chipHits = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const cells = btns.filter(b => /aspect-ratio:\s*1\s*\/\s*1\.15/i.test(
        b.getAttribute("style") || ""
      ));
      let count = 0;
      for (const cell of cells) {
        if ((cell.textContent || "").includes("Daily hydration")) count++;
      }
      return count;
    });
    expect(chipHits).toBe(0);
  });

  test("overflow indicator '+ N more' appears when goals+chips > 4 in one cell", async ({ page }) => {
    // 3 goals + 3 weekly habits on Feb 9 (Monday) = 6 chips on one
    // cell. Implementation caps display at 2 of each kind (4 visible
    // chips) and shows "+ 2 more". The threshold for the overflow
    // banner is `goals.length + due.length > 4`.
    const goals = [
      buildGoal(1, "Goal A", "2026-02-09"),
      buildGoal(2, "Goal B", "2026-02-09"),
      buildGoal(3, "Goal C", "2026-02-09")
    ];
    const habits = [
      buildHabit("h1", "Weekly A", "weekly", { day: 1 }),
      buildHabit("h2", "Weekly B", "weekly", { day: 1 }),
      buildHabit("h3", "Weekly C", "weekly", { day: 1 })
    ];
    await openMonth(page, habits, goals, "2026-02-15");

    // 3 goals + 3 weekly habits = 6 chips; capped to 4 visible →
    // "+ 2 more" rendered as a small text node inside the Feb 9 cell.
    await expect(
      page.locator("text=/\\+\\s*2\\s*more/")
    ).toBeVisible({ timeout: 5000 });
  });
});
