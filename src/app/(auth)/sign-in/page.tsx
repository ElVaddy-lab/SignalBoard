import { redirect } from "next/navigation";

import { AuthScreen } from "@/features/auth/components/auth-screen";
import { getLocale } from "@/features/preferences/locale";
import { getMessages } from "@/i18n/messages";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (hasSupabasePublicEnv()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }
  const locale = await getLocale();
  return <AuthScreen locale={locale} messages={getMessages(locale)} mode="sign-in" />;
}
