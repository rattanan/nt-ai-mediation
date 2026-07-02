import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";
import { getRoleHome } from "@/lib/auth/routes";

function redirectWithMessage(request: NextRequest, path: string, message: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = `?message=${encodeURIComponent(message)}`;
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectWithMessage(request, "/login", "ไม่พบรหัสยืนยันจาก Google กรุณาลองอีกครั้ง");
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectWithMessage(request, "/login", "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithMessage(request, "/login", "ไม่พบข้อมูลผู้ใช้งานจาก Google กรุณาลองอีกครั้ง");
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    return redirectWithMessage(request, "/login", "ตรวจสอบโปรไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  let role = (existingProfile?.role ?? null) as AppRole | null;

  if (!role) {
    role = "debtor";
    const fullName =
      typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata.name === "string"
          ? user.user_metadata.name
          : user.email ?? "Google User";

    const { error: createProfileError } = await supabase.from("profiles").insert({
      id: user.id,
      role,
      full_name: fullName,
      organization_name: null,
    });

    if (createProfileError) {
      return redirectWithMessage(request, "/login", "สร้างโปรไฟล์หลังเข้าสู่ระบบด้วย Google ไม่สำเร็จ");
    }
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = getRoleHome(role);
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}
