import { expect, test } from "@playwright/test";
import { assertNoWorkflowDeadEnd } from "../helpers/workflow";
import { credentialsFor, loginAs } from "./helpers";

test.describe.serial("critical mediation workflow", () => {
  for (const role of ["debtor", "admin", "creditor", "mediator"] as const) {
    test(`${role} portal exposes a valid next step`, async ({ page }, testInfo) => {
      test.skip(!credentialsFor(role), `Set E2E_${role.toUpperCase()} credentials`);
      await loginAs(page, role, testInfo);
      await assertNoWorkflowDeadEnd(page);
    });
  }

  test("debtor can start a request and upload supporting documents", async ({ page }, testInfo) => {
    test.skip(!credentialsFor("debtor"), "Set debtor credentials");
    await loginAs(page, "debtor", testInfo);
    await page.goto("/debtor/cases/new");
    const organization = page.getByRole("link", { name: "เลือกองค์กรนี้" }).first();
    if (await organization.isVisible()) await organization.click();
    await expect(page.locator("form").first()).toBeVisible();
    await expect(page.locator('input[type="file"], input[name="documents"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /บันทึก|ส่ง|สร้าง|ถัดไป/i }).first()).toBeVisible();
    await assertNoWorkflowDeadEnd(page);
  });

  test("role lifecycle destinations render without a dead end", async ({ page }, testInfo) => {
    const checks = [["admin", "/admin/cases"], ["creditor", "/creditor/cases"], ["mediator", "/mediator/availability"], ["mediator", "/mediator/cases"], ["mediator", "/mediator/appointments"], ["debtor", "/debtor/appointments"], ["creditor", "/creditor/billing"], ["admin", "/admin/dashboard/reviews-trust-score"]] as const;
    for (const [role, path] of checks) {
      test.skip(!credentialsFor(role), `Set ${role} credentials`);
      await page.context().clearCookies();
      await loginAs(page, role, testInfo);
      await page.goto(path);
      await assertNoWorkflowDeadEnd(page);
    }
  });

  test("mediator assignment page exposes accept or reject decision", async ({ page }, testInfo) => {
    test.skip(!credentialsFor("mediator") || !process.env.E2E_ASSIGNED_CASE_ID, "Set mediator credentials and E2E_ASSIGNED_CASE_ID");
    await loginAs(page, "mediator", testInfo);
    await page.goto(`/mediator/cases/${process.env.E2E_ASSIGNED_CASE_ID}`);
    const accept = page.getByRole("button", { name: "รับเคสและเปิดการนัดหมาย" });
    const alreadyAccepted = page.getByText(/กำลังรอ.*เลือกเวลานัดหมาย|รายละเอียดนัดหมาย|บันทึกผลและปิดเคส/i).first();
    await expect(accept.or(alreadyAccepted)).toBeVisible();
    if (await accept.isVisible()) {
      await expect(page.getByRole("button", { name: "ปฏิเสธ" })).toBeVisible();
      await expect(page.getByPlaceholder("เหตุผลที่ไม่สามารถรับเคส")).toBeVisible();
    }
    await assertNoWorkflowDeadEnd(page);
  });
});
