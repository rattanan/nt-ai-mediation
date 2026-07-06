import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { getSettlementDocument, money, paymentFrequencyLabels, resultStatusLabels } from "@/lib/closing";
import { getCurrentProfile } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", request.url));

  const { documentId } = await params;
  const document = await getSettlementDocument(documentId);
  const closing = document.mediation_closing_records;
  const item = closing.cases;
  const plan = closing.settlement_payment_plans?.[0];
  const signatures = new Map((document.settlement_document_signatures ?? []).map((row) => [row.signer_role, row]));
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const thaiFontBytes = readFileSync(join(process.cwd(), "public/fonts/ArialUnicode.ttf"));
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(thaiFontBytes);
  const draw = (text: string, x: number, y: number, size = 11, isBold = false) => {
    page.drawText(text, { x, y, size, font, color: rgb(0.08, 0.09, 0.11) });
  };

  draw("NT AI Digital Mediation Platform", 48, 798, 12, true);
  draw(resultStatusLabels[closing.result_status], 48, 780, 11, true);
  draw(`เลขเคส: ${item?.case_number ?? "-"}`, 48, 758);
  draw(`เจ้าหนี้: ${closing.creditor_organizations?.organization_name ?? item?.creditor_name ?? "-"}`, 48, 740);
  draw(`ผู้ไกล่เกลี่ย: ${closing.mediator_profiles ? `${closing.mediator_profiles.first_name} ${closing.mediator_profiles.last_name}` : "-"}`, 48, 722);
  draw(`วันที่สร้างเอกสาร: ${new Date(document.generated_at).toLocaleString("th-TH")}`, 48, 704);
  draw(`ยอดหนี้เดิม: ${money(closing.original_debt_amount)}`, 48, 686);
  if (closing.result_status === "settled") {
    draw(`ยอดตกลงชำระ: ${money(closing.settled_amount)}`, 48, 668);
    draw(`จำนวนงวด: ${plan?.number_of_installments ?? 0}`, 48, 650);
    draw(`ความถี่: ${plan ? paymentFrequencyLabels[plan.payment_frequency] : "-"}`, 48, 632);
  } else {
    draw(`เหตุผลไม่สำเร็จ: ${(closing.unsuccessful_reason ?? "-").slice(0, 120)}`, 48, 650);
  }

  draw("สรุปข้อตกลง / การพูดคุย", 48, 598, 11, true);
  wrapText(page, closing.settlement_summary ?? "-", 48, 580, 500, 10, font);
  draw("หมายเหตุผู้ไกล่เกลี่ย", 48, 500, 11, true);
  wrapText(page, closing.mediator_note ?? "-", 48, 482, 500, 10, font);

  draw("ลายเซ็น", 48, 384, 12, true);
  const signers = [
    { role: "debtor", label: "ลูกหนี้" },
    { role: "creditor", label: "เจ้าหนี้" },
    { role: "mediator", label: "ผู้ไกล่เกลี่ย" },
  ] as const;
  signers.forEach((signer, index) => {
    const x = 48 + index * 170;
    draw(signer.label, x, 344, 10, true);
    page.drawLine({ start: { x, y: 322 }, end: { x: x + 130, y: 322 }, thickness: 1, color: rgb(0, 0, 0) });
    const entry = signatures.get(signer.role);
    if (entry) {
      draw(entry.signer_name, x, 304, 10, true);
    draw(`ลงนามเมื่อ ${new Date(entry.signed_at).toLocaleString("th-TH")}`, x, 290, 8);
    } else {
      draw("ยังไม่ได้ลงนาม", x, 304, 9);
    }
  });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="settlement-${documentId}.pdf"`,
    },
  });
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
