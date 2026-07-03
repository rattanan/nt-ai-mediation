"use client";

import { cn } from "@/lib/utils";
import type { Language } from "@/data/landing";

const languages: Array<{ value: Language; label: string }> = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "ENG" },
];

type LanguageToggleProps = {
  value: Language;
  onChange: (language: Language) => void;
  className?: string;
};

export function LanguageToggle({ value, onChange, className }: LanguageToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-full border border-border bg-card p-1 shadow-sm",
        className,
      )}
      aria-label="Language switcher"
    >
      {languages.map((language) => {
        const isActive = language.value === value;

        return (
          <button
            key={language.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(language.value)}
            className={cn(
              "h-7 rounded-full px-3 text-xs font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
