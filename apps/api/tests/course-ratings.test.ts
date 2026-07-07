import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COURSE_RATING_LOW_THRESHOLD,
  isLowCourseRating,
  isValidCourseRatingStars,
  mapRatingForAdmin,
  mapRatingForProvider,
} from "../src/lib/course-ratings.js";

describe("isValidCourseRatingStars", () => {
  it("accepts half-star steps from 1 to 5", () => {
    for (let half = 2; half <= 10; half += 1) {
      assert.equal(isValidCourseRatingStars(half / 2), true);
    }
  });

  it("rejects values outside range or not on half steps", () => {
    assert.equal(isValidCourseRatingStars(0.5), false);
    assert.equal(isValidCourseRatingStars(5.5), false);
    assert.equal(isValidCourseRatingStars(2.25), false);
    assert.equal(isValidCourseRatingStars(Number.NaN), false);
  });
});

describe("isLowCourseRating", () => {
  it("uses strict threshold below 2.5", () => {
    assert.equal(COURSE_RATING_LOW_THRESHOLD, 2.5);
    assert.equal(isLowCourseRating(2), true);
    assert.equal(isLowCourseRating(2.4), true);
    assert.equal(isLowCourseRating(2.5), false);
    assert.equal(isLowCourseRating(4), false);
  });
});

describe("rating visibility mapping", () => {
  const row = {
    id: "r1",
    course_id: "c1",
    campus_id: "campus",
    rater_id: "student",
    provider_id: "teacher",
    stars: 2,
    comment: "Commentaire interne admin",
    created_at: "2026-01-01T12:00:00.000Z",
  };

  it("never exposes comment to provider view", () => {
    const view = mapRatingForProvider(row, {
      subject: "Maths",
      scheduledAt: "2026-01-01T10:00:00.000Z",
      raterName: "Élève Dupont",
    });
    assert.equal(view.stars, 2);
    assert.equal(view.subject, "Maths");
    assert.equal("comment" in view, false);
  });

  it("includes comment for admin view", () => {
    const view = mapRatingForAdmin(row, "Élève Dupont");
    assert.equal(view.comment, "Commentaire interne admin");
    assert.equal(view.raterName, "Élève Dupont");
  });
});
