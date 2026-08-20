import { z } from "zod";

export const googleLoginBodySchema = z.object({
  idToken: z.string().trim().min(1, "Google ID token is required"),
});

export type GoogleLoginBody = z.infer<typeof googleLoginBodySchema>;
