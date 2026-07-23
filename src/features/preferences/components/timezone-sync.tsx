"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { isValidIanaTimezone } from "@/features/preferences/timezone-contract";

const TIMEZONE_COOKIE = "signalboard-timezone";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readTimezoneCookie(): string | undefined {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${TIMEZONE_COOKIE}=`))
    ?.slice(TIMEZONE_COOKIE.length + 1);
  if (!value) return undefined;

  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

export function TimezoneSync() {
  const router = useRouter();
  const synchronized = useRef(false);

  useEffect(() => {
    if (synchronized.current) return;
    synchronized.current = true;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!isValidIanaTimezone(timezone)) return;

    const currentTimezone = readTimezoneCookie();
    if (isValidIanaTimezone(currentTimezone) && currentTimezone === timezone) return;

    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(timezone)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    if (readTimezoneCookie() === timezone) {
      router.refresh();
    }
  }, [router]);

  return null;
}
