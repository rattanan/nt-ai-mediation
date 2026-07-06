import { expect, type Page, type TestInfo } from "@playwright/test";

export type RoleName = "debtor" | "creditor" | "mediator" | "admin";

export const roleHome: Record<RoleName, string> = {
  debtor: "/debtor",
  creditor: "/creditor",
  mediator: "/mediator",
  admin: "/admin/dashboard",
};

export function credentialsFor(role: RoleName) {
  const prefix = `E2E_${role.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  return email && password ? { email, password } : null;
}

export async function loginAs(page: Page, role: RoleName, testInfo: TestInfo) {
  const credentials = credentialsFor(role);
  if (!credentials) {
    testInfo.skip(true, `Set E2E_${role.toUpperCase()}_EMAIL and E2E_${role.toUpperCase()}_PASSWORD to run ${role} flow`);
    return;
  }

  await page.goto("/login");
  await page.getByLabel(/อีเมล|email/i).fill(credentials.email);
  await page.getByLabel(/รหัสผ่าน|password/i).fill(credentials.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL(
    (url) => url.pathname === "/auth/consent" || new RegExp(`${roleHome[role]}($|[/?#])`).test(`${url.pathname}${url.search}${url.hash}`),
    { timeout: 10_000 },
  );
  if (/\/auth\/consent/.test(page.url())) {
    const terms = page.locator("section[aria-label]").first();
    await terms.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    for (const checkbox of await page.locator('input[type="checkbox"]').all()) {
      await checkbox.check();
    }
    await page.getByRole("button", { name: "ยอมรับและดำเนินการต่อ" }).click();
  }
  await expect(page).toHaveURL(new RegExp(`${roleHome[role]}($|[/?#])`));
}

export async function openNewDebtorCaseForm(page: Page) {
  await page.goto("/debtor/cases/new");
  const chooseOrganization = page.getByRole("link", { name: "เลือกองค์กรนี้" }).first();
  if (await chooseOrganization.isVisible()) {
    await chooseOrganization.click();
  }
  await expect(page.locator("form").first()).toBeVisible();
}

export async function expectPortalProtected(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(page.getByText("กรุณาเข้าสู่ระบบก่อนเข้าใช้งานพอร์ตัล")).toBeVisible();
}

export async function expectNoConsoleErrors(page: Page) {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
  return messages;
}
