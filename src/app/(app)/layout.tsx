import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getAuthenticatedClaims } from "@/features/auth/server-session";
import { getLocale } from "@/features/preferences/locale";
import { getMessages } from "@/i18n/messages";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PrivateAppLayout({ children }: { children: ReactNode }) {
  if (!hasSupabasePublicEnv()) redirect("/sign-in");

  const claims = await getAuthenticatedClaims();
  if (!claims) redirect("/sign-in");

  const supabase = await createClient();
  const { data: demoProject, error: demoError } = await supabase
    .from("projects")
    .select("id")
    .not("sample_key", "is", null)
    .limit(1)
    .maybeSingle();

  if (demoError) throw new Error("We couldn’t load your workspace preferences.");

  const locale = await getLocale();
  return <AppShell email={claims.email ?? "Account"} initialDemoEnabled={Boolean(demoProject)} locale={locale} messages={getMessages(locale)}>{children}</AppShell>;
}
