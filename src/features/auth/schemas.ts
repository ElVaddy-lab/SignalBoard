import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  captchaToken: z.string().min(1),
});

export const signUpSchema = signInSchema;
