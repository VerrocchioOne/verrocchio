const { test, expect } = require("@playwright/test");

// a11y-dialog helper contract test (Port #6 pilot).
//
// We exercise lib/dialog.js end-to-end against a minimal fixture page so the
// focus-trap contract is verified without needing Firebase auth or the rest
// of index.html. The fixture loads a11y-dialog + lib/dialog.js, builds a real
// [role=dialog][aria-modal=true] element, and our test drives it through:
//   1. open  → focus lands inside the dialog within 200ms
//   2. trap  → 10 Tab presses stay inside the dialog
//   3. esc   → Escape closes the dialog
//   4. return → focus returns to the trigger that opened it
//
// Chromium-only for the same reason every other E2E in this suite is —
// WebKit-on-Windows focus events under Playwright are flaky and not what
// we're testing here.

test.describe("a11y-dialog: focus-trap contract", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Focus-trap timing is only reliably testable on Chromium; WebKit on Windows is flaky"
  );

  test("opens, traps focus, closes on Esc, returns focus to trigger", async ({ page }) => {
    await page.goto("/tests/e2e/fixtures/dialog-fixture.html");
    await page.waitForFunction(() => window.__dialogReady === true, null, { timeout: 5000 });

    // Focus the trigger so we have a known return target.
    const trigger = page.locator('[data-testid="open-trigger"]');
    await trigger.focus();
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe("open-trigger");

    // Click opens the dialog.
    await trigger.click();

    // The dialog becomes visible within 200ms and focus moves inside.
    // a11y-dialog v8 REMOVES the aria-hidden attribute on show (rather
    // than flipping it to "false"), so we assert via :not([aria-hidden]).
    const dialog = page.locator('#test-dialog:not([aria-hidden])');
    await expect(dialog).toBeVisible({ timeout: 200 });
    const focusedInside = await page.evaluate(() => {
      const d = document.getElementById("test-dialog");
      return !!(d && d.contains(document.activeElement));
    });
    expect(focusedInside).toBe(true);

    // Tab repeatedly — focus must stay inside the dialog.
    for (let i = 0; i < 10; i++) await page.keyboard.press("Tab");
    const stillInside = await page.evaluate(() => {
      const d = document.getElementById("test-dialog");
      return !!(d && d.contains(document.activeElement));
    });
    expect(stillInside).toBe(true);

    // Escape closes the dialog.
    await page.keyboard.press("Escape");
    await expect(page.locator('#test-dialog[aria-hidden="true"]')).toBeAttached();

    // Focus returns to the trigger.
    const returnedToTrigger = await page.evaluate(() => {
      return document.activeElement && document.activeElement.id === "open-trigger";
    });
    expect(returnedToTrigger).toBe(true);
  });

  test("data-a11y-dialog-hide buttons close the dialog and return focus", async ({ page }) => {
    await page.goto("/tests/e2e/fixtures/dialog-fixture.html");
    await page.waitForFunction(() => window.__dialogReady === true, null, { timeout: 5000 });

    const trigger = page.locator('[data-testid="open-trigger"]');
    await trigger.focus();
    await trigger.click();

    await expect(page.locator('#test-dialog:not([aria-hidden])')).toBeVisible();

    // Click the close button (tagged with data-a11y-dialog-hide).
    await page.locator('[data-testid="dialog-close-btn"]').click();

    await expect(page.locator('#test-dialog[aria-hidden="true"]')).toBeAttached();
    const returnedToTrigger = await page.evaluate(() => {
      return document.activeElement && document.activeElement.id === "open-trigger";
    });
    expect(returnedToTrigger).toBe(true);
  });
});
