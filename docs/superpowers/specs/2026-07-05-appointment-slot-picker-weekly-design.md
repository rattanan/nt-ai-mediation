# Appointment Slot Picker Weekly Design

**Context**

The debtor appointment booking page currently renders all available slots as repeated day cards with many time buttons. As availability expands, the page becomes tall, visually noisy, and harder to scan on both desktop and mobile.

**Problem**

Users need to compare appointment options quickly, but the current presentation emphasizes raw volume over structure. The page should help users answer three questions with less effort:

1. Which week has openings?
2. Which day looks convenient?
3. Which exact slot should I book?

**Recommended Approach**

Replace the current "all day cards at once" layout with a weekly calendar-style picker:

- Show one week at a time.
- Group slots into seven weekday columns on desktop.
- Use compact slot buttons inside each day column.
- Keep a persistent summary of the currently selected slot.
- On mobile, switch to a day-tab view backed by the same grouped weekly data.

**Desktop Experience**

- Header row with week label and previous/next week controls.
- Seven columns for Monday through Sunday.
- Each column shows:
  - weekday label
  - date
  - compact stack of slot buttons
  - muted empty state when no slots exist for that day
- If a day has many slots, show only the first few by default and reveal the rest via "ดูเพิ่ม".
- Selected slot is highlighted clearly.
- A side or bottom summary panel shows:
  - selected date
  - selected time
  - meeting type
  - submit action

**Mobile Experience**

- Preserve the week navigation.
- Replace the 7-column grid with horizontally scrollable day tabs.
- Show slots only for the active day.
- Keep the selected-slot summary below the tab content.

**Data Handling**

- Reuse the existing `slots` prop passed into `SlotPicker`.
- Transform slots into week buckets derived from slot date.
- Default to the earliest week containing availability.
- Default selected slot to the first available slot in the active week.
- When switching weeks:
  - preserve selection if the selected slot is still visible
  - otherwise select the first available slot in the active week

**Interaction Rules**

- Hidden input continues to submit `slot_key`.
- Selecting a slot updates the summary immediately.
- Week navigation should be disabled when there is no previous/next availability week.
- "ดูเพิ่ม" is scoped to a single day only.

**Visual Direction**

- Match existing shadcn/Tailwind patterns in the project.
- Use a restrained NT yellow for selected and active states.
- Keep the calendar surface quiet and dense enough for operational use.
- Avoid large cards inside cards; the week should read as one framed tool surface.

**Error and Empty States**

- If there are no slots at all, keep the current empty state pattern.
- If a week has sparse availability, empty days should stay visible for orientation.

**Testing / Verification**

- Verify desktop readability with many slots across multiple days.
- Verify mobile tab flow and that long lists stay contained.
- Verify hidden input still submits the chosen `slot_key`.
- Verify selected state stays valid when changing weeks.
