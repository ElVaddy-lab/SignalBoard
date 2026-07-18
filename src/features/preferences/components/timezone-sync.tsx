"use client";

import { useEffect, useRef } from "react";

const TIMEZONE_COOKIE = "signalboard-timezone";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function TimezoneSync() {
  const synchronized = useRef(false);

  useEffect(() => {
    if (synchronized.current) return;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      synchronized.current = true;
      const encodedTimezone = encodeURIComponent(timezone);
      const currentCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${TIMEZONE_COOKIE}=`))
        ?.slice(TIMEZONE_COOKIE.length + 1);

      if (currentCookie !== encodedTimezone) {
        document.cookie = `${TIMEZONE_COOKIE}=${encodedTimezone}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
      }
    }
  }, []);

  return null;
}
