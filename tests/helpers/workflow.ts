import { expect, type Page } from "@playwright/test";

export async function assertNoWorkflowDeadEnd(page: Page) {
  const consoleErrors: string[] = [];
  const listener = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  page.on("console", listener);
  await expect(page.locator("h1, h2").first(), "workflow page must have a heading").toBeVisible();
  await expect(page.getByText(/404|page not found|application error/i)).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/uncaught (?:runtime )?error/i);
  const navigationCount = await page.locator('a[href]:visible, button:visible, form:visible, [role="button"]:visible').count();
  const waitingCount = await page.getByText(/รอ|กำลังตรวจสอบ|อยู่ระหว่าง|ดำเนินการโดย|ขั้นตอนถัดไป|โปรดรอ/i).count();
  expect(navigationCount > 0 || waitingCount > 0, "page must expose navigation/next action or explain who it is waiting for").toBeTruthy();
  await page.waitForTimeout(100);
  page.off("console", listener);
  expect(consoleErrors, `console errors on ${page.url()}`).toEqual([]);
}
