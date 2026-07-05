# NT Trust Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add NT Trust Score for approved mediators, including scoring storage, recalculation, trust badges, public ranking, mediator cards, and landing-page display.

**Architecture:** Store denormalized score snapshots in `mediator_trust_scores`, calculate scores in a server-only TypeScript service, and expose read-only public ranking through an API route. UI uses small reusable mediator components so debtor mediator selection and landing-page trusted mediator cards share labels, badge rules, and display formatting.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Postgres/RLS, TypeScript, existing Tailwind/NT yellow theme.

---

## File Structure

- Create `supabase/migrations/20260704110000_add_mediator_trust_scores.sql`: score table, constraints, indexes, RLS policies.
- Modify `src/types/database.ts`: `TrustBadgeCode`, `mediator_trust_scores` table type.
- Create `src/lib/trust-score.ts`: score math, badge generation, Supabase recalculation/query helpers.
- Create `src/app/admin/mediators/trust-score-actions.ts`: admin recalculate actions.
- Modify `src/app/admin/mediators/actions.ts`: recalculate when a mediator is approved.
- Modify `src/app/admin/mediators/page.tsx`: add recalculation controls and score display.
- Create `src/components/mediator/trust-score-badge.tsx`: compact/full score badge.
- Create `src/components/mediator/public-mediator-card.tsx`: public card for ranking/landing.
- Modify `src/app/debtor/cases/[id]/mediator/page.tsx`: show score/badge on mediator selection cards and sort by trust score.
- Create `src/app/api/public/mediators/top-trusted/route.ts`: public top 6 endpoint.
- Create `src/components/landing/top-trusted-mediators.tsx`: landing section fetching top trusted mediators.
- Modify `src/components/landing/landing-page.tsx`: insert top trusted mediators section.
- Create `docs/manual-testing/nt-trust-score.md`: manual verification guide.

## Task 1: Database Migration and Types

**Files:**
- Create: `supabase/migrations/20260704110000_add_mediator_trust_scores.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add migration**

Create the table and RLS policies:

```sql
create table if not exists public.mediator_trust_scores (
  id uuid primary key default gen_random_uuid(),
  mediator_id uuid not null unique references public.mediator_profiles(id) on delete cascade,
  overall_score integer not null default 0,
  rating_score integer not null default 0,
  success_rate_score integer not null default 0,
  experience_score integer not null default 0,
  response_score integer not null default 0,
  reliability_score integer not null default 0,
  qualification_score integer not null default 0,
  review_count integer not null default 0,
  average_rating numeric(3,2) not null default 0,
  completed_cases integer not null default 0,
  successful_cases integer not null default 0,
  badge_code text not null default 'new_mediator',
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint mediator_trust_scores_overall_check check (overall_score between 0 and 100),
  constraint mediator_trust_scores_rating_check check (rating_score between 0 and 100),
  constraint mediator_trust_scores_success_check check (success_rate_score between 0 and 100),
  constraint mediator_trust_scores_experience_check check (experience_score between 0 and 100),
  constraint mediator_trust_scores_response_check check (response_score between 0 and 100),
  constraint mediator_trust_scores_reliability_check check (reliability_score between 0 and 100),
  constraint mediator_trust_scores_qualification_check check (qualification_score between 0 and 100),
  constraint mediator_trust_scores_badge_check check (badge_code in ('gold_elite', 'platinum', 'trusted', 'verified', 'new_mediator'))
);

create index if not exists mediator_trust_scores_ranking_idx
on public.mediator_trust_scores(overall_score desc, review_count desc, completed_cases desc, calculated_at desc);

alter table public.mediator_trust_scores enable row level security;

drop policy if exists "mediator_trust_scores_select_scoped" on public.mediator_trust_scores;
create policy "mediator_trust_scores_select_scoped"
on public.mediator_trust_scores for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediator_trust_scores.mediator_id
    and (mp.user_id = auth.uid() or mp.status = 'approved')
  )
);

drop policy if exists "mediator_trust_scores_admin_write" on public.mediator_trust_scores;
create policy "mediator_trust_scores_admin_write"
on public.mediator_trust_scores for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

- [ ] **Step 2: Update database types**

Add:

```ts
export type TrustBadgeCode = "gold_elite" | "platinum" | "trusted" | "verified" | "new_mediator";
```

Add `mediator_trust_scores` to `Database["public"]["Tables"]` with Row/Insert/Update shapes matching the migration.

- [ ] **Step 3: Verify types**

Run: `npm run typecheck`

Expected: PASS. If it fails, fix `src/types/database.ts` before continuing.

## Task 2: Scoring Engine

**Files:**
- Create: `src/lib/trust-score.ts`

- [ ] **Step 1: Add badge metadata**

Implement:

```ts
export const trustBadgeLabels = {
  gold_elite: { en: "Gold Elite Mediator", th: "ผู้ไกล่เกลี่ยระดับ Gold Elite" },
  platinum: { en: "Platinum Mediator", th: "ผู้ไกล่เกลี่ยระดับ Platinum" },
  trusted: { en: "Trusted Mediator", th: "ผู้ไกล่เกลี่ยที่น่าเชื่อถือ" },
  verified: { en: "Verified Mediator", th: "ผู้ไกล่เกลี่ยที่ยืนยันแล้ว" },
  new_mediator: { en: "New Mediator", th: "ผู้ไกล่เกลี่ยใหม่" },
} satisfies Record<TrustBadgeCode, { en: string; th: string }>;

export function calculateTrustBadge(score: number): TrustBadgeCode {
  if (score >= 95) return "gold_elite";
  if (score >= 90) return "platinum";
  if (score >= 80) return "trusted";
  if (score >= 70) return "verified";
  return "new_mediator";
}
```

- [ ] **Step 2: Add pure score functions**

Implement pure helpers:

```ts
export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateSuccessRateScore(successfulCases: number, completedCases: number) {
  return completedCases > 0 ? clampScore((successfulCases / completedCases) * 100) : 0;
}

export function calculateExperienceScore(years: number, completedCases: number) {
  const yearsScore = Math.min(years / 10, 1) * 50;
  const casesScore = Math.min(completedCases / 100, 1) * 50;
  return clampScore(yearsScore + casesScore);
}

export function calculateResponseScore(averageHours: number | null) {
  if (averageHours === null) return 0;
  if (averageHours <= 4) return 100;
  if (averageHours <= 24) return 80;
  if (averageHours <= 48) return 60;
  if (averageHours <= 72) return 40;
  return 20;
}

export function calculateReliabilityScore(completed: number, cancelled: number, noShow: number) {
  const total = completed + cancelled + noShow;
  return total > 0 ? clampScore(((completed + cancelled * 0.4) / total) * 100) : 0;
}
```

- [ ] **Step 3: Add Supabase recalculation helper**

Implement `recalculateMediatorTrustScore(mediatorId: string)`:

- Load mediator profile by id.
- Load `mediator_certifications` and `mediator_documents`.
- Try to load `mediation_appointments` if the table exists; catch missing table errors and treat response/reliability as 0.
- Calculate all components.
- Upsert `mediator_trust_scores`.
- Return the upserted score row or `null` if mediator does not exist.

- [ ] **Step 4: Add public ranking helper**

Implement `getTopTrustedMediators(limit = 6)` selecting approved `mediator_profiles` with `mediator_trust_scores`, ordering by score/review/completed/calculated and returning card view models.

## Task 3: Admin Recalculation

**Files:**
- Create: `src/app/admin/mediators/trust-score-actions.ts`
- Modify: `src/app/admin/mediators/actions.ts`
- Modify: `src/app/admin/mediators/page.tsx`

- [ ] **Step 1: Add admin actions**

Create:

```ts
"use server";

export async function recalculateMediatorTrustScoreAction(formData: FormData) {
  // require admin, read mediator_profile_id, call recalculateMediatorTrustScore, then redirect back to /admin/mediators with a Thai success or error message.
}

export async function recalculateAllMediatorTrustScoresAction() {
  // require admin, load approved mediator profile ids, recalculate each score, then redirect back to /admin/mediators with count summary.
}
```

Both require admin. Single action reads `mediator_profile_id`. Bulk action loads approved mediator ids and recalculates each.

- [ ] **Step 2: Hook profile approval**

In `src/app/admin/mediators/actions.ts`, after a profile is approved, call `recalculateMediatorTrustScore(profileId)`.

- [ ] **Step 3: Add admin UI**

In `src/app/admin/mediators/page.tsx`, show the selected mediator trust score if available and add buttons:

- `คำนวณ Trust Score`
- `คำนวณ Trust Score ทั้งหมด`

Use existing NT button styling and redirect success/error query messages.

## Task 4: Trust Score Components

**Files:**
- Create: `src/components/mediator/trust-score-badge.tsx`
- Create: `src/components/mediator/public-mediator-card.tsx`

- [ ] **Step 1: Build `TrustScoreBadge`**

Props:

```ts
{
  score?: number | null;
  badgeCode?: TrustBadgeCode | null;
  variant?: "compact" | "full";
}
```

Render score, Thai badge label, and a verified icon for score >= 70.

- [ ] **Step 2: Build `PublicMediatorCard`**

Props include a mediator card view model from `getTopTrustedMediators`. Render photo, name, province, years, completed cases, settlement rate, average rating, trust score, badge, verified icon, languages, online availability, and disabled `View Profile` button.

## Task 5: Mediator Selection Cards

**Files:**
- Modify: `src/lib/mediators.ts`
- Modify: `src/app/debtor/cases/[id]/mediator/page.tsx`

- [ ] **Step 1: Include trust score in mediator lookup**

Update `getApprovedMediatorsForCase` select to include `mediator_trust_scores(*)`.

Sort matching mediators by:

1. `overall_score` desc
2. `total_cases_handled` desc
3. `mediation_experience_years` desc

- [ ] **Step 2: Render trust score badge**

Use `TrustScoreBadge` on each mediator selection card, near the mediator name and stats.

## Task 6: Public Top Trusted Mediators

**Files:**
- Create: `src/app/api/public/mediators/top-trusted/route.ts`
- Create: `src/components/landing/top-trusted-mediators.tsx`
- Modify: `src/components/landing/landing-page.tsx`

- [ ] **Step 1: Add public API route**

Return:

```ts
return Response.json({ mediators });
```

If helper throws, log error and return `{ mediators: [] }`.

- [ ] **Step 2: Add landing component**

Client component fetches `/api/public/mediators/top-trusted`, hides when empty, and renders top 6 `PublicMediatorCard`s.

- [ ] **Step 3: Insert landing section**

Place `TopTrustedMediators` after `ParticipatingCreditors` and before `Stats`.

## Task 7: Manual Testing and Verification

**Files:**
- Create: `docs/manual-testing/nt-trust-score.md`

- [ ] **Step 1: Add manual testing guide**

Include:

1. Approve mediator profile.
2. Recalculate a mediator.
3. Verify `mediator_trust_scores` row.
4. Change success/total cases and recalculate.
5. Add certification and recalculate.
6. Verify debtor mediator card badge.
7. Verify landing Top Trusted Mediators section.
8. Verify New Mediator badge below 70.
9. Verify scores stay 0-100.
10. Verify non-admin cannot write trust score rows.

- [ ] **Step 2: Run verification**

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

## Self-Review

- Spec coverage: database, RLS, scoring math, recalculation, badges, ranking, public card, landing page, and manual testing are represented.
- Placeholder scan: no incomplete implementation placeholders remain.
- Type consistency: `TrustBadgeCode` values match migration constraint and badge labels.
