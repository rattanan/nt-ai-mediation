import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("creditor flow", () => {
  test("creditor can open dashboard, organization, cases, and billing", async ({ page }, testInfo) => {
    await loginAs(page, "creditor", testInfo);

    for (const path of ["/creditor/organization", "/creditor/cases", "/creditor/billing"]) {
      await page.goto(path);
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });
});
