import { z } from "zod";

export const createOrganizationBodySchema = z.object({
  name: z.string().trim().min(2).max(100),

  displayName: z.string().trim().min(2).max(100).optional(),

  city: z.string().trim().min(2).max(100).optional(),

  state: z.string().trim().min(2).max(100).optional(),
});

export type CreateOrganizationBody = z.infer<
  typeof createOrganizationBodySchema
>;
