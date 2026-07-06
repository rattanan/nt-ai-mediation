import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("admin flow", () => {
  test("admin can open management and reporting pages", async ({ page }, testInfo) => {
    await loginAs(page, "admin", testInfo);

    for (const path of ["/admin/users", "/admin/creditors", "/admin/mediators", "/admin/cases", "/admin/billing", "/admin/reports"]) {
      await page.goto(path);
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });
});
