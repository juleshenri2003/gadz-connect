import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCourseFollowUpEligible } from "../src/lib/course-completion.js";

describe("course-completion eligibility", () => {
  it("treats awaiting_session_confirmation as follow-up eligible", () => {
    assert.equal(
      isCourseFollowUpEligible({
        status: "awaiting_session_confirmation",
        scheduled_at: "2026-07-10T10:00:00.000Z",
      }),
      true,
    );
  });

  it("treats completed as follow-up eligible", () => {
    assert.equal(
      isCourseFollowUpEligible({
        status: "completed",
        scheduled_at: "2026-07-10T10:00:00.000Z",
      }),
      true,
    );
  });

  it("rejects future scheduled courses", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    assert.equal(
      isCourseFollowUpEligible({
        status: "scheduled",
        scheduled_at: future,
      }),
      false,
    );
  });
});
