"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingContent, Language } from "@/data/landing";
import { LanguageToggle } from "@/components/landing/language-toggle";

type SiteHeaderProps = {
  content: LandingContent;
  language: Language;
  onLanguageChange: (language: Language) => void;
};

export function SiteHeader({ content, language, onLanguageChange }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3">
          <Image
            src="/images/nt-logo.png"
            alt="NT logo"
            width={121}
            height={40}
            className="h-8 w-auto"
            priority
          />
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <span className="hidden text-base font-semibold tracking-tight text-muted-foreground sm:block">
            {content.brandLabel}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {content.headerNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle value={language} onChange={onLanguageChange} />
          <Button href="/login" variant="ghost" className="font-medium">
            {content.signInLabel}
          </Button>
          <Button href="/login" className="rounded-full font-semibold">
            {content.startLabel}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-10 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4" aria-label="Mobile">
            {content.headerNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <LanguageToggle value={language} onChange={onLanguageChange} className="w-fit" />
              <Button href="/login" variant="outline" className="w-full">
                {content.signInLabel}
              </Button>
              <Button href="/login" className="w-full rounded-full font-semibold">
                {content.startLabel}
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
