import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("mediator flow", () => {
  test("mediator can open profile, availability, and appointments", async ({ page }, testInfo) => {
    await loginAs(page, "mediator", testInfo);

    for (const path of ["/mediator/profile", "/mediator/availability", "/mediator/appointments"]) {
      await page.goto(path);
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });
});
