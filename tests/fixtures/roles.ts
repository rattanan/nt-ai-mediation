import { test as base, type Page } from "@playwright/test";

type RolePages = { debtorPage: Page; creditorPage: Page; mediatorPage: Page; adminPage: Page };
const state = (role: string) => `playwright/.auth/${role}.json`;

export const test = base.extend<RolePages>({
  debtorPage: async ({ browser }, provide) => { const context = await browser.newContext({ storageState: state("debtor") }); await provide(await context.newPage()); await context.close(); },
  creditorPage: async ({ browser }, provide) => { const context = await browser.newContext({ storageState: state("creditor") }); await provide(await context.newPage()); await context.close(); },
  mediatorPage: async ({ browser }, provide) => { const context = await browser.newContext({ storageState: state("mediator") }); await provide(await context.newPage()); await context.close(); },
  adminPage: async ({ browser }, provide) => { const context = await browser.newContext({ storageState: state("admin") }); await provide(await context.newPage()); await context.close(); },
});

export { expect } from "@playwright/test";
