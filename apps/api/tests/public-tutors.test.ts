import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computePublicCampusStats,
  filterPublicTutorRows,
} from "../src/lib/tutor-public-list.js";
import {
  assertNoInternalFields,
  toPublicTutorDto,
  toPublicTutorSlotDto,
} from "../src/lib/tutor-public-dto.js";
import type { TutorRowWithAvailability } from "../src/lib/tutor-query.js";
import {
  createRateLimiter,
  resetRateLimitStore,
} from "../src/middleware/rate-limit.js";

const sampleTutor: TutorRowWithAvailability = {
  id: "11111111-1111-1111-1111-111111111111",
  first_name: "Jean",
  last_name: "Dupont",
  role: "teacher",
  bio: "Professeur de mécanique avec " + "x".repeat(400),
  cv: "CV texte confidentiel",
  cv_pdf_path: "user/cv.pdf",
  hourly_rate: 35,
  subjects: ["Mécanique", "Maths"],
  account_status: "active",
  profile_setup_complete: true,
  stripe_connect_onboarding_complete: true,
  siret: "73282932000074",
  is_autoentrepreneur_verified: true,
  campus: { name: "Paris" },
  available_slot_count: 3,
  next_available_slot_at: "2026-06-25T10:00:00.000Z",
};

describe("toPublicTutorDto", () => {
  it("excludes internal fields from list DTO", () => {
    const dto = toPublicTutorDto(sampleTutor);
    assertNoInternalFields(dto as unknown as Record<string, unknown>);
    assert.equal(dto.has_cv_pdf, true);
    assert.equal(dto.first_name, "Jean");
    assert.ok(dto.bio && dto.bio.length <= 303);
    assert.equal(dto.bio?.endsWith("…"), true);
  });

  it("returns full bio on detail", () => {
    const dto = toPublicTutorDto(sampleTutor, { fullBio: true });
    assert.equal(dto.bio, sampleTutor.bio);
  });

  it("does not expose cv text or internal metadata", () => {
    const dto = toPublicTutorDto(sampleTutor, { fullBio: true });
    const keys = Object.keys(dto);
    assert.equal(keys.includes("cv"), false);
    assert.equal(keys.includes("account_status"), false);
    assert.equal(keys.includes("role"), false);
    assert.equal(keys.includes("siret"), false);
  });
});

describe("filterPublicTutorRows", () => {
  const tutors: TutorRowWithAvailability[] = [
    sampleTutor,
    {
      ...sampleTutor,
      id: "22222222-2222-2222-2222-222222222222",
      first_name: "Marie",
      last_name: "Curie",
      subjects: ["Physique"],
      available_slot_count: 0,
      hourly_rate: 25,
    },
  ];

  it("filters bookable tutors only", () => {
    const filtered = filterPublicTutorRows(tutors, { bookable: true });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.first_name, "Jean");
  });

  it("filters by subject and query", () => {
    const bySubject = filterPublicTutorRows(tutors, { subject: "Physique" });
    assert.equal(bySubject.length, 1);
    assert.equal(bySubject[0]?.last_name, "Curie");

    const byQuery = filterPublicTutorRows(tutors, { q: "marie" });
    assert.equal(byQuery.length, 1);
    assert.equal(byQuery[0]?.first_name, "Marie");
  });
});

describe("computePublicCampusStats", () => {
  it("returns counts, top subjects and average rate", () => {
    const stats = computePublicCampusStats([
      sampleTutor,
      {
        ...sampleTutor,
        id: "22222222-2222-2222-2222-222222222222",
        subjects: ["Maths", "Physique"],
        available_slot_count: 0,
        hourly_rate: 25,
      },
    ]);

    assert.equal(stats.tutor_count, 2);
    assert.equal(stats.bookable_count, 1);
    assert.deepEqual(stats.top_subjects.slice(0, 2), ["Maths", "Mécanique"]);
    assert.equal(stats.avg_hourly_rate, 30);
  });
});

describe("toPublicTutorSlotDto", () => {
  it("strips client and booking metadata", () => {
    const dto = toPublicTutorSlotDto({
      id: "22222222-2222-2222-2222-222222222222",
      starts_at: "2026-06-25T10:00:00.000Z",
      ends_at: "2026-06-25T11:00:00.000Z",
      booked: false,
      booked_by: "33333333-3333-3333-3333-333333333333",
      client: { first_name: "Alice", last_name: "Martin" },
    });

    assert.deepEqual(Object.keys(dto).sort(), ["ends_at", "id", "starts_at"]);
  });
});

describe("createRateLimiter", () => {
  it("returns 429 after max requests", () => {
    resetRateLimitStore();
    const limiter = createRateLimiter({
      windowMs: 60_000,
      maxRequests: 2,
      keyPrefix: "test",
    });

    const responses: number[] = [];
    const req = {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as Parameters<typeof limiter>[0];

    const run = () =>
      new Promise<void>((resolve) => {
        const res = {
          statusCode: 200,
          status(code: number) {
            this.statusCode = code;
            return this;
          },
          setHeader() {
            return this;
          },
          json() {
            responses.push(this.statusCode);
            resolve();
          },
        } as unknown as Parameters<typeof limiter>[1];

        limiter(req, res, () => {
          responses.push(200);
          resolve();
        });
      });

    return Promise.all([run(), run(), run()]).then(() => {
      assert.deepEqual(responses, [200, 200, 429]);
      resetRateLimitStore();
    });
  });
});
