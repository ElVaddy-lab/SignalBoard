"use server";

import { redirect } from "next/navigation";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import type { AuthActionState, AuthErrorCode } from "./action-state";
import { signInSchema, signUpSchema } from "./schemas";

function value(formData: FormData, name: string): string {
  const candidate = formData.get(name);
  return typeof candidate === "string" ? candidate : "";
}

function validate(
  schema: typeof signInSchema,
  formData: FormData,
): { data: { email: string; password: string; captchaToken: string } } | { errorCode: AuthErrorCode } {
  const raw = {
    email: value(formData, "email"),
    password: value(formData, "password"),
    captchaToken: value(formData, "captchaToken"),
  };

  if (!raw.captchaToken) return { errorCode: "captcha" };
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { data: parsed.data };
  if (parsed.error.issues.some((issue) => issue.path[0] === "password")) {
    return { errorCode: "password" };
  }
  return { errorCode: "credentials" };
}

export async function signInAction(previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const attemptId = previous.attemptId + 1;
  if (!hasSupabasePublicEnv()) return { errorCode: "unconfigured", attemptId };
  const parsed = validate(signInSchema, formData);
  if ("errorCode" in parsed) return { ...parsed, attemptId };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { captchaToken: parsed.data.captchaToken },
  });

  if (error) return { errorCode: "signInFailed", attemptId };
  redirect("/dashboard");
}

export async function signUpAction(previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const attemptId = previous.attemptId + 1;
  if (!hasSupabasePublicEnv()) return { errorCode: "unconfigured", attemptId };
  const parsed = validate(signUpSchema, formData);
  if ("errorCode" in parsed) return { ...parsed, attemptId };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { captchaToken: parsed.data.captchaToken },
  });

  if (error || !data.session) return { errorCode: "signUpFailed", attemptId };
  redirect("/dashboard");
}

export async function signOutAction(): Promise<never> {
  if (hasSupabasePublicEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}
