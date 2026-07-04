"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { acceptConsent } from "@/app/auth/consent/actions";
import type { ConsentVersion } from "@/lib/consent";

const checkboxText = {
  th: [
    "ข้าพเจ้าได้อ่านและยอมรับเงื่อนไขการใช้งาน",
    "ข้าพเจ้ายินยอมให้เก็บและประมวลผลข้อมูลส่วนบุคคลตาม PDPA",
    "ข้าพเจ้าเข้าใจว่า AI อาจช่วยวิเคราะห์เอกสาร ถอดความ และสนับสนุนการไกล่เกลี่ย แต่ไม่มีอำนาจตัดสินทางกฎหมาย",
    "ข้าพเจ้ายินยอมให้บันทึก ถอดความ และจัดเก็บข้อมูลการประชุมเมื่อมีการเปิดใช้งาน",
  ],
  en: [
    "I have read and agree to the Terms of Service.",
    "I consent to the collection and processing of my personal data under PDPA.",
    "I understand that AI may assist in document analysis, transcription, and mediation support but does not make legal decisions.",
    "I consent to recording, transcription, and storage of mediation sessions when enabled.",
  ],
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="h-12 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold text-[#111827] transition hover:bg-[#F5B800] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FFD200]/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "กำลังบันทึก..." : "ยอมรับและดำเนินการต่อ"}
    </button>
  );
}

export function ConsentForm({
  consent,
  error,
  next,
}: {
  consent: ConsentVersion;
  error?: string;
  next?: string;
}) {
  const [language, setLanguage] = useState<"th" | "en">("th");
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState([false, false, false, false]);
  const allChecked = checked.every(Boolean);
  const canContinue = scrolled && allChecked;
  const terms = language === "th" ? consent.content_th : consent.content_en;
  const title = language === "th" ? consent.title_th : consent.title_en;
  const paragraphs = useMemo(() => terms.split("\n").filter((line) => line.trim().length > 0), [terms]);

  return (
    <form action={acceptConsent} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111827] sm:p-7">
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="scrolled_to_bottom" value={scrolled ? "true" : "false"} />
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6500] dark:text-[#FFD200]">Step 1 of 2</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#111827] dark:text-white">Terms of Service & Privacy Consent</h1>
          <p className="mt-2 text-sm leading-6 text-[#6B7280] dark:text-white/70">
            Please read and accept the following terms before creating your account.
          </p>
        </div>
        <label className="sr-only" htmlFor="consent-language">Language</label>
        <select
          id="consent-language"
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value === "en" ? "en" : "th");
            setScrolled(false);
          }}
          className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm dark:border-white/15 dark:bg-[#1F2937] dark:text-white"
        >
          <option value="th">ไทย</option>
          <option value="en">EN</option>
        </select>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <section
        aria-label={title}
        tabIndex={0}
        onScroll={(event) => {
          const element = event.currentTarget;
          if (element.scrollTop + element.clientHeight >= element.scrollHeight - 8) {
            setScrolled(true);
          }
        }}
        className="mt-6 max-h-[22rem] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-sm leading-7 text-[#374151] outline-none focus:ring-3 focus:ring-[#FFD200]/40 dark:border-white/10 dark:bg-[#0B1220] dark:text-white/80"
      >
        <h2 className="text-lg font-semibold text-[#111827] dark:text-white">{title}</h2>
        <p className="mt-1 text-xs font-medium text-[#6B7280] dark:text-white/55">Version {consent.version}</p>
        <div className="mt-4 space-y-3">
          {paragraphs.map((line, index) => (
            <p key={`${line}-${index}`} className={line.startsWith("##") ? "font-semibold text-[#111827] dark:text-white" : ""}>
              {line.replace(/^#+\s?/, "").replace(/\*\*/g, "")}
            </p>
          ))}
        </div>
      </section>

      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#6B7280] dark:text-white/60">
        <CheckCircle2 className={`h-4 w-4 ${scrolled ? "text-emerald-600" : "text-[#9CA3AF]"}`} />
        {scrolled ? "อ่านเงื่อนไขครบแล้ว" : "กรุณาเลื่อนอ่านเงื่อนไขจนจบ"}
      </div>

      <fieldset className="mt-6 space-y-3" aria-describedby="consent-help">
        <legend className="sr-only">Consent confirmations</legend>
        <p id="consent-help" className="text-sm font-medium text-[#111827] dark:text-white">ต้องยืนยันครบทุกข้อก่อนดำเนินการต่อ</p>
        {checkboxText[language].map((label, index) => (
          <label key={label} className="flex gap-3 rounded-lg border border-[#E5E7EB] p-3 text-sm leading-6 text-[#374151] dark:border-white/10 dark:text-white/80">
            <input
              type="checkbox"
              name={["agree_terms", "agree_pdpa", "agree_ai", "agree_recording"][index]}
              checked={checked[index]}
              onChange={(event) => {
                const nextChecked = [...checked];
                nextChecked[index] = event.target.checked;
                setChecked(nextChecked);
              }}
              className="mt-1 h-4 w-4 rounded border-[#9CA3AF] text-[#FFD200] focus:ring-[#FFD200]"
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <div className="mt-6">
        <SubmitButton disabled={!canContinue} />
      </div>
    </form>
  );
}
