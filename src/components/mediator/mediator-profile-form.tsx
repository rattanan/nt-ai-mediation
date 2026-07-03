import type { MediatorAvailability, MediatorProfile } from "@/lib/mediators";
import type React from "react";
import { jsonList } from "@/lib/mediators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  saveAction: (formData: FormData) => Promise<void>;
  submitAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form className="space-y-6">
      <Section step="1" title="ข้อมูลส่วนบุคคล">
        <InputGrid>
          <Field name="title" label="คำนำหน้า" value={profile?.title} />
          <Field name="first_name" label="ชื่อ" value={profile?.first_name} required />
          <Field name="last_name" label="นามสกุล" value={profile?.last_name} required />
          <Field name="citizen_id" label="เลขบัตรประชาชน" value={profile?.citizen_id} required />
          <Field name="date_of_birth" label="วันเกิด" value={profile?.date_of_birth} type="date" />
          <Field name="gender" label="เพศ" value={profile?.gender} />
          <Field name="phone" label="โทรศัพท์" value={profile?.phone} required />
          <Field name="email" label="อีเมล" value={profile?.email} type="email" />
          <Field name="province" label="จังหวัด" value={profile?.province} required />
          <Field name="district" label="อำเภอ/เขต" value={profile?.district} />
        </InputGrid>
        <TextArea name="address" label="ที่อยู่ส่วนตัว" value={profile?.address} />
      </Section>

      <Section step="2" title="การศึกษาและอาชีพ">
        <InputGrid>
          <Field name="education_level" label="ระดับการศึกษา" value={profile?.education_level} />
          <Field name="occupation" label="อาชีพปัจจุบัน" value={profile?.occupation} />
          <Field name="current_organization" label="หน่วยงานปัจจุบัน" value={profile?.current_organization} />
        </InputGrid>
        <TextArea name="education_detail" label="รายละเอียดการศึกษา" value={profile?.education_detail} />
      </Section>

      <Section step="3" title="คุณสมบัติผู้ไกล่เกลี่ย">
        <InputGrid>
          <Field name="mediator_license_number" label="เลขทะเบียน/ใบอนุญาตผู้ไกล่เกลี่ย" value={profile?.mediator_license_number} required />
          <Field name="mediator_registration_authority" label="หน่วยงานที่ขึ้นทะเบียน" value={profile?.mediator_registration_authority} />
        </InputGrid>
        <TextArea name="documents" label="ลิงก์เอกสารรับรอง/อบรม (1 บรรทัดต่อ 1 เอกสาร)" value={documents.join("\n")} />
      </Section>

      <Section step="4" title="ประสบการณ์การไกล่เกลี่ย">
        <InputGrid>
          <Field name="mediation_experience_years" label="จำนวนปีประสบการณ์" value={profile?.mediation_experience_years} type="number" />
          <Field name="total_cases_handled" label="จำนวนเคสที่เคยดูแล" value={profile?.total_cases_handled} type="number" />
          <Field name="successful_cases" label="จำนวนเคสสำเร็จ" value={profile?.successful_cases} type="number" />
        </InputGrid>
        <TextArea name="profile_summary" label="ประวัติและภาพรวมวิชาชีพ" value={profile?.profile_summary} />
      </Section>

      <Section step="5" title="ความเชี่ยวชาญและพื้นที่ให้บริการ">
        <TextArea name="expertise_areas" label="ความเชี่ยวชาญ (คั่นด้วย comma หรือขึ้นบรรทัดใหม่)" value={jsonList(profile?.expertise_areas).join("\n")} />
        <TextArea name="debt_types_supported" label="ประเภทหนี้ที่รองรับ" value={jsonList(profile?.debt_types_supported).join("\n")} />
        <TextArea name="service_provinces" label="จังหวัดที่ให้บริการ" value={jsonList(profile?.service_provinces).join("\n")} />
        <TextArea name="languages" label="ภาษา" value={jsonList(profile?.languages).join("\n")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><input name="online_mediation_available" type="checkbox" defaultChecked={profile?.online_mediation_available ?? true} /> ให้บริการออนไลน์</label>
          <label className="flex items-center gap-2 text-sm"><input name="onsite_mediation_available" type="checkbox" defaultChecked={profile?.onsite_mediation_available ?? false} /> ให้บริการ onsite</label>
        </div>
      </Section>

      <Section step="6" title="เวลาว่างและภาระงาน">
        <TextArea name="available_days" label="วันที่สะดวก" value={jsonList(availability?.available_days).join("\n")} />
        <TextArea name="available_time_slots" label="ช่วงเวลาที่สะดวก" value={jsonList(availability?.available_time_slots).join("\n")} />
        <Field name="max_cases_per_month" label="จำนวนเคสสูงสุดต่อเดือน" value={availability?.max_cases_per_month ?? 10} type="number" />
        <label className="flex items-center gap-2 text-sm"><input name="availability_active" type="checkbox" defaultChecked={availability?.active ?? true} /> เปิดรับงาน</label>
      </Section>

      <Section step="7" title="รูปโปรไฟล์และเอกสาร">
        <Field name="profile_photo_url" label="URL รูปโปรไฟล์" value={profile?.profile_photo_url} />
        <p className="text-sm text-[#6B7280]">เอกสารสำคัญ เช่น สำเนาบัตรประชาชน ใบรับรอง และเอกสารการศึกษา ให้ใส่เป็นลิงก์ในขั้นตอนที่ 3 ก่อน ระบบจะรองรับ Supabase Storage ในรอบถัดไป</p>
      </Section>

      <section className="rounded-lg border border-black/5 bg-[#111827] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#FFD200]">ขั้นตอนที่ 8</p>
        <h2 className="mt-1 text-lg font-semibold">ตรวจสอบและส่งโปรไฟล์</h2>
        <p className="mt-2 text-sm text-white/70">บันทึกแบบร่างเพื่อกลับมาแก้ไข หรือส่งให้ผู้ดูแลระบบตรวจสอบเพื่ออนุมัติการแสดงผล</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button formAction={saveAction} type="submit" variant="outline" className="rounded-lg border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">บันทึกแบบร่าง</Button>
          <Button formAction={submitAction} type="submit" className="rounded-lg font-semibold">ส่งตรวจสอบ</Button>
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

function Field({ name, label, value, type = "text", required = false }: { name: string; label: string; value?: string | number | null; type?: string; required?: boolean }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><Input name={name} type={type} defaultValue={value ?? ""} required={required} className="mt-2" /></label>;
}

function TextArea({ name, label, value }: { name: string; label: string; value?: string | null }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><textarea name={name} defaultValue={value ?? ""} className="mt-2 min-h-28 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30" /></label>;
}
