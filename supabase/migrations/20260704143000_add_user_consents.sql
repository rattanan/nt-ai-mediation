create table if not exists public.consent_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title_th text not null default 'ข้อตกลงและความยินยอมในการใช้งาน',
  title_en text not null default 'Terms of Service & Privacy Consent',
  content_th text not null,
  content_en text not null default 'Please read and accept the current terms before creating your account.',
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists consent_versions_one_active_idx
  on public.consent_versions (is_active)
  where is_active;

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  language text not null default 'th',
  created_at timestamptz not null default now(),
  constraint user_consents_user_version_unique unique (user_id, consent_version)
);

create index if not exists user_consents_user_id_idx on public.user_consents(user_id);
create index if not exists user_consents_version_idx on public.user_consents(consent_version);

insert into public.consent_versions (version, title_th, title_en, content_th, content_en, is_active)
values (
  '1.0',
  'ข้อตกลงและความยินยอมในการใช้งาน',
  'Terms of Service & Privacy Consent',
  $terms_th$
## ข้อตกลงและความยินยอมในการใช้งาน

### NT AI Digital Mediation Platform

**ฉบับที่ 1.0**

ยินดีต้อนรับสู่ NT AI Digital Mediation Platform

โปรดอ่านข้อตกลงและเงื่อนไขนี้อย่างละเอียดก่อนสมัครสมาชิก

เมื่อท่านกด "ยอมรับและดำเนินการต่อ" ถือว่าท่านได้อ่าน เข้าใจ และยินยอมตามรายละเอียดดังต่อไปนี้

## 1. การสมัครสมาชิก

ผู้ใช้งานรับรองว่า

- ข้อมูลที่ให้เป็นข้อมูลจริง
- มีอายุไม่ต่ำกว่า 20 ปีบริบูรณ์ หรือมีอำนาจตามกฎหมาย
- มีสิทธิใช้งานอีเมลและหมายเลขโทรศัพท์ที่ลงทะเบียน
- จะรักษาความลับของบัญชีผู้ใช้งาน

## 2. การเก็บรวบรวมข้อมูลส่วนบุคคล (PDPA)

ผู้ใช้งานยินยอมให้ระบบเก็บรวบรวมข้อมูล เช่น ชื่อ นามสกุล เลขบัตรประชาชน วันเกิด ที่อยู่ เบอร์โทรศัพท์ Email เอกสารยืนยันตัวตน เอกสารเกี่ยวกับหนี้ ข้อมูลการติดต่อสื่อสาร ข้อมูลการประชุมไกล่เกลี่ย และข้อมูลการชำระหนี้ เพื่อวัตถุประสงค์ในการพิสูจน์ตัวตน จัดการคำขอไกล่เกลี่ย นัดหมาย จัดทำรายงาน ติดตามผล และปฏิบัติตามกฎหมาย

## 3. การใช้ AI

ระบบอาจใช้ AI เพื่อช่วยวิเคราะห์ข้อมูลเบื้องต้น สรุปข้อมูลการสนทนา จัดหมวดหมู่เอกสาร สร้างรายงานการไกล่เกลี่ย และช่วยตอบคำถาม ทั้งนี้ AI ไม่มีอำนาจตัดสินข้อพิพาทแทนผู้ไกล่เกลี่ย ผลการไกล่เกลี่ยถือเป็นการตกลงของคู่กรณีและผู้ไกล่เกลี่ยเท่านั้น

## 4. การบันทึกข้อมูลการประชุม

ผู้ใช้งานยินยอมให้ระบบบันทึกข้อความสนทนา บันทึกเสียงหรือวิดีโอหากเปิดใช้งาน สร้าง Transcript และสรุปรายงานการประชุม เพื่อใช้เป็นหลักฐานในการไกล่เกลี่ย

## 5. การเปิดเผยข้อมูล

ข้อมูลจะเปิดเผยเฉพาะคู่กรณี ผู้ไกล่เกลี่ย เจ้าหน้าที่ที่ได้รับมอบหมาย และหน่วยงานที่กฎหมายกำหนด จะไม่มีการขายข้อมูลส่วนบุคคลแก่บุคคลภายนอก

## 6. การรักษาความปลอดภัย

ระบบมีมาตรการ เช่น Encryption, Access Control, Audit Log และ MFA ในกรณีที่เปิดใช้งาน เพื่อปกป้องข้อมูลส่วนบุคคล

## 7. สิทธิของเจ้าของข้อมูล

ผู้ใช้งานสามารถขอเข้าถึงข้อมูล ขอแก้ไขข้อมูล ขอถอนความยินยอม ขอให้ลบข้อมูลภายใต้ข้อจำกัดของกฎหมาย และขอรับสำเนาข้อมูล

## 8. การใช้ข้อมูลทางสถิติ

ระบบอาจนำข้อมูลที่ไม่สามารถระบุตัวบุคคลได้มาใช้เพื่อวิเคราะห์สถิติ ปรับปรุงระบบ AI และพัฒนาคุณภาพบริการ

## 9. ค่าธรรมเนียม

ผู้ใช้งานรับทราบว่าการใช้บริการอาจมีค่าธรรมเนียมตามที่ผู้ให้บริการประกาศ โดยค่าธรรมเนียมดังกล่าวจะแสดงก่อนมีการเรียกเก็บทุกครั้ง

## 10. การยอมรับ

เมื่อกด "ยอมรับ" ถือว่าผู้ใช้งานอ่านครบถ้วน เข้าใจ และยินยอมตามข้อตกลงทั้งหมด
  $terms_th$,
  $terms_en$
## Terms of Service & Privacy Consent

### NT AI Digital Mediation Platform

**Version 1.0**

Please read and accept these terms before creating your account. By continuing, you confirm that your information is accurate, you consent to PDPA-related personal data processing, you understand that AI assists but does not make legal decisions, and you consent to recording, transcription, and storage of mediation sessions when enabled.
  $terms_en$,
  true
)
on conflict (version) do nothing;

alter table public.consent_versions enable row level security;
alter table public.user_consents enable row level security;

create policy "consent_versions_select_active"
on public.consent_versions for select
to anon, authenticated
using (is_active = true or public.is_admin());

create policy "consent_versions_manage_admin"
on public.consent_versions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "user_consents_select_own_or_admin"
on public.user_consents for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "user_consents_insert_own_or_admin"
on public.user_consents for insert
to authenticated
with check (user_id = (select auth.uid()) or public.is_admin());

create policy "user_consents_manage_admin"
on public.user_consents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
