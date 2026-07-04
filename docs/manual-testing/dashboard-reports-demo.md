# Dashboard Reports Demo Manual Testing Guide

## Seed Demo Data

1. Set `SUPABASE_SERVICE_ROLE_KEY` in the shell.
2. Optional: set `DEMO_PASSWORD`.
3. Run:

```bash
npm run seed:demo
```

Expected result:

- Demo users are created with emails ending in `.demo`.
- At least 50 demo cases are created with case numbers `NT-DEMO-*`.
- Demo mediators receive availability, reviews, and trust scores.

Default password:

```text
Demo@123456
```

## Demo Login Examples

- Admin: `admin@nt-ai-mediation.demo`
- Debtor: `debtor01@nt-ai-mediation.demo`
- Creditor: `creditor01@nt-ai-mediation.demo`
- Mediator: `mediator01@nt-ai-mediation.demo`

## Admin Dashboard

1. Sign in as admin.
2. Open `/admin/dashboard`.
3. Confirm KPI cards show cases, revenue, users, creditors, mediators, and review queue.
4. Confirm charts render for monthly cases, status, debt type, revenue, province, and aging.
5. Confirm tables render latest cases, SLA risk, high risk, top mediators, and top creditors.

## Reports

1. Open `/admin/reports`.
2. Apply filters for date, debt type, province, creditor, mediator, and status.
3. Confirm operational, financial, and quality report summaries update.
4. Click `Export CSV`.

Expected result: browser downloads a CSV file for the filtered case report.

## Role Dashboards

1. Debtor opens `/debtor` or `/debtor/dashboard`.
2. Creditor opens `/creditor` or `/creditor/dashboard`.
3. Mediator opens `/mediator` or `/mediator/dashboard`.

Expected result:

- Debtor sees own cases, next appointment, and status list.
- Creditor sees organization case counts, recovery rate, invoices, and fees.
- Mediator sees assigned cases, appointment queue, trust score, rating, and feedback.

## Notes

- PDF and Excel exports are intentionally left as TODO after CSV.
- Complaint metrics are shown as TODO until a complaint table is introduced.
