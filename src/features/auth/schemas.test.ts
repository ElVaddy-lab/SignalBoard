import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "@/features/auth/schemas";

const validCredentials = {
  email: "alex@example.com",
  password: "signalboard-password",
  captchaToken: "turnstile-token",
};

describe("password authentication contracts", () => {
  it("accepts a complete protected sign-in payload", () => {
    expect(signInSchema.safeParse(validCredentials).success).toBe(true);
  });

  it("requires a CAPTCHA token for both password endpoints", () => {
    const withoutCaptcha = { ...validCredentials, captchaToken: "" };
    expect(signInSchema.safeParse(withoutCaptcha).success).toBe(false);
    expect(signUpSchema.safeParse(withoutCaptcha).success).toBe(false);
  });

  it("requires an email address and an eight-character password", () => {
    expect(signUpSchema.safeParse({ ...validCredentials, email: "invalid" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validCredentials, password: "short" }).success).toBe(false);
  });
});
