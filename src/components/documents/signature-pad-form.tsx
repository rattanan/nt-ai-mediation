"use client";

import { useRef, useState, type PointerEvent } from "react";
import { signSettlementDocument } from "@/app/documents/settlements/[documentId]/actions";

export function SignaturePadForm({
  documentId,
  caseId,
  signerRole,
  signerName,
}: {
  documentId: string;
  caseId: string;
  signerRole: "debtor" | "creditor" | "mediator";
  signerName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const movedRef = useRef(false);
  const [signatureData, setSignatureData] = useState("");

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.setPointerCapture(event.pointerId);
    const current = point(event);
    context.beginPath();
    context.moveTo(current.x, current.y);
    context.strokeStyle = "#111827";
    context.lineWidth = 12;
    context.lineCap = "round";
    context.lineJoin = "round";
    drawingRef.current = true;
    movedRef.current = false;
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    event.preventDefault();
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const current = point(event);
    context.lineTo(current.x, current.y);
    context.stroke();
    movedRef.current = true;
  }

  function finish(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = event.currentTarget;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    drawingRef.current = false;
    if (movedRef.current) setSignatureData(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    drawingRef.current = false;
    movedRef.current = false;
    setSignatureData("");
  }

  return (
    <form action={signSettlementDocument} className="space-y-3">
      <input type="hidden" name="document_id" value={documentId} />
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="signer_role" value={signerRole} />
      <input type="hidden" name="signature_image_data" value={signatureData} />
      <label className="block">
        <span className="text-sm font-medium">ชื่อผู้ลงนาม</span>
        <input name="signer_name" defaultValue={signerName} required className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
      </label>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">วาดลายเซ็น</p>
          <button type="button" onClick={clear} className="text-xs font-semibold text-[#8A6500] hover:underline">ล้างลายเซ็น</button>
        </div>
        <canvas
          ref={canvasRef}
          width={900}
          height={260}
          aria-label="ช่องวาดลายเซ็น"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
          className="mt-2 h-36 w-full touch-none rounded-lg border-2 border-dashed border-[#9CA3AF] bg-white"
        />
        <p className="mt-1 text-xs text-[#6B7280]">ใช้เมาส์ นิ้วมือ หรือปากกาลากลงชื่อภายในกรอบ</p>
      </div>
      <button type="submit" disabled={!signatureData} className="h-11 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
        ยืนยันและลงนามเอกสาร
      </button>
    </form>
  );
}
