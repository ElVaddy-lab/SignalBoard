"use server";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}

export async function setLocale(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
