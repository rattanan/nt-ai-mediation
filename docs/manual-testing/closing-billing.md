# Mediation Closing and Billing Manual Testing

## Successful Mediation

1. Login as mediator.
2. Open a completed appointment at `/mediator/appointments/[appointmentId]`.
3. Click `ปิดเคสและสร้างเอกสาร`.
4. Select `ไกล่เกลี่ยสำเร็จ`.
5. Fill original debt, settled amount, payment plan, special terms, summary, and mediator note.
6. Submit and confirm success page shows document and invoice links.
7. Open settlement document and use browser Print / Save as PDF.
8. Login as creditor and open `/creditor/billing`.
9. Confirm invoice includes platform fee and success fee.
10. Login as admin and open `/admin/billing`.
11. Mark invoice as paid.

## Unsuccessful Mediation

1. Login as mediator.
2. Open closing form for an assigned case.
3. Select `ไกล่เกลี่ยไม่สำเร็จ`.
4. Fill original debt, unsuccessful reason, discussion summary, and mediator note.
5. Submit and confirm case status becomes `not_settled`.
6. Open unsuccessful closing report.
7. Open generated invoice.
8. Confirm success fee is `0` and only platform fee applies.

## Admin Fee Settings

1. Login as admin.
2. Open `/admin/settings`.
3. Change platform fee, success fee, VAT, invoice prefix, payment due days, and bank information.
4. Close a new mediation case.
5. Confirm the invoice stores the fee percentage snapshot from the current settings.
