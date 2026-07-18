"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

type I18nProviderProps = {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
  timeZone: string;
};

export function I18nProvider({ children, locale, messages, timeZone }: I18nProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
