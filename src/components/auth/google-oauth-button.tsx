"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/types/database";

type GoogleOAuthButtonProps = {
  label: string;
  role?: AppRole;
  returnUrl?: string;
};

export function GoogleOAuthButton({ label, role, returnUrl }: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleOAuth() {
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const origin =
      window.location.hostname === "0.0.0.0"
        ? `${window.location.protocol}//localhost:${window.location.port || "3000"}`
        : window.location.origin;
    const redirectUrl = new URL("/auth/callback", origin);

    if (role) {
      redirectUrl.searchParams.set("role", role);
    }

    if (returnUrl?.startsWith("/")) {
      redirectUrl.searchParams.set("returnUrl", returnUrl);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      setIsLoading(false);
      setErrorMessage("ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองอีกครั้ง");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogleOAuth}
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#1F2937] transition hover:bg-[#FFFBEA] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB] text-sm font-bold">
          G
        </span>
        {isLoading ? "กำลังเชื่อมต่อ Google..." : label}
      </button>
      {errorMessage ? <p className="text-center text-xs text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
