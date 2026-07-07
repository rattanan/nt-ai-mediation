import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  UserRound,
  ClipboardCheck,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: MessageSquareText,
    title: "ตอบคำถามเกี่ยวกับการไกล่เกลี่ยหนี้",
    description: "ช่วยอธิบายข้อมูลพื้นฐานและแนวทางการเริ่มต้นได้อย่างรวดเร็ว",
  },
  {
    icon: UserRound,
    title: "แนะนำขั้นตอนการสมัคร",
    description: "พาไปทีละขั้นตอนตั้งแต่เริ่มต้นจนถึงการยื่นคำขอไกล่เกลี่ย",
  },
  {
    icon: FileText,
    title: "ตรวจสอบความพร้อมของเอกสาร",
    description: "ช่วยเช็กเอกสารสำคัญก่อนส่งคำร้องเพื่อลดการตกหล่น",
  },
  {
    icon: CalendarDays,
    title: "แนะนำการนัดหมายผู้ไกล่เกลี่ย",
    description: "อธิบายขั้นตอนการนัดหมายและการเตรียมตัวก่อนพบผู้ไกล่เกลี่ย",
  },
  {
    icon: Clock3,
    title: "ตอบคำถามตลอด 24 ชั่วโมง",
    description: "พร้อมช่วยเหลือคุณได้ทุกเวลา ไม่ต้องรอเวลาทำการ",
  },
];

export function LineChatbotSection() {
  return (
    <section
      className="relative overflow-hidden bg-white py-20 lg:py-28"
      aria-labelledby="line-chatbot-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
      />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[#FFF8D6] px-4 py-1.5 text-xs font-semibold text-[#7A5A00] shadow-sm">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              LINE Official Account
            </span>

            <h2
              id="line-chatbot-heading"
              className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              💬 เริ่มต้นปรึกษาปัญหาหนี้กับ &quot;สัญญาใจ&quot;
            </h2>

            <p className="mt-4 text-xl font-medium text-[#7A5A00]">
              AI Chatbot ผู้ช่วยแนะนำการไกล่เกลี่ยหนี้ของ NT
            </p>

            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
              สัญญาใจ พร้อมให้คำแนะนำเกี่ยวกับการไกล่เกลี่ยหนี้ ตอบคำถามเบื้องต้น แนะนำ
              ขั้นตอนการสมัคร เตรียมเอกสาร และช่วยให้คุณเริ่มต้นเข้าสู่กระบวนการ
              ไกล่เกลี่ยได้อย่างมั่นใจ
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className={cn(
                      "group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFD100]/15 text-foreground transition-colors group-hover:bg-[#FFD100]">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                href="https://line.me/R/ti/p/%40584izmwx"
                target="_blank"
                rel="noreferrer noopener"
                size="lg"
                className="rounded-full bg-[#FFD100] px-6 font-semibold text-foreground hover:bg-[#f1c700]"
                aria-label="เพิ่มเพื่อนผ่าน LINE Official Account สัญญาใจ"
              >
                เพิ่มเพื่อนผ่าน LINE
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                href="/register"
                size="lg"
                variant="outline"
                className="rounded-full border-[#D6B000] px-6 font-semibold text-foreground hover:bg-[#FFF8D6]"
                aria-label="เข้าสู่ระบบเพื่อเริ่มการใช้งาน"
              >
                เข้าสู่ระบบ
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              🔒 ไม่มีค่าใช้จ่ายในการพูดคุยกับ AI เบื้องต้น
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_72px_-28px_rgba(0,0,0,0.34)]">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#FFD100]/20 blur-2xl"
                  />
                  <div className="relative overflow-hidden rounded-full border-4 border-white shadow-lg">
                    <Image
                      src="/images/sanyajai-profile.png"
                      alt="โปรไฟล์แชตบอทสัญญาใจ"
                      width={256}
                      height={256}
                      className="h-36 w-36 object-cover sm:h-44 sm:w-44"
                      priority={false}
                    />
                  </div>
                </div>

                <div className="w-full rounded-3xl bg-[#FFF8D6] p-5 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A87900]">
                    LINE Official Account
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">@584izmwx</p>
                </div>

                <div className="w-full rounded-3xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">สแกน QR Code</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        เพิ่มเพื่อนได้อย่างรวดเร็วบน LINE
                      </p>
                    </div>
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[#FFD100]/15 text-foreground">
                      <ClipboardCheck className="size-5" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-white p-3">
                    <Image
                      src="/images/sanyajai-qr.png"
                      alt="QR Code สำหรับเพิ่มเพื่อน LINE สัญญาใจ"
                      width={512}
                      height={512}
                      className="h-auto w-full rounded-xl object-contain"
                      priority={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
