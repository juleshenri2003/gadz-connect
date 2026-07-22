import { z } from "zod";

export const studentParentSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
});

export const studentParentsListSchema = z
  .array(studentParentSchema)
  .max(4, "Maximum 4 parents");

export type StudentParent = z.infer<typeof studentParentSchema>;

export function normalizeParents(value: unknown): StudentParent[] {
  const parsed = studentParentsListSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data;
}

export function parentDisplayName(parent: StudentParent): string {
  return `${parent.first_name} ${parent.last_name}`.trim();
}
