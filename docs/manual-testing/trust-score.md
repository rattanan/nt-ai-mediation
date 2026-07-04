# NT Trust Score Manual Testing Guide

## Preconditions

- Supabase migrations are applied through `20260704133000_add_mediator_trust_scores.sql`.
- At least one mediator account has a completed mediator profile.
- Admin, debtor, and mediator test users are available.
- Appointment scheduling and closing/billing flows are already available.

## Test Scenarios

### 1. Admin Approves Mediator Profile

1. Sign in as admin.
2. Open `/admin/mediators`.
3. Approve a pending mediator profile.
4. Confirm the success message appears.
5. In Supabase, verify a row exists in `mediator_trust_scores` for the approved `mediator_id`.
6. Check `overall_score`, component score fields, `badge_code`, and `calculated_at`.

Expected result: approved mediator receives an NT Trust Score row without manual SQL.

### 2. Admin Recalculates All Trust Scores

1. Sign in as admin.
2. Open `/admin/mediators`.
3. Click `คำนวณ NT Trust Score ใหม่ทั้งหมด`.
4. Confirm the success message appears.
5. In Supabase, verify `calculated_at` updates for approved mediators.

Expected result: all approved mediators are recalculated and no pending/rejected mediator becomes public.

### 3. Debtor Sees Trust Badge When Selecting Mediator

1. Sign in as debtor.
2. Open a case that is ready for mediator selection.
3. Go to the mediator selection page.
4. Confirm approved mediators display an NT Trust Score badge.
5. Confirm pending or rejected mediators are not listed.

Expected result: debtor sees score and Thai badge label on approved mediator cards.

### 4. Landing Page Shows Top Trusted Mediators

1. Open `/`.
2. Scroll to the Top Trusted Mediators section.
3. Confirm up to 6 approved mediators are shown.
4. Verify cards show name, province, years experience, completed cases, settlement rate, average rating, score, badge, languages, and online availability.
5. Open `/api/public/mediators/top-trusted`.

Expected result: landing page and public API return mediators sorted by trust score, review count, completed cases, and recent calculation time.

### 5. Appointment Outcome Recalculates Reliability

1. Sign in as mediator.
2. Open an appointment assigned to the mediator.
3. Mark the appointment as completed.
4. Check `mediator_trust_scores.reliability_score` and `calculated_at`.
5. Repeat with another appointment and mark no-show or cancelled.

Expected result: reliability score changes according to completed, cancelled, and no-show appointment totals.

### 6. Case Closing Recalculates Settlement Success

1. Sign in as mediator.
2. Complete a case closing flow.
3. Mark the closing result as settled.
4. Check `mediator_profiles.total_cases_handled`, `mediator_profiles.successful_cases`, and `mediator_trust_scores.success_rate_score`.
5. Repeat with a not-settled result.

Expected result: completed case counters update and Trust Score recalculates after closing.

### 7. RLS Read And Write Checks

1. As an anonymous user, query `mediator_trust_scores`.
2. Confirm only approved mediator public rows are readable.
3. As debtor, confirm approved mediator public rows are readable.
4. As mediator, confirm own score is readable.
5. Try inserting or updating `mediator_trust_scores` as debtor or mediator.
6. Try inserting or updating as admin.

Expected result: public/authenticated users can only read allowed rows. Only admin can directly manage score rows.

## Notes

- Client rating score is reserved for approved mediator reviews. If no review table or approved reviews exist, `rating_score`, `review_count`, and `average_rating` remain `0`.
- The score is intentionally multi-factor and should not be judged only by rating data.
