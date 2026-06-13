import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateAdminBudget,
  getPeriodBounds,
  getPeriodLabel,
} from "../src/lib/admin-budget.js";

describe("admin-budget", () => {
  it("agrège les montants par période et statut", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    const rows = [
      {
        id: "1",
        amount_gross: 100,
        commission_sasu: 10,
        taxes_urssaf: 5,
        net_payout: 85,
        status_stripe: "succeeded",
        status_urssaf: "pending",
        created_at: "2026-06-10T10:00:00.000Z",
        course_id: "c1",
        course: {
          campus: { id: "camp1", name: "Paris" },
        },
      },
      {
        id: "2",
        amount_gross: 50,
        commission_sasu: 5,
        taxes_urssaf: 2,
        net_payout: 43,
        status_stripe: "pending",
        status_urssaf: "pending",
        created_at: "2026-06-12T10:00:00.000Z",
        course_id: "c2",
        course: {
          campus: { id: "camp1", name: "Paris" },
        },
      },
      {
        id: "3",
        amount_gross: 200,
        commission_sasu: 20,
        taxes_urssaf: 10,
        net_payout: 170,
        status_stripe: "succeeded",
        status_urssaf: "declared",
        created_at: "2025-01-01T10:00:00.000Z",
        course_id: "c3",
        course: {
          campus: { id: "camp2", name: "Lille" },
        },
      },
    ];

    const result = aggregateAdminBudget(rows, "month", true, now);

    assert.equal(result.periodLabel, getPeriodLabel("month"));
    assert.equal(result.budgets.encaisseNet, 85);
    assert.equal(result.budgets.enAttenteBrut, 50);
    assert.equal(result.budgets.urssafToDeclareCount, 1);
    assert.equal(result.budgets.urssafToDeclare, 85);
    assert.equal(result.allTime.encaisseNet, 255);
    assert.equal(result.byStripeStatus.succeeded?.count, 1);
    assert.equal(result.byUrssafStatus.pending?.count, 2);
    assert.equal(result.transactionsTotal, 2);
    assert.equal(result.byCampus?.length, 1);
  });

  it("calcule les bornes de semaine", () => {
    const monday = new Date("2026-06-15T12:00:00.000Z");
    const { start, end } = getPeriodBounds("week", monday);
    assert.notEqual(start, null);
    assert.ok(end.getTime() > start!.getTime());
  });
});
