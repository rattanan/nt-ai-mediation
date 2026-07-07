import "server-only";

export type HelpAudience = "debtor" | "creditor" | "mediator" | "admin" | "all";

export type HelpFaq = {
  question: string;
  answer: string;
};

export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  audience: HelpAudience[];
  category: string;
  tags: string[];
  updatedAt: string;
  readingMinutes: number;
  sections: Array<{
    title: string;
    body: string[];
  }>;
  faqs: HelpFaq[];
  relatedSlugs?: string[];
};

export const audienceLabels: Record<HelpAudience, string> = {
  all: "ทุกบทบาท",
  debtor: "ลูกหนี้",
  creditor: "เจ้าหนี้",
  mediator: "ผู้ไกล่เกลี่ย",
  admin: "ผู้ดูแลระบบ",
};

export const helpArticles: HelpArticle[] = [
  {
    slug: "line-ai-chatbot-sanyajai",
    title: "เริ่มต้นปรึกษาปัญหาหนี้กับ LINE AI Chatbot สัญญาใจ",
    summary: "วิธีเพิ่มเพื่อน LINE Official Account เพื่อถามคำถามเบื้องต้นเกี่ยวกับ AI ไกล่เกลี่ยหนี้ เอกสาร และขั้นตอนสมัคร",
    audience: ["all", "debtor"],
    category: "เริ่มต้นใช้งาน",
    tags: ["LINE Chatbot", "สัญญาใจ", "AI ไกล่เกลี่ยหนี้", "Debt Mediation"],
    updatedAt: "2026-07-07",
    readingMinutes: 3,
    sections: [
      {
        title: "สัญญาใจช่วยอะไรได้บ้าง",
        body: [
          "สัญญาใจเป็น AI Chatbot ของ NT AI Digital Mediation Platform สำหรับแนะนำโครงการ ตอบคำถามเกี่ยวกับการไกล่เกลี่ยหนี้ และช่วยเตรียมตัวก่อนส่งคำขอไกล่เกลี่ย",
          "ผู้ใช้งานสามารถถามเรื่องขั้นตอนสมัคร เอกสารที่ต้องใช้ วิธีเลือกผู้ไกล่เกลี่ย และสิ่งที่ควรเตรียมก่อนนัดหมายได้ตลอด 24 ชั่วโมง",
        ],
      },
      {
        title: "วิธีเพิ่มเพื่อน",
        body: [
          "เพิ่มเพื่อนผ่าน LINE ID: @584izmwx หรือกดปุ่มเพิ่มเพื่อนบนหน้าแรกของระบบ",
          "หากใช้งานบนมือถือ สามารถเปิดลิงก์ https://line.me/R/ti/p/%40584izmwx ได้โดยตรง หรือสแกน QR Code จากหน้า Landing Page",
        ],
      },
    ],
    faqs: [
      {
        question: "คุยกับสัญญาใจมีค่าใช้จ่ายไหม",
        answer: "ไม่มีค่าใช้จ่ายสำหรับการพูดคุยกับ AI เบื้องต้นก่อนส่งคำขอไกล่เกลี่ย",
      },
      {
        question: "AI Chatbot ตัดสินคดีหรือแทนผู้ไกล่เกลี่ยได้ไหม",
        answer: "ไม่ได้ AI มีหน้าที่ช่วยแนะนำและอธิบายขั้นตอนเท่านั้น การไกล่เกลี่ยและข้อตกลงต้องดำเนินการผ่านคู่กรณีและผู้ไกล่เกลี่ย",
      },
    ],
    relatedSlugs: ["consent-and-registration", "debtor-case-request-flow"],
  },
  {
    slug: "consent-and-registration",
    title: "การยอมรับเงื่อนไขและเริ่มสมัครใช้งาน",
    summary: "อธิบายหน้า consent การยืนยัน PDPA การใช้ AI และการบันทึกข้อมูลก่อนสมัครสมาชิก",
    audience: ["all", "debtor", "creditor", "mediator"],
    category: "บัญชีผู้ใช้",
    tags: ["Consent", "PDPA", "สมัครสมาชิก", "AI"],
    updatedAt: "2026-07-07",
    readingMinutes: 4,
    sections: [
      {
        title: "ทำไมต้องกดยอมรับเงื่อนไข",
        body: [
          "ระบบต้องให้ผู้ใช้งานรับทราบเงื่อนไขการใช้งาน การประมวลผลข้อมูลส่วนบุคคลตาม PDPA บทบาทของ AI และการจัดเก็บข้อมูลการประชุมเมื่อมีการเปิดใช้งาน",
          "หลังอ่านเนื้อหาจนจบและยืนยันครบทุกข้อ จึงจะสมัครสมาชิกหรือเข้าสู่ portal ตามบทบาทได้",
        ],
      },
      {
        title: "ถ้ากดรับทราบแล้วไม่ไปต่อ",
        body: [
          "ให้ตรวจสอบว่าเลื่อนอ่านเงื่อนไขจนจบแล้ว และเลือก checkbox ครบทุกข้อ",
          "หากยังพบ error ให้ลอง refresh หน้าและเข้าสู่ระบบใหม่ เพราะระบบต้องบันทึก consent ให้ผูกกับบัญชีผู้ใช้งานล่าสุด",
        ],
      },
    ],
    faqs: [
      {
        question: "ต้องยอมรับทุกข้อไหม",
        answer: "ต้องยืนยันครบทุกข้อก่อนดำเนินการต่อ เพราะเป็นเงื่อนไขพื้นฐานของการใช้แพลตฟอร์มไกล่เกลี่ยดิจิทัล",
      },
      {
        question: "ยอมรับแล้วต้องกดซ้ำอีกไหม",
        answer: "โดยปกติไม่ต้องกดซ้ำ เว้นแต่ระบบมีการออก consent version ใหม่หรือบัญชียังไม่ได้บันทึก consent สำเร็จ",
      },
    ],
    relatedSlugs: ["line-ai-chatbot-sanyajai", "debtor-case-request-flow"],
  },
  {
    slug: "debtor-case-request-flow",
    title: "ลูกหนี้สร้างคำขอ เลือกผู้ไกล่เกลี่ย และเลือกเวลานัดหมาย",
    summary: "ขั้นตอนครบตั้งแต่สร้างใบคำขอ ส่งตรวจ เลือกผู้ไกล่เกลี่ย ไปจนถึงเลือกวันเวลาประชุมไกล่เกลี่ย",
    audience: ["debtor"],
    category: "คำขอไกล่เกลี่ย",
    tags: ["ลูกหนี้", "สร้างคำขอ", "เลือกผู้ไกล่เกลี่ย", "นัดหมาย"],
    updatedAt: "2026-07-07",
    readingMinutes: 5,
    sections: [
      {
        title: "ลำดับการทำงาน",
        body: [
          "ลูกหนี้สร้างใบคำขอและกรอกข้อมูลหนี้ รายได้ รายจ่าย ปัญหา และแนวทางที่ต้องการ",
          "หลังตรวจสอบข้อมูลแล้วให้กดส่งคำขอเข้าสู่การตรวจ ระบบจะส่งต่อให้เจ้าหนี้พิจารณาเมื่อผ่านขั้นตอนที่เกี่ยวข้อง",
          "เมื่อเคสเข้าสู่ช่วงเลือกผู้ไกล่เกลี่ย ลูกหนี้เลือกผู้ไกล่เกลี่ยจากรายชื่อที่ระบบแสดง แล้วเลือกวันเวลานัดหมายจาก slot ที่ว่าง",
        ],
      },
      {
        title: "หลังเลือกเวลานัดหมาย",
        body: [
          "ระบบจะบันทึกนัดหมายเป็นสถานะรอยืนยัน และถือว่าลูกหนี้ยืนยันเวลาที่เลือกแล้ว",
          "เจ้าหนี้และผู้ไกล่เกลี่ยต้องกดยืนยันนัดหมาย เมื่อทุกฝ่ายยืนยันครบ ระบบจะเปลี่ยนนัดหมายเป็นยืนยันแล้ว",
        ],
      },
    ],
    faqs: [
      {
        question: "ทำไมยังไม่เห็นปุ่มเลือกเวลานัดหมาย",
        answer: "ปุ่มจะแสดงเมื่อเคสเลือกผู้ไกล่เกลี่ยแล้ว หรือเมื่อมีคำขอเลื่อนนัดที่ต้องเลือกเวลาใหม่",
      },
      {
        question: "เลือกเวลาผิดแก้ได้ไหม",
        answer: "ได้ ให้เปิดรายละเอียดนัดหมายและกดขอเลื่อนนัด ระบบจะให้เลือกเวลานัดหมายใหม่หลังสถานะเปลี่ยนเป็นขอเลื่อนนัด",
      },
    ],
    relatedSlugs: ["appointment-confirmation-and-reschedule", "creditor-offer-discount"],
  },
  {
    slug: "creditor-offer-discount",
    title: "เจ้าหนี้รับคำขอ ใส่ส่วนลด และส่งข้อเสนอ",
    summary: "วิธีพิจารณาคำขอไกล่เกลี่ย ใส่ส่วนลดที่เสนอ ยอดข้อตกลงหลังส่วนลด และยอดชำระต่อเดือน",
    audience: ["creditor", "admin"],
    category: "เจ้าหนี้",
    tags: ["เจ้าหนี้", "ส่วนลด", "ข้อเสนอ", "settlement"],
    updatedAt: "2026-07-07",
    readingMinutes: 4,
    sections: [
      {
        title: "ข้อมูลที่เจ้าหนี้กรอกได้",
        body: [
          "ในหน้าเคส เจ้าหนี้สามารถกรอกหมายเหตุ เงื่อนไขข้อเสนอ ส่วนลดที่เสนอ ยอดข้อตกลงหลังส่วนลด และยอดชำระต่อเดือน",
          "ระบบจะบันทึกส่วนลดรวมไว้ในรายละเอียดข้อเสนอ และบันทึกยอดข้อตกลง/ยอดผ่อนชำระไว้ในประวัติการตอบกลับของเจ้าหนี้",
        ],
      },
      {
        title: "ผลของการกดรับคำขอ",
        body: [
          "เมื่อเจ้าหนี้กดรับคำขอ สถานะเคสจะเข้าสู่ขั้นตอนที่ลูกหนี้สามารถเลือกผู้ไกล่เกลี่ยได้",
          "ข้อเสนอที่บันทึกไว้จะช่วยให้ผู้ไกล่เกลี่ยและคู่กรณีเห็นกรอบการพูดคุยก่อนประชุม",
        ],
      },
    ],
    faqs: [
      {
        question: "ต้องกรอกส่วนลดเสมอไหม",
        answer: "ไม่จำเป็น หากยังไม่มีข้อเสนอส่วนลด สามารถเว้นว่างและกรอกเฉพาะหมายเหตุหรือเงื่อนไขได้",
      },
      {
        question: "ยอดข้อตกลงหลังส่วนลดคืออะไร",
        answer: "คือยอดที่เจ้าหนี้เสนอให้ใช้เป็นฐานการไกล่เกลี่ยหรือแผนชำระ หลังหักส่วนลดที่เสนอแล้ว",
      },
    ],
    relatedSlugs: ["debtor-case-request-flow", "appointment-confirmation-and-reschedule"],
  },
  {
    slug: "appointment-confirmation-and-reschedule",
    title: "การยืนยันนัดหมายและการเลื่อนนัดทุกบทบาท",
    summary: "วิธีที่ลูกหนี้ เจ้าหนี้ ผู้ไกล่เกลี่ย และ admin ใช้ยืนยันหรือขอเลื่อนนัดหมาย",
    audience: ["all", "debtor", "creditor", "mediator", "admin"],
    category: "นัดหมาย",
    tags: ["นัดหมาย", "เลื่อนนัด", "Meeting URL", "ยืนยันนัด"],
    updatedAt: "2026-07-07",
    readingMinutes: 6,
    sections: [
      {
        title: "ใครต้องยืนยันนัดหมาย",
        body: [
          "หลังลูกหนี้เลือกวันเวลา ระบบจะถือว่าลูกหนี้ยืนยันเวลานั้นแล้ว และรอเจ้าหนี้กับผู้ไกล่เกลี่ยกดยืนยัน",
          "เมื่อครบทั้งลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ย ระบบจะเปลี่ยนนัดหมายเป็นยืนยันแล้ว และแสดงลิงก์ประชุมเมื่อมีการกรอกไว้",
        ],
      },
      {
        title: "ใครขอเลื่อนนัดได้บ้าง",
        body: [
          "ลูกหนี้ เจ้าหนี้ ผู้ไกล่เกลี่ย และ admin สามารถขอเลื่อนนัดได้ก่อนนัดหมายถูกปิดเป็นเสร็จสิ้นหรือยกเลิก",
          "เมื่อมีผู้ขอเลื่อน ระบบจะ reset การยืนยันของทุกฝ่าย และเปลี่ยนสถานะนัดหมายเป็นขอเลื่อนนัด เพื่อให้ลูกหนี้เลือกเวลาใหม่และทุกฝ่ายยืนยันใหม่อีกครั้ง",
        ],
      },
      {
        title: "Meeting URL",
        body: [
          "ผู้ไกล่เกลี่ยสามารถกรอกหรือแก้ไข Meeting URL จากหน้ารายละเอียดนัดหมายของผู้ไกล่เกลี่ย",
          "Admin สามารถช่วยอัปเดต Meeting URL จากเมนู Appointments ได้ หากต้องแก้ไขแทนผู้ไกล่เกลี่ย",
        ],
      },
    ],
    faqs: [
      {
        question: "หลังขอเลื่อนนัดต้องทำอะไรต่อ",
        answer: "ลูกหนี้ต้องเลือกเวลานัดหมายใหม่ จากนั้นเจ้าหนี้และผู้ไกล่เกลี่ยต้องยืนยันนัดหมายใหม่อีกครั้ง",
      },
      {
        question: "เจ้าหนี้หรือผู้ไกล่เกลี่ยเลือกเวลาใหม่เองได้ไหม",
        answer: "ตอนนี้ flow หลักให้ลูกหนี้เป็นผู้เลือก slot ใหม่จากเวลาว่างของผู้ไกล่เกลี่ย เพื่อให้ข้อมูลตรงกับ case portal ของลูกหนี้",
      },
    ],
    relatedSlugs: ["debtor-case-request-flow", "mediator-meeting-and-settlement"],
  },
  {
    slug: "mediator-meeting-and-settlement",
    title: "ผู้ไกล่เกลี่ยบันทึกผลประชุม จัดทำแผนชำระ และส่งเอกสารลงนาม",
    summary: "ขั้นตอนหลังประชุมเสร็จ ตั้งแต่สรุปผลไกล่เกลี่ย แผนชำระหนี้ จนถึงเอกสารบันทึกตกลงข้อพิพาท",
    audience: ["mediator", "admin"],
    category: "ผู้ไกล่เกลี่ย",
    tags: ["ผู้ไกล่เกลี่ย", "ปิดเคส", "แผนชำระ", "บันทึกตกลงข้อพิพาท"],
    updatedAt: "2026-07-07",
    readingMinutes: 6,
    sections: [
      {
        title: "หลังประชุมเสร็จต้องทำอะไร",
        body: [
          "ผู้ไกล่เกลี่ยเปิดรายละเอียดนัดหมายและบันทึกสถานะเป็นเสร็จสิ้น จากนั้นกดปิดเคสและสร้างเอกสาร",
          "ในหน้าปิดเคส ผู้ไกล่เกลี่ยกรอกผลการไกล่เกลี่ย สรุปข้อตกลง ยอดหนี้เดิม ยอดตกลง และข้อมูลแผนการชำระ เช่น เงินดาวน์ จำนวนงวด วันครบกำหนดงวดแรก และเงื่อนไขพิเศษ",
        ],
      },
      {
        title: "เอกสารที่ระบบสร้าง",
        body: [
          "ถ้าไกล่เกลี่ยสำเร็จ ระบบจะสร้างบันทึกข้อตกลงระงับข้อพิพาทพร้อมพื้นที่ลงนามของลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ย",
          "หลังสร้างเอกสาร ผู้ไกล่เกลี่ยจะเห็นปุ่มเปิดเอกสารเพื่อลงนาม และปุ่มดาวน์โหลด PDF บันทึกข้อตกลง",
        ],
      },
    ],
    faqs: [
      {
        question: "ถ้าไกล่เกลี่ยไม่สำเร็จต้องกรอกแผนชำระไหม",
        answer: "ไม่ต้องกรอกแผนชำระ ให้ระบุเหตุผลที่ไกล่เกลี่ยไม่สำเร็จและหมายเหตุผู้ไกล่เกลี่ยแทน",
      },
      {
        question: "ผู้ไกล่เกลี่ยต้องเซ็นเอกสารด้วยไหม",
        answer: "ต้องเซ็นร่วมกับลูกหนี้และเจ้าหนี้ เพื่อให้เอกสาร settlement สมบูรณ์ครบสามฝ่าย",
      },
    ],
    relatedSlugs: ["settlement-signature-and-pdf", "appointment-confirmation-and-reschedule"],
  },
  {
    slug: "settlement-signature-and-pdf",
    title: "การลงนามบันทึกตกลงข้อพิพาทและดาวน์โหลด PDF พร้อมลายเซ็น",
    summary: "วิธีเปิดเอกสาร settlement ให้ลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ยลงนามครบ ก่อนดาวน์โหลด PDF และปิดเคส",
    audience: ["all", "debtor", "creditor", "mediator", "admin"],
    category: "เอกสาร",
    tags: ["ลายเซ็น", "PDF", "บันทึกตกลงข้อพิพาท", "ปิดเคส"],
    updatedAt: "2026-07-07",
    readingMinutes: 5,
    sections: [
      {
        title: "ใครลงนามได้บ้าง",
        body: [
          "ลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ยแต่ละฝ่ายจะเห็นช่องลงนามของตนเองเมื่อเปิดหน้าเอกสาร settlement",
          "ระบบตรวจสิทธิ์จากบทบาทผู้ใช้งานและความเกี่ยวข้องกับเคสนั้น เพื่อป้องกันไม่ให้บุคคลอื่นลงนามแทน",
        ],
      },
      {
        title: "เมื่อเซ็นครบแล้วเกิดอะไรขึ้น",
        body: [
          "เมื่อทั้งสามฝ่ายลงนามครบ ระบบจะแสดงสถานะลงนามครบถ้วน และอัปเดตเคสเป็นปิดเคสโดยอัตโนมัติ",
          "ผู้ใช้งานสามารถดาวน์โหลดบันทึกตกลงข้อพิพาทพร้อมลายเซ็นจากปุ่มดาวน์โหลดบนหน้าเอกสาร",
        ],
      },
      {
        title: "PDF ภาษาไทย",
        body: [
          "PDF settlement ใช้ font ที่รองรับภาษาไทย เพื่อให้เนื้อหาและลายเซ็นภาษาไทยแสดงผลถูกต้อง",
          "หากเอกสารตกขอบหรือข้อมูลยาวผิดปกติ ให้แจ้ง admin พร้อมเลขเคสและ document id เพื่อแก้รูปแบบเอกสาร",
        ],
      },
    ],
    faqs: [
      {
        question: "กดดาวน์โหลดแล้วได้ใบรับรองแทน settlement ไหม",
        answer: "ปุ่มดาวน์โหลดบนหน้า settlement จะดาวน์โหลดบันทึกตกลงข้อพิพาทพร้อมลายเซ็น ไม่ใช่ใบรับรอง completion certificate",
      },
      {
        question: "เคสปิดเมื่อไหร่",
        answer: "สำหรับเคสไกล่เกลี่ยสำเร็จ ระบบจะปิดเคสเมื่อบันทึกตกลงข้อพิพาทถูกลงนามครบทั้งลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ย",
      },
    ],
    relatedSlugs: ["mediator-meeting-and-settlement", "admin-operations-faq"],
  },
  {
    slug: "admin-operations-faq",
    title: "FAQ สำหรับ Admin: เมนู ระบบนัดหมาย เอกสาร และเวอร์ชัน",
    summary: "คำถามที่ผู้ดูแลระบบพบบ่อยจากงาน admin dashboard, appointment, billing, user และ version/footer",
    audience: ["admin"],
    category: "ผู้ดูแลระบบ",
    tags: ["Admin", "Appointments", "Billing", "Version", "Footer"],
    updatedAt: "2026-07-07",
    readingMinutes: 5,
    sections: [
      {
        title: "เมนู admin สำคัญ",
        body: [
          "เมนูย่อย Users, Appointments และ Billing ควรแสดงใน admin navigation เพื่อให้ผู้ดูแลจัดการผู้ใช้ นัดหมาย และใบแจ้งหนี้ได้ครบ",
          "หากเมนูหาย ให้ตรวจ active sidebar/mobile navigation และตรวจว่าไม่ได้ถูกซ่อนจาก responsive layout",
        ],
      },
      {
        title: "เวอร์ชันและ footer",
        body: [
          "Footer แสดง All rights reserved @ 2026 และ version ล่าสุดจาก package.json",
          "หากต้องการปรับ version ให้แก้ field version ใน package.json แล้ว build/deploy ใหม่",
        ],
      },
      {
        title: "งานนัดหมายที่ admin ช่วยได้",
        body: [
          "Admin สามารถอัปเดต Meeting URL ขอเลื่อนนัด หรือยกเลิกนัดหมายจากหน้า Appointments",
          "เมื่อ admin ขอเลื่อนนัด ระบบจะ reset การยืนยันทุกฝ่ายและเพิ่ม admin เป็นผู้ขอเลื่อนใน participant history",
        ],
      },
    ],
    faqs: [
      {
        question: "Admin ปิดเคสแทนได้ไหม",
        answer: "Admin จัดการสถานะบางกรณีได้ แต่เคส settlement ที่สำเร็จควรปิดอัตโนมัติหลังเอกสารลงนามครบ เพื่อรักษาหลักฐานการยินยอมของคู่กรณี",
      },
      {
        question: "ถ้า PDF ดาวน์โหลด error ต้องดูอะไร",
        answer: "ตรวจ document id, route /documents/settlements/[documentId]/pdf, font ภาษาไทย และสิทธิ์ของข้อมูล settlement document/signature",
      },
    ],
    relatedSlugs: ["appointment-confirmation-and-reschedule", "settlement-signature-and-pdf"],
  },
];

export const releaseNotes = [
  {
    version: "0.1.1",
    date: "2026-07-07",
    title: "ปรับปรุง flow นัดหมาย เอกสาร settlement และ LINE Chatbot",
    items: [
      "เพิ่ม LINE AI Chatbot สัญญาใจบน Landing Page",
      "แก้ consent fallback สำหรับการบันทึกความยินยอม",
      "เพิ่มการขอเลื่อนนัดจากลูกหนี้ และ reset การยืนยันเมื่อมีการเลื่อนนัดจากทุกบทบาท",
      "เพิ่มช่องส่วนลดที่เสนอสำหรับเจ้าหนี้",
      "ปรับ settlement signing ให้ปิดเคสอัตโนมัติเมื่อลงนามครบสามฝ่าย",
    ],
  },
];

export function getHelpArticle(slug: string) {
  return helpArticles.find((article) => article.slug === slug) ?? null;
}

export function listHelpArticles(filters?: { audience?: HelpAudience | ""; query?: string }) {
  const query = filters?.query?.trim().toLowerCase() ?? "";
  return helpArticles.filter((article) => {
    const audienceMatch = !filters?.audience || article.audience.includes(filters.audience) || article.audience.includes("all");
    const searchTarget = [
      article.title,
      article.summary,
      article.category,
      article.tags.join(" "),
      article.sections.map((section) => `${section.title} ${section.body.join(" ")}`).join(" "),
      article.faqs.map((faq) => `${faq.question} ${faq.answer}`).join(" "),
    ].join(" ").toLowerCase();
    const queryMatch = !query || searchTarget.includes(query);
    return audienceMatch && queryMatch;
  });
}

export function getRelatedArticles(article: HelpArticle) {
  return (article.relatedSlugs ?? [])
    .map((slug) => getHelpArticle(slug))
    .filter((item): item is HelpArticle => Boolean(item));
}
