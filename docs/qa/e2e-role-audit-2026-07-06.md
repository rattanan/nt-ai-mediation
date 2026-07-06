# E2E Role Audit - 2026-07-06

Scope: NT AI Digital Mediation Platform role audit for Debtor, Creditor, Mediator, and Admin.

## Verification Run

| Command | Result | Notes |
| --- | --- | --- |
| `npm install` | Pass | Installed dependencies. NPM reported 2 moderate vulnerabilities. |
| `npm install -D @playwright/test` | Pass | Added Playwright test runner. |
| `npm run lint` | Pass | No ESLint errors after fixes. |
| `npm run build` | Pass | Next.js 16.2.10 production build completed. |
| `npm run test:e2e:list` | Pass | 32 tests discovered across desktop and mobile projects. |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test` | Pass | 32 passed across desktop Chromium and mobile Chromium after supplying `E2E_*` credentials. Required escalated execution for Chromium process launch. |
| `npm run seed:demo` | Pass | Ran with the supplied service role key. Seed completed with 20 debtors, 8 creditors, 10 mediators, 50 cases, and demo password `Demo@123456`. |
| `supabase projects list` | Pass | Access token is valid. Linked project is `ai-mediation` (`mrojfiejpiaxvggiqxsd`) and status is `ACTIVE_HEALTHY`. |
| `supabase db push --linked --yes` | Pass | Applied `20260706103000_add_settlement_document_signatures.sql` and `20260706110000_fix_creditor_org_rls_and_function_grants.sql`. |
| `supabase migration list --linked` | Pass | Local and remote timestamped migrations now match through `20260706110000`. Non-timestamp legacy migration files are still skipped by CLI. |
| `supabase db query --linked` | Pass | Core tables are reachable and `settlement_document_signatures` now exists. |
| `supabase db advisors --linked --type security` | Improved, Warnings Remain | RLS disabled errors for creditor tables are resolved. Remaining warnings include help-center function search paths, public bucket listing, authenticated SECURITY DEFINER execution, and leaked password protection disabled. |
| `supabase db push --linked --dry-run` | Pass | Remote database is up to date. |
| Anonymous Supabase consent query | Pass | Publishable-key client can read the active consent version after the consent policy fix. |

## Bug Report

| No | Role | Page/Flow | Issue | Severity | Expected Result | Actual Result | Suggested Fix | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Debtor/Mediator | Appointment slot picker | React lint failed because state was corrected synchronously inside effects. This can trigger cascading renders and blocks CI lint. | High | Appointment UI should render without lint/runtime risk. | `npm run lint` failed on `react-hooks/set-state-in-effect`. | Derive safe selected slot/week/mobile day during render instead of mutating state in effects. | Fixed |
| 2 | All | Automated E2E | Project had no Playwright setup/tests for role flows and RBAC. | High | Role login, redirects, portal access, and responsive smoke checks should be automated. | No Playwright config or E2E test files were present. | Add Playwright config and six role/security spec files. | Fixed |
| 3 | All | E2E runtime | Playwright cannot start `webServer` inside normal sandbox because local port binding is restricted. | Medium | `npx playwright test` should start a local server and run tests. | Direct server start works with approved `npm run dev`; E2E works when `PLAYWRIGHT_BASE_URL` points to that server and Chromium runs escalated. | Keep documented `PLAYWRIGHT_BASE_URL` path for constrained environments; run normally in CI/local shell with browser permissions. | Workaround documented |
| 4 | All | Test data | Demo seed required service role credentials. | Medium | Demo data should be created from seed script. | After service role key was supplied, seed completed successfully. | Run `SUPABASE_SERVICE_ROLE_KEY=... npm run seed:demo` in trusted environments only. | Fixed |
| 8 | All | E2E credentials | Full role flows were skipped until role credentials were supplied. | Medium | Debtor/Creditor/Mediator/Admin flows should log in and verify role redirects/pages. | After demo seed and `E2E_*` env vars were supplied, full suite ran with 32 passed. | Keep demo credentials documented for non-production QA. | Fixed |
| 5 | Admin | Billing/Cases/Reports | ESLint warnings from unused imports/variables reduce CI signal. | Low | Lint output should be clean. | Warnings in admin billing, admin cases, admin reports, debtor creditor picker, appointments helper. | Remove unused code. | Fixed |
| 6 | Security | Supabase env | Publishable Supabase URL/key are hardcoded as fallbacks. They are not service secrets, but production-ready deployments should avoid accidental project coupling. | Medium | Environment should explicitly configure project URL/key per environment. | App can silently fall back to a specific Supabase project. | Remove fallbacks or gate them to demo mode only. | Open |
| 7 | Security | Supabase SQL | Security advisors found exposed SECURITY DEFINER helper functions and mutable function search path warnings. | Medium | Helper functions should not be executable by `anon`, and trigger/search functions should have stable `search_path`. | After fix, anon SECURITY DEFINER warnings are gone. Authenticated SECURITY DEFINER warnings remain for helper functions, and help-center function search path warnings remain. | Keep helper functions authenticated-only if intentional for RLS; add follow-up migration for help-center function `search_path` and review whether RPC execution should be revoked from `authenticated`. | Partially fixed |
| 9 | Security | Supabase RLS | RLS was disabled on remote `public.creditor_organizations` and `public.creditor_officers`. | Critical | Public schema tables exposed through PostgREST should have RLS enabled. | Advisors previously reported RLS disabled and `tax_id` exposure. | Applied migration to enable RLS and recreate scoped policies. Advisor no longer reports the RLS-disabled errors. | Fixed |
| 10 | Documents | Settlement signatures | Remote DB was missing `public.settlement_document_signatures`. | High | Settlement document signing flow should have its backing table and RLS policies. | Query previously failed with missing relation. | Applied pending migration `20260706103000_add_settlement_document_signatures.sql`; query now returns the table with 0 rows. | Fixed |
| 11 | All | Auth redirects | Middleware used a hardcoded production base URL for protected-route redirects. | High | Local and preview environments should redirect within the current origin. | RBAC E2E redirected local sessions to `https://ai-mediation.rattanan.dev/login`. | Build redirects from `request.url`; make app base URL env-driven for auth callback links. | Fixed |
| 12 | Admin | Login / Consent | Admin demo user had not accepted the latest consent version, so login stopped at `/auth/consent`. | Medium | E2E should verify the consent gate and continue after accepting required terms. | Admin login tests timed out waiting for `/admin/dashboard`. | Add Playwright helper support for consent acceptance after login. | Fixed |
| 13 | Debtor | Create case | New case page first requires selecting a creditor organization before rendering the full case form. | Low | E2E should follow the real guarded flow before checking form/upload controls. | Test expected form and upload controls immediately at `/debtor/cases/new`. | Update E2E helper to select the first public creditor organization before asserting the case form. | Fixed |
| 14 | Public/Auth | Register / Consent | Tightening function grants caused public consent lookup to fail because the active-consent select policy called `public.is_admin()` for anon requests. | High | Anonymous users should read only the active consent version without executing admin helper functions. | Dev logs showed `permission denied for function is_admin`; register redirected to fallback consent. | Split consent RLS into public active-select and authenticated admin-select policies. Applied `20260706113000_fix_consent_version_public_policy.sql`. | Fixed |

## Supabase Remote Test

Read-only checks with the provided access token:

- Token accepted by Supabase Management API.
- Linked project: `ai-mediation`, ref `mrojfiejpiaxvggiqxsd`, `ACTIVE_HEALTHY`.
- Core row counts: `profiles` 42, `cases` 53, `creditor_organizations` 11, `mediator_profiles` 10.
- Applied remote migrations:
  - `20260706103000_add_settlement_document_signatures.sql`
  - `20260706110000_fix_creditor_org_rls_and_function_grants.sql`
  - `20260706113000_fix_consent_version_public_policy.sql`
- Post-push dry-run result: remote database is up to date.
- Anonymous publishable-key consent query result: active consent version `1.0` is readable.
- Post-push row counts: `profiles` 42, `cases` 53, `creditor_organizations` 11, `creditor_officers` 3, `mediator_profiles` 10, `settlement_document_signatures` 0.

## Flow Coverage Added

Automated tests added:

- `tests/e2e/auth.spec.ts`
- `tests/e2e/debtor-flow.spec.ts`
- `tests/e2e/creditor-flow.spec.ts`
- `tests/e2e/mediator-flow.spec.ts`
- `tests/e2e/admin-flow.spec.ts`
- `tests/e2e/rbac-security.spec.ts`

Current automated coverage includes:

- Public landing/auth pages smoke test.
- Anonymous route protection for debtor, creditor, mediator, admin portals.
- Role login redirect checks when `E2E_*` credentials are supplied.
- Debtor case form and upload control smoke checks.
- Creditor organization/cases/billing page access smoke checks.
- Mediator profile/availability/appointments page access smoke checks.
- Admin users/creditors/mediators/cases/billing/reports page access smoke checks.
- Desktop Chromium and mobile Chromium projects for responsive smoke coverage.

## Demo Data

Existing seed script `scripts/seed-demo.mjs` exceeds the requested minimum:

- Debtor users: 20
- Creditor organizations: 8
- Mediators: 10
- Cases: 50
- Includes invoices, settlement plans, mediator reviews, trust scores, appointments, and status history.

Status coverage in seed:

- `draft`
- `submitted`
- `admin_review`
- `creditor_review`
- `mediator_matching`
- `mediator_selected`
- `appointment_scheduling`
- `scheduled`
- `in_mediation`
- `settled`
- `not_settled`
- `closed`

Requested labels that map differently in code:

- Waiting Admin Review = `admin_review`
- Waiting Mediator = `mediator_matching`
- Failed = `not_settled`

## How To Run E2E

Set role credentials for full login/role coverage:

```bash
export E2E_DEBTOR_EMAIL=debtor01@nt-ai-mediation.demo
export E2E_DEBTOR_PASSWORD=Demo@123456
export E2E_CREDITOR_EMAIL=creditor01@nt-ai-mediation.demo
export E2E_CREDITOR_PASSWORD=Demo@123456
export E2E_MEDIATOR_EMAIL=mediator01@nt-ai-mediation.demo
export E2E_MEDIATOR_PASSWORD=Demo@123456
export E2E_ADMIN_EMAIL=admin@nt-ai-mediation.demo
export E2E_ADMIN_PASSWORD=Demo@123456
```

Then run:

```bash
npm run test:e2e
```

To test an already running server or deployment:

```bash
PLAYWRIGHT_BASE_URL=https://your-url.example npm run test:e2e
```
