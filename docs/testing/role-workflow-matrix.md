# Role-based workflow audit

Audit date: 2026-07-11. The matrix is derived from App Router pages, server actions, Supabase schema/migrations, RLS policies, and role navigation. `DEAD END` means the declared database status has no complete user action in the current UI.

| Workflow | Current Role | Current Status | Available Action | Next Status | Next Role | Destination Page | API | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Case intake | Debtor | `draft` | Edit, upload documents, submit | `submitted` | Admin | `/debtor/cases/[id]` | `submitCase` | Supported |
| Admin review | Admin | `submitted`, `reviewing`, `admin_review` | Send to creditor | `creditor_review` | Creditor | `/admin/cases` | `sendCaseToCreditorReview` | Supported; transition guarded server-side |
| More information | Admin/Creditor | `submitted`, `admin_review`, `creditor_review` | Request information | `needs_more_info` | Debtor | `/debtor/cases/[id]/edit` | `requestCaseMoreInfo`, `requestCreditorMoreInfo` | Supported |
| Creditor review | Creditor | `creditor_review` | Accept, reject, propose terms | `creditor_accepted`, `creditor_rejected`, `needs_more_info` | Debtor | `/creditor/cases/[id]` | creditor actions | Supported |
| Mediator matching | Debtor | `creditor_accepted`, `mediator_matching`, `matched` | Select mediator | `mediator_selected` | Mediator | `/debtor/cases/[id]/mediator` | server action | Supported |
| Mediator acceptance | Mediator | `mediator_selected` | Accept or reject assignment | `appointment_scheduling`, `mediator_matching` | Debtor | `/mediator/cases/[caseId]` | assignment actions | Supported; compare-and-set and RLS guarded |
| Availability | Mediator | approved profile | Save weekly hours | unchanged | Debtor | `/mediator/availability` | server action | Supported |
| Appointment proposal | Debtor | `mediator_selected` | Select slot | `appointment_scheduling` | Creditor/Mediator | `/debtor/cases/[id]/appointments/new` | appointment action | Supported |
| Appointment confirmation | Debtor/Creditor/Mediator | `requested`, `pending_confirmation` | Confirm or request reschedule | `confirmed`, `reschedule_requested` | All parties | role appointment detail | role server actions | Supported |
| Join meeting | All parties | `confirmed` | Open meeting URL when supplied | unchanged | Mediator | appointment detail | — | Supported; manual meeting URL required |
| Mediation outcome | Mediator | appointment `completed` | Record settled/not settled result | `settled`, `not_settled` | Signers | `/mediator/closing/[caseId]` | `closeMediationCase` | Supported |
| Settlement generation | Mediator | `settled`, `not_settled` | Generate document and invoice during close | unchanged | Debtor/Creditor/Mediator | `/documents/settlements/[documentId]` | closing action | Supported |
| E-signature | Debtor/Creditor/Mediator | unsigned document | Sign as current role | unchanged | Remaining signer | settlement document page | `signSettlementDocument` | Supported |
| Signed PDF | All case parties | document signatures complete | Download PDF | unchanged | Mediator | settlement PDF route | route handler | Supported |
| Case closure | Last signer/system | `settled` | Third required signature closes case automatically | `closed` | Debtor | settlement document page | `signSettlementDocument` | Supported for settlement agreements |
| Invoice | Creditor/Admin | `issued`, `sent`, `paid`, `overdue` | View/download/manage | status-dependent | Creditor/Admin | `/creditor/billing`, `/admin/billing` | billing actions | Supported |
| Review | Debtor | case `settled`, `closed` | Submit mediator review | review `pending` | Admin | `/debtor/cases/[id]/review` | review action | Supported |
| Review moderation | Admin | review `pending` | Approve/reject | `approved`, `rejected` | Public | `/admin/dashboard/reviews-trust-score` | admin action | Supported |
| Public review | Public | review `approved` | View mediator profile/card | unchanged | — | public mediator surfaces | public query | Supported |

## Backend consistency findings

- Admin status mutations now verify the current state and use a compare-and-set update, preventing stale retries and double submission.
- Creditor actions authorize the organization server-side, but their status mutation and related response/history inserts are separate statements; a database transaction/RPC is still required for strict all-or-nothing behavior.
- Closing creates records, plans, documents, invoice items, status updates, and audit data in separate statements. A failure can leave partial data; this remains a high-priority transactional gap.
- RLS is enabled in the workflow migrations and participant/ownership predicates are present. Any newly exposed table must keep RLS enabled and grants minimal.

## Required regression checks

- `tests/e2e/mediation-full-flow.spec.ts` checks role destinations and applies `assertNoWorkflowDeadEnd`.
- `tests/helpers/workflow.ts` asserts heading, no 404/runtime error, no console errors, and either navigation/next action or an explicit waiting explanation.
- `tests/auth/setup.ts` creates one storage state per role using environment credentials only; no password is committed.
- Reset test data with `npm run cleanup:demo` followed by `npm run seed:demo`. Cleanup preserves auth users.
