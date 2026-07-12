import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoOnly = process.env.SEED_DEMO_ONLY !== "false";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const mediatorImage = await readFile(new URL("../public/images/demo/mediator-profile-demo.png", import.meta.url));
const creditorLogo = await readFile(new URL("../public/images/demo/creditor-logo-demo.png", import.meta.url));
const provinces = ["กรุงเทพมหานคร", "นนทบุรี", "เชียงใหม่", "ขอนแก่น", "ชลบุรี", "ภูเก็ต"];
const expertise = ["ปรับโครงสร้างหนี้", "หนี้ครัวเรือน", "ข้อพิพาทผู้บริโภค", "หนี้ SME", "หนี้บัตรเครดิต"];
const weekdays = [1, 2, 3, 4, 5];

async function listProfilesByRole(role) {
  const { data, error } = await supabase.from("profiles").select("id, email, full_name, role").eq("role", role).order("created_at");
  if (error) throw error;
  return (data ?? []).filter((profile) => !demoOnly || profile.email?.endsWith(".demo"));
}

function nameParts(fullName, index) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || `Demo${index + 1}`, lastName: parts.slice(1).join(" ") || "Mediator" };
}

async function uploadPublicAsset(bucket, path, body, contentType) {
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true, cacheControl: "3600" });
  if (error) throw new Error(`${bucket}/${path}: ${error.message}`);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function seedMediator(profile, index, adminId) {
  const { firstName, lastName } = nameParts(profile.full_name, index);
  const mediatorImageUrl = await uploadPublicAsset("mediator-profile-images", `${profile.id}/demo-profile.png`, mediatorImage, "image/png");
  const payload = {
    user_id: profile.id,
    title: index % 2 === 0 ? "คุณ" : "อาจารย์",
    first_name: firstName,
    last_name: lastName,
    profile_photo_url: mediatorImageUrl,
    phone: `081000${String(index).padStart(4, "0")}`,
    email: profile.email,
    province: provinces[index % provinces.length],
    district: "เมือง",
    education_level: "ปริญญาโท",
    occupation: "ผู้ไกล่เกลี่ยอิสระ",
    current_organization: "ศูนย์ไกล่เกลี่ยชุมชน NT AI",
    mediator_license_number: `MED-DEMO-${String(index + 1).padStart(4, "0")}`,
    mediator_registration_authority: "กรมคุ้มครองสิทธิและเสรีภาพ",
    mediation_experience_years: 5 + index,
    total_cases_handled: 25 + index * 4,
    successful_cases: 18 + index * 3,
    expertise_areas: expertise.slice(index % 3, (index % 3) + 3),
    debt_types_supported: ["หนี้บัตรเครดิต", "หนี้สินเชื่อส่วนบุคคล", "หนี้ SME"],
    languages: ["ไทย", "อังกฤษ"],
    service_provinces: [provinces[index % provinces.length], "ออนไลน์ทั่วประเทศ"],
    online_mediation_available: true,
    onsite_mediation_available: index % 2 === 0,
    profile_summary: "รับฟังอย่างเป็นกลาง ช่วยคู่กรณีเห็นทางเลือก และออกแบบแผนชำระหนี้ที่ทำได้จริงร่วมกัน",
    status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: adminId,
  };
  const { data: existingMediator, error: existingMediatorError } = await supabase.from("mediator_profiles").select("id").eq("user_id", profile.id).maybeSingle();
  if (existingMediatorError) throw existingMediatorError;
  const mediatorResult = existingMediator
    ? await supabase.from("mediator_profiles").update(payload).eq("id", existingMediator.id).select("id").single()
    : await supabase.from("mediator_profiles").insert(payload).select("id").single();
  if (mediatorResult.error) throw mediatorResult.error;
  const mediator = mediatorResult.data;

  const availabilityPayload = {
    mediator_profile_id: mediator.id,
    available_days: ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"],
    available_time_slots: ["09:00-12:00", "13:00-16:00"],
    max_cases_per_month: 20 + index,
    active: true,
  };
  const { data: existingAvailability } = await supabase.from("mediator_availability").select("id").eq("mediator_profile_id", mediator.id).maybeSingle();
  const availabilityResult = existingAvailability
    ? await supabase.from("mediator_availability").update(availabilityPayload).eq("id", existingAvailability.id)
    : await supabase.from("mediator_availability").insert(availabilityPayload);
  if (availabilityResult.error) throw availabilityResult.error;

  const { error: hoursError } = await supabase.from("mediator_working_hours").upsert(
    weekdays.map((weekday) => ({ mediator_id: mediator.id, weekday, is_enabled: true, start_time: "09:00", end_time: "17:00", break_start: "12:00", break_end: "13:00", slot_duration_minutes: 60, buffer_before_minutes: 15, buffer_after_minutes: 15 })),
    { onConflict: "mediator_id,weekday" },
  );
  if (hoursError) throw hoursError;

  const { error: oldSlotsError } = await supabase.from("mediator_availability_slots").delete().eq("mediator_profile_id", mediator.id).eq("note", "Demo profile availability");
  if (oldSlotsError) throw oldSlotsError;
  const { error: slotsError } = await supabase.from("mediator_availability_slots").insert(
    weekdays.map((weekday) => ({ mediator_profile_id: mediator.id, day_of_week: weekday, start_time: "09:00", end_time: "12:00", timezone: "Asia/Bangkok", meeting_type: "online", is_recurring: true, active: true, max_cases_per_day: 3, max_cases_per_month: 20 + index, note: "Demo profile availability" })),
  );
  if (slotsError) throw slotsError;
  return mediator.id;
}

async function seedCreditor(profile, index) {
  const organizationName = `องค์กรเจ้าหนี้เดโม ${index + 1} - ${profile.full_name || "NT"}`;
  const { data: existingOfficer } = await supabase.from("creditor_officers").select("organization_id").eq("user_id", profile.id).maybeSingle();
  let organization;
  if (existingOfficer?.organization_id) {
    const { data, error } = await supabase.from("creditor_organizations").update({ organization_name: organizationName, organization_type: "สถาบันการเงินชุมชน", status: "approved", is_public: true }).eq("id", existingOfficer.organization_id).select("*").single();
    if (error) throw error;
    organization = data;
  } else {
    const { data, error } = await supabase.from("creditor_organizations").insert({ organization_name: organizationName, organization_type: "สถาบันการเงินชุมชน", short_name: `องค์กรเดโม ${index + 1}`, contact_email: profile.email, contact_phone: `02-555-${String(1200 + index)}`, address: `${100 + index} ถนนประชาร่วมใจ กรุงเทพมหานคร`, status: "approved", is_public: true, display_order: 100 + index }).select("*").single();
    if (error) throw error;
    organization = data;
  }
  const logoUrl = await uploadPublicAsset("creditor-logos", `${profile.id}/demo-logo.png`, creditorLogo, "image/png");
  const { error: logoError } = await supabase.from("creditor_organizations").update({ logo_url: logoUrl, logo: logoUrl }).eq("id", organization.id);
  if (logoError) throw logoError;
  const { firstName, lastName } = nameParts(profile.full_name, index);
  const officerPayload = { user_id: profile.id, organization_id: organization.id, first_name: firstName, last_name: lastName, email: profile.email, mobile: `089000${String(index).padStart(4, "0")}`, position: "ฝ่ายบริหารหนี้", role: "creditor_admin", status: "active" };
  const { data: existingOfficerRow } = await supabase.from("creditor_officers").select("id").eq("user_id", profile.id).maybeSingle();
  const officerResult = existingOfficerRow
    ? await supabase.from("creditor_officers").update(officerPayload).eq("id", existingOfficerRow.id)
    : await supabase.from("creditor_officers").insert(officerPayload);
  if (officerResult.error) throw officerResult.error;
  return organization.id;
}

async function main() {
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1);
  const adminId = admins?.[0]?.id ?? null;
  const mediators = await listProfilesByRole("mediator");
  const creditors = await listProfilesByRole("creditor");
  if (!mediators.length && !creditors.length) throw new Error("No matching demo mediator/creditor profiles found.");
  for (let index = 0; index < mediators.length; index += 1) await seedMediator(mediators[index], index, adminId);
  for (let index = 0; index < creditors.length; index += 1) await seedCreditor(creditors[index], index);
  console.log(`Seeded ${mediators.length} mediator profiles with availability and ${creditors.length} creditor organizations with officers and logos.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
