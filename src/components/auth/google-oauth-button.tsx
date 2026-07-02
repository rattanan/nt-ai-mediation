"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleOAuthButton({ label }: { label: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleOAuth() {
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
