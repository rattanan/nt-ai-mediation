import "server-only";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const CONSENT_COOKIE = "nt_consent_token";
export const FALLBACK_CONSENT_VERSION = "1.0";

export type ConsentLanguage = "th" | "en";

export type ConsentVersion = {
  id: string;
  version: string;
  title_th: string;
  title_en: string;
  content_th: string;
  content_en: string;
  is_active: boolean;
};

type ConsentTokenPayload = {
  version: string;
  language: ConsentLanguage;
  acceptedAt: string;
};

export const fallbackConsentVersion: ConsentVersion = {
  id: "fallback",
  version: FALLBACK_CONSENT_VERSION,
  title_th: "ข้อตกลงและความยินยอมในการใช้งาน",
  title_en: "Terms of Service & Privacy Consent",
  content_th: `## ข้อตกลงและความยินยอมในการใช้งาน

### NT AI Digital Mediation Platform

**ฉบับที่ 1.0**

ยินดีต้อนรับสู่ NT AI Digital Mediation Platform

โปรดอ่านข้อตกลงและเงื่อนไขนี้อย่างละเอียดก่อนสมัครสมาชิก

เมื่อท่านกด "ยอมรับและดำเนินการต่อ" ถือว่าท่านได้อ่าน เข้าใจ และยินยอมตามรายละเอียดดังต่อไปนี้

## 1. การสมัครสมาชิก

ผู้ใช้งานรับรองว่าข้อมูลที่ให้เป็นข้อมูลจริง มีอายุไม่ต่ำกว่า 20 ปีบริบูรณ์หรือมีอำนาจตามกฎหมาย มีสิทธิใช้งานอีเมลและหมายเลขโทรศัพท์ที่ลงทะเบียน และจะรักษาความลับของบัญชีผู้ใช้งาน

## 2. การเก็บรวบรวมข้อมูลส่วนบุคคล (PDPA)

ผู้ใช้งานยินยอมให้ระบบเก็บรวบรวมข้อมูลส่วนบุคคล เอกสารยืนยันตัวตน เอกสารเกี่ยวกับหนี้ ข้อมูลการติดต่อสื่อสาร ข้อมูลการประชุมไกล่เกลี่ย และข้อมูลการชำระหนี้ เพื่อพิสูจน์ตัวตน จัดการคำขอไกล่เกลี่ย นัดหมาย จัดทำรายงาน ติดตามผล และปฏิบัติตามกฎหมาย

## 3. การใช้ AI

ระบบอาจใช้ AI เพื่อช่วยวิเคราะห์ข้อมูลเบื้องต้น สรุปข้อมูลการสนทนา จัดหมวดหมู่เอกสาร สร้างรายงานการไกล่เกลี่ย และช่วยตอบคำถาม ทั้งนี้ AI ไม่มีอำนาจตัดสินข้อพิพาทแทนผู้ไกล่เกลี่ย

## 4. การบันทึกข้อมูลการประชุม

ผู้ใช้งานยินยอมให้ระบบบันทึกข้อความสนทนา บันทึกเสียงหรือวิดีโอหากเปิดใช้งาน สร้าง Transcript และสรุปรายงานการประชุม เพื่อใช้เป็นหลักฐานในการไกล่เกลี่ย

## 5. การเปิดเผยข้อมูล

ข้อมูลจะเปิดเผยเฉพาะคู่กรณี ผู้ไกล่เกลี่ย เจ้าหน้าที่ที่ได้รับมอบหมาย และหน่วยงานที่กฎหมายกำหนด จะไม่มีการขายข้อมูลส่วนบุคคลแก่บุคคลภายนอก

## 6. การรักษาความปลอดภัย

ระบบมีมาตรการ Encryption, Access Control, Audit Log และ MFA ในกรณีที่เปิดใช้งาน เพื่อปกป้องข้อมูลส่วนบุคคล

## 7. สิทธิของเจ้าของข้อมูล

ผู้ใช้งานสามารถขอเข้าถึงข้อมูล ขอแก้ไขข้อมูล ขอถอนความยินยอม ขอให้ลบข้อมูลภายใต้ข้อจำกัดของกฎหมาย และขอรับสำเนาข้อมูล

## 8. การใช้ข้อมูลทางสถิติ

ระบบอาจนำข้อมูลที่ไม่สามารถระบุตัวบุคคลได้มาใช้เพื่อวิเคราะห์สถิติ ปรับปรุงระบบ AI และพัฒนาคุณภาพบริการ

## 9. ค่าธรรมเนียม

ผู้ใช้งานรับทราบว่าการใช้บริการอาจมีค่าธรรมเนียมตามที่ผู้ให้บริการประกาศ โดยค่าธรรมเนียมจะแสดงก่อนมีการเรียกเก็บทุกครั้ง

## 10. การยอมรับ

เมื่อกด "ยอมรับ" ถือว่าผู้ใช้งานอ่านครบถ้วน เข้าใจ และยินยอมตามข้อตกลงทั้งหมด`,
  content_en: "Please read and accept the current terms before creating your account.",
  is_active: true,
};

function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXTAUTH_SECRET || "dev-consent-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function encodePayload(payload: ConsentTokenPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string): ConsentTokenPayload | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as ConsentTokenPayload;
  } catch {
    return null;
  }
}

export function createConsentToken(payload: ConsentTokenPayload) {
  const encoded = encodePayload(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyConsentToken(token: string | undefined | null, expectedVersion: string) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;
  const payload = decodePayload(encoded);
  if (!payload || payload.version !== expectedVersion) return null;
  return payload;
}

export async function getActiveConsentVersion(): Promise<ConsentVersion> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consent_versions")
    .select("id, version, title_th, title_en, content_th, content_en, is_active")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Active consent version lookup failed", error);
    return fallbackConsentVersion;
  }

  return data as ConsentVersion;
}

export async function getPendingConsent(expectedVersion: string) {
  const cookieStore = await cookies();
  return verifyConsentToken(cookieStore.get(CONSENT_COOKIE)?.value, expectedVersion);
}

export async function hasPendingConsent(expectedVersion: string) {
  return Boolean(await getPendingConsent(expectedVersion));
}

export async function userHasLatestConsent(userId: string, version: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_consents")
    .select("id")
    .eq("user_id", userId)
    .eq("consent_version", version)
    .maybeSingle();

  if (error) {
    console.error("Latest consent lookup failed", error);
    return false;
  }

  return Boolean(data);
}

export async function setPendingConsentCookie(version: string, language: ConsentLanguage) {
  const token = createConsentToken({ version, language, acceptedAt: new Date().toISOString() });
  const cookieStore = await cookies();
  cookieStore.set(CONSENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function recordUserConsent(userId: string, version: string, language: ConsentLanguage) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const ipAddress =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null;
  const userAgent = headerStore.get("user-agent");
  const admin = createAdminClient();

  const { error } = await admin.from("user_consents").upsert(
    {
      user_id: userId,
      consent_version: version,
      accepted_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      language,
    },
    { onConflict: "user_id,consent_version" },
  );

  if (error) {
    console.error("User consent recording failed", error);
    throw new Error("บันทึกความยินยอมไม่สำเร็จ");
  }

  cookieStore.delete(CONSENT_COOKIE);
}
