# Form Upload Auth Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix debtor case creation, mediator registration, auth branding, file uploads, and form value preservation across validation failures.

**Architecture:** Keep Server Actions as the mutation boundary and convert high-risk forms to client wrappers using `useActionState` so validation errors return state instead of redirecting away. Store uploaded case documents in Supabase Storage and persist uploaded document metadata in `cases.uploaded_documents`.

**Tech Stack:** Next.js 16 App Router, React 19 `useActionState`, Supabase SSR client, Supabase Storage, TypeScript.

---

### Task 1: Shared Form State Helpers

**Files:**
- Create: `src/lib/form-state.ts`
- Modify: `src/lib/cases.ts`

- [x] Add a serializable form state shape with `error`, `success`, and `values`.
- [x] Add helpers to convert `FormData` into string values without preserving file blobs.
- [x] Extend case parsing to include `address`, uploaded document metadata, and existing documents.

### Task 2: Thai Province Cascading Selects

**Files:**
- Create: `src/lib/thai-locations.ts`
- Create: `src/components/debtor/case-location-fields.tsx`
- Modify: `src/components/debtor/case-form.tsx`

- [x] Add a focused Thai province/district list for the current UX.
- [x] Replace free text province/district with cascading dropdowns.
- [x] Add the address field to the debtor case form.

### Task 3: Case Upload and Error Preservation

**Files:**
- Create: `src/components/debtor/case-form-submit.tsx`
- Modify: `src/components/debtor/case-form.tsx`
- Modify: `src/app/debtor/cases/actions.ts`
- Modify: `src/app/debtor/cases/new/page.tsx`
- Modify: `src/app/debtor/cases/[id]/edit/page.tsx`

- [x] Convert create/update case actions to `useActionState` signatures.
- [x] Upload multiple files to Supabase Storage using unique paths.
- [x] Preserve typed values when validation or Supabase mutation fails.
- [x] Keep existing uploaded documents during edit and append newly uploaded files.

### Task 4: Auth and Mediator Form Value Preservation

**Files:**
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/register-form.tsx`
- Create: `src/components/mediator/mediator-form-submit.tsx`
- Modify: `src/app/auth/actions.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Modify: `src/app/mediator/actions.ts`
- Modify: `src/components/mediator/mediator-profile-form.tsx`

- [x] Return validation/auth errors from login/register instead of redirecting for recoverable errors.
- [x] Preserve login email and register profile fields after validation failure.
- [x] Return mediator save/submit errors without clearing the profile form.
- [x] Log detailed Supabase errors server-side for failed mediator profile writes.

### Task 5: Branding and Email Template Artifact

**Files:**
- Create: `supabase/templates/confirmation.html`
- Modify: `src/app/login/page.tsx`

- [x] Replace the login panel mark with `public/images/nt-logo.png`.
- [x] Add a Supabase confirmation email template branded as NT AI Mediation for Dashboard/Management API use.

### Task 6: Verification

**Files:**
- No source edits.

- [x] Run `npm run typecheck`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Report any environment-only Supabase setup needed, especially Storage bucket/policies and hosted Auth template installation.
