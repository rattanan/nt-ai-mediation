import { expect, test } from "@playwright/test";
import { assertNoWorkflowDeadEnd } from "../helpers/workflow";

test.describe("public mediator directory", () => {
  test("landing search CTA opens mediator list", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /ค้นหาผู้ไกล่เกลี่ย|find.*mediator/i }).first();
    await expect(cta).toHaveAttribute("href", "/mediators");
    await cta.click();
    await expect(page).toHaveURL(/\/mediators$/);
    await expect(page.getByRole("heading", { name: /เลือกผู้ไกล่เกลี่ยที่เข้าใจ/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "ฟีเจอร์" })).toHaveAttribute("href", "/#features");
    await expect(page.getByRole("link", { name: "ขั้นตอน" })).toHaveAttribute("href", "/#how-it-works");
    await expect(page.getByRole("link", { name: "ประโยชน์" })).toHaveAttribute("href", "/#benefits");
    const nextPage = page.getByRole("link", { name: /ถัดไป/ });
    if (await nextPage.isVisible()) {
      await nextPage.click();
      await expect(page).toHaveURL(/\/mediators\?page=2$/);
      await expect(page.getByRole("link", { name: /ก่อนหน้า/ })).toBeVisible();
    }
    await assertNoWorkflowDeadEnd(page);
  });

  test("selection is preserved through login return URL", async ({ page }) => {
    await page.goto("/mediators");
    const choose = page.getByRole("button", { name: "เลือกผู้ไกล่เกลี่ยคนนี้" }).first();
    test.skip(!(await choose.isVisible()), "Requires at least one approved mediator");
    await choose.click();
    await expect(page).toHaveURL(/\/login\?returnUrl=/);
    const returnUrl = new URL(page.url()).searchParams.get("returnUrl");
    expect(returnUrl).toMatch(/^\/debtor\/cases\/new\?mediator=/);
    const cookies = await page.context().cookies();
    expect(cookies.find((cookie) => cookie.name === "nt_preferred_mediator")?.httpOnly).toBeTruthy();
  });
});
