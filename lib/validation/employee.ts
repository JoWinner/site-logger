import { z } from "zod";

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  employeeIdPin: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value.toUpperCase() : null)),
  tradeRole: nullableText(120),
  currentSiteId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => value || null),
  isActive: z.boolean().default(true),
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
