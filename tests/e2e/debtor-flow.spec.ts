import { expect, test } from "@playwright/test";
import { loginAs, openNewDebtorCaseForm } from "./helpers";

test.describe("debtor flow", () => {
  test("debtor can open dashboard and case creation form", async ({ page }, testInfo) => {
    await loginAs(page, "debtor", testInfo);
    await expect(page.locator("h1").first()).toBeVisible();

    await openNewDebtorCaseForm(page);
    await expect(page.getByRole("button", { name: /บันทึก|ส่ง|สร้าง|ถัดไป/i }).first()).toBeVisible();
  });

  test("debtor case form exposes document upload controls", async ({ page }, testInfo) => {
    await loginAs(page, "debtor", testInfo);
    await openNewDebtorCaseForm(page);
    await expect(page.locator('input[type="file"], input[name="documents"]').first()).toBeVisible();
  });
});
