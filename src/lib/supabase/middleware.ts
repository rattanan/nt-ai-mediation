import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getRoleHome, isAppRole } from "@/lib/auth/routes";
import {
  getFullNameFromUser,
  getOrganizationNameFromUser,
  getRoleFromUserMetadata,
  isEmailVerified,
} from "@/lib/auth/verification";
import { getRequestOrigin } from "@/lib/auth/request-origin";
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
    const loginUrl = new URL("/login", getRequestOrigin(request));
    loginUrl.searchParams.set("message", "กรุณาเข้าสู่ระบบก่อนเข้าใช้งานพอร์ตัล");
    return NextResponse.redirect(loginUrl);
  }

  if (!isEmailVerified(user)) {
    const verifyUrl = new URL("/verify-email", getRequestOrigin(request));
    if (user.email) {
      verifyUrl.searchParams.set("email", user.email);
    }
    verifyUrl.searchParams.set("message", "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ");
    return NextResponse.redirect(verifyUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let role = profile?.role;

  if (!role || !isAppRole(role)) {
    const fallbackRole = getRoleFromUserMetadata(user);
    let { data: createdProfile, error: createProfileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        role: fallbackRole,
        email: user.email ?? null,
        full_name: getFullNameFromUser(user),
        organization_name: getOrganizationNameFromUser(user),
        email_verified: true,
        account_status: "active",
      })
      .select("role")
      .single();

    if (createProfileError) {
      console.error("Full profile creation failed in middleware", {
        code: createProfileError.code,
        message: createProfileError.message,
      });

      const minimalResult = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          role: fallbackRole,
          full_name: getFullNameFromUser(user),
        })
        .select("role")
        .single();

      createdProfile = minimalResult.data;
      createProfileError = minimalResult.error;
    }

    if (createProfileError || !createdProfile?.role || !isAppRole(createdProfile.role)) {
      if (createProfileError) {
        console.error("Minimal profile creation failed in middleware", {
          code: createProfileError.code,
          message: createProfileError.message,
        });
      }

      const loginUrl = new URL("/login", getRequestOrigin(request));
      loginUrl.searchParams.set("message", "เข้าสู่ระบบแล้ว แต่ยังสร้างโปรไฟล์ไม่ได้ กรุณาติดต่อผู้ดูแลระบบ");
      return NextResponse.redirect(loginUrl);
    }

    role = createdProfile.role;
  }

  if (role !== expectedRole) {
    const roleUrl = new URL(getRoleHome(role), getRequestOrigin(request));
    return NextResponse.redirect(roleUrl);
  }

  return supabaseResponse;
}
