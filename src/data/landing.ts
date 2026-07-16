import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Check,
  CircleCheckBig,
  FileCheck,
  FileSignature,
  FileText,
  Gavel,
  HandCoins,
  KeyRound,
  Landmark,
  Lock,
  MessageSquareText,
  MessagesSquare,
  PenTool,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Upload,
  UserPlus,
  Video,
} from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
};

export type IconTextItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type BenefitGroup = {
  icon: LucideIcon;
  audience: string;
  highlighted?: boolean;
  points: string[];
};

export type Stat = {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

export type FooterColumn = {
  heading: string;
  links: NavLink[];
};

export type DashboardPlaceholder = {
  title: string;
  description: string;
  role: string;
};

export type Language = "th" | "en";

export type LandingContent = {
  headerNavLinks: NavLink[];
  brandLabel: string;
  signInLabel: string;
  startLabel: string;
  hero: {
    badge: string;
    titlePrefix: string;
    titleHighlight: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    demoCta: string;
    demoModalTitle: string;
    demoModalCloseLabel: string;
    trustNote: string;
    imageAlt: string;
    floatingTitle: string;
    floatingDescription: string;
  };
  trustBar: {
    label: string;
    partners: string[];
  };
  features: {
    eyebrow: string;
    title: string;
    description: string;
    items: IconTextItem[];
  };
  timeline: {
    eyebrow: string;
    title: string;
    description: string;
    items: IconTextItem[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    description: string;
    groups: BenefitGroup[];
  };
  stats: Stat[];
  security: {
    eyebrow: string;
    title: string;
    description: string;
    auditNote: string;
    items: IconTextItem[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Testimonial[];
  };
  cta: {
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  footer: {
    logoLabel: string;
    description: string;
    columns: FooterColumn[];
    rights: string;
    tagline: string;
  };
};

export const headerNavLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "Security", href: "#security" },
];

export const trustPartners = [
  "Ministry of Justice",
  "National Bank",
  "Legal Aid Office",
  "Consumer Council",
  "Enterprise Credit Co.",
];

export const platformFeatures: IconTextItem[] = [
  {
    icon: MessagesSquare,
    title: "AI Interview",
    description:
      "A guided AI conversation gathers case details, financial context, and goals - in minutes, not meetings.",
  },
  {
    icon: Sparkles,
    title: "Smart Case Matching",
    description:
      "Our AI pairs each case with the best certified mediator based on expertise, workload, and outcomes.",
  },
  {
    icon: Video,
    title: "Video Mediation",
    description:
      "Secure, built-in video rooms let all parties meet, negotiate, and reach agreement remotely.",
  },
  {
    icon: FileText,
    title: "Document Generation",
    description:
      "Auto-generate compliant case documents, disclosures, and repayment schedules from your data.",
  },
  {
    icon: PenTool,
    title: "Digital Signature",
    description:
      "Legally binding e-signatures let every party sign settlements from any device, instantly.",
  },
  {
    icon: FileCheck,
    title: "Settlement Agreement",
    description:
      "Generate enforceable settlement agreements with a clear audit trail and archived records.",
  },
];

export const mediationSteps: IconTextItem[] = [
  {
    icon: UserPlus,
    title: "Register",
    description: "Create a secure account as a debtor, creditor, or mediator.",
  },
  {
    icon: MessageSquareText,
    title: "AI Interview",
    description: "Answer a guided AI conversation to capture your case.",
  },
  {
    icon: Upload,
    title: "Upload Documents",
    description: "Securely submit contracts, statements, and evidence.",
  },
  {
    icon: Sparkles,
    title: "AI Match Mediator",
    description: "Get paired with the ideal certified mediator instantly.",
  },
  {
    icon: CalendarClock,
    title: "Schedule Meeting",
    description: "Book a session that works for every party.",
  },
  {
    icon: Video,
    title: "Online Mediation",
    description: "Negotiate together in a secure video mediation room.",
  },
  {
    icon: FileSignature,
    title: "Settlement Agreement",
    description: "Sign an enforceable agreement with digital signatures.",
  },
  {
    icon: CircleCheckBig,
    title: "Case Closed",
    description: "Receive archived records and a full audit trail.",
  },
];

export const benefitGroups: BenefitGroup[] = [
  {
    icon: HandCoins,
    audience: "For Debtors",
    points: [
      "Reduce your debt burden",
      "Flexible repayment plans",
      "No court appearances",
      "Fast, transparent process",
    ],
  },
  {
    icon: Landmark,
    audience: "For Creditors",
    highlighted: true,
    points: [
      "Higher recovery rate",
      "Lower legal costs",
      "AI-based case prioritization",
      "Faster resolutions at scale",
    ],
  },
  {
    icon: Gavel,
    audience: "For Mediators",
    points: [
      "Powerful case management",
      "Built-in AI assistant",
      "Smart scheduling tools",
      "Performance analytics",
    ],
  },
];

export const benefitCheckIcon = Check;

export const landingStats: Stat[] = [
  { value: 48000, suffix: "+", label: "Cases mediated" },
  { value: 92, suffix: "%", label: "Success rate" },
  { value: 14, suffix: " days", label: "Avg. resolution time" },
  { value: 120000, suffix: "+", label: "Satisfied users" },
];

export const securityItems: IconTextItem[] = [
  {
    icon: ShieldCheck,
    title: "PDPA Compliant",
    description:
      "Fully aligned with the Personal Data Protection Act to safeguard every party.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "All documents and conversations are encrypted in transit and at rest.",
  },
  {
    icon: ScrollText,
    title: "Audit Logs",
    description:
      "Every action is recorded, giving you a complete and tamper-evident trail.",
  },
  {
    icon: KeyRound,
    title: "Secure Authentication",
    description:
      "Multi-factor authentication and role-based access protect every account.",
  },
];

export const auditedTrustIcon = ShieldCheck;

export const testimonials: Testimonial[] = [
  {
    quote:
      "We cut our average recovery time in half and dramatically reduced legal spend. The AI prioritization is a game changer for our portfolio.",
    name: "Suchada P.",
    role: "Head of Collections, National Bank",
    initials: "SP",
  },
  {
    quote:
      "I finally reached a repayment plan I could actually afford - without ever stepping into a courtroom. The process felt fair and fast.",
    name: "Anucha T.",
    role: "Debtor",
    initials: "AT",
  },
  {
    quote:
      "The mediator dashboard and AI assistant let me handle three times the caseload while keeping every party well informed.",
    name: "Kanya R.",
    role: "Certified Mediator",
    initials: "KR",
  },
];

export const footerColumns: FooterColumn[] = [
  {
    heading: "Platform",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Security", href: "#security" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Newsroom", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Accessibility", href: "#" },
      { label: "PDPA", href: "#" },
    ],
  },
];

export const dashboardPlaceholders: Record<string, DashboardPlaceholder> = {
  debtor: {
    title: "Debtor Dashboard",
    role: "Debtor",
    description:
      "A future workspace for case intake, AI interview progress, repayment options, appointments, and settlement tracking.",
  },
  mediator: {
    title: "Mediator Dashboard",
    role: "Mediator",
    description:
      "A future workspace for assigned cases, AI summaries, session scheduling, notes, outcomes, and audit history.",
  },
  creditor: {
    title: "Creditor Dashboard",
    role: "Creditor",
    description:
      "A future workspace for portfolio views, case prioritization, offers, recovery analytics, and settlement status.",
  },
  admin: {
    title: "Admin Dashboard",
    role: "Admin",
    description:
      "A future workspace for user governance, role-based access, mediation metrics, compliance, and platform operations.",
  },
};

const thaiHeaderNavLinks: NavLink[] = [
  { label: "ฟีเจอร์", href: "#features" },
  { label: "ขั้นตอน", href: "#how-it-works" },
  { label: "ประโยชน์", href: "#benefits" },
  { label: "ความปลอดภัย", href: "#security" },
];

const thaiTrustPartners = [
  "กระทรวงยุติธรรม",
  "ธนาคารแห่งชาติ",
  "สำนักงานช่วยเหลือประชาชน",
  "สภาองค์กรของผู้บริโภค",
  "องค์กรเจ้าหนี้ระดับ enterprise",
];

const thaiPlatformFeatures: IconTextItem[] = [
  {
    icon: MessagesSquare,
    title: "สัมภาษณ์ด้วย AI",
    description:
      "บทสนทนา AI แบบมีโครงสร้างช่วยเก็บรายละเอียดคดี บริบททางการเงิน และเป้าหมายของคู่กรณีได้รวดเร็ว",
  },
  {
    icon: Sparkles,
    title: "จับคู่คดีอย่างชาญฉลาด",
    description:
      "ระบบช่วยจับคู่คดีกับผู้ไกล่เกลี่ยที่เหมาะสมจากความเชี่ยวชาญ ภาระงาน และผลลัพธ์ที่ผ่านมา",
  },
  {
    icon: Video,
    title: "ไกล่เกลี่ยผ่านวิดีโอ",
    description:
      "ห้องประชุมออนไลน์ที่ปลอดภัย ช่วยให้ทุกฝ่ายเจรจาและหาข้อตกลงร่วมกันได้จากทุกที่",
  },
  {
    icon: FileText,
    title: "สร้างเอกสารอัตโนมัติ",
    description:
      "สร้างเอกสารคดี หนังสือชี้แจง และแผนชำระหนี้จากข้อมูลที่เกี่ยวข้องอย่างเป็นระบบ",
  },
  {
    icon: PenTool,
    title: "ลายเซ็นดิจิทัล",
    description:
      "รองรับการลงนามข้อตกลงจากทุกอุปกรณ์ ลดขั้นตอนเอกสารและเร่งการปิดคดี",
  },
  {
    icon: FileCheck,
    title: "ข้อตกลงไกล่เกลี่ย",
    description:
      "จัดทำข้อตกลงที่ตรวจสอบย้อนหลังได้ พร้อมบันทึกประวัติและหลักฐานประกอบครบถ้วน",
  },
];

const thaiMediationSteps: IconTextItem[] = [
  { icon: UserPlus, title: "ลงทะเบียน", description: "สร้างบัญชีอย่างปลอดภัยตามบทบาทลูกหนี้ เจ้าหนี้ หรือผู้ไกล่เกลี่ย" },
  { icon: MessageSquareText, title: "สัมภาษณ์ด้วย AI", description: "ตอบคำถามนำทางเพื่อเก็บข้อมูลคดีและข้อเท็จจริงสำคัญ" },
  { icon: Upload, title: "อัปโหลดเอกสาร", description: "ส่งสัญญา รายการเดินบัญชี และหลักฐานที่เกี่ยวข้องอย่างปลอดภัย" },
  { icon: Sparkles, title: "จับคู่ผู้ไกล่เกลี่ย", description: "ระบบช่วยเสนอผู้ไกล่เกลี่ยที่เหมาะสมกับลักษณะคดี" },
  { icon: CalendarClock, title: "นัดหมายประชุม", description: "เลือกช่วงเวลาที่เหมาะสมกับทุกฝ่าย" },
  { icon: Video, title: "ไกล่เกลี่ยออนไลน์", description: "เจรจาร่วมกันในห้องประชุมดิจิทัลที่ปลอดภัย" },
  { icon: FileSignature, title: "ทำข้อตกลง", description: "ลงนามข้อตกลงด้วยลายเซ็นดิจิทัล" },
  { icon: CircleCheckBig, title: "ปิดคดี", description: "รับเอกสารสรุปและประวัติการดำเนินการที่ตรวจสอบได้" },
];

const thaiBenefitGroups: BenefitGroup[] = [
  {
    icon: HandCoins,
    audience: "สำหรับลูกหนี้",
    points: ["ลดภาระหนี้", "แผนชำระหนี้ที่ยืดหยุ่น", "ไม่ต้องขึ้นศาล", "กระบวนการรวดเร็วและโปร่งใส"],
  },
  {
    icon: Landmark,
    audience: "สำหรับเจ้าหนี้",
    highlighted: true,
    points: ["เพิ่มโอกาสการชำระคืน", "ลดค่าใช้จ่ายทางกฎหมาย", "จัดลำดับคดีด้วย AI", "ปิดคดีได้เร็วขึ้นในระดับพอร์ต"],
  },
  {
    icon: Gavel,
    audience: "สำหรับผู้ไกล่เกลี่ย",
    points: ["จัดการคดีได้เป็นระบบ", "มีผู้ช่วย AI", "เครื่องมือนัดหมายอัจฉริยะ", "วิเคราะห์ผลการทำงาน"],
  },
];

const thaiStats: Stat[] = [
  { value: 48000, suffix: "+", label: "คดีที่ผ่านการไกล่เกลี่ย" },
  { value: 92, suffix: "%", label: "อัตราสำเร็จ" },
  { value: 14, suffix: " วัน", label: "เวลาเฉลี่ยในการปิดคดี" },
  { value: 120000, suffix: "+", label: "ผู้ใช้งานที่พึงพอใจ" },
];

const thaiSecurityItems: IconTextItem[] = [
  {
    icon: ShieldCheck,
    title: "คำนึงถึง PDPA",
    description: "ออกแบบให้สอดคล้องกับหลักการคุ้มครองข้อมูลส่วนบุคคลของทุกฝ่าย",
  },
  {
    icon: Lock,
    title: "เข้ารหัสข้อมูล",
    description: "เอกสารและการสื่อสารถูกเข้ารหัสทั้งระหว่างส่งและขณะจัดเก็บ",
  },
  {
    icon: ScrollText,
    title: "บันทึกการตรวจสอบ",
    description: "ทุกกิจกรรมสำคัญถูกบันทึกเป็น audit trail ที่ตรวจสอบย้อนหลังได้",
  },
  {
    icon: KeyRound,
    title: "ยืนยันตัวตนปลอดภัย",
    description: "เตรียมรองรับการยืนยันตัวตนหลายชั้นและสิทธิ์การเข้าถึงตามบทบาท",
  },
];

const thaiTestimonials: Testimonial[] = [
  {
    quote:
      "เราลดเวลาในการติดตามหนี้ลงได้มาก และลดค่าใช้จ่ายทางกฎหมายอย่างชัดเจน ระบบจัดลำดับคดีด้วย AI ช่วยงานได้จริง",
    name: "สุชาดา พ.",
    role: "หัวหน้าฝ่ายติดตามหนี้ ธนาคารแห่งชาติ",
    initials: "SP",
  },
  {
    quote:
      "ผมได้แผนชำระหนี้ที่จ่ายไหว โดยไม่ต้องไปศาล กระบวนการยุติธรรมและรวดเร็วกว่าที่คิด",
    name: "อนุชา ต.",
    role: "ลูกหนี้",
    initials: "AT",
  },
  {
    quote:
      "แดชบอร์ดผู้ไกล่เกลี่ยและผู้ช่วย AI ทำให้รับคดีได้มากขึ้น โดยยังสื่อสารกับทุกฝ่ายได้ครบถ้วน",
    name: "กัญญา ร.",
    role: "ผู้ไกล่เกลี่ย",
    initials: "KR",
  },
];

const thaiFooterColumns: FooterColumn[] = [
  {
    heading: "แพลตฟอร์ม",
    links: [
      { label: "ฟีเจอร์", href: "#features" },
      { label: "ขั้นตอน", href: "#how-it-works" },
      { label: "ความปลอดภัย", href: "#security" },
      { label: "ราคา", href: "#" },
    ],
  },
  {
    heading: "องค์กร",
    links: [
      { label: "เกี่ยวกับเรา", href: "#" },
      { label: "ติดต่อ", href: "#" },
      { label: "ร่วมงาน", href: "#" },
      { label: "ข่าวสาร", href: "#" },
    ],
  },
  {
    heading: "กฎหมาย",
    links: [
      { label: "ความเป็นส่วนตัว", href: "#" },
      { label: "เงื่อนไข", href: "#" },
      { label: "การเข้าถึง", href: "#" },
      { label: "PDPA", href: "#" },
    ],
  },
];

export const landingContent: Record<Language, LandingContent> = {
  en: {
    headerNavLinks,
    brandLabel: "AI Mediation",
    signInLabel: "Sign in",
    startLabel: "Start Mediation",
    hero: {
      badge: "AI-assisted resolution, PDPA-compliant",
      titlePrefix: "AI-Powered Digital",
      titleHighlight: "Mediation Platform",
      description:
        "Resolve debt disputes faster with AI-assisted mediation. Connect debtors, creditors, and certified mediators to reach fair settlements - without going to court.",
      primaryCta: "Start Mediation",
      secondaryCta: "Find a Mediator",
      demoCta: "Watch Demo",
      demoModalTitle: "AI Mediation Platform Demo",
      demoModalCloseLabel: "Close demo video",
      trustNote: "Trusted by government agencies and enterprise creditors",
      imageAlt: "AI assistant mediating a conversation between a debtor and a certified mediator",
      floatingTitle: "Settlement reached",
      floatingDescription: "Signed digitally in 12 days",
    },
    trustBar: {
      label: "Trusted by leading agencies and financial institutions",
      partners: trustPartners,
    },
    features: {
      eyebrow: "Platform features",
      title: "Everything you need to resolve disputes",
      description:
        "A complete, AI-assisted workflow from first contact to a signed, enforceable settlement.",
      items: platformFeatures,
    },
    timeline: {
      eyebrow: "How it works",
      title: "From dispute to settlement in eight steps",
      description: "A clear, guided journey that keeps everyone aligned at every stage.",
      items: mediationSteps,
    },
    benefits: {
      eyebrow: "Benefits",
      title: "Built for every party at the table",
      description:
        "A fairer, faster outcome for debtors, creditors, and the mediators who bring them together.",
      groups: benefitGroups,
    },
    stats: landingStats,
    security: {
      eyebrow: "Security & compliance",
      title: "Enterprise-grade trust, built in",
      description:
        "Security is at the core of every mediation. We meet the standards expected by government agencies and enterprise creditors.",
      auditNote: "Independently audited & PDPA-certified infrastructure",
      items: securityItems,
    },
    testimonials: {
      eyebrow: "Testimonials",
      title: "Outcomes people trust",
      items: testimonials,
    },
    cta: {
      title: "Start your digital mediation today",
      description:
        "Join thousands resolving debt disputes faster, fairer, and without the courtroom.",
      primaryCta: "Start Mediation",
      secondaryCta: "Find a Mediator",
    },
    footer: {
      logoLabel: "Mediation",
      description:
        "AI-powered digital mediation, helping resolve debt disputes quickly, fairly, and securely - without going to court.",
      columns: footerColumns,
      rights: "NT AI Digital Mediation Platform. All rights reserved @ 2026",
      tagline: "Made for a fairer resolution.",
    },
  },
  th: {
    headerNavLinks: thaiHeaderNavLinks,
    brandLabel: "AI ไกล่เกลี่ย",
    signInLabel: "เข้าสู่ระบบ",
    startLabel: "เริ่มไกล่เกลี่ย",
    hero: {
      badge: "ไกล่เกลี่ยด้วย AI พร้อมคำนึงถึง PDPA",
      titlePrefix: "แพลตฟอร์มไกล่เกลี่ยดิจิทัล",
      titleHighlight: "ขับเคลื่อนด้วย AI",
      description:
        "ยุติข้อพิพาทด้านหนี้ได้เร็วขึ้นด้วย AI เชื่อมต่อลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ยที่ได้รับการรับรอง เพื่อหาข้อตกลงที่เป็นธรรมโดยไม่ต้องขึ้นศาล",
      primaryCta: "เริ่มไกล่เกลี่ย",
      secondaryCta: "ค้นหาผู้ไกล่เกลี่ย",
      demoCta: "ดูตัวอย่าง",
      demoModalTitle: "วิดีโอตัวอย่างแพลตฟอร์ม AI ไกล่เกลี่ย",
      demoModalCloseLabel: "ปิดวิดีโอตัวอย่าง",
      trustNote: "ได้รับความไว้วางใจจากหน่วยงานรัฐและองค์กรเจ้าหนี้ระดับ enterprise",
      imageAlt: "ผู้ช่วย AI กำลังสนับสนุนการไกล่เกลี่ยระหว่างลูกหนี้และผู้ไกล่เกลี่ย",
      floatingTitle: "บรรลุข้อตกลงแล้ว",
      floatingDescription: "ลงนามดิจิทัลภายใน 12 วัน",
    },
    trustBar: {
      label: "ได้รับความไว้วางใจจากหน่วยงานและสถาบันการเงินชั้นนำ",
      partners: thaiTrustPartners,
    },
    features: {
      eyebrow: "ฟีเจอร์ของแพลตฟอร์ม",
      title: "เครื่องมือครบสำหรับการยุติข้อพิพาท",
      description:
        "เวิร์กโฟลว์ไกล่เกลี่ยด้วย AI ตั้งแต่รับเรื่องจนถึงข้อตกลงที่ลงนามและตรวจสอบได้",
      items: thaiPlatformFeatures,
    },
    timeline: {
      eyebrow: "ขั้นตอนการทำงาน",
      title: "จากข้อพิพาทสู่ข้อตกลงใน 8 ขั้นตอน",
      description: "เส้นทางที่ชัดเจน ช่วยให้ทุกฝ่ายเห็นสถานะและดำเนินการร่วมกันได้ตลอดกระบวนการ",
      items: thaiMediationSteps,
    },
    benefits: {
      eyebrow: "ประโยชน์",
      title: "ออกแบบเพื่อทุกฝ่ายในกระบวนการ",
      description:
        "สร้างผลลัพธ์ที่เป็นธรรมและรวดเร็วสำหรับลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ย",
      groups: thaiBenefitGroups,
    },
    stats: thaiStats,
    security: {
      eyebrow: "ความปลอดภัยและการกำกับดูแล",
      title: "ความน่าเชื่อถือระดับองค์กร",
      description:
        "ความปลอดภัยเป็นหัวใจของทุกกระบวนการไกล่เกลี่ย รองรับมาตรฐานที่หน่วยงานรัฐและองค์กรเจ้าหนี้คาดหวัง",
      auditNote: "โครงสร้างพื้นฐานพร้อมตรวจสอบและคำนึงถึง PDPA",
      items: thaiSecurityItems,
    },
    testimonials: {
      eyebrow: "เสียงจากผู้ใช้งาน",
      title: "ผลลัพธ์ที่ผู้คนไว้วางใจ",
      items: thaiTestimonials,
    },
    cta: {
      title: "เริ่มกระบวนการไกล่เกลี่ยดิจิทัลวันนี้",
      description:
        "ร่วมกับผู้ใช้งานจำนวนมากที่ยุติข้อพิพาทด้านหนี้ได้เร็วขึ้น เป็นธรรมขึ้น และไม่ต้องขึ้นศาล",
      primaryCta: "เริ่มไกล่เกลี่ย",
      secondaryCta: "ค้นหาผู้ไกล่เกลี่ย",
    },
    footer: {
      logoLabel: "ไกล่เกลี่ย",
      description:
        "แพลตฟอร์มไกล่เกลี่ยดิจิทัลด้วย AI ช่วยยุติข้อพิพาทด้านหนี้อย่างรวดเร็ว เป็นธรรม และปลอดภัยโดยไม่ต้องขึ้นศาล",
      columns: thaiFooterColumns,
      rights: "NT AI Digital Mediation Platform สงวนลิขสิทธิ์ @ 2026",
      tagline: "เพื่อการยุติข้อพิพาทที่เป็นธรรมกว่าเดิม",
    },
  },
};
