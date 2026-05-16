const { test, expect } = require("@playwright/test");

test("app loads and shows the splash or login surface", async ({ page }) => {
  await page.goto("http://localhost:8080/");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).toHaveTitle(/Verrocchio/i);
});
