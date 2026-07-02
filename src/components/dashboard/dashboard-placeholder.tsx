import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { DashboardPlaceholder as DashboardPlaceholderData } from "@/data/landing";

export function DashboardPlaceholder({ data }: { data: DashboardPlaceholderData }) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="w-full rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to landing page
          </Link>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
                Supabase Auth ready placeholder
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                {data.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {data.description}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-primary/10 p-6">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="mt-2 text-3xl font-bold">{data.role}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Route shell only. Data loading, permissions, and session checks can be wired through
                Supabase middleware in the next implementation phase.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
