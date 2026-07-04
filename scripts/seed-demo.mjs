import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mrojfiejpiaxvggiqxsd.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_PASSWORD || "Demo@123456";

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const provinces = ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "เชียงใหม่", "ขอนแก่น", "ชลบุรี", "นครราชสีมา", "สงขลา", "ภูเก็ต", "นครศรีธรรมราช"];
const debtTypes = ["หนี้สหกรณ์", "หนี้บัตรเครดิต", "หนี้เช่าซื้อ", "หนี้สินเชื่อส่วนบุคคล", "หนี้ค่าน้ำค่าไฟ", "หนี้โทรคมนาคม", "หนี้ SME", "หนี้ไมโครไฟแนนซ์"];
const caseStatuses = [
  "draft",
  "submitted",
  "admin_review",
  "creditor_review",
  "mediator_matching",
  "mediator_selected",
  "appointment_scheduling",
  "scheduled",
  "in_mediation",
  "settled",
  "not_settled",
  "closed",
];

const debtorProfiles = [
  ["สมชาย ใจดี", "พนักงานราชการ"],
  ["วรรณา ศรีสุข", "พนักงานรัฐวิสาหกิจ"],
  ["กิตติพงษ์ พัฒนา", "พนักงานเอกชน"],
  ["ปรียา แสงทอง", "ฟรีแลนซ์"],
  ["ธนกร ค้าขาย", "เจ้าของกิจการรายย่อย"],
  ["นฤมล ตั้งใจ", "ครูเอกชน"],
  ["อารีย์ ประหยัด", "พยาบาล"],
  ["ปกรณ์ เมืองทอง", "ช่างเทคนิค"],
  ["สุภาวดี บ้านดี", "พนักงานบัญชี"],
  ["วรพล รุ่งเรือง", "ข้าราชการบำนาญ"],
  ["มาลี อ่อนน้อม", "แม่ค้าออนไลน์"],
  ["จักรินทร์ ทวีทรัพย์", "พนักงานโรงงาน"],
  ["สิริพร วงศ์ไทย", "พนักงานโรงแรม"],
  ["อนุชา สายชล", "คนขับรถรับจ้าง"],
  ["พรทิพย์ บุญมาก", "เจ้าหน้าที่ธุรการ"],
  ["ดารณี ยั่งยืน", "พนักงานขาย"],
  ["ชาญชัย สุขเกษม", "เกษตรกร"],
  ["รัตนา มีทรัพย์", "ผู้ประกอบการ SME"],
  ["มงคล แก้วใส", "พนักงานรักษาความปลอดภัย"],
  ["สุรีย์พร วัฒนะ", "ผู้ช่วยพยาบาล"],
];

const creditorOrgs = [
  ["สหกรณ์ออมทรัพย์ NT จำกัด", "สหกรณ์ออมทรัพย์"],
  ["บริษัท เมืองไทย แคปปิตอล เดโม จำกัด", "Microfinance"],
  ["ธนาคารกรุงเทพ เดโม", "ธนาคาร"],
  ["ธนาคารออมสิน เดโม", "ธนาคาร"],
  ["บริษัท ไฟแนนซ์ไทย เดโม จำกัด", "บริษัทไฟแนนซ์"],
  ["การไฟฟ้านครหลวง เดโม", "ผู้ให้บริการสาธารณูปโภค"],
  ["NT Telecom Billing Demo", "ผู้ให้บริการโทรคมนาคม"],
  ["บริษัท บริหารหนี้สุจริต เดโม จำกัด", "บริษัทติดตามหนี้"],
];

const mediatorNames = [
  ["นาย", "อนันต์", "ไกล่เกลี่ยดี"],
  ["นางสาว", "วิภา", "ยุติธรรม"],
  ["นาย", "ธีรศักดิ์", "ประนอม"],
  ["นาง", "กมลชนก", "สันติ"],
  ["นาย", "ปกรณ์", "สมานฉันท์"],
  ["นางสาว", "รัชนี", "ใจเย็น"],
  ["นาย", "ชลิต", "วางแผน"],
  ["นาง", "พิมพ์ใจ", "ตรงธรรม"],
  ["นาย", "ศุภชัย", "ประสาน"],
  ["นางสาว", "อรทัย", "หาทางออก"],
];

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function dateAdd(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function listDemoUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users.filter((user) => user.email?.endsWith(".demo")));
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function ensureUser(email, fullName, role) {
  const existing = (await listDemoUsers()).find((user) => user.email === email);
  const user = existing ?? (await supabase.auth.admin.createUser({
    email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })).data.user;

  if (!user) throw new Error(`Cannot create user ${email}`);

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email,
    full_name: fullName,
    role,
    email_verified: true,
    account_status: "active",
  });
  if (error) throw error;
  return user;
}

async function cleanupDemoData() {
  const { data: demoCases } = await supabase.from("cases").select("id").like("case_number", "NT-DEMO-%");
  const caseIds = (demoCases ?? []).map((item) => item.id);
  if (caseIds.length > 0) {
    const { data: demoInvoices } = await supabase.from("billing_invoices").select("id").in("case_id", caseIds);
    const invoiceIds = (demoInvoices ?? []).map((item) => item.id);
    if (invoiceIds.length > 0) {
      await supabase.from("billing_invoice_items").delete().in("invoice_id", invoiceIds);
    }
    for (const table of [
      "case_completion_certificates",
      "mediator_reviews",
      "billing_invoices",
      "settlement_documents",
      "settlement_payment_plans",
      "mediation_closing_records",
      "appointment_participants",
      "appointment_status_history",
      "mediation_appointments",
      "case_status_history",
      "case_creditor_responses",
      "case_comments",
    ]) {
      await supabase.from(table).delete().in("case_id", caseIds);
    }
    await supabase.from("cases").delete().in("id", caseIds);
  }
}

async function seed() {
  console.log("Seeding NT AI demo data...");
  await cleanupDemoData();

  const admin = await ensureUser("admin@nt-ai-mediation.demo", "ผู้ดูแลระบบ NT AI Mediation", "admin");
  const debtors = [];
  for (let i = 0; i < debtorProfiles.length; i += 1) {
    const [name] = debtorProfiles[i];
    debtors.push(await ensureUser(`debtor${String(i + 1).padStart(2, "0")}@nt-ai-mediation.demo`, name, "debtor"));
  }

  const creditorUsers = [];
  const organizations = [];
  for (let i = 0; i < creditorOrgs.length; i += 1) {
    const [name, type] = creditorOrgs[i];
    const officer = await ensureUser(`creditor${String(i + 1).padStart(2, "0")}@nt-ai-mediation.demo`, `เจ้าหน้าที่ ${name}`, "creditor");
    creditorUsers.push(officer);
    const { data: org, error } = await supabase.from("creditor_organizations").upsert({
      organization_name: name,
      organization_type: type,
      short_name: name.split(" ")[0],
      contact_email: officer.email,
      contact_phone: `02-555-${String(1000 + i)}`,
      address: `${100 + i} ถนนพหลโยธิน ${provinces[i % provinces.length]}`,
      status: "approved",
      is_public: true,
      display_order: i + 1,
    }, { onConflict: "organization_name" }).select("*").single();
    if (error) throw error;
    organizations.push(org);
    await supabase.from("creditor_officers").upsert({
      user_id: officer.id,
      organization_id: org.id,
      first_name: "เจ้าหน้าที่",
      last_name: name.slice(0, 24),
      email: officer.email,
      mobile: `089000${String(i).padStart(4, "0")}`,
      position: "ฝ่ายบริหารหนี้",
      role: "creditor_admin",
      status: "active",
    }, { onConflict: "user_id" });
  }

  const mediatorUsers = [];
  const mediators = [];
  for (let i = 0; i < mediatorNames.length; i += 1) {
    const [title, firstName, lastName] = mediatorNames[i];
    const user = await ensureUser(`mediator${String(i + 1).padStart(2, "0")}@nt-ai-mediation.demo`, `${title}${firstName} ${lastName}`, "mediator");
    mediatorUsers.push(user);
    const { data: mediator, error } = await supabase.from("mediator_profiles").upsert({
      user_id: user.id,
      title,
      first_name: firstName,
      last_name: lastName,
      phone: `081000${String(i).padStart(4, "0")}`,
      email: user.email,
      province: provinces[i % provinces.length],
      district: "เมือง",
      education_level: "ปริญญาโท",
      occupation: "ผู้ไกล่เกลี่ยอิสระ",
      current_organization: "ศูนย์ไกล่เกลี่ยภาคประชาชน",
      mediator_license_number: `MED-DEMO-${String(i + 1).padStart(4, "0")}`,
      mediator_registration_authority: "กรมคุ้มครองสิทธิและเสรีภาพ",
      mediation_experience_years: 3 + i,
      total_cases_handled: 18 + i * 7,
      successful_cases: 12 + i * 5,
      expertise_areas: ["หนี้ครัวเรือน", "ปรับโครงสร้างหนี้", "ข้อพิพาทผู้บริโภค"],
      debt_types_supported: debtTypes.slice(i % 3, i % 3 + 4),
      languages: ["ไทย", "อังกฤษ"],
      service_provinces: [provinces[i % provinces.length], provinces[(i + 1) % provinces.length]],
      online_mediation_available: true,
      onsite_mediation_available: i % 2 === 0,
      profile_summary: "มีประสบการณ์ไกล่เกลี่ยข้อพิพาทหนี้และช่วยคู่กรณีออกแบบแผนชำระหนี้ที่เป็นไปได้จริง",
      status: "approved",
      approved_at: daysAgo(40 - i),
      approved_by: admin.id,
    }, { onConflict: "user_id" }).select("*").single();
    if (error) throw error;
    mediators.push(mediator);
    await supabase.from("mediator_availability").upsert({
      mediator_profile_id: mediator.id,
      available_days: ["จันทร์", "พุธ", "ศุกร์"],
      available_time_slots: ["09:00-12:00", "13:00-16:00"],
      max_cases_per_month: 20 + i,
      active: true,
    }, { onConflict: "mediator_profile_id" });
    await supabase.from("mediator_availability_slots").insert({
      mediator_profile_id: mediator.id,
      day_of_week: (i % 5) + 1,
      start_time: "09:00",
      end_time: "11:00",
      timezone: "Asia/Bangkok",
      meeting_type: "online",
      is_recurring: true,
      active: true,
      max_cases_per_day: 3,
      max_cases_per_month: 20,
      note: "Demo recurring availability",
    });
    await supabase.from("mediator_certifications").insert({
      mediator_profile_id: mediator.id,
      certification_name: i % 2 === 0 ? "Advanced Mediation Training" : "ประกาศนียบัตรผู้ไกล่เกลี่ย",
      issuer: "NT AI Mediation Academy",
      issued_date: "2025-01-15",
    });
  }

  const cases = [];
  for (let i = 0; i < 50; i += 1) {
    const status = caseStatuses[i % caseStatuses.length];
    const debtor = debtors[i % debtors.length];
    const org = organizations[i % organizations.length];
    const mediator = mediators[i % mediators.length];
    const debtAmount = 25000 + (i * 13750);
    const settled = status === "settled" || status === "closed";
    const failed = status === "not_settled";
    const createdAt = daysAgo(60 - i);
    const updatedAt = daysAgo(Math.max(0, 45 - i));
    const { data: item, error } = await supabase.from("cases").insert({
      case_number: `NT-DEMO-${String(i + 1).padStart(4, "0")}`,
      debtor_user_id: debtor.id,
      creditor_organization_id: org.id,
      creditor_name: org.organization_name,
      creditor_type: org.organization_type,
      debt_type: debtTypes[i % debtTypes.length],
      debt_amount: debtAmount,
      overdue_months: 2 + (i % 18),
      contract_number: `CON-DEMO-${10000 + i}`,
      account_number: `ACC-DEMO-${20000 + i}`,
      monthly_income: 18000 + (i % 12) * 2500,
      monthly_expense: 12000 + (i % 10) * 1800,
      affordable_monthly_payment: 2500 + (i % 8) * 750,
      address: `${88 + i} หมู่บ้านเดโม`,
      province: provinces[i % provinces.length],
      district: "เมือง",
      contact_phone: `08${String(10000000 + i).slice(0, 8)}`,
      problem_description: `ลูกหนี้มีภาระ${debtTypes[i % debtTypes.length]}และต้องการเข้าสู่กระบวนการไกล่เกลี่ยเพื่อหาทางออกที่ชำระได้จริง`,
      desired_solution: `ขอส่วนลดบางส่วนและผ่อนชำระเดือนละ ${2500 + (i % 8) * 750} บาท`,
      uploaded_documents: [{ name: "statement-demo.pdf", url: "demo://statement" }],
      creditor_response_note: status === "creditor_rejected" ? "ข้อมูลยังไม่ครบถ้วน" : "รับคำขอเข้าสู่กระบวนการ",
      rejection_reason: status === "creditor_rejected" ? "ไม่พบเลขบัญชีตามที่แจ้ง" : null,
      selected_mediator_profile_id: ["mediator_selected", "appointment_scheduling", "scheduled", "in_mediation", "settled", "not_settled", "closed"].includes(status) ? mediator.id : null,
      status,
      submitted_at: status === "draft" ? null : createdAt,
      created_at: createdAt,
      updated_at: updatedAt,
    }).select("*").single();
    if (error) throw error;
    cases.push(item);

    await supabase.from("case_status_history").insert({
      case_id: item.id,
      from_status: null,
      to_status: status,
      changed_by: admin.id,
      note: `Demo: ${status}`,
      created_at: updatedAt,
    });

    if (["scheduled", "in_mediation", "settled", "not_settled", "closed", "appointment_scheduling"].includes(status)) {
      const { data: appointment } = await supabase.from("mediation_appointments").insert({
        case_id: item.id,
        mediator_id: mediator.id,
        debtor_user_id: debtor.id,
        creditor_organization_id: org.id,
        creditor_officer_user_id: creditorUsers[i % creditorUsers.length].id,
        appointment_date: dateAdd((i % 20) - 5),
        start_time: "10:00",
        end_time: "11:30",
        timezone: "Asia/Bangkok",
        meeting_type: "online",
        meeting_url: "https://meet.google.com/demo-nt-ai",
        meeting_provider: "google_meet",
        status: status === "appointment_scheduling" ? "pending_confirmation" : status === "not_settled" || status === "settled" || status === "closed" ? "completed" : "confirmed",
        requested_by: debtor.id,
        confirmed_by_mediator_at: daysAgo(10),
        confirmed_by_creditor_at: daysAgo(9),
        confirmed_by_debtor_at: daysAgo(9),
      }).select("*").single();

      if (appointment && (settled || failed)) {
        const settledAmount = settled ? Math.round(debtAmount * (0.62 + (i % 5) * 0.04)) : null;
        const { data: closing } = await supabase.from("mediation_closing_records").insert({
          case_id: item.id,
          appointment_id: appointment.id,
          mediator_id: mediator.id,
          debtor_user_id: debtor.id,
          creditor_organization_id: org.id,
          result_status: settled ? "settled" : "not_settled",
          original_debt_amount: debtAmount,
          settled_amount: settledAmount,
          settlement_summary: settled ? "คู่กรณีตกลงปรับโครงสร้างหนี้และแบ่งชำระตามกำลัง" : "คู่กรณียังไม่สามารถตกลงเงื่อนไขร่วมกันได้",
          unsuccessful_reason: failed ? "ยอดชำระรายเดือนที่เสนอไม่ตรงกับเกณฑ์เจ้าหนี้" : null,
          mediator_note: "ข้อมูลเดโมสำหรับผู้บริหาร",
          closed_at: updatedAt,
        }).select("*").single();

        if (closing) {
          if (settled && settledAmount) {
            await supabase.from("settlement_payment_plans").insert({
              closing_record_id: closing.id,
              case_id: item.id,
              total_settlement_amount: settledAmount,
              down_payment_amount: Math.round(settledAmount * 0.08),
              installment_amount: Math.round(settledAmount / (6 + (i % 12))),
              number_of_installments: 6 + (i % 12),
              first_payment_due_date: dateAdd(20 + (i % 10)),
              payment_frequency: "monthly",
              payment_method: "โอนผ่านบัญชีเจ้าหนี้",
              special_terms: "ชำระตรงเวลาจะไม่มีค่าปรับเพิ่มเติม",
            });
          }

          const platformFee = Math.round(debtAmount * 0.03);
          const successFee = settledAmount ? Math.round(settledAmount * 0.1) : 0;
          const { data: invoice } = await supabase.from("billing_invoices").insert({
            invoice_number: `NTINV-DEMO-${String(i + 1).padStart(4, "0")}`,
            case_id: item.id,
            closing_record_id: closing.id,
            creditor_organization_id: org.id,
            original_debt_amount: debtAmount,
            settled_amount: settledAmount,
            platform_fee_percent: 3,
            platform_fee_amount: platformFee,
            success_fee_percent: 10,
            success_fee_amount: successFee,
            vat_percent: 7,
            vat_amount: Math.round((platformFee + successFee) * 0.07),
            total_amount: Math.round((platformFee + successFee) * 1.07),
            status: i % 3 === 0 ? "paid" : "issued",
            issued_at: updatedAt,
            due_at: dateAdd(15),
          }).select("*").single();
          if (invoice) {
            await supabase.from("billing_invoice_items").insert([
              { invoice_id: invoice.id, item_name: "Platform Fee", description: "ค่าบริการแพลตฟอร์ม", calculation_base_amount: debtAmount, fee_percent: 3, amount: platformFee },
              { invoice_id: invoice.id, item_name: "Success Fee", description: "ค่าความสำเร็จการไกล่เกลี่ย", calculation_base_amount: settledAmount ?? 0, fee_percent: 10, amount: successFee },
            ]);
          }

          if (settled) {
            await supabase.from("settlement_documents").insert({
              closing_record_id: closing.id,
              case_id: item.id,
              document_type: "settlement_agreement",
              pdf_url: `/documents/settlements/demo-${i + 1}`,
              generated_at: updatedAt,
            });
            await supabase.from("mediator_reviews").insert({
              case_id: item.id,
              mediator_id: mediator.id,
              debtor_user_id: debtor.id,
              rating: 4 + (i % 2),
              comment: "ผู้ไกล่เกลี่ยอธิบายขั้นตอนชัดเจนและช่วยหาทางออกที่เป็นธรรม",
              status: "approved",
              reviewed_by: admin.id,
              reviewed_at: updatedAt,
              submitted_at: updatedAt,
            });
          }
        }
      }
    }
  }

  for (const mediator of mediators) {
    const { data: reviews } = await supabase.from("mediator_reviews").select("rating").eq("mediator_id", mediator.id).eq("status", "approved");
    const reviewCount = reviews?.length ?? 0;
    const averageRating = reviewCount > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 4.5;
    const ratingScore = Math.round((averageRating / 5) * 100);
    const successRateScore = Math.round((mediator.successful_cases / Math.max(1, mediator.total_cases_handled)) * 100);
    const experienceScore = Math.min(100, Math.round((Math.min(mediator.mediation_experience_years / 10, 1) * 50) + (Math.min(mediator.total_cases_handled / 100, 1) * 50)));
    const responseScore = 85;
    const reliabilityScore = 88;
    const qualificationScore = 90;
    const overallScore = Math.round(ratingScore * 0.3 + successRateScore * 0.25 + experienceScore * 0.15 + responseScore * 0.1 + reliabilityScore * 0.1 + qualificationScore * 0.1);
    await supabase.from("mediator_trust_scores").upsert({
      mediator_id: mediator.id,
      overall_score: overallScore,
      rating_score: ratingScore,
      success_rate_score: successRateScore,
      experience_score: experienceScore,
      response_score: responseScore,
      reliability_score: reliabilityScore,
      qualification_score: qualificationScore,
      review_count: reviewCount,
      average_rating: Number(averageRating.toFixed(2)),
      completed_cases: mediator.total_cases_handled,
      successful_cases: mediator.successful_cases,
      badge_code: overallScore >= 90 ? "platinum" : overallScore >= 80 ? "trusted" : "verified",
      calculated_at: new Date().toISOString(),
    }, { onConflict: "mediator_id" });
  }

  console.log(`Seed complete: ${debtors.length} debtors, ${organizations.length} creditors, ${mediators.length} mediators, ${cases.length} cases.`);
  console.log(`Demo password for all users: ${demoPassword}`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
