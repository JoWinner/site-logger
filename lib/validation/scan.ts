import { z } from "zod";

export const scanRequestSchema = z.object({
  rawToken: z.string().min(16).max(512),
  action: z.enum(["check_in", "check_out"]),
  deviceCapturedAt: z.iso.datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMetres: z.number().positive().max(100_000),
  locationCapturedAt: z.iso.datetime(),
  idempotencyKey: z.uuid(),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;
