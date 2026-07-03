"use client";

import { useState } from "react";
import { Benefits } from "@/components/landing/benefits";
import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Security } from "@/components/landing/security";
import { ParticipatingCreditors } from "@/components/landing/participating-creditors";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { Timeline } from "@/components/landing/timeline";
import { TrustBar } from "@/components/landing/trust-bar";
import { landingContent, type Language } from "@/data/landing";

export function LandingPage() {
  const [language, setLanguage] = useState<Language>("th");
  const content = landingContent[language];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader content={content} language={language} onLanguageChange={setLanguage} />
      <main>
        <Hero content={content.hero} />
        <TrustBar content={content.trustBar} />
        <Features content={content.features} />
        <Timeline content={content.timeline} />
        <Benefits content={content.benefits} />
        <ParticipatingCreditors />
        <Stats stats={content.stats} />
        <Security content={content.security} />
        <Testimonials content={content.testimonials} />
        <CTA content={content.cta} />
      </main>
      <SiteFooter content={content.footer} />
    </div>
  );
}
