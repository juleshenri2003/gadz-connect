import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateTeacherFinancial,
  isInCurrentMonth,
  shouldUrssafBeDue,
} from "../src/lib/tutor-financial.js";

describe("shouldUrssafBeDue", () => {
  it("returns true for monthly periodicity", () => {
    assert.equal(shouldUrssafBeDue("monthly"), true);
  });

  it("returns true for quarterly in Jan/Apr/Jul/Oct", () => {
    assert.equal(
      shouldUrssafBeDue("quarterly"),
      [0, 3, 6, 9].includes(new Date().getMonth()),
    );
  });
});

describe("isInCurrentMonth", () => {
  it("matches dates in the same calendar month", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    assert.equal(isInCurrentMonth("2026-06-01T10:00:00Z", now), true);
    assert.equal(isInCurrentMonth("2026-05-31T23:59:59Z", now), false);
  });
});

describe("aggregateTeacherFinancial", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("aggregates succeeded and pending amounts for current month", () => {
    const summary = aggregateTeacherFinancial(
      [
        {
          course_id: "c1",
          amount_gross: 100,
          net_payout: 70,
          status_stripe: "succeeded",
          status_urssaf: "pending",
          created_at: "2026-06-10T10:00:00Z",
        },
        {
          course_id: "c2",
          amount_gross: 80,
          net_payout: 55,
          status_stripe: "pending",
          status_urssaf: "pending",
          created_at: "2026-06-12T10:00:00Z",
        },
        {
          course_id: "c3",
          amount_gross: 50,
          net_payout: 35,
          status_stripe: "succeeded",
          status_urssaf: "declared",
          created_at: "2026-05-01T10:00:00Z",
        },
      ],
      [
        { id: "c1", status: "completed", scheduled_at: "2026-06-09T10:00:00Z" },
        {
          id: "c2",
          status: "scheduled",
          scheduled_at: "2026-06-20T10:00:00Z",
        },
        { id: "c3", status: "completed", scheduled_at: "2026-05-01T10:00:00Z" },
      ],
      "monthly",
      now,
    );

    assert.equal(summary.month.encaisseBrut, 100);
    assert.equal(summary.month.encaisseNet, 70);
    assert.equal(summary.month.enAttenteBrut, 80);
    assert.equal(summary.month.enAttenteNet, 55);
    assert.equal(summary.month.coursTermines, 1);
    assert.equal(summary.allTime.encaisseNet, 105);
    assert.equal(summary.allTime.volumeBrut, 230);
    assert.equal(summary.forecast.count, 1);
    assert.equal(summary.forecast.net, 55);
    assert.equal(summary.urssaf.amountToDeclare, 70);
    assert.equal(summary.urssaf.undeclaredCount, 1);
    assert.equal(summary.urssaf.due, true);
  });

  it("returns zeroed forecast when no future scheduled courses", () => {
    const summary = aggregateTeacherFinancial(
      [
        {
          course_id: "c1",
          amount_gross: 40,
          net_payout: 28,
          status_stripe: "pending",
          status_urssaf: "pending",
          created_at: "2026-06-01T10:00:00Z",
        },
      ],
      [{ id: "c1", status: "completed", scheduled_at: "2026-06-01T10:00:00Z" }],
      "quarterly",
      now,
    );

    assert.equal(summary.forecast.count, 0);
    assert.equal(summary.forecast.net, 0);
  });
});
