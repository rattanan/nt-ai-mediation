# Digital Settlement Agreement & e-Signature MVP Design

## Summary

Build an end-to-end Digital Settlement Agreement and e-Signature MVP for the NT AI Digital Mediation Platform. When a mediator records a successful mediation, the system creates an official agreement draft, collects signatures from debtor, creditor, and mediator, generates a final verifiable agreement document, logs simulated email delivery, creates invoices, and closes the case.

The MVP must be demo-ready and secure enough for realistic role-based testing. It will not integrate a real OTP provider or email provider in this phase; those actions are represented by explicit verification states and audit/email logs.

## Goals

- Generate a settlement agreement draft automatically after a mediator marks mediation as successful.
- Require debtor, creditor, and mediator signatures before the case is closed.
- Support typed, drawn, and uploaded signature modes.
- Store immutable signature evidence: signer, role, timestamp, user agent, IP-derived metadata where available, and document hashes.
- Generate a final agreement document route with NT branding, signature blocks, verification URL, and SHA-256 hash.
- Provide a public verification page by agreement number.
- Add participant download center entry points and admin visibility for agreement status, signatures, audit timeline, and downloads.
- Preserve the existing billing and closing behavior, but move successful case closure until all signatures are completed.

## Non-Goals For This MVP

- Real email delivery through SMTP, Resend, SendGrid, or Supabase Edge Functions.
- Real OTP delivery or Google re-auth challenge.
- Legally certified digital signature provider integration.
- Binary PDF generation and permanent object storage in Supabase Storage.
- Complex multi-version redlining UI after signatures begin.

## Existing Context

The app already has:

- `mediation_closing_records` for mediator closing results.
- `settlement_payment_plans` for payment terms.
- `settlement_documents` for existing settlement/closing document routes.
- `billing_invoices` and `billing_invoice_items` for platform and success fees.
- `email_logs` for queued email-like events.
- role shells for debtor, creditor, mediator, and admin.
- case statuses including `settlement_draft`, `settled`, `not_settled`, and `closed`.

The MVP will extend this model rather than replacing it.

## User Workflow

### Successful Mediation

1. Mediator completes appointment and opens the closing form.
2. Mediator selects successful result and enters settlement terms.
3. Server creates:
   - `mediation_closing_records`
   - `settlement_payment_plans`
   - `settlement_agreements`
   - initial audit log entries
4. Case status becomes `settlement_draft`.
5. The mediator is redirected to the agreement page rather than a final closed-case success page.

### Signature Order

The MVP enforces sequential signing:

1. Debtor signs first.
2. Creditor signs after debtor.
3. Mediator signs last.

Participants can view the draft before their turn, but only the current required signer sees an active signing form.

### Completion

When the mediator signs:

1. Agreement status becomes `completed`.
2. Final agreement hash is calculated.
3. Final document route is assigned as `pdf_url`.
4. Simulated email logs are created for debtor, creditor, mediator, and admin.
5. Billing invoice generation runs using the existing fee settings.
6. Case status becomes `closed`.
7. Case status history records the transition from `settlement_draft` to `closed`.

## Agreement Numbering

Use the format:

```text
NT-SET-YYYY-000001
```

The sequence is generated from the count of existing agreements for the current year plus one. This is acceptable for the MVP. A future production phase should replace it with a database sequence or transactional counter to avoid race conditions under high concurrency.

## Database Design

### `settlement_agreements`

Fields:

- `id uuid primary key`
- `case_id uuid references cases(id)`
- `closing_record_id uuid references mediation_closing_records(id)`
- `agreement_number text unique not null`
- `version integer not null default 1`
- `generated_by uuid references profiles(id)`
- `generated_at timestamptz not null default now()`
- `status text not null check in ('draft', 'waiting_signature', 'completed')`
- `current_signature_role text check in ('debtor', 'creditor', 'mediator')`
- `agreement_snapshot jsonb not null`
- `pdf_url text`
- `hash_sha256 text`
- `completed_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

The snapshot stores immutable case, party, mediator, and settlement term data used for preview, signing, and verification. After the first signature, the snapshot must not be edited by application code.

### `agreement_signatures`

Fields:

- `id uuid primary key`
- `agreement_id uuid references settlement_agreements(id)`
- `user_id uuid references profiles(id)`
- `role text check in ('debtor', 'creditor', 'mediator')`
- `signature_type text check in ('draw', 'typed', 'upload')`
- `signature_image text`
- `signed_name text not null`
- `signed_datetime timestamptz not null default now()`
- `ip_address text`
- `browser text`
- `device text`
- `latitude numeric`
- `longitude numeric`
- `hash_before text not null`
- `hash_after text not null`
- `verification_method text not null default 'demo_email_otp'`
- `terms_accepted boolean not null default true`
- `created_at timestamptz`

Add a unique constraint on `(agreement_id, role)` so each required role can sign once.

### `agreement_download_logs`

Fields:

- `id uuid primary key`
- `agreement_id uuid references settlement_agreements(id)`
- `downloaded_by uuid references profiles(id)`
- `download_time timestamptz not null default now()`
- `ip_address text`
- `created_at timestamptz`

### `agreement_audit_logs`

Fields:

- `id uuid primary key`
- `agreement_id uuid references settlement_agreements(id)`
- `actor_id uuid references profiles(id)`
- `event_type text not null`
- `event_summary text not null`
- `metadata jsonb not null default '{}'`
- `ip_address text`
- `user_agent text`
- `created_at timestamptz`

Audit logs are append-only in application code. No delete UI will be built.

## RLS And Authorization

Participants can select an agreement when:

- debtor: `cases.debtor_user_id = auth.uid()`
- creditor: user is an officer of `cases.creditor_organization_id`
- mediator: mediator profile user owns `cases.selected_mediator_profile_id`
- admin: `is_admin()`

Only the active required signer can insert their signature. Admins can view every agreement and audit log but cannot sign on behalf of participants in the MVP.

The public verification page must not expose private settlement terms. It displays only agreement number, status, generated date, completed date, hash, participant role signature status, and verification result.

## Agreement Snapshot

The snapshot must contain:

- case number and case id
- debtor name and contact email where available
- creditor organization name and contact data where available
- mediator full name and license data where available
- original debt amount
- settled amount
- discount amount
- payment frequency
- installment amount
- number of installments
- first payment due date
- payment method
- special terms
- mediator note
- settlement summary
- generated date

## Document Template

The agreement page and final printable document use NT branding and these sections:

1. Introduction
2. Parties
3. Background
4. Settlement Conditions
5. Payment Schedule
6. Rights and Obligations
7. Default Conditions
8. Confidentiality
9. PDPA Consent
10. Electronic Signature Consent
11. Final Agreement
12. Signature Section

The final document includes:

- NT logo
- title: Settlement Agreement
- case number
- agreement number
- current/final date
- signature blocks for debtor, creditor, mediator
- timestamp per signature
- verification URL
- document hash
- footer: Generated by NT AI Digital Mediation Platform

## UI Design

### Shared Agreement Page

Route: `/agreements/[agreementId]`

Sections:

- progress stepper: Draft, Debtor Signed, Creditor Signed, Mediator Signed, Final Generated, Email Logged, Completed
- agreement metadata header
- signature status cards
- agreement preview
- download draft/final button
- signing panel for the active role
- audit timeline

### Signature Form

The form supports:

- typed signature text input
- drawn signature canvas as a data URL
- uploaded PNG/JPEG signature image preview
- required terms checkbox
- demo OTP confirmation checkbox or hidden server-side verification marker
- confirm button

Once a signature exists for a role, the UI displays the signature and timestamp and hides editing controls.

### Download Center Entry Points

Add agreement links to:

- debtor agreements page
- creditor case detail or billing/case pages where applicable
- mediator closing success and appointment/case flow
- admin agreements list page

### Admin Agreement Page

Routes:

- `/admin/agreements`
- `/admin/agreements/[agreementId]`

Admin can:

- view all agreements with pagination
- filter by status
- open agreement detail
- view signatures
- view audit timeline
- view download history
- simulate resend email by creating email/audit logs
- open final document

## Hashing

Use SHA-256 through the Web Crypto API or Node crypto on the server. Hash input should be a stable JSON string of:

- agreement id
- agreement number
- version
- agreement snapshot
- existing signatures
- current signing role/action

`hash_before` stores the hash before a signature insert. `hash_after` stores the hash after the signature insert. `settlement_agreements.hash_sha256` stores the final hash after all signatures are complete.

## Email Simulation

When agreement completes, create `email_logs` for:

- debtor: `Settlement Agreement Completed`
- creditor: `Settlement Agreement Completed`
- mediator: `Settlement Agreement Completed`
- admin: `Settlement Agreement Completed`

Each log uses `status = 'sent'` for MVP demo purposes and includes a corresponding audit log event. No external email is sent.

## Billing And Case Closing

For successful mediation, invoice creation moves from mediator closing submission to agreement completion. This prevents success fee invoices from being issued before signatures are complete.

For unsuccessful mediation, the existing flow can remain unchanged: record closing, create unsuccessful report, create platform invoice if applicable, and set case status to `not_settled`.

## Demo Data

The migration should include schema only. Demo data can be generated through a server-side helper or admin action only if existing seed patterns support it. The MVP can demonstrate the module with real cases created through the existing flow.

## Error Handling

- If agreement creation fails after closing insert, redirect mediator to the closing page with an error and do not mark the case closed.
- If a user tries to sign out of order, show a destructive alert and keep the agreement unchanged.
- If a duplicate signature is submitted, show a success-style no-op message if the existing signature belongs to that user and role; otherwise show an authorization error.
- If finalization fails after the last signature, keep agreement in `waiting_signature`, create an audit log with `finalization_failed`, and show an admin-visible error.

## Testing And Verification

Required local checks:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Manual flow checks:

1. Mediator closes a completed appointment as successful.
2. Agreement draft is created and case status becomes `settlement_draft`.
3. Debtor can view and sign.
4. Creditor can view and sign after debtor.
5. Mediator can sign after creditor.
6. Agreement becomes completed.
7. Case becomes closed.
8. Email logs exist.
9. Invoice exists.
10. Verification page shows valid status.

## Future Production Phases

- Real OTP email delivery or Google re-auth verification.
- Real email provider integration.
- Binary PDF generation stored in Supabase Storage.
- Database sequence-backed agreement numbering.
- Multi-version agreement amendments before first signature.
- Tamper-evident external timestamping or certified e-signature provider integration.
