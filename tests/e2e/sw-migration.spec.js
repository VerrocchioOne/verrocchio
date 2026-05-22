const { test, expect } = require("@playwright/test");

// Legacy-cache migration contract: prior to v64, the hand-rolled SW
// created caches named `verrocchio-shell-vNN` via caches.open(). Workbox's
// own cleanupOutdatedCaches() does NOT delete those — it only sweeps
// Workbox-managed precaches. The current SW must include a custom
// activate handler that purges any `verrocchio-*` cache whose name does
// not end with the current SHELL_VERSION suffix.
//
// We exercise that handler end-to-end:
//   1. First load registers the current SW; wait for control.
//   2. From the page context, manually write a dummy entry into a fake
//      legacy `verrocchio-shell-v63` cache.
//   3. Unregister the SW and reload — fresh install + activate fires the
//      migration handler.
//   4. Assert: legacy v63 cache is gone, at least one current
//      `verrocchio-...-v71` cache survives.
//
// Same Chromium-only constraint as offline.spec.js — WebKit on Windows is
// flaky around SW re-registration.

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "SW cache migration is only reliably testable on Chromium"
);

test("activate handler purges legacy verrocchio-shell-vNN caches", async ({ page }) => {
  // First load — SW v64 registers and takes control.
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
    null,
    { timeout: 15000 }
  );

  // Seed a fake legacy cache (the kind the pre-v64 hand-rolled SW created).
  await page.evaluate(async () => {
    const c = await caches.open("verrocchio-shell-v63");
    await c.put("/__legacy_probe__", new Response("legacy", { status: 200 }));
  });

  // Sanity check: both legacy and current caches exist before re-activation.
  const before = await page.evaluate(() => caches.keys());
  expect(before).toContain("verrocchio-shell-v63");
  expect(before.some(k => k.endsWith("v71"))).toBe(true);

  // Force a fresh install + activate cycle: unregister the current SW,
  // reload, and wait for the new registration to take control. The new
  // activation runs the migration handler.
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
    null,
    { timeout: 15000 }
  );
  // Activate handler runs caches.delete() asynchronously inside
  // event.waitUntil(); give it a beat to settle.
  await page.waitForTimeout(1000);

  const after = await page.evaluate(() => caches.keys());
  expect(after).not.toContain("verrocchio-shell-v63");
  expect(after.some(k => k.endsWith("v71"))).toBe(true);
});
