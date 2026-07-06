import { APP_COPYRIGHT_YEAR, APP_VERSION } from "@/lib/app-version";

export function AppFooter({
  className = "",
  rightsLabel = `All rights reserved @ ${APP_COPYRIGHT_YEAR}`,
}: {
  className?: string;
  rightsLabel?: string;
}) {
  return (
    <footer className={`border-t border-black/5 bg-white/80 px-5 py-4 text-xs text-[#6B7280] lg:px-8 ${className}`.trim()}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>NT AI Digital Mediation Platform. {rightsLabel}</p>
        <p>Latest version {APP_VERSION}</p>
      </div>
    </footer>
  );
}
