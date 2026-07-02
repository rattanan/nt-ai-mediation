import { Benefits } from "@/components/landing/benefits";
import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Security } from "@/components/landing/security";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { Timeline } from "@/components/landing/timeline";
import { TrustBar } from "@/components/landing/trust-bar";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <Features />
        <Timeline />
        <Benefits />
        <Stats />
        <Security />
        <Testimonials />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
