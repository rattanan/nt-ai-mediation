# Case Progress Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a professional responsive Case Journey / Progress Tracker to the debtor mediation request detail page.

**Architecture:** Implement a reusable server-rendered React component that accepts the case row, status history, active appointment, and closing/payment details. The component maps existing `CaseStatus` values into the requested 12-step workflow and renders normal, repayment, closed, and failed states without introducing new database tables in this phase.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS, Lucide icons, existing Supabase-backed data helpers.

---

### Task 1: Reusable Tracker Component

**Files:**
- Create: `src/components/cases/case-progress-tracker.tsx`

- [x] **Step 1: Define workflow mapping**

Create a 12-step workflow array matching registration through case closed, with each step mapped to existing `CaseStatus` values.

- [x] **Step 2: Implement state calculation**

Use `completed`, `current`, `pending`, and `failed` states from the case status and current step index.

- [x] **Step 3: Render responsive UI**

Render desktop horizontal tracker, mobile vertical tracker, progress bar, current status card, next step card, timeline history, and summary card.

- [x] **Step 4: Render special states**

Render repayment progress when settlement has a payment plan, success banner when case is closed, and failed banner when mediation or creditor review fails.

### Task 2: Case Detail Integration

**Files:**
- Modify: `src/app/debtor/cases/[id]/page.tsx`

- [x] **Step 1: Import component**

Import `CaseProgressTracker` from `@/components/cases/case-progress-tracker`.

- [x] **Step 2: Place component at top**

Render the tracker immediately after success/error alerts and before the case detail grid.

- [x] **Step 3: Remove duplicate timeline sidebar**

Replace the old sidebar history card with a compact current status helper because the new tracker owns the full timeline.

### Task 3: Verification

**Files:**
- Test: TypeScript, ESLint, production build

- [x] **Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [x] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit 0.

- [x] **Step 3: Run build**

Run: `npm run build`

Expected: exit 0.
