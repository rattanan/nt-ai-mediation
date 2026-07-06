import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentProfile } from "@/lib/auth/server";
import { getOrCreateCompletionCertificate } from "@/lib/certificates";
import { money } from "@/lib/closing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", request.url));

  const { caseId } = await params;
  const { certificate, closing } = await getOrCreateCompletionCertificate(caseId);
  const item = closing.cases;
  const plan = closing.settlement_payment_plans?.[0];
  const mediatorName = closing.mediator_profiles
    ? `${closing.mediator_profiles.title ?? ""} ${closing.mediator_profiles.first_name} ${closing.mediator_profiles.last_name}`.trim()
    : "-";
  const discount = closing.settled_amount ? Math.max(0, closing.original_debt_amount - closing.settled_amount) : 0;

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const thaiFontBytes = readFileSync(join(process.cwd(), "public/fonts/ArialUnicode.ttf"));
  const font = await pdf.embedFont(thaiFontBytes);
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();

  const draw = (text: string, x: number, y: number, size = 11, _isBold = false, color = rgb(0.08, 0.09, 0.11)) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness = 1, color = rgb(0.82, 0.76, 0.59)) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  };

  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderWidth: 1.2, borderColor: rgb(0.93, 0.82, 0.28) });
  page.drawRectangle({ x: 42, y: 742, width: width - 84, height: 58, color: rgb(1, 0.97, 0.83), borderColor: rgb(0.93, 0.82, 0.28), borderWidth: 0.6 });
  draw("NT AI Digital Mediation Platform", 62, 781, 12, true, rgb(0.67, 0.47, 0));
  draw("หนังสือรับรองการไกล่เกลี่ยสำเร็จ", 62, 762, 20, true);
  draw("Completion Certificate", 62, 746, 10, false, rgb(0.42, 0.42, 0.42));
  draw("เลขที่", 392, 774, 10, false, rgb(0.42, 0.42, 0.42));
  wrapText(page, certificate.certificate_number, 392, 760, 136, 9, font);

  draw("ขอรับรองว่าเคสไกล่เกลี่ยเลขที่", 92, 694, 12);
  draw(String(item?.case_number ?? "-"), 92, 666, 22, true);
  draw("ได้ดำเนินการผ่านระบบ NT AI Digital Mediation Platform และคู่กรณีสามารถบรรลุข้อตกลงร่วมกันได้", 92, 640, 11);
  draw(`วันที่ปิดผลการไกล่เกลี่ย ${new Date(closing.closed_at).toLocaleDateString("th-TH")}`, 92, 620, 11);

  drawRectangleSection(page, 56, 548, 483, 72);
  draw("เจ้าหนี้", 72, 598, 10, false, rgb(0.47, 0.47, 0.47));
  draw(closing.creditor_organizations?.organization_name ?? item?.creditor_name ?? "-", 72, 582, 12, true);
  draw("ผู้ไกล่เกลี่ย", 300, 598, 10, false, rgb(0.47, 0.47, 0.47));
  draw(mediatorName, 300, 582, 12, true);

  drawRectangleSection(page, 56, 452, 483, 72);
  draw("ยอดหนี้เดิม", 72, 502, 10, false, rgb(0.47, 0.47, 0.47));
  draw(money(closing.original_debt_amount), 72, 486, 12, true);
  draw("ยอดตกลงชำระ", 300, 502, 10, false, rgb(0.47, 0.47, 0.47));
  draw(money(closing.settled_amount), 300, 486, 12, true);

  drawRectangleSection(page, 56, 356, 483, 72);
  draw("ส่วนลด", 72, 406, 10, false, rgb(0.47, 0.47, 0.47));
  draw(money(discount), 72, 390, 12, true);
  draw("จำนวนงวด", 300, 406, 10, false, rgb(0.47, 0.47, 0.47));
  draw(`${plan?.number_of_installments ?? 0} งวด`, 300, 390, 12, true);

  drawRectangleSection(page, 56, 258, 483, 84);
  draw("สรุปข้อตกลง", 72, 322, 10, false, rgb(0.47, 0.47, 0.47));
  wrapText(page, closing.settlement_summary ?? "-", 72, 304, 450, 11, font);

  draw("ลายเซ็น", 56, 214, 13, true);
  const signers = [
    { label: "ลูกหนี้", x: 56 },
    { label: "เจ้าหนี้", x: 223 },
    { label: "ผู้ไกล่เกลี่ย", x: 390 },
  ];

  signers.forEach((signer) => {
    draw(signer.label, signer.x, 180, 11, true);
    drawLine(signer.x, 150, signer.x + 125, 150, 1);
    draw("ลงชื่อ", signer.x, 132, 10, false, rgb(0.45, 0.45, 0.45));
  });

  draw(`ออกเอกสารเมื่อ ${new Date(certificate.issued_at).toLocaleString("th-TH")}`, 56, 70, 9, false, rgb(0.45, 0.45, 0.45));
  draw("All rights reserved @ 2026", 56, 54, 9, false, rgb(0.45, 0.45, 0.45));

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="certificate-${caseId}.pdf"`,
    },
  });
}

function drawRectangleSection(page: import("pdf-lib").PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, borderWidth: 0.8, borderColor: rgb(0.92, 0.92, 0.92), color: rgb(1, 1, 1) });
}

function wrapText(page: import("pdf-lib").PDFPage, text: string, x: number, y: number, maxWidth: number, size: number, font: import("pdf-lib").PDFFont) {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color: rgb(0.2, 0.2, 0.2) });
      currentY -= size + 4;
      line = word;
    } else {
      line = next;
    }
  }

  if (line) page.drawText(line, { x, y: currentY, size, font, color: rgb(0.2, 0.2, 0.2) });
}
