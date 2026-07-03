import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getRoleHome, isAppRole } from "@/lib/auth/routes";
import { appUrl, isEmailVerified } from "@/lib/auth/verification";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";
import type { AppRole } from "@/types/database";

const portalRoutes: Record<string, AppRole> = {
  "/debtor": "debtor",
  "/mediator": "mediator",
  "/creditor": "creditor",
  "/admin": "admin",
};

function getExpectedRole(pathname: string) {
  const route = Object.keys(portalRoutes).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return route ? portalRoutes[route] : null;
}

export async function updateSession(request: NextRequest) {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const expectedRole = getExpectedRole(request.nextUrl.pathname);

  if (!expectedRole) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = appUrl("/login");
    loginUrl.searchParams.set("message", "กรุณาเข้าสู่ระบบก่อนเข้าใช้งานพอร์ตัล");
    return NextResponse.redirect(loginUrl);
  }

  if (!isEmailVerified(user)) {
    const verifyUrl = appUrl("/verify-email");
    if (user.email) {
      verifyUrl.searchParams.set("email", user.email);
    }
    verifyUrl.searchParams.set("message", "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ");
    return NextResponse.redirect(verifyUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (!role || !isAppRole(role)) {
    const registerUrl = appUrl("/register");
    registerUrl.searchParams.set("message", "กรุณาสร้างโปรไฟล์และเลือกบทบาทผู้ใช้งาน");
    return NextResponse.redirect(registerUrl);
  }

  if (profile.account_status === "suspended" || profile.account_status === "disabled") {
    const loginUrl = appUrl("/login");
    loginUrl.searchParams.set("message", "บัญชีนี้ยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
    return NextResponse.redirect(loginUrl);
  }

  if (role !== expectedRole) {
    const roleUrl = appUrl(getRoleHome(role));
    return NextResponse.redirect(roleUrl);
  }

  return supabaseResponse;
}
