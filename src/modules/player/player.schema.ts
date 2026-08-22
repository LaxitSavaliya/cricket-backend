import { z } from "zod";

import {
  BattingStyle,
  BowlingStyle,
  PlayerRole,
} from "../../generated/prisma/client.js";

export const createPlayerBodySchema = z.object({
  name: z.string().trim().min(2).max(100),

  displayName: z.string().trim().min(2).max(100).optional(),

  role: z.enum(PlayerRole),

  canKeepWickets: z.boolean().default(false),

  battingStyle: z.enum(BattingStyle).optional(),

  bowlingStyle: z.enum(BowlingStyle).optional(),

  city: z.string().trim().min(2).max(100).optional(),

  state: z.string().trim().min(2).max(100).optional(),

  birthDate: z.iso
    .date()
    .refine(
      (value) => {
        const today = new Date().toISOString().slice(0, 10);

        return value <= today;
      },
      {
        message: "Birth date cannot be in the future.",
      },
    )
    .optional(),
});

export type CreatePlayerBody = z.infer<typeof createPlayerBodySchema>;
