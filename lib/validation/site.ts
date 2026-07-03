import { z } from "zod";

export const siteInputSchema = z.object({
  siteCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(180),
  isActive: z.boolean().default(true),
});

export type SiteInput = z.infer<typeof siteInputSchema>;
