"use client";

import { LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function setLocaleCookie(locale: AppLocale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}
