import { z } from "zod";

const nullableBoolean = z.union([z.boolean(), z.null()]);

export const manualFieldsSchema = z.object({
  overtimeCheck: nullableBoolean,
  assignmentCheck: nullableBoolean,
  payrollStatus: z
    .enum(["pending", "approved", "on_hold", "paid"])
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .transform((value) => value || null),
});

export type ManualFieldsInput = z.infer<typeof manualFieldsSchema>;
