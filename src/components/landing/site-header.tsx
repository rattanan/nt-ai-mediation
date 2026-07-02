"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { headerNavLinks } from "@/data/landing";
import { LanguageToggle, type Language } from "@/components/landing/language-toggle";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("th");

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
            AI Mediation
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {headerNavLinks.map((link) => (
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
          <LanguageToggle value={language} onChange={setLanguage} />
          <Button href="/login" variant="ghost" className="font-medium">
            Sign in
          </Button>
          <Button href="/login" className="rounded-full font-semibold">
            Start Mediation
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
            {headerNavLinks.map((link) => (
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
              <LanguageToggle value={language} onChange={setLanguage} className="w-fit" />
              <Button href="/login" variant="outline" className="w-full">
                Sign in
              </Button>
              <Button href="/login" className="w-full rounded-full font-semibold">
                Start Mediation
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
