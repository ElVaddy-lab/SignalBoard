import type { Metadata } from "next";
import type { ReactNode } from "react";

import { TimezoneSync } from "@/features/preferences/components/timezone-sync";
import { getLocale } from "@/features/preferences/locale";
import { getTimezone } from "@/features/preferences/timezone";
import { getMessages } from "@/i18n/messages";
import { I18nProvider } from "@/i18n/provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "SignalBoard \u2014 Private project tracking",
  description: "A focused private workspace for projects, progress and deadlines.",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const timeZone = await getTimezone();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <I18nProvider locale={locale} messages={messages} timeZone={timeZone}>{children}</I18nProvider>
        <TimezoneSync />
      </body>
    </html>
  );
}
