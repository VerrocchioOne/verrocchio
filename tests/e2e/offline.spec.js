const { test, expect } = require("@playwright/test");

// Offline app-shell contract: after the first successful visit, the
// service worker must be able to serve index.html (and its precached
// dependencies) with the network fully offline. This guards the
// contract end-to-end across SW implementations (hand-rolled → Workbox).
//
// Single test, single context, two loads:
//   1. First load — SW registers and the precache populates.
//   2. Network goes offline, reload — the shell must still come up.
//
// We deliberately navigate to /index.html (not "/") because the SW
// includes an apex bypass: "/" passes through to the network so the
// production Firebase Hosting 302 → /home is preserved. A reload of
// "/" with the network offline therefore fails by design — that's
// fine in production (users navigate INTO the SPA, not the apex), but
// not what we're testing here. /index.html is a concrete same-origin
// path that the SW will treat as a navigation and serve from
// precache when offline.
//
// Restricted to the Chromium (desktop) project: Playwright's WebKit
// driver on Windows raises "WebKit encountered an internal error" on
// reload-after-setOffline in a way that's unrelated to the SW. Smoke
// coverage on iOS WebKit still runs in smoke.spec.js; the offline
// contract is implementation-agnostic, so single-engine coverage is
// sufficient for a port guard.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Offline reload is only reliably testable on Chromium; smoke covers WebKit"
);

test("app shell loads with network offline after first visit", async ({ page, context }) => {
  // First visit — registers SW and populates precache.
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");

  // Wait for the SW to take control of THIS page (clients.claim() in the
  // SW is what makes navigator.serviceWorker.controller non-null).
  await page.waitForFunction(
    () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
    null,
    { timeout: 15000 }
  );

  // Give the SW a generous beat to finish writing the precache before
  // we cut the network. The precache list is small (~5 files) but the
  // writes are async.
  await page.waitForTimeout(1500);

  // Drop the network and reload — must come up from the precache.
  await context.setOffline(true);
  await page.reload();

  await expect(page).toHaveTitle(/Verrocchio/i);
  await expect(page.locator("body")).toBeVisible();

  // Restore network so context teardown doesn't choke on outstanding requests.
  await context.setOffline(false);
});
