import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string()
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(z.unknown()).default({}),
    correlationId: z.string().min(1)
  })
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
