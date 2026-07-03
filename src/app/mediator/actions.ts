"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getMediatorProfileByUser, parseAvailabilityForm, parseMediatorProfileForm } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

function go(path: string, message: string, kind: "success" | "error" = "success"): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function saveProfile(formData: FormData, submit: boolean) {
  const profile = await requireRole("mediator");
  const payload = parseMediatorProfileForm(formData, profile.id);
  const availability = parseAvailabilityForm(formData);
  const documents = String(formData.get("documents") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (submit && (!payload.first_name || !payload.last_name || !payload.citizen_id || !payload.phone || !payload.province || !payload.mediator_license_number)) {
    go("/mediator/profile", "กรุณากรอกข้อมูลสำคัญให้ครบก่อนส่งตรวจสอบ", "error");
  }

  const supabase = await createClient();
  const current = await getMediatorProfileByUser(profile.id);
  const nextStatus = submit ? "submitted" : current?.status === "approved" ? "submitted" : "draft";

  const { data, error } = await supabase
    .from("mediator_profiles")
    .upsert({
      ...payload,
      status: nextStatus,
      admin_review_note: submit ? null : current?.admin_review_note ?? null,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    go("/mediator/profile", "บันทึกข้อมูลผู้ไกล่เกลี่ยไม่สำเร็จ", "error");
  }

  await supabase.from("mediator_availability").upsert({
    mediator_profile_id: data.id,
    ...availability,
  });

  if (documents.length > 0) {
    await supabase.from("mediator_documents").delete().eq("mediator_profile_id", data.id);
    await supabase.from("mediator_documents").insert(
      documents.map((url, index) => ({
        mediator_profile_id: data.id,
        document_type: index === 0 ? "mediator_certificate" : "supporting_document",
        file_name: url,
        file_url: url,
        visibility: "admin_only" as const,
      })),
    );
  }

  go("/mediator", submit ? "ส่งโปรไฟล์ให้ผู้ดูแลตรวจสอบแล้ว" : "บันทึกแบบร่างโปรไฟล์แล้ว");
}

export async function saveMediatorDraft(formData: FormData) {
  await saveProfile(formData, false);
}

export async function submitMediatorProfile(formData: FormData) {
  await saveProfile(formData, true);
}
