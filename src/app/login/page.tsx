import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-[1fr_28rem]">
          <div className="hidden bg-primary p-10 lg:block">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Landing page
            </Link>
            <h1 className="mt-16 text-4xl font-bold tracking-tight">
              Sign in to NT AI Mediation
            </h1>
            <p className="mt-4 max-w-md leading-7 text-primary-foreground/75">
              Placeholder authentication screen prepared for future Supabase Auth,
              role-based redirects, and Google OAuth.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              UI placeholder only. Supabase session handling will be wired in the next phase.
            </p>

            <div className="mt-6 space-y-3">
              <Button variant="outline" className="h-11 w-full justify-center rounded-xl">
                <span className="flex size-6 items-center justify-center rounded-full border border-border text-sm font-bold">
                  G
                </span>
                Continue with Google
              </Button>
              <Button variant="outline" className="h-11 w-full justify-center rounded-xl">
                <Mail className="size-4" aria-hidden="true" />
                Continue with email
              </Button>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
              Future integration points: Supabase client creation, OAuth callback route,
              protected dashboard middleware, and role-based landing redirects.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
