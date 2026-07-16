"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

function storageKey(caseId: string) {
  return `mediator-closing-draft:${caseId}`;
}

export function ClosingDraftForm({
  caseId,
  action,
  className,
  children,
}: {
  caseId: string;
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    try {
      const stored = sessionStorage.getItem(storageKey(caseId));
      if (!stored) return;
      const values = JSON.parse(stored) as Record<string, string>;
      for (const [name, value] of Object.entries(values)) {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
          field.value = value;
        }
      }
    } catch {
      // Ignore malformed/unavailable storage and keep the server-rendered defaults.
    }
  }, [caseId]);

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    const values: Record<string, string> = {};
    for (const field of Array.from(event.currentTarget.elements)) {
      if (
        (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)
        && field.name
        && field.type !== "hidden"
        && field.type !== "submit"
      ) {
        values[field.name] = field.value;
      }
    }
    try {
      sessionStorage.setItem(storageKey(caseId), JSON.stringify(values));
    } catch {
      // The form still works when private browsing or storage policy blocks sessionStorage.
    }
  }

  return (
    <form ref={formRef} action={action} onInput={saveDraft} onSubmit={saveDraft} className={className}>
      {children}
    </form>
  );
}

export function ClearClosingDraft({ caseId }: { caseId: string }) {
  useEffect(() => {
    try {
      sessionStorage.removeItem(storageKey(caseId));
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  }, [caseId]);
  return null;
}
