"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingContent } from "@/data/landing";

export function Hero({ content }: { content: LandingContent["hero"] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    if (!isDemoOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDemoOpen]);

  function openDemo() {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    setIsDemoOpen(true);
  }

  function closeDemo() {
    setIsDemoOpen(false);
    dialogRef.current?.close();
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="size-3.5 text-accent-blue" aria-hidden="true" />
              {content.badge}
            </span>

            <h1 className="mt-6 text-pretty text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {content.titlePrefix} <span className="text-foreground">{content.titleHighlight}</span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {content.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/login" size="lg" className="rounded-full font-semibold">
                {content.primaryCta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button href="/mediators" size="lg" variant="outline" className="rounded-full font-semibold">
                {content.secondaryCta}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="ghost"
                className="rounded-full font-semibold"
                onClick={openDemo}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="size-3 fill-current" aria-hidden="true" />
                </span>
                {content.demoCta}
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              {content.trustNote}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5">
              <Image
                src="/images/hero-mediation.png"
                alt={content.imageAlt}
                width={1024}
                height={768}
                className="h-full w-full object-cover"
                priority
              />
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md sm:flex">
              <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{content.floatingTitle}</p>
                <p className="text-xs text-muted-foreground">{content.floatingDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="demo-video-title"
        className="m-auto w-[calc(100%-2rem)] max-w-5xl overflow-visible border-0 bg-transparent p-0 text-foreground backdrop:bg-black/75 backdrop:backdrop-blur-sm"
        onClose={() => setIsDemoOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDemo();
          }
        }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl shadow-black/50">
          <h2 id="demo-video-title" className="sr-only">
            {content.demoModalTitle}
          </h2>
          <button
            type="button"
            aria-label={content.demoModalCloseLabel}
            className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            onClick={closeDemo}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <div className="aspect-video w-full">
            {isDemoOpen ? (
              <iframe
                className="size-full"
                src="https://www.youtube-nocookie.com/embed/equupu5HFyk?autoplay=1&rel=0"
                title={content.demoModalTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
