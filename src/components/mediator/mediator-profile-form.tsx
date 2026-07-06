"use client";

import type { MediatorAvailability, MediatorProfile } from "@/lib/mediators";
import type React from "react";
import { useActionState } from "react";
import { jsonList } from "@/lib/json-list";
import { emptyFormState, type FormState } from "@/lib/form-state";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { MediatorFormSubmit } from "@/components/mediator/mediator-form-submit";

export function MediatorProfileForm({
  profile,
  availability,
  documents,
  saveAction,
  submitAction,
}: {
  profile?: MediatorProfile | null;
  availability?: MediatorAvailability | null;
  documents: string[];
  saveAction: (state: FormState, formData: FormData) => Promise<FormState>;
  submitAction: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [saveState, saveFormAction] = useActionState(saveAction, emptyFormState);
  const [submitState, submitFormAction] = useActionState(submitAction, emptyFormState);
  const state = submitState.error ? submitState : saveState;
  const value = (name: string, fallback?: string | number | null) => state.values?.[name] ?? fallback ?? "";

  return (
    <form className="space-y-6" encType="multipart/form-data">
      {state.error ? <Alert variant="destructive">{state.error}</Alert> : null}
      <Section step="1" title="ข้อมูลส่วนบุคคล">
        <InputGrid>
          <Field name="title" label="คำนำหน้า" value={value("title", profile?.title)} />
          <Field name="first_name" label="ชื่อ" value={value("first_name", profile?.first_name)} required />
          <Field name="last_name" label="นามสกุล" value={value("last_name", profile?.last_name)} required />
          <Field
            name="citizen_id"
            label="เลขบัตรประชาชน"
            value={value("citizen_id", profile?.citizen_id)}
            required
            pattern="[0-9]{13}"
            inputMode="numeric"
            maxLength={13}
          />
          <Field name="date_of_birth" label="วันเกิด" value={value("date_of_birth", profile?.date_of_birth)} type="date" />
          <Field name="gender" label="เพศ" value={value("gender", profile?.gender)} />
          <Field name="phone" label="โทรศัพท์" value={value("phone", profile?.phone)} required />
          <Field name="email" label="อีเมล" value={value("email", profile?.email)} type="email" />
          <Field name="province" label="จังหวัด" value={value("province", profile?.province)} required />
          <Field name="district" label="อำเภอ/เขต" value={value("district", profile?.district)} />
        </InputGrid>
        <TextArea name="address" label="ที่อยู่ส่วนตัว" value={value("address", profile?.address)} />
      </Section>

      <Section step="2" title="การศึกษาและอาชีพ">
        <InputGrid>
          <Field name="education_level" label="ระดับการศึกษา" value={value("education_level", profile?.education_level)} />
          <Field name="occupation" label="อาชีพปัจจุบัน" value={value("occupation", profile?.occupation)} />
          <Field name="current_organization" label="หน่วยงานปัจจุบัน" value={value("current_organization", profile?.current_organization)} />
        </InputGrid>
        <TextArea name="education_detail" label="รายละเอียดการศึกษา" value={value("education_detail", profile?.education_detail)} />
      </Section>

      <Section step="3" title="คุณสมบัติผู้ไกล่เกลี่ย">
        <InputGrid>
          <Field name="mediator_license_number" label="เลขทะเบียน/ใบอนุญาตผู้ไกล่เกลี่ย" value={value("mediator_license_number", profile?.mediator_license_number)} required />
          <Field name="mediator_registration_authority" label="หน่วยงานที่ขึ้นทะเบียน" value={value("mediator_registration_authority", profile?.mediator_registration_authority)} />
        </InputGrid>
        <TextArea name="documents" label="ลิงก์เอกสารรับรอง/อบรม (1 บรรทัดต่อ 1 เอกสาร)" value={value("documents", documents.join("\n"))} />
      </Section>

      <Section step="4" title="ประสบการณ์การไกล่เกลี่ย">
        <InputGrid>
          <Field name="mediation_experience_years" label="จำนวนปีประสบการณ์" value={value("mediation_experience_years", profile?.mediation_experience_years)} type="number" />
          <Field name="total_cases_handled" label="จำนวนเคสที่เคยดูแล" value={value("total_cases_handled", profile?.total_cases_handled)} type="number" />
          <Field name="successful_cases" label="จำนวนเคสสำเร็จ" value={value("successful_cases", profile?.successful_cases)} type="number" />
        </InputGrid>
        <TextArea name="profile_summary" label="ประวัติและภาพรวมวิชาชีพ" value={value("profile_summary", profile?.profile_summary)} />
      </Section>

      <Section step="5" title="ความเชี่ยวชาญและพื้นที่ให้บริการ">
        <TextArea name="expertise_areas" label="ความเชี่ยวชาญ (คั่นด้วย comma หรือขึ้นบรรทัดใหม่)" value={value("expertise_areas", jsonList(profile?.expertise_areas).join("\n"))} />
        <TextArea name="debt_types_supported" label="ประเภทหนี้ที่รองรับ" value={value("debt_types_supported", jsonList(profile?.debt_types_supported).join("\n"))} />
        <TextArea name="service_provinces" label="จังหวัดที่ให้บริการ" value={value("service_provinces", jsonList(profile?.service_provinces).join("\n"))} />
        <TextArea name="languages" label="ภาษา" value={value("languages", jsonList(profile?.languages).join("\n"))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input name="online_mediation_available" type="checkbox" defaultChecked={profile?.online_mediation_available ?? true} /> ให้บริการออนไลน์</label>
          <label className="flex items-center gap-2 text-sm"><input name="onsite_mediation_available" type="checkbox" defaultChecked={profile?.onsite_mediation_available ?? false} /> ให้บริการ onsite</label>
        </div>
      </Section>

      <Section step="6" title="เวลาว่างและภาระงาน">
        <TextArea name="available_days" label="วันที่สะดวก" value={value("available_days", jsonList(availability?.available_days).join("\n"))} />
        <TextArea name="available_time_slots" label="ช่วงเวลาที่สะดวก" value={value("available_time_slots", jsonList(availability?.available_time_slots).join("\n"))} />
        <Field name="max_cases_per_month" label="จำนวนเคสสูงสุดต่อเดือน" value={value("max_cases_per_month", availability?.max_cases_per_month ?? 10)} type="number" />
        <label className="flex items-center gap-2 text-sm"><input name="availability_active" type="checkbox" defaultChecked={availability?.active ?? true} /> เปิดรับงาน</label>
      </Section>

      <Section step="7" title="รูปโปรไฟล์และเอกสาร">
        <div className="grid gap-4 md:grid-cols-[8rem_1fr] md:items-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg bg-[#F3F4F6] text-sm font-semibold text-[#6B7280]">
            {profile?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>ไม่มีรูป</span>
            )}
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">อัปโหลดรูปโปรไฟล์</span>
              <input name="profile_photo_file" type="file" accept="image/*" className="mt-2 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
            </label>
            <p className="text-xs leading-5 text-[#6B7280]">
              หากอัปโหลดรูปใหม่ ระบบจะบันทึกเป็นรูปโปรไฟล์หลักให้ทันที ไม่ต้องกรอก URL เพิ่ม
            </p>
          </div>
        </div>
        <p className="text-sm text-[#6B7280]">เอกสารสำคัญ เช่น สำเนาบัตรประชาชน ใบรับรอง และเอกสารการศึกษา ให้ใส่เป็นลิงก์ในขั้นตอนที่ 3</p>
      </Section>

      <section className="rounded-lg border border-black/5 bg-[#111827] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#FFD200]">ขั้นตอนที่ 8</p>
        <h2 className="mt-1 text-lg font-semibold">ตรวจสอบและส่งโปรไฟล์</h2>
        <p className="mt-2 text-sm text-white/70">บันทึกแบบร่างเพื่อกลับมาแก้ไข หรือส่งให้ผู้ดูแลระบบตรวจสอบเพื่ออนุมัติการแสดงผล</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <MediatorFormSubmit label="บันทึกแบบร่าง" formAction={saveFormAction} variant="outline" />
          <MediatorFormSubmit label="ส่งตรวจสอบ" formAction={submitFormAction} />
        </div>
      </section>
    </form>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-[#A87900]">ขั้นตอนที่ {step}</p><h2 className="mt-1 text-lg font-semibold">{title}</h2><div className="mt-5 space-y-4">{children}</div></section>;
}

function InputGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  name,
  label,
  value,
  type = "text",
  required = false,
  pattern,
  inputMode,
  maxLength,
}: {
  name: string;
  label: string;
  value?: string | number | null;
  type?: string;
  required?: boolean;
  pattern?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <Input
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={required}
        pattern={pattern}
        inputMode={inputMode}
        maxLength={maxLength}
        className="mt-2"
      />
    </label>
  );
}

function TextArea({ name, label, value }: { name: string; label: string; value?: string | number | null }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><textarea name={name} defaultValue={String(value ?? "")} className="mt-2 min-h-28 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30" /></label>;
}
