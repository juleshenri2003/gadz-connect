import { z } from "zod";
import {
  COURSE_RATING_LOW_THRESHOLD,
  COURSE_RATING_MAX,
  COURSE_RATING_MIN,
} from "@gadz-connect/types";

export {
  COURSE_RATING_LOW_THRESHOLD,
  COURSE_RATING_MAX,
  COURSE_RATING_MIN,
};

export function isValidCourseRatingStars(stars: number): boolean {
  if (!Number.isFinite(stars)) return false;
  if (stars < COURSE_RATING_MIN || stars > COURSE_RATING_MAX) return false;
  return Number.isInteger(stars * 2);
}

export function isLowCourseRating(stars: number): boolean {
  return stars < COURSE_RATING_LOW_THRESHOLD;
}

export function formatCourseRatingStars(stars: number): string {
  return stars.toLocaleString("fr-FR", {
    minimumFractionDigits: Number.isInteger(stars) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export const courseRatingCreateSchema = z.object({
  stars: z
    .number()
    .refine(isValidCourseRatingStars, {
      message: `Note entre ${COURSE_RATING_MIN} et ${COURSE_RATING_MAX} par demi-étoile`,
    }),
  comment: z.string().trim().max(2000).optional(),
});

export interface CourseRatingRow {
  id: string;
  course_id: string;
  campus_id: string;
  rater_id: string;
  provider_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface CourseRatingStudentView {
  stars: number;
  createdAt: string;
}

export interface CourseRatingProviderView {
  stars: number;
  createdAt: string;
  courseId: string;
  subject: string;
  scheduledAt: string | null;
  raterName: string;
}

export interface CourseRatingAdminView extends CourseRatingStudentView {
  comment: string | null;
  raterName: string;
}

export function mapRatingForProvider(
  row: CourseRatingRow,
  meta: {
    subject: string;
    scheduledAt: string | null;
    raterName: string;
  },
): CourseRatingProviderView {
  return {
    stars: Number(row.stars),
    createdAt: row.created_at,
    courseId: row.course_id,
    subject: meta.subject,
    scheduledAt: meta.scheduledAt,
    raterName: meta.raterName,
  };
}

export function mapRatingForAdmin(
  row: CourseRatingRow,
  raterName: string,
): CourseRatingAdminView {
  return {
    stars: Number(row.stars),
    createdAt: row.created_at,
    comment: row.comment,
    raterName,
  };
}
