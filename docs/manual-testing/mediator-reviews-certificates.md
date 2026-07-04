# Mediator Reviews And Completion Certificates Manual Testing Guide

## Preconditions

- Supabase migrations are applied through `20260704013905_add_mediator_reviews_certificates.sql`.
- A debtor case has a selected mediator.
- The case has a successful mediation closing record with status `settled` or `closed`.
- Admin and debtor test users are available.

## Test Scenarios

### 1. Debtor Rates Mediator

1. Sign in as debtor.
2. Open a settled case detail page.
3. Click `Rate Mediator` in the progress tracker.
4. Select a rating from 1 to 5.
5. Add an optional comment.
6. Submit the review.
7. Return to the case detail page.

Expected result: the review is created with status `pending`, and the case page shows that the review was submitted.

### 2. Duplicate Review Is Blocked

1. Open the same settled case.
2. Open the mediator review page again.

Expected result: the page shows the existing review status and does not show a second submit form.

### 3. Admin Approves Review

1. Sign in as admin.
2. Open `/admin/mediators`.
3. Find the pending review queue.
4. Click `อนุมัติรีวิว`.
5. Check `mediator_reviews.status`.
6. Check `mediator_trust_scores.rating_score`, `review_count`, and `average_rating`.

Expected result: the review becomes `approved`, and NT Trust Score recalculates using approved reviews only.

### 4. Admin Rejects Review

1. Submit another review from a settled case.
2. Sign in as admin.
3. Open `/admin/mediators`.
4. Click `ไม่อนุมัติ`.
5. Check `mediator_reviews.status`.
6. Check the mediator Trust Score.

Expected result: rejected reviews are not counted in rating score.

### 5. Completion Certificate

1. Sign in as debtor.
2. Open a settled case.
3. Click `Completion Certificate`.
4. Confirm the certificate page opens.
5. Use browser print/save as PDF.
6. Refresh the certificate page.

Expected result: the same `certificate_number` remains for the case, and a row exists in `case_completion_certificates`.

### 6. RLS Checks

1. As a debtor, try reviewing an unsettled case.
2. As a debtor, try reviewing another user's case.
3. As a non-admin, try approving a review.
4. As a participant, open an allowed certificate.
5. As a non-participant, try opening another case certificate.

Expected result: only authorized users can read/write the relevant rows.
