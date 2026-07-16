import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, type PDFFont, type PDFImage, type PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { getSettlementDocument, money, paymentFrequencyLabels, resultStatusLabels } from "@/lib/closing";
import { getCurrentProfile } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = rgb(0.07, 0.09, 0.15);
const MUTED = rgb(0.39, 0.43, 0.5);
const BORDER = rgb(0.88, 0.89, 0.91);
const SOFT = rgb(0.985, 0.985, 0.98);
const AMBER = rgb(0.66, 0.47, 0);
const GREEN = rgb(0.02, 0.48, 0.32);

export async function GET(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", request.url));

  const { documentId } = await params;
  const document = await getSettlementDocument(documentId);
  const closing = document.mediation_closing_records;
  const item = closing.cases;
  const plan = closing.settlement_payment_plans?.[0];
  const settled = closing.result_status === "settled";
  const signatures = new Map((document.settlement_document_signatures ?? []).map((row) => [row.signer_role, row]));

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(readFileSync(join(process.cwd(), "public/fonts/ArialUnicode.ttf")), { subset: true });
  const logo = await pdf.embedPng(readFileSync(join(process.cwd(), "public/images/nt-logo.png")));
  const signatureImages = new Map<string, PDFImage>();
  for (const signature of document.settlement_document_signatures ?? []) {
    if (!signature.signature_image_data) continue;
    try {
      const encoded = signature.signature_image_data.split(",", 2)[1];
      if (encoded) signatureImages.set(signature.signer_role, await pdf.embedPng(Buffer.from(encoded, "base64")));
    } catch {
      // Preserve compatibility with legacy or malformed signature rows by rendering the signer name.
    }
  }
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    drawCompactHeader(page, font, logo, item?.case_number ?? "-");
    y -= 46;
  };
  const ensureSpace = (height: number) => {
    if (y - height < 62) addPage();
  };

  drawHero(page, font, logo, settled, document.generated_at);
  y = 676;

  drawSectionTitle(page, font, "ข้อมูลการไกล่เกลี่ย", y);
  y -= 18;
  const summary = [
    ["เลขเคส", item?.case_number ?? "-"],
    ["สถานะผล", resultStatusLabels[closing.result_status]],
    ["เจ้าหนี้", closing.creditor_organizations?.organization_name ?? item?.creditor_name ?? "-"],
    ["ผู้ไกล่เกลี่ย", closing.mediator_profiles ? `${closing.mediator_profiles.first_name} ${closing.mediator_profiles.last_name}` : "-"],
    ["ยอดหนี้เดิม", money(closing.original_debt_amount)],
    [settled ? "ยอดตกลงชำระ" : "ผลการดำเนินการ", settled ? money(closing.settled_amount) : "ไม่สามารถตกลงได้"],
  ] as const;
  y = drawInfoGrid(page, font, summary, y);

  if (settled) {
    ensureSpace(138);
    y -= 7;
    drawSectionTitle(page, font, "แผนการชำระเงิน", y);
    y -= 18;
    y = drawInfoGrid(page, font, [
      ["เงินดาวน์", money(plan?.down_payment_amount)],
      ["ค่างวด", money(plan?.installment_amount)],
      ["จำนวนงวด", `${plan?.number_of_installments ?? 0} งวด`],
      ["ความถี่", plan ? paymentFrequencyLabels[plan.payment_frequency] : "-"],
      ["ครบกำหนดงวดแรก", formatDate(plan?.first_payment_due_date)],
      ["วิธีชำระเงิน", plan?.payment_method ?? "-"],
    ], y);
    y = drawTextSection("เงื่อนไขพิเศษ", plan?.special_terms ?? "-", y);
  } else {
    y = drawTextSection("เหตุผลที่ไกล่เกลี่ยไม่สำเร็จ", closing.unsuccessful_reason ?? "-", y, true);
  }

  y = drawTextSection(settled ? "สรุปข้อตกลง" : "สรุปการพูดคุย", closing.settlement_summary ?? "-", y, true);
  y = drawTextSection("หมายเหตุผู้ไกล่เกลี่ย", closing.mediator_note ?? "-", y);

  ensureSpace(126);
  y -= 5;
  drawSectionTitle(page, font, "การลงนามรับรอง", y);
  y -= 22;
  const signerItems = [
    { role: "debtor", label: "ลูกหนี้" },
    { role: "creditor", label: "เจ้าหนี้" },
    { role: "mediator", label: "ผู้ไกล่เกลี่ย" },
  ] as const;
  const gap = 16;
  const cardWidth = (CONTENT_WIDTH - gap * 2) / 3;
  signerItems.forEach((signer, index) => {
    const x = MARGIN + index * (cardWidth + gap);
    const entry = signatures.get(signer.role);
    drawSignatureCard(page, font, x, y, cardWidth, signer.label, entry ?? null, signatureImages.get(signer.role) ?? null);
  });

  const pages = pdf.getPages();
  pages.forEach((pdfPage, index) => drawFooter(pdfPage, font, index + 1, pages.length, item?.case_number ?? "-"));
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="settlement-${documentId}.pdf"`,
    },
  });

  function drawTextSection(title: string, value: string, currentY: number, emphasize = false) {
    const lines = splitText(value || "-", font, 9.5, CONTENT_WIDTH - 24);
    const boxHeight = Math.max(34, lines.length * 13 + 16);
    y = currentY;
    ensureSpace(boxHeight + 34);
    y -= 8;
    drawSectionTitle(page, font, title, y);
    y -= 15;
    page.drawRectangle({
      x: MARGIN,
      y: y - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: rgb(1, 1, 1),
      borderColor: emphasize ? rgb(0.77, 0.65, 0.28) : BORDER,
      borderWidth: emphasize ? 1 : 0.65,
    });
    drawLines(page, lines, MARGIN + 12, y - 14, font, 9.5, 13, INK);
    return y - boxHeight - 5;
  }
}

function drawHero(page: PDFPage, font: PDFFont, logo: import("pdf-lib").PDFImage, settled: boolean, generatedAt: string) {
  const logoSize = logo.scaleToFit(74, 46);
  page.drawImage(logo, { x: (PAGE_WIDTH - logoSize.width) / 2, y: 786, width: logoSize.width, height: logoSize.height });
  drawCentered(page, font, "NT AI Digital Mediation Platform", 775, 8.5, AMBER);
  drawCentered(page, font, settled ? "แบบบันทึกข้อตกลงระงับข้อพิพาท" : "แบบบันทึกผลการไกล่เกลี่ยไม่สำเร็จ", 750, 17, INK);
  drawCentered(page, font, settled ? "ผลการไกล่เกลี่ย: ตกลงสำเร็จ" : "ผลการไกล่เกลี่ย: ไม่สามารถตกลงได้", 730, 9, settled ? GREEN : rgb(0.72, 0.12, 0.12));
  drawCentered(page, font, `จัดทำเมื่อ ${formatDateTime(generatedAt)}`, 714, 7.5, MUTED);
  page.drawLine({ start: { x: MARGIN, y: 704 }, end: { x: PAGE_WIDTH - MARGIN, y: 704 }, thickness: 1.2, color: AMBER });
  page.drawLine({ start: { x: MARGIN, y: 700 }, end: { x: PAGE_WIDTH - MARGIN, y: 700 }, thickness: 0.35, color: AMBER });
}

function drawCompactHeader(page: PDFPage, font: PDFFont, logo: import("pdf-lib").PDFImage, caseNumber: string) {
  const logoSize = logo.scaleToFit(42, 24);
  page.drawImage(logo, { x: MARGIN, y: 808, width: logoSize.width, height: logoSize.height });
  page.drawText("NT AI - แบบบันทึกข้อตกลงระงับข้อพิพาท", { x: MARGIN + 50, y: 816, size: 9, font, color: INK });
  page.drawText(`เคส ${caseNumber}`, { x: 448, y: 816, size: 7.5, font, color: MUTED });
  page.drawLine({ start: { x: MARGIN, y: 799 }, end: { x: PAGE_WIDTH - MARGIN, y: 799 }, thickness: 0.8, color: AMBER });
}

function drawSectionTitle(page: PDFPage, font: PDFFont, title: string, y: number) {
  page.drawText(title, { x: MARGIN, y, size: 11, font, color: INK });
  const titleWidth = Math.min(font.widthOfTextAtSize(title, 11), CONTENT_WIDTH);
  page.drawLine({ start: { x: MARGIN, y: y - 5 }, end: { x: MARGIN + titleWidth + 18, y: y - 5 }, thickness: 1, color: AMBER });
}

function drawInfoGrid(page: PDFPage, font: PDFFont, items: readonly (readonly [string, string])[], topY: number) {
  const gapX = 8;
  const gapY = 4;
  const width = (CONTENT_WIDTH - gapX) / 2;
  const height = 34;
  items.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (width + gapX);
    const y = topY - row * (height + gapY) - height;
    page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1), borderColor: BORDER, borderWidth: 0.65 });
    page.drawRectangle({ x, y, width: 78, height, color: SOFT, borderColor: BORDER, borderWidth: 0.4 });
    page.drawText(label, { x: x + 8, y: y + 13, size: 7.5, font, color: MUTED });
    const lines = splitText(value, font, 9, width - 94).slice(0, 2);
    drawLines(page, lines, x + 86, y + 13, font, 9, 10, INK);
  });
  return topY - Math.ceil(items.length / 2) * (height + gapY);
}

function drawSignatureCard(page: PDFPage, font: PDFFont, x: number, topY: number, width: number, label: string, signature: { signer_name: string; signed_at: string } | null, signatureImage: PDFImage | null) {
  page.drawText(`ลงชื่อ ................................................`, { x: x + 4, y: topY - 24, size: 8.5, font, color: INK });
  page.drawText(`(${label})`, { x: x + 4, y: topY - 42, size: 8, font, color: MUTED });
  if (signature) {
    if (signatureImage) {
      const imageSize = signatureImage.scaleToFit(width - 18, 34);
      page.drawImage(signatureImage, {
        x: x + (width - imageSize.width) / 2,
        y: topY - 47,
        width: imageSize.width,
        height: imageSize.height,
      });
    }
    const nameLines = splitText(signature.signer_name, font, 9, width - 24).slice(0, 2);
    drawLines(page, nameLines, x + 4, topY - 59, font, 8.5, 10, INK);
    page.drawText(`ลงนามอิเล็กทรอนิกส์เมื่อ ${formatDateTime(signature.signed_at)}`, { x: x + 4, y: topY - 82, size: 6.2, font, color: MUTED });
  } else {
    page.drawText("สถานะ: ยังไม่ได้ลงนาม", { x: x + 4, y: topY - 63, size: 7.5, font, color: MUTED });
  }
}

function drawFooter(page: PDFPage, font: PDFFont, current: number, total: number, caseNumber: string) {
  page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 0.5, color: BORDER });
  page.drawText(`NT AI Digital Mediation Platform | เคส ${caseNumber}`, { x: MARGIN, y: 27, size: 7, font, color: MUTED });
  page.drawText(`หน้า ${current} / ${total}`, { x: PAGE_WIDTH - MARGIN - 42, y: 27, size: 7, font, color: MUTED });
}

function drawCentered(page: PDFPage, font: PDFFont, text: string, y: number, size: number, color: ReturnType<typeof rgb>) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: Math.max(MARGIN, (PAGE_WIDTH - width) / 2), y, size, font, color });
}

function splitText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const result: string[] = [];
  for (const paragraph of String(text).split(/\r?\n/)) {
    if (!paragraph) {
      result.push("");
      continue;
    }
    const words = paragraph.split(/\s+/).flatMap((word) => splitLongToken(word, font, size, maxWidth));
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) > maxWidth) {
        result.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) result.push(line);
  }
  return result.length ? result : ["-"];
}

function splitLongToken(token: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(token, size) <= maxWidth) return [token];
  const chunks: string[] = [];
  let chunk = "";
  for (const character of Array.from(token)) {
    if (chunk && font.widthOfTextAtSize(chunk + character, size) > maxWidth) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk += character;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

function drawLines(page: PDFPage, lines: string[], x: number, y: number, font: PDFFont, size: number, lineHeight: number, color: ReturnType<typeof rgb>) {
  lines.forEach((line, index) => page.drawText(line || " ", { x, y: y - index * lineHeight, size, font, color }));
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value.includes("T") ? value : `${value}T00:00:00+07:00`).toLocaleDateString("th-TH", { dateStyle: "long", timeZone: "Asia/Bangkok" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
}
