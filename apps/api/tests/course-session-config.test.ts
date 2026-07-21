import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeReplacementExpiresAt,
  confirmationReminderWindow,
  getConfirmationHoursBefore,
  getReplacementDeadlineHours,
  getSessionConfirmationDisputeDays,
  isPastConfirmationEscalation,
  isPastReplacementDeadline,
  isPastSessionConfirmationDispute,
  shouldSendPostSessionReminder,
} from "../src/lib/course-session-config.js";

describe("course-session-config", () => {
  it("uses default confirmation window of 24h", () => {
    assert.equal(getConfirmationHoursBefore(), 24);
  });

  it("uses default replacement deadline of 2h", () => {
    assert.equal(getReplacementDeadlineHours(), 2);
  });

  it("uses default session dispute window of 7 days", () => {
    assert.equal(getSessionConfirmationDisputeDays(), 7);
  });

  it("computes replacement expiry 2h before course", () => {
    const scheduledAt = "2026-07-10T14:00:00.000Z";
    const expires = computeReplacementExpiresAt(scheduledAt);
    assert.equal(
      new Date(expires).getTime(),
      new Date("2026-07-10T12:00:00.000Z").getTime(),
    );
  });

  it("builds a 2h-wide reminder window centered on 24h before", () => {
    const now = new Date("2026-07-09T12:00:00.000Z");
    const window = confirmationReminderWindow(now);
    assert.equal(
      new Date(window.from).getTime(),
      new Date("2026-07-10T11:00:00.000Z").getTime(),
    );
    assert.equal(
      new Date(window.to).getTime(),
      new Date("2026-07-10T13:00:00.000Z").getTime(),
    );
  });

  it("detects past confirmation escalation at J-2h", () => {
    const scheduledAt = "2026-07-10T14:00:00.000Z";
    assert.equal(
      isPastConfirmationEscalation(
        scheduledAt,
        new Date("2026-07-10T11:59:00.000Z"),
      ),
      false,
    );
    assert.equal(
      isPastConfirmationEscalation(
        scheduledAt,
        new Date("2026-07-10T12:00:00.000Z"),
      ),
      true,
    );
  });

  it("detects past replacement deadline", () => {
    const expires = "2026-07-10T12:00:00.000Z";
    assert.equal(
      isPastReplacementDeadline(expires, new Date("2026-07-10T11:00:00.000Z")),
      false,
    );
    assert.equal(
      isPastReplacementDeadline(expires, new Date("2026-07-10T12:00:00.000Z")),
      true,
    );
  });

  it("schedules post-session reminders at J+1 and J+3", () => {
    const scheduledAt = "2026-07-10T14:00:00.000Z";
    assert.equal(
      shouldSendPostSessionReminder(
        scheduledAt,
        0,
        new Date("2026-07-10T20:00:00.000Z"),
      ),
      false,
    );
    assert.equal(
      shouldSendPostSessionReminder(
        scheduledAt,
        0,
        new Date("2026-07-11T14:00:00.000Z"),
      ),
      true,
    );
    assert.equal(
      shouldSendPostSessionReminder(
        scheduledAt,
        1,
        new Date("2026-07-12T14:00:00.000Z"),
      ),
      false,
    );
    assert.equal(
      shouldSendPostSessionReminder(
        scheduledAt,
        1,
        new Date("2026-07-13T14:00:00.000Z"),
      ),
      true,
    );
  });

  it("opens dispute after 7 days", () => {
    const scheduledAt = "2026-07-10T14:00:00.000Z";
    assert.equal(
      isPastSessionConfirmationDispute(
        scheduledAt,
        new Date("2026-07-17T13:59:00.000Z"),
      ),
      false,
    );
    assert.equal(
      isPastSessionConfirmationDispute(
        scheduledAt,
        new Date("2026-07-17T14:00:00.000Z"),
      ),
      true,
    );
  });
});
