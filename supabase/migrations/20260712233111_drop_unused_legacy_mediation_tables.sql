-- Retire the original prototype schema. These tables are empty and the
-- production application uses cases, mediator_profiles,
-- creditor_organizations, mediation_appointments, and settlement_documents.
-- Intentionally omit CASCADE so the migration fails safely if a new external
-- dependency has appeared since the audit.
drop table if exists public.case_documents;
drop table if exists public.settlement_agreements;
drop table if exists public.mediation_sessions;
drop table if exists public.debtor_cases;
drop table if exists public.creditors;
drop table if exists public.mediators;
