# NT Trust Score System Design

## Goal

Implement NT Trust Score for mediators. The score helps debtors choose qualified mediators with more confidence and encourages mediators to improve quality over time.

The score ranges from 0 to 100 and must not rely only on review ratings. It combines rating, settlement success, experience, responsiveness, appointment reliability, and professional qualifications.

## Scope

This version includes:

- `mediator_trust_scores` table.
- Optional review table support if no approved mediator review table exists yet.
- TypeScript score calculation service.
- Admin/server recalculation actions.
- Automatic recalculation hooks at application mutation points.
- Trust badge generation.
- Public mediator ranking.
- Trust Score display on mediator cards and mediator profile surfaces.
- Landing page section: Top Trusted Mediators.

This version does not require a real background job runner. Recalculation happens through explicit Server Actions and through calls placed at mutation points already handled by the app.

## Score Components

Default weights:

- Client Rating: 30%
- Settlement Success Rate: 25%
- Experience: 15%
- Responsiveness: 10%
- Appointment Reliability: 10%
- Professional Qualification: 10%

All component scores are normalized to 0-100 before weighting.

Overall score:

```ts
overall =
  ratingScore * 0.30 +
  successRateScore * 0.25 +
  experienceScore * 0.15 +
  responseScore * 0.10 +
  reliabilityScore * 0.10 +
  qualificationScore * 0.10
```

Round the stored score to the nearest integer.

## Component Formulas

### Client Rating Score

Use approved review ratings only.

If a mediator review table exists:

```ts
ratingScore = (averageApprovedRating / 5) * 100
```

If no approved reviews exist:

```ts
ratingScore = 0
```

Reasoning: the score should not invent reputation. New mediators can still gain points from verification, qualifications, and experience.

### Settlement Success Rate Score

Use completed case totals:

```ts
successRateScore =
  completedCases > 0 ? (successfulCases / completedCases) * 100 : 0
```

Current app has `mediator_profiles.successful_cases` and `mediator_profiles.total_cases_handled`. In v1, treat `total_cases_handled` as completed cases until a richer case outcome table exists.

### Experience Score

Experience combines years and completed cases.

```ts
yearsScore = min(mediationExperienceYears / 10, 1) * 50
casesScore = min(totalCompletedCases / 100, 1) * 50
experienceScore = yearsScore + casesScore
```

This prevents very large historical counts from dominating the score.

### Responsiveness Score

Responsiveness measures average response time to new mediation requests.

V1 data source:

- If appointment request/confirmation timestamps exist, use average time from appointment `created_at` to mediator confirmation.
- If no response data exists, score is `0`.

Formula:

```ts
if no response samples: 0
if average <= 4 hours: 100
if average <= 24 hours: 80
if average <= 48 hours: 60
if average <= 72 hours: 40
else: 20
```

### Appointment Reliability Score

Use appointments assigned to the mediator.

```ts
reliabilityScore =
  totalTrackedAppointments > 0
    ? ((completed * 1) + (cancelled * 0.4) + (noShow * 0)) / totalTrackedAppointments * 100
    : 0
```

Tracked statuses:

- completed
- cancelled
- no_show

Cancellation is not always mediator fault, so cancelled appointments retain partial credit.

### Professional Qualification Score

Maximum 100 points:

- Mediator Certification: 35
- Advanced Training: 25
- Professional Membership: 20
- Government Registration: 20

V1 mapping:

- Certification exists in `mediator_certifications`: +35
- Certification or document name contains training keywords such as `training`, `อบรม`, `advanced`: +25
- Certification or document name contains membership keywords such as `member`, `membership`, `สมาคม`, `สมาชิก`: +20
- `mediator_registration_authority` is present: +20

Cap at 100.

## Trust Badges

Badges are generated from `overall_score`:

- `>= 95`: Gold Elite Mediator
- `90-94`: Platinum Mediator
- `80-89`: Trusted Mediator
- `70-79`: Verified Mediator
- `< 70`: New Mediator

Badge labels should be available in English for branding and Thai for UI:

- Gold Elite Mediator / ผู้ไกล่เกลี่ยระดับ Gold Elite
- Platinum Mediator / ผู้ไกล่เกลี่ยระดับ Platinum
- Trusted Mediator / ผู้ไกล่เกลี่ยที่น่าเชื่อถือ
- Verified Mediator / ผู้ไกล่เกลี่ยที่ยืนยันแล้ว
- New Mediator / ผู้ไกล่เกลี่ยใหม่

## Database Design

Create table `mediator_trust_scores`:

- `id uuid primary key default gen_random_uuid()`
- `mediator_id uuid not null unique references public.mediator_profiles(id) on delete cascade`
- `overall_score integer not null default 0`
- `rating_score integer not null default 0`
- `success_rate_score integer not null default 0`
- `experience_score integer not null default 0`
- `response_score integer not null default 0`
- `reliability_score integer not null default 0`
- `qualification_score integer not null default 0`
- `review_count integer not null default 0`
- `average_rating numeric(3,2) not null default 0`
- `completed_cases integer not null default 0`
- `successful_cases integer not null default 0`
- `badge_code text not null default 'new_mediator'`
- `calculated_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

Although the user-requested fields are required, the extra denormalized fields support ranking and card display without recomputing every request.

Constraints:

- Component scores and overall score must be 0-100.
- `badge_code` must be one of `gold_elite`, `platinum`, `trusted`, `verified`, `new_mediator`.

Indexes:

- unique `mediator_id`
- ranking index on `(overall_score desc, review_count desc, completed_cases desc, calculated_at desc)`

## RLS Design

Enable RLS on `mediator_trust_scores`.

Policies:

- Approved mediator scores can be selected by authenticated users.
- Admin can select all scores.
- Mediator owner can select their own score.
- Admin can insert/update/delete scores.

Regular mediators and debtors cannot directly write trust score rows. They trigger recalculation only through trusted Server Actions or mutation flows.

## Recalculation Triggers

Recalculate score when:

- New review approved.
- Case completed.
- Mediator profile approved.
- Mediator certification added.
- Appointment completed.
- No-show recorded.
- Appointment cancelled.

Implementation in v1:

- Add `recalculateMediatorTrustScore(mediatorId)` helper.
- Call it from admin mediator approval action.
- Call it from future review approval action when the review system is implemented.
- Call it from appointment actions when appointment work lands.
- Add admin bulk action `recalculateAllMediatorTrustScores`.

The helper should be idempotent and upsert the score row.

## Application Architecture

### `src/lib/trust-score.ts`

Responsibilities:

- Load mediator profile and supporting rows.
- Calculate component scores.
- Generate badge.
- Upsert `mediator_trust_scores`.
- Fetch public ranking.

Key exports:

- `calculateMediatorTrustScoreInput`
- `calculateTrustBadge`
- `recalculateMediatorTrustScore`
- `recalculateAllMediatorTrustScores`
- `getTopTrustedMediators`
- `getMediatorTrustScore`

### `src/components/mediator/trust-score-badge.tsx`

Responsibilities:

- Render badge label and score.
- Use NT yellow/white theme.
- Provide compact and full variants.

### `src/components/mediator/public-mediator-card.tsx`

Responsibilities:

- Display photo, name, province, years, completed cases, settlement rate, average rating, trust score, badge, verified icon, languages, online availability, and profile link.

### Public API Route

Create `/api/public/mediators/top-trusted`.

Returns top 6 approved mediators ordered by:

1. Trust Score
2. Review Count
3. Experience
4. Recent Activity

### Landing Page

Create section:

- `Top Trusted Mediators`
- Shows top 6 public mediator cards.
- If no approved mediators or no trust scores exist, hide the section.

## UI Surfaces

Display Trust Score and badge on:

- Mediator card in debtor mediator selection page.
- Mediator profile area.
- Landing page Top Trusted Mediators section.

V1 does not add a new public mediator profile route. The card renders a disabled `View Profile` button until a public mediator profile route is added in a later feature.

## Public Mediator Card Fields

Display:

- Photo
- Mediator name
- Province
- Years experience
- Completed cases
- Settlement rate
- Average rating
- Trust Score
- Trust Badge
- Verified icon
- Languages
- Available Online
- View Profile

## Error Handling

- If supporting data is missing, calculate that component as 0.
- If mediator profile is missing, do not create score.
- If Supabase write fails, log server-side error and return a Thai admin-facing error.
- Public ranking should fail closed by returning an empty list.

## Manual Testing Guide

1. Approve a mediator profile.
2. Recalculate trust score for that mediator.
3. Verify a row exists in `mediator_trust_scores`.
4. Update `successful_cases` and `total_cases_handled`; recalculate and verify success score changes.
5. Add mediator certification; recalculate and verify qualification score changes.
6. Verify mediator selection card shows Trust Score and badge.
7. Verify public landing page shows Top Trusted Mediators when scores exist.
8. Verify low-score mediator receives New Mediator badge.
9. Verify score never exceeds 100 or drops below 0.
10. Verify non-admin users cannot write `mediator_trust_scores` directly.

## Open Implementation Notes

- Appointment reliability and responsiveness become more meaningful after appointment scheduling is implemented.
- Reviews are not currently present in the inspected codebase; add a small mediator reviews table only if implementation needs approved review data now.
- The trademark symbol in display text can be used in UI copy, but database identifiers should remain ASCII.
