import { expect, test as setup } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const roles = ["debtor", "creditor", "mediator", "admin"] as const;
const homes = { debtor: "/debtor", creditor: "/creditor", mediator: "/mediator", admin: "/admin/dashboard" };

for (const role of roles) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const prefix = `E2E_${role.toUpperCase()}`;
    const email = process.env[`${prefix}_EMAIL`];
    const password = process.env[`${prefix}_PASSWORD`];
    setup.skip(!email || !password, `Set ${prefix}_EMAIL and ${prefix}_PASSWORD`);
    await page.goto("/login");
    await page.getByLabel(/อีเมล|email/i).fill(email!);
    await page.getByLabel(/รหัสผ่าน|password/i).fill(password!);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/auth/consent" || url.pathname === homes[role]);
    if (page.url().includes("/auth/consent")) {
      const section = page.locator("section[aria-label]").first();
      await section.evaluate((element) => { element.scrollTop = element.scrollHeight; element.dispatchEvent(new Event("scroll", { bubbles: true })); });
      for (const checkbox of await page.locator('input[type="checkbox"]').all()) await checkbox.check();
      await page.getByRole("button", { name: "ยอมรับและดำเนินการต่อ" }).click();
    }
    await expect(page).toHaveURL(new RegExp(`${homes[role]}($|[/?#])`));
    await mkdir("playwright/.auth", { recursive: true });
    await page.context().storageState({ path: `playwright/.auth/${role}.json` });
  });
}
