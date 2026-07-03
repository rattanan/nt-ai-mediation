"use client";

import { useEffect, useRef, useState } from "react";
import type { Stat } from "@/data/landing";

function formatValue(current: number, stat: Stat) {
  const rounded =
    stat.decimals && stat.decimals > 0
      ? current.toFixed(stat.decimals)
      : Math.round(current).toLocaleString("en-US");

  return `${stat.prefix ?? ""}${rounded}${stat.suffix ?? ""}`;
}

function Counter({ stat, start }: { stat: Stat; start: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!start) return;

    let frame = 0;
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(stat.value * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [start, stat.value]);

  return (
    <span className="text-4xl font-bold tracking-tight sm:text-5xl">
      {formatValue(current, stat)}
    </span>
  );
}

export function Stats({ stats }: { stats: Stat[] }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div ref={ref} className="rounded-3xl border border-border bg-primary/10 px-8 py-14">
          <div className="grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <Counter stat={stat} start={visible} />
                <span className="mt-2 text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
