import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const requestedTimezone = cookieStore.get("signalboard-timezone")?.value;
  let timeZone = "UTC";
  if (requestedTimezone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: requestedTimezone }).format();
      timeZone = requestedTimezone;
    } catch {
      timeZone = "UTC";
    }
  }

  return {
    locale,
    messages: getMessages(locale),
    timeZone,
  };
});
