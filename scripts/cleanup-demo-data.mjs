import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteWhere(table, column, values) {
  if (values.length === 0) return;
  const { error } = await supabase.from(table).delete().in(column, values);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function listDemoUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users.filter((user) => user.email?.endsWith(".demo")));
    if (data.users.length < 1000) return users;
  }
}

async function cleanupCases(caseIds) {
  if (caseIds.length === 0) return 0;

  const { data: invoices, error: invoiceError } = await supabase
    .from("billing_invoices")
    .select("id")
    .in("case_id", caseIds);
  if (invoiceError) throw invoiceError;
  await deleteWhere("billing_invoice_items", "invoice_id", invoices.map((item) => item.id));

  const { data: appointments, error: appointmentError } = await supabase
    .from("mediation_appointments")
    .select("id")
    .in("case_id", caseIds);
  if (appointmentError) throw appointmentError;
  const appointmentIds = appointments.map((item) => item.id);
  await deleteWhere("appointment_participants", "appointment_id", appointmentIds);
  await deleteWhere("appointment_status_history", "appointment_id", appointmentIds);

  // Remove rows that are not guaranteed to cascade in every deployed schema.
  for (const table of [
    "case_completion_certificates",
    "mediator_reviews",
    "billing_invoices",
    "settlement_documents",
    "settlement_payment_plans",
    "mediation_closing_records",
    "mediation_appointments",
    "case_status_history",
    "case_creditor_responses",
    "case_comments",
    "email_logs",
  ]) {
    await deleteWhere(table, "case_id", caseIds);
  }
  await deleteWhere("cases", "id", caseIds);
  return caseIds.length;
}

async function cleanupDemoProfilesAndOrganizations(demoUsers) {
  const userIds = demoUsers.map((user) => user.id);
  const emails = demoUsers.map((user) => user.email).filter(Boolean);

  const { data: mediators, error: mediatorError } = await supabase
    .from("mediator_profiles")
    .select("id")
    .in("user_id", userIds);
  if (mediatorError) throw mediatorError;
  await deleteWhere("mediator_profiles", "id", mediators.map((item) => item.id));

  await deleteWhere("creditor_officers", "user_id", userIds);

  const { data: organizations, error: organizationError } = await supabase
    .from("creditor_organizations")
    .select("id")
    .in("contact_email", emails);
  if (organizationError) throw organizationError;

  const organizationIds = organizations.map((item) => item.id);
  if (organizationIds.length > 0) {
    const { data: remainingCases, error: remainingCasesError } = await supabase
      .from("cases")
      .select("id")
      .in("creditor_organization_id", organizationIds)
      .limit(1);
    if (remainingCasesError) throw remainingCasesError;
    if (remainingCases.length > 0) {
      throw new Error("Refusing to delete demo organizations that are still linked to non-demo cases.");
    }
    await deleteWhere("creditor_organizations", "id", organizationIds);
  }

  return { mediatorCount: mediators.length, organizationCount: organizationIds.length };
}

async function findDemoCaseIds(demoUsers) {
  const userIds = demoUsers.map((user) => user.id);
  const [{ data: numberedCases, error: numberedError }, { data: userCases, error: userCasesError }, { data: mediators, error: mediatorError }] = await Promise.all([
    supabase.from("cases").select("id").like("case_number", "NT-DEMO-%"),
    supabase.from("cases").select("id").in("debtor_user_id", userIds),
    supabase.from("mediator_profiles").select("id").in("user_id", userIds),
  ]);
  if (numberedError) throw numberedError;
  if (userCasesError) throw userCasesError;
  if (mediatorError) throw mediatorError;

  const mediatorIds = mediators.map((item) => item.id);
  const { data: mediatedCases, error: mediatedCasesError } = mediatorIds.length > 0
    ? await supabase.from("mediation_closing_records").select("case_id").in("mediator_id", mediatorIds)
    : { data: [], error: null };
  if (mediatedCasesError) throw mediatedCasesError;

  return [...new Set([
    ...numberedCases.map((item) => item.id),
    ...userCases.map((item) => item.id),
    ...mediatedCases.map((item) => item.case_id),
  ])];
}

async function cleanup() {
  console.log("Removing demo data while preserving auth users and profiles...");
  const demoUsers = await listDemoUsers();
  const caseCount = await cleanupCases(await findDemoCaseIds(demoUsers));
  const { mediatorCount, organizationCount } = await cleanupDemoProfilesAndOrganizations(demoUsers);

  console.log(`Removed ${caseCount} demo cases, ${mediatorCount} mediator profiles, and ${organizationCount} creditor organizations.`);
  console.log(`Preserved ${demoUsers.length} demo auth users and their profiles.`);
}

cleanup().catch((error) => {
  console.error(error);
  process.exit(1);
});
