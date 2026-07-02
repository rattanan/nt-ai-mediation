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
