import assert from "node:assert/strict";
import test from "node:test";
import { googleCalendarEventId, isGoogleMeetEligible } from "../../src/lib/google/calendar-event.ts";

test("calendar event id is stable for appointment id", () => {
  const appointment = "b9de7c69-6a83-4a86-9f35-cdf2066cde55";
  assert.equal(googleCalendarEventId(appointment), googleCalendarEventId(appointment));
  assert.match(googleCalendarEventId(appointment), /^[a-v0-9]+$/);
});

test("only active online or hybrid appointments can create Meet", () => {
  assert.equal(isGoogleMeetEligible("online", "confirmed"), true);
  assert.equal(isGoogleMeetEligible("hybrid", "pending_confirmation"), true);
  assert.equal(isGoogleMeetEligible("onsite", "confirmed"), false);
  assert.equal(isGoogleMeetEligible("online", "completed"), false);
  assert.equal(isGoogleMeetEligible("online", "cancelled"), false);
});

