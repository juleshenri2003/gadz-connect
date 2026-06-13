import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getWeekBounds,
  parseAdminCoursesQuery,
} from "../src/lib/admin-courses-query.js";

describe("parseAdminCoursesQuery", () => {
  it("parses search, status, preset and pagination", () => {
    const params = parseAdminCoursesQuery(
      {
        search: "  maths  ",
        status: "scheduled,awaiting_replacement",
        preset: "missing_summary",
        page: "2",
        limit: "25",
        sort: "scheduled_at_asc",
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-06-01T00:00:00.000Z",
        campus_id: "campus-1",
      },
      undefined,
    );

    assert.equal(params.search, "maths");
    assert.deepEqual(params.status, ["scheduled", "awaiting_replacement"]);
    assert.equal(params.preset, "missing_summary");
    assert.equal(params.page, 2);
    assert.equal(params.limit, 25);
    assert.equal(params.sort, "scheduled_at_asc");
    assert.equal(params.from, "2026-01-01T00:00:00.000Z");
    assert.equal(params.campus_id, "campus-1");
  });

  it("ignores campus_id when campus scope is enforced", () => {
    const params = parseAdminCoursesQuery(
      { campus_id: "other-campus" },
      "scoped-campus",
    );

    assert.equal(params.campusScopeId, "scoped-campus");
    assert.equal(params.campus_id, undefined);
  });
});

describe("getWeekBounds", () => {
  it("returns Monday to Sunday for a Wednesday reference", () => {
    const ref = new Date("2026-06-10T12:00:00.000Z");
    const { start, end } = getWeekBounds(ref);

    assert.equal(start.getDay(), 1);
    assert.equal(end.getDay(), 0);
    assert.ok(start.getTime() < end.getTime());
  });
});
