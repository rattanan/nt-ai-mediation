import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ConsentForm } from "@/components/auth/consent-form";
import { getActiveConsentVersion, userHasLatestConsent } from "@/lib/consent";
import { getCurrentProfile } from "@/lib/auth/server";
import { getRoleHome } from "@/lib/auth/routes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const [{ error, next }, consent, profile] = await Promise.all([
    searchParams,
    getActiveConsentVersion(),
    getCurrentProfile(),
  ]);

  if (profile && (await userHasLatestConsent(profile.id, consent.version))) {
    redirect(next?.startsWith("/") ? next : getRoleHome(profile.role));
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-5 py-8 text-[#1F2937] dark:bg-[#050816] dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-3 self-start">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FFD200] text-[#111827]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#8A6500] dark:text-[#FFD200]">NT AI</p>
            <p className="font-semibold">Digital Mediation Platform</p>
          </div>
        </Link>
        <ConsentForm consent={consent} error={error} next={next} />
      </div>
    </main>
  );
}
