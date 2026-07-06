# Appointment Slot Picker Weekly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the debtor appointment slot list with a weekly calendar-style picker that is easier to scan and uses less vertical space.

**Architecture:** Keep the existing appointment-booking data flow and form submission intact, but refactor the `SlotPicker` client component to derive weekly buckets from the existing slot list and render separate desktop/mobile views from the same grouped state. No API or server action changes are required.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, shadcn/ui, lucide-react

---

### Task 1: Refactor SlotPicker data model for week/day grouping

**Files:**
- Modify: `src/components/appointments/slot-picker.tsx`

- [ ] Add helper logic inside `SlotPicker` to:
  - derive normalized week keys from `slot.date`
  - group slots by week, then by day
  - sort weeks and daily slots chronologically
  - track `activeWeekKey`, `activeMobileDay`, and per-day expanded state
- [ ] Keep `selectedKey` as the submitted value and ensure it re-syncs when week changes.

### Task 2: Build weekly desktop calendar layout

**Files:**
- Modify: `src/components/appointments/slot-picker.tsx`

- [ ] Add a compact week navigation header with previous/next controls and a readable Thai week label.
- [ ] Render one unified weekly surface with seven day columns on desktop.
- [ ] Render compact slot buttons inside each day column.
- [ ] Limit initially visible slots per day and add a "ดูเพิ่ม" toggle for overflow.
- [ ] Show muted empty-day placeholders instead of removing empty days.

### Task 3: Build mobile day-tab variant

**Files:**
- Modify: `src/components/appointments/slot-picker.tsx`

- [ ] Add horizontally scrollable day tabs for the active week.
- [ ] Render only the active day's slots on mobile.
- [ ] Preserve the same selected state and overflow behavior as desktop where practical.

### Task 4: Add selected-slot summary panel

**Files:**
- Modify: `src/components/appointments/slot-picker.tsx`

- [ ] Add a summary area that displays:
  - selected date
  - selected time
  - meeting type
- [ ] Keep the submit button anchored with the summary so the final action is obvious.
- [ ] Ensure the form still submits `slot_key` via hidden input.

### Task 5: Verify behavior and styling

**Files:**
- Modify: `src/components/appointments/slot-picker.tsx` if needed

- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Sanity check:
  - empty state still renders when `slots.length === 0`
  - earliest available week is selected by default
  - selection stays valid when switching weeks
  - mobile and desktop layouts compile cleanly
