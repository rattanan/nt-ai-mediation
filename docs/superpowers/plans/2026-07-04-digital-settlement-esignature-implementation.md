# Digital Settlement Agreement e-Signature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved MVP for digital settlement agreements, three-party e-signatures, final verification, email simulation, invoice creation, and case closure.

**Architecture:** Add agreement tables and typed service boundaries around existing closing/billing flow. Successful mediator closing creates an agreement draft and keeps the case in `settlement_draft`; the final signer triggers hash finalization, simulated email logs, invoice generation, and case closure. UI is split into server-rendered pages for access-controlled data and small client components only for signature capture.

**Tech Stack:** Next.js App Router 16.2.10, React 19, TypeScript, Supabase/PostgreSQL/RLS, Tailwind, existing local UI primitives, Web/Node crypto.

---

## File Structure

- Create `supabase/migrations/20260704165000_add_digital_settlement_agreements.sql`: agreement schema, indexes, RLS policies.
- Modify `src/types/database.ts`: add agreement status/signature types and table types.
- Create `src/lib/agreements.ts`: server-only agreement queries, snapshot creation, numbering, hashing, authorization helpers, finalization helpers.
- Create `src/app/agreements/actions.ts`: server actions for signing, download logging, and admin resend simulation.
- Create `src/components/agreements/agreement-progress.tsx`: progress stepper.
- Create `src/components/agreements/agreement-preview.tsx`: NT-branded agreement content.
- Create `src/components/agreements/signature-panel.tsx`: client signature capture.
- Create `src/components/agreements/signature-status-card.tsx`: role signature cards.
- Create `src/app/agreements/[agreementId]/page.tsx`: participant agreement workspace.
- Create `src/app/agreements/[agreementId]/document/page.tsx`: printable final/draft document route.
- Create `src/app/verify/[agreementNo]/page.tsx`: public verification page.
- Create `src/app/admin/agreements/page.tsx`: admin list with pagination and status filter.
- Create `src/app/admin/agreements/[agreementId]/page.tsx`: admin detail, timeline, downloads, resend simulation.
- Modify `src/components/admin/admin-shell.tsx`: add Agreements navigation.
- Modify `src/components/creditor/creditor-shell.tsx`: add Agreements navigation.
- Modify `src/lib/mediator-portal.ts`: add Agreements navigation.
- Modify `src/app/mediator/closing/actions.ts`: route successful closings into agreement draft instead of immediate invoice/case closure.
- Modify `src/app/debtor/agreements/page.tsx`: show digital agreements plus existing closing records.
- Create `src/app/creditor/agreements/page.tsx`: creditor organization agreement download center.
- Create `src/app/mediator/agreements/page.tsx`: mediator agreement list.

## Task 1: Database Schema And Types

**Files:**
- Create: `supabase/migrations/20260704165000_add_digital_settlement_agreements.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add agreement migration**

Create the migration with these definitions:

```sql
create table if not exists public.settlement_agreements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  closing_record_id uuid not null references public.mediation_closing_records(id) on delete cascade,
  agreement_number text not null unique,
  version integer not null default 1 check (version > 0),
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(),
  status text not null default 'waiting_signature' check (status in ('draft', 'waiting_signature', 'completed')),
  current_signature_role text check (current_signature_role in ('debtor', 'creditor', 'mediator')),
  agreement_snapshot jsonb not null,
  pdf_url text,
  hash_sha256 text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreement_signatures (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.settlement_agreements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('debtor', 'creditor', 'mediator')),
  signature_type text not null check (signature_type in ('draw', 'typed', 'upload')),
  signature_image text,
  signed_name text not null,
  signed_datetime timestamptz not null default now(),
  ip_address text,
  browser text,
  device text,
  latitude numeric,
  longitude numeric,
  hash_before text not null,
  hash_after text not null,
  verification_method text not null default 'demo_email_otp',
  terms_accepted boolean not null default true,
  created_at timestamptz not null default now(),
  constraint agreement_signatures_unique_role unique (agreement_id, role)
);

create table if not exists public.agreement_download_logs (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.settlement_agreements(id) on delete cascade,
  downloaded_by uuid references public.profiles(id) on delete set null,
  download_time timestamptz not null default now(),
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.agreement_audit_logs (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.settlement_agreements(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  event_summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists settlement_agreements_case_idx on public.settlement_agreements(case_id);
create index if not exists settlement_agreements_status_idx on public.settlement_agreements(status, generated_at desc);
create index if not exists agreement_signatures_agreement_idx on public.agreement_signatures(agreement_id, signed_datetime);
create index if not exists agreement_download_logs_agreement_idx on public.agreement_download_logs(agreement_id, download_time desc);
create index if not exists agreement_audit_logs_agreement_idx on public.agreement_audit_logs(agreement_id, created_at desc);

drop trigger if exists set_settlement_agreements_updated_at on public.settlement_agreements;
create trigger set_settlement_agreements_updated_at
before update on public.settlement_agreements
for each row execute function public.set_updated_at();

alter table public.settlement_agreements enable row level security;
alter table public.agreement_signatures enable row level security;
alter table public.agreement_download_logs enable row level security;
alter table public.agreement_audit_logs enable row level security;

drop policy if exists "agreements_select_participants" on public.settlement_agreements;
create policy "agreements_select_participants"
on public.settlement_agreements for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.cases c
    where c.id = settlement_agreements.case_id
    and (
      c.debtor_user_id = (select auth.uid())
      or public.is_creditor_org_officer(c.creditor_organization_id)
      or exists (
        select 1 from public.mediator_profiles mp
        where mp.id = c.selected_mediator_profile_id
        and mp.user_id = (select auth.uid())
      )
    )
  )
);

drop policy if exists "agreements_insert_mediator_admin" on public.settlement_agreements;
create policy "agreements_insert_mediator_admin"
on public.settlement_agreements for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.cases c
    join public.mediator_profiles mp on mp.id = c.selected_mediator_profile_id
    where c.id = settlement_agreements.case_id
    and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "agreements_update_mediator_admin" on public.settlement_agreements;
create policy "agreements_update_mediator_admin"
on public.settlement_agreements for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.cases c
    join public.mediator_profiles mp on mp.id = c.selected_mediator_profile_id
    where c.id = settlement_agreements.case_id
    and mp.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.cases c
    join public.mediator_profiles mp on mp.id = c.selected_mediator_profile_id
    where c.id = settlement_agreements.case_id
    and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "agreement_signatures_select_participants" on public.agreement_signatures;
create policy "agreement_signatures_select_participants"
on public.agreement_signatures for select
to authenticated
using (
  exists (
    select 1 from public.settlement_agreements a
    join public.cases c on c.id = a.case_id
    where a.id = agreement_signatures.agreement_id
    and (
      public.is_admin()
      or c.debtor_user_id = (select auth.uid())
      or public.is_creditor_org_officer(c.creditor_organization_id)
      or exists (
        select 1 from public.mediator_profiles mp
        where mp.id = c.selected_mediator_profile_id
        and mp.user_id = (select auth.uid())
      )
    )
  )
);

drop policy if exists "agreement_signatures_insert_self" on public.agreement_signatures;
create policy "agreement_signatures_insert_self"
on public.agreement_signatures for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "agreement_download_logs_select_participants" on public.agreement_download_logs;
create policy "agreement_download_logs_select_participants"
on public.agreement_download_logs for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.settlement_agreements a
    join public.cases c on c.id = a.case_id
    where a.id = agreement_download_logs.agreement_id
    and (
      c.debtor_user_id = (select auth.uid())
      or public.is_creditor_org_officer(c.creditor_organization_id)
      or exists (
        select 1 from public.mediator_profiles mp
        where mp.id = c.selected_mediator_profile_id
        and mp.user_id = (select auth.uid())
      )
    )
  )
);

drop policy if exists "agreement_download_logs_insert_self" on public.agreement_download_logs;
create policy "agreement_download_logs_insert_self"
on public.agreement_download_logs for insert
to authenticated
with check (downloaded_by = (select auth.uid()) or public.is_admin());

drop policy if exists "agreement_audit_logs_select_participants" on public.agreement_audit_logs;
create policy "agreement_audit_logs_select_participants"
on public.agreement_audit_logs for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.settlement_agreements a
    join public.cases c on c.id = a.case_id
    where a.id = agreement_audit_logs.agreement_id
    and (
      c.debtor_user_id = (select auth.uid())
      or public.is_creditor_org_officer(c.creditor_organization_id)
      or exists (
        select 1 from public.mediator_profiles mp
        where mp.id = c.selected_mediator_profile_id
        and mp.user_id = (select auth.uid())
      )
    )
  )
);

drop policy if exists "agreement_audit_logs_insert_authenticated" on public.agreement_audit_logs;
create policy "agreement_audit_logs_insert_authenticated"
on public.agreement_audit_logs for insert
to authenticated
with check ((select auth.uid()) is not null);
```

- [ ] **Step 2: Add TypeScript database types**

Add these exported unions near the other status types in `src/types/database.ts`:

```ts
export type SettlementAgreementStatus = "draft" | "waiting_signature" | "completed";
export type AgreementSignatureRole = "debtor" | "creditor" | "mediator";
export type AgreementSignatureType = "draw" | "typed" | "upload";
```

Then add `settlement_agreements`, `agreement_signatures`, `agreement_download_logs`, and `agreement_audit_logs` table entries to `Database["public"]["Tables"]` with Row/Insert/Update fields matching the SQL above. Use `Json` for `agreement_snapshot` and `metadata`.

- [ ] **Step 3: Verify type compile**

Run: `npm run typecheck`

Expected: TypeScript may still fail until service code is added if types are referenced immediately. If only this task was performed, expected result is PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add supabase/migrations/20260704165000_add_digital_settlement_agreements.sql src/types/database.ts
git commit -m "feat: add settlement agreement schema"
```

## Task 2: Agreement Service Layer

**Files:**
- Create: `src/lib/agreements.ts`
- Modify: `src/lib/closing.ts`

- [ ] **Step 1: Create agreement service types and labels**

Create `src/lib/agreements.ts`:

```ts
import "server-only";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calculateFees,
  getFeeSettings,
  invoiceDocumentUrl,
  invoiceNumber,
  logEmail,
} from "@/lib/closing";
import type {
  AgreementSignatureRole,
  AgreementSignatureType,
  Database,
  Json,
  SettlementAgreementStatus,
} from "@/types/database";

export type SettlementAgreement = Database["public"]["Tables"]["settlement_agreements"]["Row"];
export type AgreementSignature = Database["public"]["Tables"]["agreement_signatures"]["Row"];
export type AgreementAuditLog = Database["public"]["Tables"]["agreement_audit_logs"]["Row"];
export type AgreementDownloadLog = Database["public"]["Tables"]["agreement_download_logs"]["Row"];
export type AgreementWithDetails = SettlementAgreement & {
  cases?: Database["public"]["Tables"]["cases"]["Row"] | null;
  mediation_closing_records?: Database["public"]["Tables"]["mediation_closing_records"]["Row"] | null;
  agreement_signatures?: AgreementSignature[] | null;
  agreement_audit_logs?: AgreementAuditLog[] | null;
  agreement_download_logs?: AgreementDownloadLog[] | null;
};

export const agreementStatusLabels: Record<SettlementAgreementStatus, string> = {
  draft: "ร่างข้อตกลง",
  waiting_signature: "รอลงนาม",
  completed: "ลงนามครบแล้ว",
};

export const signatureRoleLabels: Record<AgreementSignatureRole, string> = {
  debtor: "ลูกหนี้",
  creditor: "เจ้าหนี้",
  mediator: "ผู้ไกล่เกลี่ย",
};

export const signatureTypeLabels: Record<AgreementSignatureType, string> = {
  typed: "พิมพ์ชื่อ",
  draw: "วาดลายเซ็น",
  upload: "อัปโหลดรูป",
};
```

- [ ] **Step 2: Add hash, request metadata, and numbering helpers**

Append:

```ts
export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
}

export function sha256(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export async function requestMetadata() {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? "";
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
    userAgent,
    browser: userAgent.split(" ")[0] ?? null,
    device: /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop",
  };
}

export async function nextAgreementNumber() {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const prefix = `NT-SET-${year}-`;
  const { count } = await supabase
    .from("settlement_agreements")
    .select("id", { count: "exact", head: true })
    .like("agreement_number", `${prefix}%`);
  return `${prefix}${String((count ?? 0) + 1).padStart(6, "0")}`;
}
```

- [ ] **Step 3: Add snapshot and agreement creation**

Append:

```ts
export async function buildAgreementSnapshot(closingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_closing_records")
    .select("*, cases(*), settlement_payment_plans(*), mediator_profiles(*), creditor_organizations(*)")
    .eq("id", closingId)
    .maybeSingle();
  if (!data) throw new Error("Closing record not found");

  const closing = data as unknown as Database["public"]["Tables"]["mediation_closing_records"]["Row"] & {
    cases?: Database["public"]["Tables"]["cases"]["Row"] | null;
    settlement_payment_plans?: Database["public"]["Tables"]["settlement_payment_plans"]["Row"][] | null;
    mediator_profiles?: Database["public"]["Tables"]["mediator_profiles"]["Row"] | null;
    creditor_organizations?: Database["public"]["Tables"]["creditor_organizations"]["Row"] | null;
  };
  const plan = closing.settlement_payment_plans?.[0] ?? null;
  const originalDebt = Number(closing.original_debt_amount ?? 0);
  const settled = Number(closing.settled_amount ?? 0);

  return {
    caseId: closing.case_id,
    caseNumber: closing.cases?.case_number ?? "-",
    generatedDate: new Date().toISOString(),
    debtor: {
      userId: closing.debtor_user_id,
      name: closing.cases?.debtor_name ?? "ลูกหนี้",
      email: null,
      phone: closing.cases?.contact_phone ?? null,
    },
    creditor: {
      organizationId: closing.creditor_organization_id,
      name: closing.creditor_organizations?.organization_name ?? closing.cases?.creditor_name ?? "เจ้าหนี้",
      email: closing.creditor_organizations?.contact_email ?? null,
    },
    mediator: {
      profileId: closing.mediator_id,
      name: closing.mediator_profiles
        ? `${closing.mediator_profiles.title ?? ""} ${closing.mediator_profiles.first_name} ${closing.mediator_profiles.last_name}`.trim()
        : "ผู้ไกล่เกลี่ย",
      licenseNo: closing.mediator_profiles?.license_no ?? null,
    },
    settlement: {
      originalDebtAmount: originalDebt,
      settledAmount: settled,
      discountAmount: Math.max(0, originalDebt - settled),
      summary: closing.settlement_summary,
      mediatorNote: closing.mediator_note,
      paymentFrequency: plan?.payment_frequency ?? null,
      installmentAmount: plan?.installment_amount ?? null,
      numberOfInstallments: plan?.number_of_installments ?? null,
      firstPaymentDueDate: plan?.first_payment_due_date ?? null,
      paymentMethod: plan?.payment_method ?? null,
      specialTerms: plan?.special_terms ?? null,
    },
  } satisfies Record<string, unknown>;
}

export async function createAgreementForClosing(input: {
  caseId: string;
  closingId: string;
  generatedBy: string;
}) {
  const supabase = await createClient();
  const agreementNumber = await nextAgreementNumber();
  const snapshot = await buildAgreementSnapshot(input.closingId);
  const { data, error } = await supabase
    .from("settlement_agreements")
    .insert({
      case_id: input.caseId,
      closing_record_id: input.closingId,
      agreement_number: agreementNumber,
      generated_by: input.generatedBy,
      status: "waiting_signature",
      current_signature_role: "debtor",
      agreement_snapshot: snapshot as Json,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Agreement creation failed");
  await logAgreementEvent(data.id, input.generatedBy, "agreement_created", "สร้างร่างข้อตกลงสำเร็จ", { agreementNumber });
  return data as SettlementAgreement;
}
```

- [ ] **Step 4: Add query and audit helpers**

Append:

```ts
export async function logAgreementEvent(
  agreementId: string,
  actorId: string | null,
  eventType: string,
  eventSummary: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  const request = await requestMetadata();
  await supabase.from("agreement_audit_logs").insert({
    agreement_id: agreementId,
    actor_id: actorId,
    event_type: eventType,
    event_summary: eventSummary,
    metadata,
    ip_address: request.ip,
    user_agent: request.userAgent,
  });
}

export async function getAgreement(agreementId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlement_agreements")
    .select("*, cases(*), mediation_closing_records(*), agreement_signatures(*), agreement_audit_logs(*), agreement_download_logs(*)")
    .eq("id", agreementId)
    .maybeSingle();
  if (!data) notFound();
  return data as unknown as AgreementWithDetails;
}

export async function getAgreementByNumber(agreementNumber: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlement_agreements")
    .select("*, agreement_signatures(*)")
    .eq("agreement_number", agreementNumber)
    .maybeSingle();
  return data as unknown as (SettlementAgreement & { agreement_signatures?: AgreementSignature[] | null }) | null;
}

export function nextRoleAfter(role: AgreementSignatureRole): AgreementSignatureRole | null {
  if (role === "debtor") return "creditor";
  if (role === "creditor") return "mediator";
  return null;
}
```

- [ ] **Step 5: Add finalization helper**

Append:

```ts
export async function finalizeAgreement(agreement: SettlementAgreement, actorId: string) {
  const supabase = await createClient();
  const { data: signatures } = await supabase
    .from("agreement_signatures")
    .select("*")
    .eq("agreement_id", agreement.id)
    .order("signed_datetime", { ascending: true });
  const finalHash = sha256({
    agreementId: agreement.id,
    agreementNumber: agreement.agreement_number,
    version: agreement.version,
    snapshot: agreement.agreement_snapshot,
    signatures: signatures ?? [],
  });
  const pdfUrl = `/agreements/${agreement.id}/document`;

  const { error } = await supabase
    .from("settlement_agreements")
    .update({
      status: "completed",
      current_signature_role: null,
      completed_at: new Date().toISOString(),
      hash_sha256: finalHash,
      pdf_url: pdfUrl,
    })
    .eq("id", agreement.id);
  if (error) throw new Error(error.message);

  await createInvoicesAndCloseCase(agreement, actorId, pdfUrl);
  await logAgreementEvent(agreement.id, actorId, "agreement_completed", "ลงนามครบทุกฝ่ายและปิดเคสสำเร็จ", { finalHash, pdfUrl });
}

async function createInvoicesAndCloseCase(agreement: SettlementAgreement, actorId: string, documentUrl: string) {
  const supabase = await createClient();
  const { data: closing } = await supabase
    .from("mediation_closing_records")
    .select("*, cases(*)")
    .eq("id", agreement.closing_record_id)
    .maybeSingle();
  if (!closing) throw new Error("Closing record not found for finalization");

  const typedClosing = closing as unknown as Database["public"]["Tables"]["mediation_closing_records"]["Row"] & {
    cases?: Database["public"]["Tables"]["cases"]["Row"] | null;
  };
  const feeSettings = await getFeeSettings();
  const fees = calculateFees({
    resultStatus: "settled",
    originalDebtAmount: Number(typedClosing.original_debt_amount),
    settledAmount: Number(typedClosing.settled_amount ?? 0),
    platformFeePercent: feeSettings.platform_fee_percent,
    successFeePercent: feeSettings.success_fee_percent,
    vatPercent: feeSettings.vat_percent,
  });
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + feeSettings.payment_due_days);

  const { data: existingInvoice } = await supabase
    .from("billing_invoices")
    .select("id")
    .eq("closing_record_id", agreement.closing_record_id)
    .maybeSingle();
  if (!existingInvoice) {
    const { data: invoice } = await supabase.from("billing_invoices").insert({
      invoice_number: invoiceNumber(feeSettings.invoice_prefix),
      case_id: agreement.case_id,
      closing_record_id: agreement.closing_record_id,
      creditor_organization_id: typedClosing.creditor_organization_id,
      original_debt_amount: Number(typedClosing.original_debt_amount),
      settled_amount: Number(typedClosing.settled_amount ?? 0),
      platform_fee_percent: feeSettings.platform_fee_percent,
      platform_fee_amount: fees.platformFeeAmount,
      success_fee_percent: feeSettings.success_fee_percent,
      success_fee_amount: fees.successFeeAmount,
      vat_percent: feeSettings.vat_percent,
      vat_amount: fees.vatAmount,
      total_amount: fees.totalAmount,
      status: "issued",
      due_at: dueAt.toISOString(),
    }).select().single();
    if (invoice) {
      await supabase.from("billing_invoice_items").insert([
        { invoice_id: invoice.id, item_name: "Platform Fee", description: "ค่าบริการแพลตฟอร์ม", calculation_base_amount: Number(typedClosing.original_debt_amount), fee_percent: feeSettings.platform_fee_percent, amount: fees.platformFeeAmount },
        { invoice_id: invoice.id, item_name: "Success Fee", description: "ค่าความสำเร็จเมื่อไกล่เกลี่ยสำเร็จ", calculation_base_amount: Number(typedClosing.settled_amount ?? 0), fee_percent: feeSettings.success_fee_percent, amount: fees.successFeeAmount },
      ]);
      await supabase.from("billing_invoices").update({ pdf_url: invoiceDocumentUrl(invoice.id) }).eq("id", invoice.id);
    }
  }

  await supabase.from("settlement_documents").insert({
    closing_record_id: agreement.closing_record_id,
    case_id: agreement.case_id,
    document_type: "settlement_agreement",
    pdf_url: documentUrl,
  });
  await Promise.all([
    logEmail({ caseId: agreement.case_id, recipientRole: "debtor", subject: "Settlement Agreement Completed", templateName: "agreement_completed", status: "sent" }),
    logEmail({ caseId: agreement.case_id, recipientRole: "creditor", subject: "Settlement Agreement Completed", templateName: "agreement_completed", status: "sent" }),
    logEmail({ caseId: agreement.case_id, recipientRole: "mediator", subject: "Settlement Agreement Completed", templateName: "agreement_completed", status: "sent" }),
    logEmail({ caseId: agreement.case_id, recipientRole: "admin", subject: "Settlement Agreement Completed", templateName: "agreement_completed_admin", status: "sent" }),
  ]);
  await supabase.from("cases").update({ status: "closed" }).eq("id", agreement.case_id);
  await supabase.from("case_status_history").insert({
    case_id: agreement.case_id,
    from_status: "settlement_draft",
    to_status: "closed",
    changed_by: actorId,
    note: "ลงนามข้อตกลงครบทุกฝ่ายและปิดเคสอัตโนมัติ",
  });
}
```

- [ ] **Step 6: Add list helpers**

Append:

```ts
export async function listAdminAgreements(filters?: { status?: SettlementAgreementStatus; page?: number; pageSize?: number }) {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, filters?.pageSize ?? 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("settlement_agreements")
    .select("*, cases(*)", { count: "exact" })
    .order("generated_at", { ascending: false })
    .range(from, to);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, count, error } = await query;
  return { agreements: (data ?? []) as unknown as AgreementWithDetails[], total: count ?? 0, error: error?.message ?? null };
}

export async function listDebtorAgreements(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlement_agreements")
    .select("*, cases(*)")
    .eq("cases.debtor_user_id", userId)
    .order("generated_at", { ascending: false });
  return (data ?? []) as unknown as AgreementWithDetails[];
}
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck`

Expected: PASS after `src/types/database.ts` includes the new tables.

## Task 3: Signing Server Actions

**Files:**
- Create: `src/app/agreements/actions.ts`

- [ ] **Step 1: Implement sign and download actions**

Create:

```ts
"use server";

import { redirect } from "next/navigation";
import { finalizeAgreement, getAgreement, logAgreementEvent, nextRoleAfter, requestMetadata, sha256 } from "@/lib/agreements";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { AgreementSignatureRole, AgreementSignatureType } from "@/types/database";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function roleForProfile(role: string): AgreementSignatureRole {
  if (role === "debtor") return "debtor";
  if (role === "creditor") return "creditor";
  if (role === "mediator") return "mediator";
  throw new Error("บทบาทนี้ไม่สามารถลงนามข้อตกลงได้");
}

export async function signAgreement(formData: FormData) {
  const profile = await requireRole(["debtor", "creditor", "mediator"] as never);
  const agreementId = field(formData, "agreement_id");
  const signatureType = field(formData, "signature_type") as AgreementSignatureType;
  const signedName = field(formData, "signed_name");
  const signatureImage = field(formData, "signature_image");
  const accepted = field(formData, "terms_accepted") === "on";
  const demoOtp = field(formData, "demo_otp_verified") === "on";
  const role = roleForProfile(profile.role);

  if (!agreementId || !["typed", "draw", "upload"].includes(signatureType) || !signedName) {
    redirect(`/agreements/${agreementId}?error=${encodeURIComponent("กรุณากรอกข้อมูลลายเซ็นให้ครบถ้วน")}`);
  }
  if (!accepted || !demoOtp) {
    redirect(`/agreements/${agreementId}?error=${encodeURIComponent("กรุณายอมรับเงื่อนไขและยืนยัน OTP จำลองก่อนลงนาม")}`);
  }

  const agreement = await getAgreement(agreementId);
  if (agreement.status === "completed") {
    redirect(`/agreements/${agreementId}?success=${encodeURIComponent("ข้อตกลงนี้ลงนามครบแล้ว")}`);
  }
  if (agreement.current_signature_role !== role) {
    redirect(`/agreements/${agreementId}?error=${encodeURIComponent("ยังไม่ถึงลำดับลงนามของคุณ")}`);
  }
  if (agreement.agreement_signatures?.some((item) => item.role === role)) {
    redirect(`/agreements/${agreementId}?success=${encodeURIComponent("คุณลงนามแล้ว")}`);
  }

  const supabase = await createClient();
  const request = await requestMetadata();
  const hashBefore = sha256({
    agreementId: agreement.id,
    snapshot: agreement.agreement_snapshot,
    signatures: agreement.agreement_signatures ?? [],
    role,
  });
  const hashAfter = sha256({
    agreementId: agreement.id,
    snapshot: agreement.agreement_snapshot,
    signatures: [...(agreement.agreement_signatures ?? []), { role, signedName, signatureType, signatureImage }],
  });

  const { error } = await supabase.from("agreement_signatures").insert({
    agreement_id: agreement.id,
    user_id: profile.id,
    role,
    signature_type: signatureType,
    signature_image: signatureType === "typed" ? null : signatureImage,
    signed_name: signedName,
    ip_address: request.ip,
    browser: request.browser,
    device: request.device,
    hash_before: hashBefore,
    hash_after: hashAfter,
    verification_method: "demo_email_otp",
    terms_accepted: true,
  });
  if (error) {
    redirect(`/agreements/${agreementId}?error=${encodeURIComponent("บันทึกลายเซ็นไม่สำเร็จ")}`);
  }

  await logAgreementEvent(agreement.id, profile.id, `${role}_signed`, `${role} ลงนามข้อตกลงแล้ว`, { signatureType, hashBefore, hashAfter });
  const nextRole = nextRoleAfter(role);
  if (nextRole) {
    await supabase.from("settlement_agreements").update({ current_signature_role: nextRole }).eq("id", agreement.id);
  } else {
    await finalizeAgreement(agreement, profile.id);
  }
  redirect(`/agreements/${agreementId}?success=${encodeURIComponent("ลงนามสำเร็จ")}`);
}

export async function logAgreementDownload(formData: FormData) {
  const profile = await requireRole(["debtor", "creditor", "mediator", "admin"] as never);
  const agreementId = field(formData, "agreement_id");
  const request = await requestMetadata();
  const supabase = await createClient();
  await supabase.from("agreement_download_logs").insert({
    agreement_id: agreementId,
    downloaded_by: profile.id,
    ip_address: request.ip,
  });
  await logAgreementEvent(agreementId, profile.id, "document_downloaded", "ดาวน์โหลดเอกสารข้อตกลง", {});
  redirect(`/agreements/${agreementId}/document`);
}

export async function simulateResendAgreementEmail(formData: FormData) {
  const profile = await requireRole("admin");
  const agreementId = field(formData, "agreement_id");
  await logAgreementEvent(agreementId, profile.id, "email_resent", "Admin จำลองการส่งอีเมลข้อตกลงอีกครั้ง", {});
  redirect(`/admin/agreements/${agreementId}?success=${encodeURIComponent("บันทึกการส่งอีเมลจำลองแล้ว")}`);
}
```

- [ ] **Step 2: Fix `requireRole` typing if needed**

If `requireRole` accepts only one role in this codebase, replace multi-role calls with `requireRole(profileRole)` alternatives by reading `src/lib/auth/server.ts` and adding a local helper. Expected logic: authenticate, then check `profile.role` manually against allowed roles.

- [ ] **Step 3: Verify**

Run: `npm run typecheck`

Expected: PASS.

## Task 4: Agreement Components

**Files:**
- Create: `src/components/agreements/agreement-progress.tsx`
- Create: `src/components/agreements/agreement-preview.tsx`
- Create: `src/components/agreements/signature-status-card.tsx`
- Create: `src/components/agreements/signature-panel.tsx`

- [ ] **Step 1: Create progress component**

Create `agreement-progress.tsx` with a compact horizontal stepper using `CheckCircle2` and `Clock3`. Props:

```ts
type AgreementProgressProps = {
  signedRoles: string[];
  completed: boolean;
};
```

Steps: Draft, Debtor Signed, Creditor Signed, Mediator Signed, Final Generated, Email Logged, Completed.

- [ ] **Step 2: Create preview component**

Create `agreement-preview.tsx` that accepts `agreement`, `signatures`, and `documentMode?: boolean`. Render NT logo, agreement number, case number, all 12 required sections, payment schedule, and signature blocks.

- [ ] **Step 3: Create signature status card**

Create `signature-status-card.tsx` for role label, status badge, signed name, and timestamp.

- [ ] **Step 4: Create signature panel client component**

Create `signature-panel.tsx` with `"use client"`. Use a canvas ref for draw mode, a text input for typed mode, and a file input that reads PNG/JPEG into a data URL for upload mode. Include hidden fields:

```tsx
<input type="hidden" name="agreement_id" value={agreementId} />
<input type="hidden" name="signature_type" value={mode} />
<input type="hidden" name="signature_image" value={signatureImage} />
```

Submit to `signAgreement`.

- [ ] **Step 5: Verify**

Run: `npm run lint`

Expected: PASS.

## Task 5: Participant Agreement Routes

**Files:**
- Create: `src/app/agreements/[agreementId]/page.tsx`
- Create: `src/app/agreements/[agreementId]/document/page.tsx`
- Create: `src/app/verify/[agreementNo]/page.tsx`

- [ ] **Step 1: Agreement workspace page**

Create a dynamic server page with `params: Promise<{ agreementId: string }>` and `searchParams: Promise<{ success?: string; error?: string }>`. Use `getAgreement`, render alerts, `AgreementProgress`, signature cards, `AgreementPreview`, download form, and `SignaturePanel` only when `agreement.current_signature_role` matches the user's role.

- [ ] **Step 2: Printable document page**

Create document route that renders `AgreementPreview documentMode` with print-friendly white background and final hash/verification URL.

- [ ] **Step 3: Public verification page**

Create `/verify/[agreementNo]` with `getAgreementByNumber`. Show only agreement number, status, completed date, hash, signature role completion, and valid/invalid result. Do not show settlement amounts or party private details.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`

Expected: PASS.

## Task 6: Closing Flow Integration

**Files:**
- Modify: `src/app/mediator/closing/actions.ts`
- Modify: `src/app/mediator/closing/[caseId]/success/page.tsx`

- [ ] **Step 1: Import agreement creation**

Add:

```ts
import { createAgreementForClosing } from "@/lib/agreements";
```

- [ ] **Step 2: Move successful invoice creation to finalization**

In `closeMediationCase`, keep existing unsuccessful flow as-is. For `resultStatus === "settled"`, after inserting `mediation_closing_records` and `settlement_payment_plans`, create the agreement:

```ts
const agreement = await createAgreementForClosing({
  caseId,
  closingId: closing.id,
  generatedBy: profile.id,
});
await supabase.from("cases").update({ status: "settlement_draft" }).eq("id", caseId);
await supabase.from("case_status_history").insert({
  case_id: caseId,
  from_status: currentCase.status,
  to_status: "settlement_draft",
  changed_by: profile.id,
  note: "สร้างร่างข้อตกลงเพื่อรอลงนามสามฝ่าย",
});
redirect(`/agreements/${agreement.id}?success=${encodeURIComponent("สร้างร่างข้อตกลงแล้ว กรุณารอการลงนามจากลูกหนี้")}`);
```

Ensure invoice creation and `queueClosingEmails` only run for `not_settled` in this action or are skipped for settled.

- [ ] **Step 3: Verify**

Run: `npm run typecheck`

Expected: PASS.

## Task 7: Download Centers And Navigation

**Files:**
- Modify: `src/app/debtor/agreements/page.tsx`
- Create: `src/app/creditor/agreements/page.tsx`
- Create: `src/app/mediator/agreements/page.tsx`
- Modify: `src/components/creditor/creditor-shell.tsx`
- Modify: `src/lib/mediator-portal.ts`

- [ ] **Step 1: Add nav links**

Add Agreements links with `Scale` icon to creditor and mediator navigation. Debtor already has Agreements.

- [ ] **Step 2: Add agreement lists**

Debtor page shows digital agreements first with status badge and open button. Creditor and mediator pages use their role-specific data access via RLS and service helpers.

- [ ] **Step 3: Verify**

Run: `npm run lint`

Expected: PASS.

## Task 8: Admin Agreement Tools

**Files:**
- Modify: `src/components/admin/admin-shell.tsx`
- Create: `src/app/admin/agreements/page.tsx`
- Create: `src/app/admin/agreements/[agreementId]/page.tsx`

- [ ] **Step 1: Add admin nav**

Add `{ href: "/admin/agreements", label: "Agreements", icon: FileSignature }`.

- [ ] **Step 2: Build list page**

Use `requireAdmin`, `listAdminAgreements`, `Pagination`, status filter, and a details link.

- [ ] **Step 3: Build detail page**

Use `getAgreement`, render `AgreementPreview`, signature cards, audit timeline, download logs, and resend simulation form.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`

Expected: PASS.

## Task 9: Final Verification

**Files:**
- All changed files

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS and routes include `/agreements/[agreementId]`, `/verify/[agreementNo]`, and `/admin/agreements`.

- [ ] **Step 4: Manual smoke flow**

Use an existing completed appointment as mediator:

1. Submit successful closing.
2. Confirm redirect to `/agreements/<id>`.
3. Confirm case status is `settlement_draft`.
4. Sign as debtor.
5. Sign as creditor.
6. Sign as mediator.
7. Confirm agreement status is `completed`.
8. Confirm case status is `closed`.
9. Confirm invoice and email logs exist.
10. Open `/verify/<agreementNo>` and confirm valid status.

- [ ] **Step 5: Commit**

Run:

```bash
git add supabase/migrations/20260704165000_add_digital_settlement_agreements.sql src/types/database.ts src/lib/agreements.ts src/app/agreements src/components/agreements src/app/verify src/app/admin/agreements src/app/mediator/closing/actions.ts src/app/mediator/closing/[caseId]/success/page.tsx src/app/debtor/agreements/page.tsx src/app/creditor/agreements/page.tsx src/app/mediator/agreements/page.tsx src/components/admin/admin-shell.tsx src/components/creditor/creditor-shell.tsx src/lib/mediator-portal.ts
git commit -m "feat: add settlement agreement esignature flow"
```

## Self-Review Notes

- Spec coverage: schema, signature flow, hash, final document, verification page, email simulation, invoice-after-signature, admin tools, and participant download centers are covered.
- MVP boundaries: real OTP, real email provider, and binary PDF storage are intentionally excluded.
- Risk: `requireRole` may need local adaptation for multiple allowed roles; Task 3 calls this out explicitly.
- Risk: agreement numbering is count-based per approved MVP and should be replaced with a database sequence in a production hardening phase.
