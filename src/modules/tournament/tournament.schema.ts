import { z } from "zod";

export const createTournamentBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tournament name must be at least 2 characters.")
    .max(100, "Tournament name cannot exceed 100 characters."),

  city: z.string().trim().min(2).max(100).optional(),

  state: z.string().trim().min(2).max(100).optional(),

  logoUrl: z.string().trim().url().optional(),
});

export type CreateTournamentBody = z.infer<typeof createTournamentBodySchema>;
