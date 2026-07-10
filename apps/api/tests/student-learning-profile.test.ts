import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isTrialSlotDurationValid,
  slotDurationHours,
  studentLearningProfileSchema,
  TRIAL_MAX_DURATION_HOURS,
} from "../src/lib/student-learning-profile.js";

describe("studentLearningProfileSchema", () => {
  const valid = {
    classYear: "GI2",
    studyProgram: "Mécanique",
    strongPoints: "Bon en maths et en physique appliquée.",
    difficulties: "Organisation du travail en période d'examens.",
    learningFlags: ["hpi"],
    tutoringGoals: "Reprendre confiance et structurer ma méthode de révision.",
  };

  it("accepts a complete profile", () => {
    const parsed = studentLearningProfileSchema.safeParse(valid);
    assert.equal(parsed.success, true);
  });

  it("requires details when autre is selected", () => {
    const parsed = studentLearningProfileSchema.safeParse({
      ...valid,
      learningFlags: ["autre"],
      learningFlagsOther: "",
    });
    assert.equal(parsed.success, false);
  });
});

describe("trial slot duration", () => {
  it("allows slots up to one hour", () => {
    const start = "2026-07-10T10:00:00.000Z";
    const end = "2026-07-10T11:00:00.000Z";
    assert.equal(slotDurationHours(start, end), 1);
    assert.equal(isTrialSlotDurationValid(start, end), true);
  });

  it("rejects slots longer than one hour", () => {
    const start = "2026-07-10T10:00:00.000Z";
    const end = "2026-07-10T11:30:00.000Z";
    assert.equal(isTrialSlotDurationValid(start, end), false);
    assert.equal(TRIAL_MAX_DURATION_HOURS, 1);
  });
});
