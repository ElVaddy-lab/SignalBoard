export const locales = ["en", "uk"] as const;
export type AppLocale = (typeof locales)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "signalboard-locale";

export const localeLabels: Record<AppLocale, string> = {
  en: "EN",
  uk: "UA",
};

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return Boolean(value && locales.includes(value as AppLocale));
}
