import type { ReactNode } from "react";

import { DemoShell } from "@/features/demo/demo-shell";
import { getLocale } from "@/features/preferences/locale";
import { getMessages } from "@/i18n/messages";

export default async function DemoLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <DemoShell locale={locale} messages={getMessages(locale)}>
      {children}
    </DemoShell>
  );
}
