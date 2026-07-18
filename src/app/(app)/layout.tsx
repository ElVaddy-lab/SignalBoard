import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getLocale } from "@/features/preferences/locale";
import { getMessages } from "@/i18n/messages";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PrivateAppLayout({ children }: { children: ReactNode }) {
  if (!hasSupabasePublicEnv()) redirect("/sign-in");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const locale = await getLocale();
  return <AppShell email={user.email ?? "Account"} locale={locale} messages={getMessages(locale)}>{children}</AppShell>;
}
