import { expect, test } from "@playwright/test";
import { expectPortalProtected, loginAs, roleHome, type RoleName } from "./helpers";

test.describe("auth", () => {
  test("public auth pages render", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();

    for (const path of ["/login", "/register", "/forgot-password"]) {
      await page.goto(path);
      await expect(page.locator("h1:visible, h2:visible").first()).toBeVisible();
    }
  });

  test("protected portals redirect anonymous users to login", async ({ page }) => {
    for (const path of Object.values(roleHome)) {
      await expectPortalProtected(page, path);
    }
  });

  for (const role of Object.keys(roleHome) as RoleName[]) {
    test(`${role} login redirects to role home`, async ({ page }, testInfo) => {
      await loginAs(page, role, testInfo);
    });
  }
});
