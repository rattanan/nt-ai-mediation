import Image from "next/image";
import { footerColumns } from "@/data/landing";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <a href="#" className="flex items-center gap-3">
              <Image
                src="/images/nt-logo.png"
                alt="NT logo"
                width={136}
                height={45}
                className="h-9 w-auto"
              />
              <span className="text-base font-semibold tracking-tight text-muted-foreground">
                Mediation
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered digital mediation, helping resolve debt disputes quickly, fairly, and
              securely - without going to court.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold">{column.heading}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NT AI Digital Mediation Platform. All rights
            reserved.
          </p>
          <p className="text-sm text-muted-foreground">Made for a fairer resolution.</p>
        </div>
      </div>
    </footer>
  );
}
