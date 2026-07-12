"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/landing/site-header";
import { landingContent, type Language } from "@/data/landing";

export function PublicMediatorsHeader() {
  const [language, setLanguage] = useState<Language>("th");
  const landing = landingContent[language];
  const content = {
    ...landing,
    headerNavLinks: landing.headerNavLinks.map((link) => ({
      ...link,
      href: link.href.startsWith("#") ? `/${link.href}` : link.href,
    })),
  };
  return <SiteHeader content={content} language={language} onLanguageChange={setLanguage} />;
}
