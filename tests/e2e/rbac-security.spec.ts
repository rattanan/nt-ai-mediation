import { expect, test } from "@playwright/test";
import { credentialsFor, expectPortalProtected, loginAs, roleHome, type RoleName } from "./helpers";

test.describe("rbac security", () => {
  test("anonymous users cannot access role portals", async ({ page }) => {
    for (const path of ["/debtor", "/creditor", "/mediator", "/admin/dashboard"]) {
      await expectPortalProtected(page, path);
    }
  });

  for (const role of Object.keys(roleHome) as RoleName[]) {
    test(`${role} cannot stay on another role portal`, async ({ page }, testInfo) => {
      await loginAs(page, role, testInfo);
      const otherPath = Object.entries(roleHome).find(([otherRole]) => otherRole !== role)?.[1];
      test.skip(!otherPath || !credentialsFor(role), "Role credentials are required");

      await page.goto(otherPath);
      await expect(page).toHaveURL(new RegExp(`${roleHome[role]}($|[/?#])`));
    });
  }
});
